---
title: 'T02 Exercises: Protect Loads and Stores'
description: Repair a masking proposal and design a boundary-sensitive correctness test without running an unsafe kernel.
pairId: t02-exercises
counterpart: /triton/masked-vector-addition/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T02-EXERCISES
prerequisites: [T02]
relatedUnits: [EX23]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton masked memory semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper exercise', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/masked-vector-addition/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T02 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX23 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/masked-vector-addition/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite `[T02]`: read [T02](/en/triton/masked-vector-addition/) and inspect [EX23](/en/examples/triton-vector-add/). Review the proposed changes on paper; do not run intentionally unmasked memory accesses. All evidence arrays remain empty. Source review: 2026-09-14, [SRC-CUDA-087](/en/sources-and-versions/#src-cuda-087).

## Exercise 1: selecting a value is not guarding a load

**Goal:** repair a proposal that uses `tl.where(i < N, tl.load(a + i), 0.0)` for the first input, masks only the second input load, and stores the sum without a mask. Use `N=259, B=128`.

**Constraints:** keep the elementwise operation and equal input lengths. Describe changes against canonical source rather than maintaining a second full kernel. Do not treat the padded output guard as valid output.

**Acceptance:** calculate the program count, final valid and invalid index ranges, and identify each unsafe operation. Specify both load masks, fill values and store mask; explain why selecting zero cannot protect an already evaluated load.

<details><summary>Hint 1: reason about evaluation order</summary>The arguments to `where` are evaluated before it selects values. The memory operation needs its own predicate.</details>
<details><summary>Hint 2: there are three accesses to protect</summary>The last program begins at 256. Derive validity from `i < 259`; propagate that predicate to each pointer-tensor load/store, not merely to the arithmetic.</details>

## Exercise 2: catch a missing final output

**Goal:** a mutation changes the store predicate from `i < N` to `i < N-1`. Design a test that fails deterministically even when the last expected sum is zero.

**Constraints:** use a CPU reference and inspect every output after completion. Do not depend on uninitialized memory, a checksum, or inspecting only the prefix. Include at least one exactly divisible size and one partial-block size.

**Acceptance:** specify initialization, chosen sizes, comparison/finite rules, guard checks and what each detects. State why a passing CPU simulation cannot establish GPU correctness.

<details><summary>Hint 1: avoid a lucky initial value</summary>A zero-filled output can hide a missed store when the expected value is zero. Choose a sentinel excluded by the acceptance rule.</details>
<details><summary>Hint 2: test two different boundaries</summary>Use 256 and 257, and reject any nonfinite valid output. Keep the logical-output check separate from the untouched-tail check.</details>

## Review separately

Compare with the [solutions](/en/triton/masked-vector-addition/solutions/) after writing your test contract. The [Practice Bank](/en/practice/#pb-r5-014) adds a separate report-review problem.
