---
title: 'G08 Exercises: Capture Generations and Buffer Ownership'
description: Repair collective capture and design an explicit lifetime ledger before optional external implementation.
pairId: g08-exercises
counterpart: /multi-gpu/nccl-graph-capture/exercises/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, capture, lifetime, review]
resourceKind: exercise-set
unitId: G08-EXERCISES
prerequisites: [G08]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL CUDA Graph contract', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/cudagraph.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g08-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,capture,lifetime,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G08 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-graph-capture/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite **[G08]**: [capture and registration contracts](/en/multi-gpu/nccl-graph-capture/). Reviewed 2026-09-20; [SRC-CUDA-101](/en/sources-and-versions/#src-cuda-101). Submit two static ledgers first. No GPU is required; optional implementation uses G08's exact native-Linux two-process/two-GPU environment, 180-second job deadline and 10-second termination grace. Capture success, registration effects and performance remain Pending Hardware Verification.

## Exercise 1: repair a capture generation

**Goal:** repair the fictional schedule below and specify an external implementation with three independently checked replays.

| Phase | Rank 0 | Rank 1 |
| --- | --- | --- |
| A | begin capture; all-reduce | ordinary all-reduce |
| B | synchronize captured stream; end capture | begin and end a different capture |
| C | instantiate without checking returned graph | instantiate its own graph |
| D | replay three times | replay twice, then return |

**Constraints:** two distinct GPUs, one process/rank/GPU; one healthy blocking communicator; one explicit nonblocking stream; default mixing/ordering; no registration. Allocate separate 4096-element FP32 send/receive buffers before capture. Use rank input `r+1+k`, sum, and a captured consumer multiplying output by two. The producer writes input outside capture on the replay stream. Never deliberately execute the broken table.

**Acceptance:** give matching capture-generation and replay ledgers; move completion outside capture; reject null/error graphs; require each rank's baseline check and three all-element finite/exact checks. Derive the expected values. Account for immediate API errors, asynchronous errors, peer termination and the external deadline. Explain why a one-rank recapture, skipped replay or host pointer reassignment is not a repair. A static plan passes without claiming execution. An optional implementation passes only with the complete manifest, every rank's checks, successful cleanup and zero launcher status.

<details><summary>Hint 1</summary>Ask whether rank 1's ordinary operation can be the partner of rank 0's captured operation.</details>
<details><summary>Hint 2</summary>Separate definition, instantiation, host launch and device completion; derive twice the sum of both fresh inputs.</details>

## Exercise 2: who may release the allocation?

**Goal:** repair this lifetime proposal: register only rank 0's send buffer, capture, launch, destroy the source graph, deregister the local handle, free both allocations, then wait for the consumer on another stream Q. Also review a separate eligible NVLS case with send/receive offsets `(0,4096)` on rank 0 and `(1024,4096)` on rank 1, in bytes.

**Constraints:** distinguish graph-managed registration from explicit `ncclCommRegister` handles; do not mix the ownership models into one invented handle. Use G08's admitted general-registration row with `ncclMemAlloc` for the local-registration case. Treat NVLS as a paper eligibility review unless its separate CC≥9.0/NVSwitch profile is documented. Keep allocations large enough for N=4096 and the offsets. Do not enable legacy registration, CFT, window/device APIs or one-sided RMA.

**Acceptance:** draw producer → replay → Q → completion edges and a release ledger for executable/template/clones, local handles, buffers, communicator and streams. Explain symmetric rank participation, both-buffer registration and independent send/receive offset matching. Reject an allocation or asynchronous error rather than calling it fallback. Compare an unregistered baseline with an eligible registered run only under the same workload, completed timing boundaries and permissions; leave observations empty without real evidence.

<details><summary>Hint 1</summary>Destroying one template is not proof that an executable, clone or consumer has stopped using its storage.</details>
<details><summary>Hint 2</summary>Check each offset against the corresponding allocation base across ranks, then separate automatic graph cleanup from explicit deregistration.</details>

## Review separately

Read the [worked solutions](/en/multi-gpu/nccl-graph-capture/solutions/) after completing both ledgers. Apply the reasoning to [PB-R6-010](/en/practice/#pb-r6-010) and [PB-R6-011](/en/practice/#pb-r6-011). These are original tasks, not copies of owner tests.
