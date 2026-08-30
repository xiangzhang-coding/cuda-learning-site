---
title: 'A05 Exercises: Transpose Mapping, Tile Phases, and Bank Padding'
description: Use three deeper tasks to prove the rectangular-transpose bijection, partial-tile barrier safety, and the bank mapping of physical +1 padding while preserving the evidence boundary.
pairId: a05-exercises
counterpart: /algorithms/matrix-transpose-layout/exercises/
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
unitId: A05-EXERCISES
prerequisites:
  - A05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a05-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/matrix-transpose-layout/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A05 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/matrix-transpose-layout/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A05: Matrix Transpose, Coalescing, and Shared-Memory Layout](/en/algorithms/matrix-transpose-layout/) first. These exercises require address tables, phase proofs, and an evidence plan. They require no GPU and produce no compilation or runtime evidence.

## Instructions

For each task, state the logical contract before the physical-address or participation ledger. Complete all three independently before inspecting the [reviewed solutions](/en/algorithms/matrix-transpose-layout/solutions/).

## Exercise 1: Prove the rectangular-transpose mapping

**Goal:** For `rows = 2`, `cols = 3`, and row-major input `[a,b,c,d,e,f]`, write each `(row,col)` coordinate's input linear index, output coordinate, and `output[col * rows + row]` index, then prove that output ownership is a bijection.

**Constraints:** State output shape as `3 x 2`; use no square-matrix assumption; every input and output index appears exactly once; the CPU reference uses exact element comparison.

**Expected evidence:** A six-row mapping table, one row-major output vector, and a short proof of injectivity and complete coverage.

**Acceptance criteria:** The table uses input leading dimension `cols` and output leading dimension `rows`; the output index set is exactly `0..5`; no collision or omission exists; the proof generalizes to arbitrary positive `rows, cols`.

<details><summary>Hint 1</summary>Fix `row`, increase `col` from 0 through 2, and compute both linear indices.</details>

<details><summary>Hint 2</summary>Use the inverse mapping `row = output_col`, `col = output_row` to prove uniqueness.</details>

## Exercise 2: Review partial-tile barriers and guards

**Goal:** For a tiled transpose with `rows = 18`, `cols = 20`, and `T = 16`, review the grid's bottom-right block. State its valid input region and count, load guard, exchanged store guard, and complete block-phase ledger.

**Constraints:** The block has `16 x 16` threads; an invalid thread may skip a global load or store, but all 256 threads reach the same barrier; no return occurs before the barrier; prove that a legal store never reads an uninitialized shared slot.

**Expected evidence:** A grid/block-coordinate diagram, valid-thread count, `load -> barrier -> transposed read/store` ledger, and one source-validity implication.

**Acceptance criteria:** The bottom-right input region contains only rows `16..17` and columns `16..19`, for 8 values; the barrier participant count is 256; load and store use their respective coordinate systems; every legal output owner corresponds to a completed legal load.

<details><summary>Hint 1</summary>The grid's x extent comes from `cols`, and its y extent comes from `rows`.</details>

<details><summary>Hint 2</summary>Exchange both the tile's block coordinates and its thread coordinates for the store.</details>

## Exercise 3: Separate logical tiles, physical padding, and evidence

**Goal:** In a simplified model with `T = 32`, 32 banks, and one bank word per `float`, compare physical strides 32 and 33. For a transposed warp read at one fixed logical column, state lane `l`'s bank formula and design an observation plan for validating the expected mapping.

**Constraints:** The logical tile remains `32 x 32`; a padding slot is never treated as a matrix element; finish the static bank-index table before naming the required GPU, instruction/access width, and tool record; enter no timing, conflict count, or speedup.

**Expected evidence:** Two bank formulas, a distinct-bank summary for lanes `0..31`, a logical-versus-physical layout sketch, and an expected/observed two-column plan.

**Acceptance criteria:** The stride-32 formula maps a fixed column to one bank; the stride-33 formula covers 32 banks in the simplified model; transpose output remains unchanged; all measured fields remain `unrecorded`.

<details><summary>Hint 1</summary>Use `(lane * physical_stride + fixed_column) mod 32`.</details>

<details><summary>Hint 2</summary>A bank formula is expected reasoning; it cannot replace a named environment record.</details>

## Next

Inspect the separate [reviewed solutions](/en/algorithms/matrix-transpose-layout/solutions/), then audit [PB-R2-017](/en/practice/#pb-r2-017), EX14's `cpu-reference`/`tiled-transpose` ranges, and [VIS11](/en/visuals/tiled-transpose/).
