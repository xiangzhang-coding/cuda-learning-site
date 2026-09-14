---
title: 'T04 Exercises: Own the Tile and Check Precision'
description: Implement three independent masks and audit stored-input correctness.
pairId: t04-exercises
counterpart: /triton/blocked-matrix-multiplication/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T04-EXERCISES
prerequisites: [T04]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton dot and masks', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/blocked-matrix-multiplication/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T04 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/blocked-matrix-multiplication/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[T04]**: [blocked multiplication](/en/triton/blocked-matrix-multiplication/). Use paper first and a learner copy of [LAB16](/en/labs/autotune-triton-gemm/) for execution, inheriting its Linux/GPU gates. Evidence arrays remain empty. Source review: 2026-09-14, [SRC-CUDA-089](/en/sources-and-versions/#src-cuda-089).

## Exercise 1: implement the rectangular tail

**Goal:** implement `blocked_product` with the Lab signature, one program per output tile and a K loop. Derive the last program for `(M,N,K)=(65,97,63)` and `(BM,BN,BK)=(32,64,32)`.

**Constraints:** contiguous FP16 inputs/output, FP32 accumulator, separate A/B load and C store masks; no atomics, modulo-wrapped output or deliberately unsafe launches. Keep all four candidates and the oracle unchanged.

**Acceptance:** give the grid, K-loop count, valid output coordinates, final K validity and all pointer formulas; explain zero fill. Submit your diff and passing full Lab candidate checks, or the hardware blocker with host progress.

<details><summary>Hint 1: split ownership from reduction</summary>The grid covers M/N; each program iterates K. Only the K coordinate changes inside the loop.</details>
<details><summary>Hint 2: intersect two conditions at each memory operation</summary>A needs row/inner validity, B inner/column validity, and C row/column validity. Broadcast a column vector and a row vector to form each pointer matrix.</details>

## Exercise 2: reject a misleading precision check

**Goal:** audit “FP32 accumulation makes FP16 input storage irrelevant; matching native output with equal NaNs is enough; a clean tail proves load safety.”

**Constraints:** keep the Lab's `0.02 + 0.002*abs(reference)` threshold and finite requirement. Do not manufacture GPU output or use the candidate as its own oracle.

**Acceptance:** identify all three incorrect statements, specify stored-value reference construction, and calculate the exact product of A=`[[1,-2,3],[0,4,-1]]` and B=`[[2,1],[3,-1],[-2,2]]`. Explain which failures remain detectable if native and Triton share a bug.

<details><summary>Hint 1: name three precision boundaries</summary>Input rounding occurs before accumulation; output rounding occurs after it. A wider accumulator cannot undo the first boundary.</details>
<details><summary>Hint 2: test an independent value</summary>Use scalar double products and compensated summation of the stored values. Require finiteness before the tolerance comparison, and retain input/guard checks as additional evidence.</details>

## Review separately

Open the [solutions](/en/triton/blocked-matrix-multiplication/solutions/) after attempting both tasks. [PB-R5-017](/en/practice/#pb-r5-017) adds an unseen K-tail audit.
