---
title: 'M12 Reviewed Solutions: Make synchronization groups composable'
description: Reviewed helper, tile-collective, dynamic-set, and cooperative-grid contracts for the M12 Exercises.
pairId: m12-solutions
counterpart: /memory/cooperative-groups/solutions/
factCheckDate: '2026-08-29'
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
unitId: M12-SOLUTIONS
prerequisites:
  - M12-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m12-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M12-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M12-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/memory/cooperative-groups/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [M12 Exercises](/en/memory/cooperative-groups/exercises/) as static contracts. They contain no compiler output, device query, occupancy result, launch record, or collective observation.

## Solution 1: Expose a helper's group contract

One reviewable interface is:

```cpp wrap
template <class Group>
__device__ void publish_then_sync(const Group& group, int* shared_value, int value) {
  if (group.thread_rank() == 0) *shared_value = value;
  group.sync();
}

cg::thread_block block = cg::this_thread_block();
publish_then_sync(block, &shared_value, value); // reached by the full block
```

The handle is `block`; membership is all threads in that block; the synchronization and shared-memory visibility scope is the block group; every block member participates. Rank zero is the sole writer, and reads occur only after the helper's sync. A caller may branch after this call, but a partial-block branch around the call violates the helper contract.

## Solution 2: Repair partition and collective contracts

Construct the tile before divergent control:

```cpp wrap
cg::thread_block block = cg::this_thread_block();
auto tile = cg::tiled_partition<32>(block);
int result = cg::reduce(tile, value, cg::plus<int>());
```

All parent-block members participate in partitioning and receive their own tile handle. Within each tile, all members execute the same reduce instance. The argument review is:

| Argument | Group-wide rule |
| --- | --- |
| `tile` | same tile instance for that collective's participants |
| `value` | may differ; explicitly one per-thread contribution |
| `cg::plus<int>()` | same reduction operation across participants |

If only selected tiles should do later noncollective work, branch after the reduce or arrange a separate control path in which an entire tile participates. Implicit warp lockstep repairs neither collective construction nor argument disagreement.

## Solution 3: Separate a dynamic set from a gated grid

`coalesced_threads()` creates a point-specific group from active threads. It does not guarantee 32 members, a particular active subset, or persistent coalescing. The handle remains the authority for that collective; a later call after control flow may discover different membership.

A current single-device grid-sync checklist is:

1. Check the return from `cudaDeviceGetAttribute` and require nonzero `cudaDevAttrCooperativeLaunch`.
2. Calculate or otherwise validate the cooperative grid's block-count limit from occupancy and multiprocessor count.
3. Launch with `cudaLaunchCooperativeKernel`, not an ordinary launch.
4. Construct the grid group and ensure all grid threads reach each `grid.sync()` instance.
5. Check launch and completion errors at declared boundaries.

CUDA 13 removes the archived multi-device Cooperative Groups launch/synchronization path. The 12.9.1 and 11.8.0 records are historical comparisons and do not satisfy the current checklist.

## Valid alternatives

- Use `cg::sync(group)` instead of `group.sync()` when the same explicit handle and participation contract remain visible.
- Specialize a helper for `thread_block` or `thread_block_tile<N>` when the narrower accepted scope makes misuse harder.
- Use a static tile rather than `coalesced_threads()` when fixed membership is an actual algorithm requirement.
- Split an algorithm into multiple ordinary kernels when a kernel-completion boundary is preferable to the cooperative grid gate.

## Common errors

- Hiding a block-wide collective in a helper with no caller-participation contract.
- Partitioning a parent group from a partial branch.
- Letting only some members invoke a collective instance.
- Requiring per-thread reduce values to be equal while allowing the operation selector to differ.
- Treating a coalesced group as a permanent 32-thread warp.
- Calling grid sync after an ordinary launch or without a support/size gate.
- Copying a deprecated archive multi-device path into a CUDA 13 design.

Reviewed: **2026-08-29**. Compilation and runtime evidence axes remain empty.
