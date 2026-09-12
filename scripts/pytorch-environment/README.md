<!-- SPDX-License-Identifier: Apache-2.0 -->
# Pinned PyTorch Host Environment

This is public quality tooling, not a canonical Runnable Example. It installs an
application environment and checks its Linux CPU boundary. It does not run a
model on a GPU, compile a custom operator, initialize CUDA, or collect a trace.
A passing check grants no CUDA Evidence Status and establishes no performance,
AMP dispatch, allocator-lifetime, cuDNN execution, or CUPTI collection claim.

## Selection

`profile.json` selects CPython **3.12.14**, Linux x86_64 with glibc 2.28 or newer,
and **torch 2.11.0+cu128** at source commit
`70d99e998b4955e0049d13a98d77ae1b14db1f45`. The wheel ABI is
`cp312-cp312-manylinux_2_28_x86_64`; a CPU-only, macOS, or different CUDA wheel is
not a substitute. The installation command requires a fresh isolated venv.

`requirements.lock` selects exactly 29 distributions using direct publisher
artifact URLs and SHA-256 hashes, with no package-index fallback or source
builds. Its eleven `cuda-toolkit` extras are `cublas`, `cudart`, `cufft`, `cufile`,
`cupti`, `curand`, `cusolver`, `cusparse`, `nvjitlink`, `nvrtc`, and `nvtx`.
The metapackage version 12.8.1, runtime/CUPTI wheel version 12.8.90, cuDNN
9.19.0.56, bindings 12.9.4, and torch's CUDA build family 12.8 are different
coordinates. This closure installs neither a system Toolkit nor a driver.
It adds no NumPy, TorchVision, TorchAudio, notebook, or test dependency.

The allocator configuration must be explicitly `PYTORCH_ALLOC_CONF=backend:native`
before process startup. The legacy allocator alias must be unset. The CPU host
check does not query the active allocator; that requires a separate GPU check.

## Commands

From the public source root, validate the lock offline with a host Python:

```sh
python3 -I -S scripts/pytorch-environment/check.py --check-lock
```

On the selected Linux/Python host, create a new venv outside the public source:

```sh
python3.12 -I -m venv /tmp/pytorch-host-venv
PYTORCH_ALLOC_CONF=backend:native CUDA_VISIBLE_DEVICES='' \
  /tmp/pytorch-host-venv/bin/python -I scripts/pytorch-environment/check.py --install
```

The installer invokes pip with `--require-hashes --only-binary=:all: --no-index
--no-cache-dir --force-reinstall`, retaining dependency resolution and the extras.
Thus all complete wheel payloads must pass pip's hash verification even if
packages were already present. It then runs the same check available without
installation:

```sh
PYTORCH_ALLOC_CONF=backend:native CUDA_VISIBLE_DEVICES='' \
  /tmp/pytorch-host-venv/bin/python -I scripts/pytorch-environment/check.py
npx vitest run tests/unit/pytorch-environment.test.ts
```

`PYTORCH_PROFILE_PYTHON` can select that venv interpreter for the focused test's
real Linux cases. Without it, only those cases are skipped; the mandatory CI job
calls the host checker directly and has no skip or CPU-wheel fallback.

## Check Boundary

The checker rejects OS, architecture, libc, Python patch/implementation, venv,
allocator configuration, unexpected library search paths, installed versions,
extra/missing distributions, and recorded artifact URL/hash mismatches. Only pip
is allowed outside the application closure. It runs `pip check`, verifies five
exact license/notice member hashes, and checks the runtime, CUPTI and cuDNN ELF
artifacts. It opens `libcudart` with `ctypes` and resolves a symbol without calling
it; CUPTI and cuDNN receive file checks only. These are not observations of which
libraries a later GPU operation loads.

Torch import must match the version, source commit, CUDA build and non-debug
configuration. `inspect.signature` checks public Event, autocast, GradScaler and
profiler schedule defaults without constructing CUDA objects. No CUDA availability,
device-count, cuDNN-version or supported-profiler-activity query is made. The
non-initializing `torch.cuda.is_initialized()` guard must remain false.

The independent CPU quantization oracle uses the binary fractions
`[1 + 1/2048, 1 + 3/4096, -(1 + 3/4096)]`. Expected widened FP16 values are the
literals `[1.0, 1.0009765625, -1.0009765625]`, including a ties-to-even case.
The original FP64 sum is `1.00048828125`, the sum after input quantization is
`1.0`, and maximum absolute input error is `0.00048828125`. This checks input
rounding, not GPU arithmetic or accumulation precision. Expected values are not
computed by rerunning the narrowed path.

The public `torch.profiler.schedule(wait=1, warmup=1, active=3, repeat=2)` callable
must map active steps to 2-4 and 7-9, with `RECORD_AND_SAVE` at 4 and 9, and no
recording action at step 10. This tests schedule mapping only, not callbacks,
traces, synchronization, or CPU-to-kernel correlation.

## CI And Bootstrap

Web Quality has a separate required `pytorch-environment` job on `ubuntu-24.04`.
The `web-quality` aggregation rejects failure, cancellation and skipped jobs.
The job checks the public source and file-license policies before installation,
uses immutable `actions/setup-python` commit
`ece7cb06caefa5fff74198d8649806c4678c61a1` with exact version 3.12.14 and x64,
and disables pip caching. Wheels and venvs are temporary, never uploaded.
The bounded JSON summary is privacy-scanned before printing to the CI log;
raw pip/loader output and exception paths are discarded. Failures expose the
failed stage, not raw local diagnostics. No wheelhouse or trace is retained.

This is an application lock, not a full OS/bootstrap lock. `setup-python` uses
GitHub's `actions/python-versions` binary distribution, not a PSF Linux binary.
The owner CPython source URL, commit and published source hash are recorded in
the profile but are not the hash of that compiled interpreter. Runner image
coordinates, OS/kernel/libc, interpreter binary digest/compiler, pip version and
workflow run coordinates are recorded when available. The hosted runner image,
OS packages, interpreter build flags and bootstrap tools are not all pinned.

## Sources And Licenses

The tooling and numeric fixture are independently authored. No upstream
implementation or test body is bundled. Fact anchors inspected 2026-09-12:

- [PyTorch 2.11.0 release](https://github.com/pytorch/pytorch/releases/tag/v2.11.0) and [CUDA 12.8 wheel index](https://download.pytorch.org/whl/cu128/torch/).
- [Exact AMP source](https://github.com/pytorch/pytorch/tree/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/amp), [Event source](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py), and [profiler schedule source](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/profiler/profiler.py).
- [CPython 3.12.14 release](https://www.python.org/downloads/release/python-31214/) and [exact CPython license](https://github.com/python/cpython/blob/2abcf904b8dac8c999d2b3aac76681abb333798a/LICENSE).
- [CUDA metapackage metadata](https://pypi.org/pypi/cuda-toolkit/12.8.1/json); every selected dependency's version-specific metadata is available at `https://pypi.org/pypi/{distribution}/{version}/json`.
- [PyTorch source LICENSE](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/LICENSE) and [NOTICE](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/NOTICE).

Apache-2.0 applies to these original tooling files, not to downloaded packages.
The torch wheel's combined LICENSE includes bundled third-party terms beyond
the source BSD-3-Clause license. Runtime/CUPTI wheels include the NVIDIA CUDA
EULA; cuDNN includes NVIDIA SDK terms. The exact installed member paths and
digests checked here are in `profile.json`. No license member was identified for
the `cuda-toolkit` metapackage; no permissive grant is inferred. CPython retains
its PSF and historical terms. This limited member check is not a full binary
redistribution audit. Vendoring wheels or distributing a container would need
a separate complete license review; this tooling distributes neither.
