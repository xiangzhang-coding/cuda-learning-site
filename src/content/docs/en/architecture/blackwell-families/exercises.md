---
title: 'H05 Exercises: Target Sets and Safe Fallback'
description: Audit directional target sets and reject an unjustified precision change.
pairId: h05-exercises
counterpart: /architecture/blackwell-families/exercises/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, targets, fallback, review]
resourceKind: exercise-set
unitId: H05-EXERCISES
prerequisites: [H05]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA capability scopes', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,targets,fallback,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H05 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/blackwell-families/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite: [H05](/en/architecture/blackwell-families/). Submit two paper ledgers. No hardware is required; execution remains **Pending Hardware Verification**. Sources checked 2026-10-04: [SRC-CUDA-107](/en/sources-and-versions/#src-cuda-107).

## Exercise 1: directional target sets

**Goal:** map targets 100a, 100f, 103f, 110f, 120f, 121f to devices 10.0, 10.3, 10.7, 11.0, 12.0, 12.1. A developer assumes all `f` images work on all devices with major CC ≥10.

**Constraints:** use the current documented sets; separately apply EX25's Toolkit 13.3.1 profile. Do not invent a 107 build in that lane or confuse cubin and PTX compatibility.

**Acceptance:** produce a six-by-six eligibility matrix, list at least three counterexamples to the proposed rule, and explain why documented 10.7 compatibility does not grant EX25 admission. Specify the ordinary fallback and the driver/PTX-version gate.

<details><summary>Hint 1</summary>Family sets are directional; 103f is not another spelling of 100f.</details>
<details><summary>Hint 2</summary>Keep documented compatibility, accepted compiler targets and the project's reviewed runtime set in three columns.</details>

## Exercise 2: precision is not a fallback knob

**Goal:** repair a proposal to run a 100a FP64 Tensor Core kernel on CC 12.1 by changing the suffix to 120f and replacing inputs with FP4.

**Constraints:** callers require the original FP64 numerical contract. No GPU results are supplied. Use an ordinary FP64 SIMT or explicitly reviewed library alternative, not lower precision by default.

**Acceptance:** identify both target and datatype failures; specify equivalent inputs/outputs, tolerance and exceptional-value policy, independent reference checks, exact build artifacts, and the evidence needed before any performance comparison. Reject the change if equivalence cannot be established.

<details><summary>Hint 1</summary>FP64 arithmetic and native FP64 Tensor Core input support are different.</details>
<details><summary>Hint 2</summary>A format's availability establishes neither an application error budget nor a speedup.</details>

## Review separately

After attempting both, read [solutions](/en/architecture/blackwell-families/solutions/) and [PB-R7-005](/en/practice/#pb-r7-005). Original CC BY 4.0; referenced owner documentation retains its notices.
