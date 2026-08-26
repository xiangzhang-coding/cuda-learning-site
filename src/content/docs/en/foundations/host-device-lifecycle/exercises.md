---
title: 'F04 Exercises: Review an Explicit Host-Device Lifecycle'
description: Use three deep Exercises to review lifecycle order, failure-path ownership, and GPU evidence boundaries.
pairId: f04-exercises
counterpart: /foundations/host-device-lifecycle/exercises/
factCheckDate: '2026-08-26'
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
unitId: F04-EXERCISES
prerequisites:
  - F04
relatedUnits:
  - F04
  - O04
  - EX03
exampleIds:
  - EX03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F04,O04,EX03' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/host-device-lifecycle/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F04: The Explicit Host-Device Resource Lifecycle](/en/foundations/host-device-lifecycle/) first. All three Exercises can be completed through static review. Do not fill a runtime observation when no real GPU run occurred.

## How to answer

Produce your resource ledger, repair plan, or evidence matrix before opening hints in order. When implementation review is needed, start from the [canonical EX03 project at the pinned commit](https://github.com/xiangzhang-coding/cuda-learning-site/tree/b5d0dab070946eedc41e2bfe0106b67d8c01706b/examples/ex03-multidimensional-indexing). Do not reconstruct a second complete program from the Learning Unit. Answers live on the separate [reviewed-solutions page](/en/foundations/host-device-lifecycle/solutions/).

## Exercise 1: Reconstruct order and last-use boundaries

A review note scrambles nine actions: D2H copy-back, release device output, initialize host data, kernel launch, allocate device buffers, host comparison, H2D transfer, `cudaDeviceSynchronize`, and `cudaGetLastError`.

**Goal:** Restore the canonical success path and mark owner, first usable state, last use, and release responsibility for host input, device input, device output, and host output.

**Constraints:** Keep all nine actions. Do not decide order by running the program and inspecting the result. State that `cudaMalloc` does not initialize storage. Do not collapse a pointer value and its allocation into one resource.

**Expected evidence:** An ordered lifecycle ledger with at least action, owner, state before, state after, last use, and cleanup obligation columns, followed by four sentences explaining the four resource classes.

**Acceptance criteria:** The exact order is host initialization, device allocation, H2D, launch, `cudaGetLastError`, `cudaDeviceSynchronize`, D2H, host comparison, release. All three last-use boundaries are correct. The comparison verdict is saved before cleanup and returned after cleanup.

<details><summary>Hint 1</summary>Find three producer relationships first: host initialization produces the H2D source, the kernel produces device output, and D2H produces host-comparison input.</details>

<details><summary>Hint 2</summary>Successful synchronization establishes that device-input last use has ended; successful D2H establishes that device-output last use has ended; host-output last use is comparison.</details>

## Exercise 2: Design cleanup that is safe after partial failure

Suppose EX03 needs three device allocations. The first two `cudaMalloc` calls succeed and the third fails. A separate success-path defect returns immediately when host comparison finds a mismatch, skipping cleanup.

**Goal:** Design a control-flow repair so acquisition, use, comparison, and release satisfy ownership and last-use rules on both success and failure paths.

**Constraints:** Release only successfully acquired allocations, exactly once each. After failure, execute no copy, launch, or comparison that depends on the failed result. Preserve F04's nine-step success order. Introduce no streams, managed memory, or second published implementation.

**Expected evidence:** A path table covering allocations 1/2/3, launch, synchronization, copy-back, comparison, and cleanup, plus review-only pseudocode or structured steps. Mark the cleanup state reached from every failure point.

**Acceptance criteria:** Failure of allocation 3 releases only allocations 1 and 2. Launch or synchronization failure performs no D2H/comparison. Comparison saves its verdict before cleanup. Every return occurs after cleanup. The plan can be checked against EX03's `lifecycle` range.

<details><summary>Hint 1</summary>Give each allocation an “unacquired/acquired/released” state. This is easier to review than asking whether a pointer merely looks non-null.</details>

<details><summary>Hint 2</summary>A single cleanup block or an explicit owner can work. Either must decouple the mismatch verdict from resource release.</details>

## Exercise 3: Repair a set of out-of-bounds evidence claims

A review packet says: “host-only tests passed, so the kernel ran correctly”; “the source compiled, so runtime is verified”; and “the static lifecycle table shows the sequence, so every API in it executed.” The packet contains no GPU log or Reference Environment record.

**Goal:** Split each sentence into subject, actual evidence, allowed claim, forbidden inference, and still-empty observation fields, then state the correct status separately for EX03 and the F04 Learning Unit.

**Constraints:** Invent no command, output, date, hardware, or performance. A host-only test covers only the host contract it actually runs. Keep compilation and runtime on separate axes. A static teaching table receives no CUDA Evidence Status.

**Expected evidence:** A three-row claim-review matrix and two final status sentences: one for EX03 and one for the F04 Learning Unit.

**Acceptance criteria:** Narrow all three original claims. Retain Pending Hardware Verification for EX03. Keep F04's compilation/runtime axes empty. State that only actual GPU execution satisfying the declared environment and acceptance criteria can supply a runtime observation, and make no performance inference.

<details><summary>Hint 1</summary>Ask what each artifact actually executed: host code, a compiler, or a GPU kernel.</details>

<details><summary>Hint 2</summary>Evidence Status belongs to a specific subject. Do not copy EX03's Pending Hardware Verification onto the Learning Unit.</details>

## Next step

Complete all three tasks independently, then compare them with the [reviewed solutions](/en/foundations/host-device-lifecycle/solutions/). Continue to [Practice Bank PB-R1-008](/en/practice/#pb-r1-008) for a longer lifecycle-record review.
