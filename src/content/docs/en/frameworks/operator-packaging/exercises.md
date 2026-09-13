---
title: 'P10 Exercises: Build Once, Import Cleanly'
description: Implement a wheel acceptance procedure and diagnose compiler mismatch and source-tree shadowing.
pairId: p10-exercises
counterpart: /frameworks/operator-packaging/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: exercise-set
unitId: P10-EXERCISES
prerequisites: [P10]
relatedUnits: [EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p10-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/operator-packaging/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P10-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P10 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX22 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/operator-packaging/exercises/" lang="zh-CN">阅读中文对应页</a>

## Exercise contract

Prerequisite: [P10](/en/frameworks/operator-packaging/). Use [EX22](/en/examples/adjacent-energy/)'s selected matrix, not whichever torch is already installed. Written audit work needs no GPU; executing a build requires the declared native Linux toolchain.

## Exercise 1: Implement an artifact acceptance procedure

**Goal:** Build a wheel containing both native paths and prove that a fresh process imports the installed artifact, not an editable checkout.

**Constraints:** Use the existing hash-locked application environment, exact Toolkit/NVCC and compiler, explicit architecture list, no dependency re-resolution and no JIT fallback at import. Preserve previous results.

**Expected evidence:** Submit commands and stage exit codes, wheel hash, Python ABI, torch/CUDA/compiler identities, resolved package and extension paths, plus a second matching venv import plan or actual report.

**Acceptance criteria:** Build and install the one wheel; pip check succeeds; isolated imports resolve to site-packages; CPU checks succeed from the installed package. CUDA absence is a separately recorded blocker rather than a passing CUDA test.

<details><summary>Hint 1: Locate the artifact</summary><p>A build directory containing an extension is not proof the wheel contains it. Ask which file the fresh Python process actually loaded.</p></details>
<details><summary>Hint 2: Remove the accidental source path</summary><p>Use python -I, avoid editable installation, and install the wheel into another matching environment. Keep compiler setup outside the import command.</p></details>

## Exercise 2: Debug a “works here” release

**Goal:** Audit a candidate using torch 2.11.0+cu128, local NVCC 13.3, and an editable installation whose import resolves inside the source tree.

**Constraints:** A recent driver does not replace Toolkit matching. Do not rename the wheel, bypass version checks or treat a successful source import as a packaging test.

**Expected evidence:** Name the independent compiler and artifact-selection defects. Specify the expected stop stage, corrected toolchain, clean rebuild and negative import experiment with the installed _C removed from a disposable environment.

**Acceptance criteria:** The mismatch is rejected before compilation; rebuilding uses NVCC 12.8.93 and the selected matrix. A missing installed _C causes import failure; it never silently loads a source copy or compiles one.

<details><summary>Hint 1: Driver and compiler answer different questions</summary><p>The driver may execute CUDA programs while the extension builder still uses incompatible headers and compiler output. Inspect torch.version.cuda and local nvcc separately.</p></details>
<details><summary>Hint 2: A successful fallback is a failed test</summary><p>For the negative experiment, a successful import means another artifact satisfied it. Check the resolved path and eliminate that alternative before evaluating the wheel.</p></details>

## Review

Open the [separate solutions](/en/frameworks/operator-packaging/solutions/) after your attempt, then audit [PB-R5-010](/en/practice/#pb-r5-010). [SRC-CUDA-085](/en/sources-and-versions/#src-cuda-085) records the exact 2026-09-13 build and rights review.
