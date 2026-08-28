---
title: 'M07 Reviewed Solutions: Draw explicit stream-order graphs'
description: Missing-edge repair, an explicit-stream rewrite, and an order-versus-eligibility classification for the M07 Exercises.
pairId: m07-solutions
counterpart: /memory/stream-ordering/solutions/
factCheckDate: '2026-08-28'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: M07-SOLUTIONS
prerequisites:
  - M07-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/memory/stream-ordering/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These reviewed answers solve the [M07 Exercises](/en/memory/stream-ordering/exercises/) as dependency graphs. They contain no device timeline or performance observation.

## Solution 1: Find a missing cross-stream edge

The initial graph has two chains:

```text
stream_prepare: H2D(input) -> prepare_kernel
stream_consume: consume_kernel -> D2H(output)
```

Only the two horizontal edges are guaranteed. Because `consume_kernel` reads `prepare_kernel.output`, add `prepare_kernel -> consume_kernel` using a documented cross-stream dependency. Before that repair, the kernels are unordered relative to the graph and the consumer can be eligible too early.

## Solution 2: Remove default-stream ambiguity

Without a declared mode, the `K1 -> K0 -> K2` interpretation is under-specified. In legacy mode, the implicit default stream can synchronize with the blocking stream created by `cudaStreamCreate`; per-thread mode has different relationships. A stable rewrite names, for example, `stream_left` and `stream_right`, creates each with `cudaStreamNonBlocking`, places each operation deliberately, and adds only the data dependencies the algorithm requires.

The rewrite removes an accidental legacy edge. It does not assert that the now-unordered operations execute simultaneously.

## Solution 3: Classify order, eligibility, and evidence

- Consecutive operations in one stream have guaranteed per-stream order.
- Different-stream operations without an edge are unordered.
- A documented cross-stream dependency orders its producer before the dependent consumer.
- A host synchronization orders host access after the work covered by that boundary.
- An unordered pair can be eligible under the graph, subject to other constraints.
- Side-by-side boxes do not establish execution intervals.
- Separate stream creation does not establish simultaneous execution.
- No performance conclusion follows from the static graph.

Every accepted order claim points to a stream, dependency, or host-boundary edge. Every stronger execution claim is rewritten as eligibility only.

## Valid alternatives

- Put producer and consumer in one stream when serialization matches the algorithm.
- Use a later event edge for selective cross-stream ordering instead of a device-wide host wait.
- Keep a legacy default-stream design only when mode, stream flags, and implicit edges are declared and reviewed explicitly.

## Common errors

- Treating host API-call order as one device-wide queue.
- Calling two operations “concurrent” because they occupy different stream lanes.
- Forgetting that `cudaStreamCreate` streams interact with the legacy default stream unless made non-blocking.
- Assuming per-thread default-stream mode without recording build configuration.
- Adding a device-wide wait when only one producer-consumer edge is needed.
- Turning a dependency drawing into a performance result.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
