---
title: 'G08 Solutions: Match Participation and Last Use'
description: Worked capture, replay, invalidation and registration-lifetime reasoning with separate alternatives and failure analysis.
pairId: g08-solutions
counterpart: /multi-gpu/nccl-graph-capture/solutions/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, capture, lifetime, alternatives, mistakes, evidence]
resourceKind: solution-set
unitId: G08-SOLUTIONS
prerequisites: [G08-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL CUDA Graph contract', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/cudagraph.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g08-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,capture,lifetime,alternatives,mistakes,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G08-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-graph-capture/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite and reading order

Exact prerequisite **[G08-EXERCISES]**: finish the [two ledgers](/en/multi-gpu/nccl-graph-capture/exercises/) first. The [G08 contract](/en/multi-gpu/nccl-graph-capture/) and [SRC-CUDA-101](/en/sources-and-versions/#src-cuda-101), reviewed 2026-09-20, govern these original solutions. No reference implementation or GPU result is implied; external scenarios remain Pending Hardware Verification.

## Solution 1: one collective capture, three matching replays

Both processes initialize their distinct device, communicator, explicit stream and separate buffers outside capture. Complete and check the same ordinary workload first. Each rank then begins thread-local capture, records the matching all-reduce and doubling consumer, and ends on its origin stream/thread without a completion query inside capture. Only a successful, non-null result is instantiated. The host/input producer remains outside capture and writes on that stream before each launch.

| k | rank 0 input | rank 1 input | reduced value | consumer output |
| --- | --- | --- | --- | --- |
| 0 | 1 | 2 | 3 | 6 |
| 1 | 2 | 3 | 5 | 10 |
| 2 | 3 | 4 | 7 | 14 |

These are exact small FP32 integers derived from `2*((1+k)+(2+k))`; the 4096 entries all have the same expected value. Every rank launches its own executable from generation A for each k. Check immediate launch status, bounded asynchronous communicator/stream completion and completed host download, then compare all elements and preserve per-rank records. The next write occurs after previous consumption; successful launch alone does not permit overwrite. A 180-second external supervisor with 10-second termination grace covers blocked host calls, and missing rank evidence or nonzero launcher status fails the run.

If capture is invalidated, retain the first error, end capture on the origin, reject the null/error graph and stop the job across ranks. Never let peers proceed to replay. Address or shape changes require draining and coordinated fresh capture under this exercise's conservative contract. Reassigning a host variable cannot alter the old executable. Healthy final completion precedes executable/template cleanup, buffer release and communicator/stream cleanup.

## Solution 2: release by last use, not host return

First reject rank-0-only send registration. For an admitted local-registration experiment, each rank registers both `ncclMemAlloc` allocations with its own communicator before use and retains the returned local handles. Do not pass an internal graph-managed registration to `ncclCommDeregister`.

For a producer on P and replay on C, record readiness after the producer and wait on C before launch. Record done after launch on C, wait on Q before consumption, and observe Q completion before releasing resources. If production already runs on C, its stream order supplies the first edge. Keep send, receive, host staging, communicator and registration live across all three replays and Q's final use.

The healthy conservative release sequence is: complete all final uses → destroy all executable graphs → destroy templates/clones → deregister every explicit local handle on its original communicator → free allocations with `ncclMemFree` → destroy healthy communicator → destroy streams/events. For graph-managed registration, omit explicit deregistration: NCCL ties cleanup to graph-held references, so destroying only the source template is insufficient. Release errors retain the first failure and stop acceptance; do not label partially completed cleanup successful.

The separate NVLS offset proposal fails because send offsets 0 and 1024 differ across ranks; receive offsets already match at 4096. One valid repair is `(0,4096)` on both ranks with separate allocations sized to cover those ranges: each send needs at least 16,384 bytes and each receive at least 20,480 bytes, before allocator granularity. Send and receive offsets need not equal one another. Equal offsets do not establish NVSwitch availability, allocation qualification or actual registration use.

## Reasonable alternatives

Keep ordinary unregistered collectives if graph setup is not amortized or registration eligibility is absent. Serialized replay can use explicit completion after each iteration; a pipelined alternative requires distinct slots and proof of final-consumer completion for each slot, beyond this exercise. A single-process multi-GPU launcher needs its own threading/ordering review; group calls alone do not eliminate a blocking graph-launch deadlock. Generic graph updates and custom allocators need separate exact API reviews.

## Common wrong answers

“The graph launched, so free now” confuses submission with completion. “Destroying the template deregisters everything immediately” ignores executable/clone references. “Same stream permits ordinary enqueue with mixing off” ignores the host-launch-to-device-completion outstanding interval. “Registration returned success, so zero-copy is proven” ignores transport selection and PXN. “Set NVLS=2 to survive any allocation error” contradicts selected 2.31.2 behavior. None is repaired by a recovery barrier.

## Evidence boundary

The tables are mathematical/static reasoning, not observed output, logs, registration effects or performance. A real implementation requires the exact G08 environment, every rank's baseline and 6/10/14 replay checks, complete manifest and cleanup record. Optional registration rows require independent eligibility and measurement permissions. CFT, device APIs, one-sided RMA and new NVLS paths stay in Emerging Feature Watch. Four evidence arrays remain empty and external scenarios remain Pending Hardware Verification.
