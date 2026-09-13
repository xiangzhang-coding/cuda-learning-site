---
title: 'P12 Exercises: Audit Dispatch Evidence'
description: Build a backend verification matrix and diagnose semantic changes disguised as fallback.
pairId: p12-exercises
counterpart: /frameworks/sdpa-dispatch-verification/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, matrix, debugging, review]
resourceKind: exercise-set
unitId: P12-EXERCISES
prerequisites: [P12]
relatedUnits: [VIS18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p12-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/sdpa-dispatch-verification/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,matrix,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P12 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: VIS18 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/sdpa-dispatch-verification/exercises/" lang="zh-CN">阅读中文对应页</a>

## Exercise contract

Complete [P12](/en/frameworks/sdpa-dispatch-verification/). Use PyTorch 2.11.0+cu128 facts only. Written predictions require no GPU; runtime rows require the external environment and actual artifacts. All scenarios below are constructed.

## Exercise 1: Design a discriminating matrix

**Goal:** Distinguish enabled policy, eligibility and observed execution for the fixed `[1,2,128,64]` input across AUTO and four singleton backends.

**Constraints:** Preserve rounded inputs, no mask/dropout/GQA, scale=0.125 and P12's dtype-specific tolerances. A CPU range alone cannot label a CUDA backend. Use native BF16 gating and retain unsupported rows.

**Expected evidence:** Submit matrix columns for dtype, strides, policy, eligibility/diagnostic, backend event, device kernels, completion, error, tolerances, source/build and manifest. Include hypothetical CPU-only trace, multiple backend events and forced-ineligible cases in the report parser's tests.

**Acceptance criteria:** Missing/ambiguous device evidence fails closed; ineligible differs from failed execution; numerical mismatches cannot be swallowed as skips. An AUTO result is never inferred from the requested list order.

<details><summary>Hint 1: Use the policy context</summary><p>A singleton context prevents silent math fallback; a multi-backend list enables choices and only set_priority=True requests list order.</p></details>
<details><summary>Hint 2: Correlate before naming</summary><p>Match the exact ATen backend event with completed device work. A generic SDPA range or eligibility predicate is insufficient.</p></details>

## Exercise 2: Debug a semantic fallback

**Goal:** Audit a program that removes a Boolean mask after a fused candidate is rejected, uses dropout_p=0.2 in evaluation, and loosens tolerance until its output passes.

**Constraints:** The intended operation includes the mask and deterministic inference without dropout. Do not rewrite the oracle, silently cast inputs or claim that eval disables functional dropout.

**Expected evidence:** Explain three independent defects and propose a reference-preserving fallback or explicit unsupported result. Specify a new source review and matrix for the masked request, which is outside P12's narrow executable fixture.

**Acceptance criteria:** Preserve True-means-participates mask semantics and scale, explicitly pass dropout_p=0.0, fix tolerance before comparison, and record determinism separately from accuracy. No backend name or VIS18 animation proves these properties.

<details><summary>Hint 1: Re-read the requested equation</summary><p>Removing a mask changes which keys participate. It is a different operation even if the tensor shapes stay the same.</p></details>
<details><summary>Hint 2: Keep three decisions independent</summary><p>Dropout probability, backend eligibility and numerical acceptance are separate controls; none should be changed just to make a row green.</p></details>

## Review

Compare the [separate solutions](/en/frameworks/sdpa-dispatch-verification/solutions/) and [PB-R5-012](/en/practice/#pb-r5-012). [SRC-CUDA-086](/en/sources-and-versions/#src-cuda-086) records exact source and rights, reviewed 2026-09-13.
