---
title: 'A01 Exercises: Prove Map Ownership and Data Movement'
description: Build an element owner table, a symbolic memory-movement ledger, and a grid-stride ownership proof in three tasks.
pairId: a01-exercises
counterpart: /algorithms/elementwise-map/exercises/
factCheckDate: '2026-08-30'
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
unitId: A01-EXERCISES
prerequisites:
  - A01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a01-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/elementwise-map/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A01 }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/elementwise-map/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [A01: Elementwise Map and One Owner per Element](/en/algorithms/elementwise-map/) first. These Exercises ask for an owner table, symbolic ledgers, and proofs. They require no CUDA-capable system and produce no runtime or performance evidence.

## Instructions

For each task, state the contract before the expected reasoning. Keep facts proven from indices and bounds separate from facts that require a run. Inspect the separate [reviewed solutions](/en/algorithms/elementwise-map/solutions/) only after completing all three tasks.

## Exercise 1: Build an owner table for a rounded-up grid

**Goal:** For a one-dimensional launch with `n = 10`, `blockDim.x = 4`, and `gridDim.x = 3`, list all 12 threads with their `blockIdx.x`, `threadIdx.x`, global index, bounds predicate, and output action.

**Constraints:** Use `i = blockIdx.x * blockDim.x + threadIdx.x`; every valid element must have exactly one owner; indices 10 and 11 must not load or store; do not remove extra threads or add an atomic or barrier.

**Expected evidence:** One 12-row owner table, a set of write sets, and a short coverage and uniqueness proof.

**Acceptance criteria:** `output[0]` through `output[9]` each appear exactly once; global indices 10 and 11 have a false predicate and a skip action; the write sets of any two valid threads are disjoint.

<details><summary>Hint 1</summary>Expand local thread indices block by block, then calculate each global index.</details>

<details><summary>Hint 2</summary>An extra thread is still launched; its bounds predicate only prevents access to the logical array.</details>

## Exercise 2: Separate arithmetic from memory movement

**Goal:** Write two symbolic ledgers for `output[i] = left[i] + right[i]`. In scenario A, both inputs begin on the host and the host finally reads the output. In scenario B, inputs already reside on the device and another device kernel consumes the output.

**Constraints:** Use only `n`, `sizeof(float)`, and operation counts; list H2D, kernel global loads, kernel global stores, and D2H separately; do not equate requested values with hardware transactions or supply timing, bandwidth, or speedup.

**Expected evidence:** Two movement tables, one element-arithmetic summary, and a paragraph explaining why both scenarios implement the same mathematical map contract.

**Acceptance criteria:** Scenario A has two input H2D copies, two loads and one store per valid element, and one output D2H copy; scenario B invents no H2D or D2H for this invocation; both tables separate transfer bytes from kernel value requests.

<details><summary>Hint 1</summary>In scenario A, the symbolic size of each complete array is `n * sizeof(float)`.</details>

<details><summary>Hint 2</summary>Device residency changes the lifecycle ledger, not `output[i] = left[i] + right[i]`.</details>

## Exercise 3: Prove ownership for a grid-stride map

**Goal:** Write pseudocode for a grid-stride map with `n = 17` and six launched threads, then prove that exactly one thread handles each valid index of `output[i] = 2 * input[i] + 1`.

**Constraints:** The initial index is the global thread index and the stride is the total launched-thread count; test `i < n` on every iteration; list each thread's index sequence; also explain why this particular pointwise transform can run in place when `input` and `output` are exactly the same allocation.

**Expected evidence:** Six index sequences, a coverage and uniqueness proof, an in-place read-before-write contract, and an evidence boundary naming what still needs runtime validation.

**Acceptance criteria:** The union of the six sequences is exactly `0..16` and their intersections are empty; each iteration reads and writes only the same `i`; the in-place argument does not depend on thread execution order; the proof is not presented as compilation, runtime, or performance observation.

<details><summary>Hint 1</summary>Thread `t` handles the values below 17 in `t, t + 6, t + 12, ...`.</details>

<details><summary>Hint 2</summary>Use the remainder after division by 6 to prove that distinct threads cannot receive one index.</details>

## Next

After completing all three tasks, inspect the separate [reviewed solutions](/en/algorithms/elementwise-map/solutions/). If you later run your own kernel, create a new Environment Manifest and correctness record rather than relabeling this page's expected evidence as observed evidence.
