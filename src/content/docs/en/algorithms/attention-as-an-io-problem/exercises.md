---
title: 'A11 Exercises: Attention Numerics, Tile Merge, and an IO Ledger'
description: Audit A11 with one hand-computable attention row, an exact cross-tile online merge, and complete materialized and tiled traffic ledgers.
pairId: a11-exercises
counterpart: /algorithms/attention-as-an-io-problem/exercises/
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
unitId: A11-EXERCISES
prerequisites:
  - A11
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a11-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/attention-as-an-io-problem/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A11 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/attention-as-an-io-problem/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A11](/en/algorithms/attention-as-an-io-problem/). The three Exercises produce a numerical decomposition, exact merge proof, and static IO ledger without calling any later backend API.

## Instructions

Freeze shapes, precision, included and excluded operations, and rounding before calculating. Keep real-arithmetic references and static traffic separate from CUDA or runtime evidence. Work independently before opening the [reviewed solutions](/en/algorithms/attention-as-an-io-problem/solutions/).

## Exercise 1: Hand-calculate one scaled attention row

**Goal:** Using `q=[1,0]`, `K=[[1,0],[0,1],[1,1]]`, `V=[[1,0],[0,2],[3,1]]`, and scale `1/sqrt(2)`, calculate three scores, stable row probabilities, and the output vector.

**Constraints:** Show `d_k=2,d_v=2,n_q=1,n_k=3`. Scale before max shifting. Display at least six decimal places and label results as rounded real-arithmetic references.

**Expected evidence:** A shape table, three dot products, a softmax worksheet, one `1x2` output, and probability invariants.

**Acceptance criteria:** Scores are about `[0.707107,0,0.707107]`, probabilities are about `[0.401112,0.197776,0.401112]`, and output is about `[1.604448,0.796664]`. No bitwise or GPU claim appears.

<details><summary>Hint 1</summary>After subtracting the row maximum, logits are `[0,-1/sqrt(2),0]`.</details>

<details><summary>Hint 2</summary>The first output coordinate is `p0*1+p1*0+p2*3`.</details>

## Exercise 2: Merge two online attention tiles

**Goal:** For scores `[2,1,3,0]` and scalar V `[1,2,4,8]`, compute `(m_t,l_t,a_t)` for tiles `[2,1]` and `[3,0]`, merge them with the A11 recurrence, and emit `o=a/l`.

**Constraints:** Running state begins at `(-infinity,0,0)`. Write the old tile's rescale factor explicitly. Check against an independent full-row stable calculation. Exact refers only to real-arithmetic equivalence.

**Expected evidence:** Two tile-state rows, one merge row, a full-row reference, and a floating-point boundary note.

**Acceptance criteria:** The first tile is about `(2,1.367879,1.735759)` and the second about `(3,1.049787,4.398297)`. Merged `(m,l,a)` is about `(3,1.553002,5.036847)`, and `o` is about `3.243297`.

<details><summary>Hint 1</summary>At merge, `m'=3`, so multiply old tile state by `exp(2-3)`.</details>

<details><summary>Hint 2</summary>The full-row reference uses shifted weights `[exp(-1),exp(-2),1,exp(-3)]`.</details>

## Exercise 3: Independently derive VIS18 traffic

**Goal:** For unmasked self-attention with `N=8,d=4`, FP32, and `Br=Bc=4`, account for per-stage elements and bytes, tile counts, and total difference for the materialized stable and query-outer tiled schedules.

**Constraints:** Q/K/V already exist and O is separate. Materialized normalization reads S three times and writes P. Tiled Q, accumulator, and row state remain in fast storage. Exclude projections, cache lines, transactions, masks, backward, and spills. Label the difference as static analysis.

**Expected evidence:** Two three-stage tables, one `2x2` temporary-score-tile grid, a total check, and a list of unsupported claims.

**Acceptance criteria:** Materialized stages contain `128/256/128 elements` and total `2048 B`. Tiled stages contain `96/0/96 elements` and total `768 B`. There are four score tiles of 16 elements each. Difference is `1280 B`, with no timing, speedup, or backend conclusion.

<details><summary>Hint 1</summary>The materialized total is `4Nd+6N^2`.</details>

<details><summary>Hint 2</summary>Tiled score reads `Q=32,K=64`; value reads `V=64` and writes `O=32`.</details>

## Next

Open the [reviewed solutions](/en/algorithms/attention-as-an-io-problem/solutions/), then use [VIS18](/en/visuals/attention-memory-traffic/) and complete [PB-R3-014](/en/practice/#pb-r3-014).
