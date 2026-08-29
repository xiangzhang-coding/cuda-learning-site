---
title: 'Q01 Reviewed Solutions: Design a layered correctness oracle'
description: An independent mixed-output reference, a worked tolerance table, and a histogram gate matrix for the Q01 Exercises.
pairId: q01-solutions
counterpart: /correctness/cpu-references-tolerances-invariants/solutions/
factCheckDate: '2026-08-28'
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
unitId: Q01-SOLUTIONS
prerequisites:
  - Q01-EXERCISES
relatedUnits:
  - Q01
  - Q03
  - Q05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q01-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q01,Q03,Q05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/cpu-references-tolerances-invariants/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the reviewed answers for the [Q01 Exercises](/en/correctness/cpu-references-tolerances-invariants/exercises/). They are static designs and hand calculations, not results from a compiled or executed CUDA program.

## Solution 1: Derive an independent mixed-output reference

One reviewable reference makes no mention of blocks or threads:

```text
require finite alpha, beta, threshold and finite input elements
scores = empty sequence
for each x in logical input order:
    append clamp(double(alpha) * double(x) + double(beta), 0, 1)

if scores is empty:
    winner_index = no-index
    accepted_count = 0
else:
    winner_index = first index of the largest score
    accepted_count = number of scores >= threshold
```

The contract must choose an unambiguous `no-index` representation. Scores use the declared floating policy after conversion to the comparison type. Output length, `winner_index`, and `accepted_count` use exact equality. Useful hand cases are an empty input, values that clamp at both ends, and two equal maxima that must select the lower index. This reference derives one ordered host traversal from the logical sequence and therefore cannot share a grid-stride bound error.

Using double intermediates creates a higher-precision target; it does not assert that a float GPU path should reproduce each intermediate bit. The tolerance rationale must account for that distinction.

## Solution 2: Audit one absolute-plus-relative policy

| `r` | `g` | `error` | `limit = 1e-6 + 1e-5 * abs(r)` | decision |
| ---: | ---: | ---: | ---: | --- |
| `0` | `4e-7` | `4e-7` | `1e-6` | pass |
| `2` | `2.00003` | `3e-5` | `2.1e-5` | fail |
| `1e6` | `1000000.4` | `0.4` | `10.000001` | pass |
| `NaN` | `NaN` | not evaluated | not evaluated | use the declared NaN policy; otherwise fail |

The first row demonstrates the absolute floor. The third demonstrates scale-aware relative allowance. The middle failure is a result of this policy, not proof that the candidate algorithm is wrong: the thresholds still need an error-budget or domain rationale. Likewise, the large row's pass does not prove that an absolute error of `0.4` is acceptable to the application.

## Solution 3: Build independent gates for a normalized histogram

| gate | comparator | catches |
| --- | --- | --- |
| CPU `counts` reference | exact per bin | wrong boundary assignment or indexing |
| CPU `probabilities` reference | declared abs+rel per bin | numerical or normalization computation errors |
| output shape and `sample_count` | exact | missing or extra bins and wrong metadata |
| `sum(counts) == sample_count` | exact invariant | dropped or duplicated samples, including a shared reference defect |
| every `count >= 0` | exact invariant | invalid discrete state |
| each probability in `[0, 1]` | declared bound policy | invalid normalization range |
| probability sum near `1` for non-empty input | separately justified tolerance | normalization failure |
| `max_bin` and lowest-index tie rule | exact | wrong reduction winner or tie handling |

For empty input, define zero counts, zero probabilities, zero `sample_count`, and the chosen exact no-index value; do not demand a probability sum of one. Boundary fixtures place samples exactly below, on, and above a bin edge. Failure diagnostics name the gate, bin, candidate, reference, error, and limit where applicable. Every gate is conjunctive: one failure blocks timing.

## Valid alternatives

- An exact rational or arbitrary-precision reference can replace double arithmetic when the domain warrants it.
- A symmetric relative scale such as `max(abs(g), abs(r))` can be valid when declared and justified, but it is a different contract from the reference-anchored formula in Q01.
- Property-based generation can add cases, provided each invariant and comparator remains explicit and reproducible.
- Two independently implemented references can strengthen confidence when neither one is easily hand verified.

## Common errors

- Translating the kernel's launch-index arithmetic directly into the CPU reference.
- Applying one tolerance to floats, indices, counts, and flags alike.
- Using relative error alone near zero or absolute error alone across many scales.
- Increasing thresholds after observing a failure without an external rationale.
- Letting NaN pass through an ordinary comparison.
- Treating matching CPU/GPU arrays or one satisfied invariant as a complete proof.
- Starting timing while any correctness gate remains unresolved.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
