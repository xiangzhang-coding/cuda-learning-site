<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX04: Error Handling Lifecycle

EX04 is the standalone error-handling-lifecycle Runnable Example for CUDA Learning Site. The original Apache-2.0 project uses one C++17 implementation to separate immediate launch state, deferred execution failure, deterministic host verification, and repaired indexing. The website does not execute CUDA.

## Build Contract

The declared build inputs are `include/error_handling_reference.hpp` and `src/error_handling_lifecycle.cu`. Every Toolkit Lane builds those same files and embeds a native `sm_75` cubin plus forward-compatible PTX generated from `compute_75`.

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
```

These commands create `build/error_handling_lifecycle.ii`, `build/error_handling_lifecycle.o`, and `build/ex04-error-handling-lifecycle`, then use `cuobjdump` to inspect the embedded cubin and PTX. They never execute the CUDA binary. No qualifying EX04 compilation record is currently published.

The CUDA-free correctness boundary needs only a host C++17 compiler:

```sh
make host-test DIALECT=c++17
```

It checks all four scenario names, immediate/deferred/host failure-stage classification, overflow-safe two-dimensional element counts and index maps, the deterministic logical defect, and the repaired row-major result. Passing this host test does not establish CUDA compilation or GPU correctness.

## External Runtime

Build on Native Linux with one CUDA GPU of compute capability 7.5 or newer. Run exactly one scenario per process:

```sh
./build/ex04-error-handling-lifecycle launch-config
./build/ex04-error-handling-lifecycle deferred-access
./build/ex04-error-handling-lifecycle indexing-defect
./build/ex04-error-handling-lifecycle repaired-indexing
```

`launch-config` submits a deliberately invalid launch configuration, observes the launch state with `cudaPeekAtLastError`, retrieves and clears it with `cudaGetLastError`, confirms the cleared state, and reaches an explicit synchronization boundary. `deferred-access` submits a valid launch whose kernel intentionally dereferences an invalid device address; the immediate check is expected to remain clear and synchronization is the intended failure boundary.

`indexing-defect` and `repaired-indexing` use the same fixed `7 x 5` logical extent. The defective kernel applies a column-major permutation that remains inside the 35-element allocation, so host verification can diagnose a logical mismatch without relying on an illegal access. The repaired kernel applies the declared row-major map and is checked against the independent host reference.

The deferred-access scenario performs no allocation and returns immediately after synchronization reports the expected failure. It makes no CUDA cleanup or recovery calls against a potentially unusable context. The other scenarios free memory only after all submitted work has synchronized successfully. Process isolation also prevents one scenario's runtime state from contaminating another scenario's immediate-error check.

## Evidence Boundary

The compile workflow records no GPU execution. The compilation-evidence array is empty, runtime remains Pending Hardware Verification, and recorded observations remain empty. The project publishes expected stage and correctness criteria, not a claimed error code, console transcript, timing, or performance result. A future runtime record must include a complete Environment Manifest and preserve the per-process scenario boundary.
