<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX03: Multidimensional Indexing

EX03 is the standalone multidimensional-indexing Runnable Example for CUDA Learning Site. The project is original Apache-2.0 source and uses one CUDA C++17 implementation for 1D, 2D, and 3D logical extents. A 1D extent uses `y=1` and `z=1`; a 2D extent uses `z=1`.

## Build Contract

The declared build inputs are `include/multidimensional_indexing_reference.hpp` and `src/multidimensional_indexing.cu`. The cross-lane target embeds a native `sm_75` cubin and forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
```

These commands create `build/multidimensional_indexing.ii`, `build/multidimensional_indexing.o`, and `build/ex03-multidimensional-indexing`, then use `cuobjdump` to inspect the embedded cubin and PTX. The build workflow does not execute the CUDA program. No qualifying EX03 compilation record is currently published.

The pure host-side correctness boundary has no CUDA dependency:

```sh
make host-test DIALECT=c++17
```

It checks known row-major coordinates for 1D, 2D, and 3D extents, a non-divisible extent, and independent out-of-bounds coordinates on each axis. This host test does not establish GPU correctness.

## External Runtime

On a Native Linux CUDA environment, build the project and choose one to three positive extents:

```sh
./build/ex03-multidimensional-indexing 1000
./build/ex03-multidimensional-indexing 37 19
./build/ex03-multidimensional-indexing 17 11 5
```

The extent order is `x y z`; omitted dimensions are one. The product may not exceed `262144` elements. The program initializes deterministic host input, computes an independent row-major host reference, checks every CUDA allocation, transfer, launch, synchronization, and cleanup boundary, and compares every output element.

No Reference Environment or qualifying GPU execution is currently declared by this project. Runtime evidence remains Pending Hardware Verification until a complete Environment Manifest and acceptance record exist.
