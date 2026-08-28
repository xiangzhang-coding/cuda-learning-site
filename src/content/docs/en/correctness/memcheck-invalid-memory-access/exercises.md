---
title: 'Q03 Exercises: Bound a memcheck investigation'
description: Classify memcheck findings, build a three-lane command and path-coverage plan, and audit leak, API-error, and tool-order boundaries in three static tasks.
pairId: q03-exercises
counterpart: /correctness/memcheck-invalid-memory-access/exercises/
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
unitId: Q03-EXERCISES
prerequisites:
  - Q03
relatedUnits:
  - Q03
  - Q04
  - EX16
  - LAB07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q03,Q04,EX16,LAB07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/memcheck-invalid-memory-access/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q03: Memcheck and Invalid Memory Access](/en/correctness/memcheck-invalid-memory-access/) first. These Exercises design commands and interpretations without invoking Compute Sanitizer or a GPU.

## Instructions

For each claim, name the Toolkit and Compute Sanitizer coordinates, the executed scenario, the checker boundary, and the separate Q01 result gate. Do not invent a transcript or an error count. Finish all tasks before consulting the [reviewed solutions](/en/correctness/memcheck-invalid-memory-access/solutions/).

## Exercise 1: Classify six observations before reading a log

**Goal:** Classify six conceptual situations: an executed global read at index `N` from an `N`-element allocation; an executed four-byte store through an address offset by one byte; a hardware-reported exception without unique thread attribution; the same out-of-bounds expression in a branch not taken by the test; a host write beyond an ordinary host allocation outside a CUDA API call; and a CUDA API failure whose return value the application ignores.

**Constraints:** Use the categories precise supported access, imprecise hardware report, unexecuted path, outside stated memcheck coverage, and supplemental API report. State the repair or next observation needed for each. Do not fabricate report text, source lines, addresses, or thread coordinates.

**Expected evidence:** A six-row classification table, a precision rationale for each device-side row, and a separate application-error-handling action for the failed API call.

**Acceptance criteria:** The first two executed accesses are classified as precise out-of-bounds and misaligned candidates, the hardware exception remains imprecise, the untaken branch cannot be cleared by this run, the host write is not assigned to device memcheck, and API reporting does not replace checking the return value.

<details><summary>Hint 1</summary>“Precise” describes attributable supported events, not every failure involving memory.</details>

<details><summary>Hint 2</summary>Absence of a dynamic observation says nothing about a branch that never ran.</details>

## Exercise 2: Design one command contract for three lanes

**Goal:** Write an access-check command and a full-leak command that use the Q03 conservative intersection for CUDA 11.8, CUDA 12.9, and the current lane, then design a path matrix for a guarded one-dimensional kernel.

**Constraints:** Use explicit `--tool memcheck` and `--report-api-errors explicit`; add `--leak-check full` only to the leak command. Record Toolkit, driver, and `compute-sanitizer --version` separately. Cover `N = 0`, `1`, `B - 1`, `B`, and `B + 1`, both sides of any data-dependent branch, and orderly context teardown. Do not use current-only compile-time instrumentation or infer any option default backward.

**Expected evidence:** Two command templates, a three-lane coordinate table, a path/launch matrix, required raw-record fields, and exact wording for the strongest claim permitted after all declared cases report no access errors.

**Acceptance criteria:** Commands place sanitizer options before the executable, the leak plan reaches context destruction, every edge case names expected executed paths, the 12.9 archival handoff is recorded rather than hidden, and the clean-result wording remains limited to the declared runs and documented coverage.

<details><summary>Hint 1</summary>The web manual version and the installed executable version are not interchangeable coordinates.</details>

<details><summary>Hint 2</summary>Write “no errors reported for these paths” rather than “the program has no memory errors.”</details>

## Exercise 3: Repair a lifecycle and investigation order

**Goal:** Audit this conceptual sequence: allocate `A` and `B`; ignore a failed copy into `A`; launch a kernel; validate no output; free only `A`; stop observation before context teardown; run racecheck first; and call the scenario correct when racecheck is quiet.

**Constraints:** Preserve two allocations and one kernel, but add explicit return checks, a launch check, an asynchronous completion boundary, a Q01 CPU-reference/invariant gate, an access memcheck run, a full leak run through teardown, and the remaining sanitizer order. Keep each scenario in a fresh process for a clean lifecycle boundary. Do not predict actual tool output.

**Expected evidence:** A defect ledger, corrected control-flow pseudocode, an ordered tool plan, and pass criteria that distinguish API handling, numerical correctness, access safety, and leak ownership.

**Acceptance criteria:** The failed copy stops or follows a declared recovery path, `B` receives a documented release, output correctness is checked independently, memcheck precedes the other tools, full leak checking observes context destruction, and no quiet report is promoted to universal proof.

<details><summary>Hint 1</summary>A tool message about a failed API is later than the return value the program already received.</details>

<details><summary>Hint 2</summary>Draw four separate gates: API/completion, result, access, and lifetime.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/memcheck-invalid-memory-access/solutions/), then audit another plan in [Practice Bank PB-R1-022](/en/practice/#pb-r1-022) before continuing to Q04.
