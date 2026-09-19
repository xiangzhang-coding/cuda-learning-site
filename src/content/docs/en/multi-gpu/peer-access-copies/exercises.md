---
title: 'G02 Exercises: Separate Permission from Completion'
description: Repair a peer dependency chain and implement a checked staged fallback.
pairId: g02-exercises
counterpart: /multi-gpu/peer-access-copies/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: G02-EXERCISES
prerequisites: [G02]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA peer access API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__PEER.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/peer-access-copies/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G02 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/peer-access-copies/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[G02]**: [peer access and copies](/en/multi-gpu/peer-access-copies/). Reviewed 2026-09-19; [SRC-CUDA-095](/en/sources-and-versions/#src-cuda-095). Paper analysis has no GPU gate. Execution inherits G02's native Linux, two-GPU, exact CC/memory/driver/Toolkit, one-process/one-thread, compatibility, IOMMU/ACS, topology-source and permission contract and full Environment Manifest. All unobserved runtime work remains Pending Hardware Verification.

## Exercise 1: repair a synthetic peer trace

**Goal:** repair this proposal on paper: only A→B is queried, then B consumes an A allocation; a wait on readyA is submitted before readyA has ever been recorded; elapsed time subtracts an A event from a B event; the source is freed when the producer finishes.

**Constraints:** annotate access direction separately from copy direction. Use G02's explicit producer→event→wait→copy→consumer chain. Handle capability zero, query failure, already-enabled permission and unexpected enablement error separately. Do not execute invalid accesses.

**Acceptance:** query the needed directions, record before waiting, keep event-record device ownership valid, reject cross-device elapsed time, and retain the source until copy completion. State why a capability bit proves neither actual route nor remote atomic support.

<details><summary>Hint 1: read the parameter roles</summary>Query device is the accessor; peerDevice owns the accessed memory. Reverse payload direction does not automatically reverse that definition.</details>
<details><summary>Hint 2: draw the last user</summary>The producer's completion precedes the copy's final read. The source owner needs that later completion before release.</details>

## Exercise 2: implement two paths with one oracle

**Goal:** implement direct-copy and forced-host-staging modes for G02's `N=1,257,1048576`, `uint32_t` payload. Produce `i mod 251` on A; copy; add one on B; exact-compare with the CPU formula. Repeat with roles reversed.

**Constraints:** use one process and one submitting thread; maximum payload 4 MiB per GPU and 4 MiB portable pinned staging. Respect the direct-path platform gate and bidirectional policy. Use a blocking completion boundary between staged download and upload, and keep staging alive through upload. Check errors at every API, launch and completion boundary; report unavailable and error distinctly. No timing before correctness.

**Acceptance:** all cases must compare every output, record selected branch, ownership and ordered cleanup, and preserve the complete manifest and actual logs. Force staging even when peer-capable. If the direct branch is blocked, explicitly retain its Pending Hardware Verification status rather than count the fallback as its success. A forced branch tests application behavior; it does not prove how an opaque runtime copy would route.

<details><summary>Hint 1: share the oracle, not the dependency bug</summary>Both paths must independently reach the same CPU result. Matching two GPU outputs is insufficient.</details>
<details><summary>Hint 2: make reuse a dependency</summary>Do not overwrite staging until B's upload has finished. Portable pinned allocation does not itself order the devices.</details>

## Review separately

Read the [solutions](/en/multi-gpu/peer-access-copies/solutions/) after both attempts and review [PB-R6-002](/en/practice/#pb-r6-002).
