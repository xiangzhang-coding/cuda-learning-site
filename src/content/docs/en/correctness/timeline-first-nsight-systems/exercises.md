---
title: 'Q07 Exercises: Build a Reviewable Timeline-First Investigation'
description: Define a versioned Nsight Systems collection, interpret symbolic application-timeline evidence, and prepare one exact-kernel handoff without inventing profiler observations.
pairId: q07-exercises
counterpart: /correctness/timeline-first-nsight-systems/exercises/
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
unitId: Q07-EXERCISES
prerequisites:
  - Q07
relatedUnits:
  - Q07
  - EX07
  - LAB06
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
    attrs: { name: 'cuda:pair-id', content: q07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q07,EX07,LAB06,LAB08,VIS14' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/timeline-first-nsight-systems/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q07: Read the Application Timeline First with Nsight Systems](/en/correctness/timeline-first-nsight-systems/) first. These are static design and review tasks. No GPU or profiler is required, every observation slot starts empty, and no timeline interval, duration, overlap, bottleneck, or speedup may be invented.

## Instructions

Answer from the stated symbolic record only. Separate observation from interpretation, name missing evidence, and keep the representative-workload, correctness, version, collection-method, and report-custody gates visible. Work before opening the [reviewed solutions](/en/correctness/timeline-first-nsight-systems/solutions/).

## Exercise 1: Design a versioned collection and custody contract

**Goal:** Replace “run Nsight Systems on the app and inspect the report” with a pre-observation collection record for one representative application interval.

**Constraints:** Include the exact workload and input, representativeness rationale, Q05 correctness verdict, warm-up/capture/completion policy, Environment Manifest, trace domains, `nsys --version` and help capture, symbolic `nsys profile` command, CUPTI and dropped-record boundary, `.nsys-rep` name, logs, exit status, hashes, and observation owner/date. Treat the selected bundled Nsight Systems component coordinates `2022.4.2.1`, `2025.1.3.140`, and `2026.1.3.425` as references, never substitutes for observed CLI output or the separate Toolkit Lane. Supply no result.

**Expected evidence:** A completed method template with observation fields still empty, a version-gate decision, an ordered artifact inventory, and a rule that rejects timeline conclusions when the manifest or method is missing.

**Acceptance criteria:** The workload is representative and correct before collection. Every option is checked against the observed CLI. The original `.nsys-rep` remains primary and immutable. Stats and exports are identified as versioned derivations, and CUPTI instrumentation is not described as an unmodified run.

<details><summary>Hint 1</summary>Start by writing the claims the record must refuse when version, correctness, method, or custody is unknown.</details>

<details><summary>Hint 2</summary>Your minimum bundle needs the command and both programs' logs, the report and hash, the manifest and correctness verdict, plus a derivation ledger for each stats or export artifact.</details>

## Exercise 2: Interpret gaps, launches, copies, and overlap conservatively

**Goal:** Review this symbolic trace description: phase `steady` contains a visible CPU interval before three short launch API calls; kernel `K0` starts later in stream `S0`; one HtoD copy in `S1` intersects part of `K0`; event `ready` connects the copy pipeline; scheduling detail and profiler diagnostics are absent.

**Constraints:** Separate visible observations from hypotheses. Define CPU gap, API duration, API-exit-to-device-start gap, kernel duration, copy interval, stream identity, dependency, and observed overlap. List evidence needed to test host blocking, launch overhead, queueing, dependency, and copy-overlap causes. Do not infer pinned memory, engine use, causal speedup, or behavior outside the captured interval.

**Expected evidence:** An observation/hypothesis table, interval endpoint ledger, missing-trace and dropped-record checks, and a bounded statement about the HtoD/`K0` intersection.

**Acceptance criteria:** Blank space is not itself a diagnosis. “Launch overhead” is split into a named interval. The overlap statement is limited to this captured phase and streams. The `ready` event is treated as a dependency to inspect, and every causal claim remains pending additional evidence.

<details><summary>Hint 1</summary>Describe what each row and timestamp shows before assigning any reason to the spaces between them.</details>

<details><summary>Hint 2</summary>The strongest supported overlap sentence names phase `steady`, HtoD in `S1`, `K0` in `S0`, their intersecting timestamps, and the report identity; it says nothing yet about cause or speedup.</details>

## Exercise 3: Prepare a Systems-to-Compute handoff

**Goal:** Turn a representative Systems report containing repeated `update(float*)` launches into a handoff record that identifies one exact instance and one kernel-level question.

**Constraints:** Bind the report hash and application phase to process, CUDA context, stream, kernel name, launch occurrence or correlation identity, and observed start interval. State one question, a reproducible selection rule for the separate Nsight Compute execution, and only the metric sections needed by that question. Preserve the fact that Nsight Compute may replay work and does not profile the literal Systems launch.

**Expected evidence:** A selected-instance identity card, one question, a pass/fail handoff gate, a minimal proposed section or metric family, and a custody link from the new run back to the Systems report.

**Acceptance criteria:** The answer cannot select “all `update` kernels,” dump metrics, or hand off while the question remains application-wide. One exact instance and one specific question are fixed first. The new collection is labeled a separate instrumented execution rather than a continuation of the `.nsys-rep`.

<details><summary>Hint 1</summary>A kernel name alone is not an instance identity when the same name appears repeatedly.</details>

<details><summary>Hint 2</summary>Choose a question narrow enough that you can justify excluding most metric sections before running Nsight Compute.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/timeline-first-nsight-systems/solutions/), classify another record in [Practice Bank PB-R3-002](/en/practice/#pb-r3-002), and carry the same gates into [LAB06](/en/labs/build-overlapped-pipeline/), [LAB08](/en/labs/profile-full-application-before-kernel/), and [VIS14](/en/visuals/nsight-systems-versus-nsight-compute/).
