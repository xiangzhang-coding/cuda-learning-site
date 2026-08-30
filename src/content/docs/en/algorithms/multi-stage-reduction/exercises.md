---
title: 'A02 Exercises: Trace Reduction Stages and Operation Order'
description: Trace multi-stage partials, repair a conditional barrier, and write floating-point-order and CUB-production contracts in three tasks.
pairId: a02-exercises
counterpart: /algorithms/multi-stage-reduction/exercises/
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
unitId: A02-EXERCISES
prerequisites:
  - A02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a02-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/multi-stage-reduction/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A02 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/multi-stage-reduction/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [A02: Multi-Stage Reduction, Barriers, and Operation Order](/en/algorithms/multi-stage-reduction/) first. These Exercises treat multi-stage reduction as a static phase proof. They require no GPU and do not relabel expected reasoning as a runtime observation.

## Instructions

For every stage, submit `lane role -> reads -> write -> barrier participation`. Across blocks, draw the global partial array and the next kernel launch separately. Work independently before inspecting the [reviewed solutions](/en/algorithms/multi-stage-reduction/solutions/).

## Exercise 1: Trace two blocks and the final partial

**Goal:** For integer inputs `1..13` and eight lanes per block, trace two blocks in the first sum-reduction kernel and the second kernel. Each block uses shared slots, identity zero, and strides `4, 2, 1`.

**Constraints:** Invalid lanes in the edge block write zero; all eight lanes reach a barrier after the initial load and after every combine stage; inactive lanes do not combine but do not return; each block writes exactly one value to the global partial array.

**Expected evidence:** Two lane/stage tables, the participant count at every barrier, the first kernel's partial array, and the final tree in the second kernel.

**Acceptance criteria:** The first block partial is 36, the second is 55, and the next kernel produces 91; the edge shared slots are `[9,10,11,12,13,0,0,0]`; every declared barrier has eight participants; no invalid lane reads out-of-bounds input.

<details><summary>Hint 1</summary>At stride 4, lane 0 combines slots 0 and 4, lane 1 combines 1 and 5, and so on.</details>

<details><summary>Hint 2</summary>The second block's first-stage partials are `[22,10,11,12]`.</details>

## Exercise 2: Repair an inactive-lane early return and conditional barrier

**Goal:** Repair the following incorrect phase skeleton and explain the hazard removed by each change.

```text
if global_index >= n: return
shared[tid] = input[global_index]
for stride = block_size / 2 down to 1:
  if tid < stride:
    shared[tid] = shared[tid] + shared[tid + stride]
    __syncthreads()
```

**Constraints:** Retain bounds handling; use the operation identity; every block thread executes the same barrier sequence; no barrier may be inside the active predicate; do not replace the block proof with a warp-synchronous assumption, an atomic, or a grid-wide busy wait.

**Expected evidence:** Repaired pseudocode, a before-and-after control-flow graph, and explanations of out-of-bounds reads, uninitialized slots, barrier nonparticipation, and stale next-stage reads.

**Acceptance criteria:** An invalid input lane writes identity; an initial barrier publishes the complete shared array; only active lanes combine at each stage and all lanes then reach the barrier; no return crosses the barrier region; lane 0 commits the block partial only after the final stage.

<details><summary>Hint 1</summary>Turn the bounds branch from a control-flow exit into value selection.</details>

<details><summary>Hint 2</summary>The active predicate encloses only the combine, not the following barrier.</details>

## Exercise 3: Declare floating-point order and a production decision

**Goal:** For `[1e20f, 1.0f, -1e20f, 1.0f]`, parenthesize a serial left fold and an adjacent-pair tree, explain the possible rounding difference, and write a production comparison plan for CUB `DeviceReduce` and a hand-written teaching reduction.

**Constraints:** Distinguish the real-number result, binary32 expected reasoning, and an actually observed result; declare the reference and tolerance before running; CUB `DeviceReduce` must be the production baseline, with hand-written code used only for learning and understanding or an evidence-supported special requirement; do not copy a CUB implementation or claim speedup.

**Expected evidence:** Two parenthesized expressions, a rounding ledger, a correctness/evidence decision table, and a plan naming the Environment Manifest and measurement boundary.

**Acceptance criteria:** The answer identifies different tree and serial operation orders; legitimate rounding variation is not treated as automatic acceptance; both paths are checked against one predeclared acceptance contract; CUB precedes the custom benchmark; no unobserved performance number or conclusion appears.

<details><summary>Hint 1</summary>Consider whether the small term survives in `1e20f + 1.0f` and `-1e20f + 1.0f`.</details>

<details><summary>Hint 2</summary>The first row of a production decision should be correctness parity, not timing.</details>

## Next

After completing the three tasks, inspect the separate [reviewed solutions](/en/algorithms/multi-stage-reduction/solutions/) and then check the tree variant with [VIS10](/en/visuals/reduction-stages/). Continue to [Q02](/en/correctness/floating-point-order-reproducibility/) for a formal numerical-acceptance contract.
