---
title: 'G04 Exercises: Audit Participation and Results'
description: Repair a collective contract and design an independent rank-level oracle.
pairId: g04-exercises
counterpart: /multi-gpu/nccl-communicators-collectives/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, contract, oracle, review]
resourceKind: exercise-set
unitId: G04-EXERCISES
prerequisites: [G04]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL collective API', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/api/colls.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,contract,oracle,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G04 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-communicators-collectives/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[G04]**: [communicators and collectives](/en/multi-gpu/nccl-communicators-collectives/). Source review: [SRC-CUDA-097](/en/sources-and-versions/#src-cuda-097), 2026-09-19. Paper tasks need no GPU. Any optional EX24 execution requires its full native Linux, NCCL 2.31.2/CUDA 13.3.1 two-GPU gate and Environment Manifest; it remains Pending Hardware Verification without qualifying evidence.

## Exercise 1: repair the participation ledger

**Goal:** repair a fictional two-rank client. Both ranks select device 0. Rank 0 calls all-reduce with count 1028 and `ncclInt32`; rank 1 calls reduce with count 257 and root 0. Each allocation holds 257 int32 values.

**Constraints:** preserve the intended sum on every rank; use distinct full GPUs; keep counts in elements. Do not run this mismatched program. Include communicator membership, rank/device mapping, datatype, operation order, buffer extent and result placement.

**Acceptance:** provide matching all-reduce rows with count 257, no root, 1028-byte send/receive allocations per rank, a bijective rank/device map and a check of all outputs. Explain why a return code cannot replace matching participation.

<details><summary>Hint 1</summary>1028 is a byte extent, not an int32 element count.</details>
<details><summary>Hint 2</summary>Reduce and all-reduce differ in result placement even with identical arithmetic.</details>

## Exercise 2: catch an omitted or stale rank

**Goal:** derive EX24's oracle and design mutations that catch missing rank contributions and stale output.

**Constraints:** use R=2 and R=4, counts 1 and 257, signed inputs and all-element checks. Keep hand-computed expectations separate from future GPU logs. No latency or algorithm claim.

**Acceptance:** derive -7 at R=2/i=0 and 62 at R=4/i=16. Show why a constant input shared by all ranks is a weaker diagnostic. Specify nonzero process status for mismatch, missing GPU, async error or timeout, and empty recorded observations when hardware is absent.

<details><summary>Hint 1</summary>Sum the rank-dependent term separately from the index-dependent term.</details>
<details><summary>Hint 2</summary>A correct rank-zero array says nothing about another rank's unexamined receive array.</details>

## Review separately

Read the [solutions](/en/multi-gpu/nccl-communicators-collectives/solutions/) after attempting both tasks; then audit [PB-R6-004](/en/practice/#pb-r6-004).
