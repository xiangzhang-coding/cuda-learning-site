---
title: 'M06 Exercises: Reason with explicit warp masks'
description: Trace branch masks, repair an implicit-lockstep exchange, and separate source guarantees from unknown scheduling in three static tasks.
pairId: m06-exercises
counterpart: /memory/warp-divergence-reconvergence/exercises/
factCheckDate: '2026-08-28'
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
unitId: M06-EXERCISES
prerequisites:
  - M06
relatedUnits:
  - M06
  - VIS03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M06 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M06,VIS03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/warp-divergence-reconvergence/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M06: Divergence, Reconvergence, and Warp-Safe Reasoning](/en/memory/warp-divergence-reconvergence/) first. Every task is a static mask or dependency proof; no GPU execution is requested.

## Instructions

Write lane predicates before masks, distinguish current activity from intended participation, and label unknown schedule facts as unknown. Finish all three tasks before consulting the [reviewed solutions](/en/memory/warp-divergence-reconvergence/solutions/).

## Exercise 1: Trace two branch masks and a later collective

**Goal:** For lanes 0 through 7, trace `if (lane < 3) A; else B; C;`, then define the participant set for a collective at `C` that needs all eight lanes.

**Constraints:** Show masks at `A`, `B`, and `C`. Do not assert whether hardware issues `A` or `B` first. Do not form the all-lane participant set from an `__activemask()` call inside only one arm.

**Expected evidence:** An eight-lane predicate table, three source-region masks, one intended participation mask, and a list of schedule facts left unknown.

**Acceptance criteria:** Every lane appears in exactly one branch arm and returns to the modeled common region; branch-local activity remains distinct from the all-lane collective set; path issue order is not invented.

<details><summary>Hint 1</summary>Compute the lane predicate before writing any hexadecimal mask.</details>

<details><summary>Hint 2</summary>The collective's intended members come from its algorithm, not from whichever branch happens to call a helper.</details>

## Exercise 2: Repair an implicit-lockstep exchange

**Goal:** Audit a warp in which each lane writes `shared[lane]` and lanes 1 through 7 immediately read `shared[lane - 1]` with no explicit synchronization.

**Constraints:** Keep shared memory in the first repair and provide a separate register-exchange alternative. Name all participants and guard lane 0. Do not cite “same warp” as an ordering guarantee.

**Expected evidence:** A missing-edge diagram, repaired static pseudocode for both approaches, and mask/source-lane proof obligations.

**Acceptance criteria:** The shared-memory repair includes a documented warp synchronization with a valid mask; the alternative uses a documented collective with valid source lanes; neither relies on implicit lockstep.

<details><summary>Hint 1</summary>Draw write -> synchronization -> read before choosing syntax.</details>

<details><summary>Hint 2</summary>Lane 0 has no predecessor, so participation and source validity are separate questions.</details>

## Exercise 3: Separate source facts from schedule guesses

**Goal:** Classify ten statements about a divergent `if/else` as source guarantee, API guarantee, or unknown implementation detail.

Use an eight-lane teaching subset with predicate `lane < 3`: the true path assigns scalar `result = 1`, the false path assigns `result = 0`, and both paths lead to source statement `C`. Classify these statements:

1. The per-lane predicates are true for lanes 0, 1, and 2 and false for lanes 3 through 7.
2. `true_mask = 0x07` and `false_mask = 0xf8` are disjoint and together cover every participating lane in the fixture.
3. After the `if/else`, each lane's scalar branch result is `1` on the true path and `0` on the false path.
4. The closing brace of the `if/else` has the same synchronization effect as `__syncwarp(0xff)`.
5. Because `C` is the common source successor, all eight lanes must currently execute one instance of `C` under active mask `0xff`.
6. Reaching the source-level join makes writes from either branch visible to lanes that took the other branch.
7. If every lane named by `0xff` follows its contract, a correctly used `__syncwarp(0xff)` provides documented warp synchronization for those lanes.
8. Calling `__activemask()` inside the true branch reconstructs the pre-branch group and therefore returns `0xff`.
9. The GPU always issues the true path before the false path.
10. On CC 7.0+ Independent Thread Scheduling, the exact instruction interleaving and timing of the true and false paths can be derived from this source.

**Constraints:** Include statements about lane predicates, active masks, source-level join, memory visibility, path issue order, instruction interleaving, and CC 7.0+ Independent Thread Scheduling. Correct every false statement without adding a timing claim.

**Expected evidence:** A ten-row classification table and corrected wording for each rejected statement.

**Acceptance criteria:** The answer states that a source-level join is not synchronization, marks exact path order and interleaving unknown, preserves per-lane scalar semantics, and requires documented synchronization for cross-lane data.

<details><summary>Hint 1</summary>If changing GPU implementation could alter a fact without violating the programming model, it is not a portable guarantee.</details>

<details><summary>Hint 2</summary>Control-flow eligibility and memory visibility belong in different columns.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/warp-divergence-reconvergence/solutions/), audit [Practice Bank PB-R1-018](/en/practice/#pb-r1-018), and compare masks with [VIS03](/en/visuals/warp-divergence/).
