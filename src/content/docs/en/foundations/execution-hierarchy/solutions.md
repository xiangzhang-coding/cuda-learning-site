---
title: 'F02 Reviewed Solutions: Decompose the Execution Hierarchy and Ownership'
description: Separate reviewed solutions, valid alternatives, and common errors for the three F02 Exercises.
pairId: f02-solutions
counterpart: /foundations/execution-hierarchy/solutions/
factCheckDate: '2026-08-26'
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
unitId: F02-SOLUTIONS
prerequisites:
  - F02-EXERCISES
relatedUnits:
  - F02
  - VIS01
  - VIS02
  - F03
exampleIds:
  - EX03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f02-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F02,VIS01,VIS02,F03' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/execution-hierarchy/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [F02 Exercises](/en/foundations/execution-hierarchy/exercises/). Compare object boundaries, equations, and unguaranteed facts before comparing final numbers or schedule tables.

## Solution 1: Separate a function from two launches

The program has one `classify` kernel function definition. Launch A and Launch B each create one grid, giving two dynamic grid instances whose blocks, threads, and warps are not reused across launches.

| Item | Launch A | Launch B |
| --- | ---: | ---: |
| Grid instances | 1 | 1 |
| Blocks | `3 * 1 * 1 = 3` | `2 * 2 * 1 = 4` |
| Threads per block | `64 * 1 * 1 = 64` | `16 * 8 * 1 = 128` |
| Total launched threads | `3 * 64 = 192` | `4 * 128 = 512` |
| Warps per block | `64 / 32 = 2` | `128 / 32 = 4` |
| Total launch warps | `3 * 2 = 6` | `4 * 4 = 16` |

Warp numbering restarts at 0 in every block. “Launch A has 6 warps” is a total, not one cross-block cooperation unit numbered `0..5`. The execution configuration gives grid and block shapes. Warp/lane values are derived from block-local IDs, while the scheduler chooses particular SMs and block order.

## Solution 2: Predict two-dimensional boundary ownership

Ceiling division gives:

```text
gridDim = (ceil(53 / 16), ceil(19 / 8)) = (4, 3)
final blockIdx = (3, 2)
```

The logical coordinate ranges are `0..52` on x and `0..18` on y. The final valid row-major data index is `52 + 53 * 18 = 1006`.

| `threadIdx` | global `(x, y)` | local ID | warp, lane | bounds | ownership | `dataIndex` |
| --- | --- | ---: | --- | --- | --- | ---: |
| `(4, 2)` | `(52, 18)` | `4 + 16 * 2 = 36` | `1, 4` | x IN; y IN | Final element | 1006 |
| `(5, 2)` | `(53, 18)` | `5 + 16 * 2 = 37` | `1, 5` | x OUT; y IN | None | No access |
| `(4, 3)` | `(52, 19)` | `4 + 16 * 3 = 52` | `1, 20` | x IN; y OUT | None | No access |

Substitution into a linear formula can produce an integer for either of the final two rows, but that integer must not be used for array access. Valid two-dimensional ownership and a row-major `dataIndex` exist only after every axis passes its bound.

## Solution 3: Construct two legal scheduling explanations

Under the exercise's simplified conditions, both assignments are legal:

| Scheduling step | SM0 | SM1 |
| ---: | --- | --- |
| 1 | B2 | B0 |
| 2 | B3 | B1 |

| Scheduling step | SM0 | SM1 |
| ---: | --- | --- |
| 1 | B1 | B3 |
| 2 | B0 | B2 |

These tables show two permitted logical orders. They are not device records and specify neither step duration nor completion order. The four judgments are:

1. **“`blockIdx` order guarantees dispatch order” is false.** Coordinates identify blocks in a grid; they do not form a queue contract.
2. **“One block's threads remain on one SM” is true.** A block is assigned to one SM as a unit, and that SM schedules its warps.
3. **“Lane IDs give per-thread time order” is false.** A lane is a position in a warp, not a thread precedence number.
4. **“Launching the same function again reuses the original grid” is false.** Every launch creates a new grid with new block and thread instances.

## Valid alternatives

- Replace Solution 1's table with nested boxes, provided one function, two grids, independent per-block warp/lane boundaries, and every count remain explicit.
- Draw a coordinate plane before Solution 2's local-ID table, provided all three required threads, per-axis bounds, warp/lane positions, and “no access” conclusions remain reviewable.
- Use block orders other than those in Solution 3. Any answer is valid when every block appears exactly once, no block is split across SMs, and the unguaranteed order is explicit.

## Common errors

- Merging two launches into one grid, or calling the two grids two kernel function definitions.
- Partitioning warps continuously across all grid threads; warp grouping restarts from local ID 0 in every block.
- Writing the 2D local ID as `threadIdx.y + blockDim.y * threadIdx.x`, which violates x-fastest ordering.
- Checking only one coordinate axis or treating a linearized out-of-bounds coordinate as a valid array index.
- Assuming a lower `blockIdx` must run first or presenting an instructional schedule as an observed one.
- Treating a warp as the block-scoped shared-memory cooperation boundary or treating lane ID as time order.

Reviewed: **2026-08-26**. These solutions compile and execute no CUDA and produce no scheduling observation or performance record.
