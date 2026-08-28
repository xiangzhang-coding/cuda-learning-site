---
title: 'M06 Reviewed Solutions: Reason with explicit warp masks'
description: Branch-mask traces, two explicit warp-exchange repairs, and a source-versus-schedule classification for the M06 Exercises.
pairId: m06-solutions
counterpart: /memory/warp-divergence-reconvergence/solutions/
factCheckDate: '2026-08-28'
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
unitId: M06-SOLUTIONS
prerequisites:
  - M06-EXERCISES
relatedUnits:
  - M06
  - VIS03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M06,VIS03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/warp-divergence-reconvergence/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These reviewed answers solve the [M06 Exercises](/en/memory/warp-divergence-reconvergence/exercises/) as source-level proofs. The explanatory order is not a captured hardware schedule.

## Solution 1: Trace two branch masks and a later collective

| lane | `lane < 3` | region |
| ---: | --- | --- |
| 0, 1, 2 | true | `A` |
| 3, 4, 5, 6, 7 | false | `B` |

For the eight-lane teaching subset, `A` has lanes `{0,1,2}`, `B` has `{3,4,5,6,7}`, and `C` has `{0,1,2,3,4,5,6,7}`. The collective participation set at `C` is all eight lanes because the algorithm requires them, not because one branch queried its current activity. The portable trace leaves whether `A` or `B` issues first and how their instructions interleave unknown.

## Solution 2: Repair an implicit-lockstep exchange

The missing relation is `write shared[lane] -> warp synchronization -> peer read`. One static repair is:

```text
participants = mask naming lanes 0..7
shared[lane] = value
__syncwarp(participants)
if lane > 0: consume shared[lane - 1]
```

A register alternative uses a synchronized shuffle operation with the same participant mask. Lanes 1 through 7 request values from valid source lanes 0 through 6; lane 0 does not consume a predecessor. The collective's own contract replaces the shared-memory exchange, but the mask and source-lane proof remain mandatory.

## Solution 3: Separate source facts from schedule guesses

1. **Classification: source guarantee.** Evaluating `lane < 3` gives true for lanes 0 through 2 and false for lanes 3 through 7; this is a per-lane source fact.
2. **Classification: source guarantee.** Within the stated eight-lane fixture, `0x07 & 0xf8 == 0` and `0x07 | 0xf8 == 0xff`, so the two masks are disjoint and complete.
3. **Classification: source guarantee.** Each lane follows one scalar branch and retains that branch's assigned `result`; no cross-lane schedule claim is needed.
4. **Classification: rejected claim.** A closing brace marks control flow only. It is not `__syncwarp`, so add a documented synchronization operation when the algorithm needs one.
5. **Classification: rejected claim.** `C` is a common source successor, but that fact does not establish one current active mask or one simultaneous dynamic instruction instance. State only that each non-exited lane eventually follows its source path to `C`.
6. **Classification: rejected claim.** A source-level join supplies no memory-visibility edge. Cross-lane communication needs a documented synchronization or memory-model relation with the required participants and scope.
7. **Classification: API guarantee.** When every non-exited lane named by `0xff` executes `__syncwarp(0xff)` as required, the intrinsic supplies its documented synchronization semantics to those lanes.
8. **Classification: rejected claim.** `__activemask()` reports lanes active at that call; it does not reconstruct the earlier pre-branch group. Compute or capture the intended participation mask before divergence.
9. **Classification: unknown implementation detail.** The programming model does not choose an exact true-path/false-path issue order. A portable account leaves either order possible.
10. **Classification: unknown implementation detail.** CC 7.0+ Independent Thread Scheduling permits per-thread execution state and sub-warp regrouping, but source code does not determine exact instruction interleaving or timing.

## Valid alternatives

- A cooperative-groups tile can name participants if its construction and collective contract match the algorithm.
- A smaller mask is valid when the algorithm genuinely excludes other lanes and every named lane follows the operation's contract.
- A shared-memory protocol may have multiple synchronized phases; each phase needs its own participant and visibility proof.

## Common errors

- Treating `__activemask()` as the intended group regardless of where it is called.
- Naming lanes in a collective mask that do not reach the operation.
- Reading from an inactive or invalid shuffle source lane.
- Treating a closing brace as a warp barrier.
- Drawing path A before path B and promoting that drawing to a hardware schedule.
- Assuming CC 7.0+ removes the need for explicit warp-safe reasoning.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
