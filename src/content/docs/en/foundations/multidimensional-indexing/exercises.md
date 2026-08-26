---
title: 'F03 Exercises: Diagnose and Repair Multidimensional Indexing Contracts'
description: Use three independent tasks to check non-divisible coordinates, x/y/z bounds, and row-major flattening defects.
pairId: f03-exercises
counterpart: /foundations/multidimensional-indexing/exercises/
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
unitId: F03-EXERCISES
prerequisites:
  - F03
relatedUnits:
  - F03
  - VIS02
  - EX03
  - F04
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
    attrs: { name: 'cuda:pair-id', content: f03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F03,VIS02,EX03,F04' }
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

<a class="locale-pair" data-locale-counterpart href="/foundations/multidimensional-indexing/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F03: Make Multidimensional Indexing and Bounds a Correctness Contract](/en/foundations/multidimensional-indexing/) first. All three Exercises can be completed through static reasoning and host-only checks. Do not fill in a device result without a real CUDA run.

## How to answer

Produce the required reviewable artifact before opening hints in order. Implementation review starts from the [canonical EX03 project at its pinned commit](https://github.com/xiangzhang-coding/cuda-learning-site/tree/09e30fba5bc0e9e8dc9ecf54e17806a041d9aee6/examples/ex03-multidimensional-indexing); do not reconstruct a second program from the Learning Unit. Use the separate [reviewed solutions](/en/foundations/multidimensional-indexing/solutions/) after completing your work.

## Exercise 1: Classify a three-dimensional partial fringe

**Goal:** For a three-dimensional launch with `width = 10`, `height = 7`, `depth = 5`, and `blockDim = (4, 3, 2)`, calculate the grid shape and classify four threads in the final block `blockIdx = (2, 2, 2)`: `threadIdx = (1, 0, 0)`, `(2, 0, 0)`, `(1, 1, 0)`, and `(1, 0, 1)`.

**Constraints:** Write `gx`, `gy`, and `gz` separately. Test every axis before flattening a legal thread. Do not inspect VIS02 or run a program before making the prediction.

**Expected evidence:** A table containing grid shape, block/thread coordinates, global coordinates, all three x/y/z bounds predicates, final IN/OUT state, and the linear index for a legal thread.

**Acceptance criteria:** Derive grid shape `(3, 3, 3)`; identify `(9, 6, 4)` as the sole legal global coordinate with index `349`; make the other three threads skip for x, y, and z respectively; calculate no accessible index for an invalid coordinate.

<details><summary>Hint 1</summary>The per-axis block counts are `ceil(10 / 4)`, `ceil(7 / 3)`, and `ceil(5 / 2)`.</details>

<details><summary>Hint 2</summary>The final legal coordinate is `(width - 1, height - 1, depth - 1)`. Apply `((gz * height) + gy) * width + gx` only to it.</details>

## Exercise 2: Repair x/y/z bounds protection

**Goal:** Review a three-dimensional kernel that returns only when `gx >= width AND gy >= height AND gz >= depth`, then repair it so any out-of-range x, y, or z axis prevents access.

**Constraints:** The guard must precede flattening and every array access. Do not clamp coordinates, change extents, or shrink the launch to hide the defect. Supply three counterexamples in which only x, only y, and only z is invalid.

**Expected evidence:** The original and repaired conditions, a per-axis truth table for all three counterexamples, and an explanation of why invalid predicates use `OR` or valid predicates use `AND`.

**Acceptance criteria:** The repair returns for `gx >= width OR gy >= height OR gz >= depth`, or encloses every access only when all three `<` predicates hold. All three single-axis counterexamples stop before flattening; a valid coordinate still performs exactly one access.

<details><summary>Hint 1</summary>Ask whether any legal element exists when one axis is invalid, not whether all three axes are invalid together.</details>

<details><summary>Hint 2</summary>Substitute the three OUT threads from Exercise 1 into the original condition. Its `AND` evaluates to false for each one.</details>

## Exercise 3: Repair flattening while preserving an independent reference boundary

**Goal:** In a local EX03 work copy, diagnose the incorrect mapping `((gx * height) + gy) * depth + gz`, restore the site's declared x-fastest row-major mapping, and design a host-only check that catches the dimension swap.

**Constraints:** Use `width` as the row stride and `width * height` as the layer stride. The CPU reference must not read kernel output as its expected value or invoke the defective mapping under test. Include at least `(0, 0, 0)`, `(1, 0, 0)`, `(0, 1, 0)`, `(0, 0, 1)`, and `(9, 6, 4)`. Retain the non-divisible `10 x 7 x 5` case.

**Expected evidence:** The pre- and post-repair equations, a five-coordinate expected-index table, a local diff against the canonical implementation/reference ranges, and one explicit statement of the host-only evidence boundary.

**Acceptance criteria:** Produce `((gz * height) + gy) * width + gx` or an algebraic equivalent; derive indices `0`, `1`, `10`, `70`, and `349` in order; make the defective mapping fail the check; claim neither GPU execution nor performance.

<details><summary>Hint 1</summary>First ask how much the linear index should increase when x, y, or z increases by one.</details>

<details><summary>Hint 2</summary>Generate coordinates and values with independent nested host loops. Do not let the expected and tested paths share one flatten helper.</details>

## Next step

Finish all three tasks independently, then inspect the [reviewed solutions](/en/foundations/multidimensional-indexing/solutions/). You can also review another bounds-and-layout defect set in [Practice Bank PB-R1-007](/en/practice/#pb-r1-007).
