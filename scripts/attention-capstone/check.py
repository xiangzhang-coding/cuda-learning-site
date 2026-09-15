# SPDX-License-Identifier: Apache-2.0
"""T08 phase-separated evidence collection; local success grants no Evidence Status."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import warnings

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
from contract import SHAPES, BM, BN, WARPS, STAGES, reference, verify, traffic, record_samples


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def environment(compiler_only):
    spec = importlib.util.spec_from_file_location('ex23_environment', ROOT/'examples/ex23-triton-vector-add/ex23.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    record = module.check_environment(compiler_only)
    record['lockSha256'] = digest(module.ROOT/record['lock'])
    if os.environ.get('CUDA_LAUNCH_BLOCKING', '0') != '0':
        raise RuntimeError('remove CUDA_LAUNCH_BLOCKING for evidence collection')
    return record, module


def fixture(torch, shape, kind):
    generator = torch.Generator().manual_seed(50)
    values = [(torch.rand(shape, generator=generator)*2-1).half() for _ in range(3)]
    if kind == 'uniform':
        values[0].zero_()
    elif kind == 'extreme':
        values[0].fill_(4)
        values[1].fill_(-4)
        values[1][..., -1, :] = 4
    return values


def expected_heads(values, causal):
    b, h, _, _ = values[0].shape
    return [reference(*(x[bi, hi].tolist() for x in values), causal=causal)
            for bi in range(b) for hi in range(h)]


def compare_tensor(actual, expected, prototype, strict=False):
    if actual.shape != prototype.shape or actual.dtype != prototype.dtype or actual.device != prototype.device:
        raise ValueError('output shape, dtype or device mismatch')
    heads = actual.detach().cpu().flatten(0, 1).tolist()
    if len(heads) != len(expected):
        raise ValueError('head count changed')
    return [verify(a, e, 1e-10, 1e-10) if strict else verify(a, e) for a, e in zip(heads, expected)]


def cpu(report):
    import torch
    from torch.nn.attention import sdpa_kernel, SDPBackend
    for shape in SHAPES:
        for kind in ('mixed', 'uniform', 'extreme'):
            values = fixture(torch, shape, kind)
            for causal in (False, True):
                expected = expected_heads(values, causal)
                with sdpa_kernel(backends=[SDPBackend.MATH]):
                    actual = torch.nn.functional.scaled_dot_product_attention(
                        *(x.double() for x in values), dropout_p=0.0, is_causal=causal, scale=shape[-1]**-0.5)
                report['cases'].append({'shape': shape, 'fixture': kind, 'causal': causal,
                                        'cpuFrameworkOutput': compare_tensor(actual, expected, values[0].double(), strict=True)})
    if torch.cuda.is_initialized():
        raise RuntimeError('CPU checks initialized CUDA')


def compile_all(report, output, module):
    import triton
    from triton.backends.compiler import GPUTarget
    from triton.compiler import ASTSource
    from kernel import attention_forward
    report['ptxas'] = module.tool_record(80)
    for n in (1, 17, 33, 65, 128):
        for d in (16, 32, 64):
            for causal in (False, True):
                constants = {'N': n, 'D': d, 'CAUSAL': causal, 'BM': BM, 'BN': BN}
                signature = {**dict.fromkeys(('Q', 'K', 'V', 'O'), '*fp16'),
                             **dict.fromkeys(constants, 'constexpr')}
                compiled = triton.compile(ASTSource(attention_forward, signature=signature, constexprs=constants),
                                          target=GPUTarget('cuda', 80, 32),
                                          options={'num_warps': WARPS, 'num_stages': STAGES})
                artifacts = {}
                for stage in ('ttir', 'ttgir', 'llir', 'ptx', 'cubin'):
                    data = compiled.asm[stage]
                    if not data or (stage == 'ptx' and '.target sm_80' not in data):
                        raise ValueError('missing or wrong-target artifact')
                    path = output/f'{n}-{d}-{causal}.{stage}'
                    path.write_bytes(data if isinstance(data, bytes) else data.encode())
                    artifacts[stage] = digest(path)
                report['cases'].append({'constants': constants, 'artifacts': artifacts})


def rejection_cases(torch, values, kernel_module):
    from unittest.mock import patch
    q, k, v = values
    cases = {
        'gradient-q': (q.detach().requires_grad_(), k, v, False),
        'gradient-k': (q, k.detach().requires_grad_(), v, False),
        'noncontiguous': (q.transpose(-1, -2).contiguous().transpose(-1, -2), k, v, False),
        'unequal-shape': (q, k[..., :-1, :], v, False),
        'dtype': (q.float(), k, v, False),
        'cpu-device': (q, k.cpu(), v, False),
        'nan': (torch.full_like(q, float('nan')), k, v, False),
        'inf': (q, k, torch.full_like(v, float('inf')), False),
        'magnitude': (torch.full_like(q, 5), k, v, False),
        'causal-type': (q, k, v, 'true'),
        'empty': (q[..., :0, :], k, v, False),
        'head-dimension': (q[..., :8], k, v, False),
    }
    class ForbiddenLaunch:
        def __getitem__(self, grid):
            raise AssertionError('invalid input reached kernel launch')
    outcomes = {}
    with patch.object(kernel_module, 'attention_forward', ForbiddenLaunch()):
        for name, args in cases.items():
            try:
                kernel_module.attention(*args)
            except ValueError as error:
                outcomes[name] = str(error)
            else:
                raise ValueError(f'adapter accepted {name}')
    return outcomes


def gpu(report, module, benchmark):
    import torch
    from triton.testing import do_bench
    from torch.nn.attention import sdpa_kernel, SDPBackend
    import kernel as kernel_module
    from kernel import attention, launch
    if torch.version.hip is not None or not torch.cuda.is_available() or torch.cuda.device_count() != 1:
        raise RuntimeError('exactly one visible NVIDIA GPU required')
    torch.cuda.set_device(0)
    prop = torch.cuda.get_device_properties(0)
    free, _ = torch.cuda.mem_get_info()
    if (prop.major, prop.minor) < (8, 0) or prop.total_memory < 8_000_000_000 or free < 2_000_000_000:
        raise RuntimeError('CC >= 8.0, >=8 GB total, >=2 GB free required')
    drivers = subprocess.check_output(['nvidia-smi', '--query-gpu=driver_version', '--format=csv,noheader'], text=True).splitlines()
    if not drivers or any(tuple(map(int, d.split('.'))) < (580, 65, 6) for d in drivers):
        raise RuntimeError('driver >=580.65.06 required')
    report['gpu'] = {'name': prop.name, 'uuid': str(prop.uuid), 'cc': [prop.major, prop.minor],
                     'smCount': prop.multi_processor_count, 'totalBytes': prop.total_memory,
                     'freeBytes': free, 'visibleCount': 1, 'drivers': drivers, 'torchCuda': torch.version.cuda,
                     'ptxas': module.tool_record(prop.major*10+prop.minor)}
    torch.backends.cuda.matmul.allow_fp16_reduced_precision_reduction = False
    report['gpuExecuted'] = True
    report['adapterRejections'] = rejection_cases(torch, [x.cuda() for x in fixture(torch, (1, 1, 17, 32), 'mixed')], kernel_module)
    report['measurement'] = {'scope': 'resident-input forward including output allocation; validation excluded',
        'warmupCalls': 20, 'rounds': 3, 'warmupMs': 25, 'repMs': 100, 'returnMode': 'all',
        'cachePolicy': 'do_bench cache clearing; owned JIT cache', 'profiler': 'none',
        'graphs': False, 'reducedPrecisionReduction': False}
    prepared = []
    with torch.no_grad():
        for shape in SHAPES:
            for kind in ('mixed', 'uniform', 'extreme'):
                original = fixture(torch, shape, kind)
                values = [x.cuda() for x in original]
                b, h, n, d = shape
                for causal in (False, True):
                    expected = expected_heads(original, causal)
                    case = {'shape': shape, 'fixture': kind, 'causal': causal, 'trafficModel': traffic(n, d),
                            'backends': {}, 'rounds': []}
                    report['cases'].append(case)
                    report['gpuExecuted'] = True
                    case['adapterOutput'] = compare_tensor(attention(*values, causal), expected, values[0])
                    guard = torch.full((b*h*n*d+1024,), float('nan'), device='cuda', dtype=torch.float16)
                    out = guard[:b*h*n*d].view(shape)
                    launch(*values, out, causal)
                    case['guardedOutput'] = compare_tensor(out, expected, values[0])
                    if not torch.isnan(guard[b*h*n*d:]).all().item():
                        raise ValueError('tail guard changed')
                    if any(not torch.equal(x.cpu(), y) for x, y in zip(values, original)):
                        raise ValueError('input changed')
                    case['inputAndGuardUnchanged'] = True
                    def custom(values=values, causal=causal):
                        result = torch.empty_like(values[0])
                        return launch(*values, result, causal)
                    providers = {'custom': custom}
                    for backend in (SDPBackend.MATH, SDPBackend.FLASH_ATTENTION):
                        def native(backend=backend, values=values, causal=causal, d=d):
                            with sdpa_kernel(backends=[backend]):
                                return torch.nn.functional.scaled_dot_product_attention(
                                    *values, dropout_p=0.0, is_causal=causal, scale=d**-0.5)
                        with warnings.catch_warnings(record=True) as caught:
                            warnings.simplefilter('always')
                            try:
                                actual = native()
                                torch.cuda.synchronize()
                            except RuntimeError as error:
                                if backend == SDPBackend.MATH:
                                    raise
                                case['backends'][backend.name] = {'status': 'unavailable-or-failed', 'error': str(error),
                                    'warnings': [str(w.message) for w in caught]}
                                continue
                        case['backends'][backend.name] = {'status': 'output-checked',
                            'correctness': compare_tensor(actual, expected, values[0]), 'warnings': [str(w.message) for w in caught]}
                        providers[backend.name] = native
                    prepared.append((case, providers, expected, values[0]))
        # Every correctness case completes before any timing begins.
        if benchmark:
            for case, providers, expected, prototype in prepared:
                for fn in providers.values():
                    for _ in range(20): fn()
                torch.cuda.synchronize()
                for index in range(3):
                    order = list(providers) if index % 2 == 0 else list(reversed(providers))
                    samples = {}
                    case['rounds'].append({'order': order, 'providers': samples})
                    for name in order:
                        raw = do_bench(providers[name], warmup=25, rep=100, return_mode='all')
                        samples[name] = {}
                        record_samples(samples[name], raw)
                case['postTimingOutputs'] = {name: compare_tensor(fn(), expected, prototype) for name, fn in providers.items()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['cpu', 'compile', 'verify', 'benchmark'], required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    report = {'subject': 'T08', 'mode': args.mode, 'result': 'fail', 'gpuExecuted': False, 'cases': [],
        'evidenceStatus': 'unreviewed local artifact; no automatic Evidence Status',
        'sourceHashes': {p.name: digest(p) for p in sorted(HERE.glob('*.py'))},
        'manualManifestRequired': ['Reference Environment identity or absence', 'observer and UTC date',
            'OS release/kernel/glibc and host compiler', 'Toolkit and loaded component identities',
            'commit and dirty diff', 'commands/exits and raw report hashes', 'clocks/power/competing load',
            'profiler version, permissions, filters, replay, exact metrics/units', 'custody and per-case decision']}
    try:
        report['environment'], module = environment(args.mode == 'compile')
        if args.mode == 'cpu': cpu(report)
        else:
            import triton
            triton.knobs.cache.dir = str(args.output.resolve()/'jit-cache')
            if args.mode == 'compile': compile_all(report, args.output, module)
            else: gpu(report, module, args.mode == 'benchmark')
        report['result'] = 'pass'
    except Exception as error:
        report['error'] = {'type': type(error).__name__, 'message': str(error)}
    (args.output/'report.json').write_text(json.dumps(report, indent=2, allow_nan=False)+'\n')
    print(json.dumps({key: report[key] for key in ('subject', 'mode', 'result', 'gpuExecuted')}))
    return 0 if report['result'] == 'pass' else 1


if __name__ == '__main__':
    raise SystemExit(main())
