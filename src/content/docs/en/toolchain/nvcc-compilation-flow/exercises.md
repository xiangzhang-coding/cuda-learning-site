---
title: 'M15 Exercises: Audit NVCC Phases and Artifact Flow'
description: Separate documented phases from internal steps, reconstruct the host/device artifact trajectory, and repair whole-program, host-compiler, and evidence-boundary errors through three static tasks.
pairId: m15-exercises
counterpart: /toolchain/nvcc-compilation-flow/exercises/
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
unitId: M15-EXERCISES
prerequisites:
  - M15
relatedUnits:
  - M15
  - M16
  - M18
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
    attrs: { name: 'cuda:pair-id', content: m15-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M15-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M15 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M15,M16,M18,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/toolchain/nvcc-compilation-flow/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M15: NVCC Host/Device Compilation Flow](/en/toolchain/nvcc-compilation-flow/) first. These Exercises create only phase matrices, artifact graphs, host-compiler gates, and evidence audits. They do not run NVCC, generate an artifact, or add Evidence Status.

## Instructions

For every task, name the input suffix, requested documented phase, output artifact, host/device ownership, next boundary, and claim that expressly does not follow. Keep stable phases separate from internal steps, and keep build, artifact inspection, link, run, and performance separate. Compare your work with the [reviewed solutions](/en/toolchain/nvcc-compilation-flow/solutions/) only after completing all three tasks.

## Exercise 1: Separate stable phases from an internal transcript

**Goal:** Audit a build plan. It requests preprocessed text from `unit.cu`, then separately requests PTX, a host-linkable object, a final executable, and a convenience run. Its author also copied temporary filenames, private subcommands, and internal option order from one `nvcc --dryrun` display into the long-lived build script. Design documented phase plans for the five requested boundaries and remove unstable dependencies.

**Constraints:** Every row must state the input suffix, phase option or default, primary result, and later boundary not established. Use the documented distinctions among `--preprocess`, `--ptx`, `--compile`, default/final link, and `--run`. Retain no internal subcommand and make no cross-release stability claim for one.

**Expected evidence:** A five-row phase ledger, a stable/unstable classification, and a replacement build plan that invokes only public NVCC phases.

**Acceptance criteria:** The input suffix defines the phase input and the option defines requested output; `--ptx` produces a device-only artifact; `--compile` stops at an object; final link and `--run` remain separate; displayed internal steps are rejected as a debugging trace only.

<details><summary>Hint 1</summary>Work backward from each requested output to its phase rather than starting from the first command in the dry-run transcript.</details>

<details><summary>Hint 2</summary>If a name describes only a temporary file or hidden-tool invocation and is absent from the documented supported-phase list, it cannot become a build dependency.</details>

## Exercise 2: Reconstruct both trajectories of a mixed `.cu`

**Goal:** A `.cu` file contains an unannotated `prepare`, a `__device__` `transform`, a `__global__` `kernel`, and a `__host__ __device__` `clamp`. Draw the path from device preprocessing through PTX/cubin/fatbinary, plus the path through a second host preprocessing, synthesized host C++, a supported host compiler, host object, and final link.

**Constraints:** Mark the path on which every entity must be valid. Distinguish the embedded fatbinary in an ordinary object build from the standalone device-only output of explicit `--fatbin`. Add a host-compiler support gate for the Toolkit, platform, and compiler version. Do not describe the source split as a textual cut after one preprocessing pass.

**Expected evidence:** A two-lane artifact graph, annotation-ownership table, host-compiler decision gate, and ordered ledger for `.ptx`, `.cubin`, `.fatbin`, `.cu.cpp.ii`, `.o`, and executable.

**Acceptance criteria:** The device and host paths each preprocess; PTX and cubin are packaged into a fatbinary; synthesized host C++ embeds the fatbinary and goes to a supported host compiler; the host object precedes final link; no artifact is presented as execution evidence.

<details><summary>Hint 1</summary>`__host__ __device__` requires a valid version on each path; it does not move one machine-code body between processors at runtime.</details>

<details><summary>Hint 2</summary>Place the `--cuda` output between host preprocessing/synthesis and the host object; place standalone `--fatbin` at a device-only stopping boundary.</details>

## Exercise 3: Repair whole-program and evidence claims

**Goal:** `producer.cu` defines a `__device__` callee. `consumer.cu` only declares it and calls it from a kernel. A plan compiles both files separately with `--compile` in default mode, then claims the final host link will resolve the device reference. It also declares Runtime-Verified because it finds `.ptx`, `.o`, and executable files, and declares a speedup because one artifact is smaller. Diagnose and repair the plan and claims.

**Constraints:** State the exact device boundary of default whole-program mode. Give one source-layout repair that preserves default mode, and identify the alternative that must explicitly enter M18's relocatable-device-code and device-link contract. Classify compilation, runtime, and performance evidence separately. Do not compile or benchmark.

**Expected evidence:** A cross-file-reference fault ledger, two-branch repair decision, host-link/device-link boundary map, and rejected/allowed claim table.

**Acceptance criteria:** Default mode prohibits device code from referencing an entity in a separate file, and a device-link step has no effect in that mode; final host link cannot replace device link; co-location or visibility can preserve default mode, while the alternative needs M18; artifact existence supports at most a bounded inspection claim, not runtime correctness or speedup.

<details><summary>Hint 1</summary>First ask whether the missing symbol belongs to the host graph or device graph. The host linker resolves the former and cannot retroactively perform the latter's compilation contract.</details>

<details><summary>Hint 2</summary>"A file exists," "the program ran and passed an oracle," and "performance improved" require three different records; the first cannot imply the other two.</details>

## Next

Inspect the separate [reviewed solutions](/en/toolchain/nvcc-compilation-flow/solutions/) and then audit [Practice Bank PB-R2-007](/en/practice/#pb-r2-007). Use [TERM-115 NVCC](/en/glossary/#term-115), [TERM-116 host compiler](/en/glossary/#term-116), and [TERM-117 compilation phase](/en/glossary/#term-117) to keep phase and tool roles distinct.
