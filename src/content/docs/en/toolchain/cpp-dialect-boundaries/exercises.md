---
title: 'M19 Exercises: Build a Dialect Matrix and Audit the C++23 Probe'
description: Reconstruct the C++17/C++20 Lane declarations, classify current documentation and immutable R1 history, and design a supported-GCC-14 retained-record publication gate through three static matrix and probe tasks.
pairId: m19-exercises
counterpart: /toolchain/cpp-dialect-boundaries/exercises/
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
unitId: M19-EXERCISES
prerequisites:
  - M19
relatedUnits:
  - M19
  - EX02
  - EX10
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m19-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M19-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M19 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M19,EX02,EX10' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/toolchain/cpp-dialect-boundaries/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M19: CUDA C++17, C++20, and C++23 Dialect Boundaries](/en/toolchain/cpp-dialect-boundaries/) first. These Exercises construct matrices, claim ledgers, and probe packets only. They execute no compiler, host executable, or GPU executable and add no Evidence Status.

## Instructions

In every answer, separate language-standard provenance, Toolkit/NVCC declaration, host-compiler gate, requested compilation phase, actual retained record, and claim scope. Do not present source eligibility, workflow definition, or a static page build as a probe result. Compare your work with the [reviewed solutions](/en/toolchain/cpp-dialect-boundaries/solutions/) only after completing all three tasks.

## Exercise 1: Reconstruct the teaching matrix from versioned sources

**Goal:** Reconstruct the M19/EX10 dialect matrix for the three selected Toolkit Lanes. The 11.8.0 NVCC option reference ends at C++17; the 12.9.2 Linux guide and NVCC reference extend through C++20; the current 13.3 Programming Guide and Linux guide list C++23 while the current NVCC option reference still ends at C++20.

**Constraints:** Give separate columns for Toolkit, ordinary EX10 builds, and C++23 treatment. Permit only C++17 for 11.8.0, C++17/C++20 for 12.9.2, and C++17/C++20 for ordinary EX10 builds on 13.3.1. C++23 may appear only as the separate 13.3.1 `cxx23-probe`; it must not enter an ordinary row or be projected backward into an older Lane.

**Expected evidence:** A three-row matrix, one declaration-versus-evidence explanation, and the owner-source role behind each row.

**Acceptance criteria:** All three rows exactly match the specified dialects; the five ordinary rows are Compile-Checked from retained run 33266515216; 13.3.1 C++23 is a separate retained narrow probe pass; neither 11.8.0 nor 12.9.2 has a C++23 row.

<details><summary>Hint 1</summary>Write the ordinary rows first, then add a separate probe column. Do not infer archive behavior from the newest guide.</details>

<details><summary>Hint 2</summary>A declared build row says what will be checked; a retained pass record says whether the check passed.</details>

## Exercise 2: Classify the documentation mismatch and R1 probe

**Goal:** Audit four inputs: the current Programming Guide C++23 entry, the current Linux guide supported C++23 dialect, the current NVCC `--std` list ending at C++20, and the retained EX02 CUDA 13.3.1/NVCC 13.3.73/GCC 13.3.0 `unsupported` record. State which claims each input can and cannot support.

**Constraints:** Record the current guide's C++23 minima: GCC 14, Clang 18, NVHPC/`nvc++` 24.3, with Microsoft Visual Studio/MSVC unsupported. Preserve the GCC 13.3 record as immutable R1 history and explain that it falls below the GCC minimum. Derive neither a broad pass nor a broad failure from the documentation mismatch.

**Expected evidence:** A four-row claim ledger, one supported-host intersection rule, and one exact sentence for the R1 historical conclusion.

**Acceptance criteria:** Owner documentation and observed records occupy separate layers; the GCC 13.3 result constrains only the exact historical combination; the GCC 14.2 probe pass constrains only the exact EX10/Toolkit/NVCC/GCC coordinate; ordinary C++23 Compile-Checked remains undeclared.

<details><summary>Hint 1</summary>The Programming Guide dialect-specific minimum and the Linux guide broad supported range form an intersection, not a choice.</details>

<details><summary>Hint 2</summary>The historical unsupported record disproves "GCC 13.3 passed," but cannot predict a GCC 14 probe that has not run.</details>

## Exercise 3: Design the C++23 retained-record publication gate

**Goal:** A reviewer sees the EX10 `cxx23-probe` source, GCC 14 Dockerfile, workflow row, and retained pass and wants to publish the broad statement "CUDA 13.3.1 supports C++23." Repair the proposal and audit the exact scope of the qualifying record packet.

**Constraints:** Use retained run 33266515216, source commit `16256cbeded889cb1a45f2461585317ed3fe0296`, canonical range `cxx23-probe`, CUDA 13.3.1, NVCC 13.3.73, and GCC 14.2.0. The packet must retain environment identity, command, complete diagnostics, exit status, language-guard outcome, object hash and inspection, and a no-execution statement. Do not use an unsupported-host bypass. The conclusion is only a narrow `C++23-Dialect-Probe` pass, never ordinary C++23 support.

**Expected evidence:** An ordered gate checklist, a pass/reject decision table, and an admissible narrow claim template no longer than two sentences.

**Acceptance criteria:** Source and workflow presence stay separate from actual result; the `__cplusplus >= 202302L` and `if consteval`/`static_assert` guards are checked; neither host nor GPU executable runs; the successful record supports only the exact EX10 + Toolkit 13.3.1 + NVCC 13.3.73 + GCC 14.2.0 combination; claims about another compiler, platform, runtime, or performance are rejected.

<details><summary>Hint 1</summary>A retained record URL and identity permit an exact narrow pass, not a broader subject or matrix.</details>

<details><summary>Hint 2</summary>Put the scope in the sentence: source, Toolkit, NVCC, GCC, platform, phase, and no-runtime boundary all matter.</details>

## Next

Inspect the separate [reviewed solutions](/en/toolchain/cpp-dialect-boundaries/solutions/) and then audit [Practice Bank PB-R2-011](/en/practice/#pb-r2-011). Use [TERM-125](/en/glossary/#term-125), [TERM-116](/en/glossary/#term-116), and [TERM-117](/en/glossary/#term-117) to keep dialect, host compiler, and compilation-phase scope separate.
