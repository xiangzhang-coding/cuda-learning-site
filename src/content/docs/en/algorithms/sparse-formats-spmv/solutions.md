---
title: 'A12 Reviewed Solutions: COO, CSR, Storage Ledgers, and SpMV'
description: Review sparse arrays, empty rows, payload formulas, the SpMV calculation, valid alternatives, and common errors.
pairId: a12-solutions
counterpart: /algorithms/sparse-formats-spmv/solutions/
factCheckDate: '2026-09-04'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: A12-SOLUTIONS
prerequisites:
  - A12-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a12-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/sparse-formats-spmv/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A12-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A12-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/sparse-formats-spmv/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed solutions for the [A12 Exercises](/en/algorithms/sparse-formats-spmv/exercises/). Every array, byte count, and result is representation reasoning, exact host arithmetic, or static accounting, not a CUDA or cuSPARSE observation.

## Solution 1: COO and CSR

In row-then-column order the six coordinates are `(0,0,4)`, `(0,2,-1)`, `(2,1,2)`, `(2,4,3)`, `(3,0,5)`, and `(3,3,7)`. COO rows, columns, and values are `[0,0,2,2,3,3]`, `[0,2,1,4,0,3]`, and `[4,-1,2,3,5,7]`. Cumulative row counts `2,0,2,2` give CSR offsets `[0,2,2,4,6]` and ranges `[0,2)`, `[2,2)`, `[2,4)`, `[4,6)`. Offsets start at 0, are nondecreasing, have length 5, and end at 6. Unique coordinates do not conflict with repeated empty-row offsets.

## Solution 2: Storage payload

The general formulas are `mn*b_v`, `nnz*(b_v+2b_i)`, and `nnz*(b_v+b_i)+(m+1)b_i`. Substitution gives dense `100*80*4=32000 B`, COO `600*(4+8)=7200 B`, and CSR `600*(4+4)+101*4=4800+404=5204 B`. With 64-bit indices, both COO index terms and CSR column/offset terms double while FP32 values do not. This conclusion excludes allocators, alignment, workspace, traffic, and time.

## Solution 3: SpMV

The rows are `4*1-1*3=1`, empty sum `0`, `2*2+3*5=19`, and `5*1+7*4=33`, so `y=[1,0,19,33]`. Row lengths are `[2,0,2,2]`. Static categories include six value reads, six column-index reads, row offsets, six logical x gathers, and four outputs. Cache and transactions, parallel assignment, imbalance, instruction count, elapsed time, and speedup remain unobserved.

## Valid alternatives

- Use one-based indexing if every row and column index, offset interpretation, and check changes consistently.
- Retain explicit zeros if `nnz`, arrays, storage, and operation counts are recomputed by stored entry.
- Use unsorted columns within rows when the exact operation and version permit it and duplicate policy is explicit; do not inherit this fixture's sorted assumption.
- Choose another traffic boundary after listing included and excluded arrays rather than reusing these payload numbers.

## Common errors

- Omit the final CSR sentinel offset or give offsets length `m`.
- Remove the empty row's repeated offset and shift all later ranges.
- Confuse duplicate coordinates with repeated row offsets.
- Forget that index arrays occupy storage.
- Read x by stored-entry ordinal instead of column index.
- Infer actual GPU traffic, timing, or speedup from fewer payload bytes or products.

Review date: **2026-09-04**. All four evidence arrays remain empty.
