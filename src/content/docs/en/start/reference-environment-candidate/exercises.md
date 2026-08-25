---
title: 'O08 Exercises: Qualify a Reference Environment Candidate'
description: Triage an incomplete candidate and review a compatibility assessment and premature declaration attempt.
pairId: o08-exercises
counterpart: /start/reference-environment-candidate/exercises/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - next
resourceKind: exercise-set
unitId: O08-EXERCISES
prerequisites:
  - O08
relatedUnits:
  - O08
  - EX01
  - LAB01
exampleIds:
  - EX01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o08-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O08 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O08,EX01,LAB01' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX01 }
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

<a class="locale-pair" data-locale-counterpart href="/start/reference-environment-candidate/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [O08: Preparing a Reference Environment Candidate](/en/start/reference-environment-candidate/) first. These Exercises use hypothetical review packets, require no GPU, and record no machine observation or CUDA evidence.

## How to answer

Treat every supplied line as unverified input. Produce a reviewable artifact before opening Hint 1, then use Hint 2 only if a gate remains unclear. Invent no version, query result, package, permission, log, maintainer action, or baseline outcome. Full answers live on the separate [reviewed-solutions page](/en/start/reference-environment-candidate/solutions/).

## Exercise 1: Triage an incomplete candidate

The following is a hypothetical intake note, not an observed Environment Manifest:

```text
Host: native Linux
GPU: 16 GB
CUDA: 13.3
EX01: complete
Build: PASS
```

**Goal:** Decide what can and cannot be concluded, then turn the note into a collection and review plan.

**Constraints:** Preserve the five lines as unverified raw text. Do not infer GPU identity, compute capability, GPU count, KMD, driver-supported CUDA API, Toolkit patch, component versions, applicable tier, compatibility path, maintainer control, or baseline success. Use only `documented-path`, `not-documented`, and `indeterminate` for compatibility triage.

**Expected evidence:** A gap table grouped by manifest, tier, compatibility, control, and baseline; an exact query plan; and a declaration decision.

**Acceptance criteria:**

- Require every O08 manifest coordinate, including a direct compute-capability query and separate KMD, driver-supported CUDA API, Toolkit, and component fields.
- Mark both tier and compatibility `indeterminate` until their required coordinates are collected.
- Require a separately designated baseline with correctness criteria declared before execution and retained logs after execution.
- State that no Reference Environment is currently declared and that EX01 output, a build, `nvidia-smi`, a compatibility result, or a community report is insufficient.
- Assign no Compile-Checked, Community-Observed, or Runtime-Verified status from this note.

<details><summary>Hint 1</summary>“16 GB” can fill at most one memory coordinate. “CUDA 13.3” could describe a driver-supported API banner, a Toolkit family, or informal shorthand.</details>

<details><summary>Hint 2</summary>Start collection with `nvidia-smi --query-gpu=name,compute_cap --format=csv,noheader`, then collect KMD, CUDA UMD or `cudaDriverGetVersion()`, Toolkit, components, control, and the still-unexecuted baseline protocol separately.</details>

## Exercise 2: Review a compatibility assessment and declaration attempt

Review this second hypothetical packet:

```text
KMD: 525.60.13
Toolkit: 13.3.1
Compatibility Explorer: documented-path
Community report: PASS
Declaration attempt:
  "The CUDA 12.x floor covers Toolkit 13.3.1,
   so this is now a Reference Environment and Runtime-Verified."
```

**Goal:** Audit the compatibility reasoning and replace the declaration attempt with an evidence-safe decision and completion path.

**Constraints:** Use only the selected Lane facts in O08: 11.8.0 floor `450.80.02`, 12.9.2 floor `525.60.13`, and 13.3.1 floor `R580` or `>= 580`. Do not assume system eligibility, a forward-compatibility package, user-mode library selection, manifest completeness, maintainer control, baseline execution, or community-report completeness.

**Expected evidence:** An annotated compatibility assessment, the correct explorer outcome for the supplied coordinates, a declaration decision, and a list of facts and runtime checks still required.

**Acceptance criteria:**

- Reject `525.60.13` as the CUDA 13.3.1 minor-version floor and explain why same-major minor compatibility does not apply across CUDA 12.x and 13.x.
- Treat a forward-package path as possible only after eligible-system, matching-package, user-mode selection, and feature-restriction facts are recorded; keep this packet `indeterminate` meanwhile.
- Explain that even a later `documented-path` result requires runtime validation and grants no CUDA Evidence Status.
- Require a complete manifest, applicable tier, maintainer control, and a separately designated successful baseline with predeclared correctness criteria before declaration.
- State plainly that no Reference Environment is currently declared and the community `PASS` cannot make the packet Runtime-Verified.

<details><summary>Hint 1</summary>A floor belongs to a CUDA major family. Crossing major families changes the compatibility question rather than borrowing the older family's floor.</details>

<details><summary>Hint 2</summary>A forward-compatibility package supplies selected user-mode driver libraries under documented eligibility and loading rules. It does not replace KMD or create maintainer control and runtime evidence.</details>

## Next step

Compare your artifacts with the [reviewed solutions](/en/start/reference-environment-candidate/solutions/), then complete [Practice Bank PB-R1-005](/en/practice/#pb-r1-005) without turning any hypothetical field into an observation.
