---
title: 'P09 Reviewed Solutions'
description: Derive edge contributions, preserve fake metadata, and reject an unsupported gradient claim.
pairId: p09-solutions
counterpart: /frameworks/operator-registration/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: solution-set
unitId: P09-SOLUTIONS
prerequisites: [P09-EXERCISES]
relatedUnits: [P09, EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p09-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/operator-registration/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P09-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'P09,EX22' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/operator-registration/solutions/" lang="zh-CN">阅读中文对应页</a>

## Attempt first

Prerequisite: [P09 Exercises](/en/frameworks/operator-registration/exercises/). Revisit [P09](/en/frameworks/operator-registration/) and compare code through [EX22](/en/examples/adjacent-energy/). These calculations are original predictions, not recorded hardware observations.

## Solution 1: Signed contributions

For `x=[-1,1,0]`, differences are `[2,-1]`, so `y=[4,1]`. With `g=[2,-3]`, `q=[8,6]` and `dx=[-8,2,6]`. An internal input gains the preceding edge's positive contribution and the following edge's negative contribution. The sum is zero, matching translation invariance, but component-wise comparison remains necessary.

The length-five offset input produces a fresh contiguous length-four tensor, stride one, storage offset zero, same dtype and device. Fake must enforce the native input restrictions without reading values. Use new_empty with symbolic n-1 and torch._check for range constraints. Save x in setup_context, then use the padded contribution difference in the canonical backward. For n=1 the empty q pads into one zero on either side. **Valid alternative:** concatenate endpoints and interior differences with an explicit singleton branch, provided symbolic tracing and higher derivatives remain valid. **Common errors:** returning a view from fake, ignoring g, reversing signs, or detaching saved x and losing second derivatives.

## Solution 2: Evidence is not interchangeable

A length-four real input returns length three; empty_like returns length four, so a metadata comparison exposes that defect without testing gradient arithmetic. Replace it with a fresh n-1 output. A zero backward fails on Exercise 1's nonconstant input and weighted gradient: expected `[-8,2,6]` is not zero. Use float64 gradcheck with finite-difference tolerances and gradgradcheck for the supported second derivative.

Keep opcheck for schema, registration, fake and AOT integration. Execute fullgraph dynamic forward/backward at two valid lengths to exercise symbolic metadata in addition to an explicit meta call. **Valid alternative:** add an independently constructed dense Jacobian for a tiny vector; this supplements rather than removes numerical checks. **Common errors:** accepting only constant inputs, quoting an unretained pass assertion, treating fullgraph as a fusion promise, or converting a CPU report to Runtime-Verified CUDA evidence.

## Continue

Evaluate [PB-R5-009](/en/practice/#pb-r5-009) against [SRC-CUDA-084](/en/sources-and-versions/#src-cuda-084), reviewed 2026-09-13. Keep integration results, numerical derivatives and device execution as distinct records.
