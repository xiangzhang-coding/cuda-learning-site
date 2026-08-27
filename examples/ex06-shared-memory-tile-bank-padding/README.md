<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX06: Shared-Memory Tile Bank Padding

EX06 is the standalone shared-memory tile bank-padding Runnable Example for CUDA Learning Site. The original Apache-2.0 project uses one templated CUDA C++17 implementation to instantiate an unpadded `float[32][32]` shared tile and a padded `float[32][33]` shared tile. It is not derived from NVIDIA sample source.

## Correctness and Layout Contract

One block of 32 threads cooperatively loads a deterministic 32 x 32 input tile. On each loop iteration, the warp loads one row across its lanes. After `__syncthreads()`, lane `lane` reads `tile[lane][5]`. Both variants must therefore produce the same 32 values: input row `lane`, column 5.

For the declared model of 32 banks and successive 32-bit words mapping to successive banks, the unpadded word index is `lane * 32 + 5`. Every lane selects bank 5 but a different word. The padded word index is `lane * 33 + 5`, so the lane bank is `(lane + 5) % 32` and all 32 banks are distinct. These are deterministic host-model predictions, not profiler observations.

The program allocates one 4,096-byte input and two 128-byte outputs. The larger shared tile is 4,224 bytes. Counting the global allocations and larger per-block tile conservatively gives an 8,576-byte problem bound, far below 8 GB.

## Build Contract

The declared build inputs are `include/shared_memory_tile_bank_padding_reference.hpp` and `src/shared_memory_tile_bank_padding.cu`. Every Toolkit Lane builds those same files and embeds a native `sm_75` cubin plus forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/shared_memory_tile_bank_padding.ii`, `build/shared_memory_tile_bank_padding.o`, and `build/ex06-shared-memory-tile-bank-padding`. Inspection uses `cuobjdump` to check the embedded cubin and PTX. The host test needs only a host C++17 compiler and validates tile indexing, both shared-layout word maps, bank identities for padding zero and one, and exact outputs for both layouts.

`scripts/compile-check.sh c++17 ex06 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test in order. It retains logs and inspection artifacts but never executes the CUDA binary. No qualifying EX06 compilation record is currently published.

## External Runtime

On Native Linux with one CUDA GPU of compute capability 7.5 or newer, build and run:

```sh
./build/ex06-shared-memory-tile-bank-padding
```

The program prints only `PASS` or `FAIL` correctness for the unpadded and padded variants. It records no timing, profiler counter, conflict count, bandwidth, throughput, or speedup. Later profiling can test the predicted bank mapping, but this project does not turn that future observation into a current claim.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification because no qualifying execution in a declared Reference Environment exists. Passing the pure host model does not establish device behavior or grant CUDA Evidence Status.
