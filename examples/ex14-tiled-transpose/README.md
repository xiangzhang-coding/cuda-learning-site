<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX14: Tiled Transpose

EX14 is an original, standalone C++17 CUDA Runnable Example. It transposes row-major `float` matrices out of place with a 32 x 32 logical tile, a one-dimensional 256-thread ownership loop, and a padded `float[32][33]` shared array. The project verifies correctness only. It publishes no speedup, global-memory transaction count, bank-conflict observation, timing, or profiler result.

## Matrix Contract

An input with `rows` rows and `columns` columns has `rows * columns` elements. Its output has `columns` rows and `rows` columns, with this exact row-major mapping for every valid coordinate:

```text
output[col * rows + row] = input[row * columns + col]
```

The deterministic fixtures are `5x7`, `33x35`, and `64x32`. They cover rectangular matrices, partial tiles on both axes, and an aligned rectangular case. Values are generated as exactly representable positive integers stored in `float`; transpose performs no arithmetic, so every comparison uses exact float equality.

The pure C++17 reference rejects zero or overflowing dimensions, null pointers, incorrect input or output sizes, incorrect output dimensions, and an in-place request before writing the output. Its verifier reports the first mismatched linear index, output row and column, expected value, and actual value.

## CUDA Structure

Each block has 256 one-dimensional threads. A thread owns local linear slots `threadIdx.x + k * blockDim.x`, derives `(local_row, local_column)` by division and remainder, and covers four slots of the logical 32 x 32 tile. The store phase linearizes output-local coordinates independently and reads the exchanged shared coordinate. Edge loads and stores have separate guards, so rectangular matrices and dimensions that are not multiples of 32 remain within their declared arrays.

The kernel stages valid values in `__shared__ float tile[32][33]`. The extra column belongs only to the physical shared-memory layout; it does not add a logical matrix column or affect output dimensions or values. Every thread reaches one unconditional `__syncthreads()` after the load loop. There is no return before that barrier.

The CUDA executable runs all three fixtures. For each fixture it allocates input and output arrays, copies the input, launches the kernel, checks launch and completion status, copies the output back, and compares it exactly with the CPU reference. It reports the fixture ID, input shape, transposed output shape, and correctness `PASS` or `FAIL`, followed by one aggregate result. It contains no measurement path.

## Build Contract

The declared build inputs are `include/tiled_transpose_reference.hpp` and `src/tiled_transpose.cu`. Every Toolkit Lane uses these same files and C++17.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

The CUDA stages create `build/tiled_transpose.ii`, `build/tiled_transpose.o`, and `build/ex14-tiled-transpose`. Inspection checks for native `sm_75` code and PTX generated from `compute_75`. The host test needs only a host C++17 compiler and contains no CUDA include or syntax.

`scripts/compile-check.sh c++17 ex14 <result-dir>` runs clean, preprocess, compile, link, inspect, and host-test. It never executes `build/ex14-tiled-transpose`.

## Compatibility

The Supported Environment is Native Linux. Runtime requires one CUDA GPU with compute capability 7.5 or newer. The conservative 20,608-byte problem bound includes the largest fixture's device input and output plus one block's padded shared tile, and is below 8 GB. The declared Toolkit Lanes are CUDA 11.8.0 on Ubuntu 22.04 x86-64 and CUDA 12.9.2 and 13.3.1 on Ubuntu 24.04 x86-64.

## Evidence Boundary

Compilation evidence and recorded observations are empty. Runtime remains Pending Hardware Verification. A passing host test proves only the pure-host fixture generation, dimension and size validation, row-major mapping, exact comparison, and mismatch-reporting contracts. It is not CUDA compilation evidence and does not establish CUDA execution, shared-memory behavior, barrier behavior, edge-guard behavior on a GPU, or any performance property.

The canonical source coordinate in `project.json` is pinned to the immutable publication commit used by both bilingual pages and every canonical import.
