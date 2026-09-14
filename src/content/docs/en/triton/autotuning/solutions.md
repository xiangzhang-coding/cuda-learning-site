---
title: 'T05 Solutions: Audit the Selected Configuration'
description: Preserve cold costs and restrict performance conclusions to qualified measurements.
pairId: t05-solutions
counterpart: /triton/autotuning/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice, next]
resourceKind: solution-set
unitId: T05-SOLUTIONS
prerequisites: [T05-EXERCISES]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton autotuner', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/runtime/autotuner.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/autotuning/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/autotuning/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Exact prerequisite **[T05-EXERCISES]**: complete the [Exercises](/en/triton/autotuning/exercises/) first. No solution is a GPU observation. Reviewed 2026-09-14; [SRC-CUDA-089](/en/sources-and-versions/#src-cuda-089).

## Solution 1: a selection needs its candidate history

The callback accepts both arguments, records `return_mode='all'` samples, checks positivity/finiteness and returns their median. Record the four candidates in declared order and verify the chosen Config equals the first minimum-median candidate. Retain incomplete attempts and their failed phase, never serialize a missing candidate as a success. The Lab's original `check.py` and `contract.py` implement this acceptance boundary.

Run compile requests and every candidate's correctness before search, warm each candidate, then search with a new shape-local tuner. The same-key call must leave callback count unchanged. Revalidate the selected output. Warm the selected direct launch and native output-matched baseline, then collect new three-round steady-state samples. Keep search and cache-hit wall times separately: neither is a steady-state kernel event statistic.

## Solution 2: a ratio needs a shared scope

`40/0.1=400` is valid arithmetic on the fictional inputs, but not a steady-state slowdown conclusion. The numerator may contain compilation and search; the denominator's scope is unspecified. Preserve those costs for a one-shot analysis and separately collect matched steady-state samples. Do not discard cold cost or add inner samples to the outer wall-time total.

JIT artifact, in-memory selection, disk selection and GPU data caches have different roles. Record GPU UUID/CC/memory, driver, package lock, Python/torch/Triton/toolchain, source hash/commit, shape/dtype/strides/precision, candidates, synchronization/cache scope, warm-up, clocks/power/load and raw repeated statistics. Missing qualifying hardware leaves Pending Hardware Verification. Overlapping or unstable rounds justify an inconclusive decision, not cherry-picking.

## Practice Bank review

[PB-R5-018](/en/practice/#pb-r5-018): an M/N/K-plus-dtype key is not device identity. Do not reuse a first GPU's cached selection as evidence for a second. Use a fresh process/tuner and repeat environment, correctness, search and post-selection timing for the second device. Preserve both manifests and conclusions separately, even when the selected Config happens to match. No new result is implied by this answer.

## Continue

Return to [LAB16](/en/labs/autotune-triton-gemm/) and [T05](/en/triton/autotuning/). Original solutions use CC BY 4.0. A reviewed independent Environment Manifest is necessary before interpreting an autotuner choice as qualified evidence.
