<!-- SPDX-License-Identifier: Apache-2.0 -->

# EX15: Tiled GEMM

EX15 is an original standalone C++17 CUDA Runnable Example. It evaluates a row-major FP32 subset of general matrix multiplication (GEMM): `C = alpha * A * B + beta * C`. A pure C++17 CPU reference accumulates in `double`, and the candidate output must satisfy the declared finite absolute-plus-relative tolerance. The project publishes no timing, throughput, utilization, speedup, or production-library conclusion.

## Correctness Contract

For `A[M,K]`, `B[K,N]`, and `C[M,N]`, every valid output coordinate follows:

```text
C[row * N + col] = alpha * sum(A[row * K + p] * B[p * N + col]) + beta * C[row * N + col]
```

The fixtures are a hand-checkable `2x3x2`, an all-partial `33x31x35` case with nonzero beta, and a tile-aligned `32x32x32` case. The CPU reference rejects invalid sizes, non-finite inputs, and non-finite scalars. Verification rejects non-finite values and negative tolerances, then applies `absolute_error <= atol + rtol * abs(reference)` at every element while reporting the first mismatch coordinate.

## Portable CUDA Baseline

One `16 x 16` thread block owns one `16 x 16` output tile. Each K iteration zero-fills out-of-bounds A and B loads into two `float[16][16]` shared arrays, synchronizes all 256 threads, accumulates 16 products, and synchronizes all threads again before shared storage is reused. The output store is guarded. No thread returns before a barrier.

There is no architecture-specific variant because none is needed for the teaching contract. Every declared Toolkit Lane uses the same ordinary FP32 multiply-add, shared memory, and block barriers. The native `sm_75` image and `compute_75` PTX are an artifact plan; they do not prove runtime selection or execution.

## Build

```sh
make preprocess DIALECT=c++17
make compile DIALECT=c++17
make link DIALECT=c++17
make inspect DIALECT=c++17
make host-test DIALECT=c++17
```

`scripts/compile-check.sh c++17 ex15 <result-dir>` runs those stages after a clean and retains logs plus cubin/PTX inspection output. It never executes `build/ex15-tiled-gemm`. The host test requires only a host C++17 compiler and prints `host-reference: pass` on success.

## Compatibility and Evidence

The Supported Environment is Native Linux. Runtime requires compute capability 7.5 or newer. The conservative largest-fixture bound is 15,100 bytes: all three global matrices plus 2,048 bytes of shared storage. CUDA 11.8.0, 12.9.2, and 13.3.1 are declared C++17 build targets.

Compilation evidence is empty, runtime is Pending Hardware Verification, and recorded observations are empty. The host test proves only host fixture, reference, tolerance, rejection, and mismatch-reporting behavior. It grants no Compile-Checked or runtime status and establishes no GPU result.

The canonical source coordinate in `project.json` is pinned after the project enters repository history; both bilingual publication pages and canonical imports use that same immutable commit.
