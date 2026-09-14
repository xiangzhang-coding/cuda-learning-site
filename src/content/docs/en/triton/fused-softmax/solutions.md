---
title: 'T03 Reviewed Solutions'
description: Review stable masking, independent checks and bounded performance claims after attempting the Exercises.
pairId: t03-solutions
counterpart: /triton/fused-softmax/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank, next]
resourceKind: solution-set
unitId: T03-SOLUTIONS
prerequisites: [T03-EXERCISES]
relatedUnits: [T03, LAB15]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton reduction source', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/standard.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/fused-softmax/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'T03,LAB15' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/fused-softmax/solutions/" lang="zh-CN">阅读中文对应页</a>

## Attempt first

Exact prerequisite **[T03-EXERCISES]**: complete the [Exercises](/en/triton/fused-softmax/exercises/) first. These are worked derivations, not GPU observations. Reviewed 2026-09-14; [SRC-CUDA-088](/en/sources-and-versions/#src-cuda-088).

## Solution 1: preserve both the reduction and address contract

Three equal −1000 logits normalize to three probabilities of one third. For `[1000,1001,1002]`, subtract 1002, yielding weights proportional to `[exp(-2),exp(-1),1]` and approximately `[0.09003057317,0.24472847105,0.66524095577]`. These are mathematical reference values, not measured GPU outputs.

Width 33 uses tile 64: valid columns 0–32, invalid columns 33–63. Compare your implementation with the shared source rendered in [T03](/en/triton/fused-softmax/). Fill invalid loads with negative infinity, subtract the maximum, exponentiate, reduce the weights, divide and mask stores. A zero fill contaminates normalization; a masked store cannot fix that arithmetic. No cross-row barrier is needed because each row has a unique owner.

Run the unchanged independent oracle, finite/range and row-sum checks for every Lab case. A NaN sentinel exposes a missed final store even when a zero output could look plausible. Keep the tail guard and input-unchanged check. A host pass verifies the host policy; only a qualified external run can provide GPU evidence.

## Solution 2: a traffic ledger is not a benchmark

There are 165 elements. The materialized ledger is `4*(8*165+4*5) = 5360` bytes; the fused ledger is `8*165 = 1320` bytes. Their ratio is about 4.06 **logical bytes per logical byte**, not a time ratio. Native softmax does not necessarily materialize that specification.

First-launch wall time may include compilation and setup. Save compilation separately, state no autotuning, warm up device execution, and use the selected helper's millisecond budgets and `return_mode='all'`. Match preallocated output, stored inputs, dtype, stream, cache policy and load. Retain all rounds and medians/ranges for both narrow and wide cases. Four warps is only a candidate until controlled evidence supports selection. If variability hides the difference, report inconclusive. Without actual logs and a complete manifest, LAB15 stays Pending Hardware Verification.

## Practice Bank solutions

<a id="pb-r5-015-solution"></a>

### PB-R5-015: a zero padding trap

For three equal −1000 values padded to four with zero, zero becomes the maximum. The valid exponentials underflow, while the invalid exponential is one. Stored valid probabilities become zero instead of one third; the row sum fails. Negative-infinity padding preserves a maximum of −1000, gives three unit weights and one zero, then divides by three. Testing only exact power-of-two widths would miss this padding defect.

<a id="pb-r5-016-solution"></a>

### PB-R5-016: incomparable scopes

A preallocated Triton forward call and native softmax including transfer/allocation are different workloads. A graph-replay number and a cache-cleared device-event number also have different scopes. Rerun both under the same declared protocol, keep first-call/JIT and any tuning out of steady state, and retain all shapes/rounds plus hardware and load coordinates. Neither the smaller number nor a traffic ledger establishes a speedup. Until those observations exist, no winner or traffic conclusion is justified.

## Continue

Return to [T03](/en/triton/fused-softmax/) or execute [LAB15](/en/labs/verify-fused-softmax/) in its pinned environment. A correct kernel with a documented regression is a valid result; never replace an absent measurement with an expected value.
