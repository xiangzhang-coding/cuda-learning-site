---
title: 'O06 Reviewed Solutions: Classify Performance Language and Intensity Bounds'
description: Reviewed answers, reasoning, valid alternatives, and common errors for the two O06 Exercises.
pairId: o06-solutions
counterpart: /start/architecture-refresher/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O06-SOLUTIONS
prerequisites:
  - O06-EXERCISES
relatedUnits:
  - O06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O06 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/architecture-refresher/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [O06 Exercises](/en/start/architecture-refresher/exercises/). Compare latency, throughput, bandwidth, concurrency, and arithmetic-intensity reasoning boundaries before comparing final labels and calculations. This page runs no CUDA and contains no runtime evidence.

## Solution 1: Classify and repair architecture claims

A. **Latency, accurate.** `t1 - t0` is elapsed time for the same request between declared start and finish boundaries. A real result must still record a time unit.

B. **Throughput, inaccurate.** `N / delta_t` is an aggregate item-completion rate. Repair: "The service completes `N` items during `delta_t`, so throughput is `N / delta_t` items per unit time." One item's latency needs that item's own start and finish.

C. **Bandwidth, inaccurate.** Repair: "First identify bandwidth as theoretical, effective, or actual, then state source and destination, direction, read/write byte convention, time interval, and GB/s or GiB/s." Compare only compatible coordinates.

D. **Latency, accurate.** Scheduling a ready warp hides a stalled warp's effect on aggregate issue. It does not make the waiting memory operation finish sooner.

E. **Concurrency, inaccurate.** Four resident blocks can all belong to one kernel. Repair: "Resident blocks have state and resources allocated on the SM. Concurrent kernels are observed only when kernel work from different launches intersects in time on a timeline."

F. **Concurrency, inaccurate.** Occupancy gives only the ratio of active warps to a hardware limit. Repair: "Higher occupancy may expose more ready-warp candidates, but register pressure, shared-memory use, instruction mix, memory behavior, and other bottlenecks determine throughput. Runtime must be measured."

G. **Concurrency, inaccurate.** Multiple streams enable overlap conditions but do not guarantee overlap. Repair: "Independent operations in different streams may overlap when dependencies, memory properties, copy engines, device capability, and resources permit. Check execution with a timeline."

H. **Concurrency, accurate.** Host work and device work intersect in time, so CPU/GPU overlap exists. The statement claims neither concurrent kernels nor copy/compute overlap.

The review hinges on separating a **definition** from an **observation**. A formula or API structure can define a rate, order, or overlap potential. Only measurement with explicit boundaries can state a value or show what overlapped in one execution.

## Solution 2: Calculate and scope an intensity bound

Total traffic on the same `device DRAM <-> SM` path is:

```text
32 bytes read + 16 bytes written = 48 DRAM bytes
```

The arithmetic intensity is therefore:

```text
I = 96 operations / 48 DRAM bytes = 2 operations/byte
```

After checking units, the memory-side bound is:

```text
P_memory <= (2 operations/byte) * B_DRAM
```

Because `B_DRAM` has units of bytes/s, the right side has units of operations/s. The complete simplified Roofline bound is `P <= min(P_compute, (2 operations/byte) * B_DRAM)`. The model classifies this work unit as **memory-bound with respect to the declared DRAM path** only when `(2 operations/byte) * B_DRAM < P_compute`. If the compute ceiling is lower, the simplified model is on its compute-bound side. Equality is the ridge condition.

This result is still not a measurement. The prompt stipulated `96` operations and `48` bytes; `B_DRAM` and `P_compute` have no values; there is no elapsed time or achieved rate; and the model does not prove that enough ready work exists to approach either ceiling. It also does not represent caches, memory latency, instruction issue, dependencies, imbalance, launches, synchronization, host/device transfers, or end-to-end overhead. It is only an upper bound under the declared counting rule and DRAM boundary.

## Valid alternatives

- Exercise 1 may use a review matrix, annotated checklist, or causal diagram if all eight primary categories, judgments, reasons, and repairs remain reviewable.
- An arrow diagram may replace prose for the bandwidth path if endpoints, direction, byte convention, time, and units remain explicit.
- Exercise 2 may begin with `I = 96 / (32 + 16)` or combine DRAM traffic first. Both orders must produce the same unit.
- The bound may use `min` notation or piecewise conditions. A different operation-count convention requires an explicit new declaration and consistent recalculation; it cannot silently reinterpret the supplied `96`.
- Operational intensity is acceptable terminology when it explicitly uses the same operation rule and DRAM-traffic boundary. A name change alone is insufficient.

## Common errors

- Treating reciprocal latency for one request as whole-system throughput without stating concurrency, queues, or resource count.
- Substituting theoretical bandwidth for a measured result, or conflating requested/effective bytes with actual transaction bytes.
- Treating resident blocks, occupancy, streams, or asynchronous submission as observed concurrent execution.
- Claiming that latency hiding lowers the latency of the DRAM operation.
- Omitting write bytes from the intensity denominator or adding host/device and shared-memory traffic absent from the prompt.
- Writing `operations/s` for `operations/byte` or inventing a value for `B_DRAM`.
- Announcing an actual memory bottleneck, runtime, or speedup from a symbolic Roofline bound.

Reviewed: **2026-08-26**. These solutions review static classifications and a hypothetical calculation only, with no hardware requirement, profiler observation, or runtime Evidence Status.
