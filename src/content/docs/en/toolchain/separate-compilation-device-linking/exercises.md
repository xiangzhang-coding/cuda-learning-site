---
title: 'M18 Exercises: Audit Device-Link Graphs and Build Artifacts'
description: Repair a cross-translation-unit RDC pipeline, audit library and object compatibility plus __CUDA_ARCH__ risks, and separate link artifacts from evidence claims in three static tasks.
pairId: m18-exercises
counterpart: /toolchain/separate-compilation-device-linking/exercises/
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
unitId: M18-EXERCISES
prerequisites:
  - M18
relatedUnits:
  - M18
  - EX10
  - M17
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m18-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M18-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M18 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M18,EX10,M17' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/toolchain/separate-compilation-device-linking/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M18: Separate Compilation and Device Linking](/en/toolchain/separate-compilation-device-linking/) first. These Exercises create symbol and link graphs, command plans, compatibility matrices, and evidence ledgers only. They invoke no `nvcc`, produce no artifact, execute no CUDA, and add no Evidence Status.

## Instructions

For every task, identify each declaration, definition, translation unit, RDC object, device-link input and output, host-link input and output, and unresolved symbol. Then record target, ABI, pointer size, Toolkit linker version, library kind, and `__CUDA_ARCH__` behavior. Compare your work with the [reviewed solutions](/en/toolchain/separate-compilation-device-linking/solutions/) only after completing all three audits.

## Exercise 1: Rebuild a whole-program failure as an explicit link graph

**Goal:** A kernel in `caller.cu` calls an external `__device__ scale()` defined only in `device_math.cu`; `host_driver.cpp` only calls a host launch wrapper. The original plan runs ordinary `nvcc -c` separately, then passes the objects directly to the host linker. Identify the failure boundary and rewrite it as a source -> RDC objects -> device-link object -> final host artifact graph and ordered command plan.

**Constraints:** Both CUDA translation units must use `-dc`, and you must state its long-option equivalence. Every device compile and device-link row uses the same reviewed `compute_75` and `sm_75` target contract. Device link names its output explicitly. Final host link consumes both original CUDA objects and the device-link object and uses `--no-device-link` to preserve the phase boundary. Do not invent a device-link edge for the pure-host object. Do not execute the final artifact.

**Expected evidence:** A symbol-ownership table, directed link graph with at least five nodes, four-stage command ledger, unresolved or resolved state for each artifact, and separate device-link and host-link acceptance checks.

**Acceptance criteria:** Reject whole-program objects because the caller's external device reference crosses a translation unit. Expand `-dc` as `--relocatable-device-code=true --compile`. Pass both `caller.o` and `device_math.o` to device link. Treat `device_link.o` only as host-link input. Also pass the original CUDA objects to final host link. Make no runtime or performance claim.

<details><summary>Hint 1</summary>Draw the device-symbol edge `caller.o -> scale definition` before drawing host-artifact edges. The host linker cannot resolve that first edge for the device linker.</details>

<details><summary>Hint 2</summary>`device_link.o` does not replace the original CUDA host objects. It adds the linked device image, while the originals can still carry host registration code.</details>

## Exercise 2: Audit library, object compatibility, and macro semantics

**Goal:** A 64-bit Toolkit 12.9.2 device link uses `caller.o` as its root. `libmath.a` contains a same-ABI, same-pointer-size `compute_80`/`sm_80` RDC definition. `libplugin.so` contains another device definition and is its only source. `future.o` was produced by Toolkit 13.3.1. `variant.o` has the same ABI and pointer size plus problem-stated link-compatible `sm_86` code, but was compiled with `compute_86`; it and `caller.o` instantiate the same weak template from a header whose behavior depends on `__CUDA_ARCH__`. Give separate mechanical-link and semantic-safety verdicts.

**Constraints:** Distinguish static-archive and shared-library treatment by device and host linkers. Check that the linker Toolkit version is not older than its objects. Check ABI, pointer size, link-compatible SM, and desired target set. Do not let the stated `sm_80`/`sm_86` link compatibility hide different compute assumptions. Mark each input accept, ignore, reject, or conditional and identify unresolved symbols.

**Expected evidence:** A five-row input matrix, device-symbol-resolution graph, target and linker-version gate, mechanical-versus-semantic verdict, and at least one of the two valid `__CUDA_ARCH__` repairs.

**Acceptance criteria:** The device linker may consider `libmath.a`. It ignores `.so`, so the only device definition there cannot resolve a reference. The 12.9.2 linker rejects `future.o` from a newer Toolkit. Even if `variant.o` passes the mechanical gates, the current shared-header behavior is not semantically safe. Repair by requiring the same compute architecture or removing macro-dependent behavior from the shared-header function.

<details><summary>Hint 1</summary>"The host linker can load `.so`" and "the device linker resolves a device symbol from `.so`" are different propositions.</details>

<details><summary>Hint 2</summary>Split compatibility into two layers: can the objects link mechanically, and do same-named weak or template definitions express the same behavior in every translation unit?</details>

## Exercise 3: Repair an artifact pipeline and evidence packet

**Goal:** A packet claims it produced `caller.o`, `device_math.o`, `device_link.o`, and `app`. Its final host command passes only `caller.o` and `device_link.o`, omits `device_math.o`, and does not suppress implicit device link. The packet has four hashes but no exact source commit, Toolkit Lane, host compiler, full commands, exit statuses, target set, or symbol ledger. A reviewer claims that successful device link proves the kernel ran correctly and made the program faster. Repair the pipeline and permitted claim.

**Constraints:** Preserve EX10's canonical order: `device-link-contract` followed by `artifact-pipeline`. Write four explicit boundaries: RDC compile, device link, host link with `--no-device-link`, and static inspection. List every missing field required by a qualifying compilation record. Never execute the final artifact. M18's compilation, runtime, and observation arrays remain empty and cannot inherit EX10's Runtime-Not-Applicable status.

**Expected evidence:** A corrected artifact DAG, final host-link input list, provenance-gap table, artifact-to-claim classification, and a permitted reviewer statement of at most two sentences.

**Acceptance criteria:** Final host link consumes `caller.o`, `device_math.o`, and `device_link.o` while explicitly preventing a repeated device link. A hash binds bytes only. A symbol ledger records static symbol observations only. Missing qualifying records grant no Compile-Checked status. No link artifact proves execution, correctness, latency, throughput, or speedup.

<details><summary>Hint 1</summary>Prefix each hash with "generated by which exact command, in which Lane, from which input bytes" to expose the missing provenance.</details>

<details><summary>Hint 2</summary>A final executable is a host-link output. The word "executable" is not execution evidence without a separate execution, completion, and oracle record.</details>

## Next

Inspect the separate [reviewed solutions](/en/toolchain/separate-compilation-device-linking/solutions/) and then audit [Practice Bank PB-R2-010](/en/practice/#pb-r2-010). Use [TERM-037](/en/glossary/#term-037), [TERM-122](/en/glossary/#term-122), [TERM-123](/en/glossary/#term-123), and [TERM-124](/en/glossary/#term-124) to label graph nodes and phase boundaries, and compare related [EX10](/en/examples/ptx-fatbinary-inspection/) with [M17](/en/toolchain/compiler-architecture-targets/).
