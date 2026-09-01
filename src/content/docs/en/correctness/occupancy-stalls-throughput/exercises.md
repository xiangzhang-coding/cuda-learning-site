---
title: 'Q09 Exercises: Audit Occupancy, Scheduler States, and Throughput Claims'
description: Build an occupancy calculation contract, scheduler-state ladder, and non-causal profiler-claim audit in three static tasks.
pairId: q09-exercises
counterpart: /correctness/occupancy-stalls-throughput/exercises/
factCheckDate: '2026-09-01'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: Q09-EXERCISES
prerequisites:
  - Q09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q09-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/occupancy-stalls-throughput/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q09 }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/occupancy-stalls-throughput/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [Q09](/en/correctness/occupancy-stalls-throughput/) first. Each task produces a static worksheet. Run no GPU, profiler, or occupancy calculator, and fill no observation.

## Instructions

Keep unknowns unknown. Freeze exact device, binary, launch, and query fields before writing algebra, then state permitted and forbidden interpretations. Inspect the [reviewed solutions](/en/correctness/occupancy-stalls-throughput/solutions/) only after completing the contract.

## Exercise 1: Build a theoretical and achieved occupancy worksheet

**Goal:** Design a worksheet for an unspecified GPU and kernel binary. Use `W_model`, `W_observed`, and `W_max` for modeled active warps, execution-derived active warps, and the exact device's maximum active warps, then state both occupancy ratios.

**Constraints:** List grid and block, registers, static and dynamic shared memory, allocation granularities, resident block and warp limits, exact GPU/CC, and query source. Fill no device limit, occupancy percentage, or limiter. Do not derive an achieved value from a theoretical value.

**Expected evidence:** An input/provenance table, `O_theoretical = W_model / W_max`, `O_achieved = W_observed / W_max`, and a missing-input stop rule.

**Acceptance criteria:** Both ratios use a compatible denominator but different numerator provenance. The worksheet separates residency from utilization, and any missing exact coordinate stops a numerical conclusion.

<details><summary>Hint 1</summary>Ask which launch and resource model produced `W_model` before asking for a percentage.</details>

<details><summary>Hint 2</summary>`W_observed` additionally needs the report's sampling, aggregation, and time scope.</details>

## Exercise 2: Draw the active-to-issued scheduler ladder

**Goal:** Draw a decision ladder for the abstract states `resident -> eligible -> selected/issued`, placing fetch, memory dependency, execution dependency, and barrier waits before eligibility.

**Constraints:** Ready may only explain eligible in ordinary language; do not invent a new profiler state. State that issued does not mean completed, a stall does not mean a whole-kernel bottleneck, and more resident warps provide only potential latency-hiding candidates.

**Expected evidence:** A three-state table, placement of four wait families, a no-eligible issue-gap rule, and a latency-versus-throughput contrast.

**Acceptance criteria:** Active, eligible, and issued are never exchanged. The answer explains that occupancy can help hide but cannot shorten latency, and no stall category determines a repair or speedup.

<details><summary>Hint 1</summary>An active warp can be stalled, so active count is not ready-work count.</details>

<details><summary>Hint 2</summary>The scheduler chooses from the eligible set; an eligible warp not selected remains eligible.</details>

## Exercise 3: Audit a three-percentage conclusion

**Goal:** Repair the unbounded claim “occupancy is high, one stall share is largest, and one throughput percentage is also high, so the kernel is memory-bound and more occupancy will recover the remaining speedup.”

**Constraints:** Require exact names, units, definitions, denominators, scopes, availability, GPU/tool/report, filter, replay, workload, and correctness. Separate residency, issue failure, stall sampling, and resource throughput into four rows. Propose one falsifiable next experiment that changes one mechanism and supplies no numerical result.

**Expected evidence:** A claim-audit table, missing-evidence inventory, permitted narrow statements, competing explanations, and a controlled-experiment contract.

**Acceptance criteria:** The original bottleneck and speedup claim is marked unsupported. High occupancy, the largest stall share, and a throughput percentage never select an optimization alone. No metric spelling or value appears before actual query output.

<details><summary>Hint 1</summary>First establish whether schedulers lack eligible work, then decide whether the stall breakdown deserves investigation.</details>

<details><summary>Hint 2</summary>Distance from a ceiling is not obtainable speedup; the denominators differ.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/occupancy-stalls-throughput/solutions/), complete [Practice Bank PB-R3-004](/en/practice/#pb-r3-004), then continue to [Q10](/en/correctness/roofline-arithmetic-intensity/).
