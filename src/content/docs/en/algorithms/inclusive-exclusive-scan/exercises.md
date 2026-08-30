---
title: 'A03 Exercises: Inclusive/Exclusive Scan and Multi-block Propagation'
description: Use three tasks to derive scan identities, stage snapshots, and the propagation contract from block sums to block offsets.
pairId: a03-exercises
counterpart: /algorithms/inclusive-exclusive-scan/exercises/
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
unitId: A03-EXERCISES
prerequisites:
  - A03
relatedUnits:
  - A03
  - EX12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'A03,EX12' }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/inclusive-exclusive-scan/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [A03: Inclusive and Exclusive Scan](/en/algorithms/inclusive-exclusive-scan/) first. These tasks require only tables, invariants, and pseudocode. They need no CUDA-capable system and produce no runtime evidence.

## Instructions

For every task, state the identity, logical valid range, snapshot read by each stage, and synchronization boundary. Check your work against the acceptance criteria before continuing.

## Exercise 1: Derive both scans from one input

**Goal:** For addition input `[4, 1, 3, 2, 6]`, produce the inclusive scan and exclusive scan and verify both recurrences at every position.

**Constraints:** State the identity explicitly; preserve input order; use an accumulator that can hold the total; do not report only the final total.

**Expected evidence:** A five-row table with `i`, `x[i]`, inclusive, and exclusive columns; checks of both recurrences; and a check of `inclusive[i] = exclusive[i] + x[i]`.

**Acceptance criteria:** Inclusive is `[4,5,8,10,16]`; exclusive is `[0,4,5,8,10]`; the first exclusive output is identity 0; all five positions satisfy the declared invariant.

<details><summary>Hint 1</summary>Inclusive contains the current input; exclusive emits the accumulator before reading the current input.</details>

<details><summary>Hint 2</summary>Write `exclusive[0]` first, then advance the recurrence one item at a time.</details>

## Exercise 2: Construct stage snapshots

**Goal:** For four lanes holding `[2, 5, 1, 4]`, write the shared snapshot at each stage of a staged inclusive scan with distances 1 and 2, and mark each barrier.

**Constraints:** Each stage reads only the prior-stage snapshot; identify two ping-pong buffers or an equivalent snapshot mechanism; all four lanes participate in every barrier; no lane returns early.

**Expected evidence:** A lane table for `stage 0/1/2`, a read-from/write-to buffer ledger, and the participation count at both stage boundaries.

**Acceptance criteria:** Snapshots are `[2,5,1,4]`, `[2,7,6,5]`, and `[2,7,8,12]`; each combine preserves left-to-right order; each barrier has four participants; there is no same-stage read/write race.

<details><summary>Hint 1</summary>At distance 1, lane 0 has no predecessor; at distance 2, lanes 0 and 1 have no predecessor.</details>

<details><summary>Hint 2</summary>A barrier separates snapshots, while buffer ownership makes a stage read only old values.</details>

## Exercise 3: Complete multi-block offset propagation

**Goal:** A length-10 addition input is split into blocks `[3,1,2,4]`, `[5,2,1,3]`, and `[6,7]`. Produce local inclusive scans, block sums, exclusive block offsets, and the final global inclusive scan.

**Constraints:** The third block is partial; scan block offsets in block order; use identity as the first offset; identify boundaries among the three kernel phases; make no speedup claim.

**Expected evidence:** Three local tables, a sums-to-offsets table, a propagation equation, and a final recurrence check.

**Acceptance criteria:** Block sums are `[10,11,13]`; offsets are `[0,10,21]`; the final result is `[3,4,6,10,15,17,18,21,27,34]`; the partial block counts only two valid elements; every propagated position satisfies the global recurrence.

<details><summary>Hint 1</summary>A block offset is the exclusive scan of all earlier block sums.</details>

<details><summary>Hint 2</summary>Verify each local prefix first, then apply one block offset to every valid output in that block.</details>

## Next

After completing the tasks, inspect the separate [reviewed solutions](/en/algorithms/inclusive-exclusive-scan/solutions/), then apply the same recurrence checks to EX12 `multi-block-scan`.
