---
title: 'G01: Assign Devices, Contexts, and Owners'
description: Build an explicit per-process and per-thread ownership ledger before using two GPUs.
pairId: g01
counterpart: /multi-gpu/devices-contexts-ownership/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, model, ownership, execution, environment, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G01
prerequisites: [F07, M07]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 50
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Runtime context management', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/driver-vs-runtime-api.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
  - { title: 'CUDA multi-GPU systems', url: 'https://docs.nvidia.com/cuda/archive/13.2.0/cuda-programming-guide/03-advanced/multi-gpu-systems.html', version: '13.2.0', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g01 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/devices-contexts-ownership/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,model,ownership,execution,environment,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G01 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'F07,M07' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1,13.2.0' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/devices-contexts-ownership/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Given a two-device workload, name the owner and lifetime of every allocation, stream and event; choose a process model; explain which host thread selects which device. Reading and paper Exercises need no GPU. Allow 50 minutes plus external implementation time.

## Exact prerequisites

**[F07, M07]**: [Runtime and Driver APIs](/en/foundations/runtime-driver-api/) and [stream ordering](/en/memory/stream-ordering/). No collective communication library is required.

## Why the single-device shortcut stops working

A first CUDA program can let the runtime select device zero. Adding another GPU does not enlarge that context into a machine-wide execution space. The Driver API exposes context management; the Runtime API reduces bookkeeping through primary contexts. Multi-GPU work brings that bookkeeping back into the program's design: a pointer, stream or device ordinal alone does not describe its ownership.

## Five different objects

| Object | Meaning in this unit | What it does not establish |
| --- | --- | --- |
| Device | A visible CUDA device, queried with `cudaGetDeviceCount` and `cudaGetDeviceProperties` | An ordinal is not a stable physical identity across processes or visibility settings |
| Context | Device execution state and associated resources | One context does not cover every GPU |
| Process | An address space with its own CUDA state | Another process cannot dereference a copied numeric device pointer |
| Host thread | Has a current-device selection through `cudaSetDevice` | Selection by one thread is not a device assignment for all other threads |
| Owner | Application responsibility for creation, use, completion and destruction | Sharing a context does not resolve races or lifetime bugs |

In the ordinary Runtime API path used here, with no explicitly current Driver context or explicit execution context, there is **one primary context per device per process**, shared by runtime users in that process. The precise 13.3.1 API also allows explicit execution contexts; this unit does not use them. If a Driver context is already current, runtime/driver interoperation follows that context instead. Do not turn this default-path model into a universal claim about every CUDA interface.

Each worker explicitly calls and checks `cudaSetDevice(d)` before device-specific work. Allocations, kernel launches, stream creation and event creation are associated with the selected device. A stream does not migrate when the thread switches devices. A kernel launch into a stream belonging to a different device fails. Each device has its own default stream; two default streams do not form a cross-device order. `cudaDeviceSynchronize` waits on the current device, not every GPU in the process.

## Write the ownership ledger first

The following is a **synthetic assignment**, not an observed machine. A and B are local aliases resolved from the actual process's visible device list.

| Resource | Process / host thread | Device / context | Final use and release |
| --- | --- | --- | --- |
| buffer A, stream A | process 0 / worker A | A / primary A | wait for all users, select A, then release |
| buffer B, stream B | process 0 / worker B | B / primary B | wait for all users, select B, then release |
| host result buffers | process 0 / coordinator | host address space | join workers and finish transfers before reuse |

A later peer consumer extends the producer buffer's lifetime. The allocator cannot free it just because its own producer stream is finished. Keep allocation ownership separate from temporary access permission. A library must not call `cudaDeviceReset` as routine cleanup: other users of the shared primary context may still own resources. Free only what the component owns after completion.

## Choose a process model and verify it

1. **One process, one host thread:** select A, create A resources and enqueue work; select B and do the same. Wait and check errors separately on both devices. Submission is serial on the host; device overlap is possible, not guaranteed.
2. **One process, two host threads:** each worker selects its own device and owns its resources. A host barrier or join orders host bookkeeping; stream/device completion is still needed before reading results or releasing buffers. A shared primary context on one GPU is not a host mutex.
3. **Two processes:** each resolves its own visible ordinal and creates its own resources. Separate process visibility may make both local ordinals zero while they refer to different physical GPUs. Start independent programs; do not assume CUDA state survives a fork of an initialized process. An ordinary pointer passed in a message is not IPC. Explicit CUDA IPC/other sharing protocols need separate lifetime and synchronization contracts and are outside this Exercise.

For the implementation Exercise, enumerate first and reject fewer than two eligible visible devices. On A and B independently allocate 257 `uint32_t` elements, produce `1000*d+i` where d is the explicitly assigned local device ordinal, copy back and exact-compare every element against the CPU formula. Check every API result, launch error and completion boundary. Use grid ceiling division and an `i < 257` guard. The initial one-thread and revised two-thread variants must agree with the oracle. Never intentionally launch through a wrong-device stream; diagnose that trace on paper.

## External environment and evidence contract

All runtime work in G01–G03 uses **native Ubuntu 24.04 x86-64 Linux**, CUDA Toolkit **13.3.1**, C++17 and the existing 13.3 Toolkit Lane host compiler policy. Select a compatible Linux driver **610.43.02 or newer** for this exercise profile; record the exact installed driver and `nvcc`/host compiler versions. This is an exercise gate, not the minimum driver for every CUDA 13.x application. Use at least **two full, visible NVIDIA GPUs**, each **CC ≥ 7.5**, **total memory ≥ 8 GB and free memory ≥ 256 MiB**. Record each exact `major.minor`; build for each actual target accepted by the pinned compiler. Extra GPUs are inventoried but only the chosen pair participates. MIG, MPS and virtualized execution are excluded from this profile.

The G01 payload is only 1,028 bytes per GPU; context overhead is separate. G02 uses at most 4 MiB per GPU and 4 MiB of pinned host staging memory. Do not infer peer compatibility from these memory or CC gates. Query both directions; G01's independent computations need no peer access. G02 requires successful queries and enablement for its direct path. A valid staged path remains useful when direct access is unavailable.

Complete the [Environment Manifest](/en/start/environment-manifest/) **before execution** and add these multi-device fields:

| Field group | Required record |
| --- | --- |
| Identity and build | source commit/hash, command and flags, OS/kernel/architecture, Toolkit/runtime/driver, `nvcc` and host compiler versions, timestamp and observer |
| Per-device inventory | visible GPU count/order, private UUID and PCI bus-ID mapping to public aliases, exact CC, total/free memory, selected pair, exclusive/shared use and compute mode |
| Ownership | process count, threads per process, each thread's selected device, context model, visibility mapping, allocation/stream/event ledger and destruction order |
| Compatibility | directional peer queries, enablement result and ownership, selected fallback, IOMMU/ACS state confirmed by the operator before PCIe peer transfers |
| Topology and permissions | `nvidia-smi --version`, `nvidia-smi topo -h`, command/exit status and acquisition date; GPU/NIC/NUMA relations; GPU device access, sysfs visibility and query permission; unavailable fields remain unknown |
| Method and evidence | shapes, byte counts, oracle, synchronization, warmup/repetitions if timed, clock/power/load state, raw artifact hash, reviewed derivative hash and limitations |

No performance-counter privilege is needed for the basic correctness task. Query permission failures or an unknown IOMMU state block the relevant observation; record them rather than elevating privileges or changing machine configuration. Raw topology can identify machines: retain originals privately and publish only reviewed alias-based fields. No qualifying two-GPU Reference Environment evidence is present here. All proposed runtime and topology observations remain **Pending Hardware Verification**; compilation and runtime are independent, and this Learning Unit's four evidence arrays remain empty.

## Exercises and review

Complete the [ownership Exercises](/en/multi-gpu/devices-contexts-ownership/exercises/) before the [separate solutions](/en/multi-gpu/devices-contexts-ownership/solutions/). [PB-R6-001](/en/practice/#pb-r6-001) tests a plugin's cleanup authority. Continue to [peer access](/en/multi-gpu/peer-access-copies/) or [topology](/en/multi-gpu/topology-paths/) after the prerequisites are satisfied.

## Retrieval questions

1. What does `cudaSetDevice` select, and for whom?
2. When do two runtime users share a primary context?
3. Why can two processes both report local device zero without sharing resources?
4. Why does joining a submitting thread not necessarily finish its GPU work?
5. What extends a producer allocation's lifetime beyond its own stream?
6. Why is device reset an invalid plugin cleanup policy?

## Primary sources and rights

Reviewed **2026-09-19**. [SRC-CUDA-094](/en/sources-and-versions/#src-cuda-094) records current Context7 discovery, exact Runtime API 13.3.1 context rules and the archived 13.2 multi-device execution guide. Explanations, ledgers and Exercises are original CC BY 4.0. NVIDIA documentation is linked and paraphrased; no sample program, figure or measured result is republished.
