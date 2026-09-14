# SPDX-License-Identifier: Apache-2.0
"""LAB16 external experiment. Local reports never automatically grant Evidence Status."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import random
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
from contract import ATOL, RTOL, reference_product, verify_product, selection_record, record_samples

SHAPES = ((1, 1, 1), (17, 19, 33), (32, 32, 32), (65, 97, 63), (128, 128, 128), (256, 192, 257))
# BM, BN, BK, num_warps, num_stages; small teaching search, no pruning.
CANDIDATES = ((32, 32, 32, 4, 2), (32, 64, 32, 4, 3), (64, 32, 32, 4, 3), (64, 64, 32, 4, 3))
WARMUP_CALLS = 20
BENCH_WARMUP_MS = 25
BENCH_REP_MS = 100
BENCH_RETURN_MODE = 'all'
ROUNDS = 3


def digest(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()


def environment(compiler_only):
    if os.environ.get('CUDA_LAUNCH_BLOCKING', '0') != '0':
        raise RuntimeError('Remove CUDA_LAUNCH_BLOCKING before evidence collection')
    spec = importlib.util.spec_from_file_location('lab16_environment', ROOT / 'examples/ex23-triton-vector-add/ex23.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    result = module.check_environment(compiler_only=compiler_only)
    result['lockSha256'] = digest(module.ROOT / result['lock'])
    return result, module


def configs(triton):
    return [triton.Config({'BM': m, 'BN': n, 'BK': k}, num_warps=w, num_stages=s)
            for m, n, k, w, s in CANDIDATES]


def config_record(config):
    return {**config.kwargs, 'num_warps': config.num_warps, 'num_stages': config.num_stages,
            'num_ctas': config.num_ctas}


def fixture(torch, m, n, k):
    rng = random.Random(1600 + k)
    a_rows = [[rng.uniform(-1, 1) for _ in range(k)] for _ in range(17)]
    b_columns = [[rng.uniform(-1, 1) for _ in range(k)] for _ in range(19)]
    # Cancellation and different magnitudes join the deterministic mixed fixture.
    a_rows[0] = [(-1 if i % 2 else 1) * 4 for i in range(k)]
    b_columns[0] = [0.25 for _ in range(k)]
    a = torch.tensor([a_rows[i % 17] for i in range(m)], dtype=torch.float16)
    b = torch.tensor([[b_columns[j % 19][i] for j in range(n)] for i in range(k)], dtype=torch.float16)
    return a, b


def validate_inputs(torch, a, b):
    if any(x.ndim != 2 or x.dtype != torch.float16 or not x.is_contiguous() or x.requires_grad for x in (a, b)):
        raise ValueError('contiguous rank-2 FP16 forward-only inputs required')
    if a.shape[1] != b.shape[0] or any(not 1 <= d <= 512 for x in (a, b) for d in x.shape):
        raise ValueError('compatible dimensions in 1..512 required')
    if any(not torch.isfinite(x).all().item() or x.abs().max().item() > 4 for x in (a, b)):
        raise ValueError('finite inputs with magnitude <= 4 required')


def cpu_cases(report):
    import torch
    for m, n, k in SHAPES:
        a, b = fixture(torch, m, n, k)
        validate_inputs(torch, a, b)
        expected = reference_product(a.tolist(), b.tolist())
        actual = torch.mm(a.double(), b.double()).tolist()
        # The oracle gate is much stricter than the FP16 device contract.
        if any(abs(x - y) > 1e-10 for row, target in zip(actual, expected) for x, y in zip(row, target)):
            raise ValueError('FP64 CPU oracle disagreement')
        report['cases'].append({'shapeMNK': [m, n, k], 'cpuOracleCheck': verify_product(actual, expected)})


def compile_cases(report, output, candidates):
    import triton
    from triton.backends.compiler import GPUTarget
    from triton.compiler import ASTSource
    from kernel import blocked_product
    for m, n, k in SHAPES:
        for index, config in enumerate(candidates):
            report['phase'] = f'compile-{m}x{n}x{k}-candidate-{index}'
            constants = {'M': m, 'N': n, 'K': k, **config.kwargs}
            signature = {'left': '*fp16', 'right': '*fp16', 'output': '*fp16',
                         **{key: 'constexpr' for key in constants}}
            start = time.perf_counter()
            compiled = triton.compile(ASTSource(blocked_product, signature=signature, constexprs=constants),
                                      target=GPUTarget('cuda', 80, 32),
                                      options={'num_warps': config.num_warps, 'num_stages': config.num_stages})
            case = {'shapeMNK': [m, n, k], 'config': config_record(config),
                    'compileWallSeconds': time.perf_counter() - start, 'artifacts': {}}
            report['cases'].append(case)
            for stage in ('ttir', 'ttgir', 'llir', 'ptx', 'cubin'):
                value = compiled.asm[stage]
                if not value or (stage == 'ptx' and '.target sm_80' not in value):
                    raise ValueError('missing or wrong-target compiler artifact')
                file = output / f'{m}-{n}-{k}-{index}.{stage}'
                file.write_bytes(value if isinstance(value, bytes) else value.encode())
                case['artifacts'][stage] = digest(file)


def device_gate(torch, report, env_module):
    if torch.version.hip is not None or not torch.cuda.is_available() or torch.cuda.device_count() != 1:
        raise RuntimeError('exactly one visible NVIDIA GPU required')
    torch.cuda.set_device(0)
    prop = torch.cuda.get_device_properties(0)
    free, _ = torch.cuda.mem_get_info()
    if (prop.major, prop.minor) < (8, 0) or prop.total_memory < 8_000_000_000 or free < 2_000_000_000:
        raise RuntimeError('CC >= 8.0, >= 8 GB total and >= 2 GB free required')
    drivers = subprocess.check_output(['nvidia-smi', '--query-gpu=driver_version', '--format=csv,noheader'], text=True).splitlines()
    if not drivers or any(tuple(map(int, d.strip().split('.'))) < (580, 65, 6) for d in drivers):
        raise RuntimeError('driver >= 580.65.06 required')
    report['gpu'] = {'name': prop.name, 'uuid': str(prop.uuid), 'computeCapability': f'{prop.major}.{prop.minor}',
                     'totalMemoryBytes': prop.total_memory, 'freeMemoryBytesBefore': free, 'visibleCount': 1,
                     'driverVersions': drivers, 'torchCuda': torch.version.cuda,
                     'ptxas': env_module.tool_record(prop.major * 10 + prop.minor)}


def check_outputs(torch, a, b, original_a, original_b, guard, output, expected):
    torch.cuda.synchronize()
    result = verify_product(output.cpu().tolist(), expected)
    if not torch.isnan(guard[output.numel():]).all().item():
        raise ValueError('tail write guard changed')
    if not torch.equal(a.cpu(), original_a) or not torch.equal(b.cpu(), original_b):
        raise ValueError('input changed')
    return {**result, 'inputUnchanged': True, 'tailGuardUnchanged': True}


def gpu_cases(report, output, candidates, benchmark, env_module):
    import torch
    import triton
    from triton.testing import do_bench
    from kernel import blocked_product
    device_gate(torch, report, env_module)
    torch.backends.cuda.matmul.allow_fp16_reduced_precision_reduction = False
    report['measurement'] = {'scope': 'FP16 inputs/output; preallocated forward-only; current-stream events',
        'warmupCalls': WARMUP_CALLS, 'doBenchWarmupMs': BENCH_WARMUP_MS,
        'doBenchRepMs': BENCH_REP_MS, 'returnMode': BENCH_RETURN_MODE,
        'rounds': ROUNDS, 'cachePolicy': 'fresh owned JIT cache; disk autotune cache disabled; do_bench clears benchmark cache',
        'nativeReducedPrecisionReduction': False, 'profiler': 'none', 'graphs': False,
        'excluded': ['allocations', 'transfers', 'validation', 'compilation', 'autotune search']}
    prepared = []
    with torch.no_grad():
        for m, n, k in SHAPES:
            original_a, original_b = fixture(torch, m, n, k)
            validate_inputs(torch, original_a, original_b)
            expected = reference_product(original_a.tolist(), original_b.tolist())
            a, b = original_a.cuda(), original_b.cuda()
            guard = torch.full((m * n + 2048,), float('nan'), dtype=torch.float16, device='cuda')
            c = guard[:m * n].view(m, n)
            native = torch.empty_like(c)
            case = {'shapeMNK': [m, n, k], 'dtype': 'float16', 'accumulator': 'float32',
                    'candidates': [], 'rounds': []}
            report['cases'].append(case)
            def grid(meta):
                return (triton.cdiv(m, meta['BM']), triton.cdiv(n, meta['BN']))
            # Compile every candidate for the actual target before first candidate execution.
            for index, config in enumerate(candidates):
                report['phase'] = f'jit-{m}x{n}x{k}-{index}'
                torch.cuda.synchronize()
                start = time.perf_counter()
                compiled = blocked_product.warmup(a, b, c, m, n, k, grid=grid, **config.all_kwargs())
                record = {'config': config_record(config), 'compileRequestWallSeconds': time.perf_counter() - start}
                case['candidates'].append(record)
                ptx = output / f'{m}-{n}-{k}-{index}-runtime.ptx'
                ptx.write_text(compiled.asm['ptx'])
                record['ptxSha256'] = digest(ptx)
            for index, config in enumerate(candidates):
                report['phase'] = f'correctness-{m}x{n}x{k}-{index}'
                c.fill_(float('nan'))
                blocked_product[grid](a, b, c, m, n, k, **config.all_kwargs())
                report['gpuExecuted'] = True
                case['candidates'][index]['correctness'] = check_outputs(torch, a, b, original_a, original_b, guard, c, expected)
            report['phase'] = f'native-correctness-{m}x{n}x{k}'
            torch.mm(a, b, out=native)
            torch.cuda.synchronize()
            case['nativeCorrectness'] = verify_product(native.cpu().tolist(), expected)
            prepared.append((a, b, c, native, guard, original_a, original_b, expected, case))
        # No search or steady-state samples until every shape/candidate passed correctness.
        if benchmark:
            for a, b, c, native, guard, original_a, original_b, expected, case in prepared:
                m, n, k = case['shapeMNK']
                def grid(meta):
                    return (triton.cdiv(m, meta['BM']), triton.cdiv(n, meta['BN']))
                report['phase'] = f'candidate-warmup-{m}x{n}x{k}'
                start = time.perf_counter()
                for config in candidates:
                    for _ in range(WARMUP_CALLS):
                        blocked_product[grid](a, b, c, m, n, k, **config.all_kwargs())
                torch.cuda.synchronize()
                case['candidateWarmupWallSeconds'] = time.perf_counter() - start
                trials = []
                case['searchTrials'] = trials
                def bench_candidate(fn, quantiles):
                    # This pinned adapter returns a scalar median, retaining ALL samples.
                    # v3.7.1 visits our unpruned list in order; fail closed if that changes.
                    index = len(trials)
                    trial = {'config': config_record(candidates[index]), 'status': 'incomplete'}
                    trials.append(trial)
                    return record_samples(trial, do_bench(fn, warmup=BENCH_WARMUP_MS,
                        rep=BENCH_REP_MS, return_mode=BENCH_RETURN_MODE))
                tuned = triton.autotune(configs=candidates, key=['M', 'N', 'K'],
                                        do_bench=bench_candidate, cache_results=False)(blocked_product)
                if tuned.cache_results:
                    raise ValueError('disk tuning cache unexpectedly enabled')
                report['phase'] = f'autotune-{m}x{n}x{k}'
                torch.cuda.synchronize()
                start = time.perf_counter()
                tuned[grid](a, b, c, m, n, k)
                torch.cuda.synchronize()
                case['searchAndFinalLaunchWallSeconds'] = time.perf_counter() - start
                chosen = tuned.best_config
                case['selection'] = selection_record(trials, config_record(chosen), len(candidates))
                if list(tuned.configs_timings) != candidates:
                    raise ValueError('pinned autotuner candidate order changed')
                case['selectedCorrectness'] = check_outputs(torch, a, b, original_a, original_b, guard, c, expected)
                report['phase'] = f'autotune-cache-hit-{m}x{n}x{k}'
                start = time.perf_counter()
                tuned[grid](a, b, c, m, n, k)
                torch.cuda.synchronize()
                case['memoryCacheHitAndLaunchWallSeconds'] = time.perf_counter() - start
                if len(trials) != len(candidates) or config_record(tuned.best_config) != config_record(chosen):
                    raise ValueError('same-key call unexpectedly retuned')
                case['memoryCacheHitWithoutSearch'] = True
                providers = {'triton': lambda: blocked_product[grid](a, b, c, m, n, k, **chosen.all_kwargs()),
                             'torch': lambda: torch.mm(a, b, out=native)}
                report['phase'] = f'selected-warmup-{m}x{n}x{k}'
                start = time.perf_counter()
                for fn in providers.values():
                    for _ in range(WARMUP_CALLS):
                        fn()
                torch.cuda.synchronize()
                case['selectedAndNativeWarmupWallSeconds'] = time.perf_counter() - start
                for round_index in range(ROUNDS):
                    order = ['triton', 'torch'] if round_index % 2 == 0 else ['torch', 'triton']
                    record = {'order': order, 'status': 'incomplete', 'providers': {}}
                    case['rounds'].append(record)
                    for name in order:
                        report['phase'] = f'steady-{m}x{n}x{k}-{round_index}-{name}'
                        provider = {'status': 'incomplete'}
                        record['providers'][name] = provider
                        record_samples(provider, do_bench(providers[name], warmup=BENCH_WARMUP_MS,
                            rep=BENCH_REP_MS, return_mode=BENCH_RETURN_MODE))
                    record['status'] = 'complete'
                report['phase'] = f'post-benchmark-{m}x{n}x{k}'
                case['postBenchmarkCorrectness'] = check_outputs(torch, a, b, original_a, original_b, guard, c, expected)
                report['phase'] = f'native-post-benchmark-{m}x{n}x{k}'
                case['nativePostBenchmarkCorrectness'] = verify_product(native.cpu().tolist(), expected)
    mappings = {line.split()[-1] for line in Path('/proc/self/maps').read_text().splitlines()
                if '.so' in line and line.split()[-1].startswith('/')}
    report['loadedLibraries'] = [{'path': name, 'sha256': digest(Path(name))}
                                 for name in sorted(mappings) if Path(name).is_file()]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['cpu', 'compile', 'verify', 'benchmark'], required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=False)
    report = {'subject': 'LAB16', 'mode': args.mode, 'result': 'fail', 'phase': 'environment',
        'gpuExecuted': False, 'cases': [], 'evidenceStatus': 'unreviewed local artifact; no automatic Evidence Status',
        'tolerances': {'absolute': ATOL, 'relative': RTOL},
        'sourceHashes': {file.name: digest(file) for file in sorted(HERE.glob('*.py'))},
        'manualManifestRequired': ['OS release/kernel/glibc', 'source commit and dirty diff',
            'commands and exits', 'clocks/power and competing load', 'Reference Environment identity or absence',
            'retain/reject/inconclusive decision for each shape']}
    try:
        report['environment'], module = environment(args.mode == 'compile')
        report['phase'] = args.mode
        if args.mode == 'cpu':
            cpu_cases(report)
        else:
            import triton
            triton.knobs.cache.dir = str(args.output.resolve() / 'jit-cache')
            candidates = configs(triton)
            report['candidateSpace'] = [config_record(c) for c in candidates]
            if args.mode == 'compile':
                report['ptxas'] = module.tool_record(80)
                compile_cases(report, args.output, candidates)
            else:
                gpu_cases(report, args.output, candidates, args.mode == 'benchmark', module)
        report['result'], report['phase'] = 'pass', 'complete'
    except Exception as error:
        report['error'] = {'type': type(error).__name__, 'message': str(error)}
    finally:
        (args.output / 'report.json').write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    print(json.dumps({key: report[key] for key in ('subject', 'mode', 'result', 'phase', 'gpuExecuted')}))
    return 0 if report['result'] == 'pass' else 1


if __name__ == '__main__':
    raise SystemExit(main())
