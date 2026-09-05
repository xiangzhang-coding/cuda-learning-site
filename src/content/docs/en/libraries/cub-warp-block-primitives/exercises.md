---
title: 'L04 Exercises: Select CUB Warp and Block Primitives'
description: Select collectives for logical-warp outputs, a partial block reduction, and a blocked-array scan while auditing participants, TempStorage, synchronization, layout, and determinism.
pairId: l04-exercises
counterpart: /libraries/cub-warp-block-primitives/exercises/
factCheckDate: '2026-09-05'
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
unitId: L04-EXERCISES
prerequisites:
  - L04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l04-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cub-warp-block-primitives/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L04 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cub-warp-block-primitives/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [L04](/en/libraries/cub-warp-block-primitives/) first. All three tasks produce static primitive-selection packets. They display, compile, and run no CUDA/C++, and all four evidence arrays remain empty.

## Instructions

The candidate set is `WarpReduce`, `WarpScan`, `BlockReduce`, and `BlockScan`. For each task, state scope, participants, and output shape before selecting a primitive, overload, and algorithm requirement. Also audit the `TempStorage` slot, reuse barrier, row-major or blocked layout, partial-valid contract, and output validity. Do not look for an implementation answer before opening the [separate reviewed solutions](/en/libraries/cub-warp-block-primitives/solutions/).

## Exercise 1: Select two output shapes for 8-lane logical groups

**Goal:** One physical warp is partitioned into four consecutive 8-lane groups. Request A needs one sum per group. Request B needs one inclusive prefix per lane and the group aggregate in every lane. Select the narrowest warp collective for each request.

**Constraints:** Fix `LogicalWarpThreads` at 8. All eight lanes in every group invoke together, and simultaneously active groups do not alias `TempStorage`. Declare the output-validity set for A and B, the exact participant set for `__syncwarp(mask)` before reuse, and handling of another round in which all four groups have only their first five items valid. One calling hardware warp must not submit different `valid_items` values.

**Expected evidence:** A two-row selection table, four participant masks, a TempStorage slot map, full and partial validity ledger, output-reader set, and reuse-phase edge.

**Acceptance criteria:** One selection authorizes only logical lane 0 to read a scalar; the other produces a prefix per participating lane and supplies the requested aggregate to the group; all 32 callers agree on the count in the partial round and invalid inputs do not enter the operation; all required lanes still participate; every live group has exclusive scratch; no performance claim appears.

<details><summary>Hint 1</summary>Draw output cardinality first: one value per group and one value per lane are different collective contracts.</details>

<details><summary>Hint 2</summary>Then draw "must invoke," "contributes valid input," and "may read output" as three sets; they need not be identical.</details>

## Exercise 2: Select a partial reduction for a 2D block

**Goal:** A launch has shape `16 x 8 x 1`, and only the first 93 threads in row-major order own valid integers, one per valid thread. Select a primitive and partial overload that produce one block aggregate.

**Constraints:** The template shape exactly matches the launch, and the complete 128-thread block reaches the collective. Only the row-major prefix contributes data, and only the documented reader consumes the result. The requirement keeps reduction order across repeated kernel invocations with identical input, so do not select an algorithm variant that explicitly relinquishes that guarantee.

**Expected evidence:** Template/launch equality, row-major rank formula, participant-versus-contributor sets, output-validity rule, algorithm requirement, TempStorage ownership, and reuse barrier.

**Acceptance criteria:** The packet separates 93 contributors from 128 callers; uninitialized invalid input never enters the operation; exactly one documented thread consumes the result; shared storage is not reused before a full-block phase edge; the explicitly variable-order variant is not selected, and no stronger unproven determinism or speed claim is attached to another variant.

<details><summary>Hint 1</summary>Convert `(x,y,z)` to a linear rank before defining "the first 93."</details>

<details><summary>Hint 2</summary>After fixing the contributor set, inspect which overload expresses its count and whether an algorithm name changes the operation-order guarantee.</details>

## Exercise 3: Select a blocked-array exclusive scan

**Goal:** Each thread in a 128-thread one-dimensional block owns four consecutive counts. Produce exclusive offsets over the complete 512-item logical sequence and provide the tile aggregate to every thread.

**Constraints:** Input has row-major blocked arrangement, so each thread's four items are consecutive in the global sequence. The complete block invokes, and output may alias local input arrays. State the zero identity, per-item output validity, aggregate validity, algorithm-family requirement, and barrier before a following collective receives the same shared region.

**Expected evidence:** A 512-item index mapping, primitive and overload selection, first- and last-thread output semantics, aggregate-reader set, TempStorage phase diagram, and variant rationale without timing.

**Acceptance criteria:** The exclusive prefix for logical index `4 * thread + local_item` is correct; 512 outputs are distributed back to threads; the aggregate is valid for every block thread; following storage use occurs after a full-block barrier; striped layout is not mistaken for blocked; no winner is inferred from a variant name.

<details><summary>Hint 1</summary>Expand the first eight logical positions by thread rank and then local item index.</details>

<details><summary>Hint 2</summary>After confirming arrangement, mark separate phase boundaries for per-item output, tile aggregate, and scratch reuse.</details>

## Next

Inspect the [separate reviewed solutions](/en/libraries/cub-warp-block-primitives/solutions/), then complete [PB-R4-004](/en/practice/#pb-r4-004) and continue to reuse only [VIS10](/en/visuals/reduction-stages/).
