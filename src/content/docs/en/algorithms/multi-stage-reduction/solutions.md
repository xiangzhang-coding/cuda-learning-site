---
title: 'A02 Reviewed Solutions: Reduction Stages and Operation Order'
description: Partial trace, uniform-barrier repair, floating-point decision contract, valid alternatives, and common errors for the three A02 Exercises.
pairId: a02-solutions
counterpart: /algorithms/multi-stage-reduction/solutions/
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
unitId: A02-SOLUTIONS
prerequisites:
  - A02-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a02-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/multi-stage-reduction/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A02-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/multi-stage-reduction/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed answers to the [A02 Exercises](/en/algorithms/multi-stage-reduction/exercises/). The multi-stage-reduction tables, pseudocode, and floating-point reasoning are static review artifacts. There is no GPU execution and no compilation, runtime, or performance evidence.

## Solution 1: Trace two blocks and the final partial

The first block's shared tree is:

| phase | active-lane outputs | barrier participants |
| --- | --- | ---: |
| guarded load | `[1,2,3,4,5,6,7,8]` | 8 |
| stride 4 | `[6,8,10,12]` | 8 |
| stride 2 | `[16,20]` | 8 |
| stride 1 | `[36]` | 8 |

Invalid lanes 5 through 7 of the second block write identity:

| phase | active-lane outputs | barrier participants |
| --- | --- | ---: |
| guarded load | `[9,10,11,12,13,0,0,0]` | 8 |
| stride 4 | `[22,10,11,12]` | 8 |
| stride 2 | `[33,22]` | 8 |
| stride 1 | `[55]` | 8 |

The first kernel writes global partial array `[36,55]`. The second kernel fills its remaining shared slots with zero, publishes all slots, and reaches `36 + 55 = 91` in its tree. An inactive lane has no combine action at a stage, but its barrier participation remains true.

## Solution 2: Repair an inactive-lane early return and conditional barrier

```text
value = input[global_index] if global_index < n else identity
shared[tid] = value
__syncthreads()

stride = block_size / 2
while stride >= 1:
  if tid < stride:
    shared[tid] = combine(shared[tid], shared[tid + stride])
  __syncthreads()
  stride = stride / 2

if tid == 0:
  global_partials[blockIdx.x] = shared[0]
```

- Value selection removes the out-of-bounds load without removing a barrier participant.
- Every lane defines one shared slot, so the initial barrier publishes a complete stage 0.
- The active predicate encloses only the combine; the barrier is uniform across the block.
- Each barrier orders a stage write before the next stage reads that slot.
- Lane 0 stores only after the declared final stage, so no block claims a partial early.

This teaching baseline retains a uniform barrier after each round. A narrower group or a final-stage optimization needs its own proof and cannot be smuggled into this answer.

## Solution 3: Declare floating-point order and a production decision

The parentheses are:

```text
serial: (((1e20f + 1.0f) + -1e20f) + 1.0f)
tree:   (1e20f + 1.0f) + (-1e20f + 1.0f)
```

Under declared binary32 round-to-nearest expected reasoning, each `1.0f` can disappear when added to the much larger magnitude. The serial path cancels the large values before adding the final one, commonly yielding a reasoned value of 1. The adjacent-pair tree loses both small terms before combining the large terms, yielding a reasoned value of 0. This ledger demonstrates that operation order changes the rounding path; it is not a recorded observation from a compiler or GPU run.

A production decision table needs at least:

| gate | CUB `DeviceReduce` | hand-written teaching path |
| --- | --- | --- |
| result contract | same inputs, type, operation, reference, and tolerance | must be identical |
| source role | production baseline | learning artifact or stated special requirement |
| evidence | exact CCCL/Toolkit, Environment Manifest, and output | exact custom source, same environment, and output |
| measurement | one boundary after correctness gates pass | comparable only at the same boundary |

After both paths pass the acceptance rule, record their operation order and observed results. Do not copy the CUB implementation, and do not infer a performance advantage merely because the hand-written source exposes its tree.

## Valid alternatives

- Exercise 1 may use an adjacent-pair tree. The partials still need to be 36, 55, and 91, but the operation order must be redrawn.
- An explicit Cooperative Groups collective may replace the expression, provided its participant set and synchronization contract are complete.
- A warp shuffle can implement a proven warp-sized tail, but named lanes and masks cannot disappear from the proof.
- A widened accumulator, compensated summation, or fixed tree changes the numerical contract and needs an independent reference and acceptance policy.
- Keeping CUB `DeviceReduce` in production is a valid conclusion. Do not invent a custom-kernel requirement when none exists.

## Common errors

- Returning an invalid lane before the initial barrier and losing a participant.
- Calling `__syncthreads()` only from active lanes, creating a conditional barrier.
- Leaving invalid shared slots without identity and reading undefined values later.
- Pretending a block barrier synchronizes independently scheduled blocks across a grid.
- Automatically rejecting or accepting a tree result that differs from a serial bit pattern without a tolerance contract.
- Making CUB an A02 prerequisite or copying an implementation from CUB source as the teaching answer.
- Claiming that a custom reduction is faster from a diagram, operation count, or source shape.

Reviewed **2026-08-30**. All four evidence arrays and their corresponding head metadata remain empty.
