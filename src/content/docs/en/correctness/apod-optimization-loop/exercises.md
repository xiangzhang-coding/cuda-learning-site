---
title: 'Q06 Exercises: Design one falsifiable APOD pass'
description: Constrain a recorded baseline, controlled hypothesis and evidence comparison, and deployment regression gate through three static tasks.
pairId: q06-exercises
counterpart: /correctness/apod-optimization-loop/exercises/
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
unitId: Q06-EXERCISES
prerequisites:
  - Q06
relatedUnits:
  - Q06
  - Q07
  - Q08
  - LAB08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q06 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q06,Q07,Q08,LAB08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/apod-optimization-loop/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q06: Use APOD as an Optimization Loop](/en/correctness/apod-optimization-loop/) first. All three tasks produce only review templates, symbolic ledgers, and decision rules. Execute no code, collect no observation, and invent no baseline, profile, time, or speedup.

## Instructions

Work independently before opening the [reviewed solutions](/en/correctness/apod-optimization-loop/solutions/). Put `pending observation` or `unknown` in every empty evidence field; never fill it with a prediction. Every proposal inherits the Q05 correctness and measurement contract.

## Exercise 1: Qualify the Assess baseline

**Goal:** Replace “run one small sample and optimize the slowest function” with a pre-Assess baseline qualification packet that defines a realistic workload, user-facing metric, correctness gate, Q05 measurement protocol, Environment Manifest, and hotspot-selection artifact.

**Constraints:** Distinguish a baseline plan from a correctness-qualified recorded baseline. Explain workload representativeness and exclusions. Name metric endpoints and the completion boundary. Require an actual correctness verdict, raw repeated samples, a predeclared statistic and spread, and artifact custody. Fill no observation or numerical claim.

**Expected evidence:** An empty baseline record, workload rationale, correctness and performance gate checklist, missing-evidence inventory, and a decision rule that permits Parallelize only after real artifacts are complete.

**Acceptance criteria:** The packet does not treat a toy input as a realistic workload. A baseline without a verdict, raw artifact, or manifest remains unqualified. The hotspot has a traceable profile pointer and selection rule. Metric scope and deployment constraints are explicit.

<details><summary>Hint 1</summary>Ask whether the baseline was actually observed and recorded before asking whether it supports a comparison.</details>

<details><summary>Hint 2</summary>A profiler ranking locates a candidate; it neither explains the cause nor approves a rewrite.</details>

## Exercise 2: Write one falsifiable controlled change

**Goal:** Starting from a selected hotspot and mechanism question, write an explicit falsifiable hypothesis for one Parallelize or Optimize pass and design a before/after protocol for one controlled change.

**Constraints:** The hypothesis names the change, predicted direction, causal mechanism, and falsifier. Permit only one independent variable. List held-constant workload, input, metric, endpoints, build and sampling policy, and environment coordinates. The candidate must pass correctness again. Fill in no result.

**Expected evidence:** One hypothesis-ledger row, controlled-change scope, confounder table, before/after artifact schema, and a predeclared keep, revert, or inconclusive decision rule.

**Acceptance criteria:** Correctness failure, missing mechanism evidence, or failure to meet the decision rule can falsify the statement. Supporting edits hide no second optimization. Baseline and candidate evidence are comparable. Inconclusive is never called an improvement.

<details><summary>Hint 1</summary>“Make the kernel faster” lacks a mechanism and falsifier, so it is not a complete hypothesis.</details>

<details><summary>Hint 2</summary>If endpoints change with the code, you changed the metric as well as the implementation.</details>

## Exercise 3: Build the Deploy and regression gate

**Goal:** Write a deployment decision matrix for a candidate that has no observations yet, allowing it into a reversible rollout only after comparable before/after evidence passes and allowing later changes to trigger another Assess pass.

**Constraints:** Separate correctness, performance, regression, and operational gates. Include a representative workload set, non-target paths, interface and resource compatibility, artifact links, observability, fallback, rollback owner, and post-deployment trigger. Status may be only reject, rework, inconclusive, or gate-passed; never prefill a pass.

**Expected evidence:** A symbolic gate matrix, required-artifact inventory, release and rollback checklist, and a handoff rule that sends an application symptom to Q07, a selected-kernel question to Q08, and the full decision trail to LAB08.

**Acceptance criteria:** Correctness failure rejects the candidate. Incomparable evidence remains inconclusive. A failed regression or operational gate blocks deployment. Rollout is allowed only when actual gate records are complete, and a post-deployment change re-enters Assess.

<details><summary>Hint 1</summary>Deploy reviews a release contract, not whether one isolated sample looks best.</details>

<details><summary>Hint 2</summary>Choose the rollback owner and evidence pointer before rollout, not after a failure.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/apod-optimization-loop/solutions/), then audit another APOD proposal in [Practice Bank PB-R3-001](/en/practice/#pb-r3-001).
