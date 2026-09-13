---
title: 'P12 Reviewed Solutions'
description: Keep dispatch claims tied to completed device work and preserve attention semantics on rejection.
pairId: p12-solutions
counterpart: /frameworks/sdpa-dispatch-verification/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [review, matrix, debugging, transfer]
resourceKind: solution-set
unitId: P12-SOLUTIONS
prerequisites: [P12-EXERCISES]
relatedUnits: [P12]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p12-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/sdpa-dispatch-verification/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,matrix,debugging,transfer' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P12-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: P12 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/sdpa-dispatch-verification/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review your attempt

Attempt the [Exercises](/en/frameworks/sdpa-dispatch-verification/exercises/) first. No row below describes an executed backend.

## Solution 1: A staged matrix

Each dtype/policy row needs its own eligibility, completion, numerical and trace fields. A CPU-only range cannot supply CUDA dispatch; multiple recognized backend events are ambiguous; a negative predicate is an ineligible row, not a successful fallback. Unexpected execution failures and tolerance failures fail the attempt. Use the same rounded inputs and CPU float64 oracle across choices, with P12's predeclared thresholds. Retain source/wheel/component/device identities and the actual trace hash. A backend list without set_priority=True is not an ordered request; even an ordered request is not an observed selection.

## Solution 2: Preserve the original operation

Deleting the mask changes the attention distribution, dropout_p=0.2 still applies dropout during evaluation, and relaxing tolerances after seeing errors invalidates acceptance. Restore the original Boolean mask with True meaning participation, explicitly pass dropout_p=0.0, and choose fixed thresholds before testing. Review which implementation supports that full request; preserve a capable mathematical reference or report unsupported. Do not silently downcast or drop features. Record determinism controls separately and revalidate if they change eligibility. VIS18's logical traffic model proves neither backend identity nor numerical acceptance.

## Transfer the reasoning

[PB-R5-012](/en/practice/#pb-r5-012) tests another mistaken dispatch inference. Return to [P12](/en/frameworks/sdpa-dispatch-verification/) and [SRC-CUDA-086](/en/sources-and-versions/#src-cuda-086), reviewed 2026-09-13. Written solutions leave runtime evidence unchanged.
