---
title: 'A13 Reviewed Solutions: SpMM, Sparse versus Dense, and Preprocessing Lifetimes'
description: Review the SpMM matrix result, conflicting static ledgers, preprocessing and workspace reuse, valid alternatives, and common errors.
pairId: a13-solutions
counterpart: /algorithms/sparse-matrix-multiplication-preprocessing/solutions/
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
unitId: A13-SOLUTIONS
prerequisites:
  - A13-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a13-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/sparse-matrix-multiplication-preprocessing/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A13-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A13-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/sparse-matrix-multiplication-preprocessing/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed solutions for the [A13 Exercises](/en/algorithms/sparse-matrix-multiplication-preprocessing/exercises/). Calculations and lifecycles are host or static review, not an executed cuSPARSE workflow.

## Solution 1: SpMM

`M=4,K=5,N=2,nnz=6`. The rows are `4*[1,2]-[3,0]=[1,8]`, `[0,0]`, `2*[0,1]+3*[1,4]=[3,14]`, and `5*[1,2]+7*[2,-1]=[19,3]`, so `C=[[1,8],[0,0],[3,14],[19,3]]`. The dense definition has `4*5*2=40` contributions and stored-entry traversal has `6*2=12`. Their difference of 28 belongs only to the mathematical ledger, not measured instructions, traffic, or time.

## Solution 2: Conflicting static signals

Dense A payload is `3*4*4=48 B`. CSR is `5*(4+4)+(3+1)*4=40+16=56 B`. Dense contributions are `3*4*3=36`, while sparse contributions are `5*3=15`. At this boundary CSR uses 8 B more while skipping 21 zero-product contributions. Neither count covers B/C traffic, access regularity, conversion, workspace, preprocessing, parallelism, or hardware. A matched experiment needs exact matrix distribution, types and layouts, sparse and dense algorithms, workspace and preprocessing policy, a device/software manifest, an independent reference and tolerance, and synchronized retained timing attempts.

## Solution 3: Preprocessing lifecycle

The sequence is: freeze representation and call-level operation, compute type, and algorithm; create descriptors that record only object metadata and reference caller-owned arrays; query workspace bytes for the exact combination; allocate an active device buffer within budget only when size is greater than zero; optionally preprocess when the exact combination supports it and the pattern will be reused; then repeat execution with an independent correctness check. Revalidate sizing and support and preprocess as needed when indices or pattern, descriptor metadata, the call contract, or active buffer changes. Track value and B/C pointer changes separately from structural pattern changes, checking the exact 13.3 reuse rules. Five hundred calls create only an amortization opportunity. Workspace size, preparation cost, timing, determinism, and a winner remain unknown until qualifying evidence exists after L13 and EX20.

## Valid alternatives

- Choose COO or another currently supported format after rechecking algorithm, workspace, preprocessing, and ordering constraints.
- Choose a one-shot path without preprocessing and state omitted preparation as a hypothesis rather than a winner.
- Compare with dense GEMM after matching operation, types, layouts, correctness, and measurement boundaries.
- Update values while a pattern remains fixed, but verify exact descriptor and API reuse rules for the pinned version.

## Common errors

- Treat `nnz*N` as a complete instruction or traffic count.
- Ignore index overhead and irregular rows because sparse products are fewer.
- Treat a descriptor as a copy of matrix values.
- Invent workspace bytes before the buffer-size query.
- Claim old preprocessing data remains active after changing indices or the active buffer.
- Turn an owner performance note, static arithmetic, or repetition count into observed speedup or determinism.

Review date: **2026-09-04**. All four evidence arrays remain empty; L13 and EX20 remain unpublished.
