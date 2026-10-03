---
title: 'H04 Solutions: Remote Ownership and Directional Waits'
description: Worked cluster lifetime repair and TMA transaction accounting with portable comparisons.
pairId: h04-solutions
counterpart: /architecture/hopper-clusters-tma/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, cluster, tma, evidence]
resourceKind: solution-set
unitId: H04-SOLUTIONS
prerequisites: [H04-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Hopper feature contracts', url: 'https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,cluster,tma,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/hopper-clusters-tma/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Exact prerequisite: [H04-EXERCISES](/en/architecture/hopper-clusters-tma/exercises/). Original paper solutions, reviewed **2026-09-22**, [SRC-CUDA-106](/en/sources-and-versions/#src-cuda-106).

## Solution 1: keep both owners alive

The local allocation belongs to its block. Every block's 256 threads initialize their 1024 B segment, then every thread participates in `cluster.sync()`. This establishes that both owners exist and initialization is published. Each thread reads the corresponding element of the other owner's mapped segment and writes its unique global output. Every thread then participates in a second `cluster.sync()` before any block exits or reuses storage. The first edge makes remote reads legal; the second protects the owners' lifetime through those reads. A block-local barrier cannot establish either cluster-wide fact.

Local allocation is 1024 B/block, aggregate DSM 2048 B/cluster, global input/output 4096 B. A 2048 B aggregate does not authorize a 2048 B local access. There are no competing writes to the same output, so no atomic is needed. Keep all collective participants even if future tail accesses are masked; never return early to “save” an idle block.

Query cluster launch support, potential cluster size and active-cluster occupancy for the actual two-block configuration and kernel. The eight-block portable ceiling does not guarantee resources in a particular partition. If admission fails, use ordinary matching-target kernels: first write the 2048 B global scratch, then in the same stream read the other segment into output. Total global budget is 6144 B. This preserves outputs without DSM or a grid spin barrier. H04's ≥8 GB/512 MiB-free native-Linux environment and exact target checks still apply.

Compare all 512 outputs to the CPU permutation, test asymmetric data, check launch/completion and applicable sanitizer reports. For performance later, measure both ordered baseline kernels together against the complete cluster kernel, with matched data/iterations and validation outside the interval. Kernel count alone is not a speedup. A larger cluster or an unrecorded device result is not an alternative proof.

## Solution 2: account for one tile, then wait by direction

Use 64 B outer stride, global base 16 B alignment and shared tile **128 B alignment**. The map is rank 2 with int32 type, dimensions [16,16], box [16,16], element strides [1,1], no interleave/swizzle/L2 promotion/special floating-point fill. Keep its type's 64-byte alignment, check `cuTensorMapEncodeTiled`, pass immutable `const __grid_constant__` descriptors for the separate input and output allocations, and keep allocations alive. Check driver API availability/linking. A 60 B stride neither represents this contiguous row nor satisfies the outer-stride multiple-of-16 requirement. Sixteen-byte shared alignment is sufficient for the selected 1D bulk rule, not this tensor copy.

The block has **256 arrivals and 1024 expected bytes**. Having each consumer register 1024 would request **262144 bytes**, so completion cannot be satisfied by the one 1024 B copy. Initialize and publish the aligned shared barrier using the selected API's visibility rules; one elected issuer submits the transfer and accounts bytes once in the explicit-accounting form. Do not manually account again when a high-level overload already does so. Every thread arrives and waits for that phase before reading.

For the increment, bound input to avoid signed overflow and compare with exact CPU input+1. After each writer's generic shared stores, use the required async-proxy fence and a block barrier before the elected store issuer. Commit the **bulk** store group. The issuer's bulk read-completion wait protects the shared source; add a block publication barrier after that wait so no other thread overwrites early. The load's transaction barrier cannot track this store, and non-bulk `cp.async.wait_group` waits on a different mechanism.

Read-completion is not global-destination completion. If the issuer must consume that destination inside the kernel, use the full completion wait and appropriate publication to any wider consumers. In this exercise, the CPU only reads after checked kernel/stream completion. Drain all transfers, retain source/descriptor/barrier lifetime, and do not reuse a barrier with unfinished phases.

`compute_90` / `sm_90` covers the selected host-encoded TMA path. `sm_90a` is unnecessary; device-side descriptor modification has a separate target contract. No cluster is required for this single-block transfer. If any descriptor/alignment/feature condition fails, use ordinary loads into shared memory, block publication, increment, block coordination and ordinary global stores. This preserves the declared exact output while changing the instruction path. Smaller explicit tiles are another possible redesign; they need a new budget and validation. Neither choice supplies a timing result.

## Evidence and licensing

Execution, copy behavior and performance remain **Pending Hardware Verification**. Exact build/target artifacts, an Environment Manifest, a qualifying Reference Environment, correctness/completion and retained profiling reports are needed for future claims. Counter-permission failure leaves counter evidence absent. LAB19 stays hidden pending H06. Original CC BY 4.0; owner references retain their notices.
