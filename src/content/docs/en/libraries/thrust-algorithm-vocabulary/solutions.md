---
title: 'L02 Reviewed Solutions: Thrust Algorithm and Iterator Composition'
description: Review stage naming, virtual segmented keys, stream dependencies, valid alternatives, and common composition errors.
pairId: l02-solutions
counterpart: /libraries/thrust-algorithm-vocabulary/solutions/
factCheckDate: '2026-09-04'
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
unitId: L02-SOLUTIONS
prerequisites:
  - L02-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l02-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/thrust-algorithm-vocabulary/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L02-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/thrust-algorithm-vocabulary/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed solutions for the [L02 Exercises](/en/libraries/thrust-algorithm-vocabulary/exercises/). They review contracts only. No displayed implementation, local API check, compilation, execution, allocation path, or timing exists.

## Solution 1: Three named stages

Stage one is `thrust::transform` over `N` FP32 inputs to `N` square outputs, with exact in-place operation allowed but no other partial overlap. It retains A01's ownership and callable contract. Stage two is `thrust::inclusive_scan` over `N` values with addition, exact in-place support, and a tolerance that admits valid parallel floating-point ordering; it retains A03's prefix and numerical contract. Stage three is `thrust::stable_sort_by_key` over `N` mutable prefix keys and `N` nonoverlapping records under a strict weak ordering; it retains A09's movement and stability contract. One compatible policy, stream, extent, and lifetime ledger ties the stages together. Nothing establishes a backend, kernel count, fusion, traffic, or performance result.

## Solution 2: Virtual segmented keys

Use a unit-stride `cuda::counting_iterator` for indices and a `cuda::transform_iterator` whose callable returns `index/4` by value. Both the virtual key range and value range cover exactly `N`, and the explicit device policy or iterator systems must agree with the consumer. The base iterator and callable state must remain valid through consumption. A materialized `N`-element key array is a valid fallback. The virtual form logically omits that stored intermediate from the composition; it does not prove fewer device transactions, one fused kernel, or a speedup. The legacy optional-stride factory is avoided under #10965, and any zip composition must declare equal extents.

## Solution 3: Stream dependency graph

Enqueue the no-sync transform on stream A, then enqueue its scan on stream A; enqueue order supplies that edge. Record event E after the scan. Make stream B wait on E before its consumer. Record or synchronize the final consumer completion before host access and before releasing any input, temporary, or output allocation. A later synchronization can surface deferred errors. Invalid schedules include launching the stream-B consumer without a wait and releasing an allocation immediately after `par_nosync` returns. No device-wide barrier is required by this graph, but the static graph is not an observed execution.

## Valid alternatives

- Materialize the squared or key range when it simplifies ownership, debugging, or repeated use.
- Use an explicit synchronized CUDA policy when host readiness at return is part of the chosen contract.
- Use policy-free dispatch when all iterator systems are intentionally compatible and documented.
- Choose unstable `sort_by_key` when equivalent-record order is explicitly irrelevant.

## Common errors

- Treat a Thrust name as a replacement for range, numerical, stability, or lifetime contracts.
- Assume `par_nosync` never synchronizes or that return makes host access safe.
- Mix host and device iterator systems and expect automatic migration.
- Expect zip to stop at the shortest component or return references to transformed temporaries.
- Generalize selected 3.4 deprecations to every fancy iterator.
- Infer fusion, traffic reduction, or speedup from a virtual range or owner test.

Review date: **2026-09-04**. All four evidence arrays remain empty.
