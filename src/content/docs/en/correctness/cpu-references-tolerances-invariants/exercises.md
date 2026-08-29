---
title: 'Q01 Exercises: Design a layered correctness oracle'
description: Design an independent CPU reference, audit a scale-aware tolerance table, and combine exact outputs with independent invariants in three static tasks.
pairId: q01-exercises
counterpart: /correctness/cpu-references-tolerances-invariants/exercises/
factCheckDate: '2026-08-28'
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
unitId: Q01-EXERCISES
prerequisites:
  - Q01
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
    attrs: { name: 'cuda:pair-id', content: q01-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q01 }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/cpu-references-tolerances-invariants/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q01: CPU References, Tolerances, and Invariants](/en/correctness/cpu-references-tolerances-invariants/) first. These Exercises produce static oracle specifications and hand calculations. They do not compile or run CUDA.

## Instructions

Write each acceptance rule before evaluating the fixture. Keep reference comparison, exact comparison, and invariant checks in separate columns. Work all three tasks before opening the [reviewed solutions](/en/correctness/cpu-references-tolerances-invariants/solutions/).

## Exercise 1: Derive an independent mixed-output reference

**Goal:** Design a CPU reference for an operation that maps each finite input `x[i]` to `score[i] = clamp(alpha * x[i] + beta, 0, 1)`, returns the lowest `winner_index` having the maximum score, and returns `accepted_count` for scores greater than or equal to a declared threshold.

**Constraints:** Derive loops and boundary handling from this contract rather than translating a CUDA grid-stride loop. State input-domain, empty-input, tie, precision, and non-finite policies. Treat `score` as approximate but `winner_index`, `accepted_count`, and output length as exact. Do not time either implementation.

**Expected evidence:** Reference pseudocode, a field-by-field comparator table, three hand-computable cases including a tie and an empty input, and a note explaining how the reference avoids sharing GPU indexing logic.

**Acceptance criteria:** The reference processes every logical element once, makes the lowest-index tie rule explicit, defines the empty result, applies a declared floating comparator only to scores, checks all discrete outputs exactly, and remains independent of launch geometry.

<details><summary>Hint 1</summary>Write the output contract before choosing the host loop shape.</details>

<details><summary>Hint 2</summary>A higher-precision intermediate can aid comparison, but record that it does not reproduce float rounding step by step.</details>

## Exercise 2: Audit one absolute-plus-relative policy

**Goal:** Apply `abs(g - r) <= atol + rtol * abs(r)` with `atol = 1e-6` and `rtol = 1e-5` to `(r, g)` pairs `(0, 4e-7)`, `(2, 2.00003)`, and `(1e6, 1000000.4)`, then decide what the three outcomes do and do not establish.

**Constraints:** Show `error` and `limit` for every pair. Handle a fourth conceptual pair `(NaN, NaN)` through a separate declared policy, not through the finite formula. Do not alter either tolerance after seeing a result, and do not call these values universal defaults.

**Expected evidence:** A four-row decision table, arithmetic for each finite row, an explicit non-finite branch, and a short critique covering near-zero, ordinary-scale, and large-scale behavior.

**Acceptance criteria:** The near-zero row is governed mainly by `atol`, the large row by `rtol`, the ordinary row fails under the stated numbers, NaN does not pass accidentally, and the conclusion says application requirements are still needed to justify the policy.

<details><summary>Hint 1</summary>When `r` is zero, the relative contribution is zero.</details>

<details><summary>Hint 2</summary>Separate “the formula says pass” from “the chosen thresholds are scientifically justified.”</details>

## Exercise 3: Build independent gates for a normalized histogram

**Goal:** Specify a layered oracle for a normalized histogram that returns integer `counts[B]`, floating `probabilities[B]`, integer `sample_count`, and integer `max_bin`, where `max_bin` uses the lowest-index tie rule.

**Constraints:** Use an independently written CPU reference, exact checks for every discrete field, a declared absolute-plus-relative policy for probabilities, and at least four invariants derived from the problem statement. Include empty input and values on bin boundaries. Do not derive invariant targets by copying the candidate output.

**Expected evidence:** A gate matrix showing which defect each gate can catch, adversarial input cases, failure diagnostics, and a final correctness-before-timing decision rule.

**Acceptance criteria:** Counts sum exactly to `sample_count`, counts are non-negative, probability bounds and normalization are checked under a separately justified policy, `max_bin` is exact with the tie rule, reference agreement and invariants remain independent, and timing is forbidden if any gate fails.

<details><summary>Hint 1</summary>A correct total does not prove that samples were assigned to the correct bins.</details>

<details><summary>Hint 2</summary>Ask which shared CPU/GPU bug each invariant could expose even when arrays agree.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/cpu-references-tolerances-invariants/solutions/), then design another layered oracle in [Practice Bank PB-R1-021](/en/practice/#pb-r1-021).
