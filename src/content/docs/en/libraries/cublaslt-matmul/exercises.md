---
title: 'L07 Exercises: Descriptors, Candidates, and Bias Orientation'
description: Prove layout, resource filtering, and epilogue semantics in three static review packets while preserving fallback, invalidation, and runtime-evidence boundaries.
pairId: l07-exercises
counterpart: /libraries/cublaslt-matmul/exercises/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L07-EXERCISES
prerequisites: [L07]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l07-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cublaslt-matmul/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: L07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L07 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cublaslt-matmul/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L07](/en/libraries/cublaslt-matmul/) first. These are static derivations. Candidates in the task are constructed review inputs, not results of any NVIDIA query. No GPU is required, and all four evidence arrays are empty.

## Submission requirements

Use the 12.9.2 archive contract. State the goal, configuration, rejection conditions, and remaining validation obligations for each task. Supply no complete CUDA implementation and infer no real algorithm's existence, correctness, or speed from the task inputs. Finish before opening the [separate solutions](/en/libraries/cublaslt-matmul/solutions/).

## Exercise 1: Describe storage, not intentions

**Goal:** Build an object/attribute record for `D = 1.5*op(A)*B + 0.25*C`, explaining how layout and transposition interact.

**Constraints:** `op(A):3 x 2`; A uses T and is stored row-major `2 x 3, ld=4`. B is row-major `2 x 5, ld=7`. Disjoint C/D are row-major `3 x 5` with leading dimensions 6 and 8 respectively. All storage is FP32, with `CUBLAS_COMPUTE_32F_PEDANTIC`, FP32 scale type, host pointer mode, and default epilogue. Do not treat C as freely transposable or compare only layout attributes when changing to in-place output.

**Expected evidence:** Create/set/destroy inventory for handle, operation, four layouts, and preferences; attribute ownership; a derivation mapping one logical A element to its stored offset; and a stream/scalar/matrix lifetime plan.

**Acceptance criteria:** A's layout remains `2 x 3` and the operation retains T. C/D have identical type, shape, and order, differing only in stride. In-place use would require the same C/D pointer and the same layout-descriptor object. Check all creation/setter statuses. Layout creation is not device-data allocation, and valid descriptors are not successful execution.

<details><summary>Hint 1: Assign fields to objects</summary>Does each field change the mathematical operation or interpret existing bytes? Compute type belongs to the operation; stored row count belongs to a layout.</details>

<details><summary>Hint 2: Trace one element</summary>Which stored A row and column supply `op(A)[1,0]`? Use row stride 4 rather than reallocating for the logical transpose.</details>

## Exercise 2: Do not blindly use the first candidate

**Goal:** Write a decision process for the constructed filtering scenario below, separating search budget, actual capacity, and candidate usability.

**Constraints:** A query requests four entries and hypothetically succeeds with three. Entry 0 has failed state and unusable remaining fields. Entry 1 succeeds and requires 2 MiB. Entry 2 succeeds and requires 512 KiB. The preference budget is 4 MiB, but actual workspace is only 1 MiB and is 256-byte aligned. All four matrix pointers guarantee only 64-byte alignment, yet the query retained default 256-byte alignment preferences. No real algorithms, timings, or numerical outputs are supplied. Also handle zero entries from the corrected query, a not-supported call, and a device execution failure.

**Expected evidence:** Readable entry ranges and rejection reasons; corrected preferences and requery steps; separate meanings of `AlgoCheck`, execution, synchronization, independent reference, and timing; and a semantics-preserving fallback plan.

**Acceptance criteria:** Do not access entry 3 or read failed entry 0's workspace/algorithm fields. A 4 MiB preference is not an allocation; entry 1 exceeds real capacity. Entry 2 fits capacity but cannot be promised usable or fastest under a false alignment claim. Requery with actual alignment, do not access element zero after zero candidates, and do not blindly retry in a failed execution context. Every fallback retains numerical policy and mathematical semantics.

<details><summary>Hint 1: Count, state, and resources are separate gates</summary>Array capacity is not returned count. Query success is not per-entry success. Fitting the budget is not fitting the allocation.</details>

<details><summary>Hint 2: Audit the truth of the inputs</summary>Even if workspace fits, what did search incorrectly assume about the pointers? Why can `AlgoCheck` still miss actual-address problems?</details>

## Exercise 3: Bias orientation and invalidation

**Goal:** Describe a legal five-element output-feature bias plus ReLU for row-major `Y:3 x 5`, then define selection-reuse boundaries.

**Constraints:** The original problem is `Y[i,j] = max((A*B)[i,j] + bias[j], 0)`. A is row-major `3 x 2, ld=4`; B is row-major `2 x 5, ld=8`; Y has row stride 7. All data is FP32, `alpha=1,beta=0`, and bias is a packed five-element device vector. Under 12.9.2, do not directly combine row-major D with `RELU_BIAS`. Changing only D's order enum is forbidden, and no candidate is guaranteed on an arbitrary GPU.

**Expected evidence:** The complete transposed equation and A/B/C/D layout plan; bias broadcast direction and reference formula; pointer indirection for the bias attribute; a semantics-preserving no-candidate alternative; and a conservative reuse key. Judge changes to data contents only, leading dimension, reduced available workspace, weaker alignment, and library-component version separately.

**Acceptance criteria:** The legal candidate configuration describes D as column-major `5 x 3`; five bias elements match D rows and original Y columns. The column-major interpretation matches original Y bytes. Resource and algorithm support still need validation. Keep the application key separate from the internal heuristics cache and do not blindly restore serialized algorithms across component versions. Any winner requires actual measurements after numerical acceptance; this task has none.

<details><summary>Hint 1: Change output coordinates first</summary>When Y is interpreted as column-major `Y^T`, which descriptor dimension corresponds to original feature j? ReLU acts elementwise.</details>

<details><summary>Hint 2: Reprove inputs and reuse conditions</summary>An outer ordinary transpose reverses multiplication order. Changed layout/resource conditions cannot be handled by a key of three original dimensions alone.</details>

## Next

Review the [solutions](/en/libraries/cublaslt-matmul/solutions/) and [PB-R4-008](/en/practice/#pb-r4-008). [EX18](/en/examples/cublas-gemm/) and [LAB12](/en/labs/compare-gemm-with-cublas/) are traditional FP32 comparisons, not runtime evidence for these Lt tasks. Source basis: [L07](/en/libraries/cublaslt-matmul/) and [SRC-CUDA-068](/en/sources-and-versions/#src-cuda-068), reviewed **2026-09-06**.
