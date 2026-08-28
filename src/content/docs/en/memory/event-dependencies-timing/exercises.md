---
title: 'M08 Exercises: Trace event dependencies and timing'
description: Trace a selective stream wait, version a re-recorded event, and design dependency-versus-timing event contracts in three static tasks.
pairId: m08-exercises
counterpart: /memory/event-dependencies-timing/exercises/
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
unitId: M08-EXERCISES
prerequisites:
  - M08
relatedUnits:
  - M08
  - VIS07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m08-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M08 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M08,VIS07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/event-dependencies-timing/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M08: Events as Dependencies and Device-Time Measurements](/en/memory/event-dependencies-timing/) first. These Exercises use symbolic event generations and timestamps only; they require no CUDA-capable system.

## Instructions

For every event operation, write the recording stream, captured prefix, event generation, API-call point, and work ordered afterward. Keep dependency and timing roles separate before consulting the [reviewed solutions](/en/memory/event-dependencies-timing/solutions/).

## Exercise 1: Trace a selective event dependency

**Goal:** Draw `stream_producer: P1 -> record(E) -> P2` and `stream_consumer: wait(E) -> C1 -> C2`, with the wait call issued after the first record.

**Constraints:** Add only edges guaranteed by per-stream order, `cudaEventRecord`, and `cudaStreamWaitEvent`. State whether the host waits. Do not order `P2` before consumer work unless a separate edge exists.

**Expected evidence:** Two stream lanes, one event marker, one cross-stream edge, the captured prefix, and an explicit list of unordered pairs.

**Acceptance criteria:** The graph orders `P1` before `C1`, preserves both stream chains, excludes `P2` from the captured generation, and states that the stream wait does not block the host.

<details><summary>Hint 1</summary>Cut the producer lane exactly at the record marker.</details>

<details><summary>Hint 2</summary>The wait constrains work after the wait call in the consumer stream.</details>

## Exercise 2: Version one re-recorded event handle

**Goal:** Trace one handle `E`: record after `P1`, issue wait `W1`, re-record after `P2`, call query `Q2`, issue wait `W2`, and finally call synchronize `S2`.

**Constraints:** Use teaching labels `E1` and `E2` for captured states without inventing two handles. Bind each API call to the event generation current at its own call time. Do not retarget `W1` after re-record.

**Expected evidence:** A generation table, two wait edges, query/synchronize host semantics, and a statement about which later producer work each generation excludes.

**Acceptance criteria:** `W1` remains bound to the first captured state, later calls use the second state, query remains non-blocking, synchronize waits on the host, and no API silently captures work after its record point.

<details><summary>Hint 1</summary>Write a new state label each time `cudaEventRecord` overwrites the handle.</details>

<details><summary>Hint 2</summary>API-call time, not eventual execution time, selects the captured state for a wait.</details>

## Exercise 3: Separate dependency flags from timing endpoints

**Goal:** Design one dependency-only event and two timing endpoints for a symbolic region, then state valid uses of query, synchronize, wait, and elapsed time.

**Constraints:** Create the dependency event with `cudaEventDisableTiming`; keep `start` and `stop` timing-enabled; provide only `elapsed_ms = timestamp(stop) - timestamp(start)` and no numerical result.

**Expected evidence:** A three-event flag table, a dependency graph, a timing-bracket contract, completion precondition, and expected error classification for invalid elapsed use.

**Acceptance criteria:** The dependency event can be waited on or queried but cannot enter `cudaEventElapsedTime`; the stop event completes before elapsed calculation; the formula names exactly the intended endpoints and is not presented as execution evidence.

<details><summary>Hint 1</summary>Creation flags are part of the event's type-like contract.</details>

<details><summary>Hint 2</summary>First decide what interval the endpoints enclose; only then write the subtraction.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/event-dependencies-timing/solutions/), repair [Practice Bank PB-R1-020](/en/practice/#pb-r1-020), and compare generations with [VIS07](/en/visuals/stream-event-dependencies/).
