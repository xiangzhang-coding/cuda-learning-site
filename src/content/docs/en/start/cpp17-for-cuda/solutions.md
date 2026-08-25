---
title: 'O04 Reviewed Solutions: Lifetime and Host/Device Boundaries'
description: Reviewed reasoning, valid alternatives, and common errors for the two O04 Exercises.
pairId: o04-solutions
counterpart: /start/cpp17-for-cuda/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O04-SOLUTIONS
prerequisites:
  - O04-EXERCISES
relatedUnits:
  - O04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O04 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/cpp17-for-cuda/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [O04 Exercises](/en/start/cpp17-for-cuda/exercises/). Compare the lifetime and stage reasoning before comparing a proposed rewrite. No CUDA program or sanitizer was run for these answers.

## Solution 1: Review a lifetime and ownership timeline

The qualifying timeline has two independent lines:

1. The RAII owner controls the allocation lifetime from successful acquisition through release.
2. `view` is a copied, non-owning pointer value whose permitted use interval must fit entirely inside that allocation lifetime.

Submitting work does not transfer ownership by itself. Destroying the owner releases the allocation, while the bits stored in `view` may remain unchanged. From that release until the last possible use, `view` is dangling. A later completion boundary cannot retroactively make the earlier release valid.

**Reasoning:** The safety condition is an ordering edge: every possible use completes before release. The smallest correction keeps the RAII owner in scope, reaches and checks the completion boundary, and only then permits destruction. The view is passed with its extent and is not retained beyond that boundary. Another correct design moves the owner into an operation object whose lifetime ends only after completion.

This review establishes a source-level lifetime contract only. It records no execution or timing result.

## Solution 2: Review host/device build and error boundaries

The defects belong to separate stages:

| Boundary | Review result | Correction |
| --- | --- | --- |
| preprocessing | the declaration becomes visible, but the generic definition does not | make the required definition visible to the instantiating path |
| host compilation | the host version may use host-only facilities only if the body is separated from device compilation | isolate host exception policy in host-only code |
| device compilation | `convert<float>` needs a visible device-valid definition; `throw` is unsupported | provide a device-valid definition and no device exception path |
| device linking | required when the build uses relocatable device code | supply every relocatable device definition when this mode is used |
| host linking | host objects and Runtime libraries must resolve | keep declarations, definitions, and explicit instantiations consistent |
| host runtime boundary | discarding `cudaError_t` loses the CUDA failure channel | compare with `cudaSuccess` and preserve call-site and error details |

**Reasoning:** A reliable arrangement either puts the complete `__host__ __device__` template definition in a header where both compilation paths can instantiate it, or explicitly instantiates supported specializations in CUDA-compiled implementation code and exposes matching declarations. If the operation is truly host-only, remove the device annotation and keep its implementation on the host instead of forcing one body through both compilers.

The Runtime return value is checked before any optional host adapter converts failure into an exception. That host exception can use RAII during stack unwinding, but it never crosses into device code. Passing preprocessing, compilation, and linking would still provide no GPU execution evidence.

## Valid alternatives

- Keep the owner in the caller through an explicit completion operation, or transfer it into a longer-lived operation state. Either design must make release occur after the final possible use.
- Put a template definition in a header for implicit instantiation, or use explicit instantiation for a closed set of supported types. A host-only template may remain in ordinary C++ implementation code when no device path requires it.
- Return `cudaError_t` through host layers, or translate it once into a typed host exception. Both are valid when the original CUDA code, call site, and message remain observable.

## Common errors

- Treating a copied pointer as a second owner or assuming the copy extends allocation lifetime.
- Assuming owner destruction writes `nullptr` into every raw pointer copy.
- Releasing an allocation after submission but before the last possible asynchronous use.
- Believing a template declaration in a header makes a generic definition in another translation unit visible.
- Reviewing a `__host__ __device__` body only as host code.
- Throwing from device code or using a host exception as an unrecorded replacement for `cudaError_t`.
- Treating a successful build or clean sanitizer run as proof about unexecuted paths.

Reviewed: **2026-08-26**. These solutions provide reasoning and designs, with no compilation, GPU execution, sanitizer output, or performance claim.
