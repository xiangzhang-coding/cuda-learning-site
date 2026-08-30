<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX11: Multi-Stage Reduction

EX11 is the standalone Multi-Stage Reduction Runnable Example for CUDA Learning Site. This original Apache-2.0 C++17 project reduces 4,099 deterministic `float` values to one value. It verifies correctness against a double CPU reference and contains no timer or performance claim.

## Correctness Contract

`include/multi_stage_reduction_reference.hpp` generates each input from its index and accumulates the resulting `float` values in `double`. The GPU and CPU use different reduction orders, so bitwise equality is not the acceptance rule. The comparator accepts an absolute error no greater than `absolute_tolerance + relative_tolerance * abs(cpu_reference)`. The absolute term protects sums near zero; the relative term scales the bound with the reference magnitude. The declared tolerances are acceptance criteria, not measured error claims.

With 256 threads and two candidate elements per thread, one block covers at most 512 inputs. The exact stage-size sequence is 4,099 inputs to 9 partial sums to 1 final sum. In the first stage, eight blocks cover 512 inputs each and the ninth partial block covers indices 4,096 through 4,098. The pure host helpers define these extents, and the host test checks complete coverage, progress, and the three-element partial-block invariant.

## CUDA Reduction Structure

Each thread initializes its contribution to zero, then independently guards its first and second global-memory loads. Every thread writes one shared-memory slot and reaches every `__syncthreads()` unconditionally. At each tree step, only the lower lanes add a partner value, but all lanes reach the following barrier.

The host launches `reduce_stage` repeatedly until one value remains. The first launch writes nine partial sums; the second writes one. Kernel boundaries provide the grid-wide ordering between stages. The source checks launch and completion errors and copies only the final value back for comparison.

The input allocation uses 16,396 bytes. Two nine-element partial buffers use 72 more bytes, so the maximum declared device allocation is 16,468 bytes, far below 8 GB.

## Build Contract

The declared inputs are `include/multi_stage_reduction_reference.hpp` and `src/multi_stage_reduction.cu`. Every Toolkit Lane builds those same files and embeds a native `sm_75` cubin plus forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/multi_stage_reduction.ii`, `build/multi_stage_reduction.o`, and `build/ex11-multi-stage-reduction`. Inspection checks the embedded cubin and PTX. Host-test needs only a host C++17 compiler and prints `host-reference: pass` after validating deterministic input, stage sizes, partial-block coverage, the wider CPU accumulation, and the absolute-plus-relative comparator.

`scripts/compile-check.sh c++17 ex11 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test in order. It retains logs and inspection artifacts but never executes the CUDA binary. No qualifying EX11 compilation record is currently published.

## External Runtime

On Native Linux with one CUDA GPU of compute capability 7.5 or newer, build and run:

```sh
./build/ex11-multi-stage-reduction
```

The program prints the CPU reference, GPU sum, absolute error, allowed error, and a correctness result. It prints no duration, bandwidth, throughput, or speedup.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification because no qualifying execution in a declared Reference Environment exists. The expected stage shape, barrier participation, and comparator result are acceptance conditions, not runtime records.

This implementation and its prose are original and are not derived from NVIDIA sample source.
