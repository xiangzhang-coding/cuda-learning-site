---
title: 'Q05 Exercises: Design reviewable asynchronous timing'
description: Repair asynchronous timing, preregister a sample and statistics protocol, and complete a performance Environment Manifest in three static tasks.
pairId: q05-exercises
counterpart: /correctness/timing-asynchronous-gpu-work/exercises/
factCheckDate: '2026-08-28'
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
unitId: Q05-EXERCISES
prerequisites:
  - Q05
relatedUnits:
  - Q05
  - LAB04
  - LAB05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q05-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q05 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q05,LAB04,LAB05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/timing-asynchronous-gpu-work/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q05: Time Asynchronous GPU Work Honestly](/en/correctness/timing-asynchronous-gpu-work/) first. Every task uses symbolic values and empty observation fields. No GPU is required, and no measurement may be invented.

## Instructions

Write the correctness gate first, followed by warm-up exclusion, timing endpoints, completion boundary, raw-sample storage, statistics, and manifest. Mark every unknown field unknown. Work before opening the [reviewed solutions](/en/correctness/timing-asynchronous-gpu-work/solutions/).

## Exercise 1: Repair a program that times enqueue only

**Goal:** Audit this conceptual sequence and design both a kernel-only CUDA-event protocol and an end-to-end host-wall-clock protocol: `host_start -> launch candidate -> host_stop -> print faster`. The original sequence has no correctness comparison, warm-up, or synchronization.

**Constraints:** Both protocols first make baseline and candidate pass Q01 criteria on the same input. Warm-up is separate and excluded. The event path uses timing-enabled `start` and `stop`, `cudaEventRecord`, `cudaEventSynchronize(stop)`, and `cudaEventElapsedTime`. The host path declares start/end synchronization and included work. Provide no numerical time or speedup.

**Expected evidence:** A bad-edge diagnosis, two ordered timing ledgers, API and error-check checklist, endpoint/included-work table, and an explicit no-speedup-if-wrong rule.

**Acceptance criteria:** The original sequence is labeled host enqueue latency rather than completed GPU duration. The event ledger waits for stop. The host ledger completes declared work before the end timestamp. The metrics keep different names, and a correctness failure blocks statistics and speedup.

<details><summary>Hint 1</summary>Before each end timestamp, ask which operation proves that the measured work completed.</details>

<details><summary>Hint 2</summary>Event endpoints define a device interval; host timestamps can enclose more host work, so their labels cannot be exchanged.</details>

## Exercise 2: Preregister repetition and statistics

**Goal:** Write a pre-observation protocol for a baseline/candidate comparison covering lazy loading, warm-up, symbolic repetition count `N`, run order, raw-sample custody, median, spread, and outlier handling.

**Constraints:** Fix `N`, warm-up count, primary median, chosen spread, and run order before sampling. Warm-up never enters raw samples. Preserve acquisition order. Do not silently delete outliers or switch statistics after seeing data. Record loading mode plus preload and library setup. Fill in no sample value.

**Expected evidence:** A preregistration form, baseline/candidate sample-table schema, raw-artifact naming rule, predeclared exclusion policy, and a decision tree that permits or rejects a speedup claim.

**Acceptance criteria:** The protocol separates warm-up from measurement. Every raw sample traces to variant, order, endpoints, and completion status. Median and spread are predeclared. Flagged samples remain present. A ratio is permitted only after both variants are correct and their protocols are comparable.

<details><summary>Hint 1</summary>Design the empty table and decision rules before imagining any observations.</details>

<details><summary>Hint 2</summary>An outlier flag is metadata, not permission to delete the raw value.</details>

## Exercise 3: Expand one benchmark note into a manifest

**Goal:** Replace the incomplete record “some GPU, some CUDA, candidate faster” with a complete performance Environment Manifest template that is still waiting for observations, then decide the current speedup claim's Evidence Status.

**Constraints:** Cover at least GPU identity, compute capability, GPU count, driver, CUDA Toolkit, component versions, NVCC, host compiler, operating system, source/build/flags, exact command, workload/input/memory, permissions, correctness method and criteria, clock-power/thermal/load, warm-up, timing endpoints, synchronization, repetitions/raw samples/statistics, and observation date/custody. Empty fields may say only unknown. Guess or manufacture no number.

**Expected evidence:** A complete field table, missing-field inventory, correctness and timing acceptance checklist, and a supported/unsupported verdict with reasons for the original speedup sentence.

**Acceptance criteria:** Hardware, software, build, input, and measurement coordinates remain separate. Timer endpoints and host/device metric are named. The correctness verdict gates speedup. Without observations, raw samples, and a complete manifest, the original claim is unsupported.

<details><summary>Hint 1</summary>“CUDA version” cannot replace separate driver, Toolkit, NVCC, runtime, library, and profiler versions.</details>

<details><summary>Hint 2</summary>A manifest template identifies missing evidence; it is not itself an observation.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/timing-asynchronous-gpu-work/solutions/) and then repair another one-shot timing claim in [Practice Bank PB-R1-024](/en/practice/#pb-r1-024).
