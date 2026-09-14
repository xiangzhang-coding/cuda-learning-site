<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX23 — Triton masked vector addition

Original Apache-2.0 Runnable Example. Learner instructions are a complete [English](https://cuda-learning-site.hmzhangxiang.workers.dev/en/examples/triton-vector-add/) / [Chinese](https://cuda-learning-site.hmzhangxiang.workers.dev/examples/triton-vector-add/) Publication Pair.

## Independent environment

Use native Linux x86_64 (Ubuntu 24.04), CPython 3.14.7 ordinary GIL build, and a C compiler with matching Python development headers for Triton's host launcher. Prepare Python's `venv`/pip support first. The hashed binary-only lock selects Triton 3.7.1 and PyTorch 2.13.0, whose Linux dependency is exactly Triton 3.7.1. Its transitive NVIDIA CUDA 13 host libraries are distinct from Triton's bundled ptxas 12.8.93 (pre-Blackwell) / 13.1.80 (Blackwell). EX21/EX22 environments are not reused. No system NVCC is invoked.

From this directory:

```sh
bash scripts/setup.sh
.venv/bin/python ex23.py host-test
.venv/bin/python ex23.py build
.venv/bin/python ex23.py run --size 1003
```

The GPU-free `build` uses an explicit sm_80 target, a fresh cache, and writes TTIR, TTGIR, LLVM IR, PTX, cubin and hashes under `build/compile/`. It does not initialize the driver or call the compiled kernel. This target is an artifact-inspection target, not a retargeting rule for execution. Runtime selects the actual device through Triton.

For an artifact-check host without the runtime dependencies, use `bash scripts/setup.sh --compiler-only` in a separate fresh copy. This installs `compiler.lock`, the exact same Triton wheel from the full lock, without PyTorch. `build` checks this subset; `run` always checks the full runtime lock and cannot use this subset alone. The Debian-based Python compiler-check container is a build-only test environment, not a Runtime-Verified Reference Environment or a second supported GPU setup.

Run requires NVIDIA CC >= 8.0, at least 8 GB, one selected device, and driver >= 580.65.06 for this CUDA 13 host profile (new architectures can need newer drivers). Reject Triton environment overrides, interpreter mode, and mismatched package versions. Linux package installation, successful imports, and valid GPU support must all be checked independently. An unsupported machine may run the stdlib-only `python3 ex23.py host-test`; this proves only the CPU contract.

## Correctness and observations

Inputs are signed quarter/half fractions and their FP32 sums are exactly representable. Compare all outputs, reject nonfinite values, and check an untouched NaN guard after the logical output. Test sizes 1, 255, 256, 257 and 1003 plus the requested size; reject zero, negatives and sizes above one million. For 1003 values expect four programs, 1024 logical block positions and 21 masked positions. `TILE=256` describes values, while `num_warps=4` configures 128 NVIDIA threads for this ordinary launch; position-to-lane placement belongs to the compiler layout.

The store guard detects tail writes but cannot prove that loads were safe: inspect both load masks and use a separately reviewed GPU sanitizer workflow when investigating memory defects. No benchmark or speedup is asserted.

## Evidence

Compilation evidence is empty. Runtime is **Pending Hardware Verification**. `build/run/report.json` is an unreviewed local result, not an automatic status upgrade. Complete `environment-manifest.json`, record source commit, OS/compiler, driver, tool hashes, command, exit status and original logs, then request review. Browser models, CPU tests, interpreter runs and EX02 evidence cannot establish Triton runtime or performance evidence.

## Sources and licenses

See [Triton v3.7.1](https://github.com/triton-lang/triton/tree/v3.7.1), specifically `python/triton/language/core.py`, `python/triton/compiler/compiler.py`, `third_party/nvidia/backend/compiler.py`, and `python/test/unit/language/test_core.py`. The upstream vector-add tutorial was consulted for API behavior, not copied or reconstructed. EX23 uses original fixtures, guards, host validation and artifact inspection. Triton's complete MIT notice is retained in `TRITON-LICENSE`; NVIDIA bundled tools and PyTorch dependencies retain their own terms and are installed externally, not redistributed by this project. Source review: 2026-09-14.
