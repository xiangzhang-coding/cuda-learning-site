---
title: 'G04: Give Every Rank the Same Collective Contract'
description: Create communicators and verify counts, datatypes, participation and every rank result.
pairId: g04
counterpart: /multi-gpu/nccl-communicators-collectives/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, communicator, collective, correctness, failure, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G04
prerequisites: [G01, G03]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 60
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL pinned communicator and collective contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g04 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/nccl-communicators-collectives/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,communicator,collective,correctness,failure,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G04 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G01,G03' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-communicators-collectives/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Define one collective contract before launching any communication: participating ranks, device ownership, operation order, datatype, element count and acceptance oracle. Build [EX24](/en/examples/nccl-all-reduce/) and use [VIS16](/en/visuals/collective-paths/) to separate a collective's result from a chosen message route. Allow 60 minutes; reading needs no GPU.

## Exact prerequisites

**[G01, G03]**: [device/context ownership](/en/multi-gpu/devices-contexts-ownership/) and [topology paths](/en/multi-gpu/topology-paths/). Stream ordering is developed next in [G05](/en/multi-gpu/nccl-stream-dependencies/), then applied in [LAB17](/en/labs/nccl-all-reduce/).

## Why a collective abstraction exists

Peer copies move data between selected endpoints, but a distributed reduction also needs participation, matching and a result-placement rule. Collective interfaces name that shared operation so a library can choose message routes suitable for the machine. NCCL supplies GPU communication primitives associated with CUDA streams. It does not turn a mathematical sum into a promise about ring algorithms, NVLink use or achieved bandwidth. MPI-like rank vocabulary also does not require MPI: EX24 is a single-process client.

## Rank and communicator ownership

A rank is an integer in `[0, R)` within a communicator. It is not a permanent GPU number, process ID or global identity. Each communicator handle is associated with a fixed rank and CUDA device. For this stable path, each rank uses a distinct **full GPU**; assigning one device to multiple ranks in the same communicator is unsupported and can hang. Experimental MIG support in 2.31 is outside this curriculum path.

`ncclCommInitAll(comms, R, devices)` creates all local handles in one process. Entry r of `devices` defines rank r's CUDA-visible device, so reordering the list changes that mapping. EX24 uses visible ordinals `0..R-1` and verifies them through `ncclCommUserRank`, `ncclCommCount` and `ncclCommCuDevice`. Reconcile those ordinals with physical identities privately using G03; visibility remapping changes ordinal meaning.

For a multi-process design, one participant obtains `ncclGetUniqueId`, distributes the ID through an **out-of-band CPU mechanism**, then each participant calls `ncclCommInitRank` with the same ID and rank count and a unique rank, after selecting its device. NCCL does not launch those processes or distribute the ID for you. A thread managing several ranks must group their initialization calls; do not combine initialization with collective calls in one group. EX24 chooses `InitAll` rather than introducing a process launcher.

## Match the entire collective contract

Every participating rank must issue compatible operations in the same order. Count is **elements of the datatype**, not bytes. Each call uses its own valid buffer on the communicator's device, with adequate extent and lifetime. Roots are communicator ranks, not CUDA ordinals. A successful local API return cannot certify that another rank used matching arguments.

| Operation | Count and placement contract |
| --- | --- |
| All-reduce | `count` input/output elements per rank; reduction result on every rank; no root argument |
| Reduce | `count` elements per rank; reduced output used on the root rank |
| Broadcast | `count` elements copied from the root rank to every rank |
| All-gather | `sendcount` input elements per rank; `R*sendcount` output elements in rank order |
| Reduce-scatter | `R*recvcount` input elements per rank; `recvcount` reduced elements for rank r's block |

The basic all-reduce signature supplies send/receive pointers, count, datatype, reduction operation, communicator and stream. `ncclInt32` with `ncclSum` means signed 32-bit addition; mismatched FP32 buffers or a byte count violate the contract. Exact same send/receive pointers select supported in-place all-reduce. Arbitrary overlapping ranges are not that in-place contract. EX24 uses separate arrays to make ownership visible.

## An oracle that can detect wrong participation

EX24 inputs are `x[r,i] = 3*(r+1)+(i mod 17)-8`. For R ranks the independently derived output is `3*R*(R+1)/2 + R*((i mod 17)-8)`. At R=2 and i=0, inputs -5 and -2 give -7. At R=4 and i=16, the expected result is 62. These are **hand-worked expectations**, not GPU logs. Counts 1, 257 and 1048576 test a scalar, an irregular extent and a larger buffer. R is bounded to 2–8; all partial sums fit int32. Compare every element on every rank after completion, not just rank zero or a checksum.

For floating-point reductions, reordering changes rounding; exact equality to a sequential CPU sum is not a universal correctness test. State dtype, accumulation behavior, finite-value rules, tolerance and input scale before testing. An all-reduce's identical result-placement contract is distinct from cross-version bitwise reproducibility. The integer EX24 deliberately avoids that ambiguity.

## Failure is part of the contract

Check CUDA and NCCL return values, group-end status and `ncclCommGetAsyncError`. The latter has **two statuses**: whether the query succeeded and the communicator state written through its output pointer. Network/asynchronous failures may prevent stream completion indefinitely. A blocking `cudaStreamSynchronize` alone is therefore a poor error monitor.

EX24 polls all rank streams and asynchronous states with a 60-second deadline after submission; an external 180-second process watchdog also bounds blocking initialization, group, finalization and abort. Fatal group errors apply to the group and may leave operations partially completed: attempt abort on every acquired communicator and fail the process. Do not invent successful output or reuse uncertain buffers. EX24's fatal policy avoids freeing possibly live buffers and exits; it is not a fault-tolerant recovery service. Normal cleanup waits for work, groups finalization, destroys handles, then frees allocations and streams. A failure in cleanup still fails the run.

## Practice and hardware gates

Start with [Exercises](/en/multi-gpu/nccl-communicators-collectives/exercises/), then [separate solutions](/en/multi-gpu/nccl-communicators-collectives/solutions/) and [PB-R6-004](/en/practice/#pb-r6-004). EX24 independently pins NCCL **2.31.2-1+cuda13.3** and Toolkit **13.3.1** on native Ubuntu 24.04 x86-64, C++17, driver ≥610.43.02. Two or more distinct full GPUs are required, each CC≥7.5, ≥8 GB total and ≥256 MiB free; library/context overhead is additional. LAB17 requires the full Environment Manifest and topology/platform assessment. Compilation evidence is independent; EX24 and LAB17 remain **Pending Hardware Verification** without qualifying two-GPU evidence.

## Retrieval questions

1. How can rank 0 refer to CUDA-visible device 3?
2. What does `count=257` mean for `ncclInt32`?
3. Why must all-gather allocate more output than input?
4. What can a rank-zero-only validation miss?
5. Which two results must an asynchronous-error query check?
6. Why does a valid mathematical result not prove a ring or NVLink path?

## Primary sources and rights

Reviewed **2026-09-19**. [SRC-CUDA-097](/en/sources-and-versions/#src-cuda-097) records current Context7 discovery and pinned 2.31.2 communicator/collective/group/error/version source review, binary package hashes and exact license. All instruction, arithmetic and Exercises are original CC BY 4.0; EX24 software is original Apache-2.0. No upstream example listing or recorded result is adapted.
