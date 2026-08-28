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

Source guarantees include each lane's predicate and scalar branch result. API guarantees include the participant and synchronization semantics of a correctly used warp intrinsic. A source-level join only identifies a common source region; it is not synchronization. Exact path issue order, instruction interleaving, reconvergence-stack operation, and elapsed execution are unknown implementation details.

CC 7.0+ Independent Thread Scheduling permits per-thread execution state and sub-warp regrouping. It does not supply a schedule trace. Cross-lane data remains valid only when an API or memory-model relation supplies the required mask, ordering, and visibility.

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
