---
title: 'M11 Exercises: Order allocation lifetimes and pool policy'
description: Build a same-stream lifetime, repair a multi-stream free, and review memory-pool controls without inventing address reuse or performance evidence.
pairId: m11-exercises
counterpart: /memory/stream-ordered-allocation-memory-pools/exercises/
factCheckDate: '2026-08-29'
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
unitId: M11-EXERCISES
prerequisites:
  - M11
relatedUnits:
  - M11
  - M09
  - M14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m11-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M11 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M11,M09,M14' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/stream-ordered-allocation-memory-pools/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M11: Stream-Ordered Allocation and Memory Pools](/en/memory/stream-ordered-allocation-memory-pools/) first. These Exercises use static dependency and policy records; they require no CUDA-capable system and create no allocator observation.

## Instructions

For each allocation, mark allocation-operation completion, first and last use in every stream, and the free-operation boundary. For each pool claim, separate permitted policy from observed outcome. Finish all three tasks before consulting the [reviewed solutions](/en/memory/stream-ordered-allocation-memory-pools/solutions/).

## Exercise 1: Bound one same-stream lifetime

**Goal:** Rewrite `cudaMallocAsync`, two kernels that initialize and consume `ptr`, and `cudaFreeAsync` as one ordered `stream_work` ledger, including the host-return and allocation-completion distinction.

**Constraints:** Keep all four operations in one explicitly named stream. Do not add a device-wide synchronization. Do not treat the pointer returned to the host as proof that the allocation operation has completed.

**Expected evidence:** One stream lane, a logical usable interval, labels for host API return and stream execution, and a sentence classifying each possible use before allocation or after free.

**Acceptance criteria:** Both kernels are ordered after allocation completion and before execution reaches the free; host return is not labeled completion; use before allocation completion and use after free are classified as undefined behavior; no address or speed claim appears.

<details><summary>Hint 1</summary>Put the allocation call return beside the lane, not inside the lane as a completion marker.</details>

<details><summary>Hint 2</summary>Per-stream order supplies every required edge when all uses and the free share the allocation stream.</details>

## Exercise 2: Join every last use before freeing

**Goal:** Repair a graph where `stream_allocate` allocates `ptr`, `stream_a` and `stream_b` each use it, and `stream_release` frees it while only `stream_a` currently has an edge to the free.

**Constraints:** Use event record/wait edges rather than host source order. Order both first uses after allocation completion. Order the free after both last uses. Keep the two use streams unordered relative to each other unless your repair needs a documented edge.

**Expected evidence:** Four stream lanes, one allocation-ready event state, one completion event per use stream, all wait edges, and a reachability table from allocation to each use and from each use to free.

**Acceptance criteria:** Each first use has a path from allocation completion; the free has an incoming path from both last uses; no use is inferred ordered merely because its host call appears first; the repaired graph states that all accesses lie inside the logical lifetime.

<details><summary>Hint 1</summary>One ready event can feed multiple waits when both consumers need the same captured allocation prefix.</details>

<details><summary>Hint 2</summary>The release stream must join two completion paths, not select one winner.</details>

## Exercise 3: Review pool controls without overclaiming

**Goal:** Review a proposal that creates an explicit pool, enables all three reuse attributes, sets a large release threshold, and concludes: "every allocation reuses the same address and the program is faster."

**Constraints:** Produce separate verdicts for support gating, pool selection, each reuse policy, release threshold, pointer equality, footprint, and performance. Preserve any valid configuration choice while removing unsupported outcomes.

**Expected evidence:** A policy matrix naming `cudaDevAttrMemoryPoolsSupported`, default/current versus explicit selection, three reuse attributes, `cudaMemPoolAttrReleaseThreshold`, and the measurement needed for each outcome claim.

**Acceptance criteria:** The design checks support before the allocator path; policies are described as permissions; the threshold is not called a hard cap or exact retained-byte promise; pointer equality is rejected as a guarantee; speedup remains unknown without workload measurements.

<details><summary>Hint 1</summary>Ask "what may the allocator consider?" for reuse attributes and "what happened?" only for a real observation.</details>

<details><summary>Hint 2</summary>Pool caching and logical pointer lifetime are separate columns in the review.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/stream-ordered-allocation-memory-pools/solutions/) and then repair the longer allocation record in [Practice Bank PB-R2-003](/en/practice/#pb-r2-003).
