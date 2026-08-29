---
title: 'M12 Exercises: Make synchronization groups composable'
description: Specify an explicit helper contract, repair tile collective participation and arguments, and gate dynamic and grid-wide groups in three static tasks.
pairId: m12-exercises
counterpart: /memory/cooperative-groups/exercises/
factCheckDate: '2026-08-29'
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
unitId: M12-EXERCISES
prerequisites:
  - M12
relatedUnits:
  - M12
  - M13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m12-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M12-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M12 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M12,M13' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/cooperative-groups/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M12: Cooperative Groups and Composable Synchronization](/en/memory/cooperative-groups/) first. These Exercises produce static group and launch contracts; they execute no collective and create no CUDA Evidence Status.

## Instructions

For every operation, write handle, membership, scope, and required participants. For collectives, review each corresponding argument separately. Keep dynamic active-set discovery and cooperative grid launch as distinct boundaries before consulting the [reviewed solutions](/en/memory/cooperative-groups/solutions/).

## Exercise 1: Expose a helper's group contract

**Goal:** Redesign a device helper that writes one shared-memory value and hides `__syncthreads()` inside its body so that it instead accepts an explicit group handle and states its caller obligations.

**Constraints:** Use `this_thread_block()` at the call site. Pass the handle into the helper. State membership, memory scope, leader selection, and which block threads must call. Do not call the helper from a branch reached by only part of the block.

**Expected evidence:** A helper signature, one call-site sketch, a four-field group-contract table, and a before/after control-flow diagram showing the participation repair.

**Acceptance criteria:** The handle is explicit; `thread_rank()` selects one leader; every block member reaches the group sync; shared memory is not read before the sync completes; the helper cannot be reviewed as safe without its caller-participation clause.

<details><summary>Hint 1</summary>Move the synchronization scope from an implicit intrinsic name into a parameter whose type and value the caller supplies.</details>

<details><summary>Hint 2</summary>The branch condition belongs after the collective helper call unless every block member takes the branch.</details>

## Exercise 2: Repair partition and collective contracts

**Goal:** Repair code that calls `tiled_partition<32>(block)` only when `threadIdx.x < 32`, then lets a subset of the returned tile call `reduce(tile, value, op)` with different operation selectors.

**Constraints:** Make partition construction collective over the parent block. Keep the later reduce collective uniform over each participating tile. Allow per-thread `value` inputs, but make group instance and reduction operation agree as required.

**Expected evidence:** A parent-participation table, tile-membership map, one repaired control-flow sketch, and an argument matrix for `tile`, `value`, and `op`.

**Acceptance criteria:** Every parent-block member reaches `tiled_partition`; every member of a tile that invokes reduce reaches the same collective instance; `value` may vary by thread; group and operation agree across participants; no assumed warp lockstep is used as the repair.

<details><summary>Hint 1</summary>Partition first with the complete parent group; branch later using ranks from the resulting handle.</details>

<details><summary>Hint 2</summary>"Same call" does not mean "all arguments equal"; consult which collective arguments explicitly represent per-thread contributions.</details>

## Exercise 3: Separate a dynamic set from a gated grid

**Goal:** Review two claims: "`coalesced_threads()` always returns the whole warp" and "`this_grid().sync()` works in an ordinary kernel launch." Replace each with a complete, version-current contract.

**Constraints:** For the coalesced group, state the construction point, dynamic membership, and later divergence boundary. For grid sync, include `cudaDevAttrCooperativeLaunch`, cooperative launch, grid-size/residency review, and full-grid participation. Mark archived multi-device APIs as non-current in CUDA 13.

**Expected evidence:** Two contract cards, a dynamic-membership timeline, a host/device grid-launch checklist, and a version table for current 13.3/13.3.1 versus 12.9.1 and 11.8.0 archives.

**Acceptance criteria:** No fixed 32-thread guarantee is assigned to `coalesced_threads`; a later construction may have different membership; normal `<<<...>>>` launch is rejected for grid sync; every launch gate is present; multi-device Cooperative Groups synchronization is not presented as current CUDA 13 behavior.

<details><summary>Hint 1</summary>Bind a coalesced-group membership claim to the exact program point where the handle is constructed.</details>

<details><summary>Hint 2</summary>A grid handle names a scope; the cooperative host launch makes its synchronization capability valid.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/cooperative-groups/solutions/) and then repair the combined participant and launch defects in [Practice Bank PB-R2-004](/en/practice/#pb-r2-004).
