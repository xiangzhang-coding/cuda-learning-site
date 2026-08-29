---
title: 'M09 Reviewed Solutions: Design a Correct Overlap Pipeline'
description: A page-lock ownership ledger, safe two-slot chunk graph, and capability-to-observation decision table for the three M09 Exercises.
pairId: m09-solutions
counterpart: /memory/pinned-memory-transfer-overlap/solutions/
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
unitId: M09-SOLUTIONS
prerequisites:
  - M09-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m09-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M09-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/memory/pinned-memory-transfer-overlap/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These reviewed answers solve the [M09 Exercises](/en/memory/pinned-memory-transfer-overlap/exercises/) as static contracts. They do not execute EX07, report a timeline, or establish transfer overlap.

## Solution 1: Audit a page-locked buffer plan

| host range | byte owner | page-lock owner | completion and release |
| --- | --- | --- | --- |
| `cudaMallocHost` range | CUDA Runtime allocation | CUDA Runtime | wait for the last asynchronous user, then call `cudaFreeHost` once |
| `cudaHostAlloc` range | CUDA Runtime allocation | CUDA Runtime | wait for the last asynchronous user, then call `cudaFreeHost` once |
| registered `malloc` range | original host allocator | CUDA registration | wait for the last asynchronous user, call `cudaHostUnregister`, then release through the original allocator |
| pageable `std::vector` range | C++ object | none | object lifetime remains C++; do not use this copy path as overlap evidence |

The repaired sequence allocates or registers the bounded working set before enqueueing, records the last copy using each range, establishes completion, and only then unpins or frees it. Registration changes the range's CUDA-use contract but does not transfer byte ownership to CUDA.

## Solution 2: Derive a reusable three-chunk pipeline

One valid two-slot ledger is:

```text
stream_0 / slot_0: H2D(0) -> kernel(0) -> D2H(0) -> record(done_0)
stream_1 / slot_1: H2D(1) -> kernel(1) -> D2H(1) -> record(done_1)
host reuse slot_0: synchronize(done_0) -> verify(0) -> fill(2)
stream_0 / slot_0: H2D(2) -> kernel(2) -> D2H(2) -> record(done_2)
```

The host synchronization on `done_0` protects host verification and overwrite of slot 0; a device-side stream wait alone would not order those host accesses. Chunk 1 can continue while the host waits for chunk 0. Subject to their own predecessors, pairs such as `kernel(0)` with `H2D(1)` remain unordered and therefore eligible, not observed as overlapping.

Each chunk retains its own H2D-kernel-D2H chain. The final host boundary waits for `done_1` and `done_2` before verifying remaining output or releasing any shared resource.

## Solution 3: Design a capability-to-observation review

| gate | required record | allowed conclusion |
| --- | --- | --- |
| correctness | identical logical work, CPU/output oracle, successful error checks, safe lifetimes | serialized and pipelined results pass or fail independently of overlap |
| eligibility and capability | pinned-range proof, dependency graph, exact device query and value, transfer direction | the run configuration is eligible, unsupported, or under-specified |
| observation | Q05-compliant timing context plus a raw device timeline naming copy and kernel intervals | overlap was observed for this exact run, or it remained unobserved |

Stop after correctness failure. If correctness passes but the capability gate does not, retain the baseline result and make no overlap claim. If both pass but no timeline exists, report “eligible but unobserved.” API names, stream count, event timestamps, and a nonzero capability value do not replace the interval evidence.

## Valid alternatives

- Use `cudaHostRegister` for an existing allocation when its alignment, size, ownership, and platform support are reviewed, rather than replacing it with a CUDA-owned allocation.
- Protect host slot reuse with non-blocking event polling instead of a blocking event wait, provided the host does not touch the slot before completion.
- Use more than two bounded slots when the ownership ledger scales with them and measurement later justifies the added resources.
- Keep one serialized stream as the production fallback when overlap capability or evidence is absent.

## Common errors

- Calling `cudaFreeHost` on memory that CUDA only registered.
- Unregistering or freeing a host range while an asynchronous copy may still use it.
- Allocating page-locked buffers inside the steady-state enqueue window.
- Treating `cudaMemcpyAsync`, multiple streams, or `asyncEngineCount` as proof of observed overlap.
- Reusing a ring slot after a device wait while forgetting that the host also needs a completion observation.
- Reporting side-by-side boxes or symbolic event time as a copy-engine timeline.

Reviewed: **2026-08-29**. Compilation, runtime, expected-observation, and recorded-observation axes remain empty.
