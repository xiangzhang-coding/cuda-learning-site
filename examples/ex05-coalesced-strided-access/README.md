<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX05: Coalesced and Strided Access

EX05 is the standalone coalesced-and-strided-access Runnable Example for CUDA Learning Site. The original Apache-2.0 project uses one CUDA C++17 gather implementation for three deterministic access scenarios. The scenarios vary only `offset` and `stride`; they do not contain separate kernels or copied implementations.

## Correctness Contract

The executable fixes `logicalCount` at 256 and applies the same rule in every scenario:

`output[logicalIndex] = input[offset + logicalIndex * stride]`

| Scenario | Offset | Stride | Required input elements |
| --- | ---: | ---: | ---: |
| `contiguous` | 0 | 1 | 256 |
| `misaligned` | 1 | 1 | 257 |
| `strided` | 0 | 2 | 511 |

The largest input allocation is 511 `std::uint32_t` values. Together with the 256-element output, the project allocates 3,068 device bytes, far below 8 GB. The pure C++17 header checks overflow-safe required counts, source indices, and exact output values without including CUDA.

## Build Contract

The declared build inputs are `include/coalesced_strided_access_reference.hpp` and `src/coalesced_strided_access.cu`. Every Toolkit Lane builds those same files and embeds a native `sm_75` cubin plus forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/coalesced_strided_access.ii`, `build/coalesced_strided_access.o`, and `build/ex05-coalesced-strided-access`. Inspection uses `cuobjdump` to check the embedded cubin and PTX. The host test uses only a host C++17 compiler and runs no CUDA code.

`scripts/compile-check.sh c++17 ex05 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test in order. It retains logs and inspection artifacts but never executes the CUDA binary. No qualifying EX05 compilation record is currently published.

## External Runtime

On Native Linux with one CUDA GPU of compute capability 7.5 or newer, build and run:

```sh
./build/ex05-coalesced-strided-access
```

The program prints one line per scenario containing only the scenario identity and a `PASS` or `FAIL` correctness result. It records no timing, profiler counter, bandwidth, throughput, or speedup. The access patterns are controlled inputs for inspection and later external profiling, not performance claims.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification because no qualifying execution in a declared Reference Environment exists. The expected source-index patterns and correctness verdicts are acceptance criteria, not observed output.

This implementation and its prose are original and are not derived from NVIDIA sample source.
