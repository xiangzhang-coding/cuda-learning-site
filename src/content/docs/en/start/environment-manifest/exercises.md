---
title: 'O03 Exercises: Complete Environment and Measurement Records'
description: Repair an incomplete manifest, a support boundary, and a performance measurement plan.
pairId: o03-exercises
counterpart: /start/environment-manifest/exercises/
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
unitId: O03-EXERCISES
prerequisites:
  - O03
relatedUnits:
  - O03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/environment-manifest/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [O03: Reading an Environment Manifest](/en/start/environment-manifest/) first. These Exercises use hypothetical records and require no GPU or unpublished later code and Labs.

## How to answer

Produce a reviewable artifact before opening a hint. Full answers live on the separate [reviewed-solutions page](/en/start/environment-manifest/solutions/).

## Exercise 1: Repair a minimal manifest

**Goal:** Turn “RTX 4090, CUDA 13.3.1, vector add PASS” into a complete correctness-manifest template.

**Constraints:** Invent no value. Mark unknown coordinates for collection and name the collection method. GPU, compute capability, driver, Toolkit, and components must have separate fields.

**Expected evidence:** A complete field template plus a gap list.

**Acceptance criteria:** Cover every O03 core coordinate; distinguish NVCC and host compiler; include exact command, correctness method and criteria, and observation date; make no performance inference.

<details><summary>Hint 1</summary>Group fields under hardware, software, workload, command, correctness, and date.</details>

<details><summary>Hint 2</summary>`nvidia-smi` may help with GPU, driver, and compute capability. It cannot supply Toolkit, NVCC, host compiler, command, or correctness method.</details>

## Exercise 2: Repair a support boundary

**Goal:** Review this sentence: “NVIDIA supports WSL, so this site supports WSL; every 8 GB GPU belongs to the complete tier.”

**Constraints:** Use only O03's Supported Environment and two GPU Capability Tier definitions.

**Expected evidence:** Two corrections with a reason for each.

**Acceptance criteria:** State that native Linux is the only Supported Environment; separate upstream product support from site responsibility; define tiers with compute capability, memory, count, features, and permissions.

<details><summary>Hint 1</summary>“May run” and “the site accepts support responsibility” are different claims.</details>

<details><summary>Hint 2</summary>Baseline starts at 7.5 with problems fitting 8 GB; Modern starts at 8.0 with at least 8 GB.</details>

## Exercise 3: Extend a performance manifest

**Goal:** Add fields to a complete correctness manifest so one latency comparison can be interpreted.

**Constraints:** Generate no timing or speedup number. Do not treat one sample as a statistic.

**Expected evidence:** A measurement appendix with baseline, hypothesis, clocks or power, warm-up, synchronization, timer or profiler version, statistics and sample method, result, and interpretation boundaries.

**Acceptance criteria:** Retain correctness criteria; give the measurement tool an exact version; identify synchronization; leave the result empty and marked pending observation.

<details><summary>Hint 1</summary>First verify that both sides use the same workload, shape, and correctness method.</details>

<details><summary>Hint 2</summary>GPU work is commonly asynchronous. Without explicit synchronization, the timed interval may omit execution.</details>

## Next step

Compare with the [reviewed solutions](/en/start/environment-manifest/solutions/), then repair a combined manifest and support error in [Practice Bank PB-R0-002](/en/practice/).
