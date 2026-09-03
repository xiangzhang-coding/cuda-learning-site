---
title: 'A12 Exercises: COO, CSR, Storage Ledgers, and SpMV'
description: Reconstruct sparse arrays from an exact matrix, account for index overhead, and hand-calculate an SpMV with an empty row.
pairId: a12-exercises
counterpart: /algorithms/sparse-formats-spmv/exercises/
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
unitId: A12-EXERCISES
prerequisites:
  - A12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a12-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/sparse-formats-spmv/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A12-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A12 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/sparse-formats-spmv/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A12](/en/algorithms/sparse-formats-spmv/). These three Exercises produce a representation worksheet, storage ledger, and hand-calculated SpMV. They compile and execute no CUDA or cuSPARSE.

## Instructions

Freeze shape, stored-entry policy, index base and type, and value type before every calculation. Keep host arithmetic and static bytes separate from runtime evidence. Work independently before opening the [reviewed solutions](/en/algorithms/sparse-formats-spmv/solutions/).

## Exercise 1: Reconstruct COO and CSR from a matrix

**Goal:** For `A=[[4,0,-1,0,0],[0,0,0,0,0],[0,2,0,0,3],[5,0,0,7,0]]`, construct COO `row_indices/column_indices/values` and CSR `row_offsets/column_indices/values` under zero-based, row-then-column order with unique coordinates.

**Constraints:** Store mathematical nonzeros only. State `m,n,nnz`, show how empty row 1 is represented, and check that offsets are nondecreasing, begin at 0, and end at `nnz`. Do not call repeated offsets duplicate coordinates.

**Expected evidence:** A six-row coordinate table, four physical arrays, four row ranges, and four structural invariants.

**Acceptance criteria:** `nnz=6`; COO rows are `[0,0,2,2,3,3]`, columns are `[0,2,1,4,0,3]`, and values are `[4,-1,2,3,5,7]`; CSR offsets are `[0,2,2,4,6]`; row 1 owns range `[2,2)`.

<details><summary>Hint 1</summary>Scan by row and record a complete `(row,column,value)` whenever a nonzero appears.</details>

<details><summary>Hint 2</summary>The next CSR offset is the cumulative stored-entry count; an empty row does not increase it.</details>

## Exercise 2: Account for index overhead and a break-even boundary

**Goal:** For `m=100,n=80,nnz=600`, FP32 values, and 32-bit indices, calculate dense, COO, and CSR matrix payload and state all three general formulas.

**Constraints:** Exclude descriptors, allocators, alignment, workspace, vectors and outputs, and conversion. Do not relabel payload differences as transferred bytes or speedup. Explain which terms change with 64-bit indices.

**Expected evidence:** Three symbolic formulas, three byte substitutions, one 64-bit sensitivity note, and one evidence boundary.

**Acceptance criteria:** Dense is `32000 B`, COO is `7200 B`, and CSR is `5204 B`. Identify `101*4=404 B` of CSR row offsets. Conclude only a storage comparison at this boundary.

<details><summary>Hint 1</summary>Each COO entry has one value and two indices; CSR has a value and column index per entry plus `m+1` offsets.</details>

<details><summary>Hint 2</summary>Use `dense=mn*b_v`, `COO=nnz*(b_v+2b_i)`, and `CSR=nnz*(b_v+b_i)+(m+1)b_i`.</details>

## Exercise 3: Hand-calculate SpMV from CSR ranges

**Goal:** Use Exercise 1's CSR and `x=[1,2,3,4,5]` to compute `y=A x` row by row, separating value reads, index reads, x gathers, and row reductions.

**Constraints:** Select entries through half-open ranges. The empty row emits zero. List row lengths. Count only six scalar product contributions and claim no cache, transaction, load-balance, or runtime result.

**Expected evidence:** Four row equations, final y, the row-length vector, requested-data categories, and a still-unknown list.

**Acceptance criteria:** `y=[1,0,19,33]` and row lengths are `[2,0,2,2]`. Unknowns include at least actual transferred traffic and elapsed time. No cuSPARSE call or Evidence Status appears.

<details><summary>Hint 1</summary>Row 2 range `[2,4)` maps to columns 1 and 4.</details>

<details><summary>Hint 2</summary>`column_indices[k]` selects x, so the six logical x reads form a gather rather than a contiguous six-entry slice.</details>

## Next

Open the [reviewed solutions](/en/algorithms/sparse-formats-spmv/solutions/), then complete [PB-R3-015](/en/practice/#pb-r3-015) and continue to [A13](/en/algorithms/sparse-matrix-multiplication-preprocessing/).
