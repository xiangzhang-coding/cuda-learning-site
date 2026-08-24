---
title: 'O02 Exercises: Classify and Repair Evidence Claims'
description: Practise evidence classification with constraints, layered hints, and acceptance criteria.
pairId: o02-exercises
counterpart: /start/evidence-status/exercises/
factCheckDate: '2026-08-24'
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
unitId: O02-EXERCISES
prerequisites:
  - O02
relatedUnits:
  - O02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O02 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/evidence-status/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [O02: Recording Evidence Honestly](/en/start/evidence-status/) first. These Exercises require no GPU or unpublished later example or Lab, and they grant no CUDA Evidence Status.

## How to answer

Write your classification and reasoning before opening the hints. Full solutions do not appear here; compare your work with the [separate reviewed solutions](/en/start/evidence-status/solutions/) afterwards.

## Exercise 1: Classify a mixed record

**Goal:** Fill the compilation axis, runtime axis, and missing evidence for four records.

**Constraints:** Use only O02's five controlled labels. Do not convert blocked work, web tests, or “expected” behavior into observed evidence.

**Prompt:**

1. An exact-Lane build log succeeds. GPU correctness is required, but there is no run log.
2. A contributor supplies a complete manifest, output log, criteria, and date. Maintainers lack the machine.
3. The build job never starts because the image registry times out.
4. Acceptance requires PTX generation and symbol inspection but no GPU behavior. The build succeeds.

**Expected evidence:** A four-row table with compilation status, runtime status, basis, and gap.

**Acceptance criteria:** Every row uses a legal combination; row 2 keeps maintainer verification pending; row 3 has no Compile-Checked; row 4 makes no GPU-execution claim.

<details><summary>Hint 1</summary>Ask whether a build actually happened, then whether acceptance requires GPU behavior.</details>

<details><summary>Hint 2</summary>Community observation and pending maintainer verification can coexist. Runtime-Not-Applicable depends on the acceptance criteria.</details>

## Exercise 2: Separate expectation from record

**Goal:** Rewrite this sentence without mixing plans, output, and inferred performance: “The program should print PASS, so it is verified; the new GPU is probably twice as fast.”

**Constraints:** The only facts are that no build log, run log, Environment Manifest, baseline, or timing method exists.

**Expected evidence:** Four fields: current status, expected observation, recorded observation, and next evidence.

**Acceptance criteria:** Recorded observation is empty; no speed number remains; no Compile-Checked or Runtime-Verified appears; next steps cover both build and runtime evidence.

<details><summary>Hint 1</summary>“Should” belongs only in expected observations.</details>

<details><summary>Hint 2</summary>A performance conclusion also needs a baseline, synchronization, timer, warm-up, and statistics.</details>

## Exercise 3: Review a status upgrade

**Goal:** Review a request to upgrade Community-Observed to Runtime-Verified.

**Constraints:** The report has a complete manifest and logs and meets correctness criteria, but the observer is not a maintainer and the environment is not a declared Reference Environment.

**Expected evidence:** An accept/reject decision, two reasons, and executable upgrade conditions.

**Acceptance criteria:** Preserve the value of the community report without calling it maintainer reproduction. Require control, declaration, complete manifest, criteria, and date.

<details><summary>Hint 1</summary>Evidence quality and evidence ownership are separate questions.</details>

<details><summary>Hint 2</summary>Keep Community-Observed and Pending Hardware Verification until maintainer reproduction occurs.</details>

## Next step

Compare with the [reviewed solutions](/en/start/evidence-status/solutions/), note your recurring error, then transfer the model in [Practice Bank PB-R0-001](/en/practice/).
