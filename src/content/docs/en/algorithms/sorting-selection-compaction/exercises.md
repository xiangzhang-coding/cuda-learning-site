---
title: 'A09 Exercises: Flag Scans, Stable Bucket Ranks, and Production Decisions'
description: Review selection, compaction, and sorting with an exact flag/scan/scatter table, bounded-key stable movement, and a CUB/Thrust/custom decision packet.
pairId: a09-exercises
counterpart: /algorithms/sorting-selection-compaction/exercises/
factCheckDate: '2026-08-31'
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
unitId: A09-EXERCISES
prerequisites:
  - A09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a09-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/sorting-selection-compaction/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A09 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/sorting-selection-compaction/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A09](/en/algorithms/sorting-selection-compaction/) first. These Exercises create static tables and decision records without running CUDA, CUB, or Thrust.

## Instructions

For every task, state operation semantics, ownership, movement, and evidence separately. Inspect the [reviewed solutions](/en/algorithms/sorting-selection-compaction/solutions/) after completing all three.

## Exercise 1: Derive stable compaction from flags

**Goal:** For values `[8,3,5,4,9,2]` and an even predicate, state flags, exclusive positions, every selected scatter destination, output, and count.

**Constraints:** Preserve original order; make each destination unique; do not substitute atomic arrival order for prefix rank; use the final-flag count formula.

**Expected evidence:** A six-row `index/value/flag/position/destination` table, output vector, and count proof.

**Acceptance criteria:** Flags are `[1,0,0,1,0,1]`, positions are `[0,1,1,1,2,2]`, output is `[8,4,2]`, and count is 3.

<details><summary>Hint 1</summary>An exclusive position counts ones strictly before the current index.</details>

<details><summary>Hint 2</summary>`count = position[5] + flag[5]`.</details>

## Exercise 2: Fill the missing stable bounded-key sorting quantity

**Goal:** For keys `[2,0,1,2,1,0]`, state histogram counts, exclusive bin starts, every item's stable within-bin rank, destination, and sorted output.

**Constraints:** The key domain is 0, 1, 2; equal keys preserve input order; explain why histogram plus scan still needs a per-item rank; infer no stability from atomic increments.

**Expected evidence:** A counts/starts table, six-row movement ledger, sorted keys, and stability proof.

**Acceptance criteria:** Counts are `[2,2,2]`, starts are `[0,2,4]`, destinations are `[4,0,2,5,3,1]`, and output is `[0,0,1,1,2,2]`.

<details><summary>Hint 1</summary>Within-bin rank is the count of equal keys strictly before this item.</details>

<details><summary>Hint 2</summary>Destination is `bin_start[key] + rank`.</details>

## Exercise 3: Write a production algorithm decision packet

**Goal:** For stable ascending 32-bit key/value sorting and predicate compaction, compare CUB `DeviceRadixSort`/`DeviceSelect`, Thrust `stable_sort`/`copy_if`, and a custom composition.

**Constraints:** Pin CCCL v3.4.2 and state that it covers latest-patch Toolkit 12.x/13.x but not the 11.8 lane. Record semantics, types, stability, temporary storage, stream or execution policy, correctness fixtures, maintenance, and a measurement plan; no measured data exists.

**Expected evidence:** A three-path decision matrix, rejection or selection conditions, and fields requiring future observations.

**Acceptance criteria:** The packet does not make an educational composition the production default or call any path faster. Custom code becomes a candidate only after an API mismatch or measured need and explicit maintenance ownership.

<details><summary>Hint 1</summary>Eliminate paths that miss required semantics before planning measurement.</details>

<details><summary>Hint 2</summary>A temporary-storage query is not a runtime performance result.</details>

## Next

Inspect the [reviewed solutions](/en/algorithms/sorting-selection-compaction/solutions/), then audit [PB-R2-021](/en/practice/#pb-r2-021) and the exact CCCL v3.4.2 owner sources.
