---
title: 'M08 Reviewed Solutions: Trace event dependencies and timing'
description: A selective wait graph, re-record generation table, and dependency-versus-timing event design for the M08 Exercises.
pairId: m08-solutions
counterpart: /memory/event-dependencies-timing/solutions/
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
unitId: M08-SOLUTIONS
prerequisites:
  - M08-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m08-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M08-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/memory/event-dependencies-timing/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These reviewed answers solve the [M08 Exercises](/en/memory/event-dependencies-timing/exercises/) with symbolic states and timestamps. They report no measured device behavior.

## Solution 1: Trace a selective event dependency

The producer chain is `P1 -> record(E1) -> P2`; the consumer chain is `wait(E1) -> C1 -> C2`. `E1` captures the producer prefix through its record point. The stream wait adds `P1 -> C1`, and per-stream order extends that relation to `C2`. `P2` remains unordered relative to `C1` and `C2` without another edge. The host enqueues the wait and continues; this wait is a device dependency, not a host wait.

## Solution 2: Version one re-recorded event handle

| API call | selected state | meaning |
| --- | --- | --- |
| first record | `E1` | captures producer work through `P1` |
| `W1` | `E1` | later consumer work waits for the first capture |
| second record | `E2` | overwrites handle state with work through `P2` |
| `Q2` | `E2` | checks second-capture completion without blocking |
| `W2` | `E2` | later consumer work waits for the second capture |
| `S2` | `E2` | host waits for second-capture completion |

The second record changes future API selections, not `W1`. Work submitted after the second record is outside `E2` unless another record replaces it again.

## Solution 3: Separate dependency flags from timing endpoints

Create dependency event `ready` with `cudaEventDisableTiming`; use it with documented record, wait, query, or synchronize operations. Create timing-enabled events `start` and `stop`, record them around the declared region in the intended stream order, wait for `stop`, and then use:

```text
elapsed_ms = timestamp(stop) - timestamp(start)
```

Passing `ready` as either elapsed endpoint violates its timing-disabled contract and yields the documented invalid-resource-handle error. The symbolic subtraction specifies an interval but provides no measured result.

## Valid alternatives

- Use a host synchronization when the host genuinely needs the captured result, while recognizing that it is broader than a stream wait for device work.
- Use distinct event handles instead of re-recording when generation ownership would otherwise be difficult to review.
- Use separate timing endpoints around a larger or smaller region if the included-work contract is stated explicitly.

## Common errors

- Assuming record completion when the host-side record call returns.
- Letting a wait capture producer work submitted after the event's record point.
- Retargeting an earlier wait after re-recording the handle.
- Treating `cudaEventQuery` as a blocking wait.
- Passing `cudaEventDisableTiming` events to `cudaEventElapsedTime`.
- Publishing an invented duration or concurrency conclusion from symbolic timestamps.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
