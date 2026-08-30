---
title: 'A08 Exercises: GEMM Oracles, Partial Tiles, and Numerical Acceptance'
description: Review tiled GEMM with a hand-computable oracle, a partial M/N/K participation ledger, and a finite absolute-plus-relative comparison packet.
pairId: a08-exercises
counterpart: /algorithms/tiled-gemm-correctness/exercises/
factCheckDate: '2026-08-31'
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
unitId: A08-EXERCISES
prerequisites:
  - A08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a08-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/tiled-gemm-correctness/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A08 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/tiled-gemm-correctness/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A08](/en/algorithms/tiled-gemm-correctness/) first. These tasks submit a static oracle, phase ledger, and acceptance packet; they compile and execute no CUDA.

## Instructions

Write the logical equation first, ownership and phases second, and the evidence boundary last. Inspect the [reviewed solutions](/en/algorithms/tiled-gemm-correctness/solutions/) only after completing all three.

## Exercise 1: Build a hand-computable naive GEMM oracle

**Goal:** For row-major `A=[[1,2,3],[4,5,6]]`, `B=[[1,2],[3,4],[5,6]]`, `alpha=1`, and `beta=0`, write every output dot product, linear address, and the final C vector for `M=2,K=3,N=2`.

**Constraints:** Give every output one owner; use A stride K and B/C stride N; make no square assumption; show all three K contributions.

**Expected evidence:** Four dot-product equations, one address table, and a row-major C vector.

**Acceptance criteria:** C is `[22,28,49,64]`; indices cover `0..3` exactly once; the equation can serve directly as a CPU-reference fixture.

<details><summary>Hint 1</summary>Fix `(row,col)`, then let `p` run from 0 through 2.</details>

<details><summary>Hint 2</summary>`A[row*K+p]` and `B[p*N+col]` have different leading dimensions.</details>

## Exercise 2: Prove uniform participation for partial M/N/K tiles

**Goal:** For `M=18,K=19,N=17` and `TM=TN=TK=16`, audit the bottom-right output block. State the output grid, valid outputs, valid shared loads in both K slices, zero-fill, and barrier ledger.

**Constraints:** The block has 256 threads; every K slice has load, barrier, compute, barrier; an invalid output thread cannot return early; the second K slice has K-valid width 3.

**Expected evidence:** A `2x2` output-grid diagram, an A/B guard table per slice, two 256-participant barriers, and the final-store guard.

**Acceptance criteria:** The bottom-right block has `2x1=2` valid outputs; there are two K slices; every out-of-bounds shared slot receives zero; both barriers in each slice have 256 participants.

<details><summary>Hint 1</summary>The output-block origin is `(row=16,col=16)`.</details>

<details><summary>Hint 2</summary>K-tail validity and output M/N validity are three independent predicates.</details>

## Exercise 3: Design a finite tolerance and evidence packet

**Goal:** With `atol=1e-4` and `rtol=2e-5`, decide `(reference,candidate)` pairs `(0,0.00005)`, `(1000,1000.01)`, and `(4,4.5)`, then handle NaN. Write a mismatch record for the first failure.

**Constraints:** Compute `atol + rtol * abs(reference)` per item; reject NaN and infinity; keep host pass, CUDA compilation, GPU correctness, and timing in separate fields.

**Expected evidence:** A four-row comparison table, a first-mismatch schema, and empty compilation/runtime/performance observations.

**Acceptance criteria:** The first two values pass, `4.5` fails, and NaN is rejected; the packet does not call a host test Compile-Checked and contains no timing or speedup.

<details><summary>Hint 1</summary>For reference 1000, the relative term is `0.02`.</details>

<details><summary>Hint 2</summary>Apply the finite policy before the error formula.</details>

## Next

Inspect the [reviewed solutions](/en/algorithms/tiled-gemm-correctness/solutions/), then audit [PB-R2-020](/en/practice/#pb-r2-020), [EX15](/en/examples/tiled-gemm/), and [VIS12](/en/visuals/gemm-tiling-hierarchy/).
