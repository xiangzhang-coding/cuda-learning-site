---
title: 'Q02 Exercises: Audit numerical order and reproducibility contracts'
description: Hand-trace a nonassociative reduction, record FMA and compiler environments, and design separate tolerance, determinism, and bitwise reproducibility checks in three static tasks.
pairId: q02-exercises
counterpart: /correctness/floating-point-order-reproducibility/exercises/
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
unitId: Q02-EXERCISES
prerequisites:
  - Q02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/floating-point-order-reproducibility/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q02: Floating-point Order, Determinism, and Bitwise Reproducibility](/en/correctness/floating-point-order-reproducibility/) first. These Exercises require only hand calculations, static ledgers, and acceptance specifications. They do not compile or run CUDA, and their evidence axes remain empty.

## Instructions

Write the operation graph, comparison scope, and equality predicate before deciding whether a claim holds. Complete all three tasks before opening the separate [reviewed solutions](/en/correctness/floating-point-order-reproducibility/solutions/).

## Exercise 1: Hand-calculate two reduction orders

**Goal:** Under a round-to-nearest binary32 model, calculate `(a + b) + c` and `a + (b + c)` step by step for `a = 1e20f`, `b = -1e20f`, and `c = 3.14f`, then map the parentheses to a serial left fold and a three-leaf reduction tree.

**Constraints:** Write `rn(...)` explicitly after each addition, distinguish exact real-number intermediates from stored binary32 values, and do not call the difference a race, hardware defect, or tolerance failure. Do not execute code.

**Expected evidence:** Two calculation traces with rounding points, one small tree labeling operand pairs, both final values, and a statement naming the algorithm choice that changed reduction order.

**Acceptance criteria:** The trace shows that combining `a` with `b` first preserves rounded `c`, while combining `b` with `c` first discards the small term and eventually yields zero. The conclusion states that floating-point nonassociativity permits both results from valid operations.

<details><summary>Hint 1</summary>Compare `3.14f` with the spacing between representable values near magnitude `1e20f`.</details>

<details><summary>Hint 2</summary>Identical tree leaves do not imply identical internal pairings.</details>

## Exercise 2: Audit FMA and a compiler/environment ledger

**Goal:** Write a review table for three build profiles of `y = alpha * x + beta` followed by the EX11 reduction: A uses `--fmad=true` without fast math, B uses `--fmad=false`, and C uses `--use_fast_math`.

**Constraints:** State FMA's one rounding and separate multiply/add's two roundings. Expand `--use_fast_math` into its effective floating-point options. Record Toolkit and `nvcc`, host compiler, target architecture, GPU and compute capability, driver, OS, library policy, exact inputs, launch geometry, and reduction tree. Do not predict an unobserved bit pattern.

**Expected evidence:** A three-row semantic-difference table, a complete ledger template, the fields that require a new tolerance rationale, and a scope statement that permits or rejects a cross-build comparison.

**Acceptance criteria:** A says only that contraction is permitted, not that every expression is fused. B is not mislabeled "bitwise portable for all arithmetic." C includes `--ftz=true`, `--prec-div=false`, `--prec-sqrt=false`, and `--fmad=true`. The ledger distinguishes build, device, and reduction-order changes.

<details><summary>Hint 1</summary>An explicit FMA call and compiler contraction of an ordinary multiply/add expression are different control points.</details>

<details><summary>Hint 2</summary>"No flag supplied" still has an effective default worth recording.</details>

## Exercise 3: Split three claims into three tests

**Goal:** Design three independent acceptance checks for EX11: a problem-specific abs+rel tolerance against the CPU reference, determinism within a fixed scope, and bitwise reproducibility between two named environments.

**Constraints:** Declare exact inputs, non-finite policy, scope, and equality predicate first. Use `abs(g - r) <= atol + rtol * abs(r)` with a rationale fixed before observation. State which order and algorithm conditions determinism fixes. Compare exact representations for the bitwise check; never infer it from a tolerance pass.

**Expected evidence:** A three-row claim matrix, each row's setup/comparator/pass statement, one counterexample satisfying only two rows, and the raw output plus ledger fields retained after a failure.

**Acceptance criteria:** Numerical acceptance, deterministic order and run scope, and cross-environment exact bits occupy separate rows. No pass vouches for another row. In particular, tolerance acceptance is never named bitwise reproducibility.

<details><summary>Hint 1</summary>A program can produce the same wrong value reliably on every run.</details>

<details><summary>Hint 2</summary>Several outputs from an unordered reduction may all remain inside one tolerance band.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/floating-point-order-reproducibility/solutions/), then return to the [EX11 CPU reference](/en/examples/multi-stage-reduction/) and check the contract boundary between serial order and the GPU tree.
