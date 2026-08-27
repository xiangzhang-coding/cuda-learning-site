---
title: 'M01 Exercises: Issue Memory-Object Responsibility Contracts'
description: Use three static tasks to classify CUDA objects by owner, scope, lifetime, physical location, and matching release while rejecting cache and register-placement guesses.
pairId: m01-exercises
counterpart: /memory/address-spaces/exercises/
factCheckDate: '2026-08-27'
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
unitId: M01-EXERCISES
prerequisites:
  - M01
relatedUnits:
  - M01
  - VIS06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m01-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M01 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M01,VIS06' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/address-spaces/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [M01: Address Spaces, Ownership, Scope, and Lifetime](/en/memory/address-spaces/) first. These three Exercises require only static classification, pseudocode review, and source records. No CUDA-capable system is needed, and no compilation, runtime, or performance Evidence Status can result.

## How to answer

For every task, record owner/allocation, accessibility/scope, lifetime, physical location, and release before stating the narrowest allowed conclusion. Work independently before opening hints and the [reviewed solutions](/en/memory/address-spaces/solutions/).

## Exercise 1: Complete a six-object ledger

**Goal:** Classify a host `std::vector<float>`, a `cudaMalloc` buffer, module-scope `__constant__` coefficients, a per-block `__shared__` tile, a variable-indexed local array inside a kernel, and a scalar accumulator that might receive a register.

**Constraints:** Each row separately records creator, permitted accessors, shared-instance scope, valid endpoint, physical location, release owner/action, and facts left to the compiler/device. Do not rank by speed. Do not treat source declarations as register-placement evidence.

**Expected evidence:** A six-row object ledger with at least seven columns, plus one “known” and one “unknown” sentence per row.

**Acceptance criteria:** The global buffer uses `cudaFree` after its last user completes. The constant symbol does not use `cudaFree`. Every block has a distinct shared instance. Local and register storage are thread-private. Local memory is physically in device memory. Final register/spill placement for the accumulator stays unknown.

<details><summary>Hint 1</summary>Place source-level visibility and physical location in separate columns.</details>

<details><summary>Hint 2</summary>“Ends automatically” is a release contract even though it is not an API call.</details>

## Exercise 2: Repair a broken release plan

**Goal:** Review this plan: “Call `cudaFree(d_data)` immediately after launch; the host then releases the kernel's shared tile; each thread calls `cudaFree` on its local array; release the constant symbol after every block.”

**Constraints:** Identify the incorrect owner, lifetime, or completion assumption in every clause. The repair preserves F04's launch/error/completion boundary. Do not assume default-stream timing automatically proves every use complete.

**Expected evidence:** A mapping from each original clause to its violated contract and a new plan ordered by allocation, last use, completion proof, and release.

**Acceptance criteria:** Only the explicit global allocation uses `cudaFree`, after its last possible user completes. Shared/local storage ends automatically with block/thread execution. Constant storage follows module/context lifetime. The answer invents no host-releasable shared/local pointer.

<details><summary>Hint 1</summary>First circle the allocation handle actually returned to the host.</details>

<details><summary>Hint 2</summary>“Kernel launch returned” and “kernel completed” are different facts.</details>

## Exercise 3: Rewrite placement claims as reviewable contracts

**Goal:** Repair three assertions: “Every scalar is in a register,” “local memory is the fastest per-thread cache,” and “shared-memory capacity and the L1 split are identical on every GPU.”

**Constraints:** Split each assertion into stable semantics, a selected-environment query/compile fact, and a question requiring measurement. Cite M01's owner-source scope. Invent no capacity, latency, or speedup value.

**Expected evidence:** Three before/after records, each with the claim, missing premises, legal rewrite, and verification method.

**Acceptance criteria:** The rewrites say register placement depends on compiler/resource pressure and can spill; local is a thread-private address space physically in device memory, not a cache level; shared capacity/cache configuration must be queried for the architecture/device/kernel; and no universal speed order follows.

<details><summary>Hint 1</summary>Compiler output can answer placement; source spelling cannot.</details>

<details><summary>Hint 2</summary>Write what remains semantically stable before writing which environment facts vary.</details>

## Next step

After completing all three contracts, inspect the separate [reviewed solutions](/en/memory/address-spaces/solutions/) and then review another object inventory in [Practice Bank PB-R1-013](/en/practice/#pb-r1-013).
