---
title: 'T05 Exercises: Preserve the Search and Reject False Winners'
description: Implement a configuration record and repair a cold-call comparison.
pairId: t05-exercises
counterpart: /triton/autotuning/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T05-EXERCISES
prerequisites: [T05]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton autotuner', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/runtime/autotuner.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/autotuning/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T05 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/autotuning/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[T05]**: [autotuning](/en/triton/autotuning/). Work on a learner copy of [LAB16](/en/labs/autotune-triton-gemm/) under its exact gates. Evidence arrays stay empty. Reviewed 2026-09-14; [SRC-CUDA-089](/en/sources-and-versions/#src-cuda-089).

## Exercise 1: implement an auditable search

**Goal:** implement a `do_bench(fn, quantiles)` callback that retains all samples, returns a median objective and records the selected Config with its full shape/device context.

**Constraints:** use the Lab's four candidates and M/N/K key; no pruning or disk selection cache; do not duplicate metadata at launch. All candidates pass correctness before search. An incomplete/nonfinite measurement must fail rather than disappear.

**Acceptance:** retain candidate order, every raw sample, objective, selected metadata and separate compile/search/cache-hit/warm-up/steady-state records. A same-key repeat invokes no new candidate benchmark. Recompute the selection independently and validate the selected output again. Submit actual reports or the precise execution blocker.

<details><summary>Hint 1: the callback result is not the report</summary>Return a scalar for selection, while appending a structured record containing raw data. Do not reduce the retained report to one minimum.</details>
<details><summary>Hint 2: fail closed at the boundary</summary>Check expected candidate count, finite positive samples and selected Config membership/objective. A new tuner isolates each shape; a direct selected JIT call keeps the search out of steady-state timing.</details>

## Exercise 2: repair a cold-call claim

**Goal:** audit a hypothetical report: “The first autotuned call took 40 ms, native took 0.1 ms, therefore Triton is 400 times slower. A cache hit proves warm GPU data. The chosen tile wins on every device.” These are fictional teaching inputs, not observations.

**Constraints:** do not invent replacement measurements. Preserve one-shot costs rather than deleting them; retain per-shape results and exact environment requirements.

**Acceptance:** distinguish the arithmetic ratio from a fair steady-state ratio, name four caches, propose a phase-separated rerun with matched outputs and three rounds, list the manifest coordinates and give a policy for missing hardware or inconclusive differences.

<details><summary>Hint 1: ask what the stopwatch includes</summary>The first call can compile and benchmark multiple candidates. The native time must have the same scope before a ratio is meaningful.</details>
<details><summary>Hint 2: separate selection reuse from data reuse</summary>JIT artifacts, in-memory selections, disk selections and GPU data are different caches. None replaces clocks, load, device identity or correctness records.</details>

## Review separately

Attempt both tasks before opening the [solutions](/en/triton/autotuning/solutions/). [PB-R5-018](/en/practice/#pb-r5-018) asks whether a same-key selection can travel to a second GPU.
