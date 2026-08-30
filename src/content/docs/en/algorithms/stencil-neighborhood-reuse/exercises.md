---
title: 'A06 Exercises: Boundary Policies, 2D Halos, and Reuse Arithmetic'
description: Use three deeper tasks to derive one-dimensional boundary outputs, prove two-dimensional center/side/corner coverage, repair the barrier phase, and compute a reuse budget.
pairId: a06-exercises
counterpart: /algorithms/stencil-neighborhood-reuse/exercises/
factCheckDate: '2026-08-30'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: A06-EXERCISES
prerequisites:
  - A06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a06-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/stencil-neighborhood-reuse/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A06 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/stencil-neighborhood-reuse/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A06: Stencil Neighborhoods, Halos, and Cooperative Reuse](/en/algorithms/stencil-neighborhood-reuse/) first. The tasks require only hand-built tables, coverage proofs, and phase ledgers. They introduce no executable and produce no runtime evidence.

## Instructions

State stencil shape and boundary policy before calculating addresses or counts. Keep reuse arithmetic and performance claims in separate columns.

## Exercise 1: Derive four boundary contracts for one input

**Goal:** For input `[2,4,6,8]`, radius 1, and weights `[1,1,1]`, derive the outputs of a centered one-dimensional stencil under `valid`, `clamp`, `zero`, and `periodic`, including an index/value trace for every edge neighborhood.

**Constraints:** `valid` produces only complete neighborhoods; the other policies preserve four output positions; periodic uses normalized modulo for a negative index; do not mix policies; all sums use exact integer arithmetic.

**Expected evidence:** Four output vectors, an edge index/value table, an output-domain statement for each policy, and the CPU-reference rule.

**Acceptance criteria:** Interior positions 1 and 2 retain the same sum under every applicable contract; every edge value traces to an explicit source, clamped endpoint, zero, or wrapped index; no out-of-bounds read occurs; the four results are not described as one contract.

<details><summary>Hint 1</summary>Start with the requested indices `[-1,0,1]` for position 0.</details>

<details><summary>Hint 2</summary>For length 4, a normalized periodic index is `((i % 4) + 4) % 4`.</details>

## Exercise 2: Cover center, side halos, and corner halos

**Goal:** A two-dimensional output tile is 3 high and 4 wide with square radius 1. Draw the full staged rectangle, linearize its 30 positions, and assign them to 8 threads so thread `t` owns indices `t, t+8, ...`.

**Constraints:** Label the 12 center positions, top/bottom, left/right, and four corners separately; use staged width 6 for the linear index; every staged slot has exactly one writer; all 8 threads reach the barrier after loading.

**Expected evidence:** A labeled `5 x 6` diagram, eight per-thread index lists, the linear-to-2D mapping rule, and coverage/uniqueness/barrier proofs.

**Acceptance criteria:** All indices `0..29` appear exactly once; corners `0,5,24,29` all have owners; no corner is double-counted as a side strip; barrier participants are 8 regardless of each thread's load count.

<details><summary>Hint 1</summary>Use `sy = floor(q / 6)` and `sx = q mod 6`.</details>

<details><summary>Hint 2</summary>Threads 6 and 7 may have fewer loads than the others without changing participation.</details>

## Exercise 3: Repair an early return and calculate reuse budgets

**Goal:** Replace a broken skeleton where an invalid-output thread returns before cooperative load with a uniform `load -> barrier -> compute` phase, then calculate two interior reuse budgets: one-dimensional `B=8,r=2`, and a two-dimensional square stencil with `T_y=T_x=8,r=1`.

**Constraints:** Select `zero` boundary policy consistently for loader and reference; the whole block defines staged slots and reaches the barrier; only a valid output owner computes and stores; counts compare only direct logical requests with complete staged unique positions; do not convert them into timing or speedup.

**Expected evidence:** Repaired pseudocode, a participant ledger, one-dimensional and two-dimensional count equations, and an expected-reuse/observed-performance table.

**Acceptance criteria:** One-dimensional counts are `8*5` and `8+4`; two-dimensional counts are `8*8*9` and `10*10`; an invalid owner does not return early; all performance fields remain `unrecorded`.

<details><summary>Hint 1</summary>Replace the early return with `output_valid`; do not delete the thread's load assignment.</details>

<details><summary>Hint 2</summary>The count ratio describes address-reuse opportunity and excludes barrier and transaction costs.</details>

## Next

Inspect the separate [reviewed solutions](/en/algorithms/stencil-neighborhood-reuse/solutions/), then audit [PB-R2-018](/en/practice/#pb-r2-018) and carry the same neighborhood ledger into [A07](/en/algorithms/convolution-reuse-layout/).
