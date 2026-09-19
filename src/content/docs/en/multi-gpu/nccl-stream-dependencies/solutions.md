---
title: 'G05 Solutions: Enqueue, Then Prove Completion'
description: Review grouped enqueue and explicit event dependencies.
pairId: g05-solutions
counterpart: /multi-gpu/nccl-stream-dependencies/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, group, dependency, review]
resourceKind: solution-set
unitId: G05-SOLUTIONS
prerequisites: [G05-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,group,dependency,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-stream-dependencies/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Attempt [G05-EXERCISES](/en/multi-gpu/nccl-stream-dependencies/exercises/) first. Reviewed 2026-09-19, [SRC-CUDA-098](/en/sources-and-versions/#src-cuda-098).

## Solution 1: submit before waiting

Correct order: group start → rank 0 all-reduce → rank 1 all-reduce → checked group end → all-rank error/completion polling → compare. A call inside the group may not have enqueued anything, and the unsent second rank cannot participate while the sole submitting thread waits. Successful blocking group end establishes enqueue, not completion. If a nonblocking communicator's group returns `ncclInProgress`, first poll all involved communicators to success before related CUDA operations; then check stream completion separately.

Retain immediate-call and group errors. Fatal group failure requires abort of all involved communicators; a 60-second polling deadline alone cannot interrupt a blocked host call, so EX24 also requires its external watchdog. **Common error:** interpret `cudaStreamNonBlocking` as nonblocking NCCL progress.

## Solution 2: events are proof edges

For each rank, produce in p and record ready there. After submitting the record, make c wait on ready. Submit all ranks' collectives as a group. After successful enqueue, record done in c; q waits on done before reading the receive buffer. Keep send buffers unchanged and receive buffers alive until their last use completes. Record events only on streams belonging to their device; never treat an unrecorded event as a future notification.

**Valid alternative:** keep production, communication and consumption in one stream per rank as EX24 does; its stream order supplies the edges. Grouping communications on multiple streams introduces a dependency point across participating streams, so it may eliminate anticipated independence. Neither solution is an overlap measurement. Actual overlap would require a separately scoped profiler and measurement contract.

## Evidence review

Optional implementation follows LAB17's two-GPU Environment Manifest. Keep recorded results empty when hardware is absent; **Pending Hardware Verification** remains. This reviewed dependency graph grants no compile, timing or runtime evidence.
