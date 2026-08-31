---
title: 'Q07 Reviewed Solutions: Build a Reviewable Timeline-First Investigation'
description: Reviewed collection, interpretation, custody, and exact-kernel handoff records for the three static Q07 Exercises.
pairId: q07-solutions
counterpart: /correctness/timeline-first-nsight-systems/solutions/
factCheckDate: '2026-08-31'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: Q07-SOLUTIONS
prerequisites:
  - Q07-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: q07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/timeline-first-nsight-systems/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers review the [Q07 Exercises](/en/correctness/timeline-first-nsight-systems/exercises/) as symbolic evidence records. They run neither Nsight Systems nor Nsight Compute, fill no observation, and establish no profiler conclusion.

## Solution 1: Design a versioned collection and custody contract

The original instruction fails because “the app,” tool version, capture scope, correctness state, and output custody are all undefined. A passing pre-observation record looks like this:

| gate | reviewed symbolic record |
| --- | --- |
| question | locate time within declared representative phase `P`; do not assume a kernel bottleneck |
| workload | exact executable, arguments, input/shape, source commit, build command, representative-path rationale |
| correctness | Q05 method and criteria, completed baseline/candidate verdict slots, checked CUDA errors |
| run policy | warm-up/exclusion, repetition/order, capture start/stop, completion, process scope, background-load rule |
| environment | full manifest, profiler path, permissions, Toolkit Lane, observed `nsys --version` slot |
| trace | requested CUDA/NVTX/OS runtime and scheduling choices, captured `profile --help`, deviations from defaults |
| CUPTI boundary | instrumented activity/correlation, diagnostics and dropped-record check, no unprofiled-run equivalence |
| primary artifact | `<report>.nsys-rep`, immutable copy, SHA-256 slot, observer/date, profiler logs and exit status |

The three bundled component coordinates are planning references: Toolkit Lane `cuda-11.8` / CUDA Toolkit 11.8.0 to `2022.4.2.1`, `cuda-12.9` / CUDA Toolkit 12.9.2 to `2025.1.3.140`, and `cuda-13.3` / CUDA Toolkit 13.3.1 to `2026.1.3.425`. The decision gate still stops until actual `nsys --version` and help output are attached. Unknown version or unsupported options means revise before collection, not guess.

Each derivation gets a ledger row containing source-report hash, exact `nsys stats` or `nsys export` command, observed tool version, stdout/stderr, exit status, output path and hash, and creation date. The report remains primary. The review rule is: no representative workload or correctness verdict, no collection; no manifest/method/diagnostics/custody, no supported timeline conclusion.

## Solution 2: Interpret gaps, launches, copies, and overlap conservatively

The symbolic record supports only the following separation:

| item | supported observation | still only a hypothesis |
| --- | --- | --- |
| CPU interval | visible in phase `steady` before the launch calls | blocking, computation, descheduling, I/O, or tracing omission |
| API duration | entry-to-exit for each of three traced launch calls | source-level cause or total application launch cost |
| submission gap | API exit to correlated `K0` start | queueing, dependency, scheduling, initialization, contention |
| kernel duration | `K0` start-to-end in `S0` in this report | unprofiled duration or kernel bottleneck |
| dependency | `ready` appears in the copy pipeline | whether it is necessary or the cause of a delay |
| overlap | HtoD interval in `S1` intersects `K0` in `S0` during `steady` | pinned memory, copy-engine cause, speedup, or repetition-wide overlap |

Scheduling detail and profiler diagnostics are absent, so the apparent CPU gap remains unresolved and incomplete tracing must be checked. The phrase “launch overhead” must be replaced by the exact API duration, submission gap, or aggregate host launch sequence being discussed.

A valid bounded sentence is: “In report `<hash pending>`, phase `steady`, the traced HtoD interval in `S1` intersects the traced `K0` interval in `S0` over `<timestamps pending>`.” Empty identity and timestamp slots mean this is a template, not a recorded observation. A cause requires a controlled change plus comparable correctness, workload, collection, and manifest records.

## Solution 3: Prepare a Systems-to-Compute handoff

One reviewed identity card is:

| field | required selection |
| --- | --- |
| Systems source | immutable `.nsys-rep` path and hash |
| application scope | process and declared phase/range |
| CUDA scope | context and stream |
| kernel identity | full `update(float*)` name plus launch occurrence or correlation identity |
| timeline locator | observed start interval and neighboring event needed to disambiguate it |
| reproducibility | exact workload, input, build, warm-up, and a selection/filter rule for the separate run |

The handoff question could be: “For the selected `update(float*)` occurrence representing phase `P`, do requested memory-workload evidence sections support the predeclared hypothesis that its global-memory access behavior limits it?” This is narrow enough to justify beginning with only the relevant memory-workload section set, subject to Q08's availability query and replay contract. It does not request every metric.

The pass gate requires all identity fields, a correct representative Systems run, one kernel-level question, an observed `ncu` version and permission plan, and explicit acknowledgment that the Compute report comes from a separate instrumented execution that may replay work. A name-only selection, application-wide question, metric dump, or claim that Compute continues the literal Systems launch fails the gate.

## Valid alternatives

- CPU scheduling traces may be intentionally excluded when the limitation is declared and no scheduling cause is inferred.
- Capture can use a reviewed duration, hotkey/session boundary, or NVTX range when the installed version supports it and the method preserves the representative phase.
- A supported export format other than SQLite is acceptable when its schema, command, tool version, source hash, and omissions are recorded.
- Exact-instance identity may use a stable launch occurrence or correlation coordinate, provided repeated names remain distinguishable and the separate-run selection rule is reproducible.

## Common errors

- Inferring `nsys` version from the Toolkit, driver, or `nvcc` instead of recording CLI output.
- Profiling a convenience input that removes the representative path or has not passed correctness.
- Naming blank space a CPU bottleneck without scheduling, trace-completeness, or diagnostics evidence.
- Calling every API-to-kernel interval launch overhead without naming endpoints.
- Treating copy capability, streams, or pinned memory as proof of observed overlap.
- Replacing the `.nsys-rep` with a screenshot, stats table, or detached export.
- Ignoring CUPTI instrumentation, overhead, buffering, or dropped-record boundaries.
- Selecting a kernel name rather than one exact instance and one question.
- Describing a separate replaying Nsight Compute run as the same Systems launch.

Reviewed: **2026-08-31**. Compilation, runtime, expected-observation, and recorded-observation arrays remain empty.
