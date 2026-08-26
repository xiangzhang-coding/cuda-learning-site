---
title: 'F06 Exercises: Build and Audit a Compute-Capability Feature Contract'
description: Use three deep Exercises to separate feature rows, numeric limits, compiler targets, and unresolved environment coordinates.
pairId: f06-exercises
counterpart: /foundations/compute-capability/exercises/
factCheckDate: '2026-08-26'
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
unitId: F06-EXERCISES
prerequisites:
  - F06
relatedUnits:
  - F06
  - F08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F06 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F06,F08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/compute-capability/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F06: Compute Capability Is a Feature Contract](/en/foundations/compute-capability/) first. These Exercises require static review only. A table lookup, browser-filter result, or target plan is not a GPU observation.

## How to answer

Produce each requested matrix or decision ledger before opening hints. Keep the directly observed value and every unknown coordinate visible. Do not add a product mapping, compiler result, driver verdict, or performance result that the packet does not contain. Compare your work with the separate [reviewed solutions](/en/foundations/compute-capability/solutions/) only after completing all three contracts.

## Exercise 1: Build three feature-and-limit contracts

A device inventory contains three directly queried compute-capability values: `7.5`, `9.0`, and `12.0`. For each value, classify hardware-accelerated `memcpy_async`, Thread Block Cluster, the existence of architecture-specific and family-specific feature sets, warp size, maximum threads per block, maximum shared memory per SM, and maximum shared memory per block.

**Goal:** Produce a contract matrix that keeps feature availability separate from numeric limits and makes no inference beyond the selected F06 rows.

**Constraints:** Use only the three exact queried values. Do not interpolate an unlisted capability, name a GPU product, infer application use of an available feature, convert a maximum into a recommendation, or attach a performance meaning to a larger number.

**Expected evidence:** Two tables: one feature-availability table with explicit Yes/No cells, and one numeric-limit table with units. Add one boundary sentence for product identity, one for performance, and one for compilation/runtime evidence.

**Acceptance criteria:** `7.5` has neither selected feature and no qualified feature set, with shared-memory maxima `64/64 KiB`; `9.0` has both selected features and an architecture-specific but no family-specific set, with `228/227 KiB`; `12.0` has both selected features and both qualified sets, with `100/99 KiB`. Every row keeps warp size `32` and maximum threads per block `1024`. No product or performance conclusion appears.

<details><summary>Hint 1</summary>Read “feature exists” and “numeric maximum” from different F06 tables before joining them by the exact capability key.</details>

<details><summary>Hint 2</summary>The shared-memory pair is ordered as per SM / per block. A larger pair is not a speed ranking.</details>

## Exercise 2: Repair four compiler-target plans

Review these proposed pairs:

| Plan | Selected compiler documentation | Proposed virtual / real target |
| --- | --- | --- |
| A | NVCC 11.8.0 | `compute_100` / `sm_100` |
| B | 12.9.2 archive, page label NVCC 12.9 | `compute_90a` / `sm_100` |
| C | Current Toolkit 13.3.1, page label NVCC 13.3 | `compute_100f` / `sm_120` |
| D | Current Toolkit 13.3.1, page label NVCC 13.3 | `compute_120` / `sm_120` |

**Goal:** Classify each plan as accepted by the selected compiler documentation and correctly scoped, or blocked, then give the smallest valid repair without claiming that compilation occurred.

**Constraints:** Check compiler acceptance before target compatibility. Preserve suffix semantics: baseline has no suffix, `a` is exact-capability, and `f` is owner-declared family scope. Do not assume that a numerically later real target accepts an `a` or `f` contract from another architecture or family. Do not change driver, GPU, OS, or evidence fields.

**Expected evidence:** A four-row review table containing compiler acceptance, feature-set scope, virtual/real relationship, verdict, repair, and still-unresolved environment checks.

**Acceptance criteria:** A is blocked because NVCC 11.8.0 does not list the selected 10.0 targets. B cannot carry the exact `90a` contract to `sm_100`; an architecture-specific 9.0 plan uses `compute_90a` / `sm_90a`. C cannot carry the 10.x family contract into the 12.x family; a 12.0 family plan uses `compute_120f` / `sm_120f`, or a baseline plan uses `compute_120` / `sm_120`. D is a valid baseline pair in the selected compiler documentation. Every verdict remains a plan review, not Compile-Checked or runtime evidence.

<details><summary>Hint 1</summary>First ask whether the exact NVCC page lists both names. Only then ask whether the suffix scope permits the pairing.</details>

<details><summary>Hint 2</summary>Architecture-specific PTX is exact. Family-specific PTX remains inside the family table; numeric ordering does not widen it.</details>

## Exercise 3: Fail closed, then reopen only the supported decisions

A request says: “This is a 24 GB Model Z, and `nvidia-smi` shows `CUDA Version: 13.3`, so use `compute_100a` and report that the environment is compatible and fast.” It supplies no direct compute-capability query, installed Toolkit, NVCC version, target listing, driver release field, OS boundary, artifact inspection, run, or measurement. Later, two facts are added: a direct query reports compute capability `10.0`, and the installed compiler reports NVCC `11.8.0`.

**Goal:** Write a two-stage decision ledger: first fail closed on the incomplete request, then record exactly which feature and limit facts become available after the direct query and why the requested target remains blocked by the compiler coordinate.

**Constraints:** Keep GPU model, memory, compute capability, Toolkit, driver, NVCC, host compiler, OS, artifact, execution, and measurement in separate fields. The `CUDA Version` banner is not the installed Toolkit. Do not infer compute capability from product or memory. Do not silently replace NVCC 11.8.0 with a newer lane. Make no compatibility or performance claim.

**Expected evidence:** A before/after ledger with observed value, source or query method, allowed decision, blocked decision, required next fact, and evidence effect columns. End with a target-plan sentence and an environment-status sentence.

**Acceptance criteria:** Stage one returns unknown and exposes no feature, limit, or target result. Stage two may apply the `10.0` F06 feature and numeric rows, but NVCC 11.8.0 does not accept `compute_100`, `compute_100f`, or `compute_100a`, so the requested plan remains blocked until an explicitly selected supporting compiler lane is present. Driver, host compiler, OS, artifact, runtime, correctness, and performance remain unresolved. Evidence axes stay unchanged.

<details><summary>Hint 1</summary>The direct capability query unlocks a hardware table row; it does not rewrite the compiler installed on the host.</details>

<details><summary>Hint 2</summary>A valid next step can be “select and record a supporting lane,” not “assume the newest lane.”</details>

## Next step

Complete the three contracts independently, then inspect the [reviewed solutions](/en/foundations/compute-capability/solutions/). Continue with [Practice Bank PB-R1-010](/en/practice/#pb-r1-010) for another capability-to-target packet with merged hardware and software coordinates.
