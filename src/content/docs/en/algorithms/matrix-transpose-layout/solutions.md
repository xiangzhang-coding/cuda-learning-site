---
title: 'A05 Reviewed Solutions: Transpose Mapping, Tile Phases, and Bank Padding'
description: Review the rectangular mapping, partial-tile barrier proof, physical-padding bank arithmetic, valid alternatives, and common errors for the three A05 exercises.
pairId: a05-solutions
counterpart: /algorithms/matrix-transpose-layout/solutions/
factCheckDate: '2026-08-30'
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
unitId: A05-SOLUTIONS
prerequisites:
  - A05-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a05-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/matrix-transpose-layout/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A05-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/matrix-transpose-layout/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate review page for the [A05 Exercises](/en/algorithms/matrix-transpose-layout/exercises/). Mapping tables, barrier proofs, and bank arithmetic are static reasoning artifacts. They have not compiled or run EX14 and are not measured performance evidence.

## Solution 1: Prove the rectangular-transpose mapping

The six coordinates map as follows:

| input `(row,col)` | input index `row*3+col` | output `(col,row)` | output index `col*2+row` |
| --- | ---: | --- | ---: |
| `(0,0)` | 0 | `(0,0)` | 0 |
| `(0,1)` | 1 | `(1,0)` | 2 |
| `(0,2)` | 2 | `(2,0)` | 4 |
| `(1,0)` | 3 | `(0,1)` | 1 |
| `(1,1)` | 4 | `(1,1)` | 3 |
| `(1,2)` | 5 | `(2,1)` | 5 |

The `3 x 2` row-major output vector is therefore `[a,d,b,e,c,f]`. The reasoning uses the inverse of the coordinate swap: any output `(out_row,out_col)` uniquely recovers input `(out_col,out_row)`. Two distinct input coordinates cannot collide, and the `rows * cols` legal inputs cover an output domain of the same size. Exact CPU comparison produces the same vector element by element.

## Solution 2: Review partial-tile barriers and guards

The grid shape is `ceil(20/16) x ceil(18/16) = 2 x 2`. Bottom-right block `(1,1)` begins at input `(row=16,col=16)`. Its only legal rows are 16 and 17, and its only legal columns are 16, 17, 18, and 19, so it has `2 * 4 = 8` valid loads.

Every thread first computes input coordinates. Only those eight owners perform a guarded load, but all `16 * 16 = 256` threads then reach the same `__syncthreads()`. The store uses exchanged block/thread coordinates and separately checks output row `< cols` and output column `< rows`. A legal store's shared source is a legal pre-transpose `(row,col)` value. The inverse coordinate swap places it among the eight completed loads. Invalid threads predicate data movement; they do not leave the rendezvous.

The key reasoning is the source-validity implication: `legal_output(out_row,out_col)` corresponds to `input(row=out_col,col=out_row)`, and those coordinates satisfy the original input bounds. A legal output therefore never reads an unwritten slot in the partial tile.

## Solution 3: Separate logical tiles, physical padding, and evidence

Let the fixed logical column be `c` and the lane be `l`. The simplified bank formula is `(l * physical_stride + c) mod 32`.

- Stride 32 gives `(32l + c) mod 32 = c`, so all 32 lanes map to one bank.
- Stride 33 gives `(33l + c) mod 32 = (l + c) mod 32`, so lanes `0..31` cover 32 distinct banks.

The reasoning concerns only physical shared-row stride. Both allocations expose logical rows and columns `0..31`; column 32 is padding, and transpose values and output shape remain unchanged. The observation plan records the exact GPU, compute capability, Toolkit, element/access width, instruction, launch, fixture, and profiler/tool output. Actual conflict count, timing, and speedup remain `unrecorded`, so the static formula is not mislabeled as observed evidence.

## Valid alternatives

- Solution 1 may order the table by output rather than input if the bijection and both leading dimensions remain explicit.
- Solution 2 may initialize invalid shared slots with a neutral sentinel and then prove they are not consumed, but no thread may skip the barrier.
- A tile may be rectangular if source/destination coordinate transforms, physical strides, and guards are all restated.
- Bank analysis may use byte addresses and a documented bank width instead of word indices; the result must match the declared model.
- An actual implementation may select another conflict-avoiding layout while preserving the logical transpose oracle.

## Common errors

- Writing the output index as `col * cols + row`, which a square fixture can accidentally hide.
- Exchanging thread coordinates but not the grid coordinates of a multi-tile matrix.
- Returning an edge-invalid thread before `__syncthreads()`.
- Reusing an input-guard variable without proving exchanged output bounds.
- Counting the physical padding column in the logical shape or global output leading dimension.
- Turning the stride-33 bank formula directly into an unobserved conflict counter, timing result, or speedup.
- Recording VIS11 browser state or EX14 source inspection as runtime evidence.

Reviewed on **2026-08-30**. All four evidence arrays remain empty.
