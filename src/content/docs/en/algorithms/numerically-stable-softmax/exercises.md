---
title: 'A10 Exercises: Stable Softmax, Online State, and a Traffic Ledger'
description: Audit A10 with a large-offset numerical fixture, the online-normalizer invariant, and a fusion ledger at an explicit boundary.
pairId: a10-exercises
counterpart: /algorithms/numerically-stable-softmax/exercises/
factCheckDate: '2026-09-03'
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
unitId: A10-EXERCISES
prerequisites:
  - A10
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a10-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/numerically-stable-softmax/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A10 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/numerically-stable-softmax/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A10](/en/algorithms/numerically-stable-softmax/). These three Exercises produce a numerical worksheet, state invariant, and static IO ledger. They compile and execute no CUDA.

## Instructions

For each Exercise, declare the input domain and accounting boundary before calculating, then state what the result cannot support. Work independently before opening the [reviewed solutions](/en/algorithms/numerically-stable-softmax/solutions/).

## Exercise 1: Hand-calculate large-offset stable softmax

**Goal:** For `x=[1000,1001,1002,1003]`, calculate the row maximum, shifted logits, shifted exponentials, denominator, and four probabilities. Check nonnegative and sum-near-one invariants.

**Constraints:** Do not evaluate raw `exp(1000)`-style terms. Show at least eight decimal places. Label displayed values as rounded real-arithmetic references. Name the underflow class that max shifting does not eliminate.

**Expected evidence:** A four-row table with `x_i-m`, `exp(x_i-m)`, and `p_i`, plus two invariant checks and one evidence-boundary note.

**Acceptance criteria:** `m=1003`, the denominator is about `1.55300179`, and the final probability is about `0.64391426`. The displayed probabilities sum near one. No GPU or timing claim appears.

<details><summary>Hint 1</summary>First rewrite the logits as `[-3,-2,-1,0]`.</details>

<details><summary>Hint 2</summary>At least one shifted exponential equals 1, so the finite-input denominator is at least 1.</details>

## Exercise 2: Audit the online-normalizer invariant

**Goal:** Starting from `m_0=-infinity,l_0=0`, scan the same four values, list every `(m_j,l_j)`, and independently check the final two steps using `l_j=sum_{k<=j} exp(x_k-m_j)`.

**Constraints:** Write the old-state rescale factor whenever the maximum changes. Do not store all exponentials and call the result online. Explain why emitting every probability can still require a second input read.

**Expected evidence:** A four-row state table, two invariant substitutions, and a pass ledger.

**Acceptance criteria:** States are approximately `(1000,1)`, `(1001,1.36787944)`, `(1002,1.50321472)`, and `(1003,1.55300179)`. The pass ledger separates the normalizer pass from the output pass.

<details><summary>Hint 1</summary>Each increase of one in the maximum first scales old `l` by `exp(-1)`.</details>

<details><summary>Hint 2</summary>The invariant's exponential reference is always current `m_j`, not the first maximum.</details>

## Exercise 3: Account for pass and fusion traffic

**Goal:** For an FP32 row with `n=1024`, count logical bytes for stable three-pass and online-plus-output schedules. Then count bytes removed when fusion avoids writing and rereading an FP32 intermediate with `M=4096` elements.

**Constraints:** Scalar state remains in fast storage; no exponential array is stored; cache lines, transaction overfetch, and write allocation are excluded. The fused intermediate has no other consumer and does not spill. Label every difference as static analysis.

**Expected evidence:** Two pass ledgers, one `2Mb` substitution, an assumption list, and a still-unknown list.

**Acceptance criteria:** The softmax schedules count `16384 B` and `12288 B`, differing by `4096 B`. The fused-intermediate difference is `32768 B`. Unknowns include at least actual traffic and elapsed time; speedup remains blank.

<details><summary>Hint 1</summary>The stable schedule is `4n` elements and the online schedule is `3n` elements.</details>

<details><summary>Hint 2</summary>The intermediate write and later read total `2*4096*4` bytes.</details>

## Next

Open the [reviewed solutions](/en/algorithms/numerically-stable-softmax/solutions/), then complete [PB-R3-013](/en/practice/#pb-r3-013) and continue to [A11](/en/algorithms/attention-as-an-io-problem/).
