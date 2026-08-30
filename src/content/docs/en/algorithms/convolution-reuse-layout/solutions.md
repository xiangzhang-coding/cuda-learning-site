---
title: 'A07 Reviewed Solutions: Convolution Semantics, Reuse Patches, and Production Gates'
description: Review the A07 asymmetric-filter oracle, stride-and-padding patch, uniform phases, future cuDNN gates, valid alternatives, and common errors.
pairId: a07-solutions
counterpart: /algorithms/convolution-reuse-layout/solutions/
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
unitId: A07-SOLUTIONS
prerequisites:
  - A07-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a07-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/convolution-reuse-layout/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/convolution-reuse-layout/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate review page for the [A07 Exercises](/en/algorithms/convolution-reuse-layout/exercises/). The equations, patch diagrams, and production gates below are static reasoning artifacts. They compile no CUDA, execute no cuDNN, and produce no performance evidence.

## Solution 1: distinguish the operations with an asymmetric filter

With `H=W=4`, `R=S=2`, unit stride and dilation, and zero padding, `P=Q=3`. The teaching cross-correlation does not flip the filter. Every output is its window's top-left value minus its bottom-right value:

| output | source values | result |
| --- | --- | ---: |
| `(0,0)` through `(0,2)` | `1-6`, `2-7`, `3-8` | `-5,-5,-5` |
| `(1,0)` through `(1,2)` | `5-10`, `6-11`, `7-12` | `-5,-5,-5` |
| `(2,0)` through `(2,2)` | `9-14`, `10-15`, `11-16` | `-5,-5,-5` |

The cross-correlation output is therefore three rows of `[-5,-5,-5]`. Mathematical convolution flips both spatial axes, producing `[[-1,0],[0,1]]`; the same nine windows now subtract top-left from bottom-right, producing three rows of `[5,5,5]`. The asymmetric filter prevents symmetry from hiding orientation, and the CPU oracle accepts only the unflipped teaching result.

## Solution 2: derive the stride-and-padding staged patch

The complete operation has `P=Q=floor((7+2-2-1)/2)+1=4`. The selected output tile covers `oy=0..1` and `ox=0..2`. Patch height is `(2-1)*2+(3-1)*1+1=5`; width is `(3-1)*2+(3-1)*1+1=7`. In padded coordinates, the staged region spans y `-1..3` and x `-1..5`, for 35 slots.

The seven slots in the top row and the leftmost slot in each of the remaining four rows are outside the input domain, giving 11 explicit zeros. The other 24 slots read input rows `0..3` and columns `0..5`. Six outputs each have nine taps, so the direct path has `6*9=54` logical references. The cooperative loader assigns one owner to each of 35 slots, then that owner loads or writes zero. The whole block reaches the barrier before the six valid output owners compute and store. `54/35` describes overlap and staging opportunity, not a transaction or speedup ratio.

## Solution 3: specify future cuDNN production gates

The ordered packet first pins a `cuDNN library + cuDNN Frontend + Toolkit + driver + GPU + build` component matrix, then fixes NCHW/KCRS/NKPQ shapes, strides, types, cross-correlation, padding, stride, and dilation. It next records graph validation, operation-graph build, heuristic candidates, filters, the selected execution plan, workspace bytes/alignment/allocation/lifetime, the CPU-oracle and tolerance verdict, and a same-scope determinism policy. Only then does it leave a measurement template.

Each failure has its own class: descriptor or validation failure, build/support failure, no eligible plan, workspace budget/lifetime failure, numerical mismatch, and determinism failure are not kernel timing. cuDNN Frontend v1.27.0 is only a future coordinate for cuDNN 9.24.0 and later; a later, unpublished cuDNN library unit pins the production matrix. Every build, plan, workspace, output, timing, and speedup cell remains `unrecorded`, so there is no hand-written winner.

## Valid alternatives

- Solution 1 may expand all four products at every output; zero-weight terms still preserve filter orientation.
- Solution 2 may stage only the sparse tap footprint, but it needs a new coverage, ownership, and address proof.
- A production packet may begin with a framework-provided cuDNN path instead of direct Frontend use; it still pins component, semantics, workspace, correctness, and evidence scope.
- An application that needs only numerical acceptance may omit bitwise reproducibility, but it must distinguish tolerance and determinism verdicts.

## Common errors

- Testing only a symmetric filter, making convolution and cross-correlation indistinguishable.
- Treating padding as real input allocation or issuing an out-of-bounds read under a zero policy.
- Forgetting that stride 2 moves adjacent output origins, or treating 54 logical taps as 54 unique staged values.
- Letting a thread with no output skip cooperative loading or the barrier.
- Treating a heuristic candidate as the selected plan, or a workspace query as allocation and lifetime proof.
- Declaring either a custom kernel or cuDNN the winner before the later cuDNN library unit pins a component matrix, correctness parity, and a measurement record.

Reviewed: **2026-08-30**. All four evidence arrays remain empty.
