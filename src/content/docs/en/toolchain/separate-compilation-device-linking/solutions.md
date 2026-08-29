---
title: 'M18 Reviewed Solutions: Audit Device-Link Graphs and Build Artifacts'
description: Explicit RDC, device-link, and host-link graphs; library, object, and macro compatibility verdicts; and artifact-provenance and evidence repairs for the three M18 Exercises.
pairId: m18-solutions
counterpart: /toolchain/separate-compilation-device-linking/solutions/
factCheckDate: '2026-08-29'
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
unitId: M18-SOLUTIONS
prerequisites:
  - M18-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m18-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M18-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M18-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/toolchain/separate-compilation-device-linking/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [M18 Exercises](/en/toolchain/separate-compilation-device-linking/exercises/) as static symbol, link, artifact, and evidence reviews. They run no compiler or executable, do not replace the canonical EX10 source, and establish no compilation, runtime, or performance evidence.

## Solution 1: From whole-program failure to an explicit link graph

Symbol ownership is: `caller.cu` declares and calls external device `scale()`; `device_math.cu` supplies the only definition; `host_driver.cpp` has only a host edge. Ordinary `nvcc -c` produces whole-program executable device code and cannot preserve the caller's cross-file external device reference. The original plan is therefore invalid at the device boundary; the host linker cannot repair it.

The corrected ordered plan is:

| Stage | Inputs | Required action | Output or state |
| --- | --- | --- | --- |
| RDC compile A | `caller.cu` | `-dc` plus reviewed `compute_75`/`sm_75` clauses | `caller.o`, preserving a relocatable reference to `scale` |
| RDC compile B | `device_math.cu` | same `-dc` and target contract | `device_math.o`, supplying the relocatable definition |
| Host compile | `host_driver.cpp` | supported host compiler | `host_driver.o`, with no device-link edge |
| Device link | `caller.o`, `device_math.o` | explicit `--device-link` and the same final target set | `device_link.o`, with the device reference resolved |
| Host link | all three original objects plus `device_link.o` | `nvcc --no-device-link ...` | final host artifact, not executed |

The exact expansion of `-dc` is `--relocatable-device-code=true --compile`. Graph edges are `caller.cu -> caller.o -> device_link.o` and `device_math.cu -> device_math.o -> device_link.o`; then `caller.o`, `device_math.o`, `host_driver.o`, and `device_link.o` all enter the final host artifact. The device-link object adds the linked device image; it does not replace host code or registration state in the original objects.

The permitted conclusion is only that the plan expresses both link phases completely. No commands, exit statuses, or artifacts were observed, so no phase can be claimed to have succeeded.

## Solution 2: Library, object compatibility, and macro semantics

| Input | Device-link treatment | Mechanical verdict | Semantic or symbol result |
| --- | --- | --- | --- |
| `caller.o` | root RDC object | conditional on stated ABI, pointer, and target contract | external references remain until definitions are selected |
| `libmath.a` | static archive searchable by device linker | accept matching RDC member | its device definition can resolve the matching reference |
| `libplugin.so` | dynamic library ignored by device linker | ignore for device link | a device definition found only here remains unresolved, even if host link later consumes `.so` |
| `future.o` from 13.3.1 | ordinary object input | reject under the 12.9.2 linker | linker version is older than the object's Toolkit version |
| `variant.o` (`sm_86`, `compute_86`) | object input | mechanically conditional because the problem grants link-compatible SM, same ABI, and pointer size | reject semantic-safety claim until macro behavior is repaired |

The device-link command must also name every target architecture required by the final artifact. The given link compatibility of `sm_80` and `sm_86` satisfies only this problem's mechanical target premise. It cannot be inferred from their numbers or generalized to another pair.

The shared-header weak template in `variant.o` has different behavior under `compute_80` and `compute_86`. Link keeps one same-named instance, so a mechanically successful link cannot decide which semantics the caller receives. Apply one repair: compile every affected object for the same compute architecture, or remove the `__CUDA_ARCH__` behavior branch from the shared-header function. Then rebuild and relink before recording a result.

## Solution 3: Artifact pipeline and evidence packet

The corrected DAG is `caller.cu -> caller.o` and `device_math.cu -> device_math.o`; both RDC objects enter `device_link.o`; then **both original objects plus `device_link.o`** enter `app`. Final link uses `--no-device-link`, so it cannot hide the explicit device-link boundary inside a second implicit link.

The packet lacks at least: exact source commit, Toolkit Lane and NVCC version, OS and host compiler, dialect, pointer size, complete target clauses, every compile, device-link, and host-link command, input hashes, exit statuses, logs, output hashes, and a before-and-after symbol ledger. Four output hashes cannot reconstruct those causal edges.

| Existing item | Permitted fact | Rejected claim |
| --- | --- | --- |
| Object and link hashes | named bytes had recorded digests | bytes came from the claimed command or prove phase success |
| `device_link.o` filename | packet claims an artifact with that name | device symbols resolved or a kernel executed correctly |
| Static symbol ledger, if later supplied | inspection tool reported selected symbols | runtime loader selected an image or launch succeeded |
| Final host artifact | intended host-link output | execution, correctness, latency, throughput, or speedup |

A permitted reviewer statement is: "The packet describes an intended RDC -> device link -> host link graph and records four unqualified hashes. Exact provenance and phase records are absent, so M18 grants no compilation or runtime status and makes no runtime or performance claim."

EX10's Runtime-Not-Applicable is an independent status for EX10's artifact-only acceptance. It does not propagate to the M18 Learning Unit. All four M18 evidence arrays remain empty.

## Valid alternatives

- A production build may let `nvcc <objects>` coordinate device and host link implicitly, but an audit must still distinguish the two phase results. This exercise required an explicit split.
- Matching RDC definitions may live in a static archive searched by the device linker. A shared library cannot replace that archive for satisfying the same device reference.
- Unify the affected translation units' compute target or refactor the header to remove `__CUDA_ARCH__`-driven same-named weak or template behavior.
- Fail closed with conditional or indeterminate whenever compatibility or provenance is incomplete instead of guessing link success.

## Common errors

- Assuming host separate compilation automatically permits a cross-translation-unit device call.
- Applying `-dc` only to the caller or definition side.
- Treating `device_link.o` as the final executable or as a replacement for original CUDA host objects.
- Assuming the device linker resolves a device symbol from `.so` because the host linker can consume it.
- Comparing only SM numbers while ignoring ABI, pointer size, link compatibility, and linker-to-object Toolkit order.
- Ignoring shared-header `__CUDA_ARCH__` semantic divergence after a mechanical link succeeds.
- Treating a hash, symbol listing, link object, or final executable as execution, correctness, or performance evidence.

Reviewed: **2026-08-29**. Compilation and runtime evidence axes remain empty.
