---
title: 'G05: Order NCCL Work on CUDA Streams'
description: Distinguish host return, grouped enqueue, stream completion and cross-stream dependencies.
pairId: g05
counterpart: /multi-gpu/nccl-stream-dependencies/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, enqueue, grouping, dependencies, multi-stream, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G05
prerequisites: [G04, M07, M08]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 60
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL pinned stream and group semantics', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g05 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/nccl-stream-dependencies/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,enqueue,grouping,dependencies,multi-stream,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G05 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G04,M07,M08' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-stream-dependencies/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Draw and justify a producer → collective → consumer chain for every rank. Identify when the host has submitted work and when the device has actually finished. Use [EX24](/en/examples/nccl-all-reduce/) and finish [LAB17](/en/labs/nccl-all-reduce/). Allow 60 minutes; the diagrams run no CUDA.

## Exact prerequisites

**[G04, M07, M08]**: [collective contracts](/en/multi-gpu/nccl-communicators-collectives/), [streams](/en/memory/stream-ordering/) and [events](/en/memory/event-dependencies-timing/). The code path uses the G04 two-GPU environment, not a browser GPU.

## Why host calls are not a timeline

CUDA streams let the host submit dependency-ordered work while devices execute asynchronously. NCCL follows this model instead of making every host call a completed communication barrier. A drawing of host call order therefore needs a second layer: device execution edges. Historically, grouping also solves a practical deadlock: one host thread cannot block waiting for a second local rank that it has not submitted yet.

## Three distinct milestones

For a blocking communicator outside a group, successful collective return means work has been enqueued to the supplied stream, **not completed**. Inside a group, even enqueue may be deferred until the outermost `ncclGroupEnd`. Its successful blocking return means grouped work is enqueued. Device completion requires CUDA stream/event completion plus error handling.

“Blocking communicator” describes NCCL's host progress behavior; it does not make a collective a device-synchronous API. Conversely, `cudaStreamNonBlocking` controls CUDA's implicit legacy-stream dependencies and does not select a nonblocking NCCL communicator. EX24 uses default blocking NCCL communicators with nonblocking CUDA streams.

Nonblocking NCCL communicators, created with `ncclCommInitRankConfig` and `config.blocking=0`, have a different host progress contract: group end may return `ncclInProgress`. Poll **all involved communicators** to `ncclSuccess` before related CUDA operations, checking query errors, asynchronous state and a deadline. Only then is enqueue established; GPU completion still remains. This is a version-pinned comparison, not EX24's runtime configuration.

## Group before waiting

For one thread managing R devices, open one group, issue the matching all-reduce for every rank, then close the group. Do not synchronize the first rank inside the group: work can still be deferred and later ranks have not arrived. Always check individual calls and group end; matching errors are not a safe experiment to run without a watchdog.

Groups preserve collective-order obligations. If rank 0 issues A then B while rank 1 issues B then A, grouping does not fix the program; it may hang or return incorrect results. Initialization and communication use separate groups. Nested groups launch only at the outermost end. NCCL 2.x communication calls inside a group do not require a device selection before each call, but CUDA allocation/copy/event calls and `ncclCommInitRank` still require correct device ownership.

## Prove producer and consumer edges

EX24 uses one explicit stream per rank. H2D upload, all-reduce and D2H download are ordered in that stream. All downloads are submitted after successful group end, and all ranks complete before host comparison, reuse or cleanup. Pageable host vectors may make copies block; the `Async` suffix establishes no observed overlap. Input/output vectors stay alive through completion.

For a future two-stream implementation, use this **logical ledger**, not a captured trace:

| Order per rank | Stream | Required edge |
| --- | --- | --- |
| produce input, record ready event | producer stream | record follows all writes |
| wait on ready, enqueue collective | communication stream | submit the event record before its wait |
| after successful group enqueue, record done | communication stream | done follows collective |
| wait on done, consume output | consumer stream | no consumer reads before completion |
| wait for final use before reuse/free | host or owning stream | keep input stable and output alive |

Events belong to a device and must be recorded on its stream. A wait on a never-recorded event is not a promise to wait for a future record. Re-recorded events need generation-aware reasoning; this ledger assumes one iteration at a time. Avoid measuring elapsed time between events from different devices. Reuse [the stream/event visual](/en/memory/event-dependencies-timing/) for dependency reasoning and [VIS16](/en/visuals/collective-paths/) for logical message paths.

## Multiple streams do not imply independence

The pinned NCCL stream guide states that mixing streams in one group creates dependencies across those streams before the NCCL kernel starts and blocks them until it completes: a synchronization point among the **participating streams**, not a host-wide or device-wide barrier. Combining otherwise independent operations may therefore widen dependencies. Separate groups do not automatically prove overlap either.

For multiple communicators on a device, maintain consistent global launch order across ranks. NCCL 2.26 introduced optional `NCCL_LAUNCH_ORDER_IMPLICIT`; enabling it still requires consistent host issue order. Do not rely on an unrecorded environment default or let multiple host threads race the launch order. EX24 deliberately uses one communicator membership and one submitting thread. Buffer aliasing can add further dependencies even when streams and communicators differ.

## Practice and acceptance

Complete the [Exercises](/en/multi-gpu/nccl-stream-dependencies/exercises/) before the [solutions](/en/multi-gpu/nccl-stream-dependencies/solutions/); audit [PB-R6-005](/en/practice/#pb-r6-005). LAB17 retains rank logs, device assignment, topology, versions, process model and stream graph with correctness. Its acceptance is every rank's exact output and successful cleanup; no latency or overlap claim follows. Both EX24 and LAB17 remain **Pending Hardware Verification**, with independent empty published compilation evidence until reviewed records exist.

## Retrieval questions

1. What does a successful collective return mean inside a group?
2. Why can a blocking NCCL communicator still execute asynchronously on a GPU?
3. Why must a single host thread group all local ranks before waiting?
4. Where should a consumer-completion event be recorded?
5. What dependency does grouping multiple streams add?
6. Why does changing to two streams not prove communication/compute overlap?

## Primary sources and rights

Reviewed **2026-09-19**. [SRC-CUDA-098](/en/sources-and-versions/#src-cuda-098) pins stream/group/communicator semantics to NCCL 2.31.2 after current Context7 discovery; CUDA event ownership follows the archived contracts recorded by G01/M08. Original ledger and prose, CC BY 4.0. No timeline, algorithm or performance observation is fabricated.
