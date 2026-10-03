---
title: 'H04: Hopper Clusters, Distributed Shared Memory and TMA'
description: Derive cluster lifetime and direction-specific copy completion from portable synchronization and staging baselines.
pairId: h04
counterpart: /architecture/hopper-clusters-tma/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, clusters, dsm, tma, ordering, gates, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H04
prerequisites: [H02, M12, M13]
relatedUnits: [VIS15]
hardwareGate: none
estimatedMinutes: 45
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Hopper Tuning Guide', url: 'https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html', version: '13.4', platform: 'Source review; CC 9.0', accessDate: '2026-09-22' }
  - { title: 'Distributed Shared Memory', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#distributed-shared-memory', version: '13.4.2', platform: 'Source review; cluster lifetime', accessDate: '2026-09-22' }
  - { title: 'Tensor Memory Accelerator', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-the-tensor-memory-accelerator-tma', version: '13.4.2', platform: 'Source review; direction and completion', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h04 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,clusters,dsm,tma,ordering,gates,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H04 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H02,M12,M13' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/hopper-clusters-tma/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Use 45 minutes to explain why an inter-block pointer needs a lifetime contract and why a copy needs a direction-specific completion contract. Produce two ownership ledgers and a dispatch checklist. These are paper designs, not a new Runnable Example.

## Prerequisites

Exact ordered edges: **[H02, M12, M13]**. [H02](/en/architecture/ampere-pipelines-tensor-cores/) separates accelerated paths from portable copies; [M12](/en/memory/cooperative-groups/) establishes group membership and collective participation; [M13](/en/memory/asynchronous-copy-pipelines/) establishes ready-to-read versus safe-to-reuse. [VIS15](/en/visuals/architecture-evolution/) is related. H03 is not a prerequisite.

## Two portable baselines

**Neighbor exchange:** two logical blocks each own 256 int32 values. Each output receives the corresponding value of the other owner. A first ordinary kernel writes both 1024 B segments to a **2048 B global scratch** allocation; a second kernel in the same stream reads the neighbor segment and writes output. Input, scratch and output total **6144 B**. The ordered kernel boundary supplies inter-block publication without a grid spin barrier. Compare all 512 outputs exactly to the CPU permutation, including asymmetric and zero-valued inputs.

**Tile staging:** copy a row-major 16×16 int32 tile to shared memory, synchronize the block, and write it to a separate global output. Input/output total **2048 B** and one shared tile uses **1024 B**, plus separately budgeted synchronization state for the specialized variant. Plain loads/stores and block barriers suffice. For repeated tiles, all readers finish before reuse. Compare every element exactly; keep padding guards unchanged.

Both baselines require one compatible CC 7.5+ native-Linux GPU and fit far below 8 GB. They preserve the selected outputs, not identical instruction sequences or launch counts. The exchange baseline intentionally pays a second launch and global scratch; it cannot reproduce DSM's remote shared address space. Compare the complete exchange operation, not one specialized kernel against only half the baseline.

## Hopper adds a cooperating group of blocks

Hopper is **CC 9.0**. Thread Block Clusters are an optional hierarchy level between a block and a grid. Blocks in a cluster are guaranteed to be co-scheduled within a GPU Processing Cluster (GPC). This does not put every block on the same SM, synchronize the whole grid, or create multi-GPU shared memory.

Declare cluster dimensions at compile time with `__cluster_dims__` or at runtime through `cudaLaunchKernelEx` and `cudaLaunchAttributeClusterDimension`; do not silently override a compile-time requirement. Grid dimensions are still in blocks and must be divisible by cluster dimensions. The paper exchange uses **one cluster of (2,1,1) blocks**, each **(256,1,1) threads**, grid **(2,1,1)**.

Eight blocks is the portable cluster-size ceiling, not an unconditional admission result: small GPUs or MIG partitions can permit fewer. Query `cudaDevAttrClusterLaunch`, `cudaOccupancyMaxPotentialClusterSize` and `cudaOccupancyMaxActiveClusters` for the actual kernel/configuration. H100 can opt into a nonportable size 16 with `cudaFuncAttributeNonPortableClusterSizeAllowed`; this exercise uses two and does not assume 16 is available. Occupancy can fall as cluster size grows.

## Distributed shared memory still belongs to blocks

Distributed Shared Memory (DSM) lets a thread access another block's shared memory within its cluster. Allocation is still **per block**. Two blocks with 1024 B each expose 2048 B across the cluster; no block receives a 2048 B local allocation. Derive neighbor rank with `1 - cluster.block_rank()` only for this two-block fixture and obtain the mapped pointer through `cluster.map_shared_rank`.

| Phase | Both blocks' obligation | Why it matters |
| --- | --- | --- |
| Initialize | Each thread writes its own local element; all threads reach `cluster.sync()` | Every owner exists and its initialization is published |
| Exchange | Read the matching element through the mapped neighbor pointer; write local output | Remote storage is live; each output has one writer |
| Finish | All threads reach a second `cluster.sync()` before reuse or exit | No owner destroys storage while another block still reads it |

There is no atomic operation in this permutation. A histogram with multiple writers would additionally require suitable atomics; the cluster barrier cannot repair concurrent non-atomic updates. `__syncthreads()` only coordinates one block, so it cannot replace either cluster-wide edge. Mask out-of-range data accesses while preserving all collective participants. A tiny demonstration that appears to work when one block exits early is not a lifetime proof.

## TMA moves bytes; it does not compute matrix products

The Tensor Memory Accelerator (TMA), introduced with CC 9.0, extends H02's non-bulk `cp.async` global-to-shared path. It supports bulk contiguous copies and tensor copies of up to five dimensions. Ordinary global↔shared TMA use does **not** require a cluster. Cluster DSM/multicast paths add cluster and destination-barrier obligations and are outside this single-block tile fixture. TMA is distinct from Tensor Core arithmetic and does not choose a reduced-precision dtype here.

| Selected path | Storage / descriptor gate | Completion mechanism |
| --- | --- | --- |
| 1D bulk global → shared | Both addresses 16 B aligned; size multiple of 16 B; valid ranges; no tensor map | Shared-memory transaction barrier |
| 2D tensor global → shared | Global base 16 B aligned; outer byte strides multiples of 16 B; shared destination 128 B aligned; total copy multiple of 16 B | Shared-memory transaction barrier |
| Shared → global bulk/tensor | Valid corresponding addresses and descriptor; producer stores visible to async proxy | Initiator's **bulk async-group**, not the load barrier |

For the 16×16 int32 fixture: encode a host `CUtensorMap` with `cuTensorMapEncodeTiled`, rank 2, fastest dimension first, dimensions **[16,16]**, outer stride **64 B**, box **[16,16]**, element strides **[1,1]**, no interleave, no swizzle, no L2 promotion and no special floating-point out-of-bounds fill. Use `CU_TENSOR_MAP_DATA_TYPE_INT32`. Keep the descriptor suitably aligned (the `CUtensorMap` type has 64-byte alignment), check the encoder result, and pass it as a `const __grid_constant__` parameter. Separate input/output allocations need separate maps. The driver API must be available and linked via `-lcuda` or a version-checked entry point. No descriptor update while it is in use is allowed.

The transaction barrier needs 8-byte-aligned shared storage, provided by `cuda::barrier`. Use 128-byte-aligned shared tile storage, exactly **1024 B transferred**. This selected tensor fixture has no tails; an irregular tile uses an explicitly validated ordinary-copy fallback rather than an unchecked descriptor or out-of-bounds store. Swizzling and on-device tensor-map modification need separate layout/target reviews; do not import their rules into this unswizzled host-encoded path.

## Arrival, transfer completion and reuse are separate

For the conceptual 256-thread tile ledger, initialize a block-scope shared `cuda::barrier` with **256 arrivals** and publish initialization. Follow the selected API's async-proxy visibility rules; raw barrier initialization needs its prescribed ordering, while library initialization may supply it. Exactly one elected issuer submits the load. In the explicit transaction-accounting path, register **1024 expected bytes once**, not once per consumer; every participating thread contributes one arrival. A high-level overload that already accounts bytes must not also receive manual double accounting.

1. Wait for the correct barrier phase: both all arrivals **and** the transaction bytes must complete. Arrival alone, a plain block barrier, or H02's non-bulk `cp.async.wait_group` is not that wait.
2. Consumers read the ready tile. If they modify shared memory before a TMA store, each writer applies the required `fence.proxy.async.shared::cta` ordering (or the corresponding documented wrapper), followed by block coordination before the issuer submits the store.
3. The issuer commits the store's bulk group. A **read-completion wait** means the transfer has finished reading the shared source, so that source may be reused after the issuer publishes that fact to the other block threads. It does not mean the global destination is ready for arbitrary readers.
4. A full bulk-group wait establishes the documented destination completion for the initiator; wider consumers still need the correct publication edge. This fixture consumes global output only after checked kernel/stream completion on the host. Drain all outstanding transfers and protect barrier/storage lifetime before exit.

This protocol uses only named semantics, not copied owner code. Pin the actual headers/overload and inspect generated instructions when implementing later. `cuda::device::experimental` discovery snippets are not Stable Curriculum dependencies. A successful high-level copy API call alone does not prove TMA instruction selection or measured overlap.

## Exact gates and fallbacks

For future specialized execution select **one CC 9.0 GPU with at least 8 GB and 512 MiB free**, native Linux. Proposed coordinate: Ubuntu 24.04 x86-64 / Toolkit 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / driver 610.43.02, recorded independently in the Environment Manifest. Use **`compute_90` / `sm_90`** for these cluster, DSM and host-encoded TMA paths. Basic TMA does not require `sm_90a`; architecture-specific features such as on-device tensor-map modification are excluded. An `sm_90a` image is not a universal fallback. Check compiler target lists and runtime feature/resource admission; keep ordinary images compiled for the devices they serve.

| Path | Additional memory / launch gate | Failure action |
| --- | --- | --- |
| Cluster + DSM exchange | 1024 B shared/block; two-block cluster admitted; 4096 B input/output; no TMA | 6144 B global-scratch baseline, two ordered kernels |
| Single-block TMA tile | 1024 B shared + barrier and alignment padding; descriptors and 2048 B global; no cluster | Ordinary-copy tile with block publication/reuse |
| Ordinary baseline | `compute_75` / `sm_75` on CC 7.5, or matching `compute_89` / `sm_89`, `compute_90` / `sm_90` on the selected GPU | Shrink/reject if actual memory or target fails; never launch an ineligible specialization |

Hopper permits **227 KiB shared memory per block**, from a 228 KiB per-SM shared resource; above 48 KiB requires dynamic allocation and opt-in. Count barriers, padding, all buffers and kernel resource constraints before launch. DSM aggregate size does not increase this per-block maximum.

## Tune only after correctness

First verify the exact CPU permutation/copy, launch and completion errors, and applicable memcheck/racecheck/synccheck reports. Clean reports support, rather than replace, the lifetime proof. Then compare matched operations on the same GPU; report two-kernel baseline cost against complete cluster exchange, or ordinary staging against complete TMA staging. Record warmup, repetitions, timing boundaries and distributions. Tiny 1024 B tiles may not amortize descriptor or synchronization costs. More stages and larger clusters can reduce residency.

Instruction/resource inspection and a separately recorded Nsight Compute pass help test the explanation. Record exact profiler version, target, metrics, replay/cache settings and cluster configuration. Hardware counters require administrator-authorized access; `ERR_NVGPUCTRPERM` leaves the relevant claim unmeasured. Use unprofiled timing separately. No counter permission is required for paper reasoning or ordinary correctness/event timing. Source capacity, eligibility and pipeline diagrams supply no universal speed ranking.

## Evidence boundary and Lab status

All four evidence arrays remain empty. Architecture behavior, DSM lifetime outcomes, TMA instruction selection and performance remain **Pending Hardware Verification**. A qualifying Reference Environment run needs a complete Environment Manifest, exact build/artifacts, correctness, error-checked completion and retained reports. Native Linux is the sole Supported Environment; the browser executes no CUDA.

**LAB19 remains unpublished** until H06 supplies its portable comparison contract. These bounded paper comparisons do not publish a Lab, a runnable project, or execution evidence. No empty LAB19 route, navigation item or catalog record is offered.

## Retrieval check

1. Why must both blocks remain alive after initializing their DSM segments?
2. Does eight-block portability guarantee a successful launch in any MIG partition?
3. Why does a TMA tile load not inherently require a cluster or Tensor Cores?
4. What two quantities govern completion of the load barrier phase?
5. Why does a bulk read-completion wait permit source reuse but not arbitrary global consumption?

## Practice and next edges

Attempt [H04 Exercises](/en/architecture/hopper-clusters-tma/exercises/), then [separate solutions](/en/architecture/hopper-clusters-tma/solutions/) and [PB-R7-004](/en/practice/#pb-r7-004). Filter [VIS15](/en/visuals/architecture-evolution/) for TMA and compare CC 8.9 with 9.0. The later portable-specialization synthesis must admit each feature separately; this unit supplies the cluster lifetime and copy-completion reasoning it needs.

## Sources and licensing

Checked **2026-09-22**. [SRC-CUDA-106](/en/sources-and-versions/#src-cuda-106) records current Context7 discovery and exact [Hopper tuning §1.4](https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html), [DSM §2.3.3.8](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#distributed-shared-memory), [TMA §4.12.2](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-the-tensor-memory-accelerator-tma), compiler and release documentation. Guide 13.4.2 and tuning 13.4 are reviewed versions, not a Toolkit Lane change. Original explanations, ownership ledgers and Exercises use CC BY 4.0; owner references retain their proprietary notices. No sample, diagram or table is copied or adapted.
