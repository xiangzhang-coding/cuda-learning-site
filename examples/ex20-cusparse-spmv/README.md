<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX20: cuSPARSE SpMV

Standalone original C++17 CUDA Runnable Example. No SDK headers, library code,
or NVIDIA samples are distributed here. Project source is Apache-2.0; the
externally installed CUDA Toolkit and cuSPARSE retain their own terms.

## Contract

One selected GPU computes `y = alpha*A*x + beta*y_initial` using FP32 values,
vectors, scalars, and computation (`CUDA_R_32F`). Both original matrices have
4 rows, 5 columns, and 7 stored entries in zero-based CSR. Row offsets and
column indices use 32-bit signed integers (`CUSPARSE_INDEX_32I`):

- Row offsets: `[0,2,2,4,7]`
- Column indices: `[0,3,1,4,0,2,4]`

Columns are sorted and unique within each row. Repeated offsets at positions
1 and 2 represent an empty row, not an invalid matrix. The host oracle rejects
wrong extents, invalid offsets, out-of-range columns, unsorted or duplicate
columns, and nonfinite input data or scalars before indexing.

All inputs below are exactly representable in FP32. Outputs are independent
literal expectations, not recorded GPU observations.

| Fixture | CSR values | x | Initial y | alpha | beta | Literal output |
| --- | --- | --- | --- | --- | --- | --- |
| A | `[2,-1,3,4,-2,5,1]` | `[1,2,-1,3,2]` | `[4,-2,1,3]` | 1 | 0 | `[-1,0,14,-5]` |
| B | `[-1,2,0.5,-3,4,-2,1]` | `[2,-1,3,0.5,-2]` | `[1,-4,2,0]` | 2 | -0.5 | `[-2.5,2,10,0]` |

The independent CPU reference multiplies and accumulates in double precision,
then applies alpha and beta in double. It checks its result against the literal
output before GPU submission. All four GPU outputs, including the empty row,
must be finite and satisfy `abs(gpu-cpu) <= 1e-4 + 2e-5*abs(cpu)`. The empty
row produces zero in A but two in B because beta is nonzero. This distinguishes
an empty dot product from an output that can be skipped.

All three lanes use `CUSPARSE_OPERATION_NON_TRANSPOSE` and
`CUSPARSE_SPMV_CSR_ALG2`, with mutable `cusparseSpMatDescr_t` and
`cusparseDnVecDescr_t` descriptors created by `cusparseCreateCsr` and
`cusparseCreateDnVec`. Const-descriptor creation interfaces are not required.
Host pointer mode is set explicitly; fixture-owned alpha and beta remain alive
through completion. A handle uses one named non-default, nonblocking stream.

`cusparseSpMV_preprocess` is deliberately not called: the CUDA 11.8 lane does
not provide that API. Version-gated preprocessing and SpMM belong to L13, not
to this common three-lane executable. Compiler preprocessing (`make preprocess`)
is a different operation and is part of the build contract.

## Workspace And Lifetime

The same descriptors and caller arrays serve both fixtures sequentially. Each
execution uploads its CSR arrays and x, and resets device y from the fixture's
initial y, including when beta is zero. After input completion, the program
queries `cusparseSpMV_bufferSize` with the actual descriptors, alpha, beta,
operation, compute type, and algorithm that it will pass to `cusparseSpMV`.
Workspace size is not hard-coded or inferred from nnz.

A zero-byte result skips allocation and supplies a null workspace. Nonzero
scratch is a caller-owned device allocation. A changed requirement replaces
the previous allocation only after completion; an unchanged requirement reuses
it sequentially. Fixed caller arrays total 112 bytes: 48 index bytes and 64
FP32 bytes. Those arrays plus queried scratch must fit 8,000,000,000 bytes.
Library internal resources and initialization needs are additional. Allocation
failure remains fatal even when the declared budget check passes.

Checked H2D, SpMV, and D2H operations use the same stream. Completion precedes
CPU validation, reuse, workspace replacement, and cleanup. On partial failure,
cleanup drains the stream while host fixtures, scalars, and the output buffer
still live. It destroys descriptors and handle, frees caller allocations, and
destroys the stream. Every release is attempted and failures propagate to the
process status. Pageable host buffers are intentional; the `Async` API name
does not establish copy/compute overlap.

## Build And Run

Host-only correctness contract, without CUDA headers or a GPU:

```sh
make host-test DIALECT=c++17
```

Native Linux x86-64 CUDA build, using the 11.8.0 lane as an example:

```sh
make preprocess compile link inspect DIALECT=c++17 EXPECTED_CUSPARSE_VERSION=11.7.5.86
```

The runner cleans, preprocesses, compiles, links with `-lcusparse`, inspects
dynamic linkage, and executes only the host test. Each invocation belongs in
its matching digest-pinned image from `project.json`, not the same Toolkit
installation:

```sh
bash scripts/compile-check.sh c++17 cuda-11-8-bundled-cusparse-11-7-5-86 artifacts/ex20-11-8
bash scripts/compile-check.sh c++17 cuda-12-9-bundled-cusparse-12-5-10-65 artifacts/ex20-12-9
bash scripts/compile-check.sh c++17 cuda-13-3-bundled-cusparse-12-8-2-51 artifacts/ex20-13-3
```

The optional results path may contain spaces and is relative to the invocation
directory. The runner refuses results inside `build`, which it cleans. `BUILD_DIR`
defaults to `build`; GNU Make targets require a space-free build path. Profile
changes invalidate cached CUDA outputs. Missing tools, header drift, link
failures, or unresolved dependencies are failures, not skipped checks. Failed
stages retain stdout and stderr in their logs; no later stage is run. Make
removes a failed compiler target so a retry cannot reuse its partial output.

`readelf -d` must show a cuSPARSE `NEEDED` entry, and `ldd` must resolve cuSPARSE
and all dependencies. No EX20-owned GPU kernel is defined, so inspection does
not require owned cubins or PTX. SM75 flags do not certify the library's internal
dispatch. The wrapper and CI never execute the CUDA binary or request a GPU.

Only in a qualifying Native Linux environment with a CC 7.5+ GPU, run:

```sh
./build/ex20-cusparse-spmv
```

Device 0 in the visible set is selected. Successful execution should report two
correctness verdicts after all four outputs of each fixture are checked. These
are expectations, not observed results. There is no timer, benchmark, bitwise
comparison, measured workspace cost, or runtime determinism claim. The chosen
algorithm is explicit, not evidence that it is fastest for this workload.

## Independent Versions

| Toolkit lane package | cuSPARSE package | Header MAJOR,MINOR,PATCH,BUILD |
| --- | --- | --- |
| 11.8.0 | 11.7.5.86 | 11,7,5,86 |
| 12.9.2 | 12.5.10.65 | 12,5,10,65 |
| 13.3.1 | 12.8.2.51 | 12,8,2,51 |

`EXPECTED_CUSPARSE_VERSION` selects exactly one declared component profile.
Preprocessing requires and compares all four `CUSPARSE_VER_MAJOR`,
`CUSPARSE_VER_MINOR`, `CUSPARSE_VER_PATCH`, and `CUSPARSE_VER_BUILD` macros in
`cusparse.h` against `EX20_EXPECTED_CUSPARSE_*` definitions. It also checks
`CUSPARSE_VERSION = major*1000 + minor*100 + patch`; the aggregate omits build.
This is a component header check, not proof of the installed Toolkit patch.

Checked `cusparseGetProperty` calls request `MAJOR_VERSION`, `MINOR_VERSION`,
and `PATCH_LEVEL`. The loaded triple must match the header triple.
`cusparseGetVersion(handle, ...)` is reported raw and separately; neither API
exposes the loaded build number. Retain resolved library paths, package
identity, and file hashes in the Environment Manifest to identify that binary.
CUDA driver/runtime API levels and `CUDART_VERSION` are reported separately;
they are not driver package, Toolkit package, or cuSPARSE component versions.

`project.json` retains NVIDIA's published linux-x86_64 archive SHA-256 values.
These metadata hashes do not claim that the complete archives were downloaded
or the installed libraries were hash-verified. No SDK is redistributed.

## Scope And Sources

No SpMM, format conversion, structured sparsity, narrow precision, transpose,
graph capture, multi-GPU, or preprocessing execution is requested. Sorted,
unique CSR is this example's explicit contract, not a blanket claim that all
cuSPARSE APIs require sorted indices. No release-wide correctness claim follows
from this small example.

API and component authorities checked on 2026-09-09:

- [Archived CUDA 11.8.0 cuSPARSE API](https://docs.nvidia.com/cuda/archive/11.8.0/cusparse/index.html)
- [Archived CUDA 12.9.2 cuSPARSE API](https://docs.nvidia.com/cuda/archive/12.9.2/cusparse/index.html)
- [Archived CUDA 13.3.1 cuSPARSE SpMV API](https://docs.nvidia.com/cuda/archive/13.3.1/cusparse/index.html#cusparsespmv)
- [CUDA 11.8.0 redistributable manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_11.8.0.json)
- [CUDA 12.9.2 redistributable manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_12.9.2.json)
- [CUDA 13.3.1 redistributable manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_13.3.1.json)

See `evidence/README.md`. Compilation remains empty and runtime remains
Pending Hardware Verification. Host tests and build-command tests are neither
CUDA compilation evidence nor GPU execution evidence.
