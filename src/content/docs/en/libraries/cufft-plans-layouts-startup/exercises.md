---
title: 'L12 Exercises: FFT Layouts and Plan Lifetimes'
description: Derive real-transform storage, audit a strided batched C2C transform, and separate safe workspace reuse from startup and callback assumptions.
pairId: l12-exercises
counterpart: /libraries/cufft-plans-layouts-startup/exercises/
factCheckDate: '2026-09-08'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L12-EXERCISES
prerequisites: [L12]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'cuFFT storage and plan contract'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cufft/index.html'
    version: 'Toolkit 12.9.2 archive; cuFFT 11.4.1.4'
    platform: 'Static reasoning, not CUDA execution'
    accessDate: '2026-09-08'
  - title: 'cuFFT 13.3 Update 1 known issue'
    url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html#cufft-release-13-3-update-1'
    version: 'Live 13.3 Update 1; cuFFT 12.3.0.29'
    platform: 'Real-side LTO callback exclusion, not a reproduced failure'
    accessDate: '2026-09-08'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l12-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/libraries/cufft-plans-layouts-startup/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-08' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L12 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
---

<a class="locale-pair" data-locale-counterpart href="/libraries/cufft-plans-layouts-startup/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L12](/en/libraries/cufft-plans-layouts-startup/). These are paper Exercises, not Labs. No GPU or CUDA execution is required. All four evidence arrays are empty.

## Submission requirements

Submit address tables, equations, ownership edges, and rejection reasons before opening the [separate solutions](/en/libraries/cufft-plans-layouts-startup/solutions/). Distinguish a supplied worksheet value from a queried or measured value. Use FP32 real elements of 4 bytes and FP32 complex elements of 8 bytes. Do not change tolerances or invent performance results.

## Exercise 1: Allocate the real transform, not its name

**Goal:** Describe an in-place R2C followed by C2R for three independent length-10 real signals.

**Constraints:** Rank 1, unit element strides, contiguous batches with only required real padding, aligned base address, and separate plans for the two transform types. Keep the logical length 10. The spectrum may need another consumer after C2R.

**Expected evidence:** Derive K, physical real elements per batch, input/output distances in their respective types, total allocation bytes, real/complex batch-start byte offsets, and round-trip scaling. Give one allocation table for each direction and a spectrum-lifetime decision.

**Acceptance criteria:** Both directions address the same physical batch starts despite unequal numeric distances. Padding is not a logical sample. C2R input satisfies Hermitian symmetry, including real DC and Nyquist bins. The result is scaled by the logical length, not by storage or batch count. Do not assume an out-of-place alternative preserves C2R input.

<details><summary>Hint 1: Count the nonredundant spectrum</summary>Start with floor(N/2)+1 complex coefficients, then express the same capacity in real elements. Each batch has its own padding; adding two floats once to the entire allocation is not enough.</details>

<details><summary>Hint 2: Convert both distances into bytes</summary>A real-side distance and a complex-side distance can differ while referring to the same address. Separately ask whether the next consumer needs the original spectrum or the inverse output.</details>

## Exercise 2: Audit two different C2C layouts

**Goal:** Prove the addresses and mathematical sign of a batched length-4 C2C plan before using its output.

**Constraints:** Two batches; input stride 2, distance 11, allocation 22 complex elements; output stride 3, distance 16, allocation 32 complex elements. Both embeddings are non-null arrays containing 4. For the paper calculation, use batch 0 `[1,2,3,4]` and batch 1 `[0,1,0,0]`. These are worksheet inputs, not EX19's executable fixtures.

**Expected evidence:** List every logical input/output offset, minimum touched extents, and allocated bytes. Derive both forward spectra with a negative exponent, then the unnormalized inverse and required scale. Explain why passing null embeddings or swapping input/output pointers for inverse is incorrect.

**Acceptance criteria:** Keep batch identity and natural frequency-bin order. Distinguish minimum touched extent from deliberately padded capacity. Reuse the same plan only by repacking completed output into its required input layout, or explicitly propose a second inverse plan with reversed layout parameters. A round trip alone is not the forward oracle; untouched padding is not mathematical output.

<details><summary>Hint 1: Trace a batch before taking an FFT</summary>Use b*distance+x*stride independently for input and output. The final touched element gives the minimum extent after adding one, but does not tell you the full padded allocation chosen by the project.</details>

<details><summary>Hint 2: Use four roots of unity</summary>For a negative exponent, the length-4 roots are 1, -i, -1, i. Compute the impulse batch separately so that a reversed sign cannot be hidden by reordering both the forward and inverse operations.</details>

## Exercise 3: Separate reuse, concurrency, and startup

**Goal:** Review a proposed two-worker pipeline without turning a plan cache into a correctness or performance claim.

**Constraints:** Worksheet plan A requires 4096 workspace bytes and plan B requires 6144; the budget is 8192 bytes. These are hypothetical post-plan query values, not measurements. A and B have separate streams and writable I/O. Consider concurrent execution versus explicit serialization. Separately audit a fresh-process timing proposal and FP32 real-side LTO R2C callbacks on 13.3.1 at lengths 17554 and 8192.

**Expected evidence:** Compute concurrent and serialized workspace requirements; draw completion edges protecting reuse and cleanup; give partial-initialization failure handling. Define separate blank ledgers for host planning, cache state, first execution, and warmed transforms. Classify the two callback lengths using the complete known-issue conjunction.

**Acceptance criteria:** Do not overlap executions on one shared workspace. Budget acceptance does not allocate memory. Query success, attachment, actual capacity, lifetime, and device/context must all hold. A fresh process is not a cold driver cache. Distinguish four-part cuFFT package identity from the loaded major/minor/patch API. No claimed timing, cache hit, callback result, or GPU correctness is submitted.

<details><summary>Hint 1: Sum concurrent ownership, maximize sequential capacity</summary>Separate workers need exclusive scratch while their executions overlap. Reuse is possible only after a completion dependency, not merely after the previous host submission returns.</details>

<details><summary>Hint 2: Keep every hazard condition</summary>Factor 17554 as 2*67*131 and 8192 as 2^13. The real-side LTO warning also specifies even length and precision-dependent thresholds. Missing the warning's conjunction is not a general proof of support.</details>

## Next

Compare the [solutions](/en/libraries/cufft-plans-layouts-startup/solutions/), then revisit [PB-R4-013](/en/practice/#pb-r4-013), [PB-R4-014](/en/practice/#pb-r4-014), and the canonical [EX19](/en/examples/cufft-batched-transform/). Sources: [SRC-CUDA-073](/en/sources-and-versions/#src-cuda-073) and [SRC-CUDA-074](/en/sources-and-versions/#src-cuda-074), checked **2026-09-08**. Static answers do not upgrade EX19's independent evidence.
