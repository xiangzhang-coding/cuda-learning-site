<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX13: Privatized Histogram

EX13 is an original, standalone C++17 CUDA Runnable Example with 16 bins. It compares a direct global-bin kernel with a block-private shared-memory kernel for correctness only. Both CUDA outputs must match one independent CPU reference exactly; the project publishes no contention observation, timing, or performance result.

## Correctness Contract

Every fixture contains 259 values, so a 128-thread block size creates two full blocks and one partial block with three active threads. The fixture IDs and literal host expectations are:

- `uniform`: bins 0 through 2 contain 17 values each; bins 3 through 15 contain 16 each.
- `skewed`: bin 0 contains 17 values, bin 7 contains 226, bin 8 contains 16, and every other bin is zero.
- `boundary`: bin 0 contains 130 values, bin 15 contains 129, and every other bin is zero.

The pure C++17 reference rejects an unknown fixture, an input with the wrong size, and any value outside `[0, 15]`. It computes into a temporary histogram before updating the caller's output. The host test checks every literal bin count, exact mismatch reporting, and the invariant `sum_of_bins(histogram) == 259` for all three fixtures.

## CUDA Structure

`global_histogram_kernel` applies `atomicAdd` directly to the selected global bin. `privatized_histogram_kernel` gives each block 16 shared-memory private bins. Every thread participates in an unconditional barrier after zeroing, after updates, and after the merge. The partial-block guard controls only whether a thread contributes an input value; it never controls a barrier.

Each fixture launches both kernels with separate zeroed output arrays. After an explicit completion boundary, the program copies both complete histograms to the host and compares every bin exactly with the CPU reference. It also checks the sum-of-bins invariant for both paths.

## Build Contract

The declared build inputs are `include/privatized_histogram_reference.hpp` and `src/privatized_histogram.cu`. Every Toolkit Lane uses those same files and C++17.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/privatized_histogram.ii`, `build/privatized_histogram.o`, and `build/ex13-privatized-histogram`. Inspection checks for native `sm_75` code and PTX generated from `compute_75`. The host test needs only a host C++17 compiler and contains no CUDA code.

`scripts/compile-check.sh c++17 ex13 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test. It never executes `build/ex13-privatized-histogram`.

## Compatibility

The Supported Environment is Native Linux. Runtime requires one CUDA GPU with compute capability 7.5 or newer. The 1,228-byte conservative bound includes the 259-value device input, two 16-bin global outputs, and one block's 16 private shared-memory bins. The declared Toolkit Lanes are CUDA 11.8.0 on Ubuntu 22.04 x86-64 and CUDA 12.9.2 and 13.3.1 on Ubuntu 24.04 x86-64.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification. A passing host test proves only the pure-host fixture, reference, exact-comparison, and invariant contracts. It does not establish CUDA execution, barrier behavior, atomic behavior, contention, or performance.

The forty-zero source commit and its URLs are temporary publication coordinates that must be replaced by a later pin.
