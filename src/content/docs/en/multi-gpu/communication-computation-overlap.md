---
title: 'G06: Prove Dependencies Before Claiming Overlap'
description: Chunk independent work, prove buffer lifetimes, and interpret a two-GPU timeline without inventing performance evidence.
pairId: g06
counterpart: /multi-gpu/communication-computation-overlap/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, chunking, dependencies, engines, critical-path, timeline, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G06
prerequisites: [G05, Q05, Q07]
relatedUnits: [LAB18, VIS16, VIS14, EX24]
hardwareGate: none
estimatedMinutes: 75
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'Nsight Systems User Guide', url: 'https://docs.nvidia.com/nsight-systems/UserGuide/index.html', version: '2026.5', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g06 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,chunking,dependencies,engines,critical-path,timeline,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G06 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G05,Q05,Q07' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'LAB18,VIS16,VIS14,EX24' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/communication-computation-overlap/" lang="zh-CN">阅读中文对应页</a>

## Outcome

Build a producer → all-reduce → consumer pipeline, verify every rank, then decide whether independent GPU activities overlapped in a qualified capture. Finish [LAB18](/en/labs/pipeline-nccl-computation/) with a dependency proof and an evidence-qualified conclusion, including “inconclusive” when appropriate. Allow 75 minutes for this unit; the browser executes no CUDA.

## Exact prerequisites

**[G05, Q05, Q07]**: [NCCL stream dependencies](/en/multi-gpu/nccl-stream-dependencies/), [asynchronous timing](/en/correctness/timing-asynchronous-gpu-work/), and [timeline-first analysis](/en/correctness/timeline-first-nsight-systems/). [EX24](/en/examples/nccl-all-reduce/) supplies the collective correctness foundation. The Lab solution extends that idea with actual producer and consumer kernels.

## Why pipelines appeared

A bulk-synchronous program computes a whole array, communicates it, then consumes it. Each phase exposes a wait even when the next independent chunk could be ready. Streams and events let software express a smaller dependency graph. NCCL adds topology-aware collectives to this asynchronous execution model. This removes unnecessary ordering; it does not reserve independent hardware or guarantee faster execution.

## Chunk work before adding streams

For N elements and chunk capacity C, use offsets kC and count `min(C, N-kC)`. Every rank issues the same chunk sequence, count, datatype and reduction. LAB18 uses out-of-place `ncclInt32`/`ncclSum`, one process and one submitting thread, default blocking communicators, and distinct input/output slices for each chunk. Tail elements are part of correctness. Do not change N when comparing chunk sizes.

Disjoint slices deliberately avoid a ring-buffer reuse hazard. Allocations remain live through final completion; events are unique per chunk within an iteration. A double-buffered implementation instead needs an extra consumer-complete → next-generation overwrite edge. Smaller C increases launches, event operations and collective overhead; larger C may leave too little independent work. Neither extreme is universally optimal.

## Prove the dependency graph

For every rank and chunk k:

| Step | Stream | Required edge |
| --- | --- | --- |
| Produce input P(k), then record ready(k) | p | All input writes precede the record |
| Wait ready(k), then all-reduce A(k) | c | Submit the record before its wait |
| After successful group end, record done(k) | c | Collective is enqueued before this record |
| Wait done(k), then consume Q(k) | q | No early read or overwrite |
| Drain all ranks, download, validate | host | All final consumers complete before observation or reuse |

For one thread managing several GPUs, group the matching A(k) calls across **all ranks**, end the group, then record each done(k). Never synchronize inside the group. A default blocking communicator's successful group end establishes enqueue, not GPU completion. Nonblocking NCCL communicators need the different G05 progress protocol and are outside this Lab's implementation.

There is no semantic edge from A(k) to P(k+1). That is the opportunity, not proof of overlap. The serial control drains all q streams after each chunk; the candidate drains only after all chunks. Both run exactly the same kernels and collective sequence. Do not put producer and communication streams into a single mixed-stream NCCL group: the pinned contract synchronizes participating streams around that group and can expand the graph. A device-wide synchronization in the inner loop likewise removes opportunities.

## Separate resources from dependencies

Copy engines move data for eligible copy operations. Compute kernels use SM execution resources. NCCL can use GPU kernels and selected transport/communication mechanisms; it is not synonymous with an independent copy engine. Communication may compete with computation for SMs, memory bandwidth, fabric links, scheduling and power. Engine count, separate stream names, `Async` API names, PCIe proximity, or an NVLink label do not establish concurrency.

LAB18 produces data on the GPU and keeps validation D2H copies outside the timed region, so a copy/compute intersection is not its target claim. Record topology and actual NCCL configuration; do not infer the selected algorithm from [VIS16](/en/visuals/collective-paths/). Reuse that logical model to reason about participation, and [VIS14](/en/visuals/nsight-systems-versus-nsight-compute/) to choose the next profiler question.

## Reason about the critical path

The critical path is the longest dependent chain from submission to final completion. For K equal chunks with hypothetical independent stages of durations p, a, q, an idealized pipeline takes `p+a+q+(K-1)*max(p,a,q)` rather than `K*(p+a+q)`. This lower-complexity model ignores launch cost, contention, rank skew and fill/drain imbalance. In LAB18, P and Q both use compute resources, so treating all three stages as independent servers is particularly optimistic.

Use the equation to ask what could improve, never to report a measured speedup. Overlap can exist while throughput worsens. A matched unprofiled control/candidate experiment and repeated end-to-end measurements are needed for a throughput conclusion. A bottleneck hypothesis needs a controlled intervention; a long bar alone does not establish causality.

## Read device intervals, not host bars

The [original teaching fixture](/assets/overlap-fixtures/lab18-timeline.json) uses **dimensionless synthetic ticks**, not microseconds or a captured report. In its overlap case, rank 0 A(0) is [4,10) and P(1) is [5,8), an intersection of 3 ticks; rank 1 has the same intervals. This illustrates local concurrency on both GPUs. A GPU 0 compute bar intersecting only a GPU 1 communication bar does not establish local overlap on either GPU. The fixture's serialized case has touching endpoints, hence zero intersection. Its host-only case is inconclusive despite intersecting API bars.

In a real capture, first establish source/binary identity, correctness, rank/device mapping, a common report time domain, complete CUDA activity collection and visible independent compute/communication intervals. Correlate collective launches with chunk order and source, not just a kernel-name guess. Check stream waits, synchronization, rank skew, diagnostics and dropped records. API duration and GPU duration are different rows. Missing rows or an unresolved mapping mean **inconclusive**, not zero overlap. One qualifying run only supports a claim about its recorded environment and region.

## Practice and acceptance

Complete the [timeline and pipeline Exercises](/en/multi-gpu/communication-computation-overlap/exercises/) before the [separate solutions](/en/multi-gpu/communication-computation-overlap/solutions/). Review [PB-R6-006](/en/practice/#pb-r6-006) and [PB-R6-007](/en/practice/#pb-r6-007). LAB18 retains **Pending Hardware Verification**: no qualifying two-GPU profiler evidence, throughput or bottleneck result is published. Neither a synthetic fixture nor a browser model can upgrade that status.

## Retrieval questions

1. Which edge protects the consumer, and when may its event be recorded?
2. Why is chunk k+1 potentially independent of all-reduce k?
3. What lifetime edge does a two-slot buffer add?
4. Why does a second stream or copy engine not prove NCCL overlap?
5. Can overlap increase while end-to-end throughput decreases?
6. Which missing evidence makes a timeline inconclusive rather than serialized?

## Primary sources and rights

Reviewed **2026-09-20**: [SRC-CUDA-099](/en/sources-and-versions/#src-cuda-099). Current Context7 results were reconciled with the immutable NCCL 2.31.2 stream/group sources and the owner Nsight Systems 2026.5 guide; LAB18 records the exact installed profiler build. Text, dependency table and fixture are original CC BY 4.0; the downloadable exercise solution is original Apache-2.0. No owner diagrams or sample source were copied.
