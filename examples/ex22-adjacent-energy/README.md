<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX22: Adjacent-difference energy

Original Apache-2.0 software. For a contiguous rank-one float32/float64 tensor,
`y[i]=(x[i+1]-x[i])^2`, with fresh output of length `n-1` and no mutation.
The supported input length is 1 through 1,000,000, including offset views.
The input and output use the same device and dtype. Noncontiguous, empty,
integer, half, sparse, batched and broadcast inputs are outside this contract.
Nonfinite values follow ordinary arithmetic; the finite test corpus rejects
nonfinite results rather than claiming general overflow avoidance.

## Selected environment

Native Ubuntu 24.04 x86-64; CPython 3.12.14; torch 2.11.0+cu128 at
70d99e998b4955e0049d13a98d77ae1b14db1f45; packaged CUDA family 12.8 and
runtime 12.8.90; separate Toolkit 12.8.1 / nvcc 12.8.93; GCC/G++ 13.3.0;
C++17; setuptools 81.0.0. Build for `8.0+PTX`. The packaged CUDA runtime is
not nvcc. Other site Toolkit Lanes do not apply. No abi3 or cross-PyTorch
binary compatibility is claimed; rebuild after changing any build coordinate.

From the repository root, with an empty selected-interpreter venv activated:

```sh
PYTORCH_ALLOC_CONF=backend:native CUDA_VISIBLE_DEVICES='' LD_LIBRARY_PATH="$(python -I -c 'import sys; print(sys.base_prefix + "/lib")')" python -I scripts/pytorch-environment/check.py --install
```

These command-scoped settings hide devices only during preparation and restrict
library lookup to the selected interpreter's lib directory. Leave LD_PRELOAD
and the legacy PYTORCH_CUDA_ALLOC_CONF unset; the checker rejects them.
This reuses the exact hashed application lock and performs its CPU environment
checks before the extension is installed. Provision the compiler and Toolkit
separately. Then run from `examples/ex22-adjacent-energy/`:

```sh
bash scripts/check-wheel.sh
python -I verify.py --device cuda
```

The first command builds **both** CPU and CUDA paths into a wheel, installs it,
checks dependencies and canonical installed imports, then tests CPU execution,
opcheck, numerical first/second derivatives, meta and fullgraph dynamic
compilation. It needs no GPU. It does not offer a CPU-only replacement build.
`python -I` prevents a source-tree package from satisfying the import test.
`verify_install.py` also checks fresh imports, temporarily hides the installed
extension in this disposable venv, requires import failure, restores it in a
finally block, and requires success again. If the process is forcibly killed,
restore the `.ex22-hidden` backup or recreate the disposable environment.

The CUDA command requires an actual supported GPU: CC >= 8.0, at least 8 GB,
one visible device and a compatible driver (conservative baseline 570.124.06).
The wheel contains SM80 SASS plus compute80 PTX; later architectures may JIT
that PTX, subject to actual driver/device compatibility. Unavailable CUDA is
a failure, not a successful skip. No private FakeTensor API is used; opcheck
tests fake integration and explicit meta calls test storage-free execution.

## Acceptance and interpretation

Input `[1,-2,2,2.5]` has derived output `[9,16,0.25]`. With upstream
`g=[1,2,3]`, `q=2*diff(x)*g=[-6,16,3]`, and
`dx=[6,-22,13,3]`. These are algebraic expectations, not a GPU transcript.
The generated binary-fraction corpus permits exact forward comparison;
finite-difference checks use float64 with eps=1e-6, atol=1e-5, rtol=1e-3.
`opcheck` checks registration, not the mathematical gradient. Fullgraph
compilation preserves the opaque operator boundary and promises no fusion or
speedup. A non-default stream test covers current-stream submission.

Retain all build/test exit codes, compiler diagnostics, wheel and extension
SHA-256, clean-process import location, and the completed Environment Manifest.
Fill actual driver, GPU, loaded-library, dependency and correctness observations;
do not copy desired profile values into observed fields. The blank manifest
is a template. Never replace a failed result with a later run's output.

Compilation evidence is empty and CUDA runtime is **Pending Hardware
Verification**. CI host checks and wheel builds are gates, not automatically
Compile-Checked or Runtime-Verified evidence. A qualifying Reference Environment
and reviewed hardware execution are required for the latter. The site never
executes CUDA. Delete only your own disposable build/venv after retaining logs.
