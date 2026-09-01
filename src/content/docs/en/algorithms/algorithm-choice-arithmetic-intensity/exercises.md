---
title: 'A14 Exercises: From Traffic Ledger to Falsifiable Optimization'
description: Account for four algorithm families, compare elementwise fusion, and turn an arithmetic-intensity candidate into a rejectable experiment in three static tasks.
pairId: a14-exercises
counterpart: /algorithms/algorithm-choice-arithmetic-intensity/exercises/
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
unitId: A14-EXERCISES
prerequisites:
  - A14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a14-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/algorithm-choice-arithmetic-intensity/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A14-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A14 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/algorithm-choice-arithmetic-intensity/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [A14](/en/algorithms/algorithm-choice-arithmetic-intensity/) first. Counts in these tasks are static estimates, not profiler values or runtime evidence.

## Instructions

Give every ledger an operation convention and byte boundary before separating compulsory and implementation traffic. Every optimization answer needs a correctness gate, primary mechanism, support rule, and rejection rule. Inspect the [reviewed solutions](/en/algorithms/algorithm-choice-arithmetic-intensity/solutions/) afterward.

## Exercise 1: Complete a four-algorithm accounting matrix

**Goal:** Fill `W`, compulsory bytes, and compulsory intensity for FP32 vector addition, sum reduction, out-of-place transpose, and `beta=0` GEMM. GEMM uses FMA=2 FLOP; transpose excludes index arithmetic.

**Constraints:** Use symbolic N/M/K. Vector addition reads two inputs and writes one output; reduction writes one scalar; transpose reads and writes MN elements; GEMM reads each unique A/B element once and writes C once. Add one implementation-traffic inflation cause per row.

**Expected evidence:** A four-row formula table, unit checks, boundary label, assumption column, and implementation caveat.

**Acceptance criteria:** The table contains `N / 12N`, `(N-1) / (4N+4)`, `0 / 8MN`, and `2MNK / 4(MK+KN+MN)`. No cache or transaction estimate becomes compulsory fact.

<details><summary>Hint 1</summary>Count logical elements first, then multiply by four bytes per FP32 element.</details>

<details><summary>Hint 2</summary>The arithmetic-intensity numerator and denominator must cover the same workload.</details>

## Exercise 2: Compare a materialized and fused pipeline

**Goal:** For `tmp=a+b; z=g(tmp)` with 5 FLOP per element in `g`, derive unfused/fused work, logical DRAM traffic, and intensity, then state a fusion hypothesis.

**Constraints:** Both versions perform `6N FLOP`; unfused uses `20N byte`, fused uses `12N byte`. List cache reuse, register pressure, occupancy, and launch overhead as competing explanations. Do not claim fusion is faster.

**Expected evidence:** A baseline/candidate table, `0.3` and `0.5 FLOP/byte` calculations, predicted traffic ratio, and a correctness/timing/traffic experiment packet.

**Acceptance criteria:** Mechanism and performance claims have separate rejection rules. The experiment changes only fusion, and actual traffic and time slots remain empty.

<details><summary>Hint 1</summary>The unfused intermediate is written once and read once, adding `8N byte`.</details>

<details><summary>Hint 2</summary>Higher intensity is a prediction; lower elapsed time still needs measurement.</details>

## Exercise 3: Select the first experiment from three candidates

**Goal:** Compare reduction-stage fusion, tiled transpose, and a larger GEMM tile for one workload packet. Give each a predicted traffic boundary, added cost, and falsifier, then choose the first experiment.

**Constraints:** Supply no hardware ceiling, timing, or metric value. Selection uses workload relevance, estimated byte reduction, correctness risk, resource or synchronization cost, and observability. Roofline region cannot automatically choose the winner. Select one primary mechanism only.

**Expected evidence:** A three-candidate decision table, ranking rationale, one-experiment protocol, method for defining support/rejection thresholds, and rollback condition.

**Acceptance criteria:** The chosen candidate has an explicit traffic formula and same-workload comparison. Deferred candidates have reasons. Results can reject the optimization, and no modeled region is renamed an observed bottleneck.

<details><summary>Hint 1</summary>Prefer a mechanism that changes the predicted denominator and can be measured at that exact boundary.</details>

<details><summary>Hint 2</summary>If a candidate changes precision, layout, and algorithm together, attribution is impossible; narrow the experiment.</details>

## Next

Inspect the separate [reviewed solutions](/en/algorithms/algorithm-choice-arithmetic-intensity/solutions/), complete [Practice Bank PB-R3-006](/en/practice/#pb-r3-006), then use [Q10](/en/correctness/roofline-arithmetic-intensity/) to audit a matched roof.
