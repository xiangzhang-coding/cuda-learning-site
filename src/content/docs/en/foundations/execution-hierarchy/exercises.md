---
title: 'F02 Exercises: Decompose the Execution Hierarchy and Ownership'
description: Check launch-instance classification, two-dimensional boundary prediction, and unordered scheduling reasoning through three independent tasks.
pairId: f02-exercises
counterpart: /foundations/execution-hierarchy/exercises/
factCheckDate: '2026-08-26'
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
unitId: F02-EXERCISES
prerequisites:
  - F02
relatedUnits:
  - F02
  - VIS01
  - VIS02
  - F03
exampleIds:
  - EX03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F02 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F02,VIS01,VIS02,F03' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/execution-hierarchy/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F02: Understanding the CUDA Execution Hierarchy](/en/foundations/execution-hierarchy/) first. All three Exercises require only static reasoning. They need no GPU and produce no compilation or runtime evidence.

## How to answer

Write a reviewable equation, classification, or schedule table before opening hints in order. Do not substitute a final state from [VIS01](/en/visuals/kernel-journey/) or [VIS02](/en/visuals/indexing/) for a prediction; use those pages to check concepts only after completing an answer. Solutions live on the separate [reviewed-solutions page](/en/foundations/execution-hierarchy/solutions/).

## Exercise 1: Separate a function from two launches

A program defines `__global__ void classify(...)` once and then performs two launches:

```text
Launch A: gridDim = (3, 1, 1), blockDim = (64, 1, 1)
Launch B: gridDim = (2, 2, 1), blockDim = (16, 8, 1)
```

**Goal:** Build a type-and-instance map for the kernel function, both grid instances, their blocks, threads, warp/lane groups, and the SMs that could receive blocks. Calculate the block, thread, and warp counts for each launch.

**Constraints:** Count exactly one source function and two dynamic grids. Restart warp partitioning from local ID 0 inside every block. Do not draw an SM as an execution-configuration coordinate. Add no block dispatch or completion order.

**Expected evidence:** A table or relationship diagram that gives “definition or instance,” count, containment, derivable facts, and unguaranteed facts for each item, with equations.

**Acceptance criteria:** Keep the two launches' grid identities separate; calculate every block, thread, and warp total for A and B correctly; do not merge thread-block and warp boundaries; state that an execution configuration chooses neither a particular SM nor block order.

<details><summary>Hint 1</summary>Calculate `gridDim.x * gridDim.y * gridDim.z` and `blockDim.x * blockDim.y * blockDim.z` separately.</details>

<details><summary>Hint 2</summary>Each A block has 2 warps; each B block has 4. Launching does not increase the function count.</details>

## Exercise 2: Predict two-dimensional boundary ownership

A logical array has width `53`, height `19`, and an x-fastest row-major layout. `blockDim = (16, 8)`. Focus on the final block and inspect `threadIdx = (4, 2)`, `(5, 2)`, and `(4, 3)`.

**Goal:** Calculate `gridDim` and the final `blockIdx`, then derive global coordinates, local linear ID, warp, lane, per-axis bounds, and the data index when valid for all three specified threads.

**Constraints:** Write ceiling division, global-coordinate, and x-fastest local-linearization equations before substitution. Test each axis separately. Calculate an accessible row-major `dataIndex` only when both axes are valid. Do not run code and infer the answer afterward.

**Expected evidence:** A table containing configuration, `blockIdx`, `threadIdx`, global `(x, y)`, local ID, warp/lane, x/y bounds, ownership, and `dataIndex`.

**Acceptance criteria:** Find the two-dimensional grid and boundary block correctly; calculate local IDs and warp/lane positions for all three threads; identify the final element's owner, one x-bound failure, and one y-bound failure; never linearize an out-of-bounds coordinate into a legal access.

<details><summary>Hint 1</summary>`gridDim = (ceil(53 / 16), ceil(19 / 8))`; each coordinate of the final block is one less than the corresponding grid dimension.</details>

<details><summary>Hint 2</summary>The 2D local ID is `threadIdx.x + 16 * threadIdx.y`; divide by and take the remainder modulo 32.</details>

## Exercise 3: Construct two legal scheduling explanations

Consider a grid with four independent blocks, `B0`, `B1`, `B2`, and `B3`. To make a table possible, assume two eligible SMs each receive one block at a time and every block can execute on either SM. This is a logical scheduling exercise, not a hardware measurement model.

**Goal:** Construct two block-assignment tables with different orders that both satisfy the CUDA hierarchy contract. Then judge these statements: `blockIdx` order guarantees dispatch order; one block's threads remain on one SM; lane IDs give per-thread time order; launching the same function again reuses the original grid.

**Constraints:** Place all four blocks exactly once in each table. Do not split one block across SMs. Do not claim either table was observed. Add no timing, speed, occupancy, or implicit cross-block synchronization conclusion.

**Expected evidence:** Two tables with scheduling steps and SM columns, plus four true/false judgments. Justify every judgment with a grid, block, warp/lane, or SM boundary.

**Acceptance criteria:** The two orders differ and are both legal; state that block dispatch and completion order are not promised; preserve the one-block-to-one-SM boundary; reject lane as a time order and reject a second launch as the original grid.

<details><summary>Hint 1</summary>Start with `SM0: B2 -> B3` and `SM1: B0 -> B1`, then exchange initial and later blocks for a second table.</details>

<details><summary>Hint 2</summary>Coordinates identify work; they are not queue numbers. Warp/lane values identify execution grouping; they are not a per-thread timetable.</details>

## Next step

Finish all three tasks independently, then inspect the [reviewed solutions](/en/foundations/execution-hierarchy/solutions/). Continue checking hierarchy and equations in [VIS01](/en/visuals/kernel-journey/) and [VIS02](/en/visuals/indexing/), and retain the PB-R1-006 entry point in the [Practice Bank](/en/practice/#pb-r1-006).
