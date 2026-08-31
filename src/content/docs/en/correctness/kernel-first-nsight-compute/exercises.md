---
title: 'Q08 Exercises: Design a bounded selected-kernel profile'
description: Build a Systems-to-Compute handoff, select minimal queried evidence, and review metric interpretation and .ncu-rep custody in three static tasks.
pairId: q08-exercises
counterpart: /correctness/kernel-first-nsight-compute/exercises/
factCheckDate: '2026-08-31'
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
unitId: Q08-EXERCISES
prerequisites:
  - Q08
relatedUnits:
  - Q08
  - Q06
  - EX07
  - LAB08
  - VIS14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q08-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/kernel-first-nsight-compute/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q08 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q08,Q06,EX07,LAB08,VIS14' }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/kernel-first-nsight-compute/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q08: Ask One Selected Kernel Question with Nsight Compute](/en/correctness/kernel-first-nsight-compute/) first. These are static evidence-design tasks. They require no GPU and create no profiler observation.

## Instructions

Work from the selected kernel and question toward the minimum sufficient evidence. Leave every observation slot empty or mark it unknown. Do not open the [reviewed solutions](/en/correctness/kernel-first-nsight-compute/solutions/) until your decision trail, replay boundary, and custody fields are complete.

## Exercise 1: Write the Systems-to-Compute handoff

**Goal:** Turn a representative Nsight Systems selection into one reviewable Nsight Compute target. The supplied selection identifies process `app`, demangled kernel `transform_kernel`, one stream, the fourth matching launch under workload `W`, and a global-memory symptom. Write one specific predeclared question and the filter ledger for the corresponding Compute run.

**Constraints:** Preserve the source `.nsys-rep` identity, process, stream, launch occurrence, workload, input, and correctness verdict. Declare kernel-name basis, exact or regex match, launch skip/count, target process, and an equivalence rule. State that Systems and Compute are separate executions and that the filter seeks a corresponding occurrence, not the same physical instance. Choose no metric yet.

**Expected evidence:** A selected-instance table, one falsifiable kernel question, a symbolic filter, equivalence and mismatch fields, and support/reject/return-to-Systems exit rules.

**Acceptance criteria:** Exactly one kernel occurrence and one question are selected. `--launch-count 1` is not treated as sufficient identity by itself. The question can determine later section or metric choice, and the handoff never claims to enrich the old timeline event in place.

<details><summary>Hint 1</summary>Keep “fourth matching launch” as both a source coordinate and a filter problem; matching a name alone can still select the wrong occurrence.</details>

<details><summary>Hint 2</summary>Write the decision the answer will change before writing any counter name.</details>

## Exercise 2: Query and minimize the collection

**Goal:** Design a pre-collection gate for the Exercise 1 question using exact tool/GPU coordinates, performance-counter permission, section and metric availability, and one minimal collection plan.

**Constraints:** Include retained outputs for `ncu --version`, `ncu --list-sections`, and `ncu --query-metrics`; GPU identity and compute capability; driver and Toolkit; permission result; exact filter; and replay mode. Choose either one queried section or a short queried metric list, not a metric dump. Record every chosen name, definition, unit, and scope. Invent no availability result, pass count, or value.

**Expected evidence:** A gate table with pass/stop decisions, empty query-result slots, one symbolic `ncu` command, a minimal evidence-to-question mapping, and a replay/perturbation disclosure.

**Acceptance criteria:** Permission denial stops collection rather than becoming zero. Selection comes from actual query output on the exact GPU/tool. Every requested item maps to the declared question. Replay can involve multiple passes, perturbation, serialization, or a different execution, and the command exports a retained `.ncu-rep`.

<details><summary>Hint 1</summary>A section is convenient only when its rules answer the question; convenience is not permission to collect every section.</details>

<details><summary>Hint 2</summary>Minimizing requested evidence can reduce replay surface, but it cannot establish an unperturbed run.</details>

## Exercise 3: Review interpretation and report custody

**Goal:** Audit the claim “the memory metric is high, so coalescing and shared memory are both bad; this `.ncu-rep` proves the fix will be faster.” Replace it with a bounded interpretation template and a complete report-custody record.

**Constraints:** Separate M02's expected requested-byte/segment reasoning from observed global-memory evidence and M03's expected staging/reuse reasoning from observed shared-memory evidence. Require exact metric names, definitions, units, denominators, scopes, filters, permission, replay, version, workload, and correctness. Record source `.nsys-rep` and `.ncu-rep` paths or hashes, commands, stdout/stderr, observer, and date. Supply no numerical value or speedup.

**Expected evidence:** A claim-audit table, two mechanism-specific interpretation rows, a missing-evidence inventory, a `.ncu-rep` custody ledger, and a next-action verdict.

**Acceptance criteria:** “High” is rejected without definition, unit, denominator, and comparison. Coalescing and shared-memory claims remain separate. Correlation is not labeled causation or speedup. The report is disclosed as a separate profiled execution and is reviewable without overwriting its original artifact.

<details><summary>Hint 1</summary>Ask what one value rules out; if it rules out nothing, it cannot yet choose a repair.</details>

<details><summary>Hint 2</summary>A report filename is not custody. Add the command, filter, versions, replay, permissions, hash, and relationship to the Systems selection.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/kernel-first-nsight-compute/solutions/), then repair the profiler claim in [Practice Bank PB-R3-003](/en/practice/#pb-r3-003) before entering [LAB08](/en/labs/profile-full-application-before-kernel/).
