---
title: 'L01 Exercises: Decision Packets Before Custom Kernels'
description: Compare four implementation levels, design a fair evidence plan, and account for portability and lifetime ownership.
pairId: l01-exercises
counterpart: /libraries/library-primitive-dsl-custom-kernel/exercises/
factCheckDate: '2026-09-04'
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
unitId: L01-EXERCISES
prerequisites:
  - L01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l01-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/library-primitive-dsl-custom-kernel/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L01 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/library-primitive-dsl-custom-kernel/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [L01](/en/libraries/library-primitive-dsl-custom-kernel/). These Exercises produce decision and measurement records. They compile or execute no CUDA, CCCL, DSL, production library, or custom kernel.

## Instructions

Freeze semantics before comparing options. Mark every unavailable fact `unrecorded`, distinguish owner facts from site evidence, and work independently before opening the [reviewed solutions](/en/libraries/library-primitive-dsl-custom-kernel/solutions/).

## Exercise 1: Select a provisional baseline

**Goal:** Choose a provisional implementation level for FP32 row reduction followed by exclusive scan on Toolkit 12.9.2 and 13.3.1 from four candidates: a domain library, CCCL reusable primitives, a graph DSL, and custom kernels.

**Constraints:** The operation has CPU references and tolerances but no measured performance. CCCL v3.4.2 is independently pinned; 11.8 is outside that pin. Compare correctness fit, maintenance, portability, performance evidence, and ownership cost. Do not call an unmeasured candidate fastest.

**Expected evidence:** A four-row eligibility table, one provisional choice, rejected or deferred reasons for the other three choices, an owner, and a revisit trigger.

**Acceptance criteria:** Reusable primitives are a defensible provisional baseline because they express both operations; the conclusion is explicitly not a speed result; custom code requires an unmet contract or a correctness-qualified material gap; 11.8 remains a separate decision.

<details><summary>Hint 1</summary>Separate “can express the required semantics” from “has measured the required workload.”</details>

<details><summary>Hint 2</summary>A provisional baseline minimizes unsupported assumptions; it does not permanently exclude the other levels.</details>

## Exercise 2: Design a fair library-versus-custom measurement

**Goal:** Write a measurement protocol that could later compare the selected primitive composition with custom kernels.

**Constraints:** Hold operation semantics, inputs, shape distribution, FP32 tolerance, layout, warmup, stream, completion boundary, and reported statistic constant. State whether setup, allocation, temporary storage, launch, and transfer costs are inside or outside each measured boundary. Require an Environment Manifest and correctness gate before timing.

**Expected evidence:** A controlled-variable table, correctness gate, lifecycle boundary, warmup/repetition/statistic rule, invalid-run rule, and no preselected winner.

**Acceptance criteria:** Both candidates use identical inputs and acceptance criteria; asynchronous completion is inside the declared measurement boundary; setup costs are treated symmetrically; failed correctness invalidates performance comparison; output is a plan, not Runtime-Verified evidence.

<details><summary>Hint 1</summary>If one candidate includes temporary-storage setup and the other excludes allocation, the intervals answer different questions.</details>

<details><summary>Hint 2</summary>Start with the Q06 sequence: assess a correctness-qualified baseline, change one decision, measure, and retain rollback.</details>

## Exercise 3: Audit lifetime ownership and portability

**Goal:** Compare the three-year ownership ledger for a DSL-generated path and a custom architecture-dispatched kernel.

**Constraints:** Cover Toolkit/component/compiler/dialect/OS rows, generated artifacts, cache invalidation, fallback, correctness regressions, performance regressions, incident response, handoff, and removal. Unknown rows remain unsupported. Do not treat generated code as ownerless.

**Expected evidence:** Two ownership ledgers, a support matrix, named maintainers, upgrade and rollback procedures, and two revisit triggers per option.

**Acceptance criteria:** The DSL ledger owns specification, generator pin, artifact acceptance, cache, and fallback; the custom ledger owns source, dispatch, build/test matrix, debugging, and tuning; both include exit costs and reject “works on CUDA” as a version coordinate.

<details><summary>Hint 1</summary>Ask who responds after a compiler upgrade changes generated or custom behavior.</details>

<details><summary>Hint 2</summary>Portability is a set of tested rows, not a property inferred from one successful environment.</details>

## Next

Open the [reviewed solutions](/en/libraries/library-primitive-dsl-custom-kernel/solutions/), then complete [PB-R4-001](/en/practice/#pb-r4-001) and continue to [L02](/en/libraries/thrust-algorithm-vocabulary/).
