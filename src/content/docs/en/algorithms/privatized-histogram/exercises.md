---
title: 'A04 Exercises: Atomic Correctness, Contention, and Histogram Privatization'
description: Use three tasks to trace a lost update, prove shared-histogram phases, and design a variant comparison that stays within the evidence boundary.
pairId: a04-exercises
counterpart: /algorithms/privatized-histogram/exercises/
factCheckDate: '2026-08-30'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: A04-EXERCISES
prerequisites:
  - A04
relatedUnits:
  - A04
  - EX13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'A04,EX13' }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/privatized-histogram/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [A04: Privatized Histogram](/en/algorithms/privatized-histogram/) first. The tasks require exact-count tables, a phase ledger, and a measurement plan. They require no GPU and produce no runtime evidence.

## Instructions

For each task, label correctness, contention, and evidence separately. Do not use a conclusion from one dimension as a substitute for another.

## Exercise 1: Expose a lost update, then restore the exact count

**Goal:** Two threads concurrently increment one bin whose initial value is 0. Write one interleaving where plain read-modify-write loses an update, then state the legal result set for `atomicAdd`.

**Constraints:** The plain trace contains two reads and two writes; the atomic trace treats each read-modify-write as indivisible; discuss one valid bin only; the counter does not overflow.

**Expected evidence:** Two event timelines, their final counters, and an explanation separating atomic correctness from contention.

**Acceptance criteria:** A plain interleaving can incorrectly produce 1 from 0; two `atomicAdd` operations must produce the exact result 2; neither atomic order loses an update; this does not establish low contention or faster execution.

<details><summary>Hint 1</summary>Place both plain reads before either write.</details>

<details><summary>Hint 2</summary>Atomic order may vary, but both increments must appear in the final value.</details>

## Exercise 2: Prove the privatized phase order

**Goal:** For `bin_count = 10` and `blockDim.x = 4`, write pseudocode for a block-private shared histogram covering cooperative zero, first barrier, shared updates, second barrier, and global merge.

**Constraints:** Zero and merge use stride loops; a thread with an invalid sample still reaches both barriers; shared update and global merge use `atomicAdd` where destinations can conflict; do not assume bin count equals thread count.

**Expected evidence:** Five-phase pseudocode, the zero/merge bin list for every lane, and two barrier happens-before statements.

**Acceptance criteria:** Lanes 0..3 cover bins `0,4,8`, `1,5,9`, `2,6`, and `3,7`; the first barrier lies between all zero writes and any update; the second lies between all updates and any merge read; no early return crosses the barrier region.

<details><summary>Hint 1</summary>The stride-loop index is `threadIdx.x + k * blockDim.x`.</details>

<details><summary>Hint 2</summary>An invalid sample skips only its update, not a phase boundary.</details>

## Exercise 3: Compare distributions without prewriting a speedup

**Goal:** For four bins and inputs `uniform = [0,1,2,3,0,1,2,3]` and `skewed = [0,0,0,0,0,0,0,0]`, compute exact histograms, list global-atomic destination sequences, and write a measurement plan for direct and privatized variants.

**Constraints:** Both variants use the same input and bin contract; exact-compare CPU and GPU outputs first; declare the Environment Manifest, launch, warm-up, and timing boundary; enter no unobserved timing, throughput, or speedup.

**Expected evidence:** Two exact count vectors, two destination traces, a controlled-variable table, and three fields for future recorded observations.

**Acceptance criteria:** Uniform counts are `[2,2,2,2]`; skewed counts are `[8,0,0,0]`; the skewed trace identifies the same hot bin; the plan places a correctness gate before performance interpretation; result fields remain unrecorded.

<details><summary>Hint 1</summary>A destination sequence describes address concentration, not a timing result.</details>

<details><summary>Hint 2</summary>Record at least the exact kernel variant, input fixture, and complete Environment Manifest.</details>

## Next

After completing the tasks, inspect the separate [reviewed solutions](/en/algorithms/privatized-histogram/solutions/), then review EX13 `histogram-kernels` with the same phase ledger.
