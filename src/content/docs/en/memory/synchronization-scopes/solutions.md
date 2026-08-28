---
title: 'M05 Reviewed Solutions: Select synchronization by scope'
description: Guarantee classification, a repaired device-scope publication graph, and four participant-driven scope selections for the M05 Exercises.
pairId: m05-solutions
counterpart: /memory/synchronization-scopes/solutions/
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
unitId: M05-SOLUTIONS
prerequisites:
  - M05-EXERCISES
relatedUnits:
  - M05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m05-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: M05 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/synchronization-scopes/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the reviewed answers for the [M05 Exercises](/en/memory/synchronization-scopes/exercises/). They prove static contracts; they do not report execution or performance evidence.

## Solution 1: Classify guarantees without conflating them

| operation | named participants | rendezvous | ordering / visibility | atomicity |
| --- | --- | --- | --- | --- |
| `__syncwarp(mask)` | lanes named by `mask` | yes, for the documented warp synchronization point | documented memory ordering among participating lanes | no arbitrary read-modify-write atomicity |
| `__syncthreads()` | participating threads in one block | yes | prior memory accesses become visible under its block contract | no arbitrary read-modify-write atomicity |
| device-scope relaxed atomic increment | device participants accessing that atomic | no | no ordering of unrelated payload from relaxed order | yes, for the increment at sufficient scope |
| device-scope memory fence | calling thread's operations, ordered for device scope | no | orders that thread's memory operations; a protocol must connect observers | no |

The classification is intentionally not one check per row. A primitive may provide multiple guarantees, but only for its named participants and documented scope.

## Solution 2: Repair a payload-publication proof

The original claim lacks an observable publication, a consumer-side ordering action, and a proof that both sides use sufficient scope. One repaired graph is:

```text
producer: write payload
          -> device-scope release store ready = 1
consumer: device-scope acquire load ready observes 1
          -> read payload
```

The release/acquire pair creates the cross-thread relation when the acquire observes the released value. A standalone `__threadfence()` may order producer operations at device scope, but it neither writes `ready` nor makes the consumer wait. Equivalent legacy protocols must still provide an atomic publication, sufficient fence ordering, and a matching observation; the slogan “fence means done” remains wrong.

## Solution 3: Select scope from four scenarios

| scenario | narrowest candidate | additional proof |
| --- | --- | --- |
| named lanes exchange values | warp | one explicit mask names all participating lanes, and every named lane executes the collective |
| block consumes a shared tile | block | every required thread reaches the block barrier; shared storage belongs to that block |
| later kernel consumes global results | device communication plus the explicit launch boundary | the boundary orders producer completion before consumer launch; no in-kernel block rendezvous is invented |
| CPU consumes system-accessible data | system | allocation accessibility and system-scope primitive support include both CPU and GPU participants |

Warp is too narrow for a whole block, block is too narrow for cross-block publication, and device is too narrow when the CPU is a participant. System is not selected for the first three merely because it is wider; the protocol should express the actual participant set.

## Valid alternatives

- A documented block collective can replace `__syncthreads()` when it names the same required block participants and provides the needed memory effects.
- A legacy fence-plus-atomic-flag message-passing protocol can be valid if both ordering sides and scopes are proven explicitly.
- An event or stream boundary in later units may order work submissions, but it must be analyzed at that API's documented scope rather than substituted into an in-kernel barrier proof.

## Common errors

- Treating a fence as a rendezvous or notification.
- Treating an atomic update as ordering every unrelated memory access.
- Using `__syncthreads()` for participants in different blocks.
- Omitting inactive warp lanes from the mask proof while still expecting their values.
- Choosing system scope without checking memory accessibility or primitive support.
- Assuming a static ledger demonstrates execution or performance.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
