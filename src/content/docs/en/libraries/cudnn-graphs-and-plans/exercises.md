---
title: 'L10 Exercises: Tensor Contracts, Candidate Gates, and Reuse'
description: Produce three static review packets covering graph semantics, a hypothetical workspace-and-build decision, and cache/serialization validation without inventing execution evidence.
pairId: l10-exercises
counterpart: /libraries/cudnn-graphs-and-plans/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L10-EXERCISES
prerequisites: [L10]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l10-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cudnn-graphs-and-plans/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: L10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L10 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cudnn-graphs-and-plans/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L10](/en/libraries/cudnn-graphs-and-plans/) first. These are static Exercises, not CUDA implementations or Labs. They require no GPU. All four evidence arrays are empty; candidate sizes and outcomes below are constructed teaching inputs, not NVIDIA query results.

## Submission requirements

Use backend **9.24.0** and independently pinned frontend **1.27.0**, commit `f77fbc3d21be3f24cd0286b9b368105f7c518b8a`. Submit descriptions, calculations, rejection reasons, and a future validation protocol, not complete source code or invented logs. Separate “specified,” “eligible for the next check,” “built,” and “numerically accepted.” Finish before opening the [solutions](/en/libraries/cudnn-graphs-and-plans/solutions/).

## Exercise 1: Describe the graph without choosing an engine

**Goal:** Specify a 1x1 cross-correlation followed by channel bias and ReLU, and show how logical coordinates reach the actual bytes.

**Constraints:** Use one group, zero padding, unit spatial stride and dilation, no accumulation from old Y, and no activation upper clip. X, W, bias, and Y are genuinely FP16; compute and the two internal tensors (convolution result and biased result) are FP32. Those internal tensors are virtual; Y is observable. Logical dimensions and element strides are:

| Tensor | Logical axes | Dimensions | Element strides |
| --- | --- | --- | --- |
| X | N,C,H,W | `[1,2,2,3]` | `[12,1,6,2]` |
| W | K,C,R,S | `[3,2,1,1]` | `[2,1,2,2]` |
| bias | N,K,H,W | `[1,3,1,1]` | `[3,1,3,3]` |
| Y | N,K,H,W | `[1,3,2,3]` | `[18,1,9,3]` |

Do not swap logical axes to make a layout name look familiar. Do not assume this tiny shape has a supporting cuDNN engine. Inputs and Y occupy separate allocations; the worksheet supplies no actual addresses or alignment guarantees.

**Expected evidence:** An operation/edge inventory; the output equation and dimension derivation; element and byte offsets for `X[0,1,0,2]` and `Y[0,2,1,1]`; minimum tensor storage extents; UID-to-buffer and lifetime obligations; and an independent-reference design.

**Acceptance criteria:** Bias broadcasts over N/H/W, not channels. Compute type does not relabel buffer bytes. Internal virtual tensors are not caller-bound outputs, but do not imply zero workspace or one kernel. Distinguish frontend validation, backend support, plan build, actual buffer legality, completion, and numerical acceptance. Derive reference values from stored FP16 inputs with independent accumulation, bias, activation, output rounding, and a separately declared tolerance policy.

<details><summary>Hint 1: Keep axes and strides separate</summary>Use the dot product of a logical index and element strides. Multiply by two only when converting an FP16 element offset to bytes. The channel-fast layout does not rename the logical C axis.</details>

<details><summary>Hint 2: Follow the reduction and the edges</summary>A 1x1 filter reduces only over C here. Which tensors cross the application boundary, and which exist only between convolution, addition, and activation?</details>

## Exercise 2: Reject candidates without inventing a winner

**Goal:** Audit the same hypothetical candidate list as L10 and write a failure-aware decision process from discovery to future acceptance.

**Constraints:** Total execution-scratch budget is 8 MiB; backend filter is 8 MiB; current actual allocation is 6 MiB; exclude `NONDETERMINISTIC`. The graph needs 2 MiB frontend scratch. `1 MiB = 1,048,576 bytes`. C0-C4 are worksheet labels, not engine identifiers. Sizes and the C3 outcome are stipulated, not observed or guaranteed discovery outputs.

| Candidate | Backend MiB | Frontend MiB | Total MiB | Stipulated property or outcome |
| --- | --- | --- | --- | --- |
| C0 | 2 | 2 | 4 | `NONDETERMINISTIC` |
| C1 | 9 | 2 | 11 | No excluded numerical note |
| C2 | 7 | 2 | 9 | No excluded numerical note |
| C3 | 4 | 2 | 6 | No excluded numerical note; hypothetical support acceptance, then build failure |
| C4 | 5 | 2 | 7 | No excluded numerical note; support/build not yet attempted |

**Expected evidence:** A per-row decision with the earliest known rejection and remaining obligations; the staged lifecycle with filters inserted; a comparison of `HEURISTICS_CHOICE` and `ALL`; the checked total-size/allocation/lifetime protocol; and branches for an empty candidate list and a later device execution error.

**Acceptance criteria:** Exclude C0 without declaring every Tensor Core engine nondeterministic. Reject C1 by backend cap and C2 by total budget. C3 supplies no executable plan. C4 fits the 8 MiB budget but not the 6 MiB allocation and is **not an observed success**. Never treat existential `check_support` as support for all rows or `ALL` as measured selection. A permitted allocation of at least 7 MiB is only one remaining condition, not proof of success. An empty list leads to same-policy FALLBACK, a semantics-preserving independently validated decomposition, or explicit unsupported status, never blind access to candidate zero.

<details><summary>Hint 1: There are two resource comparisons</summary>The backend cap cannot see frontend node scratch. Even after the sum fits the budget, compare it with actual capacity; setting either cap has allocated nothing.</details>

<details><summary>Hint 2: Name the failed stage</summary>Discovery, existential support, plan construction, execution completion, and numerical acceptance are different claims. Which stages have never been attempted for C4? Why is a device failure not just another build rejection?</details>

## Exercise 3: Design reuse and validation boundaries

**Goal:** Design a conservative cache/restore policy and a correctness-and-timing protocol for a future external implementation.

**Constraints:** Treat each of these as an independent hypothetical change to a cached fixed-shape plan with a recorded 7 MiB total requirement and an 8 MiB budget: only input contents/pointers change; the budget falls to 6 MiB; backend/build identity changes; target hardware changes. Separately consider a dynamic graph-key match after a shape/stride override, and an attempt to serialize `NCHW_VECT_C`. No cache hit, build, restore, or timing was actually observed.

**Expected evidence:** A cache table separating application graph/plan, default backend kernel, and explicit custom kernel caches; an invalidation decision for every change; distinctions between graph JSON and selected-plan UBJSON; a proposed Native Linux Environment Manifest; and separate blank result fields for cold cost, warm cost, reference error, repeatability, and failure stage.

**Acceptance criteria:** An unchanged semantic contract can reuse an application entry only after current buffer/resource checks; a 6 MiB budget excludes a 7 MiB requirement. Library/build or hardware changes trigger review/rebuild rather than blind restore. A graph-key match is not a complete policy or device match; override workspace must be queried for actual shapes/strides before allocation, with the 9.23.0 backend gate recorded. Default kernel-cache controls do not define custom-cache eviction. Restoring a selected plan does not restore the original list/index, and `run_warmup=true` makes default handle-based restore more than pure parsing. Avoid serialization of the known affected `NCHW_VECT_C` layout. State independent-reference and determinism tests before measuring; do not claim compatibility, restore, or a cache hit establishes accuracy or speed.

<details><summary>Hint 1: Ask what the cache stores</summary>Compiled CUBINs are not a validated application selection. Graph JSON is not a selected plan. Which missing policy/device fields must the application retain alongside a graph key?</details>

<details><summary>Hint 2: Define cold before timing it</summary>A plan miss can still hit a kernel cache, and restore can warm up. Which host costs, device work, cache states, and synchronization boundaries would your report have to name?</details>

## Next

Compare with the [separate solutions](/en/libraries/cudnn-graphs-and-plans/solutions/) and [PB-R4-011](/en/practice/#pb-r4-011). Source basis: [L10](/en/libraries/cudnn-graphs-and-plans/), backend [SRC-CUDA-071](/en/sources-and-versions/#src-cuda-071), and frontend [SRC-CUDA-072](/en/sources-and-versions/#src-cuda-072), reviewed **2026-09-07**. Related [L11](/en/libraries/attention-backend-dispatch/) is not an additional prerequisite or evidence for these tasks.
