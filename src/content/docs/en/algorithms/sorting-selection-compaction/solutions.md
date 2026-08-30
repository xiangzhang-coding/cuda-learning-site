---
title: 'A09 Reviewed Solutions: Flag Scans, Stable Bucket Ranks, and Production Decisions'
description: Review the stable-compaction table, bounded-key movement, CUB/Thrust/custom decision packet, valid alternatives, and common errors.
pairId: a09-solutions
counterpart: /algorithms/sorting-selection-compaction/solutions/
factCheckDate: '2026-08-31'
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
unitId: A09-SOLUTIONS
prerequisites:
  - A09-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a09-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/sorting-selection-compaction/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A09-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/sorting-selection-compaction/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate solution page for the [A09 Exercises](/en/algorithms/sorting-selection-compaction/exercises/). Tables and the decision packet are static reasoning, not library execution or performance evidence.

## Solution 1: Stable compaction

Even flags are `[1,0,0,1,0,1]`. Exclusive positions are `[0,1,1,1,2,2]`. Indices 0, 3, and 5 scatter to 0, 1, and 2, so output is `[8,4,2]`. Finally, `count=position[5]+flag[5]=2+1=3`. Prefix ranks increase in input order, proving stability.

## Solution 2: Stable bounded-key movement

Histogram counts are `[2,2,2]`, and exclusive starts are `[0,2,4]`. Within-bin ranks are `[0,0,0,1,1,1]`; adding each corresponding start gives destinations `[4,0,2,5,3,1]`. Scatter yields `[0,0,1,1,2,2]`, and each equal-key pair retains its input-index order. Histogram and starts alone did not provide those ranks.

## Solution 3: Production decision

First freeze stable key/value sort and stable predicate compaction. The CCCL v3.4.2 path enters only the 12.9.2 and 13.3.1 rows; the 11.8 row uses Toolkit-bundled CUB and Thrust or a separately reviewed CCCL 2.x coordinate. Then review CUB types, stability, storage, and stream; Thrust iterator and policy semantics; and custom maintenance. No run exists, so performance cells remain `unrecorded`.

## Valid alternatives

- Selected indices may replace selected values when the payload contract is explicit.
- Unordered compaction may use atomic slot allocation after explicitly giving up stability.
- Sorting may use comparison-based rather than bounded-key vocabulary after restating complexity and API contracts.
- A framework-managed primitive is a valid production path when its exact component, backend, and semantics can be recorded.

## Common errors

- Using an inclusive scan as a selected item's zero-based destination.
- Forgetting the final flag and computing the wrong count.
- Assuming histogram counts and bin starts already determine every item destination.
- Inferring stable order from atomic uniqueness.
- Treating temporary-storage size, API availability, or source review as measured speed.
- Making lower-level custom code the production default merely because it exposes more phases.

Reviewed: **2026-08-31**. All four evidence arrays remain empty.
