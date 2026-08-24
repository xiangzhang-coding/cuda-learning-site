<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX02: Vector Addition

EX02 is the canonical standalone vector-addition Runnable Example for CUDA Learning Site. The project is original Apache-2.0 source and uses one implementation that is valid as C++17. CUDA 12.9.2 and 13.3.1 also compile that same source under C++20; no second implementation exists.

## Build Contract

The declared build inputs are `include/vector_add_reference.hpp` and `src/vector_add.cu`. The cross-lane target embeds a native `sm_75` cubin and forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
```

These commands create `build/vector_add.ii`, `build/vector_add.o`, and `build/ex02-vector-addition`, then use `cuobjdump` to confirm the embedded cubin and PTX. The compile-evidence workflow never executes `build/ex02-vector-addition`.

The host-only correctness boundary has no CUDA dependency:

```sh
make host-test DIALECT=c++17
```

It checks the CPU reference, absolute tolerance `1e-5`, relative tolerance `1e-5`, and a known mismatch. This host test does not establish GPU correctness.

## External Runtime

On a native Linux CUDA environment, build the project and run:

```sh
./build/ex02-vector-addition
./build/ex02-vector-addition 16777216
```

The optional element count is bounded to `1..134217728`. The default is `1048576`. The program computes an independent CPU reference, checks every CUDA call and launch boundary, synchronizes before comparison, and reports failure when neither the absolute nor the relative tolerance accepts an element.

No Reference Environment or qualifying GPU execution is currently declared by this project. Runtime evidence remains Pending Hardware Verification until a complete Environment Manifest and acceptance record exist.
