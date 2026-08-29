---
title: 'M15 Reviewed Solutions: Audit NVCC Phases and Artifact Flow'
description: Documented-phase replacements, the mixed-source host/device trajectory, and whole-program, host-link/device-link, and evidence repairs for the M15 Exercises.
pairId: m15-solutions
counterpart: /toolchain/nvcc-compilation-flow/solutions/
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
unitId: M15-SOLUTIONS
prerequisites:
  - M15-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m15-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M15-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M15-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/toolchain/nvcc-compilation-flow/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [M15 Exercises](/en/toolchain/nvcc-compilation-flow/exercises/) as static phase and artifact reviews. They do not replace canonical EX10 source, invoke NVCC, generate or inspect a real artifact, link an executable, or establish compilation, runtime, or performance evidence.

## Solution 1: Separate stable phases from an internal transcript

The replacement ledger retains only documented phase requests:

| request | input | stable selection | primary result | still not established |
| --- | --- | --- | --- | --- |
| preprocess | `unit.cu` | `--preprocess` / `-E` | preprocessed text | compilation, link, run |
| PTX | `unit.cu` | `--ptx` / `-ptx` | device-only `unit.ptx` | host object, link, run |
| object | `unit.cu` | `--compile` / `-c` | host-linkable `unit.o`/`unit.obj` | final link, run |
| executable | source/object inputs | no phase option, or explicit link selection | executable | execution, correctness, performance |
| convenience run | build inputs plus run request | `--run` / `-run` | execution attempt | passed oracle, coverage, performance conclusion |

The suffix defines the phase input and the phase option defines requested output. Each request may use an explicit output path so artifacts do not overwrite one another, but this does not change phase semantics.

Temporary names, internal executables, and subcommand order in a `--dryrun` or verbose transcript are all **unstable implementation details**. They can diagnose the current invocation but cannot become durable build edges. The replacement script invokes only documented NVCC phases and checks each phase's exit status and expected output identity. This paper plan does not claim those calls have succeeded.

## Solution 2: Reconstruct both trajectories of a mixed `.cu`

Annotation ownership is: `prepare` needs only a host version; `transform` needs only a device version; the `kernel` definition enters the device path while its launch expression is transformed on the synthesized host path; and `clamp` must produce separately valid host and device versions.

The device lane is `.cu -> device preprocessing -> PTX and/or cubin -> fatbinary image`. In an ordinary object flow, that image continues to the host lane for embedding. Explicit `--ptx`, `--cubin`, or `--fatbin` instead stops at its device-only artifact and discards the `.cu` host code.

The host lane is `.cu -> second preprocessing -> synthesized host C++ with embedded fatbinary -> supported host compiler -> host object -> final host link`. `--cuda` exposes the `.cu.cpp.ii` boundary, and `--compile` exposes the `.o` or `.obj` boundary. Final link combines host objects and libraries with required CUDA runtime libraries.

The host-compiler gate records the selected Toolkit, platform, compiler executable and version, and support result. A compiler's presence on `PATH`, or acceptance of an invocation under `--allow-unsupported-compiler`, is not support. If the gate fails, the plan must stop or disclose the unsupported configuration; the appearance of an object file cannot rewrite the support claim.

The complete graph describes only translation ownership and artifact boundaries. It executes no kernel.

## Solution 3: Repair whole-program and evidence claims

The fault belongs to the device graph. Default whole-program mode prohibits device code from referencing an entity in a separate file, and device-link steps have no effect in that mode. Delivering two host-linkable objects to the final host linker cannot make the host linker retroactively compile or link the missing cross-file device definition.

**Repair while preserving default mode:** Make the required callee definition visible to `consumer.cu` device compilation within the same whole-program boundary, for example through a source or header arrangement that exposes the definition in that translation unit while satisfying the C++ definition and ODR contract.

**Repair by changing mode:** Deliberately enable relocatable device code, produce objects containing relocatable device code, perform the documented device link, and then perform final host link. That is M18's full contract; adding a casual `--device-link` word to the original plan is insufficient.

Claim audit:

| observation | bounded conclusion | rejected conclusion |
| --- | --- | --- |
| `.ptx`, `.o`, or executable names exist | files can be selected for further identity and type checks | Compile-Checked, Runtime-Verified |
| exact command, log, source, compiler, and artifact inspection passes | only the specifically recorded compilation and inspection criteria may qualify | GPU execution, correct output |
| GPU run with an Environment Manifest and oracle passes | only the recorded runtime-correctness claim | speedup |
| controlled measurements with a declared comparison pass | only the scoped performance result | universal faster claim |

Artifact size alone establishes neither instruction quality, runtime selection, elapsed time, nor speedup. M15 has none of the observed records above, so all evidence arrays remain empty.

## Valid alternatives

- Use `--cuda` when only the transformed host boundary needs inspection instead of depending on an internal temporary host-source name.
- Request `--ptx`, `--cubin`, or `--fatbin` directly when only device output is needed, and state that the phase discards host code.
- Drive baseline final link with NVCC so it coordinates required CUDA link inputs, while still recording device and host links separately.
- Keep required device definitions within one translation-unit boundary for a small whole-program source; enter M18 when cross-file device calls are truly needed.
- Check the selected Toolkit and platform matrix when host-compiler support is uncertain; never use a bypass flag to fabricate support.

## Common errors

- Treating `--dryrun` or verbose output as a copyable public build recipe.
- Naming only a phase option without recording the input suffix and requested output.
- Treating `.ptx`, `.cubin`, or `.fatbin` as outputs that also contain the ordinary host program.
- Assuming the host and device paths share one preprocessing pass, or treating `__host__ __device__` as one runtime body.
- Treating an installed host compiler as a supported host compiler.
- Treating a host object as an executable or final host link as device link.
- Ignoring the default whole-program device boundary and expecting the host linker to repair a cross-file device reference.
- Declaring runtime correctness or performance from artifact existence or size.

Reviewed: **2026-08-29**. Compilation and runtime evidence axes remain empty.
