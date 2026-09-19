---
title: 'G02: Query Peer Access and Order Peer Copies'
description: Separate capability, enablement, data movement and completion, with an explicit host-staged fallback.
pairId: g02
counterpart: /multi-gpu/peer-access-copies/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, capability, ordering, fallback, gates, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G02
prerequisites: [G01, M01, M08]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 60
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA peer access API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__PEER.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
  - { title: 'CUDA multi-GPU systems', url: 'https://docs.nvidia.com/cuda/archive/13.2.0/cuda-programming-guide/03-advanced/multi-gpu-systems.html', version: '13.2.0', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g02 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/peer-access-copies/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,capability,ordering,fallback,gates,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G02 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G01,M01,M08' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1,13.2.0' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/peer-access-copies/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Build a decision table that distinguishes a successful capability query, successful access enablement, an ordered copy and a correct result. Implement a deliberately conservative host-staged fallback. Allow 60 minutes plus implementation; reading has no hardware gate.

## Exact prerequisites

**[G01, M01, M08]**: [device ownership](/en/multi-gpu/devices-contexts-ownership/), [address spaces](/en/memory/address-spaces/) and [event dependencies and timing](/en/memory/event-dependencies-timing/). The implementation is one process and one submitting host thread using two GPUs; no NCCL knowledge is required.

## Why peer access is separate from a pointer

Without direct peer movement, a transfer can pass through host memory. Peer access lets suitable devices access another device's allocation and allows copies to avoid host staging. Unified virtual addressing simplifies pointer identification; it neither grants access nor synchronizes a producer. Physical connectivity, CUDA permission and application ordering are three separate questions.

## Query direction, then enable deliberately

For distinct selected devices A and B, call and check `cudaDeviceCanAccessPeer(&canAB, A, B)` and `cudaDeviceCanAccessPeer(&canBA, B, A)`. A successful call returning zero is **known unavailable**; a failed call is **unknown/error**, not zero. A→B means that a kernel executing on A may access memory allocated on B. It does not mean the direction of payload travel in every copy API.

To enable B→A, select B and call `cudaDeviceEnablePeerAccess(A, 0)`. Flags must be zero. The permission is unidirectional; it does not enable A→B. This exercise's conservative direct-copy branch requires both query values to be one and enablement in both directions; that is an exercise policy, not a universal requirement for every directed peer operation. Ordinary `cudaMalloc` allocations are used; memory-pool access permissions are a different contract.

| State | Action |
| --- | --- |
| query succeeds, capability zero in either direction | record unavailable; use explicit host staging |
| queries succeed with both values one | attempt the two directed enablements, track each result |
| `cudaErrorPeerAccessAlreadyEnabled` | in an owned application, record existing state; do not claim ownership of enabling it or disable another component's permission |
| any unexpected query/enable/launch/completion error | stop this run, preserve the error; do not silently turn a damaged context into a successful fallback result |
| intentional forced-staging mode | skip peer enablement and exercise the same oracle on staging even when peers are compatible |

Enabling peer access does not transfer data or prove the atomic capabilities of remote memory. It can add mapping overhead to allocations. Connection limits depend on system configuration; the archived guide states eight peer connections per device for non-NVSwitch systems. Do not extrapolate the two-device lesson into an all-to-all enablement policy.

## Draw the producer–copy–consumer chain

Use explicit nonblocking streams sA on A and sB on B; create dependency events with timing disabled. The following is an **operation ledger**, not a runnable program or a recorded trace. Check all calls and launch/completion errors in the learner implementation.

| Step | Selected device | Operation and reason |
| --- | --- | --- |
| 1 | A | producer writes source in sA; record readyA in sA after the producer |
| 2 | B | after host submission of that record, enqueue `cudaStreamWaitEvent(sB, readyA, 0)` |
| 3 | B | enqueue `cudaMemcpyPeerAsync(dstB, B, srcA, A, bytes, sB)` |
| 4 | B | enqueue consumer in sB; record doneB in sB after the consumer |
| 5 | host | synchronize doneB, check completion, copy result back and exact-compare |
| 6 | A and B in turn | after every user completes, free owned allocations and destroy owned events/streams; disable only permissions enabled by this run |

An event must be recorded in a stream on its own device. A stream may wait on an event from another device; host event synchronization/query can also target another device. Record readyA **before** submitting its wait: a never-recorded event does not represent a future producer. Re-recording events requires iteration-specific lifetime reasoning; this exercise uses one dependency cycle at a time.

`cudaEventElapsedTime` cannot subtract events belonging to different devices. Use same-device timing intervals for local work, or a host monotonic clock around a fully specified end-to-end interval ending after both devices finish. Waiting on doneB orders the chain above, but unrelated work elsewhere still needs its own completion. Do not infer overlap from an `Async` suffix. The implicit NULL-stream peer copy has wider ordering with both devices; using it can hide a missing explicit dependency and distort a concurrency comparison.

The source must remain unchanged until the copy finishes, and the destination must remain allocated until all consumers finish. No spin flag or remote atomic protocol is needed. Peer-access capability does not by itself license system-scope atomics.

## Make the fallback visibly correct

Allocate one pinned host buffer using `cudaHostAlloc` with `cudaHostAllocPortable`, large enough for the payload. After the producer in sA, enqueue A→host with `cudaMemcpyAsync` and **synchronize sA** before submitting host→B in sB. Enqueue the B consumer after that upload; synchronize sB before reading results, reusing or freeing staging. The host wait is intentionally conservative: two different device streams do not automatically order their use of the same host buffer.

Staging keeps ownership local and incurs two transfers. Record it explicitly as `host-staged`; do not label an opaque runtime copy path “NVLink” from a successful API return. Test the forced-staging mode on peer-capable hardware too. If allocation or device access fails, report a blocker rather than pretending a fallback ran.

## Workload, gates and evidence

Use the complete [G01 environment contract](/en/multi-gpu/devices-contexts-ownership/#external-environment-and-evidence-contract): native Linux, Toolkit 13.3.1, selected driver ≥610.43.02, two full GPUs each CC≥7.5, ≥8 GB total and ≥256 MiB free, exact per-device CC/compiler targets and full [Environment Manifest](/en/start/environment-manifest/). Pin the actual process model to one process/one submitting thread. Record both directional query values and API statuses separately, ownership of enablement, stream/event devices, private topology source and permissions.

Before any bare-metal Linux **PCIe peer transfer**, the operator must establish the IOMMU/ACS configuration. The selected archived guide does not support IOMMU-enabled bare-metal PCIe P2P and warns about corruption; VM passthrough has a different contract. Unknown or incompatible state means **do not run that direct branch**. Use independent local copies/staging and ask the machine operator to assess the configuration. This lesson does not prescribe disabling a host's IOMMU or ACS. A compatible CC or a peer query cannot replace this platform check.

For `N = 1, 257, 1048576`, source A writes `i mod 251` as `uint32_t`; B adds one after copying. Compare every returned value against `(i mod 251)+1` computed independently on the CPU. Maximum payload is **4 MiB** on each GPU plus **4 MiB** portable pinned staging; host oracle/output arrays and context overhead are separate. Repeat with A/B roles reversed and test forced staging. Expected acceptance is zero mismatches, retained branch/error records and completion before release. These are criteria, not observed output. Stop on errors before timing. Without qualifying evidence, both direct and staged GPU activities remain **Pending Hardware Verification**, with no Compile-Checked or performance claim.

## Exercises and review

Attempt the [peer Exercises](/en/multi-gpu/peer-access-copies/exercises/) and then read the [separate solutions](/en/multi-gpu/peer-access-copies/solutions/). [PB-R6-002](/en/practice/#pb-r6-002) audits an early-free bug despite valid peer capability.

## Retrieval questions

1. What does the direction in `cudaDeviceCanAccessPeer(A,B)` describe?
2. Why is a failed query different from a successful zero result?
3. Which call grants access, which moves bytes, and which orders the consumer?
4. Why must readyA be recorded before the wait is submitted?
5. Why can B wait on A's event but not use it with B's event for elapsed time?
6. What prevents the host staging buffer from being reused too soon?

## Primary sources and rights

Reviewed **2026-09-19**. [SRC-CUDA-095](/en/sources-and-versions/#src-cuda-095) covers the exact 13.3.1 peer API and the archived 13.2 multi-device ordering/IOMMU contract, refreshed through Context7 discovery. All ledgers, workload formulas and Exercises are original CC BY 4.0; NVIDIA documentation is linked and paraphrased, with no imported sample implementation or measured throughput.
