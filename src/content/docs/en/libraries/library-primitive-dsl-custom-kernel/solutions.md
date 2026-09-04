---
title: 'L01 Reviewed Solutions: Decision Packets Before Custom Kernels'
description: Review a provisional primitive baseline, a fair comparison protocol, lifetime ownership, valid alternatives, and common decision errors.
pairId: l01-solutions
counterpart: /libraries/library-primitive-dsl-custom-kernel/solutions/
factCheckDate: '2026-09-04'
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
unitId: L01-SOLUTIONS
prerequisites:
  - L01-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l01-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/library-primitive-dsl-custom-kernel/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/libraries/library-primitive-dsl-custom-kernel/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed solutions for the [L01 Exercises](/en/libraries/library-primitive-dsl-custom-kernel/exercises/). They evaluate static decision records. No candidate was built, executed, or measured, so all performance cells remain `unrecorded`.

## Solution 1: Provisional baseline

The domain-library row is deferred because no domain operation was specified. CCCL reusable primitives are eligible for the pinned 12.9.2 and 13.3.1 rows because reduction and scan semantics can be stated exactly; this establishes a provisional baseline, not speed or local availability. The DSL is eligible only after its language, generator, artifact, cache, and fallback contracts are supplied. Custom kernels are deferred because no semantic gap or correctness-qualified material performance gap exists. The owner must validate component integration, outputs, streams, storage, and the full workload. Revisit when a required contract fails or controlled evidence identifies a material gap. CUDA 11.8 requires a separate component coordinate.

## Solution 2: Fair comparison protocol

Create one immutable input corpus and shape distribution. Run the same CPU reference and tolerance check before accepting every sample. Record Toolkit, CCCL/custom commit, compiler, GPU, clocks/power policy, host, stream, allocation and storage policy, command, warmup, repetitions, statistic, and observation date. Choose either steady-state execution or complete lifecycle as the primary boundary and apply it to both candidates; report a second boundary separately if useful. Synchronize or use events according to the declared endpoint so incomplete asynchronous work cannot shorten one result. A failed output, environment drift, allocation fallback, or profiler/clock anomaly invalidates the comparison. Until such a run exists, there is no winner.

## Solution 3: Ownership and portability

The DSL ledger names an owner for the problem specification, generator and compiler pin, options, generated-artifact inspection, cache key and invalidation, correctness/performance acceptance, deployment fallback, upgrade, rollback, and removal. The custom ledger names an owner for source and review, architecture dispatch, compiler and Toolkit rows, tests, sanitizer/profiler diagnosis, tuning records, fallback, incident response, handoff, upgrade, rollback, and removal. Each supported row is explicit; absent rows are unsupported. Revisit the DSL when the language cannot express a requirement or generation regresses, and revisit custom code when its measured advantage disappears or the supported matrix expands.

## Valid alternatives

- Choose a production library provisionally if an exact domain operation and lifecycle contract are supplied.
- Choose the DSL provisionally if the constrained family is repeated and its generated artifact plus fallback can be accepted before deployment.
- Keep two candidates when they serve different workload regions, provided dispatch, validation, measurement, and ownership remain explicit.
- Reject the project entirely when no option satisfies correctness or deployment constraints.

## Common errors

- Rank options from API familiarity or source-line count.
- Time candidates with different semantics, inputs, setup, or completion boundaries.
- Infer a component version from the Toolkit label despite an independent override.
- Treat owner CI, documentation, or a profiler hypothesis as local performance evidence.
- Call generated code ownerless or count only the first custom implementation cost.
- Omit rollback, unsupported rows, or the trigger that reopens the decision.

Review date: **2026-09-04**. All four evidence arrays remain empty.
