---
title: 'T03 Exercises: Implement and Audit Softmax'
description: Implement a stable masked reduction and distinguish a byte ledger from runtime evidence.
pairId: t03-exercises
counterpart: /triton/fused-softmax/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T03-EXERCISES
prerequisites: [T03]
relatedUnits: [LAB15]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton reduction source', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/standard.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/fused-softmax/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T03 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB15 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/fused-softmax/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[T03]**: [fused softmax](/en/triton/fused-softmax/). Work on paper before using a learner copy of [LAB15](/en/labs/verify-fused-softmax/). Implementation execution inherits that Lab's exact Linux/GPU gates. All evidence arrays here stay empty. Reviewed 2026-09-14; [SRC-CUDA-088](/en/sources-and-versions/#src-cuda-088).

## Exercise 1: implement a stable padded row

**Goal:** implement `normalize_rows` with one program per row and the Lab's unchanged signature. Explain the outputs for three equal −1000 logits and for `[1000,1001,1002]` before checking code.

**Constraints:** FP32 finite contiguous rows, width at most 2048, no atomics, no communication between rows, no `tl.softmax` shortcut. Explicitly use max, exp and sum; load/store masks must protect every tail. Do not run a deliberately unsafe unmasked candidate.

**Acceptance:** predict width 33's tile and invalid columns; justify the neutral load fill; state the four-stage arithmetic; pass every LAB15 oracle/finite/row-sum/guard check without changing tolerances. Include why a passing host oracle is not a GPU result. Submit your implementation diff and actual stage exits, or the hardware blocker.

<details><summary>Hint 1: give padding a neutral role</summary>The maximum must ignore invalid positions, and their exponentials must add zero. A zero logit is generally not neutral.</details>
<details><summary>Hint 2: separate address validity from reduction</summary>Use a power-of-two tile, `columns &lt; WIDTH` on both memory operations, and a negative-infinity fill. Subtract one row maximum before exponentiation; normalize by one row sum.</details>

## Exercise 2: repair a performance claim

**Goal:** audit a hypothetical report for `R=5,C=33`: “The byte ratio is the speedup; the first launch is steady state; `warmup=25` means 25 iterations; four warps is optimal.” No measurements or manifest accompany it.

**Constraints:** do not invent replacement times. Compare against native `torch.softmax` using the same dtype, shape and preallocated-output scope. Preserve compilation and tuning costs separately.

**Acceptance:** calculate materialized and fused logical bytes, label what the ratio means, correct each statement, specify oracle and timing gates, raw statistics and manifest coordinates, and retain Pending Hardware Verification. Include at least one narrow-row and one wide-row case and a policy for inconclusive differences.

<details><summary>Hint 1: attach a unit to every count</summary>There are 165 FP32 values. The materialized ledger has row-sized terms too; multiply element counts by four bytes.</details>
<details><summary>Hint 2: choose a measurement scope before looking at results</summary>A fresh-cache compile request, first execution, device warm-up and repeated device-event samples are different phases. The selected helper takes time budgets; a declared warp count is not a measured selection.</details>

## Review separately

Open the [solutions](/en/triton/fused-softmax/solutions/) after answering. [PB-R5-015](/en/practice/#pb-r5-015) tests an unseen padding failure; [PB-R5-016](/en/practice/#pb-r5-016) tests benchmark-scope reasoning.
