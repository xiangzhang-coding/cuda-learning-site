# SPDX-License-Identifier: Apache-2.0
"""Run one tiny diagnostic in a fresh external Linux process, never a benchmark."""
import argparse
import importlib.util
import importlib.metadata
import json
import os
from pathlib import Path
import sys
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(HERE))
from contract import verify_increment


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['interpreter', 'gpu', 'compile'], required=True)
    parser.add_argument('--case', choices=['clean', 'tail', 'assert', 'print'], default='clean')
    args = parser.parse_args()
    # Reuse the full EX23 lock/platform gate before importing Triton. Overrides
    # are rejected by that gate; set this process's requested knobs afterwards.
    spec = importlib.util.spec_from_file_location('diagnostic_environment', ROOT / 'examples/ex23-triton-vector-add/ex23.py')
    environment = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(environment)
    environment.check_environment(compiler_only=False)
    if importlib.metadata.version('numpy') != '2.5.3':
        raise RuntimeError('diagnostic interpreter requires locked NumPy 2.5.3')
    if args.mode == 'interpreter' and args.case == 'assert':
        parser.error('device assertion is a GPU check; interpreter uses the host oracle')
    os.environ['TRITON_INTERPRET'] = '1' if args.mode == 'interpreter' else '0'
    os.environ['TRITON_DEBUG'] = '1' if args.case == 'assert' else '0'
    import torch
    import triton
    triton.knobs.refresh_knobs()
    from kernel import increment_fixture
    constants = {'N': 17, 'BLOCK': 32, 'BROKEN': args.case in ('tail', 'assert'),
                 'PRINT': args.case == 'print', 'ASSERT': args.case == 'assert'}
    if args.mode == 'compile':
        from triton.backends.compiler import GPUTarget
        from triton.compiler import ASTSource
        signature = {'source': '*fp32', 'target': '*fp32', **{k: 'constexpr' for k in constants}}
        compiled = triton.compile(ASTSource(increment_fixture, signature=signature, constexprs=constants),
                                  target=GPUTarget('cuda', 80, 32), options={'debug': args.case == 'assert'})
        if '.target sm_80' not in compiled.asm['ptx'] or torch.cuda.is_initialized():
            raise RuntimeError('wrong target or unexpected driver initialization')
        print(json.dumps({'mode': 'compile', 'gpuExecuted': False, 'runtimeEvidence': 'Pending Hardware Verification'}))
        return
    if args.mode == 'gpu':
        if torch.version.hip is not None or not torch.cuda.is_available() or torch.cuda.device_count() != 1:
            raise RuntimeError('one visible NVIDIA GPU required')
        prop = torch.cuda.get_device_properties(0)
        if (prop.major, prop.minor) < (8, 0) or prop.total_memory < 8_000_000_000:
            raise RuntimeError('CC >= 8.0 and >= 8 GB required')
        drivers = subprocess.check_output(['nvidia-smi', '--query-gpu=driver_version', '--format=csv,noheader'], text=True).splitlines()
        if not drivers or any(tuple(map(int, version.strip().split('.'))) < (580, 65, 6) for version in drivers):
            raise RuntimeError('driver >= 580.65.06 required')
        environment.tool_record(prop.major * 10 + prop.minor)
    device = 'cpu' if args.mode == 'interpreter' else 'cuda'
    source = torch.arange(18, dtype=torch.float32, device=device)
    target = torch.full((18,), -999, dtype=torch.float32, device=device)
    increment_fixture[(1,)](source, target, **constants)
    if args.mode == 'gpu':
        torch.cuda.synchronize()  # Assertion failures can surface here. End process.
    verify_increment(target.cpu().tolist(), 17)
    if args.mode == 'interpreter' and torch.cuda.is_initialized():
        raise RuntimeError('interpreter unexpectedly initialized CUDA')
    print(json.dumps({'mode': args.mode, 'case': args.case, 'oraclePassed': True,
                      'gpuExecuted': args.mode == 'gpu', 'runtimeEvidence': 'Pending Hardware Verification'}))


if __name__ == '__main__':
    main()
