---
title: 'A08 Reviewed Solutions: GEMM Oracles, Partial Tiles, and Numerical Acceptance'
description: Review the hand-computable GEMM, partial M/N/K barrier proof, finite tolerance packet, valid alternatives, and common errors.
pairId: a08-solutions
counterpart: /algorithms/tiled-gemm-correctness/solutions/
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
unitId: A08-SOLUTIONS
prerequisites:
  - A08-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a08-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/tiled-gemm-correctness/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A08-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/tiled-gemm-correctness/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate solution page for the [A08 Exercises](/en/algorithms/tiled-gemm-correctness/exercises/). Every result is host arithmetic or a static phase proof, not a CUDA observation.

## Solution 1: Hand-computable oracle

The four values are `1*1+2*3+3*5=22`, `1*2+2*4+3*6=28`, `4*1+5*3+6*5=49`, and `4*2+5*4+6*6=64`. C row-major indices are 0, 1, 2, and 3, so the vector is `[22,28,49,64]`. A addresses use `row*3+p`, B addresses use `p*2+col`, and C uses `row*2+col`.

## Solution 2: Partial-tile participation

The output grid is `ceil(17/16) x ceil(18/16)=2x2`. Bottom-right origin `(16,16)` covers rows 16 and 17 and only column 16, so it has two valid outputs. K slices are `[0,15]` and `[16,18]`. The second slice has three valid K positions; every other A/B shared slot receives zero. Each slice has `guarded loads -> 256-thread barrier -> 16 products -> 256-thread barrier`, followed by two guarded stores.

## Solution 3: Tolerance packet

For reference zero, allowed error is `0.0001`, so `0.00005` passes. For reference 1000, allowed error is `0.0001+0.02=0.0201`, so an error near `0.01` passes. For reference 4, allowed error is `0.00018`, so `0.5` fails. The finite policy rejects NaN before the formula. The mismatch record contains index/row/column, 4, 4.5, 0.5, and 0.00018. Compilation, runtime, and performance fields remain empty.

## Valid alternatives

- Another rectangular hand fixture is valid when all three leading dimensions and elementwise oracle are explicit.
- A tile other than `16x16x16` is valid after re-proving ownership, shared extents, guards, and the resource bound.
- A higher-precision CPU library is valid when it remains independent from the candidate implementation.
- A stricter tolerance or exact integer fixture is valid; widening acceptance after observing a failure is not.

## Common errors

- Using K as B's address stride or M as C's stride.
- Creating one output block per K slice and therefore multiple writers.
- Letting an invalid output thread return before a barrier.
- Leaving a K-tail shared slot stale instead of zero-filling it.
- Using only absolute or relative error without declaring that contract.
- Reporting a host-reference pass, source inspection, or VIS12 state as CUDA evidence.

Reviewed: **2026-08-31**. All four evidence arrays remain empty.
