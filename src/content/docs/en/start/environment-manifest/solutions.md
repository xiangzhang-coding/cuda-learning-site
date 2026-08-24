---
title: 'O03 Reviewed Solutions: Complete Environment and Measurement Records'
description: Separate reviewed solutions, alternatives, and common errors for the three O03 Exercises.
pairId: o03-solutions
counterpart: /start/environment-manifest/solutions/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - common-errors
resourceKind: solution-set
unitId: O03-SOLUTIONS
prerequisites:
  - O03-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: o03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O03-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/start/environment-manifest/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [O03 Exercises](/en/start/environment-manifest/exercises/). Field names may vary, but coordinates must not be merged until their meaning disappears.

## Solution 1: Repair a minimal manifest

A qualifying template includes at least:

- **Hardware:** GPU identity, compute capability, GPU count, memory requirement, and permissions.
- **Software:** driver version, CUDA Toolkit version, relevant component versions, NVCC, host compiler, and operating system/release/architecture.
- **Workload:** project and commit, data type, shape, iterations, and input source.
- **Execution:** exact command, environment variables, selected dialect, and target.
- **Correctness:** method, reference/tolerance/invariant, and explicit criteria.
- **Record:** observation date and locations of logs and artifacts.

Every value remains `<collect with: method>` until someone performs the query. The original `PASS` is only unreviewed text; it cannot prove correctness alone.

## Solution 2: Repair a support boundary

First correction: **native Linux is this site's only Supported Environment.** NVIDIA product support for WSL does not expand this site's setup, troubleshooting, Lab, or validation responsibility. WSL remains an unsupported comparison.

Second correction: **8 GB alone cannot select a tier.** Baseline requires compute capability 7.5 or newer and problems sized for 8 GB. Modern requires compute capability 8.0 or newer and at least 8 GB. GPU count, features, and permissions can still add activity gates.

## Solution 3: Extend a performance manifest

Append these fields to a complete correctness manifest:

1. baseline and hypothesis;
2. identical workload, shape, and correctness method on both sides;
3. clocks, power policy, temperature, or other required stabilization;
4. warm-up count and exclusion policy;
5. synchronization position and rationale;
6. timer or profiler name and exact version;
7. sample count, statistic, and outlier policy;
8. `result: <pending observation>`;
9. interpretation boundaries that forbid extrapolation to other GPUs, drivers, Toolkits, components, or workloads.

End-to-end and kernel timing are both valid alternatives, but they answer different questions and must not be merged into one latency figure.

## Common errors

- Using the Toolkit version in place of driver, NVCC, or library versions.
- Naming a GPU product without compute capability or actual GPU count.
- Treating an NVIDIA support table as this site's Supported Environment.
- Timing asynchronous GPU work with a host timer without recording synchronization.
- Filling an empty result with “expected 2x.”

Reviewed: **2026-08-24**. These solutions provide templates and record no real environment or measurement.
