---
title: 'F01 Exercises: Predict, Implement, and Verify a First Kernel'
description: Check indexing predictions, a minimal implementation, and correctness evidence through three independent tasks.
pairId: f01-exercises
counterpart: /foundations/first-cuda-kernel/exercises/
factCheckDate: '2026-08-24'
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
unitId: F01-EXERCISES
prerequisites:
  - F01
relatedUnits:
  - F01
  - LAB02
exampleIds:
  - EX02
hardwareGate: 'None; implementation may be prepared without executing CUDA'
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f01-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F01 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F01,LAB02' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: 'None; implementation may be prepared without executing CUDA' }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/first-cuda-kernel/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F01: From Prediction to a First CUDA Kernel](/en/foundations/first-cuda-kernel/) first. All three Exercises can be answered without a GPU. Do not fill a runtime result when no run occurred.

## How to answer

Produce a reviewable artifact before opening hints in order. The implementation task starts from the [canonical EX02 project at its pinned commit](https://github.com/xiangzhang-coding/cuda-learning-site/tree/d69f7131acff7f8b1dfcd780b494426b5948735b/examples/ex02-vector-addition); do not reconstruct a complete program from the Learning Unit. Answers live on the separate [reviewed-solutions page](/en/foundations/first-cuda-kernel/solutions/).

## Exercise 1: Predict a partial block

**Goal:** For a one-dimensional launch with `element_count = 1003` and `blockDim.x = 256`, calculate the block count and give the global index and bounds state for four representative threads in the last block.

**Constraints:** Include `threadIdx.x = 0`, `234`, `235`, and `255`. Write the equation before substitution. Do not run code and infer the answer afterward.

**Expected evidence:** A table containing block count, `blockIdx.x`, `threadIdx.x`, global index, IN/OUT OF BOUNDS, and a reason.

**Acceptance criteria:** Use ceiling division, apply the correct index equation, state the legal range as `0..1002`, and correctly divide writing from skipping threads in the final block.

<details><summary>Hint 1</summary>Use the integer form `(element_count + blockDim.x - 1) / blockDim.x` for block count.</details>

<details><summary>Hint 2</summary>The final block has `blockIdx.x = 3`; compare every index with `element_count`.</details>

## Exercise 2: Complete the minimal ownership rule

**Goal:** In a local EX02 work copy, hide the kernel body, then reconstruct only the index, bounds check, and element-wise addition from F01's ownership model. Diff it against the canonical range afterward.

**Constraints:** Do not change the function signature, data types, host launch, or markers. Add no shared memory, loop, template, or optimization. The diff must not replace canonical source in the published project.

**Expected evidence:** Your temporary implementation, a diff against the `kernel` marker range, and three sentences explaining the jobs of index, bounds, and write.

**Acceptance criteria:** Each legal thread writes at most one element; out-of-bounds threads access no array; logical extent comes from `element_count`; final review states that canonical EX02 remains the sole published source.

<details><summary>Hint 1</summary>Write “who am I?” and “may I access data?” as two separate steps.</details>

<details><summary>Hint 2</summary>You need only `blockIdx.x`, `blockDim.x`, `threadIdx.x`, and one condition.</details>

## Exercise 3: Design a correctness acceptance record

**Goal:** Write a pre-run acceptance checklist for a future EX02 GPU run so another learner can decide whether execution completed and results were correct.

**Constraints:** Invent no output, time, or profiler data. Separate expected observations from recorded observations. Even when a community record qualifies for Community-Observed, retain Pending Hardware Verification until maintainer reproduction in a Reference Environment.

**Expected evidence:** A pre-run checklist covering the Environment Manifest, CUDA error path, CPU reference, tolerance rule, exit status, and empty observation fields.

**Acceptance criteria:** Include three allocations, two H2D copies, launch error, synchronization, D2H copy, CPU comparison, and three frees; state that absolute `1e-5` **or** relative `1e-5` acceptance is sufficient; make no performance inference.

<details><summary>Hint 1</summary>Separate “all API calls succeeded” from “every element passed the reference rule.”</details>

<details><summary>Hint 2</summary>`cudaGetLastError` covers the launch boundary; `cudaDeviceSynchronize` waits for execution completion.</details>

## Next step

Finish all three tasks independently, then inspect the [reviewed solutions](/en/foundations/first-cuda-kernel/solutions/). When a qualifying native Linux CUDA environment is available, use [LAB02](/en/labs/vector-addition/) to replace Exercise 3's empty record with your own observation.
