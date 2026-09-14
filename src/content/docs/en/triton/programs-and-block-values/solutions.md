---
title: 'T01 Reviewed Solutions'
description: Check quotient/remainder ownership, flattened matrix coordinates and limits of logical lane claims.
pairId: t01-solutions
counterpart: /triton/programs-and-block-values/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, practice-bank, sources]
resourceKind: solution-set
unitId: T01-SOLUTIONS
prerequisites: [T01-EXERCISES]
relatedUnits: [T01]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton language semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper solution', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/programs-and-block-values/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,practice-bank,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: T01 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/programs-and-block-values/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review after attempting

Exact prerequisite `[T01-EXERCISES]`: finish the [Exercises](/en/triton/programs-and-block-values/exercises/) before checking. These are logical derivations with four empty evidence arrays, not execution results.

## Solution 1: independent quotient and remainder

Triton needs three programs, covering 96 positions and masking 23. CUDA needs two 64-thread blocks, covering 128 positions and guarding 55. Triton ownership is `(i//32, i%32)`; CUDA ownership is `(i//64, i%64)`.

| Index | Triton program / position | CUDA block / thread |
| --- | --- | --- |
| 63 | 1 / 31 | 0 / 63 |
| 64 | 2 / 0 | 1 / 0 |
| 72 | 2 / 8 | 1 / 8 |

For each valid nonnegative `i`, division by the chosen positive block extent has exactly one quotient and one remainder in range. That proves logical coverage and uniqueness. A logical position does not determine Triton's physical lane. Confusing either grid count with thread count fails the acceptance contract.

## Solution 2: a program is not a matrix row

There are 35 values and three programs. Program 2 constructs indices 32–47. Only 32, 33 and 34 are valid, recovering `(row,column)=(4,4),(4,5),(4,6)`; thirteen positions are masked. Program ID 2 and row 4 are already a counterexample. Earlier programs can also cross row boundaries: a tile covers 16 elements while a row contains seven. A one-dimensional grid does not imply a one-dimensional original problem.

## Practice Bank review

<a id="pb-r5-013-solution"></a>
For [PB-R5-013](/en/practice/#pb-r5-013), `B=256` and four NVIDIA warps describe 256 logical values and 128 threads, respectively. The arithmetic average is two values per thread, not proof that position `j` belongs to lane `j%32` or that each thread owns a particular contiguous pair. Reject the claimed physical mapping and request the exact compiler target/options plus inspected generated layout/code. Correct logical masks and a browser diagram cannot supply those observations.

## Sources and return

Return to [T01](/en/triton/programs-and-block-values/). [SRC-CUDA-087](/en/sources-and-versions/#src-cuda-087), reviewed 2026-09-14, grounds the program and shape semantics. Original solutions: CC BY 4.0.
