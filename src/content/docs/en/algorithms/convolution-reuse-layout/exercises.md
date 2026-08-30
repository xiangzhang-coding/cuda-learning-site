---
title: 'A07 Exercises: Convolution Semantics, Reuse Patches, and Production Gates'
description: Use three deeper tasks to fix cross-correlation semantics, prove a staged patch under stride and padding, and design a future production comparison contract that does not execute cuDNN.
pairId: a07-exercises
counterpart: /algorithms/convolution-reuse-layout/exercises/
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
unitId: A07-EXERCISES
prerequisites:
  - A07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a07-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/convolution-reuse-layout/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A07 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/convolution-reuse-layout/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A07: Direct 2D Convolution, Neighborhood Reuse, and Layout Contracts](/en/algorithms/convolution-reuse-layout/) first. The three tasks require a semantics table, reuse/phase proof, and future decision record. They require no GPU and do not execute cuDNN.

## Instructions

State tensor shape/layout and the operation convention before doing arithmetic. Keep expected reasoning, correctness evidence, and production measurement separate.

## Exercise 1: Distinguish correlation from convolution with an asymmetric filter

**Goal:** For `N=C=K=1`, input shape `1x1x4x4`, row-major values `1..16`, filter `[[1,0],[0,-1]]`, stride 1, dilation 1, and padding 0, derive this page's cross-correlation output; then derive the spatially flipped mathematical-convolution result for the same filter.

**Constraints:** State input/filter/output layouts; calculate `P,Q` first; list all nine output neighborhoods and products; the teaching result uses the unflipped filter; the second result explicitly flips both spatial axes; use exact integer arithmetic.

**Expected evidence:** A shape ledger, nine-row cross-correlation table, flipped-filter table, two `3x3` output matrices, and reasoning that explains their sign difference.

**Acceptance criteria:** The output formula gives `3x3` extents; every source address lies in the input domain; both operations' filter orientations are visible; the CPU oracle explicitly selects cross-correlation rather than accepting both results.

<details><summary>Hint 1</summary>Each teaching output multiplies the window's top-left value by 1 and bottom-right value by -1.</details>

<details><summary>Hint 2</summary>Flipping both spatial axes exchanges the filter's 1 and -1 across the diagonal.</details>

## Exercise 2: Derive a staged patch under stride and padding

**Goal:** For `H=W=7`, one channel, `R=S=3`, stride `(2,2)`, dilation `(1,1)`, and padding `(1,1)`, derive the dense staged bounding patch, zero-padding positions, and synchronous phase ledger for a `T_y=2,T_x=3` tile beginning at output `(0,0)`.

**Constraints:** Use the A07 patch-extent formulas; map padded coordinates to global input or zero; count direct logical references and staged positions separately; the full block joins the load barrier; a thread without an output does not return early; do not turn a count ratio into speedup.

**Expected evidence:** Patch origin/extents, a `5x7` coordinate diagram, derivation of the 54-entry logical-reference count, a 35-slot cooperative assignment plan, and a `load -> barrier -> compute` participant ledger.

**Acceptance criteria:** Padded y range is `-1..3` and x range is `-1..5`; each channel's bounding patch has 35 slots; six outputs each have nine logical taps; out-of-domain slots generate zero without a global read; the barrier participant set is independent of output validity.

<details><summary>Hint 1</summary>Height is `(2-1)*2 + (3-1)*1 + 1`; apply the same formula with `T_x=3` for width.</details>

<details><summary>Hint 2</summary>Assign an owner to every linear slot in the staged rectangle before deciding whether that slot loads a global value or writes zero.</details>

## Exercise 3: Write a future cuDNN production-comparison gate

**Goal:** Write a production-comparison checklist for the same direct teaching operation and a future cuDNN Frontend/API path, covering component pinning, semantic parity, graph validation/build, heuristics/plan selection, workspace, correctness, tolerance, and determinism.

**Constraints:** State that later L10, not A07, pins the component matrix; current A07 neither teaches nor executes cuDNN; record cuDNN Frontend v1.27.0 only as a future coordinate for cuDNN 9.24.0+; every build, plan, workspace, output, timing, and speedup field remains `unrecorded`.

**Expected evidence:** An ordered gate table, failure classification, workspace-lifetime diagram, correctness/determinism acceptance contract, and an unfilled measurement-record template.

**Acceptance criteria:** Graph validation and build are independent gates; heuristics candidates and the selected plan are recorded separately; workspace bytes/alignment/lifetime have explicit fields; the CPU oracle and tolerance precede measurement; no claim says the hand-written kernel beats cuDNN.

<details><summary>Hint 1</summary>Give descriptor/graph failure, plan unavailable, workspace-budget failure, and numerical mismatch separate rows.</details>

<details><summary>Hint 2</summary>Determinism is a contract to declare and verify, not a property guaranteed by identical input.</details>

## Next

Inspect the separate [reviewed solutions](/en/algorithms/convolution-reuse-layout/solutions/), then audit [PB-R2-019](/en/practice/#pb-r2-019) and use [TERM-145](/en/glossary/#term-145)/[TERM-146](/en/glossary/#term-146) to check operation naming.
