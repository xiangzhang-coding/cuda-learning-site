---
title: 'Q08 Reviewed Solutions: Design a bounded selected-kernel profile'
description: Reviewed handoff, minimal collection, metric-interpretation, replay, and .ncu-rep custody answers for the Q08 Exercises.
pairId: q08-solutions
counterpart: /correctness/kernel-first-nsight-compute/solutions/
factCheckDate: '2026-08-31'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - common-errors
resourceKind: solution-set
unitId: Q08-SOLUTIONS
prerequisites:
  - Q08-EXERCISES
relatedUnits:
  - Q08
  - Q06
  - EX07
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
    attrs: { name: 'cuda:pair-id', content: q08-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/kernel-first-nsight-compute/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q08,Q06,EX07,LAB08,VIS14' }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/kernel-first-nsight-compute/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers review the [Q08 Exercises](/en/correctness/kernel-first-nsight-compute/exercises/) as static evidence contracts. They do not execute Nsight Compute, assert availability, fill a metric, or create a report.

## Solution 1: Write the Systems-to-Compute handoff

A complete handoff can read:

| field | reviewed answer |
| --- | --- |
| source selection | retained `.nsys-rep` path/hash; process `app`; demangled `transform_kernel`; recorded stream; fourth matching launch; workload `W`; exact input; passing correctness record |
| question | “For the corresponding fourth `transform_kernel` launch under workload `W`, is its observed global-memory behavior consistent with the M02 request-shape hypothesis, and would that result keep or reject the proposed layout investigation?” |
| filter plan | demangled name basis; anchored exact-name regex; skip the predeclared number of matching launches; collect one matching launch; retain process and workload filters |
| equivalence | application revision, workload, input, launch order, stream topology, and correctness must match; profiler/tool instrumentation is explicitly different |
| exit | support or reject only the request-shape hypothesis; return to Systems if occurrence matching or representative application behavior diverges |

The filter selects a corresponding occurrence in a new run. It cannot identify the already-completed physical launch inside the Systems report. Before collection, verify the actual matching order instead of assuming that name plus `--launch-count 1` is exact identity.

**Review:** Passes because one occurrence, one question, one decision, and the separate-run boundary are explicit. No metric was selected before the question.

## Solution 2: Query and minimize the collection

The gate has stop conditions before any report is interpreted:

| gate | retained field | decision |
| --- | --- | --- |
| tool and target | exact `ncu --version`, GPU identity/CC, driver, Toolkit, application revision | stop on missing or mismatched coordinates |
| permission | performance-counter probe result and full error/context | stop on denial; never record zero |
| availability | complete outputs from `--list-sections` and `--query-metrics` on that GPU/tool | choose only returned names |
| selection | name basis, anchored regex, skip/count, process, workload, matching occurrence | stop if the corresponding launch is ambiguous |
| replay | exact replay mode and reported pass/matching facts | disclose perturbation, serialization, re-execution, or application relaunch |
| output | immutable `.ncu-rep` path plus stdout/stderr | stop interpretation if collection is incomplete |

One symbolic plan chooses the single queried section whose documented rules answer the global-memory question. An equally valid plan uses a short queried metric list when each metric maps directly to the question. Both preserve exact names, definitions, units, scopes, and query output. Neither requests unrelated sections.

The collection command combines the Exercise 1 filter, one chosen `--section` or explicit `--metrics` list, `--export`, the fixed application, and fixed workload arguments. Fewer requested items can reduce collection passes, but the record still says replay may perturb or serialize execution and application replay is another execution.

**Review:** Passes only after every query slot is filled by the target environment. The static template itself grants no permission, availability, or expected observation.

## Solution 3: Review interpretation and report custody

The original claim fails four checks: “memory metric” has no exact identity; “high” has no unit, denominator, definition, baseline, or scope; coalescing and shared memory are different mechanisms; and a counter correlation cannot promise a faster repair.

A bounded replacement is:

| question | expected model | observed evidence contract | permitted interpretation |
| --- | --- | --- | --- |
| coalescing | M02 active lanes, requested bytes, width, alignment, and expected segment set | exact queried global-memory names, units, definitions, scope, filter, and replay from the selected occurrence | consistency or inconsistency with the request-shape hypothesis; no automatic bottleneck or speedup |
| shared memory | M03 staged values, participants, barriers, traffic, and reuse expectation | separate queried shared-memory names, units, definitions, scope, filter, and replay | a bounded traffic/conflict/stall observation only if that documented metric tests the question |

The custody ledger retains both report hashes, selected-instance ledger, application/source revision, exact commands, GPU/software versions, permission, replay, filter and matched occurrence, workload/input, correctness verdict, query outputs, metric definitions and units, stdout/stderr, observer, date, immutable `.ncu-rep`, and any sanitized-derivative mapping. Original reports are not overwritten.

The next-action verdict is **unsupported as written**. After real collection, the evidence may support or reject one narrow mechanism hypothesis. A controlled baseline/candidate experiment with separate correct reports is still required for a causal performance claim.

**Review:** Passes because expected models, observed evidence, interpretation, causality, and custody remain separate.

## Common errors

- Starting Nsight Compute before a representative Systems timeline selects an exact kernel occurrence.
- Selecting metrics before writing the question.
- Treating a kernel-name match or `--launch-count 1` as complete identity.
- Treating permission denial or unavailable metrics as zero.
- Collecting every section as a metric dump.
- Hiding replay, profiler perturbation, serialization, or application relaunch.
- Comparing names whose units, definitions, suffixes, scopes, GPUs, or tool versions differ.
- Calling a large value the bottleneck without a denominator or competing explanation.
- Claiming the `.nsys-rep` and `.ncu-rep` contain the same physical launch.
- Keeping a filename without command, filter, version, permission, replay, hash, and report custody.

Reviewed: **2026-08-31**. Compilation and runtime evidence axes remain empty.
