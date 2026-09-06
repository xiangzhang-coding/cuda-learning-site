<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX18: cuBLAS GEMM Reference

Standalone original C++17 CUDA Runnable Example. The host-only header reuses
this site's original EX15 generator and double-oracle logic in a self-contained
implementation; it neither includes EX15 nor calls cuBLAS for its expected values.
No NVIDIA sample, library implementation, or SDK header is distributed here.
Project source uses Apache-2.0; externally installed cuBLAS retains its own terms.

## Contract

Row-major `C[M,N] = alpha * A[M,K] * B[K,N] + beta * C[M,N]` uses these EX15 inputs:

| Fixture | M,K,N | alpha | beta | Acceptance |
| --- | --- | --- | --- | --- |
| `2x3x2-hand` | 2,3,2 | 1 | 0 | A and B contain 1 through 6; initial C is zero; literal row-major result 22,28,49,64 |
| `33x31x35-partial` | 33,31,35 | 0.75 | 0.25 | Non-square input with nonzero initial C |
| `32x32x32-aligned` | 32,32,32 | 1 | 0 | Square aligned comparison input |

The latter two fixtures use the EX15 generator: A repeats `(i%7-3)/8`, B repeats
`(i%5-2)/7`, and initial C repeats `(i%3-1)/5`, with signed subtraction and float
division in the canonical header. The CPU multiplies the stored float values
after conversion to double and accumulates in double. Every output must be finite
and satisfy `abs(gpu-cpu) <= 1e-4 + 2e-5 * abs(cpu)`. This is not a bitwise-equality
or cross-device reproducibility promise. The first mismatch reports coordinates.

The same row-major bytes represent column-major transposes. `cublasGemmEx` computes
`C^T = alpha * B^T * A^T + beta * C^T`, with `(m,n,k)=(N,M,K)`, first operand B,
second operand A, `CUBLAS_OP_N` twice, and `(lda,ldb,ldc)=(N,K,N)`. No transpose
kernel or extra transpose copy is needed. All matrix types are `CUDA_R_32F`, with
`CUBLAS_COMPUTE_32F_PEDANTIC`, `CUBLAS_GEMM_DEFAULT`, and `CUBLAS_DEFAULT_MATH`.
EX18 does not request FAST_TF32, lower-precision conversion, or an emulated mode.

One nonblocking stream and one cuBLAS handle serve all three cases. Alpha/beta
are host scalars under `CUBLAS_POINTER_MODE_HOST`. Each case restores initial C,
queues three H2D copies, GEMM, and one D2H copy on the same stream, and checks
`cudaStreamSynchronize` before reading output or reusing buffers. Pageable host
storage is intentional; the Async API name does not establish transfer overlap.
`cublasSetStream` resets the workspace to the library-owned default pool. No
user workspace is installed here. RAII cleanup drains the stream even after a
partial failure, attempts every release, and propagates cleanup failure into
the process exit status. Host buffers outlive that cleanup.

## Build And Run

Host contract only, no CUDA headers or GPU:

```sh
make host-test DIALECT=c++17
```

Native Linux x86-64 CUDA build, shown for the 11.8.0 lane:

```sh
make preprocess DIALECT=c++17 EXPECTED_CUBLAS_VERSION=11.11.3.6
make compile DIALECT=c++17 EXPECTED_CUBLAS_VERSION=11.11.3.6
make link DIALECT=c++17 EXPECTED_CUBLAS_VERSION=11.11.3.6
make inspect DIALECT=c++17 EXPECTED_CUBLAS_VERSION=11.11.3.6
```

The profile wrapper cleans, preprocesses, compiles, links with `-lcublas`, inspects,
and runs the host test. It never executes the CUDA program:

```sh
bash scripts/compile-check.sh c++17 cuda-11-8-bundled-cublas-11-11-3-6 artifacts/ex18-11-8
bash scripts/compile-check.sh c++17 cuda-12-9-bundled-cublas-12-9-2-10 artifacts/ex18-12-9
bash scripts/compile-check.sh c++17 cuda-13-3-bundled-cublas-13-6-0-2 artifacts/ex18-13-3
```

Run each profile in its matching digest-pinned development image from
`project.json`, not all three against one Toolkit installation. Build stages
produce `.ii`, `.o`, the executable, and two linkage reports. `readelf -d` must
show a cuBLAS `NEEDED` entry; `ldd` must resolve cuBLAS and report no missing
libraries. No kernel is defined in this translation unit, so `cuobjdump` is not
required to find an EX18-owned cubin or PTX. Architecture flags do not certify
the library's internal dispatch. Missing NVCC, headers, libraries, or binutils
is a failed build, not a skip or a pass.

Only in a qualifying Native Linux environment with one selected CC 7.5+ GPU:

```sh
./build/ex18-cublas-gemm
```

Device 0 in the visible-device set is selected. Fixed device matrix capacity is
`4 * (1024 + 1085 + 1155) = 13,056` bytes, reused between fixtures. The library's
internal resources and default workspace are additional, not measured or bounded
by that matrix count. Total problem memory must fit the Baseline GPU Capability
Tier's 8,000,000,000-byte gate; allocation failure is fatal. No timer is present.

## Independent Component Pins

| Toolkit | cuBLAS | Required header MAJOR,MINOR,PATCH,BUILD |
| --- | --- | --- |
| 11.8.0 | 11.11.3.6 | 11,11,3,6 |
| 12.9.2 | 12.9.2.10 | 12,9,2,10 |
| 13.3.1 | 13.6.0.2 | 13,6,0,2 |

`EXPECTED_CUBLAS_VERSION` defines `EX18_EXPECTED_CUBLAS_MAJOR`, `_MINOR`, `_PATCH`,
and `_BUILD`. Preprocessing rejects disagreement with `CUBLAS_VER_MAJOR`,
`CUBLAS_VER_MINOR`, `CUBLAS_VER_PATCH`, or `CUBLAS_VER_BUILD` from the selected
cuBLAS headers. No version is guessed from `CUDART_VERSION` or a Toolkit label.
At execution, checked `cublasGetProperty(MAJOR_VERSION/MINOR_VERSION/PATCH_LEVEL)`
queries must match the header triplet. The program prints that loaded triplet,
the header's four components, and the raw `cublasGetVersion` value separately.
These APIs expose no loaded build component: retain resolved library paths,
package identity and file hashes in the Environment Manifest to establish the
complete binary coordinate. Link inspection alone proves neither runtime
identity nor GPU execution.

Owner sources reviewed **2026-09-06**:

- [cuBLAS reference archived with CUDA 11.8.0](https://docs.nvidia.com/cuda/archive/11.8.0/cublas/index.html)
- [cuBLAS reference archived with CUDA 12.9.2](https://docs.nvidia.com/cuda/archive/12.9.2/cublas/index.html)
- [Current cuBLAS owner reference](https://docs.nvidia.com/cuda/cublas/index.html)
- [CUDA Runtime stream management](https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__STREAM.html)
- [CUDA 11.8.0 manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_11.8.0.json), libcublas Linux x86-64 SHA-256 `045e6455c9f8789b1c7ced19957c7904d23c221f4d1d75bb574a2c856aebae98`
- [CUDA 12.9.2 manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_12.9.2.json), libcublas Linux x86-64 SHA-256 `c80a724aafa1ee49110b0d3385316ea54d418b03e796e91e8f0b47d52f8022fd`
- [CUDA 13.3.1 manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_13.3.1.json), libcublas Linux x86-64 SHA-256 `1794edb653adf48f5fa02d86bb738ed75888dd355aa39dadb6202d84d554c0dc`

The owner 13.3.1 cuBLAS archive URL returned 404 on that date. Its component pin
comes from the exact redistribution manifest; API review uses the current owner
reference and available older archives. This gap is not a verified 13.3.1 build.
Archive hashes above are owner-declared acquisition coordinates, not locally
downloaded-library hash measurements.

## Evidence

Compilation is `[]`; runtime is **Pending Hardware Verification**;
recorded observations are `[]`. Local CPU tests establish only the host contract.
No local CUDA compilation or GPU execution is claimed. The three expected
observations in `project.json` are acceptance criteria, not captured output.
Future evidence must bind the exact source/profile, complete Environment Manifest,
commands, exit statuses, library identity, raw output, and correctness verdicts.
