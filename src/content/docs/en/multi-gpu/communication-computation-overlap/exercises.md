---
title: 'G06 Exercises: Pipeline and Timeline Review'
description: Implement a dependency-safe pipeline and classify synthetic intervals before inspecting hardware evidence.
pairId: g06-exercises
counterpart: /multi-gpu/communication-computation-overlap/exercises/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, timeline, pipeline, review]
resourceKind: exercise-set
unitId: G06-EXERCISES
prerequisites: [G06]
relatedUnits: [LAB18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,timeline,pipeline,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G06 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/communication-computation-overlap/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite and submission

Exact prerequisite **[G06]**: [communication/computation overlap](/en/multi-gpu/communication-computation-overlap/). Reviewed 2026-09-20; [SRC-CUDA-099](/en/sources-and-versions/#src-cuda-099). Submit reasoning before opening solutions. Paper analysis needs no GPU; implementation execution uses the [LAB18](/en/labs/pipeline-nccl-computation/) two-GPU gate and remains Pending Hardware Verification until qualified evidence exists.

## Exercise 1: classify the timeline

**Goal:** classify all three cases in the [synthetic fixture](/assets/overlap-fixtures/lab18-timeline.json), calculate each rank's A0/P1 intersection, and state what may be concluded.

**Constraints:** half-open intervals; dimensionless ticks; no recorded GPU execution. Do not sum concurrent intervals into elapsed time. Then consider an otherwise complete real report with GPU 0 compute [4,10) and only GPU 1 communication [5,8): distinguish system-wide simultaneity from same-GPU overlap. Finally remove rank 1's activity rows and decide whether classification still qualifies.

**Acceptance:** distinguish synthetic overlap, synthetic serialization and inconclusive host-only data; explain touching endpoints, missing rows and cross-device scope. List the correctness, source/binary, manifest, topology, permissions, profiler diagnostics and correlation needed before a real two-GPU claim. Explicitly reject throughput or bottleneck inference from the fixture.

<details><summary>Hint 1</summary>Compare only intervals of the intended scope and independent work on the same device.</details>
<details><summary>Hint 2</summary>Use max(0, min(ends) − max(starts)); an absent device bar is not an interval of length zero.</details>

## Exercise 2: build the pipeline

**Goal:** implement the LAB18 serial and pipeline modes using p/c/q streams, per-chunk ready/done events, and the published integer oracle. Keep the same kernels and collective sequence in both modes.

**Constraints:** one process/thread; R=2–8 distinct qualifying GPUs; N≤1048576; C≤N; ≤1024 chunks; out-of-place int32 sum; one matching all-rank group per chunk; default blocking communicators; no synchronization inside a group. Use disjoint slices and keep all buffers alive. Check errors, retain an external watchdog, and validate every element on every rank after every iteration.

**Acceptance:** handle (N,C)=(1,1),(257,128),(1048576,65536), including the single-element tail. Explain each event edge, why recording done precedes consumer submission only after successful group end, and why events can be reused between drained iterations. Supply five validated warm-ups, matched timing scope, repeated unprofiled statistics and a separate capture plan. Predict both contention and launch-overhead reasons for a slower pipeline; performance improvement is not required. As a paper extension, give the extra lifetime edge for two reusable buffer slots.

<details><summary>Hint 1</summary>Host submission order does not connect different CUDA streams. Identify who writes and who next reads each slice.</details>
<details><summary>Hint 2</summary>The consumer's completion transitively proves its producer and collective completed; the next generation must wait for the previous consumer before overwriting a reused slot.</details>

## Review

Compare with the [separate solutions](/en/multi-gpu/communication-computation-overlap/solutions/), then complete [LAB18](/en/labs/pipeline-nccl-computation/) and [PB-R6-006](/en/practice/#pb-r6-006)/[PB-R6-007](/en/practice/#pb-r6-007). The source download is a reference solution, not runtime evidence.
