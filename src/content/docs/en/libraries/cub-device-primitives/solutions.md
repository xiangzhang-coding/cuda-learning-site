---
title: 'L03 Reviewed Solutions: Select CUB Device Primitives'
description: Review scalar reduction, exclusive offsets, cross-stream inclusive prefixes, valid alternatives, and common device-primitive errors.
pairId: l03-solutions
counterpart: /libraries/cub-device-primitives/solutions/
factCheckDate: '2026-09-05'
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
unitId: L03-SOLUTIONS
prerequisites:
  - L03-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l03-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cub-device-primitives/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L03-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cub-device-primitives/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate reference for the [L03 Exercises](/en/libraries/cub-device-primitives/exercises/). It reviews primitive selection and contracts without supplying a second EX17 implementation. There is no CUDA/C++ source, local compilation, execution, output, allocation observation, or timing, and all four evidence arrays remain empty.

## Solution 1: One FP32 aggregate

**Reviewed solution:** Select `cub::DeviceReduce::Sum`. It reduces all `N` items from a zero initial value and writes only one aggregate through nonoverlapping `d_out`. First query bytes with `nullptr`, allocate scratch, then execute on `stream_reduce` with the same overload, types, current device, and problem configuration. Input, output, and scratch remain alive until stream completion; host access follows that edge.

The numerical packet requires a problem-specific tolerance and separates three facts. Traditional `DeviceReduce::Sum` in bundled CUB 1.15.1, 2.8.2, and 3.3.4 and selected 3.4.2 documents same-GPU run-to-run determinism. The parallel result need not equal a serial left fold, and different compute capabilities need not produce the same bits. This static answer creates no runtime observation.

## Solution 2: Exclusive offsets

**Reviewed solution:** Select `cub::DeviceScan::ExclusiveSum`. Its logical result is `y[0] = 0`, while `y[i]` contains only `x[0]` through `x[i-1]`. `N` inputs produce `N` outputs. The ranges may be exactly in place or fully disjoint, but may not partially overlap. Query and execution keep the same `NumItemsT`, iterator types, operation, problem size, and current device; any change requires a fresh query.

A 32-bit or 64-bit choice is valid only with a declared maximum prefix and no-overflow proof. Widening output alone does not automatically redefine the internal accumulation contract and cannot replace range analysis. With a correct zero identity and no overflow, integer addition requires exact prefix results; this preserves EX17's exact `uint32_t` scan acceptance without claiming that a GPU run occurred. The query writes a byte count and performs no GPU work.

## Solution 3: Cross-stream inclusive prefixes

**Reviewed solution:** Select `cub::DeviceScan::InclusiveSum` because `y[i]` must include `x[i]`. After the traditional query and scratch allocation, enqueue execution on `stream_prefix`, then record event E in that same stream. `stream_consume` waits on E before its consumer. Host observation and release or unordered reuse of input, output, and scratch all follow final consumer completion.

This selection uses one traditional API across bundled CUB 1.15.1, 2.8.2, and 3.3.4 plus selected 3.4.2. For FP32 pseudo-associative scans, CUB 1.15.1 documents same-GPU run-to-run determinism with a cross-compute-capability caveat; 2.8.2, 3.3.4, and selected 3.4.2 document possible run-to-run variation. Every row still uses its numerical acceptance rule. The event graph establishes ordering, not observed output, overlap, or performance.

## Valid alternatives

- When the caller needs a custom associative operation or explicit initial value, select the corresponding generic `DeviceReduce::Reduce` or `DeviceScan` scan form and review its exact contract again; that does not change these task answers.
- A scan may be exactly in place or preserve a disjoint output to simplify ownership and debugging.
- A cross-stream consumer may move into the producer stream and rely on stream order. If two streams remain, an event dependency is more precise; device-wide synchronization is also correct but widens the boundary.
- A new project targeting only independent CCCL 3.4.x may separately evaluate an environment overload. EX17 keeps the traditional form across this task's bundle matrix.

## Common errors

- Selecting a scan for one scalar or a reduction for `N` prefixes.
- Recording a query call as execution or reusing its byte count after changing `NumItemsT` or device.
- Placing a reduction output inside its input range or treating scan partial overlap as in-place.
- Reading output, freeing scratch, or reusing scratch from another stream without a dependency immediately after API return.
- Rejecting the inspected CUB 1.15.1 scan guarantee, inheriting it into the 2.8.2/3.3.4/3.4.2 scan rows, or expanding any same-GPU guarantee into serial or cross-GPU equality.
- Inferring Learning Site compilation, runtime, or speedup evidence from owner tests, API availability, or a version matrix.

Reviewed: **2026-09-05**. All four evidence arrays remain empty.
