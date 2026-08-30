---
title: 'Q02 Reviewed Solutions: Audit numerical order and reproducibility contracts'
description: The reduction-order hand trace, FMA and compiler-ledger review, and tolerance, determinism, and bitwise reproducibility claim matrix for the three Q02 Exercises.
pairId: q02-solutions
counterpart: /correctness/floating-point-order-reproducibility/solutions/
factCheckDate: '2026-08-30'
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
unitId: Q02-SOLUTIONS
prerequisites:
  - Q02-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q02-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/floating-point-order-reproducibility/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the reviewed answers for the [Q02 Exercises](/en/correctness/floating-point-order-reproducibility/exercises/). They are static hand reasoning and review templates, not a compiled executable, GPU observation, or bitwise evidence.

## Solution 1: Hand-calculate two reduction orders

Let every `rn` store back to binary32:

```text
left fold:
rn(a + b)       = rn(1e20f + -1e20f) = 0.0f
rn(0.0f + c)    = 3.14f               = rounded c

other tree:
rn(b + c)       = -1e20f              = c is below local spacing
rn(a + -1e20f)  = 0.0f
```

Thus `(a + b) + c` yields the stored `3.14f`, while `a + (b + c)` yields `0.0f`. The expressions agree in real arithmetic; in binary32, their first roundings discard different quantities. A serial left fold over input order `[a,b,c]` uses the first tree. A three-leaf tree that first forms partial `(b+c)` uses the second.

This result requires no race and does not prove that either tree is generally more accurate. It proves only that parenthesization and reduction order belong to the numerical algorithm.

## Solution 2: Audit FMA and a compiler/environment ledger

| Profile | Effective semantic review | Defensible statement |
| --- | --- | --- |
| A: `--fmad=true` | Ordinary `alpha*x + beta` may contract to `rn(alpha*x+beta)` with one rounding; actual contraction still depends on the expression and compilation | Contraction permitted, not "every expression is fused" |
| B: `--fmad=false` | An ordinary expression retains the two roundings of `rn(rn(alpha*x)+beta)`; explicit FMA remains explicit FMA | Implicit contraction disabled, not "bitwise portable across compilers and GPUs" |
| C: `--use_fast_math` | Implies `--ftz=true --prec-div=false --prec-sqrt=false --fmad=true` and may select intrinsics with different accuracy contracts | A different numerical configuration whose tolerance rationale needs review |

One minimal complete ledger is:

| Scope | Record |
| --- | --- |
| Source/algorithm | commit, EX11 `cpu-reference` or GPU variant, and stage pairings |
| Input | type, size, exact bytes, logical order, and non-finite policy |
| Build | Toolkit, `nvcc`, host compiler, target architecture, complete and effective flags, and explicit intrinsics |
| Environment | GPU, compute capability, driver, OS, relevant variables, math or CUB version, and selected policy |
| Launch | grid/block shape, elements per thread, partial order, and stream or atomic strategy |
| Claim | same-build or cross-build scope, comparator, and predeclared `atol`/`rtol` rationale |

Profiles A, B, and C alter FMA and rounding policy. C also changes denormal, division, square-root, and selected function paths. Even if the current EX11 fixture exercises only part of that surface, the ledger retains the complete effective configuration. Without observed outputs, review semantics only; do not forecast exact bits.

## Solution 3: Split three claims into three tests

| Claim | Fixed setup | Comparator | Meaning of pass |
| --- | --- | --- | --- |
| Numerical acceptance | exact input, independent serial CPU reference, and predeclared non-finite and scale policy | `abs(g-r) <= atol + rtol*abs(r)` | Candidate satisfies this problem-specific accuracy contract; repeatability is not tested |
| Determinism | same source/build/device/input/launch/library policy, with fixed algorithm and reduction-order controls | declared run-to-run observable and equality predicate, retaining every raw output | No contract-forbidden algorithm or order variation was observed in this scope; another environment is outside the claim |
| Bitwise reproducibility | two named environments with complete ledgers and exactly the same input bytes | exact floating-point representations under the declared zero and NaN policy | Identical bits were observed only between these environments in this comparison scope |

One valid counterexample is a fixed executable whose unordered atomic reduction produces slightly different low bits on repeated runs while every result passes a justified tolerance. It satisfies numerical acceptance but not the declared deterministic-order or bitwise checks. Another is a deterministic kernel that always produces the same wrong value: it can satisfy run-to-run bitwise equality while failing numerical acceptance.

On failure, retain exact inputs, every raw output bit pattern, the first differing index and value, CPU reference, `error` and `limit`, algorithm and tree identifier, compile commands, Environment Manifest, and launch policy. Issue three separate verdicts. Tolerance acceptance is never bitwise reproducibility.

## Valid alternatives

- A domain-justified ULP bound, interval oracle, or error bound can replace the reference-anchored abs+rel formula, but it is a different numerical contract and must be named accordingly.
- Pairwise, compensated, or higher-precision summation can improve error behavior. Each changes the algorithm, so record the new order and acceptance rationale.
- A pinned CUB primitive may be used with an explicitly supported determinism guarantee. The claim is limited to that CCCL version, algorithm, type and operator constraints, and scope.
- When one-rounding semantics are required, use an explicit FMA intrinsic or function rather than inferring contraction from an optimization level.
- A cross-lane check can widen scope incrementally: same-executable run-to-run first, then same build and GPU class, and only then named Toolkit and architecture pairs.

## Common errors

- Treating real-number associativity as floating-point associativity.
- Requiring a parallel reduction to equal a differently ordered serial CPU reference bit for bit without fixing the same operation graph.
- Treating `--fmad=false` as a universal accuracy fix or portability guarantee.
- Describing `--use_fast_math` as performance-only rather than a change to numerical semantics.
- Enlarging tolerance after seeing a mismatch or labeling a tolerance pass as bitwise reproducibility.
- Treating a deterministic result as a correct result, or a fixed random seed as a fixed reduction order.
- Recording only a Toolkit major version while omitting compiler flags, target, driver, GPU, library policy, and launch geometry.
- Claiming runtime Evidence Status from a static page, source excerpt, or hand calculation.

Reviewed: **2026-08-30**. Compilation, runtime, expected-observation, and recorded-observation evidence axes remain empty.
