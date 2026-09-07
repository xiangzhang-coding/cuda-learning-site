---
title: 'L08 Exercises: Numerical Chains, Architecture Gates, and Warp Safety'
description: Separate input and output rounding, WMMA interfaces and native capabilities, and participation and memory conditions for tail tiles in three original static Exercises.
pairId: l08-exercises
counterpart: /libraries/tensor-core-precision-contracts/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L08-EXERCISES
prerequisites: [L08]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l08-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/tensor-core-precision-contracts/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-07' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L08 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/libraries/tensor-core-precision-contracts/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L08](/en/libraries/tensor-core-precision-contracts/) first. Its direct prerequisites remain `Q02, L06, F06`; this Exercise set directly requires only `[L08]`. Use a C++17 reading perspective. Only paper derivations and contract review are required, with no GPU, compilation, or complete CUDA implementation.

## Submission requirements

Use the current 13.3, archived 12.9.2, and PTX contracts reviewed on 2026-09-07 in [SRC-CUDA-069](/en/sources-and-versions/#src-cuda-069). Expected evidence means derivations and review records, not runtime observations. All four evidence arrays stay empty, and no Evidence Status is granted. Do not invent GPU outputs, instructions, or speed. Finish before opening the [separate solutions](/en/libraries/tensor-core-precision-contracts/solutions/).

## Exercise 1: What happens between two conversions?

**Goal:** Build the complete numerical chain for one GEMM output, separating input conversion, accumulation, epilogue, and final storage responsibilities.

**Constraints:** Original FP32 row `a=[2+2^-10,2]`, column `b=[1,-1]`, and `alpha=1/4,beta=1,C=1+2^-11`. The candidate first converts A/B to FP16 with round-to-nearest-even, selects FP32 Accumulator Type, computes scaling and addition of C in FP32, and finally stores FP16 D with round-to-nearest-even. Saturation is disabled. For reference construction only, evaluate dot products algebraically exactly; this specifies no WMMA accumulation order. The application predeclares finite-output acceptance `abs(got-R_original) <= 2^-11`; do not relax it.

**Expected evidence:** A six-column ledger for original inputs, stored inputs, actual multiplicands, accumulator, epilogue, and D. Independently derive pre-store `U_original/U_stored` from original and converted inputs, then apply the same output conversion to obtain `R_original/R_stored`. Calculate the reference difference at each stage and each output-rounding displacement. Describe a legal float-fragment store followed by explicit conversion, and judge whether the ideal converted-input answer meets original-problem acceptance.

**Acceptance criteria:** Explain the two rounding-midpoint decisions. Do not compute the original dot product first and call that input conversion; C retains its specified FP32 value. Separate input loss from output conversion and explain why wider accumulation cannot restore earlier information. Keep independent original-input and converted-input references. Do not generalize the finite-value threshold into a universal GEMM error bound; reject non-finite values separately and claim no actual `got`.

<details><summary>Hint 1: Locate neighboring representable values first</summary>FP16 upward spacing at 2 differs from spacing at 1. Write the neighbors and test whether the input is exactly halfway between them. The even part of round-to-nearest-even concerns retained significand bits.</details>

<details><summary>Hint 2: Label reference stages</summary>Keep both U values after scaling and addition of C before converting each into R. Do not subtract a pre-store value from a post-store value when comparing input effects.</details>

## Exercise 2: API eligibility is not proof of native capability

**Goal:** Produce an auditable WMMA type/architecture decision table that separates historical API/PTX minima, current compilation targets, native Tensor Core capabilities, and actual instruction evidence.

**Constraints:** For each C++ WMMA path, FP16, BF16, TF32, FP64, and INT8, record A/B types, C/D accumulator-fragment types, every legal `M x N x K` tile, and the API/PTX minimum target. Then review four proposals: BF16 on CC 8.0 with half accumulation; TF32 on CC 7.5 loading unconverted float with ordinary float input fragments and `16x16x16`; double on CC 8.6 using `8x8x4` and claiming native FP64 acceleration solely from CC ordering; and INT8 mixing signed/unsigned inputs while recommending CUDA 13 generation of `sm_72` because of the historical interface floor.

**Expected evidence:** The complete five-row contract table and itemized repairs for all four proposals; the explicit CC set for native FP64 in the current table; TF32's storage/conversion/fragment relationship; separate integer final-output conversion obligations; and the evidence still required from future compilation, instruction inspection, and execution respectively.

**Acceptance criteria:** Do not replace types and shapes with generic Tensor Core support, confuse C++ WMMA with every underlying MMA shape, or treat an API floor as a native-FP64 whitelist or current-toolchain promise. Distinguish INT8's historical floor from the site's CC 7.5 baseline. Neither guess lowering on uninspected targets nor derive performance from a table.

<details><summary>Hint 1: A configuration can contain several errors</summary>Check input types, accumulator types, shape, and target separately. Repairing one cell does not automatically legalize the remaining cells.</details>

<details><summary>Hint 2: Separate two architecture questions</summary>Where an interface starts is a lower-bound question; which CCs the current native-type table lists is a membership question. Track compiler acceptance separately rather than turning a historical target into a recommended command.</details>

## Exercise 3: An aligned tail can still be out of bounds

**Goal:** Prove warp participation, addresses, complete storage, and reuse synchronization for the last K step of FP16 WMMA `16x16x16`.

**Constraints:** `D=A*B`, with `M=19,N=21,K=23`. A/B are row-major half, D is row-major float, all three row strides are 24 elements, and each base is 32-byte aligned. Inspect `(m0,n0,k0)=(16,16,16)`. The initial proposal directly loads unpadded tails and exits lanes without valid output coordinates. An alternative uses staging bases also aligned to 32 bytes, but offsets half storage by 8 elements with `ldm=24` and uses `ldm=18` for float output. In a two-warp block, the producer warp fills shared staging storage and the consumer warp performs WMMA; the proposal relies only on WMMA synchronization to permit producer overwrite and infers output coordinates from `fragment.x[i]`. Preserve the logical problem.

**Expected evidence:** Element offsets, byte offsets, and residues modulo 32 for original A/B load and D store starts; independent judgments for alternative starts and strides; valid A/B/D extents at the last step; complete staging capacity, zero-fill, and valid-output copy plans; and ordered cross-warp publication, last-read, and reuse phases.

**Acceptance criteria:** Prove extents rather than treating base alignment as complete-tile safety. Every consumer lane participates in matching collectives; neither early exit nor guessed fragment coordinates handle edges. Check half/float stride units and rules separately without extrapolating to every type, and retain the accumulator across K steps. Synchronization covers producer and consumer warps; warp synchronization is neither host completion nor observed race-freedom evidence.

<details><summary>Hint 1: Prove starts and extents separately</summary>Row-major offsets are `row*ld+column`; half and float have different element sizes. After checking the start modulo 32, ask whether the last row and column accessed by the complete tile exist.</details>

<details><summary>Hint 2: Invalid data does not mean absent participants</summary>Define every location in a complete input tile before collective loading. Draw separate write-before-read and read-before-overwrite edges for shared storage, not just the WMMA call.</details>

## Next

Compare the [separate solutions](/en/libraries/tensor-core-precision-contracts/solutions/), then complete [PB-R4-009](/en/practice/#pb-r4-009). Sources: [L08](/en/libraries/tensor-core-precision-contracts/) and [SRC-CUDA-069](/en/sources-and-versions/#src-cuda-069), reviewed **2026-09-07**. Scenarios and derivations are original, with no copied upstream code or inherited Runnable Example or Lab evidence.
