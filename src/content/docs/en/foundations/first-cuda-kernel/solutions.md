---
title: 'F01 Reviewed Solutions: Predict, Implement, and Verify a First Kernel'
description: Separate reviewed solutions, valid alternatives, and common errors for the three F01 Exercises.
pairId: f01-solutions
counterpart: /foundations/first-cuda-kernel/solutions/
factCheckDate: '2026-08-24'
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
unitId: F01-SOLUTIONS
prerequisites:
  - F01-EXERCISES
relatedUnits:
  - F01
  - LAB02
exampleIds:
  - EX02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f01-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F01,LAB02' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/first-cuda-kernel/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [F01 Exercises](/en/foundations/first-cuda-kernel/exercises/). Compare reasoning and acceptance boundaries before comparing final numbers.

## Solution 1: Predict a partial block

The block count is `(1003 + 256 - 1) / 256 = 4`, and the final block has `blockIdx.x = 3`.

| `threadIdx.x` | global index | bounds | reason |
| ---: | ---: | --- | --- |
| 0 | 768 | IN BOUNDS | `768 < 1003` |
| 234 | 1002 | IN BOUNDS | It owns the final legal element |
| 235 | 1003 | OUT OF BOUNDS | It equals the logical extent |
| 255 | 1023 | OUT OF BOUNDS | It exceeds the logical extent |

The final block therefore has 235 legal threads and 21 out-of-bounds threads. The out-of-bounds threads were launched but must skip array access.

## Solution 2: Complete the minimal ownership rule

A qualifying temporary implementation has only three actions: multiply the block coordinate by block size and add the coordinate within the block to obtain a one-dimensional global index; compare `index < element_count`; and add matching input elements into output only when that condition holds. Its semantics should match EX02's `kernel` marker range.

The diff exists to expose extra work, a missing bound, or an incorrect equation. It does not create another published source. Keep the learning record after review, but every page and download continues to point at canonical EX02.

## Solution 3: Design a correctness acceptance record

A qualifying record has four groups:

1. **Environment and command:** complete Environment Manifest, pinned EX02 commit, selected C++17 Toolkit Lane, exact build/run command, one GPU, and compute capability 7.5 or newer.
2. **Execution boundary:** three allocations, two H2D copies, launch error, synchronization, D2H copy, and three frees all pass error checking; the process exits with status zero.
3. **Result boundary:** the independent CPU reference compares every element; accept when absolute difference is `<= 1e-5` or relative difference is `<= 1e-5 * scale`; fail only when neither accepts.
4. **Observation boundary:** before execution, record only expected observations and leave recorded observations empty. After a real run, attach date, logs, and criterion results. Infer no performance without a measurement plan.

This template does not grant Runtime-Verified automatically. A learner record may first be evaluated for Community-Observed under O02; the site retains Pending Hardware Verification until maintainers reproduce it in a Reference Environment.

## Valid alternatives

- Replace the table with a coordinate diagram containing equations, provided all four required threads and their bounds reasons remain reviewable.
- Write pseudocode before local CUDA C++, but compare the final local implementation with the canonical marker range and never publish it as a second source.
- Store the correctness record as structured JSON or Markdown. Field names may differ, but execution, result, evidence, and unobserved boundaries must remain distinct.

## Common errors

- Using floor division `N / blockDim.x` and dropping the final three elements.
- Treating global index `1003` as the last valid element; a zero-based range ends at `1002`.
- Believing the bounds check prevents out-of-bounds threads from launching.
- Checking only `cudaGetLastError` without waiting for execution errors, or synchronizing without checking launch.
- Requiring both absolute and relative tolerances; EX02 accepts either.
- Recording a host test, Compile-Checked, or an expected `PASS` as a GPU runtime observation.

Reviewed: **2026-08-24**. These solutions execute no CUDA and produce no runtime or performance record.
