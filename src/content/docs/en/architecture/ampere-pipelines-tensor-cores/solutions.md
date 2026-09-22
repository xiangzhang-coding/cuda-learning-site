---
title: 'H02 Solutions: Wait, Publish, Read, Release'
description: A complete three-tile ordering ledger and independent fallback decisions.
pairId: h02-solutions
counterpart: /architecture/ampere-pipelines-tensor-cores/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, pipeline, gating, evidence]
resourceKind: solution-set
unitId: H02-SOLUTIONS
prerequisites: [H02-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ampere capability contracts', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,pipeline,gating,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/ampere-pipelines-tensor-cores/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Exact prerequisite: [H02-EXERCISES](/en/architecture/ampere-pipelines-tensor-cores/exercises/). Original paper solutions, reviewed **2026-09-22**; [SRC-CUDA-104](/en/sources-and-versions/#src-cuda-104).

## Repair the stage and warp obligations

The ordinary-copy baseline performs a bounded load/store for every participating thread, block publication barrier, neighbor read, then block reuse barrier for each tile. It needs no asynchronous-copy feature and keeps all 256 threads participating.

The asynchronous version first acquires/copies/commits tile 0 into S0 and tile 1 into S1. Each thread uses a thread-scope pipeline; after an oldest-batch wait, all 256 threads execute a block barrier before any neighbor reads. The following is an ordering specification, not a compiled API implementation:

```text
submit tile 0 -> S0; submit tile 1 -> S1
wait oldest with 1 newer batch; block barrier
read tile 0 from S0; block barrier; release tile 0
acquire S0; submit tile 2 -> S0
wait oldest with 1 newer batch; block barrier
read tile 1 from S1; block barrier; release tile 1
wait oldest with 0 newer batches; block barrier
read tile 2 from S0; block barrier; release tile 2
```

For the thread pipeline API, the wait-prior operation corresponds to `cuda::pipeline_consumer_wait_prior<1>(pipe)` for the first two waits and `<0>` for the last; each submit includes acquire, copy and commit. The block barrier after each wait publishes all threads' completed copies to neighbor readers. The barrier after the read prevents any next acquire/copy from overwriting data still in use. For a partial final tile, keep all participants, predicate valid copies, initialize missing shared elements explicitly, and preserve the same commit/barrier schedule.

With the fixture `input[256*t+i]=1000*t+i`, the exact expected copy/reorder result is `output[256*t+i]=1000*t+((i+1)%256)`. In tile 2, lanes 0 and 255 expect 2001 and 2000. These are algebraic values, not recorded outputs. Budgets remain 6144 B global and 2048 B shared buffers plus synchronization state.

`arrive()` is not completion; dependent reads belong after the wait on the bound phase. A barrier must be initialized and its expected arrivals maintained. A thread leaving without the agreed drop protocol can strand the phase. Converged commit/arrive-on participation avoids warp-entangled extra batch updates; predicating just data movement does not justify dropping collective obligations. Correct phase accounting still does not prove actual overlap.

## Resolve the gates independently

| Proposal | Rejection | Explicit fallback |
| --- | --- | --- |
| A | `base+1` is 4 B past the aligned base, invalidating a 16 B promise | Ordinary FP32 load/shared store with valid bounds and both barriers; preserves copy values |
| B | CC 8.6 has no native FP64 Tensor Cores in the reviewed table | Ordinary FP64 SIMT; preserve FP64 storage/operations and validate reduction order/tolerance |
| C | Returning lanes violate the full-warp WMMA collective | Keep full participants and pad valid tiles, or explicitly select FP32 SIMT on converted BF16 values; multiplication/accumulation behavior still needs revalidation |
| D | TF32 multiplicands violate the caller's ordinary-FP32 requirement | FP32 SIMT on original FP32 inputs; no TF32 conversion |

CC 8.0 admits B's native capability, subject to compatible build, WMMA shape and all other conditions. It cannot realign A's pointer, restore C's missing lanes or change D's caller requirement. A fallback is an explicitly selected algorithm with checked contracts, not permission to ignore arbitrary CUDA errors.

## Evidence still needed

All architecture execution and performance remain **Pending Hardware Verification**. Retain exact source/compiler/target and generated artifacts, device/platform/driver/library and memory coordinates in an Environment Manifest, correctness comparisons, launch/completion checks, sanitizer reports and matched measurement boundaries. Native Linux is the sole Supported Environment. Source review and VIS15 establish no compilation, selected instruction, runtime, overlap or speedup observation. This original solution is CC BY 4.0; owner references retain their notices.
