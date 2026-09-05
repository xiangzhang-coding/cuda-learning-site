---
title: 'L04 Reviewed Solutions: Select CUB Warp and Block Primitives'
description: Review logical-warp outputs, a partial block reduction, a blocked-array scan, valid alternatives, and common collective errors.
pairId: l04-solutions
counterpart: /libraries/cub-warp-block-primitives/solutions/
factCheckDate: '2026-09-05'
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
unitId: L04-SOLUTIONS
prerequisites:
  - L04-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l04-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cub-warp-block-primitives/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L04-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cub-warp-block-primitives/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate reference for the [L04 Exercises](/en/libraries/cub-warp-block-primitives/exercises/). It reviews only selection and contracts. It supplies no CUDA/C++ implementation, compilation, execution, output, or performance observation, and all four evidence arrays remain empty.

## Solution 1: Two outputs for 8-lane groups

**Reviewed solution:** Request A selects `cub::WarpReduce<T, 8>`. Every consecutive 8-lane logical warp invokes together, and only logical lane 0 consumes the sum. Request B selects an inclusive `cub::WarpScan<T, 8>` aggregate overload. Each lane receives its prefix, and every participating lane receives the group aggregate. The four simultaneously active groups have four independent `TempStorage` slots.

All 32 lanes still participate in the partial round, and all four groups in the calling hardware warp use `valid_items = 5`; the first five items of each group contribute. Scan uses its corresponding partial form and leaves invalid outputs unmodified. Sibling groups in one physical warp cannot pass different counts in one call. Before reusing or repurposing a slot, the exact eight-lane mask executes `__syncwarp(mask)` together. This protocol carries no performance conclusion.

## Solution 2: Partial reduction in a 2D block

**Reviewed solution:** Select `cub::BlockReduce<T, 16, Algorithm, 8, 1>` so the template matches the launch, then use a single-item `Sum` or generic `Reduce` overload with `num_valid = 93`. Row-major rank is `x + 16 * y`; the first 93 ranks contribute while all 128 threads participate. Only linear thread 0 consumes the aggregate.

The repeated-order requirement excludes `BLOCK_REDUCE_WARP_REDUCTIONS_NONDETERMINISTIC`. The default `BLOCK_REDUCE_WARP_REDUCTIONS` or a raking variant whose operation constraints are met is semantically eligible. Final selection still needs exact type and operation compilation plus measurement; this task does not rank candidates. The complete block executes `__syncthreads()` before reusing `TempStorage`.

## Solution 3: Blocked-array exclusive scan

**Reviewed solution:** Select the array `ExclusiveSum` aggregate overload of `cub::BlockScan<T, 128>`. Local item `j` in thread `t` maps to logical index `4t + j`, so thread 0 owns prefix outputs for indices 0 through 3 and thread 127 owns those for indices 508 through 511. Local input and output arrays may alias. The zero-initialized value must be an additive identity.

All 128 threads participate, each of the 512 per-item outputs is valid in its owning thread, and `block_aggregate` is valid for every thread. The default `BLOCK_SCAN_RAKING`, `BLOCK_SCAN_RAKING_MEMOIZE`, or shape-supported `BLOCK_SCAN_WARP_SCANS` may enter later validation, but no name establishes a winner. A `__syncthreads()` precedes transfer of the shared region to a following collective.

## Valid alternatives

- Keep warp reduction when each 8-lane group needs only a leader aggregate. If downstream needs a prefix in every lane, do not disguise a leader broadcast as a scan.
- A block tail may use a guarded full tile when the operation has a proven identity. For a generic operation without one, move to an abstraction with an explicit partial contract.
- Explicit `TempStorage` may use independent objects per group or a union across nonoverlapping phases. Union reuse retains the required warp or block barrier.
- If the required group is a runtime-selected arbitrary lane set rather than a CUB logical warp, redefine the contract with an M12 group abstraction instead of fabricating `LogicalWarpThreads`.

## Common errors

- Calling a collective only from valid-data threads and omitting required participants.
- Reading a WarpReduce or BlockReduce return in every lane, or reading scan output only in a leader.
- Mismatching launch and block template dimensions or treating striped values as a blocked arrangement.
- Aliasing one `TempStorage` across live logical warps or omitting `__syncwarp(mask)` or `__syncthreads()` before reuse.
- Assuming an embedded barrier publishes a leader's following shared-memory write to consumers.
- Treating `valid_items` or `num_valid` as a participant count rather than a contributor count.
- Claiming repeated operation order after selecting the nondeterministic BlockReduce variant, or inferring speedup from any variant name.
- Treating owner tests or VIS10 as Learning Site compilation or runtime evidence.

Reviewed: **2026-09-05**. All four evidence arrays remain empty.
