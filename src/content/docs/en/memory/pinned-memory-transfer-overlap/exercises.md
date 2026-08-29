---
title: 'M09 Exercises: Design a Correct Overlap Pipeline'
description: Audit page-locked buffer ownership, derive a reusable chunk pipeline, and design a capability-to-observation gate in three deeper static tasks.
pairId: m09-exercises
counterpart: /memory/pinned-memory-transfer-overlap/exercises/
factCheckDate: '2026-08-29'
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
unitId: M09-EXERCISES
prerequisites:
  - M09
relatedUnits:
  - M09
  - M10
  - Q05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m09-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M09 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M09,M10,Q05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/pinned-memory-transfer-overlap/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M09: Pinned Memory and Transfer Overlap](/en/memory/pinned-memory-transfer-overlap/) first. These Exercises produce ownership ledgers, dependency graphs, and evidence plans. They do not execute EX07 or grant overlap evidence.

## Instructions

Start every answer with the serialized correctness contract. Add page locking, stream edges, and hardware gates one at a time, and keep “eligible” separate from “observed.” Complete all artifacts before opening the [reviewed solutions](/en/memory/pinned-memory-transfer-overlap/solutions/).

## Exercise 1: Audit a page-locked buffer plan

**Goal:** Review four host ranges: one allocated with `cudaMallocHost`, one allocated with `cudaHostAlloc`, one `malloc` range registered with `cudaHostRegister`, and one ordinary pageable `std::vector` range passed to `cudaMemcpyAsync`.

**Constraints:** For each range, record creator, page-lock operation, matching unpin or free action, last asynchronous user, completion proof, and whether the range satisfies M09's asynchronous-copy prerequisite. Do not convert a registration into ownership of the original allocation. Keep the pinned working set bounded and outside the steady-state enqueue loop.

**Expected evidence:** A four-row ownership/lifetime ledger, a diagnosis for every mismatched release, and a repaired acquisition-to-cleanup sequence with no runnable implementation.

**Acceptance criteria:** Every CUDA-created pinned allocation has one matching `cudaFreeHost`; the registered range is unregistered before its original allocator releases it; no range is reused before its last copy completes; and the pageable range is not used to claim overlap.

<details><summary>Hint 1</summary>Separate “who owns these bytes?” from “who temporarily pins these bytes?”</details>

<details><summary>Hint 2</summary>Draw the completion edge before drawing any cleanup edge.</details>

## Exercise 2: Derive a reusable three-chunk pipeline

**Goal:** Draw chunks 0, 1, and 2 using two reusable host/device slots and two named non-default streams. Each chunk requires H2D, kernel, D2H, host verification, and eventual slot reuse.

**Constraints:** Preserve `H2D(i) -> kernel(i) -> D2H(i)` for every chunk. Add only the event and host-completion edges needed for cross-stream data flow and safe reuse. Chunk 2 reuses chunk 0's slot. Do not infer an execution interval or performance result from side-by-side lanes.

**Expected evidence:** Two stream lanes, three complete chunk chains, a slot-ownership table over time, event-generation labels, and a list of operation pairs that remain unordered after correctness edges are added.

**Acceptance criteria:** No input slot is overwritten before its H2D use completes; no output is verified before D2H completion; chunk 2 cannot reuse slot 0 too early; every producer-consumer edge is explicit; and unordered pairs are described only as eligible.

<details><summary>Hint 1</summary>Track slot identity separately from chunk identity.</details>

<details><summary>Hint 2</summary>The event protecting slot reuse belongs to the previous occupant's completed output path.</details>

## Exercise 3: Design a capability-to-observation review

**Goal:** Write a future EX07 review plan that can report baseline correctness, overlap eligibility, and observed transfer overlap as three independent verdicts.

**Constraints:** Declare a serialized baseline, identical logical work, output oracle, selected Toolkit Lane, complete Environment Manifest, page-lock proof, exact device capability query, stream/event graph, warm-up policy, Q05 timing boundaries, and a device-timeline requirement. Provide no duration, bandwidth, overlap percentage, or speedup.

**Expected evidence:** A three-gate decision table, required raw artifacts for each gate, explicit stop conditions, and allowed wording for pass, fail, unsupported, and unobserved outcomes.

**Acceptance criteria:** Correctness can pass when overlap capability is absent; capability cannot stand in for a timeline; a timeline is interpreted only after correctness passes; copy-engine use is not inferred solely from API spelling; and all current observation fields remain empty.

<details><summary>Hint 1</summary>Make each stronger claim depend on every weaker gate, but do not make correctness depend on overlap.</details>

<details><summary>Hint 2</summary>A device property describes possibility; a timeline supplies intervals from one execution.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/pinned-memory-transfer-overlap/solutions/), review [Practice Bank PB-R2-001](/en/practice/#pb-r2-001), and revisit [TERM-096](/en/glossary/#term-096), [TERM-097](/en/glossary/#term-097), and [TERM-098](/en/glossary/#term-098). Exercise set reviewed: **2026-08-29**.
