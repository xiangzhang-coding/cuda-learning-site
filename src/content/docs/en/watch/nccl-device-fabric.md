---
title: 'W04: NCCL Device-Side and Fabric Features'
description: Separate communication initiation, transport requirements and cross-version compatibility.
pairId: w04
counterpart: /watch/nccl-device-fabric/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W04
prerequisites: [G03, G08, G09]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL device-initiated communication', url: 'https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/deviceapi.html', version: '2.32.3', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'NCCL Compute Fabric Transport', url: 'https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/cft.html', version: '2.32.3', platform: 'Blackwell fabric; source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w04 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W04 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G03,G08,G09' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/watch/nccl-device-fabric/" lang="zh-CN">阅读中文对应页</a>

## Motivation

Host-enqueued collectives and communication initiated inside a user kernel place different obligations on the program. Fusing computation with communication can change synchronization and resource ownership; it does not eliminate completion or rank participation requirements.

## Stable prerequisites

[G03: topology paths](/en/multi-gpu/topology-paths/), [G08: graph capture and buffers](/en/multi-gpu/nccl-graph-capture/) and [G09: multi-node failures](/en/multi-gpu/multi-node-transport-failures/) establish the stable comparison. Their NCCL profile does not inherit this entry's newer version.

## Current interface status

The reviewed guide is **NCCL 2.32.3**. It dates the device API to **2.28**, GPU-Initiated Networking (GIN) to **2.28.7**, and Compute Fabric Transport (CFT) to **2.31**. These are newly introduced/moving surfaces, not a claim that every NCCL API is preview. LSA uses load/store-accessible peers; multimem uses hardware multicast; GIN crosses network paths; CFT addresses CUDA fabric logical endpoints. A successful host `ncclAllReduce` does not validate any of those custom-kernel paths.

## Software and hardware gates

Device communication uses symmetric memory windows and GPU virtual memory management. LSA requires actual CUDA P2P connectivity. Multimem additionally needs NVLink SHARP-capable hardware. GIN requires **CUDA 12.2+ for GPU compilation**, Volta or newer and driver **>=510.40.3**, plus backend-specific NIC/RDMA support. The CPU Proxy backend and GDAKI backend have different software gates: for example, GDAKI requires CX4+ and rdma-core >=44.0, with Linux kernel, DMA-BUF or nvidia-peermem/OFED/DOCA requirements depending on deployment. These upstream minima do not widen the site's baseline tier.

CFT requires **CUDA 13.3+**, **Blackwell or newer**, and driver **>=610.43.02** in this guide, together with an available fabric logical-endpoint configuration. “Two Blackwell GPUs” alone does not demonstrate that fabric support. Read the complete backend requirements before an external native Linux probe; no GPU is needed to read this page.

## Limitations and compatibility

Device code and host setup must be compiled against the same NCCL version. The compile-time version generally cannot exceed runtime `libnccl.so`. The guide documents versioned host structures from 2.29 and backward compatibility for LSA/multimem, but **GIN kernels require recompilation when NCCL is upgraded**. Do not transfer host ABI assumptions to GIN or invent a CFT compatibility guarantee. Window lifetime, communicator resources, synchronization and teardown remain explicit responsibilities. NCCL v2.32.3-1 uses Apache-2.0 with retained BSD and per-file terms; CUDA/network dependencies have separate terms. No owner kernel or network result is reproduced. [Promotion](/en/watch/#promotion-is-a-separate-decision) and runtime verification remain separate; this page has no evidence claims.

## Retrieval check

Does successful graph capture plus an NVLink connection prove that a GIN kernel works after a library upgrade? No: graph capture, P2P, GIN backend admission and GIN binary compatibility are different gates.

## Owner sources

Accessed **2026-10-04**: [2.32.3 device API guide and compatibility rules](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/deviceapi.html), [CFT requirements and setup](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/cft.html), [v2.32.3-1 release notes](https://github.com/NVIDIA/nccl/releases/tag/v2.32.3-1), and [versioned NCCL license](https://github.com/NVIDIA/nccl/blob/v2.32.3-1/LICENSE.txt). This release adds CFT counted operations and socket GIN; socket GIN currently needs opt-in GDRCopy. The NIC gates above describe the RDMA backends, not all GIN backends. Upstream requirements and examples do not constitute a Reference Environment run. [Watch index](/en/watch/).
