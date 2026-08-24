---
title: 'O02: Recording Evidence Honestly'
description: Classify CUDA evidence on independent compilation and runtime axes without presenting expectations as observations.
pairId: o02
counterpart: /start/evidence-status/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - outcome
  - prerequisites
  - model
  - statuses
  - decision
  - examples
  - retrieval
  - practice
  - sources
resourceKind: learning-unit
unitId: O02
prerequisites:
  - O01
relatedUnits:
  - O01
exampleIds:
  - O02-CASE-A
  - O02-CASE-B
  - O02-CASE-C
  - O02-CASE-D
  - O02-CASE-E
  - O02-CASE-F
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
sources:
  - title: NVIDIA CUDA Compiler Driver - Supported Phases
    url: 'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases'
    version: 'CUDA Toolkit 13.3.1'
    platform: 'Linux and Windows'
    accessDate: '2026-08-24'
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: o02
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'outcome,prerequisites,model,statuses,decision,examples,retrieval,practice,sources'
  - tag: meta
    attrs:
      name: 'cuda:resource-kind'
      content: learning-unit
  - tag: meta
    attrs:
      name: 'cuda:unit-id'
      content: O02
  - tag: meta
    attrs:
      name: 'cuda:prerequisites'
      content: O01
  - tag: meta
    attrs:
      name: 'cuda:related-units'
      content: O01
  - tag: meta
    attrs:
      name: 'cuda:example-ids'
      content: 'O02-CASE-A,O02-CASE-B,O02-CASE-C,O02-CASE-D,O02-CASE-E,O02-CASE-F'
  - tag: meta
    attrs:
      name: 'cuda:hardware-gate'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:evidence-compilation'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:evidence-runtime'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:expected-observations'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:recorded-observations'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:source-count'
      content: '1'
  - tag: meta
    attrs:
      name: 'cuda:source-versions'
      content: '13.3.1'
---

<a class="locale-pair" data-locale-counterpart href="/start/evidence-status/" lang="zh-CN">阅读中文对应页</a>

Evidence Status does not answer whether a page looks convincing. It records what was actually done, where it was done, and what evidence remains. A precise status prevents a successful build from being rewritten as a successful run and tells the next learner what is still missing.

## What you should be able to do

- Record compilation evidence separately from runtime evidence.
- Apply the five controlled labels without upgrading a claim beyond its support.
- Separate expected observations from recorded observations.
- Classify evidence from its Environment Manifest, logs, criteria, and observer.

## Prerequisite

Complete [O01: Using the Learning Site](/en/start/using-the-learning-site/) first. O01 defines the resources and site boundaries; O02 defines how those resources may describe CUDA evidence.

## Two independent axes

**Compilation evidence and runtime evidence are independent.** The compilation axis asks only whether required source built in a declared Toolkit Lane. The runtime axis asks whether qualifying GPU execution occurred or whether the acceptance criteria require no GPU behavior at all.

One subject can therefore be `Compile-Checked + Pending Hardware Verification`. The first label records an observed build; the second records a runtime observation that is still missing. A community report can likewise coexist with pending maintainer verification until it is reproduced in a Reference Environment.

## The five controlled labels

### Compile-Checked

Use this only after the required source actually builds and the exact Toolkit Lane, C++ dialect, target, command, and observed build environment are recorded. NVIDIA's `nvcc` documentation exposes compilation, PTX/CUBIN generation, and running as different phases; completing a compilation phase does not execute the program.

A skipped, blocked, or failed job grants no status. Web CI, a host-only utility, a browser model, or prose saying that a build should work grants no status either.

### Community-Observed

A third-party report must include a complete Environment Manifest, logs or generated artifacts, stated correctness and observation criteria, and an observation date. It records what a contributor observed without impersonating maintainer reproduction.

### Runtime-Verified

The subject must execute in a declared, maintainer-controlled Reference Environment, carry a complete manifest, and meet its stated correctness and observation criteria. A verification date and supporting evidence are required. A candidate machine, incomplete record, compile result, or community report is insufficient.

### Pending Hardware Verification

Use this when acceptance requires GPU behavior and qualifying runtime evidence does not yet exist. “Expected to work,” invented output, inferred speedup, and compilation evidence cannot replace it.

### Runtime-Not-Applicable

Use this only when acceptance requires compilation or artifact inspection and no GPU behavior. It must not hide a runtime correctness or performance requirement.

## A repeatable decision order

1. Name the subject and its acceptance criteria: source, Lab, build artifact, or browser explainer.
2. Ask whether the required source actually built. If not, do not assign Compile-Checked.
3. Ask whether acceptance requires GPU behavior. Only a no can lead to Runtime-Not-Applicable.
4. If runtime is required, check who ran it, where, whether the manifest is complete, and whether the criteria passed.
5. Store expected and recorded observations in different fields. Keep recorded observations empty without qualifying logs.
6. Scope the conclusion to the exercised GPU, driver, Toolkit, components, workload, and method.

## Six hypothetical cases

This table is for classification practice only. **Example output: expected, not observed.** This page did not execute CUDA or earn a status from any case.

| Case | Known facts | Correct classification | Forbidden inference |
| --- | --- | --- | --- |
| O02-CASE-A | The declared Lane built; GPU correctness is required but no run occurred | `Compile-Checked + Pending Hardware Verification` | Not Runtime-Verified |
| O02-CASE-B | Build passed; a declared Reference Environment ran it with a complete manifest and met every criterion | `Compile-Checked + Runtime-Verified` | Do not generalize beyond tested coordinates |
| O02-CASE-C | Acceptance requires a build and PTX inspection, with no GPU behavior; both build and inspection succeed | `Compile-Checked + Runtime-Not-Applicable` | PTX inspection is not a runtime result |
| O02-CASE-D | A contributor supplied a complete manifest, logs, and date; maintainers have not reproduced it | `Community-Observed + Pending Hardware Verification` | Not maintainer Runtime-Verified |
| O02-CASE-E | A registry outage blocked the compile job | No Compile-Checked; Pending Hardware Verification remains if runtime is required | Blocked is not passed |
| O02-CASE-F | Browser interaction and every web-quality test passed | No CUDA Evidence Status | Browser interaction is not CUDA execution |

## Retrieval check

1. Why can Compile-Checked and Pending Hardware Verification coexist?
2. What must accompany Community-Observed, and why does it not become Runtime-Verified automatically?
3. When is Runtime-Not-Applicable valid?
4. Why must expected output stay separate from recorded observations?

## Continue with practice

- Complete the [O02 Exercises](/en/start/evidence-status/exercises/), then compare your work with the separate [reviewed solutions](/en/start/evidence-status/solutions/).
- Solve PB-R0-001 in the [Practice Bank](/en/practice/) to repair mixed evidence claims.
- Read [O03: Reading an Environment Manifest](/en/start/environment-manifest/) to scope evidence to interpretable environment coordinates.

## Sources and boundaries

The status names and award rules are this project's original teaching contract. The compilation/run boundary was checked against the NVIDIA CUDA Compiler Driver 13.3.1 [supported phases](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases), reopened on **2026-08-24**. Exact coordinates appear in the [Sources and Version Record](/en/sources-and-versions/).

**Fact-check date: 2026-08-24.** This page ran no CUDA, recorded no performance number, and granted no Compile-Checked, Community-Observed, or Runtime-Verified status.
