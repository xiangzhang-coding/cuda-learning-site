# SPDX-License-Identifier: Apache-2.0
"""CPU contract, explicit GPU-free compiler target, and separately gated GPU run."""
import argparse
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import platform
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
SIZES = (1, 255, 256, 257, 1003)
TILE = 256


def validate_size(count):
    if type(count) is not int or not 1 <= count <= 1_000_000:
        raise ValueError("count must be an integer in [1, 1000000]")
    return count


# [ex23-reference-start]
def inputs(count):
    validate_size(count)
    return ([((i % 29) - 14) * 0.25 for i in range(count)],
            [((i % 13) - 6) * 0.5 for i in range(count)])


def compare(actual, left, right):
    if len(actual) != len(left) or len(left) != len(right):
        raise ValueError("length mismatch")
    mismatches = [i for i, (got, a, b) in enumerate(zip(actual, left, right))
                  if not math.isfinite(got) or got != a + b]
    if mismatches:
        raise ValueError(f"mismatches={len(mismatches)}, first={mismatches[0]}")
# [ex23-reference-end]


def host_test():
    for size in SIZES:
        left, right = inputs(size)
        compare([a + b for a, b in zip(left, right)], left, right)
    left, right = inputs(1003)
    expected = {0: -6.5, 1: -5.75, 12: 2.5, 13: -3.25, 28: 1.5,
                29: -5.0, 255: 3.25, 256: 4.0, 1002: -2.0}
    for index, value in expected.items():
        if left[index] + right[index] != value:
            raise ValueError(f"literal reference mismatch at {index}")
    for bad in (float('nan'), float('inf'), -6.25):
        try:
            compare([bad], [-3.5], [-3.0])
        except ValueError:
            continue
        raise ValueError("comparison accepted an invalid output")
    print("CPU contract passed; no Triton compilation or GPU execution")


def check_environment(compiler_only=False):
    if platform.system() != 'Linux' or platform.machine() != 'x86_64':
        raise RuntimeError("EX23 requires native Linux x86_64")
    if platform.python_implementation() != 'CPython' or platform.python_version() != '3.14.7':
        raise RuntimeError("EX23 requires CPython 3.14.7")
    import sysconfig
    if sysconfig.get_config_var('Py_GIL_DISABLED'):
        raise RuntimeError("EX23 requires the ordinary GIL ABI")
    # Reject knobs that could replace the declared compiler, target, or execution mode.
    overrides = [key for key in os.environ if key.startswith('TRITON_') or key == 'PTXAS_OPTIONS']
    if overrides:
        raise RuntimeError("Remove Triton environment overrides: " + ', '.join(sorted(overrides)))
    lock = 'compiler.lock' if compiler_only else 'requirements.lock'
    pins = re.findall(r'^([a-z0-9-]+)==([^\s]+)', (ROOT / lock).read_text(), re.M)
    for name, version in pins:
        if importlib.metadata.version(name) != version:
            raise RuntimeError(f"package version mismatch: {name}")
    return {'python': platform.python_version(), 'system': platform.system(),
            'machine': platform.machine(), 'kernel': platform.release(),
            'libc': platform.libc_ver(), 'packages': dict(pins), 'lock': lock}


def tool_record(arch):
    from triton.backends.nvidia.compiler import get_ptxas
    tool = Path(get_ptxas(arch).path)
    version = subprocess.check_output([str(tool), '--version'], text=True)
    expected = '13.1.80' if arch >= 100 else '12.8.93'
    if f'V{expected}' not in version:
        raise RuntimeError('bundled ptxas version mismatch')
    return {'name': tool.name, 'version': expected,
            'sha256': hashlib.sha256(tool.read_bytes()).hexdigest()}


def save_report(name, report):
    directory = ROOT / 'build' / name
    directory.mkdir(parents=True, exist_ok=True)
    (directory / 'report.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return directory


def build():
    environment = check_environment(compiler_only=True)
    from kernel import add_tiles
    import triton
    from triton.backends.compiler import GPUTarget
    from triton.compiler import ASTSource
    with __import__('tempfile').TemporaryDirectory() as cache:
        # Fresh cache avoids accepting artifacts from an unrelated previous build.
        triton.knobs.cache.dir = cache
        compiled = triton.compile(ASTSource(add_tiles,
            signature={'left': '*fp32', 'right': '*fp32', 'result': '*fp32',
                       'count': 'i32', 'TILE': 'constexpr'}, constexprs={'TILE': TILE}),
            target=GPUTarget('cuda', 80, 32), options={'num_warps': 4})
        artifacts = {stage: compiled.asm[stage] for stage in ('ttir', 'ttgir', 'llir', 'ptx', 'cubin')}
    if any(not value for value in artifacts.values()) or '.target sm_80' not in artifacts['ptx']:
        raise RuntimeError('missing or wrong-target compiler artifact')
    report = {'environment': environment, 'target': 'sm_80', 'tile': TILE, 'numWarps': 4,
              'ptxas': tool_record(80), 'gpuExecuted': False, 'driverInitialized': False,
              'artifacts': {stage: hashlib.sha256(value if isinstance(value, bytes) else value.encode()).hexdigest()
                            for stage, value in artifacts.items()}}
    directory = save_report('compile', report)
    for stage, value in artifacts.items():
        (directory / f'ex23.{stage}').write_bytes(value if isinstance(value, bytes) else value.encode())


# [ex23-launch-start]
def run_case(torch, count):
    from kernel import add_tiles
    import triton
    left, right = inputs(count)
    a = torch.tensor(left, dtype=torch.float32, device='cuda:0')
    b = torch.tensor(right, dtype=torch.float32, device='cuda:0')
    # Padding is a write guard, not permission to omit either load mask.
    output = torch.full((count + TILE,), float('nan'), dtype=torch.float32, device='cuda:0')
    grid = (triton.cdiv(count, TILE),)
    add_tiles[grid](a, b, output, count, TILE=TILE, num_warps=4)
    torch.cuda.synchronize(0)
    actual = output.cpu().tolist()
    compare(actual[:count], left, right)
    if not all(math.isnan(value) for value in actual[count:]):
        raise ValueError('out-of-range store changed a guard value')
    return {'size': count, 'programs': grid[0], 'maskedPositions': grid[0] * TILE - count,
            'mismatches': 0, 'guardUnchanged': True}
# [ex23-launch-end]


def run(count):
    validate_size(count)
    environment = check_environment()
    import torch
    if torch.version.hip is not None or not torch.cuda.is_available():
        raise RuntimeError('NVIDIA CUDA device required')
    torch.cuda.set_device(0)
    properties = torch.cuda.get_device_properties(0)
    arch = properties.major * 10 + properties.minor
    if arch < 80 or properties.total_memory < 8_000_000_000:
        raise RuntimeError('CC >= 8.0 and at least 8 GB required')
    driver = subprocess.check_output(['nvidia-smi', '--query-gpu=driver_version', '--format=csv,noheader'], text=True).splitlines()
    if not driver or any(tuple(map(int, value.strip().split('.'))) < (580, 65, 6) for value in driver):
        raise RuntimeError('driver >= 580.65.06 required by this CUDA 13 host profile')
    results = [run_case(torch, size) for size in sorted(set((*SIZES, count)))]
    save_report('run', {'environment': environment, 'gpu': properties.name,
        'computeCapability': f'{properties.major}.{properties.minor}', 'deviceIndex': 0,
        'visibleGpuCount': torch.cuda.device_count(), 'memoryBytes': properties.total_memory,
        'driverVersions': driver, 'torchCuda': torch.version.cuda, 'ptxas': tool_record(arch),
        'gpuExecuted': True, 'results': results,
        'evidenceStatus': 'unreviewed local execution; not automatically Runtime-Verified',
        'measurement': 'correctness only; no timing or performance claim'})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['host-test', 'check-environment', 'build', 'run'])
    parser.add_argument('--size', type=int, default=1003)
    parser.add_argument('--compiler-only', action='store_true')
    args = parser.parse_args()
    if args.command == 'host-test':
        host_test()
    elif args.command == 'check-environment':
        print(json.dumps(check_environment(compiler_only=args.compiler_only), indent=2))
    elif args.command == 'build':
        build()
    else:
        run(args.size)
