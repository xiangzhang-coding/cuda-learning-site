<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX12: Inclusive and Exclusive Scan

EX12 is the standalone Inclusive and Exclusive Scan Runnable Example for CUDA Learning Site. This original Apache-2.0 C++17 project scans 4,099 bounded `std::uint32_t` inputs and checks both output arrays exactly against independent CPU references. It contains no timer and publishes no performance result.

## Correctness Contract

The deterministic input repeats the values 1 through 7. The public host contract accepts at most 4,099 values, rejects values above 7 before changing an output, and therefore bounds every prefix by 28,693, well inside `std::uint32_t`. The deterministic complete input totals 16,390.

`inclusive_scan_reference` and `exclusive_scan_reference` each perform their own serial accumulation. The exclusive reference is not derived from the inclusive output. Exact verification covers every output element, the inclusive and exclusive recurrences, and the last-total identities `inclusive[last] == total` and `exclusive[last] + input[last] == total`.

## Multi-Block Scan

The CUDA path launches 17 blocks of 256 threads. Each block loads a valid input or zero into shared memory, so all threads participate in every unconditional `__syncthreads()` even when the last block contains only three valid elements. The first kernel writes local inclusive prefixes and one block sum per block.

A second kernel scans the 17 block sums in one bounded 256-thread block. A third kernel propagates each preceding block prefix as an offset into the local inclusive results. A final kernel derives each exclusive value as `inclusive[index] - input[index]`. The bound established by the host contract makes every addition and subtraction exact in `std::uint32_t`.

The declared device allocations are three 4,099-element arrays and two 17-element block arrays, totaling 49,324 bytes.

## Build Contract

The declared build inputs are `include/inclusive_exclusive_scan_reference.hpp` and `src/inclusive_exclusive_scan.cu`. Every Toolkit Lane builds those same C++17 files and embeds a native `sm_75` cubin plus PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/inclusive_exclusive_scan.ii`, `build/inclusive_exclusive_scan.o`, and `build/ex12-inclusive-exclusive-scan`. Inspection checks the embedded cubin and PTX. The host test needs only a host C++17 compiler and prints `host-reference: pass` after all exact oracle checks succeed.

`scripts/compile-check.sh c++17 ex12 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test in order. It retains logs and inspection artifacts but never executes the CUDA binary. No qualifying EX12 compilation record is currently published.

## External Runtime

On Native Linux with one CUDA GPU of compute capability 7.5 or newer, build and run:

```sh
./build/ex12-inclusive-exclusive-scan
```

The program reports exact inclusive, exclusive, recurrence, and last-total verdicts. These verdicts are correctness observations only.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification because no qualifying execution in a declared Reference Environment exists. The expected exact outputs, recurrence checks, and last-total identities are acceptance conditions, not runtime records.

This implementation and its prose are original and are not derived from NVIDIA sample source.
