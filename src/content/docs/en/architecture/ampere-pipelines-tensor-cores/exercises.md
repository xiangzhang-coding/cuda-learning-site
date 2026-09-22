---
title: 'H02 Exercises: Audit Stages and Feature Gates'
description: Repair a premature buffer reuse and reject invalid copy and Tensor Core proposals.
pairId: h02-exercises
counterpart: /architecture/ampere-pipelines-tensor-cores/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, pipeline, gating, review]
resourceKind: exercise-set
unitId: H02-EXERCISES
prerequisites: [H02]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ampere capability contracts', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,pipeline,gating,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H02 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/ampere-pipelines-tensor-cores/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite: [H02](/en/architecture/ampere-pipelines-tensor-cores/). Submit an ownership/phase ledger and an eligibility table. Original paper fixtures need no GPU; reviewed **2026-09-22**, [SRC-CUDA-104](/en/sources-and-versions/#src-cuda-104). External behavior remains **Pending Hardware Verification**.

## Exercise 1: repair cross-thread consumption

**Goal:** retain H02's three FP32 tiles, 256 elements each, and two shared slots. There are 256 live block threads, each issuing its own 4-byte copy through a thread-scope pipeline. Every thread consumes the next thread's element modulo 256. The proposed sequence waits only for its own copy, reads its neighbor, releases its own stage, then immediately overwrites the slot for tile 2.

**Constraints:** first describe the ordinary-copy baseline; then repair the asynchronous path. Keep all participants through prologue, consumption and drain, including tails. No timing assumptions, extra buffers, or device execution. Record the 6144 B global and 2048 B shared-buffer budgets, plus separately accounted synchronization state.

**Acceptance:** explain both missing cross-thread edges; order copy completion, block publication, neighbor read, block reuse barrier, release and next acquire. State which tile occupies each slot and where the final wait changes as the queue drains. Explain why using only `arrive()` cannot authorize consumption, and why divergent commit/arrive-on calls require a participation review even when memory ranges are valid.

<details><summary>Hint 1</summary>One thread's wait answers a completion question about its own copies. Who guarantees the neighbor has reached that point?</details>
<details><summary>Hint 2</summary>Track both ready-to-read and safe-to-overwrite. With two queued stages, the oldest wait can retain one newer stage; the final tile must wait with zero newer stages.</details>

## Exercise 2: gate every condition, not only CC

**Goal:** review four proposed paths on one CC 8.6 device with 8 GB. The proposed build is H02's native Linux/C++17/Toolkit 13.3.1 coordinate and matching `compute_86` / `sm_86` targets.

| Proposal | Declared conditions |
| --- | --- |
| A | Copy 1024 B from `base+1` where base is an aligned FP32 array; assert 16-byte alignment; destination is aligned shared memory |
| B | Native FP64 Tensor Core selected because `CC >= 8.0` |
| C | BF16 WMMA, FP32 accumulation/output, complete aligned tiles; some lanes return before `mma_sync` |
| D | TF32 WMMA with a caller requiring ordinary FP32 multiplicands and refusing reduced-precision input conversion |

**Constraints:** keep the device, caller's numerical requirements and declared byte ranges. No product-name lookup or automatic success inference from API availability. Do not execute any proposal.

**Acceptance:** reject each proposal for its specific failed condition, select an explicit ordinary-copy or SIMT fallback, and state which dtype/precision contract each fallback preserves or changes. Explain why CC 8.0 would change B's native-hardware gate but would not repair A, C or D. List build/artifact, correctness, sanitizer and measurement records still needed before an architecture or performance claim.

<details><summary>Hint 1</summary>Advancing a float pointer by one changes its byte address by four; a compiler promise is not an allocator.</details>
<details><summary>Hint 2</summary>Check native FP64 availability, full-warp membership and caller-approved precision independently. A device can satisfy the API target and still fail the chosen contract.</details>

## Review separately

Compare [worked solutions](/en/architecture/ampere-pipelines-tensor-cores/solutions/) after both attempts; continue with [PB-R7-002](/en/practice/#pb-r7-002). Exercises are original CC BY 4.0. Owner documentation retains its notices; no observed CUDA evidence is supplied.
