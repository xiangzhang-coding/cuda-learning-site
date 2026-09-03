---
title: 'A11 Reviewed Solutions: Attention Numerics, Tile Merge, and an IO Ledger'
description: Review the scaled attention row, exact cross-tile merge, VIS18 traffic, valid alternatives, and common errors.
pairId: a11-solutions
counterpart: /algorithms/attention-as-an-io-problem/solutions/
factCheckDate: '2026-09-03'
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
unitId: A11-SOLUTIONS
prerequisites:
  - A11-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a11-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/attention-as-an-io-problem/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A11-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/attention-as-an-io-problem/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed solutions for the [A11 Exercises](/en/algorithms/attention-as-an-io-problem/exercises/). Numbers are rounded real-arithmetic references and traffic is a static logical ledger; neither is a GPU observation.

## Solution 1: Scaled attention row

Dot products are `[1,0,1]`; dividing by `sqrt(2)` gives `[0.70710678,0,0.70710678]`. After subtracting the maximum, weights are `[1,exp(-0.70710678),1] ~= [1,0.49306869,1]` with denominator `2.49306869`. Thus P is approximately `[0.40111209,0.19777581,0.40111209]`. `O[0]=p0+3p2=1.60444837`; `O[1]=2p1+p2=0.79666372`. P is nonnegative and sums to one. Display rounding grants no bitwise claim.

## Solution 2: Two-tile merge

The first tile `[2,1]` gives `(m_1,l_1,a_1)=(2,1+exp(-1),1+2exp(-1)) ~= (2,1.36787944,1.73575888)`. The second tile `[3,0]` gives `(3,1+exp(-3),4+8exp(-3)) ~= (3,1.04978707,4.39829655)`. Merged maximum is 3, so old state is multiplied by `exp(-1)`, producing `l=1.55300179`, `a=5.03684655`, and `o=a/l=3.24329732`. Full-row shifted weights `[exp(-1),exp(-2),1,exp(-3)]` give the same real result.

## Solution 3: VIS18 traffic

Materialized score counts 64 Q/K reads plus 64 S writes, or 128 elements. Normalize counts three S reads plus one P write, or 256. Value counts 64 P reads, 32 V reads, and 32 O writes, or 128. Total is 512 elements or `2048 B`. Tiling has `T_r=T_c=2` and four `4x4` score tiles: score reads 32 Q and 64 K elements, or 96; normalize crosses no boundary, or zero; value reads 64 V elements and writes 32 O elements, or 96. Total is 192 elements or `768 B`, a `1280 B` static difference. Actual transactions, cache, time, and backend remain unknown.

## Valid alternatives

- Substitute another small finite Q/K/V fixture if shapes, scale, and independent reference are explicit.
- Merge more tiles if every step preserves the `(m,l,a)` invariant.
- Choose a K/V-outer schedule, but recalculate Q/O state replay and residency.
- Add a mask only with an all-masked-row, neutral-value, and traffic contract.

## Common errors

- Use `d_v` for the scale or apply softmax along the query dimension.
- Conflate scaling and max shifting or silently omit one.
- Rescale `l` but not `a` when the maximum changes.
- Interpret normalize's `0 B` as zero arithmetic work.
- Call the VIS18 query-outer ledger FlashAttention implementation traffic.
- Infer actual speedup or backend selection from static logical bytes.

Review date: **2026-09-03**. All four evidence arrays remain empty.
