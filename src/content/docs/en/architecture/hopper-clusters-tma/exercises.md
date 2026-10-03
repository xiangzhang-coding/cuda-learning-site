---
title: 'H04 Exercises: Cluster Lifetimes and TMA Completion'
description: Repair a remote shared-memory lifetime and a direction-confused TMA ledger.
pairId: h04-exercises
counterpart: /architecture/hopper-clusters-tma/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, cluster, tma, review]
resourceKind: exercise-set
unitId: H04-EXERCISES
prerequisites: [H04]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Hopper feature contracts', url: 'https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,cluster,tma,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H04 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/hopper-clusters-tma/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite: [H04](/en/architecture/hopper-clusters-tma/). Submit two corrected ledgers and explicit portable fallbacks. Original paper Exercises require no GPU. Reviewed **2026-09-22**, [SRC-CUDA-106](/en/sources-and-versions/#src-cuda-106). Execution remains **Pending Hardware Verification**; LAB19 remains unpublished pending H06.

## Exercise 1: the pointer outlives its owner

**Goal:** repair H04's two-block neighbor exchange. The proposal initializes each local 256-element int32 segment, calls only `__syncthreads()`, reads the mapped neighbor pointer, and lets block 0 exit as soon as its own reads finish. Block 1 may still read block 0's segment.

**Constraints:** one CC 9.0 GPU, `compute_90` / `sm_90`, cluster/grid (2,1,1), 256 threads/block, 1024 B shared/block, 4096 B global input/output; keep every participant and exact permutation semantics. No timing assumptions, global spin barrier or TMA. Reading needs no hardware; proposed execution needs H04's native-Linux, ≥8 GB/512 MiB-free gates and actual cluster admission.

**Acceptance:** show initialization publication and remote-read completion edges, identify all owners and consumers, and explain why the original block barrier and early exit are invalid. Declare per-block versus aggregate DSM budgets. Reject an unsupported two-block cluster and provide the 6144 B two-kernel global-scratch baseline. Explain why “portable maximum eight” cannot replace the actual occupancy/partition query; list exact-output and completion checks and a fair whole-operation timing boundary.

<details><summary>Hint 1</summary>A mapped pointer does not extend the lifetime of the other block's shared allocation.</details>
<details><summary>Hint 2</summary>Use one cluster-wide edge after initialization and another after all remote reads. Both require every participating thread; the second belongs before any owner exits.</details>

## Exercise 2: choose the right TMA completion

**Goal:** repair a single-block 16×16 int32 round trip. The proposal uses a 60 B outer stride, 16 B-aligned shared destination, a host-encoded map passed as a constant grid parameter, and `arrive()` without waiting before reading. All 256 consumers each add 1024 expected transaction bytes. After modifying the tile, the issuer submits a shared→global transfer and waits on the **load barrier**, then every thread overwrites the shared source.

**Constraints:** CC 9.0, `compute_90` / `sm_90`, no swizzle, no interleave, separate 1024 B input/output, one 1024 B shared tile plus aligned barrier storage; preserve full int32 output and H04's 256 participants. No cluster, device-side descriptor modification, low-precision arithmetic or GPU execution. CPU expected output is each input plus one, with inputs bounded to avoid signed overflow.

**Acceptance:** repair stride and alignment; provide the complete dimension/box/stride/type and descriptor-lifetime contract. Calculate arrival and byte counts, distinguish arrival from wait, and name each required generic→async visibility, group-commit, source-reuse and host-consumption edge. Explain why bulk and non-bulk wait groups are not interchangeable, why `sm_90a` is unnecessary here, and how to fall back to ordinary staging when descriptor, alignment or hardware gates fail. State exactly what read-completion does not prove about the global destination.

<details><summary>Hint 1</summary>Sixteen int32 elements occupy 64 B per row. The tensor path's shared alignment is stricter than the contiguous 1D bulk path.</details>
<details><summary>Hint 2</summary>One tile is 1024 bytes total, not 1024 bytes per waiter. The store has an initiator-local bulk group; publish the issuer's source-read completion before other threads reuse the buffer.</details>

## Review separately

After both attempts, read [worked solutions](/en/architecture/hopper-clusters-tma/solutions/) and [PB-R7-004](/en/practice/#pb-r7-004). Original CC BY 4.0; owner references retain their notices. No architecture or speed observation is supplied.
