---
title: 'L06 Exercises: Derive Library Calls Rather Than Guess Arguments'
description: Audit nine transpose combinations, padded row-major mapping, and stream lifetime through three written packets with goals, constraints, evidence, and acceptance criteria.
pairId: l06-exercises
counterpart: /libraries/cublas-gemm/exercises/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L06-EXERCISES
prerequisites: [L06]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l06-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cublas-gemm/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-06' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L06 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cublas-gemm/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [L06](/en/libraries/cublas-gemm/) first. All three tasks are static derivations with no GPU requirement or complete CUDA code displayed or executed. All four evidence arrays remain empty.

## Submission requirements

Write mathematical semantics before storage and lifetime. Separate derived values, planned checks, and actual observations; these tasks contain only the first two. Use L06's pinned 12.9.2 API contract, and finish before opening the [separate solutions](/en/libraries/cublas-gemm/solutions/).

## Exercise 1: Column-major and nine transposes

**Goal:** For column-major GEMM with `m=4,n=3,k=5`, derive A/B storage shapes and leading-dimension lower bounds for every N/T/C combination, and identify the indexing boundary.

**Constraints:** C always has output shape `4 x 3`. Audit `transa=T, transb=C, lda=7, ldb=5, ldc=6` in detail, accepting padding without changing the arguments to avoid analysis. Explain C for real versus complex values. Separately, a valid nonempty vector with `incx=2` returns one-based position 3 from an index routine; derive its zero-based host element offset.

**Expected evidence:** A nine-row shape/bound table; full storage element counts and last logical element offsets for the detailed case; a returned-position conversion formula; and an explanation of retaining parent stride in a submatrix.

**Acceptance criteria:** Transposition does not rewrite `m,n,k`; leading dimensions follow storage shapes, not post-operation shapes. Allocation counts and last logical offsets are separate. GEMM addresses do not reserve an unused slot for BLAS one-based indexing, and complex conjugation is not ignored. No observed output or performance conclusion appears.

<details><summary>Hint 1: Recover storage shapes first</summary>After its operation, A has four rows and five columns. If it must first be transposed, which allocated dimension is five? Derive B independently.</details>

<details><summary>Hint 2: Check extents next</summary>Column-major allocation uses leading dimension times stored column count. The last logical offset is the last row plus the last column times stride; these are generally different values.</details>

## Exercise 2: A padded row-major comparison

**Goal:** Plan a cuBLAS call for row-major `C_out = 1.25*A*B - 0.5*C_in` without a data-transposition pass, and define an independent reference.

**Constraints:** A is `3 x 2` with row stride 4; B is `2 x 5` with row stride 8; C is `3 x 5` with row stride 7. All storage is FP32, with `CUBLAS_COMPUTE_32F_PEDANTIC` and host scalars. Preserve original C, keep `alpha,beta`, and exclude padding from logical elements.

**Expected evidence:** The transposed equation; cuBLAS operand order, `m,n,k`, both operation flags, and three leading dimensions; a double-precision reference expression for at least one output coordinate; and a validation plan covering nonsquare shapes, distinct initial C, and padding.

**Acceptance criteria:** Column-major output and application row-major output share the correct byte interpretation. The reference derives independently from original logical coordinates, not the mapping under test. State finiteness checks and L06/EX18's bounded-fixture `atol=1e-4, rtol=2e-5` contract. EX18 has its own nonzero-beta fixture, but this does not establish implementation of this exercise's particular padded layout or grant runtime evidence from paper reasoning.

<details><summary>Hint 1: Transpose the whole equation</summary>Ordinary transposition changes multiplication order but not the two real scaling coefficients. Write the transposed C before choosing which pointer comes first.</details>

<details><summary>Hint 2: Stride belongs to the allocation</summary>Matrix roles swap, not each allocation's physical row spacing. The CPU reference can still accumulate from the original problem's row-major coordinates.</details>

## Exercise 3: Repair a type and lifetime plan

**Goal:** Repair the review scenario below, identifying independent errors instead of masking everything with one device-wide synchronization.

**Constraints:** A dedicated handle h, stream S, and sufficiently large, 256-byte-aligned user workspace W belong to the selected device. The proposal sets W on h before setting S; chooses device pointer mode while passing stack `float alpha,beta`; submits input copies and GEMM; immediately launches a consumer of C on stream T with no wait edge and frees W; reads results on the host based on library return alone; and includes handle destruction in "kernel time." A variant changes A/B to FP16 while C/compute remain FP32, but also changes the scalars to FP16.

**Expected evidence:** Repaired configuration order; valid host and device scalar alternatives; an S-to-T dependency; last-use points for input, output, scalars, and W; library-status and asynchronous-error check locations; and the mixed-precision variant's scalar-type rationale.

**Acceptance criteria:** Explain that `SetStream` resets user workspace. Device mode cannot accept stack pointers; the cross-stream consumer starts after an explicit dependency; release and host observation follow the appropriate completion. Destruction/setup costs do not masquerade as GEMM device time. Mixed-precision scalars remain `float` under the support table. Stop when safe execution cannot be established; do not read stale output or invent a successful repaired run.

<details><summary>Hint 1: Separate four failure classes</summary>Overwritten configuration, wrong scalar location, missing execution dependency, and incorrect timing boundaries are distinct. Synchronization repairs only some of them.</details>

<details><summary>Hint 2: Trace back from the last user</summary>GEMM is W's last user, but T also consumes C. Device and host scalars have different lifetime endpoints. A conservative plan can wait for the final consumer before releasing resources.</details>

## Next

Review the [solutions and common errors](/en/libraries/cublas-gemm/solutions/), then audit [PB-R4-007](/en/practice/#pb-r4-007). Executable work links only to [EX18](/en/examples/cublas-gemm/) and [LAB12](/en/labs/compare-gemm-with-cublas/). Source basis: [L06](/en/libraries/cublas-gemm/) and [SRC-CUDA-067](/en/sources-and-versions/#src-cuda-067), reviewed **2026-09-06**.
