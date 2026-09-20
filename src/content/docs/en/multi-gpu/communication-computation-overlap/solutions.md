---
title: 'G06 Solutions: Dependencies, Intervals, and Evidence'
description: Review interval scope and a complete original pipeline implementation without upgrading runtime evidence.
pairId: g06-solutions
counterpart: /multi-gpu/communication-computation-overlap/solutions/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, timeline, pipeline, retrieval, sources]
resourceKind: solution-set
unitId: G06-SOLUTIONS
prerequisites: [G06-EXERCISES]
relatedUnits: [G06, LAB18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,timeline,pipeline,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/communication-computation-overlap/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before reading

Complete [G06-EXERCISES](/en/multi-gpu/communication-computation-overlap/exercises/). Return to [G06](/en/multi-gpu/communication-computation-overlap/) for the dependency model. Reviewed 2026-09-20.

## Solution 1: intervals have scope

The synthetic overlap case has `min(10,8)-max(4,5)=3` ticks on **each** rank. The serialized case has `max(0,min(10,13)-max(4,10))=0`. Host API intervals do not reveal GPU activity, so the third case is inconclusive. None is measured evidence. A cross-GPU intersection establishes only simultaneous activities on different devices; it cannot prove local overlap. Missing rank activity makes the two-GPU analysis incomplete.

A real classification requires a qualifying two-GPU manifest and topology, source/binary identity, complete per-rank correctness, authorized tracing, complete diagnostics and raw report custody, a common time domain, and defensible operation/chunk correlation. A bar alone does not show data independence. A synthetic timeline supplies none of this. Overlap is also compatible with worse throughput under SM or bandwidth contention; causality needs controlled experiments.

## Solution 2: a complete bounded implementation

Download the [original Apache-2.0 CUDA solution](/assets/exercise-solutions/g06-pipeline.cu), then follow [LAB18](/en/labs/pipeline-nccl-computation/) for the exact build, watchdog, workload matrix, validation and capture procedure. It uses `produce`, one grouped `ncclAllReduce` per chunk across all ranks, and `consume`. Input and output are separate full arrays; each chunk owns its slice. Thus the next producer never overwrites a slice still being communicated. The sum is rank-dependent and the consumer transformation has an independent closed-form oracle.

`ready[k]` is recorded on p before c's wait is submitted. Default blocking NCCL communicators establish enqueue at successful outer group end; only then is `done[k]` recorded on c. q waits on done before consuming. Draining final q on **every rank** transitively completes all earlier work. Events are re-recorded only in the next fully drained/validated iteration, avoiding accidental waits on the wrong generation. Timing-disabled events express ordering without cross-device elapsed-time calculations.

For N=257/C=128, counts are 128, 128 and 1, with offsets 0,128,256. The final element must use global index 256. At R=2/t=0/i=0, inputs -5 and -2 reduce to -7; consumption yields **-13**. Five warm-ups are validated, and all retained iterations are checked. Rank≤8 keeps integer arithmetic bounded. Errors do not free live buffers; the process aborts communicators under an external deadline.

Serial mode drains consumers after each chunk; pipeline mode removes those intermediate host waits. This creates opportunity without promising scheduler concurrency. Small kernels may be dominated by submission overhead; NCCL may contend with them. Do not “fix” an unexpectedly slow pipeline by removing correctness, changing work or reporting profiled samples as unprofiled.

For the optional two-slot variant, record `consumed[generation]` after Q(k). Before P(k+2) overwrites slot k mod 2, its stream must wait for that previous generation's consumer. Never wait on an event that has not yet been recorded, or re-record it while earlier-generation consumers still depend on it. The reference deliberately uses disjoint slices instead.

## Retrieval answers

1. done protects consumption; record it on the communication stream after successful enqueue.
2. The next chunk has independent input/output slices; it does not consume the previous reduction.
3. Previous consumer completion must precede next-generation overwrite of the reused slot.
4. Streams express ordering; resource availability, transport choice and contention still decide execution.
5. Yes: contention, launch/event costs and fill/drain can outweigh concurrency.
6. Missing device rows, correctness, identity, complete collection or operation mapping makes the result inconclusive.

## Sources and evidence boundary

[SRC-CUDA-099](/en/sources-and-versions/#src-cuda-099), reviewed 2026-09-20. Original explanation and fixture: CC BY 4.0; solution software: Apache-2.0. No captured execution is attached. LAB18 remains **Pending Hardware Verification**, with empty compilation and recorded observations until independently qualified evidence is reviewed.
