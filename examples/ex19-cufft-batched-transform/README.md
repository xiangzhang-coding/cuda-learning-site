<!-- SPDX-License-Identifier: Apache-2.0 -->
# EX19: cuFFT Batched Transform

Standalone original C++17 CUDA Runnable Example. No SDK headers, library code,
or NVIDIA samples are distributed here. Project source is Apache-2.0; the
externally installed CUDA Toolkit and cuFFT retain their own terms.

## Contract

One selected GPU executes FP32 `CUFFT_C2C`, rank 1, length `N=4`, batch count 2,
out-of-place. Both directions are unnormalized: forward uses the negative
exponent, inverse the positive exponent, and inverse(forward(x)) is `4*x`.
After checking the unscaled inverse, the host explicitly divides by 4 and
checks the original input. No normalization kernel or callback is used.

| Layout | Embedding | Element stride | Batch distance | Allocation |
| --- | --- | --- | --- | --- |
| Input | non-null `{4}` | 2 | 11 | 22 complex elements |
| Output | non-null `{4}` | 3 | 16 | 32 complex elements |

Addresses are `input[b*11+x*2]` and `output[b*16+k*3]`, in complex elements,
not bytes. Input offsets are `[0,2,4,6]`, `[11,13,15,17]`; output offsets are
`[0,3,6,9]`, `[16,19,22,25]`. Rank-1 embedding values cover the transform
length; the explicit distances locate batches. Null embeddings would disable
the advanced stride contract. Nonlogical input slots contain `123-321i` to
expose accidental contiguous reads. Output is initialized to NaNs before every
execution; every logical output must be overwritten and finite. Padding is not
a transform output and is not included in the mathematical comparison.

All entries below are exact FP32 inputs. Each row contains one batch in natural
sample/bin order; spectra are independent literal values, not oracle output.

| Fixture / batch | Input | Literal forward spectrum |
| --- | --- | --- |
| `signed-impulse` / 0 | `1+i, 2-i, -1+2i, 3` | `5+2i, 1, -5+4i, 3-2i` |
| `signed-impulse` / 1 | `0, 2-i, 0, 0` | `2-i, -1-2i, -2+i, 1+2i` |
| `opposite-tones` / 0 | `1, i, -1, -i` | `0, 4, 0, 0` |
| `opposite-tones` / 1 | `2, -2i, -2, 2i` | `0, 0, 0, 8` |

The independent CPU DFT operates on logical batch-major complex doubles,
without using the cuFFT layout functions. Tests check it against these spectra
and an independent literal inverse. Every GPU output is compared using complex
magnitude: `abs(gpu-cpu) <= 1e-4 + 2e-5*abs(cpu)`. Nonfinite components, invalid
extents/directions/tolerances, and mismatches at any logical output are rejected.
This is neither a bitwise reproducibility promise nor a performance comparison.

One named non-default, nonblocking stream, one plan, and one caller workspace
serve all four executions: first forward/inverse, then new-input forward/inverse.
The plan always reads stride 2/distance 11 and writes stride 3/distance 16.
After synchronizing and validating a forward result, the host extracts the
actual GPU spectrum and repacks it into the input layout before inverse.
Simply swapping the device pointers would be incorrect. The plan is not remade.

`cufftCreate` precedes `cufftSetAutoAllocation(plan, 0)` and `cufftMakePlanMany`.
After stream association, `cufftGetSize` queries final workspace bytes. A
separate contiguous device allocation is attached with `cufftSetWorkArea`;
zero bytes skips allocation and attaches null. Workspace remains exclusive to
this sequential plan. Input/output allocations total 432 bytes; the queried
workspace plus these buffers must fit 8,000,000,000 bytes. Library internal
resources and initialization needs are additional, not measured here.

Checked H2D, FFT, and D2H operations share the stream. Completion precedes CPU
validation, repacking, reuse, and cleanup. The resource owner drains partial
submissions, destroys any successfully created plan, frees caller allocations,
and destroys the stream. It attempts every release and propagates failures to
the process status; host transfer buffers outlive cleanup. Pageable host buffers
are intentional: `cudaMemcpyAsync` does not establish transfer overlap.

## Build And Run

Host-only contract, without CUDA headers or a GPU:

```sh
make host-test DIALECT=c++17
```

Native Linux x86-64 CUDA build, using the 11.8.0 lane as an example:

```sh
make preprocess compile link inspect DIALECT=c++17 EXPECTED_CUFFT_VERSION=10.9.0.58
```

The runner cleans, preprocesses, compiles, links with `-lcufft`, inspects dynamic
linkage, and executes only the host test. Each invocation belongs in its matching
digest-pinned image from `project.json`, not the same Toolkit installation:

```sh
bash scripts/compile-check.sh c++17 cuda-11-8-bundled-cufft-10-9-0-58 artifacts/ex19-11-8
bash scripts/compile-check.sh c++17 cuda-12-9-bundled-cufft-11-4-1-4 artifacts/ex19-12-9
bash scripts/compile-check.sh c++17 cuda-13-3-bundled-cufft-12-3-0-29 artifacts/ex19-13-3
```

The optional results path may contain spaces and is interpreted relative to the
invocation directory. `BUILD_DIR` defaults to `build`; use a space-free build
path for GNU Make targets. Profile changes invalidate cached CUDA outputs.
Missing tools, mismatched headers, link failures, and unresolved dependencies
are failures, not skipped checks. `readelf -d` must contain a cuFFT `NEEDED`
entry; `ldd` must resolve cuFFT and all dependencies. This source defines no GPU
kernel, so inspection does not require EX19-owned cubins or PTX. SM75 build flags
do not certify the library's internal dispatch or plan-time JIT initialization.

Only in a qualifying Native Linux environment with a CC 7.5+ GPU, run:

```sh
./build/ex19-cufft-batched-transform
```

Device 0 in the visible set is selected; no multi-GPU plan is created. Successful
execution should report four correctness verdicts, after all eight complex
outputs in each direction have been checked. These are expectations, not
recorded observations. No timer is present.

## Independent Versions

| Toolkit lane package | cuFFT package | Header MAJOR,MINOR,PATCH,BUILD |
| --- | --- | --- |
| 11.8.0 | 10.9.0.58 | 10,9,0,58 |
| 12.9.2 | 11.4.1.4 | 11,4,1,4 |
| 13.3.1 | 12.3.0.29 | 12,3,0,29 |

`EXPECTED_CUFFT_VERSION` selects exactly one component profile. Preprocessing
compares `CUFFT_VER_MAJOR`, `CUFFT_VER_MINOR`, `CUFFT_VER_PATCH`, and
`CUFFT_VER_BUILD` from `cufft.h` against the corresponding
`EX19_EXPECTED_CUFFT_*` definitions. All four macros were checked in the NVIDIA
redistributable headers for these versions. No vendor header is vendored.
`project.json` retains NVIDIA's published linux-x86_64 archive SHA-256 values;
these metadata hashes are not a claim that a full archive was downloaded or
that an installed library binary was hash-verified.

Checked `cufftGetProperty` calls expose only major/minor/patch, which must match
the header triple. `cufftGetVersion` is reported raw with that granularity; it
does not prove the loaded build number. Retain resolved library paths, package
identity, and file hashes in the Environment Manifest to identify the complete
loaded binary. CUDA driver/runtime API levels and `CUDART_VERSION` are reported
separately. They are not Toolkit package versions, driver package versions, or
cuFFT component versions.

## Scope And Sources

No R2C/C2R execution, in-place transform, callback, low precision, multi-GPU,
graph, timing, or patient-JIT/LTO plan property is requested. The current
real-side LTO callback layout hazard is outside this C2C-without-callbacks
contract; that does not establish general release correctness.

API and storage authorities checked on 2026-09-08:

- [Archived CUDA 11.8.0 cuFFT API](https://docs.nvidia.com/cuda/archive/11.8.0/cufft/index.html)
- [Archived CUDA 12.9.2 cuFFT API](https://docs.nvidia.com/cuda/archive/12.9.2/cufft/index.html)
- [Live cuFFT API](https://docs.nvidia.com/cuda/cufft/index.html)
- [CUDA 11.8.0 redistributable manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_11.8.0.json)
- [CUDA 12.9.2 redistributable manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_12.9.2.json)
- [CUDA 13.3.1 redistributable manifest](https://developer.download.nvidia.com/compute/cuda/redist/redistrib_13.3.1.json)

See `evidence/README.md`. Compilation remains empty and runtime remains
Pending Hardware Verification. Host tests and build commands are not CUDA
compilation or GPU runtime evidence.
