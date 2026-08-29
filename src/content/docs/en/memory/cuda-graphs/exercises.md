---
title: 'M14 Exercises: Construct and Audit Repeated CUDA Graph Work'
description: Compare ordinary repeated submission with two graph-construction mechanisms, unwind an invalid capture, and repair executable-graph lifetime, completion, replay, and update contracts.
pairId: m14-exercises
counterpart: /memory/cuda-graphs/exercises/
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
unitId: M14-EXERCISES
prerequisites:
  - M14
relatedUnits:
  - M14
  - M11
  - EX09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m14-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M14-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M14 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M14,M11,EX09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/cuda-graphs/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M14: CUDA Graphs and Repeated Launch Structure](/en/memory/cuda-graphs/) first. These Exercises create only DAGs, API-call plans, and lifetime ledgers. They do not construct or launch a CUDA graph and add no Evidence Status.

## Instructions

Name every node, edge, graph/capture handle, external resource, immediate API check, and completion boundary. Keep explicit construction separate from capture, and keep graph definition separate from executable launch. Compare your work with the [reviewed solutions](/en/memory/cuda-graphs/solutions/) only after auditing all three boundaries.

## Exercise 1: Compare ordinary submission and two graph constructions

**Goal:** Model four operations: `H2D`, `clear`, `compute`, and `D2H`. `compute` needs both `H2D` and `clear`; `D2H` needs `compute`. Write the node/edge set, prove acyclicity, then compare an ordinary per-iteration stream submission, one explicit Graph API construction, and one two-stream capture construction that preserve that DAG.

**Constraints:** Keep `H2D` and `clear` unordered. In the ordinary plan, identify every call and completion boundary repeated by the host. In the explicit plan, identify node handles and dependency additions. In the capture plan, identify origin stream, captured events used to fork/join, and the final rejoin. Do not execute work or claim concurrency.

**Expected evidence:** A four-node adjacency list, a topological order, and three separately labeled submission/construction plans with the same final dependencies and output oracle.

**Acceptance criteria:** The only required edges are `H2D -> compute`, `clear -> compute`, and `compute -> D2H`; no path runs from a node back to itself; the ordinary path resubmits all operations and observes completion each iteration; capture ends on its origin after every auxiliary stream rejoins; construction equivalence is not presented as execution evidence.

<details><summary>Hint 1</summary>More than one topological order is valid because the two root nodes are unordered; ordinary submission still needs both dependency paths each iteration.</details>

<details><summary>Hint 2</summary>Use a captured event to fork work and another captured event to rejoin the auxiliary stream to the origin.</details>

## Exercise 2: Unwind an invalidated stream capture

**Goal:** Audit a capture that begins on `origin`, forks `worker` through a captured event, calls synchronous `cudaMemcpy()`, queries the captured event, never rejoins `worker`, and attempts `cudaStreamEndCapture(worker, &graph)`.

**Constraints:** Classify every invalid operation. Explain the state after first invalidation, the only valid purpose of the eventual end-capture call, and why the returned graph cannot be instantiated. Then describe a fresh corrected capture using supported asynchronous work and a complete rejoin.

**Expected evidence:** An ordered fault ledger, invalidation/recovery state machine, and corrected origin/fork/rejoin/end sequence.

**Acceptance criteria:** Query/synchronization and the synchronous copy are rejected under the documented capture boundary; capture ends only on `origin`; invalidation is unwound with an error and null graph; the corrected attempt starts a new capture, rejoins `worker`, and checks every API result.

<details><summary>Hint 1</summary>After invalidation, do not try to salvage nodes from the same capture graph.</details>

<details><summary>Hint 2</summary>Ending capture after a failure exits capture mode; it does not convert the invalid graph into a usable template.</details>

## Exercise 3: Repair replay, lifetime, completion, and update

**Goal:** Review an executable graph launched twice into stream `S`. The host reads output and frees buffers immediately after each launch, destroys `graphExec` before observing completion, and attempts to update the second launch by adding a new node to the existing executable.

**Constraints:** Produce a resource ledger covering graph template, executable, stream, input/output storage, and completion event. Distinguish a compatible parameter update from a topology change. Preserve both launches and make no launch-overhead or speed claim.

**Expected evidence:** A corrected lifecycle timeline, resource last-use table, completion checks, and an update decision tree.

**Acceptance criteria:** Definition precedes one successful instantiation; each launch is treated as asynchronous stream work; host reads, frees, and executable destruction occur only after covering completion; compatible documented parameter changes may update subsequent launches; adding a node requires a new graph and re-instantiation.

<details><summary>Hint 1</summary>A reusable executable owns structure, not the lifetime of every pointer it references.</details>

<details><summary>Hint 2</summary>Ask whether the requested change preserves topology before selecting an update API.</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/cuda-graphs/solutions/) and then audit [Practice Bank PB-R2-006](/en/practice/#pb-r2-006). Use [TERM-111](/en/glossary/#term-111) through [TERM-114](/en/glossary/#term-114) to keep graph template, node, capture, and executable names distinct.
