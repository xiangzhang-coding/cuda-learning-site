---
title: 'M17 Exercises: Design and Audit Compiler-Target Artifact Plans'
description: Design an all-Lane baseline SASS/PTX plan, repair qualified suffix and Lane matrices, and audit artifact and deployment compatibility claims through three static tasks.
pairId: m17-exercises
counterpart: /toolchain/compiler-architecture-targets/exercises/
factCheckDate: '2026-08-29'
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
unitId: M17-EXERCISES
prerequisites:
  - M17
relatedUnits:
  - M17
  - EX10
  - VIS09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m17-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M17-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M17 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M17,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/toolchain/compiler-architecture-targets/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M17: Choosing Compiler Architecture Targets](/en/toolchain/compiler-architecture-targets/) first. These Exercises produce only commands, target matrices, artifact ledgers, and compatibility verdicts. They invoke no compiler, inspect no binary, select no runtime image, and run no CUDA, so they add no Evidence Status.

## Instructions

For every task, state the source requirement first, followed by the exact Toolkit Lane, virtual assumptions, real SASS target, same-scope PTX fallback, expected artifact entries, and unresolved deployment fields. Use only the six selected M17/F06 pairs. Compare your three static audits with the [reviewed solutions](/en/toolchain/compiler-architecture-targets/solutions/) only after completing them.

## Exercise 1: Design an all-Lane baseline artifact plan

**Goal:** A portable source uses only the baseline 7.5 feature set. Release policy requires SASS for the named 7.5 target plus a same-scope PTX fallback. Write an explicit `--generate-code` plan and verification ledger separately for NVCC 11.8.0, the 12.9.2 archive, and selected Toolkit 13.3.1.

**Constraints:** All three Lanes may use only the reviewed `compute_75` / `sm_75` pair. Every plan needs one real-code clause and one PTX clause, with no shorthand. Separate requested, successful build, inspected entry, deployment compatibility, and runtime behavior into five columns. Do not claim that any of the three builds happened.

**Expected evidence:** A three-row Lane matrix, token-auditable command fragment, two expected entries, and a gate list from build through artifact inspection to deployment review.

**Acceptance criteria:** Every row contains `arch=compute_75,code=sm_75` and `arch=compute_75,code=compute_75`; virtual assumptions remain baseline; the plan requests SASS plus PTX without predicting runtime selection; build, inspection, driver, GPU, correctness, and performance remain unresolved; evidence arrays do not change.

<details><summary>Hint 1</summary>`code=sm_75` and `code=compute_75` are different outputs, but they share the same `arch=compute_75` source contract.</details>

<details><summary>Hint 2</summary>Documentation acceptance fills only the target-name cell. Without an exit status and inspected artifact, every other evidence cell stays empty.</details>

## Exercise 2: Repair qualified suffix and Lane matrices

**Goal:** Five source variants require exact 9.0, family 10.0, exact 10.0, family 12.0, and exact 12.0 feature scopes. A reviewer removes every suffix, sorts variants numerically, and says one plan can enter all three Lanes. Restore the virtual/real pair, same-scope PTX fallback, and eligible reviewed Lane rows for every variant.

**Constraints:** Use only `compute_90a` / `sm_90a`, `compute_100f` / `sm_100f`, `compute_100a` / `sm_100a`, `compute_120f` / `sm_120f`, and `compute_120a` / `sm_120a`. NVCC 11.8.0 must fail closed. The 12.9.2 and 13.3.1 cells state owner-row acceptance only. Derive no unreviewed cross-pair from a number, feature-set inclusion, or family label.

**Expected evidence:** A five-row requirement-to-target table, two `--generate-code` clauses per row, a three-Lane acceptance matrix, and one reviewer conclusion about baseline, `a`, and `f` scopes.

**Acceptance criteria:** Exact variants use `a`, family variants use `f`, every real target implements its paired virtual assumptions, and every PTX clause retains the same suffix. All qualified variants are blocked in the selected 11.8.0 row and accepted only in the selected 12.9.2/13.3.1 rows. Make no broad-catalog, runtime, or performance claim.

<details><summary>Hint 1</summary>Choose the suffix from the source requirement before reading the compiler row. Do not sort targets by capability number first.</details>

<details><summary>Hint 2</summary>Copy each real clause and change only `code=sm_...` to the same-named `code=compute_...`; this exposes an accidental scope change.</details>

## Exercise 3: Audit an artifact and deployment compatibility packet

**Goal:** A 12.9.2 release packet contains planned clauses only. Plan F requests `compute_100f` / `sm_100f` plus `compute_100f` PTX. Plan A requests `compute_120a` / `sm_120a` plus `compute_120a` PTX. With no build log or inspection output, the packet claims that (1) Plan F covers every GPU with capability number at least 10.0, (2) Plan A covers every GPU at least 12.0, (3) PTX guarantees minor-version compatibility with an older same-major driver, and (4) target names prove runtime selection and successful execution. Repair every claim.

**Constraints:** Produce a six-stage ledger for request, build, inspection, scope, deployment, and runtime. Apply current feature-set scope plus Why CUDA Compatibility, Minor Version Compatibility, and Forward Compatibility boundaries. Guess no actual GPU, driver, package, library, embedded entry, or selected image. Compilation and runtime evidence stay empty.

**Expected evidence:** Four claim verdicts, two corrected scope statements, a minor/forward compatibility gate, a missing-fields list, and one permitted final reviewer statement.

**Acceptance criteria:** `100f` is restricted to the named family in the current owner table, while `120a` is exact to 12.0. PTX removes neither suffix scope. The older same-major minor path requires target architecture/SASS, and owner material warns about the PTX restriction. A cross-major forward path separately requires an eligible system and applicable compatibility package. The static packet reports no runtime selection, execution, correctness, or speed.

<details><summary>Hint 1</summary>Put target scope and driver compatibility path in separate columns. Passing the first does not fill the second.</details>

<details><summary>Hint 2</summary>The minor-version owner page has explicit PTX and target-architecture caveats. Forward Compatibility is another path with system and package gates.</details>

## Next

Inspect the separate [reviewed solutions](/en/toolchain/compiler-architecture-targets/solutions/) and then audit [Practice Bank PB-R2-009](/en/practice/#pb-r2-009). Use [TERM-060](/en/glossary/#term-060) through [TERM-063](/en/glossary/#term-063) for target and scope labels, and [TERM-118](/en/glossary/#term-118) through [TERM-121](/en/glossary/#term-121) for PTX, cubin, fatbinary, and SASS. When comparing [VIS09](/en/visuals/artifact-pipeline/) with related [EX10](/en/examples/ptx-fatbinary-inspection/), keep a declared plan, a retained artifact record, and a runtime claim distinct.
