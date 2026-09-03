---
title: 'A10 Reviewed Solutions: Stable Softmax, Online State, and a Traffic Ledger'
description: Review large-offset softmax values, the online invariant, pass and fusion traffic, valid alternatives, and common errors.
pairId: a10-solutions
counterpart: /algorithms/numerically-stable-softmax/solutions/
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
unitId: A10-SOLUTIONS
prerequisites:
  - A10-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a10-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/numerically-stable-softmax/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A10-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/numerically-stable-softmax/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed solutions for the [A10 Exercises](/en/algorithms/numerically-stable-softmax/exercises/). Every number is rounded host arithmetic or static accounting, not a CUDA observation.

## Solution 1: Large-offset stable softmax

`m=1003` and shifted logits are `[-3,-2,-1,0]`. Exponentials are approximately `[0.04978707,0.13533528,0.36787944,1]`, with denominator `1.55300179`. Division yields `[0.03205860,0.08714432,0.23688282,0.64391426]`. Every term is nonnegative and displayed values sum to about one. Max shifting avoids positive-exponent overflow; a very negative shifted exponent can still underflow to zero.

## Solution 2: Online-normalizer invariant

The four states are `(1000,1)`, `(1001,1*exp(-1)+1=1.36787944)`, `(1002,1.36787944*exp(-1)+1=1.50321472)`, and `(1003,1.50321472*exp(-1)+1=1.55300179)`. The third state also equals `exp(-2)+exp(-1)+1`; the fourth equals `exp(-3)+exp(-2)+exp(-1)+1`, validating the invariant at the current maximum. Pass one obtains final `(m,l)`. Unless logits remain in fast storage, pass two rereads them and writes `exp(x_i-m)/l`.

## Solution 3: Pass and fusion traffic

The stable schedule counts `4*1024=4096` elements or `16384 B`. Online plus output counts `3*1024=3072` elements or `12288 B`, a `4096 B` static difference. Under the stated assumptions, fusion removes `2*4096=8192` intermediate-element transfers, or `2*4096*4=32768 B`. These are logical requested bytes only. Actual transferred bytes, cache behavior, spills, resource pressure, elapsed time, and speedup remain unknown.

## Valid alternatives

- Use any finite fixture with a common large offset if the independent reference and display precision are explicit.
- Use a blocked merge instead of an element-by-element online scan if the same `(m,l)` invariant is proved.
- Choose a different memory boundary, but restate included and excluded traffic.
- Materialize exponentials, but increase pass count and the ledger accordingly.

## Common errors

- Evaluate raw exponentials of large positive logits and treat overflow as part of the softmax definition.
- Equate overflow avoidance with absence of underflow or rounding error.
- Fail to rescale the old denominator after the maximum changes.
- Omit the second read needed to emit probabilities.
- Report a `2Mb` static difference as actual DRAM traffic or speedup.
- Treat host arithmetic or this solution page as CUDA Evidence Status.

Review date: **2026-09-03**. All four evidence arrays remain empty.
