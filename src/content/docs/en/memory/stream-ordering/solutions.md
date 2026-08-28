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

1. **Classification: guaranteed order.** The per-stream edge `A -> B` is the exact support: `A` completes before `B` begins.
2. **Classification: unsupported execution claim.** Host submission order alone adds no cross-stream device edge. The correction is that `A` and `X` remain unordered unless a documented dependency connects them.
3. **Classification: guaranteed order.** The record after `B` and wait before `C` form the documented event edge `B -> C`; the claim does not extend to unrelated work.
4. **Classification: unordered.** No graph edge orders `B` against `X`, so neither `B -> X` nor `X -> B` may be inferred.
5. **Classification: guaranteed order.** Successful return from `cudaStreamSynchronize(stream_right)` places the following host read after completion of earlier work in that stream, including `C`; it is not a blanket claim about unrelated streams.
6. **Classification: unsupported execution claim.** Side-by-side boxes encode graph placement, not measured execution intervals. The correction describes `B` and `X` only as unordered or potentially eligible.
7. **Classification: unsupported execution claim.** Separate streams permit independent scheduling but do not guarantee simultaneous execution. The corrected claim is only that the graph does not serialize `B` and `X`.
8. **Classification: eligible under the graph.** The graph can allow both operations to become eligible once their predecessors are satisfied, subject to other constraints. Reject the performance clause: eligibility is neither observed overlap nor evidence of improvement.

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
