---
title: 'M11 Reviewed Solutions: Order allocation lifetimes and pool policy'
description: Reviewed same-stream and cross-stream lifetime graphs plus a bounded memory-pool policy verdict for the M11 Exercises.
pairId: m11-solutions
counterpart: /memory/stream-ordered-allocation-memory-pools/solutions/
factCheckDate: '2026-08-29'
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
unitId: M11-SOLUTIONS
prerequisites:
  - M11-EXERCISES
relatedUnits:
  - M11
  - M09
  - M14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m11-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M11,M09,M14' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/stream-ordered-allocation-memory-pools/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [M11 Exercises](/en/memory/stream-ordered-allocation-memory-pools/exercises/) as static dependency and policy records. They contain no support-query result, allocator address, memory statistic, or timing measurement.

## Solution 1: Bound one same-stream lifetime

The stream ledger is:

```text
host:        cudaMallocAsync returns ptr
stream_work: malloc operation -> initialize(ptr) -> consume(ptr) -> free operation
logical use:                    [================]
```

The API return exposes the pointer value to host code but is not allocation-operation completion. Per-stream order delays both kernels until the allocation operation has completed and places the free after both kernels. An access before the left boundary or after execution reaches the right boundary is undefined behavior. Nothing in this graph identifies the backing-resource decision or a duration.

## Solution 2: Join every last use before freeing

One valid repair records `ready` after the allocation, waits on it in both use streams, records `done_a` and `done_b` after their respective last uses, and waits on both completion events before the free:

```text
stream_allocate: malloc(ptr) -> record(ready)
stream_a:        wait(ready) -> use_a(ptr) -> record(done_a)
stream_b:        wait(ready) -> use_b(ptr) -> record(done_b)
stream_release:  wait(done_a) -> wait(done_b) -> free(ptr)
```

There is a path from allocation completion to each first use and from each last use to the free. `use_a` and `use_b` remain unordered relative to each other. The two waits in `stream_release` form a join; their host issue order does not erase either required dependency.

## Solution 3: Review pool controls without overclaiming

| Review subject | Supported conclusion | Rejected conclusion |
| --- | --- | --- |
| support gate | a nonzero checked `cudaDevAttrMemoryPoolsSupported` result admits the path | installed headers prove device support |
| pool selection | explicit properties can justify `cudaMemPoolCreate` and `cudaMallocFromPoolAsync` | explicit is inherently faster than default/current |
| follow-event reuse | the allocator may consider memory behind a documented event edge | the next allocation must use the same address |
| opportunistic reuse | the allocator may consider an already completed free | the allocation pattern is fixed across runs |
| internal dependencies | the allocator may insert an ordering dependency for safe reuse | enabling it cannot serialize work |
| release threshold | the pool may retain more reserved memory and later try to release excess | threshold is an exact footprint or hard cap |
| performance | a declared workload and measurements could support a result | policy enablement proves speedup |

The repaired proposal may keep its explicit pool and attribute values if their ownership and policy rationale are documented. Pointer equality, exact retained bytes, and speedup remain unclaimed.

## Valid alternatives

- Put both consumers in one stream when serialization is acceptable; the lifetime then needs fewer cross-stream edges.
- Use one completion event after a downstream join that already depends on both consumers, provided that join is explicit in the graph.
- Use the default/current pool when no explicit-pool property is required.
- Disable opportunistic or internal-dependency reuse when deterministic explicit ordering is more important than permitting those reuse paths.

## Common errors

- Treating `cudaMallocAsync` return as allocation completion.
- Passing a pointer to another stream without an allocation-ready edge.
- Ordering `cudaFreeAsync` after only one of several last uses.
- Confusing retained pool resources with a still-live allocation.
- Treating a reuse policy as a same-address guarantee.
- Treating release threshold as an exact footprint or performance result.

Reviewed: **2026-08-29**. Compilation and runtime evidence axes remain empty.
