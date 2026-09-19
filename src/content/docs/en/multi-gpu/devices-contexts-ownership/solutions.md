---
title: 'G01 Solutions: Ownership Before Cleanup'
description: Review thread-local selection, completion boundaries and plugin cleanup authority.
pairId: g01-solutions
counterpart: /multi-gpu/devices-contexts-ownership/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank-review, retrieval]
resourceKind: solution-set
unitId: G01-SOLUTIONS
prerequisites: [G01-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Runtime context management', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/driver-vs-runtime-api.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/devices-contexts-ownership/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank-review,retrieval' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/devices-contexts-ownership/solutions/" lang="zh-CN">阅读中文对应页</a>

## Attempt first

Exact prerequisite **[G01-EXERCISES]**: [ownership Exercises](/en/multi-gpu/devices-contexts-ownership/exercises/). These are original paper derivations, reviewed 2026-09-19 against [SRC-CUDA-094](/en/sources-and-versions/#src-cuda-094), not GPU results.

## Solution 1: repair the trace

The worker must select B explicitly before launching into sB. Creating sB on the coordinator is legal within the shared ordinary primary context, but ownership and host handoff must be explicit. The worker either waits for its GPU work before returning or returns a completion handle under a lifetime protocol; the coordinator must wait for completion before reading/freeing results. A join alone proves only that the host function returned.

Reset is removed: the plugin selects the proper device, waits for every use of its own allocation, frees it and destroys only its owned handles. Another plugin's allocations survive this cleanup. In a separate process, the worker creates its own streams and allocations; the original numeric pointer/stream is invalid as a sharing contract. Independent results can be returned as host data. Explicit IPC would require a new contract. Common mistakes are assuming selection is global, equating enqueue with completion and treating context sharing as ownership transfer.

## Solution 2: implementation review

The one-thread version validates and records the two actual devices, selects each in turn, creates its own stream/buffer and launches a bounds-checked fill. For a block size of 128, 257 elements require three blocks; only indices 0–256 write. It waits for each result before the independent CPU comparison. Expected values depend on the selected ordinal d, while the identity ledger proves that the two ordinals identify distinct devices.

The two-worker version preserves the same allocation and comparison contract. Each worker selects its assigned device on entry and checks the selection. Each completes its transfer and validates before returning; then the coordinator joins and combines statuses. Alternatively, completion handles can be returned with an explicit lifetime protocol. Neither variant calls reset. Allocation/launch/completion failures are failures, not empty passing arrays. A blocked run records the unmet gate and keeps Pending Hardware Verification. No compilation, overlap or timing is claimed by this solution.

## Practice Bank review

For [PB-R6-001](/en/practice/#pb-r6-001), both plugins use the same device's primary context in the same process under the stated default path. Resetting that device invalidates the other plugin's resources even if their host threads differ. Correct cleanup releases the first plugin's resources only after their last use. Separate processes provide different resource ownership, but would change the sharing architecture; it is not a drop-in fix for a shared-pointer design. A library-level ownership protocol is the direct repair.

## Retrieval answers

`cudaSetDevice` selects for the calling host thread. Default-path runtime users share one primary context per device per process. Local ordinals depend on visibility; they do not establish interprocess sharing. A join does not imply GPU completion when the thread only submitted work. A peer consumer extends buffer lifetime through its last access. Reset is context-wide cleanup, not allocation-local cleanup. These explanations require no hardware and confer no runtime evidence.
