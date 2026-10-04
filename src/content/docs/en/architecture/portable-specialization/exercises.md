---
title: 'H06 Exercises: Dispatch and Comparison Boundaries'
description: Repair fallback selection and make an asynchronous comparison meaningful.
pairId: h06-exercises
counterpart: /architecture/portable-specialization/exercises/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, dispatch, comparison, review]
resourceKind: exercise-set
unitId: H06-EXERCISES
prerequisites: [H06]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'PTX bulk copy', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,dispatch,comparison,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H06 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/portable-specialization/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite: [H06](/en/architecture/portable-specialization/). Submit a dispatch truth table and a corrected comparison protocol. Paper reasoning needs no GPU; execution is **Pending Hardware Verification**. Reviewed 2026-10-04, [SRC-CUDA-108](/en/sources-and-versions/#src-cuda-108).

## Exercise 1: fallback before launch

**Goal:** audit a 100f executable on devices 10.3 and 12.1 under `portable`, `auto`, `specialized` and an invalid mode. A proposed handler catches every failed specialized launch and prints “specialized PASS” after running ordinary code.

**Constraints:** preserve EX25's integer contract, target profiles and error semantics. A hardware failure is not an eligibility decision. No experimental API or new precision mode.

**Acceptance:** state each pre-launch selection or rejection, identify the false success label and context-reuse hazard, and propose tests for unknown CC, cross-family CC, absent specialization and invalid mode. Explain what each host test cannot prove about GPU execution.

<details><summary>Hint 1</summary>Explicit specialization and automatic selection have different failure contracts.</details>
<details><summary>Hint 2</summary>Intersect the compiled target set with observed CC before launching. Never erase an asynchronous error through fallback.</details>

## Exercise 2: completion and comparable work

**Goal:** repair a synthetic protocol that initializes a 128-arrival barrier, has only thread 0 arrive, and times only bulk-copy submission against a complete portable kernel.

**Constraints:** keep the 256-int32 tile, 128 threads, one issuer, 1024 expected bytes, aligned storage and unchanged outputs. Use EX25's five warmups and ten 100-launch samples. No measured values are supplied.

**Acceptance:** correct arrival accounting, phase wait, consumer publication and storage lifetime. Define equivalent event intervals, independent full-output/guard checks, missing-counter handling and separate expected versus recorded fields. Explain why a larger stage count requires a new proof.

<details><summary>Hint 1</summary>A transaction barrier tracks both arrivals and bytes; the consumer count need not equal the arriver count.</details>
<details><summary>Hint 2</summary>Measure the completed load/consume kernel on both paths; report batch milliseconds and the number of launches.</details>

## Review separately

Read [solutions](/en/architecture/portable-specialization/solutions/) after attempting both, then [PB-R7-006](/en/practice/#pb-r7-006). Original CC BY 4.0; owner references retain their notices.
