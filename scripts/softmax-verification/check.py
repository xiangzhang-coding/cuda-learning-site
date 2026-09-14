# SPDX-License-Identifier: Apache-2.0
"""LAB15 external harness. Reports are unreviewed observations, never automatic evidence."""
import argparse
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import statistics
import subprocess
import sys
import time

# Explicit script-local imports also work under python -I.
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from contract import ATOL, RTOL, ROW_SUM_ATOL, reference_row, verify_rows

ROOT = HERE.parents[1]
SHAPES = ((1, 1), (3, 31), (7, 32), (5, 33), (17, 257), (257, 1003), (512, 2048))


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def environment(compiler_only=False):
    # Reuse the exact reviewed full/compiler lock and gates, without importing GPU libraries.
    spec = importlib.util.spec_from_file_location('lab15_environment', ROOT / 'examples/ex23-triton-vector-add/ex23.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    result = module.check_environment(compiler_only=compiler_only)
    result['lockSha256'] = digest(module.ROOT / result['lock'])
    return result, module


def fixture(torch, rows, width):
    """Binary-exact FP32 inputs: equal, strongly shifted, peaked and mixed rows."""
    columns = torch.arange(width, dtype=torch.float32)
    patterns = torch.stack((
        torch.full((width,), 1000.0),
        -1000.0 + (columns % 17) * 0.25,
        torch.where(columns == width - 1, 80.0, -80.0),
        ((columns * 7) % 37 - 18) * 0.5,
    ))
    return patterns[torch.arange(rows) % 4].contiguous()


def oracle(torch, cpu):
    # Independent scalar math.exp + math.fsum for every distinct stored row.
    unique = {tuple(row) for row in cpu.tolist()}
    references = {row: reference_row(row) for row in unique}
    return [references[tuple(row)] for row in cpu.tolist()]


def validate_tensor(torch, x):
    if x.ndim != 2 or x.dtype != torch.float32 or not x.is_contiguous() or x.requires_grad:
        raise ValueError('contiguous rank-2 FP32 forward-only input required')
    rows, width = x.shape
    if not 1 <= rows <= 4096 or not 1 <= width <= 2048:
        raise ValueError('shape outside 1..4096 rows and 1..2048 columns')
    if not torch.isfinite(x).all().item():
        raise ValueError('finite logits required; no semantic attention mask')


def compile_cases(report, output, warps):
    import triton
    from triton.backends.compiler import GPUTarget
    from triton.compiler import ASTSource
    from kernel import normalize_rows
    for width in sorted({width for _, width in SHAPES}):
        tile = triton.next_power_of_2(width)
        compiled = triton.compile(ASTSource(normalize_rows,
            signature={'source': '*fp32', 'destination': '*fp32', 'WIDTH': 'constexpr', 'TILE': 'constexpr'},
            constexprs={'WIDTH': width, 'TILE': tile}),
            target=GPUTarget('cuda', 80, 32), options={'num_warps': warps})
        hashes = {}
        for stage in ('ttir', 'ttgir', 'llir', 'ptx', 'cubin'):
            value = compiled.asm[stage]
            if not value or (stage == 'ptx' and '.target sm_80' not in value):
                raise ValueError('missing or incorrect compiler artifact')
            artifact = output / f'width-{width}.{stage}'
            artifact.write_bytes(value if isinstance(value, bytes) else value.encode())
            hashes[stage] = digest(artifact)
        report['cases'].append({'width': width, 'tile': tile, 'numWarps': warps, 'artifacts': hashes})


def cpu_cases(report):
    import torch
    for shape in SHAPES:
        cpu = fixture(torch, *shape)
        validate_tensor(torch, cpu)
        expected = oracle(torch, cpu)
        result = verify_rows(torch.softmax(cpu.double(), dim=1).tolist(), expected)
        report['cases'].append({'shape': shape, 'cpuOracleCheck': result})


def gpu_cases(report, output, warps, benchmark, env_module):
    import torch
    import triton
    from triton.testing import do_bench
    from kernel import normalize_rows
    if torch.version.hip is not None or not torch.cuda.is_available() or torch.cuda.device_count() != 1:
        raise RuntimeError('exactly one visible NVIDIA CUDA device required')
    torch.cuda.set_device(0)
    prop = torch.cuda.get_device_properties(0)
    if (prop.major, prop.minor) < (8, 0) or prop.total_memory < 8_000_000_000:
        raise RuntimeError('CC >= 8.0 and >= 8 GB required')
    free, _ = torch.cuda.mem_get_info()
    if free < 2_000_000_000:
        raise RuntimeError('at least 2 GB free required, including benchmark cache headroom')
    driver = subprocess.check_output(['nvidia-smi', '--query-gpu=driver_version', '--format=csv,noheader'], text=True).splitlines()
    if not driver or any(tuple(map(int, line.strip().split('.'))) < (580, 65, 6) for line in driver):
        raise RuntimeError('driver >= 580.65.06 required')
    report['gpu'] = {'name': prop.name, 'uuid': str(prop.uuid), 'computeCapability': f'{prop.major}.{prop.minor}',
                     'totalMemoryBytes': prop.total_memory, 'freeMemoryBytesBefore': free, 'visibleCount': 1,
                     'driverVersions': driver, 'torchCuda': torch.version.cuda,
                     'ptxas': env_module.tool_record(prop.major * 10 + prop.minor)}
    # One provider-neutral scope: input already on device, preallocated output, no gradients.
    report['measurement'] = {'scope': 'preallocated-output forward; current-stream device events; no transfer/allocation/validation',
        'tuning': 'disabled; numWarps is a declared candidate, not a selected winner', 'numWarps': warps,
        'jit': 'fresh harness cache; warmup compile call separately recorded', 'warmupCalls': 20,
        'doBenchWarmupMs': 25, 'doBenchRepMs': 100, 'returnMode': 'all', 'rounds': 3,
        'cachePolicy': 'Triton do_bench clears its benchmark cache before each measured call; not a DRAM counter',
        'profiler': 'none', 'graphs': False}
    prepared = []
    with torch.no_grad():
        for rows, width in SHAPES:
            report['phase'] = f'correctness-{rows}x{width}'
            cpu = fixture(torch, rows, width)
            validate_tensor(torch, cpu)
            expected = oracle(torch, cpu)
            x = cpu.cuda()
            guard = torch.full((rows * width + 2048,), float('nan'), device='cuda', dtype=torch.float32)
            y = guard[:rows * width].view(rows, width)
            tile = triton.next_power_of_2(width)
            torch.cuda.synchronize()
            start = time.perf_counter()
            compiled = normalize_rows.warmup(x, y, WIDTH=width, TILE=tile, grid=(rows,), num_warps=warps)
            compile_seconds = time.perf_counter() - start
            normalize_rows[(rows,)](x, y, WIDTH=width, TILE=tile, num_warps=warps)
            report['gpuExecuted'] = True
            torch.cuda.synchronize()
            result = verify_rows(y.cpu().tolist(), expected)
            if not torch.isnan(guard[rows * width:]).all().item():
                raise ValueError('tail write guard changed')
            if not torch.equal(x.cpu(), cpu):
                raise ValueError('input changed')
            native = torch.empty_like(x)
            torch.softmax(x, dim=1, out=native)
            torch.cuda.synchronize()
            native_result = verify_rows(native.cpu().tolist(), expected)
            case = {'shape': [rows, width], 'dtype': 'float32', 'tile': tile, 'numWarps': warps,
                    'compileWallSeconds': compile_seconds, 'correctness': {'triton': result, 'torch': native_result},
                    'tailGuardUnchanged': True, 'logicalFusedBytes': 8 * rows * width,
                    'logicalMaterializedBytes': 4 * (8 * rows * width + 4 * rows),
                    'trafficInterpretation': 'analytical element ledger; not observed DRAM bytes', 'rounds': []}
            ptx = output / f'width-{width}-runtime.ptx'
            ptx.write_text(compiled.asm['ptx'])
            case['ptxSha256'] = digest(ptx)
            report['cases'].append(case)
            prepared.append((x, y, native, case))
        # Every correctness case passes before any timing is collected.
        if benchmark:
            for x, y, native, case in prepared:
                rows, width = case['shape']
                tile = case['tile']
                providers = {
                    'triton': lambda: normalize_rows[(rows,)](x, y, WIDTH=width, TILE=tile, num_warps=warps),
                    'torch': lambda: torch.softmax(x, dim=1, out=native),
                }
                for fn in providers.values():
                    for _ in range(20):
                        fn()
                torch.cuda.synchronize()
                for round_index in range(3):
                    order = ['triton', 'torch'] if round_index % 2 == 0 else ['torch', 'triton']
                    record = {'order': order, 'providers': {}}
                    for name in order:
                        report['phase'] = f'benchmark-{rows}x{width}-{round_index}-{name}'
                        samples = do_bench(providers[name], warmup=25, rep=100, return_mode='all')
                        if not samples or any(not math.isfinite(s) or s <= 0 for s in samples):
                            raise ValueError('nonpositive or nonfinite event samples')
                        record['providers'][name] = {'rawMilliseconds': samples,
                            'medianMilliseconds': statistics.median(samples),
                            'minMilliseconds': min(samples), 'maxMilliseconds': max(samples)}
                    case['rounds'].append(record)
                expected = oracle(torch, x.cpu())
                verify_rows(y.cpu().tolist(), expected)
                verify_rows(native.cpu().tolist(), expected)
    # Loaded library identities are kept locally for audit; never auto-published.
    mappings = {line.split()[-1] for line in Path('/proc/self/maps').read_text().splitlines()
                if '.so' in line and line.split()[-1].startswith('/')}
    report['loadedLibraries'] = [{'path': name, 'sha256': digest(Path(name))}
                                 for name in sorted(mappings) if Path(name).is_file()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['cpu', 'compile', 'verify', 'benchmark'], required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--warps', type=int, choices=[4, 8], default=4)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    report = {'subject': 'LAB15', 'mode': args.mode, 'result': 'fail', 'phase': 'environment',
              'gpuExecuted': False, 'cases': [], 'evidenceStatus': 'unreviewed local artifact; no automatic Evidence Status',
              'tolerances': {'absolute': ATOL, 'relative': RTOL, 'rowSumAbsolute': ROW_SUM_ATOL},
              'sourceHashes': {file.name: digest(file) for file in sorted(HERE.glob('*.py'))},
              'manualManifestRequired': ['OS release', 'GPU clocks/power policy and competing load',
                  'source commit and dirty diff', 'driver/toolchain setup', 'all stage commands and exit codes',
                  'Reference Environment identity or absence', 'retention/rejection decision']}
    try:
        report['environment'], env_module = environment(compiler_only=args.mode == 'compile')
        if args.mode == 'cpu':
            cpu_cases(report)
        else:
            import triton
            # Gate forbids inherited overrides; a fresh owned cache is intentionally installed here.
            triton.knobs.cache.dir = str(args.output.resolve() / 'jit-cache')
            report['phase'] = args.mode
            if args.mode == 'compile':
                report['ptxas'] = env_module.tool_record(80)
                compile_cases(report, args.output, args.warps)
            else:
                gpu_cases(report, args.output, args.warps, args.mode == 'benchmark', env_module)
        report['result'] = 'pass'
        report['phase'] = 'complete'
    except Exception as error:
        report['error'] = {'type': type(error).__name__, 'message': str(error)}
    finally:
        (args.output / 'report.json').write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'subject': 'LAB15', 'mode': args.mode, 'result': report['result'],
                      'gpuExecuted': report['gpuExecuted'], 'phase': report['phase']}))
    return 0 if report['result'] == 'pass' else 1


if __name__ == '__main__':
    raise SystemExit(main())
