---
title: 'Q09 Reviewed Solutions: Occupancy, Scheduler States, and Throughput Claims'
description: Reviewed theoretical/achieved occupancy worksheet, active-to-issued ladder, profiler-claim audit, valid alternatives, and common errors.
pairId: q09-solutions
counterpart: /correctness/occupancy-stalls-throughput/solutions/
factCheckDate: '2026-09-01'
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
unitId: Q09-SOLUTIONS
prerequisites:
  - Q09-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q09-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/occupancy-stalls-throughput/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q09-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/occupancy-stalls-throughput/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers review the static contracts in the [Q09 Exercises](/en/correctness/occupancy-stalls-throughput/exercises/). They query no device, run no profiler, and turn no worksheet slot into an observation.

## Solution 1: Theoretical and achieved occupancy worksheet

The reviewed worksheet establishes three provenances first. `W_model` comes from the exact launch, binary resources, allocation rules, and device limits. `W_observed` comes from execution sampling and aggregation in the exact report. `W_max` comes from the same exact device at a compatible scope. It may therefore state only:

`O_theoretical = W_model / W_max`

`O_achieved = W_observed / W_max`

Grid and block, registers, static and dynamic shared memory, resident block and warp limits, GPU/CC, and query output are required slots. If any remains unknown, the result remains symbolic. Utilization enters neither ratio.

**Review:** Passes. Numerator provenance stays separate, and no limiter, ceiling, or percentage is invented.

## Solution 2: Active-to-issued scheduler ladder

The reviewed ladder is `active/resident -> eligible/ready-to-issue -> selected/issued`. An instruction-fetch, memory-dependency, execution-dependency, or barrier wait can make an active warp temporarily ineligible. The eligible set can contain several warps; the scheduler issues from one while the others remain eligible. Issued records an issue decision, not completion or peak throughput.

Latency is the wait for an operation or dependency interval. Throughput is declared work or traffic per time. More resident candidates can let a scheduler find another eligible warp during a wait, thereby hiding latency; they do not change the original dependency's latency. An issue opportunity has a gap when no warp is eligible, while a stall category remains only a diagnostic lead.

**Review:** Passes. Residency, readiness, issue, completion, latency, and throughput remain distinct.

## Solution 3: Three-percentage claim audit

The original claim is **unsupported as written**. Occupancy lacks theoretical or achieved identity and denominator. Stall share lacks sampling, normalization, issue-gap context, and competing causes. Throughput percentage lacks resource, ceiling, unit, scope, and definition. Even with those fields, the three quantities cannot establish a memory bottleneck, occupancy repair, or remaining speedup.

The reviewed next step first queries exact names, definitions, units, and availability and checks whether the selected kernel lacks eligible work. It then proposes one mechanism-specific candidate. For example, change one declared register/shared-memory or access-layout choice while keeping workload, correctness, binary build coordinates, GPU, tool, filter, replay, and clock/cache controls comparable. Predeclare support and rejection rules. Result slots remain empty.

**Review:** Passes. The claim becomes a falsifiable experiment contract rather than a fabricated conclusion.

## Valid alternatives

- An occupancy API, calculator, or report may establish the theoretical model when exact GPU, binary, launch, resource, and definition coordinates are complete.
- Scheduler issue activity may be reviewed before question-specific sampled stall evidence; the stall investigation may also stop when issue progress is healthy.
- A controlled candidate may change block size, resource use, or data layout, but each experiment names one primary mechanism and revalidates correctness.

## Common errors

- Treating occupancy as utilization or a busy percentage.
- Fabricating achieved occupancy from theoretical occupancy.
- Ignoring allocation granularity and counting source variables as registers.
- Treating an active warp as eligible or an issued instruction as completed.
- Equating hidden latency with reduced latency.
- Naming the largest stall share the bottleneck without scheduler issue gaps.
- Treating distance from a throughput ceiling as obtainable speedup.
- Copying metric spelling, units, or definitions without querying the exact GPU, tool, and report.

Reviewed: **2026-09-01**. All four evidence arrays remain empty.
