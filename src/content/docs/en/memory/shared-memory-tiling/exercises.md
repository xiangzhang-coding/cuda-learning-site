---
title: 'M03 Exercises: Prove Shared-Tile Phase Correctness'
description: Trace an edge tile, repair barrier divergence, and write invariant proofs for neutral values and loop reuse in three tasks.
pairId: m03-exercises
counterpart: /memory/shared-memory-tiling/exercises/
factCheckDate: '2026-08-27'
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
unitId: M03-EXERCISES
prerequisites:
  - M03
relatedUnits:
  - M03
  - EX06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M03,EX06' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/shared-memory-tiling/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [M03: Shared-Memory Tiling](/en/memory/shared-memory-tiling/) first. Every Exercise requires only phase traces, pseudocode, and invariants. No CUDA-capable system is needed, and an answer is not a runtime barrier observation.

## How to answer

For each task, label `L/B1/U/B2`, every thread's predicates, tile-slot value, and output action. Prove correctness before consulting the [reviewed solutions](/en/memory/shared-memory-tiling/solutions/).

## Exercise 1: Trace an edge tile

**Goal:** One block has 8 threads, input length `n = 13`, and loop bases 0 and 8. Name input values `x0..x12`; the operation is sum with neutral 0. Record every lane's tile write and barrier participation for both iterations.

**Constraints:** Lanes 0..7 write their own slot every iteration. At base 8, lanes 5..7 neither read input nor return. All 8 threads reach B1 and B2. Do not assume output validity equals load validity.

**Expected evidence:** Two 8-lane tables, an `L -> B1 -> U -> B2` timeline, and edge-iteration tile contents.

**Acceptance criteria:** First tile is `[x0,...,x7]`; second is `[x8,x9,x10,x11,x12,0,0,0]`. Every barrier has 8 participants in both iterations. Invalid loaders write 0. No thread returns before a barrier.

<details><summary>Hint 1</summary>Participation is a control-flow fact, not a load-validity fact.</details>

<details><summary>Hint 2</summary>Place B2 before the next iteration's L, not only at kernel exit.</details>

## Exercise 2: Repair early return and missing B2

**Goal:** Repair this skeleton and identify the hazard removed by every edit:

```cpp
if (input_index >= n) return;
tile[threadIdx.x] = input[input_index];
__syncthreads();
if (output_index < n) consume(tile);
// next iteration overwrites tile
```

**Constraints:** Keep input/output bounds. Use only the portable C++17 synchronous baseline. Do not introduce asynchronous copy, a warp-only assumption, or future M05 primitives. All block threads use the same loop trip count.

**Expected evidence:** Repaired pseudocode, a before/after phase graph, and separate explanations for uninitialized reads, barrier nonparticipation, and the read/overwrite race.

**Acceptance criteria:** Invalid input writes an operation-appropriate neutral. The first barrier follows every write. The output guard does not enclose a barrier. The second barrier lies between the last tile read and next overwrite. No early return crosses the barrier region.

<details><summary>Hint 1</summary>Replace return with value selection rather than deleting bounds.</details>

<details><summary>Hint 2</summary>B1 protects load -> read; B2 protects read -> next load.</details>

## Exercise 3: Write proof obligations for neutral and reuse

**Goal:** For sum over nonnegative integers and max over signed 32-bit integers, define neutral, validity rule, reuse set, and output-commit rule; then explain why “fill 0 for every operation” is false.

**Constraints:** Declare the numeric domain. Max neutral must not change any legal maximum. List which outputs can read each loaded slot. An invalid output may skip commit but not a later B2. Make no performance claim.

**Expected evidence:** Two operation contracts, a per-slot reuse map, and one counterexample.

**Acceptance criteria:** Sum neutral is 0. Signed 32-bit max can use `INT32_MIN` under the declared domain/identity contract. `0` changes an all-negative maximum. Both contracts retain B1/B2 participation. The reuse map is concrete rather than “may reuse.”

<details><summary>Hint 1</summary>Neutral must satisfy `combine(x, neutral) = x`.</details>

<details><summary>Hint 2</summary>Test the faulty max neutral with input `[-7,-3]`.</details>

## Next step

Inspect the separate [reviewed solutions](/en/memory/shared-memory-tiling/solutions/) and then repair another barrier review in [Practice Bank PB-R1-015](/en/practice/#pb-r1-015).
