---
title: 'O02 Reviewed Solutions: Classify and Repair Evidence Claims'
description: Separate reviewed solutions, trade-offs, and common errors for the three O02 Exercises.
pairId: o02-solutions
counterpart: /start/evidence-status/solutions/
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
unitId: O02-SOLUTIONS
prerequisites:
  - O02-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: o02-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O02-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/start/evidence-status/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [O02 Exercises](/en/start/evidence-status/exercises/), not mandatory wording. Submit your own answer before checking whether each classification is supported by actual evidence.

## Solution 1: Classify a mixed record

| Record | Compilation axis | Runtime axis | Missing evidence |
| --- | --- | --- | --- |
| 1 | Compile-Checked | Pending Hardware Verification | Qualifying run, complete manifest, criteria, and date |
| 2 | None | Community-Observed + Pending Hardware Verification | Maintainer reproduction in a declared Reference Environment |
| 3 | None | Pending Hardware Verification if runtime is required | An actual successful build must occur first |
| 4 | Compile-Checked | Runtime-Not-Applicable | No runtime evidence is required; retain the PTX inspection artifact |

Record 2 might have separate compilation evidence, but the prompt does not provide it. Record 3's runtime status depends on the original acceptance criteria; state that condition instead of guessing.

## Solution 2: Separate expectation from record

- **Current status:** No Compile-Checked and no runtime status can be awarded.
- **Expected observation:** A future qualifying run is expected to print `PASS`; this remains a hypothesis.
- **Recorded observation:** Empty.
- **Next evidence:** Record the build command, environment, and log in a declared Lane. If acceptance requires GPU behavior, add a complete Environment Manifest, correctness criteria, run log, and date. A performance claim also needs a baseline, warm-up, synchronization, timer or profiler version, and statistical method.

A structured table or JSON record is an equally valid alternative if it preserves these boundaries.

## Solution 3: Review a status upgrade

**Decision: reject the upgrade while retaining Community-Observed.**

First, the report is a community observation rather than maintainer-controlled reproduction. Second, its environment is not a declared Reference Environment. An upgrade requires maintainer control, a controlled baseline run, a complete manifest, an explicit GPU Capability Tier declaration, evidence that criteria passed, and a verification date.

This does not dismiss the report. The honest combination remains `Community-Observed + Pending Hardware Verification`.

## Common errors

- Treating any log as Runtime-Verified while ignoring the observer and Reference Environment.
- Treating blocked as either passed or failed; it means required work did not complete.
- Inferring GPU behavior from PTX or using Runtime-Not-Applicable to hide runtime acceptance.
- Keeping a “2x” number without a measurement method.

Reviewed: **2026-08-24**. These solutions classify hypothetical records and add no CUDA observation.
