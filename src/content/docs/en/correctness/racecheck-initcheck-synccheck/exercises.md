---
title: 'Q04 Exercises: Diagnose by sanitizer scope'
description: Route defects to detectors, classify shared-memory hazards, and audit clean-report coverage claims in three static tasks.
pairId: q04-exercises
counterpart: /correctness/racecheck-initcheck-synccheck/exercises/
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
unitId: Q04-EXERCISES
prerequisites:
  - Q04
relatedUnits:
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
    attrs: { name: 'cuda:pair-id', content: q04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q04,EX16,LAB07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/racecheck-initcheck-synccheck/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [Q04: Diagnose with Racecheck, Initcheck, and Synccheck](/en/correctness/racecheck-initcheck-synccheck/) first. These three tasks require static reasoning about tool scope, hazards, and evidence. No CUDA-capable system is needed.

## Instructions

Write the address space, conflicting operations, executed path, and required guarantee before selecting a detector. Every command plan starts with memcheck and uses one scenario per process. Finish all three tasks before consulting the [reviewed solutions](/en/correctness/racecheck-initcheck-synccheck/solutions/).

## Exercise 1: Route four scenarios to detectors

**Goal:** Build a tool-routing matrix for four conceptual scenarios: A, two threads write one shared slot without ordering; B, a kernel reads a partly initialized device global allocation; C, only block threads satisfying a predicate call `__syncthreads()`; D, two blocks write one valid global address without ordering.

**Constraints:** Schedule an isolated memcheck process first for every scenario. Then choose only racecheck, default initcheck, shared-enabled initcheck, synccheck, or “none of these proves the claim.” Do not widen racecheck into a global-race detector. Start a new process for every scenario and tool invocation.

**Expected evidence:** A four-row matrix containing address space, defect class, first command, focused command, expected classification, and uncovered claim, plus a complete process and log ledger.

**Acceptance criteria:** A routes to racecheck, B to default global initcheck, C to synccheck, and D remains a global-ordering defect not proven by these tools. Every route passes memcheck first and reuses no defect process.

<details><summary>Hint 1</summary>Ask whether the location is shared or global before asking whether the defect is an invalid access, initialization gap, hazard, or primitive misuse.</details>

<details><summary>Hint 2</summary>“This tool does not check that claim” is a required diagnostic result.</details>

## Exercise 2: Classify WAW, WAR, and RAW

**Goal:** Classify three same-block shared-memory traces with no ordering edge: T1 is `thread 0 write shared[2]` followed by another thread writing that address; T2 is `thread 0 read shared[3]` followed by another thread writing that address; T3 is `thread 0 write shared[4]` followed by another thread reading that address. Design a repair obligation for each without implicit lockstep.

**Constraints:** Use WAW, WAR, and RAW exactly once. State required ordering or ownership before choosing a block barrier, valid warp synchronization, unique writer, or atomic protocol. Do not insert a divergent `__syncthreads()` mechanically. Do not claim that repairing a shared hazard proves global memory race-free.

**Expected evidence:** A three-row classification table, before/after graph for every trace, participant set, repair rationale, and the primitive condition that synccheck should review.

**Acceptance criteria:** T1, T2, and T3 classify as WAW, WAR, and RAW respectively. The WAW repair removes competing writes or defines atomic ownership. WAR and RAW repairs establish order in the right direction. Every barrier names legal participants and a convergence precondition.

<details><summary>Hint 1</summary>For an A-after-B acronym, identify the earlier operation before the later one.</details>

<details><summary>Hint 2</summary>Racecheck identifies a conflicting access pair; the algorithm decides whether it needs one writer, atomicity, or rendezvous.</details>

## Exercise 3: Bound a clean-report claim

**Goal:** Audit this conclusion: “All four tools were clean for one input, so all paths are race-free, shared and global memory are initialized, and every warp and block synchronization is correct.” Replace it with a bounded statement and a next-run matrix.

**Constraints:** Assume initcheck used default options, only one branch executed, and the synccheck fixture contains a `__syncwarp(mask)` that may name a lane that never arrives. Distinguish the current shared-memory initcheck extension from the CUDA 11.8 baseline. Invent no report count, GPU, tool output, or correctness verdict.

**Expected evidence:** A claim-to-gap table covering executed paths, racecheck address space, initcheck option, synccheck non-arrival limitation, numerical correctness, and exact versions, plus a separate-process rerun plan for defect and corrected variants.

**Acceptance criteria:** The replacement says only that each tool reported no in-scope defect on the recorded environment and executed path. The rerun plan discusses shared initialization only after explicitly selecting `shared` or `all`. Global-race, unexecuted-path, mask non-arrival, and CPU-reference gaps remain visible.

<details><summary>Hint 1</summary>Replace every “all” with a concrete input, path, option, tool version, and checked scope.</details>

<details><summary>Hint 2</summary>Clean dynamic analysis narrows a defect search; it cannot inspect code that did not execute.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/racecheck-initcheck-synccheck/solutions/) and then audit another overclaim in [Practice Bank PB-R1-023](/en/practice/#pb-r1-023).
