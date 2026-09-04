---
title: 'L02 Exercises: Thrust Algorithm and Iterator Composition'
description: Map a pipeline to Thrust contracts, audit a virtual range, and place correct stream-completion edges without writing untracked code.
pairId: l02-exercises
counterpart: /libraries/thrust-algorithm-vocabulary/exercises/
factCheckDate: '2026-09-04'
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
unitId: L02-EXERCISES
prerequisites:
  - L02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l02-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/thrust-algorithm-vocabulary/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L02 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/thrust-algorithm-vocabulary/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [L02](/en/libraries/thrust-algorithm-vocabulary/). These Exercises produce static composition packets. They display, compile, and run no CUDA or Thrust source.

## Instructions

Use CCCL v3.4.2 as the independent API coordinate for Toolkit 12.9.2/13.3.1 and keep 11.8 excluded. State every range, policy, stream, completion, and numerical contract before selecting names. Work independently before opening the [reviewed solutions](/en/libraries/thrust-algorithm-vocabulary/solutions/).

## Exercise 1: Name a three-stage pipeline

**Goal:** Map “square `N` FP32 values, produce inclusive prefixes, then stable-sort records by those prefixes” to Thrust vocabulary and its A01/A03/A09 contracts.

**Constraints:** State unary transform input/output and overlap, scan operation and numerical acceptance, sorting key/value extents and strict weak ordering, stability, policy, stream, and lifetime. Do not write source or claim a backend, kernel count, fusion, traffic reduction, or speedup.

**Expected evidence:** A three-row stage table, exact algorithm names, related Learning Unit per row, range contracts, and an evidence-boundary statement.

**Acceptance criteria:** Select `transform`, `inclusive_scan`, and `stable_sort_by_key`; all three stages have extent `N`; floating-point scan permits valid parallel-order differences under a tolerance; key and value ranges are nonoverlapping; no execution result appears.

<details><summary>Hint 1</summary>Choose the stable by-key name because records with equivalent prefix keys must retain input order.</details>

<details><summary>Hint 2</summary>Algorithm names do not replace A01 ownership, A03 prefix semantics, or A09 movement and stability contracts.</details>

## Exercise 2: Audit a virtual segmented-key range

**Goal:** Represent indices `0..N-1`, map each index to `floor(index/4)`, and use those virtual keys with scan-by-key without storing a key array.

**Constraints:** Choose current `cuda::` iterator vocabulary, unit-stride counting, a value-returning transform, and a compatible device consumer. State extent, system, value/reference behavior, and lifetime. Reject unequal zip extents and the optional-stride legacy counting form covered by issue #10965.

**Expected evidence:** A range graph, four-contract audit, materialized alternative, and a claim ledger separating possible intermediate-storage avoidance from unmeasured fusion or performance.

**Acceptance criteria:** Use `cuda::counting_iterator` plus `cuda::transform_iterator`; virtual keys and values both cover `N`; the transform returns a key value; the selected system is compatible; avoided key storage is a logical composition fact, while traffic, kernel count, and speed remain unknown.

<details><summary>Hint 1</summary>The transform iterator inherits the base range and computes a value when dereferenced.</details>

<details><summary>Hint 2</summary>A virtual range changes representation; only artifact inspection and measurement can establish execution consequences.</details>

## Exercise 3: Place stream dependencies around no-sync work

**Goal:** Order a `par_nosync.on(streamA)` transform, a same-stream scan, a consumer on `streamB`, and a host read.

**Constraints:** Use enqueue order for same-stream work and an event dependency before the other stream. Require completion before host access or allocation release. Treat `par_nosync` as permission to omit optional synchronization, not a guarantee of zero synchronization. State where asynchronous errors may surface.

**Expected evidence:** An ordered event graph, resource-lifetime endpoint, host-read completion point, and two invalid schedules with explanations.

**Acceptance criteria:** Stream A transform precedes its scan by enqueue order; an event recorded after the scan is waited on by stream B; host read and deallocation occur after required completion; no global device synchronization is invented; no runtime observation is claimed.

<details><summary>Hint 1</summary>Same-stream ordering supplies one edge but does not order work submitted to another stream.</details>

<details><summary>Hint 2</summary>Put the event after the last producer and keep every referenced allocation alive through the final consumer.</details>

## Next

Open the [reviewed solutions](/en/libraries/thrust-algorithm-vocabulary/solutions/), then complete [PB-R4-002](/en/practice/#pb-r4-002).
