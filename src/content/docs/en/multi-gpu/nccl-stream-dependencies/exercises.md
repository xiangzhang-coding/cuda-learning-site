---
title: 'G05 Exercises: Find the Missing Completion Edge'
description: Repair grouped submission and a producer-communication-consumer graph.
pairId: g05-exercises
counterpart: /multi-gpu/nccl-stream-dependencies/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, group, dependency, review]
resourceKind: exercise-set
unitId: G05-EXERCISES
prerequisites: [G05]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,group,dependency,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G05 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-stream-dependencies/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[G05]**: [stream dependencies](/en/multi-gpu/nccl-stream-dependencies/). Reviewed 2026-09-19, [SRC-CUDA-098](/en/sources-and-versions/#src-cuda-098). Draw ledgers without hardware. Optional implementation requires LAB17's two-GPU Environment Manifest; runtime remains Pending Hardware Verification until qualifying execution.

## Exercise 1: a wait inside the group

**Goal:** repair this one-thread order: group start → rank 0 all-reduce → synchronize rank 0 stream → rank 1 all-reduce → group end.

**Constraints:** retain two local ranks and default blocking communicators. Check both immediate and group errors. Do not test the hang deliberately on shared infrastructure.

**Acceptance:** issue both ranks before closing the group, then poll every rank's stream and asynchronous error state. Explain deferred enqueue and why group end is still not GPU completion. Include an external timeout for blocking host calls and the nonblocking-communicator `ncclInProgress` comparison.

<details><summary>Hint 1</summary>Ask whether rank 1 has even been submitted when rank 0 waits.</details>
<details><summary>Hint 2</summary>Returning from group end and returning from a successful completion check are different milestones.</details>

## Exercise 2: draw the missing event edges

**Goal:** a producer writes in stream p, all-reduce runs in c, and a consumer reads in q; the host issues calls in that order without events. Repair the graph.

**Constraints:** use explicit nonblocking streams and one iteration; event ownership follows each rank's device. No device-wide synchronization or unsupported overlap claim. Also consider grouping two communications using different streams.

**Acceptance:** ready is recorded after production and submitted before c waits; done is recorded after successful collective enqueue and q waits before consumption; final use precedes buffer reuse/free. Explain the cross-stream synchronization introduced by mixed-stream grouping. State that a static graph cannot measure overlap.

<details><summary>Hint 1</summary>Host submission order between different streams is not a producer-consumer edge.</details>
<details><summary>Hint 2</summary>List what each event proves, and who is allowed to record it.</details>

## Review separately

Then read the [solutions](/en/multi-gpu/nccl-stream-dependencies/solutions/) and [PB-R6-005](/en/practice/#pb-r6-005).
