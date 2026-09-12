---
title: 'P07 Exercises: Correlation, Capture Windows, and Honest Reports'
description: Reconstruct a supplied launch graph, derive two scheduled captures, and reject a table-only profiling report with missing environment and permission records.
pairId: p07-exercises
counterpart: /frameworks/python-to-cuda-profiling/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: P07-EXERCISES
prerequisites: [P07]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p07-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/python-to-cuda-profiling/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P07 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/python-to-cuda-profiling/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [P07](/en/frameworks/python-to-cuda-profiling/), exactly `[P07]`. These are original static Exercises, not trace files or CUDA implementations. No GPU is needed. All four evidence arrays are empty, and **GPU-dependent behavior remains Pending Hardware Verification**.

## Submission requirements

Use the contract for PyTorch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64. Submit relation diagrams, schedule calculations, and an evidence/custody plan. All proposed observations in Exercise 3 are hypothetical claims to audit, not measurements from this site. Do not create code, a synthetic JSON trace, screenshots, or timings. Read the [solutions](/en/frameworks/python-to-cuda-profiling/solutions/) after completing all three.

## Exercise 1: Attribute work without matching names

**Goal:** Recover operation-to-device relationships from explicit links and identify what remains unknown.

**Constraints:** The following symbolic relations are complete for F-A, F-B, and F-C in this worksheet only. F-B is stipulated metadata-only. K-A2 and K-C1 share the display label “elementwise.” K-A1 is stipulated to execute after F-A's host range has ended. An additional K-U has no supplied link or device/stream identity. These identifiers are not actual trace records or JSON schema fields.

| Framework occurrence | Host launch | Correlation token | Device work | Device / stream |
| --- | --- | --- | --- | --- |
| `F-A` | `H-A1` | `C-X` | `K-A1` | `0 / 3` |
| `F-A` | `H-A2` | `C-Y` | `K-A2` | `0 / 3` |
| `F-B` | None | None | None | Not applicable |
| `F-C` | `H-C1` | `C-Z` | `K-C1` | `0 / 7` |

**Expected evidence:** Every supplied framework-to-host-to-CUDA chain, the kernel count per occurrence, K-U's disposition, and rejection reasons for assigning by display name, nearest range, or CPU temporal containment. Describe the actual event identities and capture context that a future trace must retain.

**Acceptance criteria:** Attribute K-A1 despite delayed execution, separate the two identically labeled kernels, and leave K-U unresolved. Explain why zero kernels in the complete stipulated F-B case differs from missing kernels in an incomplete real capture. No duration, inter-stream order, utilization, precision, or bottleneck is derivable from this table. A user annotation does not force one-to-one mapping or GPU synchronization.

<details><summary>Hint 1: Join identities, not labels</summary>Begin at the framework occurrence and follow the supplied host launch and correlation token. The shared display label has no authority to replace a link.</details>

<details><summary>Hint 2: Missing is not zero</summary>Only the explicitly complete metadata-only case establishes zero work here. An item without a link is unresolved; a real capture can also omit activity because collection failed.</details>

## Exercise 2: Retain both active windows

**Goal:** Derive the schedule and a per-window export contract without executing a profiler.

**Constraints:** Use `wait=1`, `warmup=1`, `active=3`, `repeat=2`, `skip_first=0`, `skip_first_wait=0`; ten iterations indexed 0-9; one `prof.step()` after each iteration. Each iteration contains one distinct neutral workload label. Workload warmup occurs before profiling. A proposed exporter saves only once after the context, while a second proposal writes both callbacks to one destination.

**Expected evidence:** A ten-row action table, active index sets, callback transitions and count, distinct W1/W2 artifact slots, included workload labels, and rejection of both exporters. Explain `acc_events=False` versus `acc_events=True`, a missing iteration-boundary step, and why step is not a CUDA synchronization contract.

**Acceptance criteria:** Distinguish waiting, profiler warmup, active workload, and completed-window export. Require one distinct successfully retained artifact per callback, not merely two callback invocations. Do not count profiler bookkeeping as a workload range or claim a trace was saved. State what is lost in a last-cycle-only export and why accumulated summary events cannot reconstruct unsaved timelines.

<details><summary>Hint 1: Number the work, then the transition</summary>The initial action belongs to iteration zero. Finishing an iteration advances to the next step; the final active action records work before its transition saves the window.</details>

<details><summary>Hint 2: Artifact count is a separate obligation</summary>Two completed recording cycles need two distinct retained timeline destinations. Callback count, successful writes, and aggregation settings answer different questions.</details>

## Exercise 3: Repair a profiling evidence packet

**Goal:** Turn an overclaimed report into an honest collection and timing plan with complete environment and privacy boundaries.

**Constraints:** A hypothetical report lists supported CUDA activities and a CUDA-time table but its exported JSON has no kernel events. It records only a system Toolkit version, omitting loaded CUPTI and driver identities. It enables shape and stack recording, claims delayed allocation reuse is uninstrumented behavior, derives application latency by adding kernel durations, proposes nesting Nsight around torch.profiler, and asks for a privileged rerun plus public upload of raw stacks containing private source paths. No collection or policy change is authorized by this Exercise.

**Expected evidence:** A per-claim accept/reject/unknown table; a CUDA trace smoke-test criterion; a complete P07 Environment Manifest with missing values marked unknown; separate correctness, profiler, and unprofiled timing plans; and raw/derivative artifact custody, redaction, permission, and reviewer-approval rules.

**Acceptance criteria:** Recognize possible CUPTI fallback without claiming it is the only diagnosis. Check CPU/runtime/kernel evidence in active windows, requesting transfer events only for an in-window transfer workload. Inspect loaded library identity, exact build/dependencies, driver/tool compatibility, collection completeness, and host/container policy. Shape capture can change tensor lifetimes; table totals are not wall time. Keep CUPTI clients separate, distinguish activity tracing from hardware counters, do not prescribe blanket root access or weaken security, and never publish raw private paths, credentials, or confidential workload data. Missing prerequisites produce a blocked claim, not a fabricated pass.

<details><summary>Hint 1: Ask which layer produced the number</summary>A CUDA column can come from fallback timing rather than exported device activity. Check the actual timeline's contents and launch relationships, not the presence of a table or file.</details>

<details><summary>Hint 2: The experiment includes the observer</summary>Shape capture can retain tensors and stacks can disclose source locations. Separate the relationship experiment from unprofiled measurement, and require authorization and sanitized derivatives before any sharing.</details>

## Next

Compare the [separate solutions](/en/frameworks/python-to-cuda-profiling/solutions/) and [PB-R5-007](/en/practice/#pb-r5-007). Source basis: [P07](/en/frameworks/python-to-cuda-profiling/), [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080), and [SRC-CUDA-083](/en/sources-and-versions/#src-cuda-083), reviewed **2026-09-12**. No paper answer creates a CUDA trace or performance observation.
