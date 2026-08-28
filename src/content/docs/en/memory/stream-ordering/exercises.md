---
title: 'M07 Exercises: Draw explicit stream-order graphs'
description: Derive per-stream edges, remove default-stream ambiguity, and classify eligibility claims in three static tasks.
pairId: m07-exercises
counterpart: /memory/stream-ordering/exercises/
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
unitId: M07-EXERCISES
prerequisites:
  - M07
relatedUnits:
  - M07
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
    attrs: { name: 'cuda:pair-id', content: m07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M07,M08,VIS07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/stream-ordering/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M07: Streams Replace a Global-Order Mental Model](/en/memory/stream-ordering/) first. All tasks use static queue and dependency ledgers; they do not submit CUDA work.

## Instructions

Name every stream, add only documented edges, and label unordered pairs as eligible rather than concurrent. Work before opening the [reviewed solutions](/en/memory/stream-ordering/solutions/).

## Exercise 1: Find a missing cross-stream edge

**Goal:** Draw the graph for `stream_prepare: H2D(input) -> prepare_kernel` and `stream_consume: consume_kernel -> D2H(output)`, where `consume_kernel` reads the producer's result.

**Constraints:** Both are explicitly named non-default streams created with `cudaStreamNonBlocking`. Add per-stream edges automatically, but do not invent an edge from host submission order. Mark the required producer-consumer relation separately.

**Expected evidence:** Two stream lanes, all guaranteed edges, one missing-edge diagnosis, and a corrected dependency graph expressed without runnable code.

**Acceptance criteria:** The graph orders each lane internally, leaves the two lanes unordered before repair, identifies the data hazard, and adds exactly the cross-stream dependency needed by the consumer.

<details><summary>Hint 1</summary>Start with two disconnected chains.</details>

<details><summary>Hint 2</summary>A data-flow arrow is required even when the producer API call appears first in host source.</details>

## Exercise 2: Remove default-stream ambiguity

**Goal:** Review a sequence containing `K1` in a stream from `cudaStreamCreate`, `K0` in an implicit default stream, and `K2` back in the named stream; then rewrite the ledger with two explicitly named non-default streams.

**Constraints:** The original build does not declare legacy or per-thread default-stream mode. Do not choose one silently. The rewrite must name stream flags and every required cross-stream edge while remaining conceptual.

**Expected evidence:** An “insufficient configuration” diagnosis, two possible default-mode relationship sketches, and one unambiguous rewritten graph.

**Acceptance criteria:** The answer records default-stream mode as missing input, distinguishes a `cudaStreamCreate` blocking stream from `cudaStreamNonBlocking`, and removes reliance on an implicit global order.

<details><summary>Hint 1</summary>The same source can have different default-stream relationships under different compilation settings.</details>

<details><summary>Hint 2</summary>Explicit stream names do not remove the need to draw a real dependency.</details>

## Exercise 3: Classify order, eligibility, and evidence

**Goal:** Classify eight claims about two named streams as guaranteed order, unordered, eligible under the graph, or unsupported execution claim.

Use this graph: `stream_left` contains `A -> B -> record(done)`; `stream_right` contains `X -> wait(done) -> C`; after submitting the work, the host calls `cudaStreamSynchronize(stream_right)` and then reads `C`'s output. Classify these claims:

1. The same-stream edge `A -> B` guarantees that `A` completes before `B` begins.
2. Because the host submits `A` before `X`, host submission order across streams guarantees that `A` completes before `X` starts.
3. Recording `done` after `B` and waiting on it before `C` creates a documented event edge `B -> C`.
4. `B` and `X` have no edge between them and therefore remain unordered.
5. Return from `cudaStreamSynchronize(stream_right)` is a host completion boundary for the previously submitted work in `stream_right`, so the following host read occurs after `C` completes.
6. Drawing the `B` and `X` boxes side by side proves that their execution intervals overlapped.
7. Putting `B` and `X` in separate streams guarantees simultaneous execution.
8. Once their own predecessors permit it, `B` and `X` are eligible under the graph; therefore the graph proves a performance improvement.

**Constraints:** Include same-stream operations, different-stream operations with and without an edge, a host wait, and a side-by-side visual. Use no duration or throughput values.

**Expected evidence:** An eight-row classification table with the exact graph edge supporting each guarantee and corrected wording for unsupported claims.

**Acceptance criteria:** Same-stream order is preserved, edge-free cross-stream pairs remain unordered, eligibility is not called an observation, and the visual is treated as a dependency model rather than execution evidence.

<details><summary>Hint 1</summary>“May be eligible together” is weaker than “ran together.”</details>

<details><summary>Hint 2</summary>For every order claim, point to one edge or reject the claim.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/stream-ordering/solutions/), repair [Practice Bank PB-R1-019](/en/practice/#pb-r1-019), and compare the graph with [VIS07](/en/visuals/stream-event-dependencies/).
