---
title: 'A13 Exercises: SpMM, Sparse versus Dense, and Preprocessing Lifetimes'
description: Hand-calculate a sparse-times-dense matrix product, audit sparse and dense ledgers, and design a reusable preprocessing and workspace contract.
pairId: a13-exercises
counterpart: /algorithms/sparse-matrix-multiplication-preprocessing/exercises/
factCheckDate: '2026-09-04'
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
unitId: A13-EXERCISES
prerequisites:
  - A13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a13-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/sparse-matrix-multiplication-preprocessing/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A13-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A13 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/sparse-matrix-multiplication-preprocessing/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A13](/en/algorithms/sparse-matrix-multiplication-preprocessing/). These three Exercises produce an SpMM worksheet, sparse-versus-dense audit, and preprocessing lifecycle. They call no L13 API and do not run EX20.

## Instructions

Write the representation and operation contract first, perform arithmetic second, and list missing version, workspace, and runtime evidence last. Work independently before opening the [reviewed solutions](/en/algorithms/sparse-matrix-multiplication-preprocessing/solutions/).

## Exercise 1: Hand-calculate sparse-times-dense SpMM

**Goal:** For A12's `A=[[4,0,-1,0,0],[0,0,0,0,0],[0,2,0,0,3],[5,0,0,7,0]]` and `B=[[1,2],[0,1],[3,0],[2,-1],[1,4]]`, calculate `C=A B` from stored entries.

**Constraints:** State `M,K,N,nnz`. Every A entry updates two columns of C. Emit two zeros for the empty row. Separately count dense `MKN` and sparse `nnz*N` contributions. Do not relabel their difference as timing.

**Expected evidence:** A shape contract, four row equations, complete C, two contribution counts, and an evidence-boundary note.

**Acceptance criteria:** `C=[[1,8],[0,0],[3,14],[19,3]]`; dense and sparse counts are 40 and 12; the result is exact host arithmetic, not a GPU observation.

<details><summary>Hint 1</summary>One stored `(i,k,a)` adds `a*B[k,:]` to the whole row `C[i,:]`.</details>

<details><summary>Hint 2</summary>Row 3 is `5*[1,2]+7*[2,-1]`.</details>

## Exercise 2: Reject a winner based only on density

**Goal:** Audit a candidate with `M=3,K=4,N=3,nnz=5`. What are dense FP32 A payload, CSR FP32/32-bit-index A payload, dense contributions, and sparse contributions? Explain why storage and arithmetic can point in different directions.

**Constraints:** Use `nnz*(4+4)+(M+1)*4` for CSR and count A payload only. Exclude B/C traffic, conversion, workspace, preprocessing, cache, imbalance, and tiling. End with coordinates required by a matched sparse-versus-dense experiment.

**Expected evidence:** Four values, an included/excluded ledger, at least six experiment coordinates, and a bounded verdict.

**Acceptance criteria:** Dense A is `48 B`; CSR A is `56 B`; dense and sparse contributions are 36 and 15. The conclusion notes that CSR payload is larger while product count is smaller and selects no performance winner.

<details><summary>Hint 1</summary>For a tiny matrix, `M+1` offsets can outweigh storage saved by skipping zeros.</details>

<details><summary>Hint 2</summary>A matched experiment freezes at least shape and distribution, types and layouts, algorithms and workspace, hardware, and correctness and timing methods.</details>

## Exercise 3: Design a reusable preprocessing and workspace contract

**Goal:** A fixed CSR sparsity pattern will run 500 SpMM calls while values and B/C pointers may change per call. Write the lifecycle from descriptors, buffer-size query, conditional workspace allocation, and optional preprocessing through repeated execution and verification. Define when preparation must be repeated.

**Constraints:** Use high-level cuSPARSE 13.3 owner facts without API code. Check exact format and algorithm support. Retain only one active preprocessing buffer. Keep indices or pattern and active workspace contents stable under the reuse contract. Write workspace bytes as `unknown` until queried. Assume neither preprocessing benefit nor observed determinism.

**Expected evidence:** A five-stage sequence, ownership and lifetime table, reuse and invalidation rules, workspace-budget gate, correctness acceptance, and a falsifiable measurement plan.

**Acceptance criteria:** The plan separates descriptor metadata from call-level operation, compute type, and algorithm, requires no allocation when the queried size is zero, and rechecks sizing and preparation when indices or pattern, an algorithm-dependent contract, or the active buffer changes. It separates value and B/C changes from pattern changes and fills in no workspace size, timing, speedup, winner, or Evidence Status.

<details><summary>Hint 1</summary>Persistent CSR arrays and temporary or acceleration workspace are distinct allocations with distinct lifetimes.</details>

<details><summary>Hint 2</summary>“500 calls” creates an amortization opportunity; benefit still requires exact support and matched measurement.</details>

## Next

Open the [reviewed solutions](/en/algorithms/sparse-matrix-multiplication-preprocessing/solutions/), then complete [PB-R3-016](/en/practice/#pb-r3-016). L13 and EX20 remain deferred.
