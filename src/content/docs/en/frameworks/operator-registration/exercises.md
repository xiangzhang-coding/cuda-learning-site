---
title: 'P09 Exercises: Metadata and Derivatives'
description: Implement a symbolic fake kernel and backward, then diagnose a misleading integration report.
pairId: p09-exercises
counterpart: /frameworks/operator-registration/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: exercise-set
unitId: P09-EXERCISES
prerequisites: [P09]
relatedUnits: [EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p09-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/operator-registration/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P09 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX22 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/operator-registration/exercises/" lang="zh-CN">阅读中文对应页</a>

## Exercise contract

Complete [P09](/en/frameworks/operator-registration/) first. Implement in your [EX22](/en/examples/adjacent-energy/) copy using PyTorch 2.11.0+cu128. Written predictions require no GPU; executed checks retain their actual device and results.

## Exercise 1: Metadata and a vector-Jacobian product

**Goal:** Implement storage-free fake registration and a differentiable backward for the native adjacent-energy operator.

**Constraints:** Preserve native shape, layout, dtype, device, extent and fresh-output checks; read no fake data. Save x through setup_context and use only differentiable PyTorch operations in backward, including n=1.

**Expected evidence:** Submit a diff and derive y and dx for `x=[-1,1,0]`, `g=[2,-3]`. List the fake output metadata for contiguous input length 5 with storage offset 2. Add numerical first/second derivative and opcheck cases.

**Acceptance criteria:** Derived values match the implementation; output has no input alias; singleton backward is one zero; invalid native/fake inputs agree; opcheck and float64 gradcheck serve distinct recorded purposes.

<details><summary>Hint 1: Differentiate an edge</summary><p>Each squared difference contributes negatively to its left input and positively to its right input, multiplied by that output's upstream derivative.</p></details>
<details><summary>Hint 2: Pad contributions</summary><p>Compute q=2*diff(x)*g. A zero padded on the left places positive contributions; a zero on the right places negative contributions. Their difference also handles an empty q.</p></details>

## Exercise 2: Debug a false acceptance report

**Goal:** Diagnose a candidate whose fake returns empty_like(x), backward returns a zero tensor, and report says “opcheck passed, therefore gradients are correct.”

**Constraints:** Do not weaken the output contract or remove opcheck. The report supplies no actual test logs, only the assertion above; do not invent a observed failure transcript.

**Expected evidence:** Identify the fake shape mismatch and the invalid inference about derivatives. Propose independent tests that fail each defect separately, including a nonuniform upstream vector and two lengths in fullgraph dynamic compilation.

**Acceptance criteria:** The fake is repaired to n-1 with fresh storage metadata. The derivative is checked numerically rather than certified by integration checks. Missing logs remain missing; a corrected implementation is not called Runtime-Verified.

<details><summary>Hint 1: Separate the report from reality</summary><p>A written “pass” is not an executed result. Even a real integration pass would not replace the mathematical derivative comparison.</p></details>
<details><summary>Hint 2: Choose a nonconstant input</summary><p>A constant input has zero differences and can hide a zero-gradient bug. Pick unequal adjacent values and multiply their outputs by unequal upstream weights.</p></details>

## Review

Compare the [separate solutions](/en/frameworks/operator-registration/solutions/) after attempting both tasks. Continue with [PB-R5-009](/en/practice/#pb-r5-009). [SRC-CUDA-084](/en/sources-and-versions/#src-cuda-084) records the 2026-09-13 API/source boundary.
