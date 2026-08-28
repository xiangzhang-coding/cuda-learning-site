---
title: 'M05 Exercises: Select synchronization by scope'
description: Classify synchronization obligations, repair a publication protocol, and select the narrowest valid coordination scope in three static tasks.
pairId: m05-exercises
counterpart: /memory/synchronization-scopes/exercises/
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
unitId: M05-EXERCISES
prerequisites:
  - M05
relatedUnits:
  - M05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m05-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M05 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: M05 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/synchronization-scopes/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M05: Synchronization scopes and memory visibility](/en/memory/synchronization-scopes/) first. These Exercises use only static participant tables, ordering graphs, and proof obligations. No CUDA-capable system is needed.

## Instructions

For every communication edge, name participants, location, progress, rendezvous, ordering/visibility, and atomicity. Do not choose a primitive from proximity or habit. Work before consulting the [reviewed solutions](/en/memory/synchronization-scopes/solutions/).

## Exercise 1: Classify guarantees without conflating them

**Goal:** For `__syncwarp(mask)`, `__syncthreads()`, a device-scope relaxed atomic increment, and a device-scope memory fence, classify participant scope and whether each supplies rendezvous, ordering, visibility, or atomicity.

**Constraints:** Use “documented by this operation” rather than assuming every guarantee. Treat the warp mask as part of the participant contract. Do not claim that a fence signals completion or that a barrier makes every update atomic.

**Expected evidence:** A four-row guarantee matrix and one sentence justifying every checked or unchecked cell.

**Acceptance criteria:** The matrix separates all four guarantee categories, names the participants for every row, marks relaxed atomic increment as atomic without inventing payload ordering, and states that a fence is not rendezvous.

<details><summary>Hint 1</summary>Ask whether a peer must execute the same operation before the caller can continue.</details>

<details><summary>Hint 2</summary>Atomicity describes one access; ordering can relate different locations.</details>

## Exercise 2: Repair a payload-publication proof

**Goal:** Repair this device-wide claim: “Producer writes `payload`, calls `__threadfence()`, and consumer may now read `payload` because the fence tells it that production finished.”

**Constraints:** Keep producer and consumer in different blocks. Use a global payload and a publication flag. State the scope and ordering needed on both sides, but write protocol pseudocode rather than runnable CUDA.

**Expected evidence:** A producer/consumer happens-before graph, a list of the original claim's missing guarantees, and repaired pseudocode with explicit publication and observation.

**Acceptance criteria:** The answer says the fence alone does not notify the consumer, provides a device-scope release/acquire publication relation or an equivalent documented protocol, keeps the payload write before publication, and forbids the payload read before observation.

<details><summary>Hint 1</summary>The consumer needs a value it can observe, not merely an operation executed by the producer.</details>

<details><summary>Hint 2</summary>Put the payload and flag on separate lines in the ordering graph.</details>

## Exercise 3: Select scope from four scenarios

**Goal:** Choose the narrowest candidate coordination scope for four conceptual cases: named lanes exchange values; a block consumes a shared tile; blocks publish global results to another kernel after an explicit host boundary; and a CPU consumes data through system-accessible memory.

**Constraints:** Choose among warp, block, device, and system, then state any additional ordering, accessibility, or progress condition. Do not infer a grid-wide barrier for ordinary blocks and do not treat “widest” as automatically correct.

**Expected evidence:** Four completed six-field scope ledgers and a rejection reason for one too-narrow scope in each case.

**Acceptance criteria:** Every choice includes all named participants, the shared-tile case stays block-scoped, cross-kernel publication names the explicit boundary, the CPU case verifies system accessibility and system-scope support, and no answer relies on assumed block scheduling.

<details><summary>Hint 1</summary>First circle the farthest-apart producer and consumer.</details>

<details><summary>Hint 2</summary>A scope can include participants yet still lack a rendezvous or publication mechanism.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/synchronization-scopes/solutions/) and then classify another broken protocol in [Practice Bank PB-R1-017](/en/practice/#pb-r1-017).
