---
title: 'T01 Exercises: Prove Logical Ownership'
description: Derive program ownership and recover row-major coordinates without inventing a physical lane layout.
pairId: t01-exercises
counterpart: /triton/programs-and-block-values/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T01-EXERCISES
prerequisites: [T01]
relatedUnits: [VIS17]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton language semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper exercise', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/programs-and-block-values/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T01 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: VIS17 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/programs-and-block-values/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Complete [T01](/en/triton/programs-and-block-values/) first; exact prerequisite `[T01]`. Work on paper before using [VIS17](/en/visuals/simt-triton-mapping/). No GPU is needed and no Evidence Status is granted. Original Exercises, source-reviewed 2026-09-14 against [SRC-CUDA-087](/en/sources-and-versions/#src-cuda-087).

## Exercise 1: a nonmatching grid

**Goal:** map `N=73` with Triton `B=32`, compared with CUDA blocks of 64 threads. Locate indices 63, 64 and 72 in both models. Count programs, CUDA blocks, and invalid positions in each grid.

**Constraints:** use zero-based indices and contiguous scalar CUDA ownership. Do not assign a Triton physical lane from `i % B`.

**Acceptance:** submit quotient/remainder formulas, all three ownership pairs, tail counts, and a proof that every valid output has exactly one logical owner.

<details><summary>Hint 1: separate the divisors</summary>CUDA divides the global index by 64; Triton divides it by 32. The remainder has a different meaning in each model.</details>
<details><summary>Hint 2: count coverage before subtracting</summary>Round each grid up independently, multiply by its own block extent, then subtract 73. Use uniqueness of integer quotient and remainder for the ownership proof.</details>

## Exercise 2: flattening is a choice

**Goal:** map a row-major `5 × 7` matrix through a flattened Triton grid with `B=16`. Identify the row/column coordinates handled by the last program and explain why `program_id(0)` is not necessarily a matrix row.

**Constraints:** no padded rows, no changed stride and no physical lane assumptions. A store is valid only for an index less than the logical element count.

**Acceptance:** show the grid, last program's index interval, all valid row/column pairs, mask count, and a counterexample to treating program ID as row ID.

<details><summary>Hint 1: start with the total size</summary>The flattened vector has 35 elements. Recover row and column by quotient and remainder with width 7.</details>
<details><summary>Hint 2: separate shape and validity</summary>The last program still has 16 logical positions. Only indices below 35 are valid; its program ID and recovered row need not match.</details>

## Review separately

Open the [reviewed solutions](/en/triton/programs-and-block-values/solutions/) after submitting both derivations. Return to [T01](/en/triton/programs-and-block-values/) if grid count and physical thread count are still mixed.
