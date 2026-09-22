---
title: 'H01: Turing and Explicit Warp Safety'
description: Repair implicit warp timing assumptions with participation masks and publication and reuse barriers.
pairId: h01
counterpart: /architecture/turing-warp-safety/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, history, repair, gates, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H01
prerequisites: [F06, M06]
relatedUnits: [H02, VIS15]
hardwareGate: none
estimatedMinutes: 35
difficulty: intermediate
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Turing Tuning Guide', url: 'https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#independent-thread-scheduling', version: '13.4', platform: 'Source review; CC 7.5', accessDate: '2026-09-22' }
  - { title: 'CUDA Compute Capabilities', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Source review; feature and resource contracts', accessDate: '2026-09-22' }
  - { title: 'NVCC compilation targets', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/nvcc.html', version: '13.4.2', platform: 'Source review; no build', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h01 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,history,repair,gates,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H01 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'F06,M06' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/turing-warp-safety/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

In about 35 minutes, explain why sharing a warp does not establish a memory dependency, repair a two-phase exchange, and distinguish a documented CC capability from a compiled and executed path. Finish with the Exercises; reading requires no GPU.

## Prerequisites

The exact ordered edges are **[F06, M06]**: [F06: Compute Capability](/en/foundations/compute-capability/) establishes feature gates; [M06: Warp Divergence and Reconvergence](/en/memory/warp-divergence-reconvergence/) establishes lane participation. H02 and VIS15 are related resources, not extra prerequisite edges.

## Start with a portable baseline

Within the site's CC 7.5-or-newer scope, use ordinary loads/stores with explicit synchronization. For a shared tile produced and consumed by a whole block, use `__syncthreads()` after production and before reuse; every non-exited thread in the block must reach each barrier. For a warp-only exchange, `__syncwarp(mask)` orders memory among the participating lanes. Cross-warp communication still needs block-scope coordination.

Use one GPU on native Linux, bound the total problem allocation below 8 GB, and first choose 32-bit integer data to isolate ordering from rounding. For the Exercise, one block of exactly 32 threads uses two 32-element input rounds, one 32-element output and 32 shared integers: 384 global bytes plus 128 shared bytes. Every input value fits in a signed 32-bit integer; there is no arithmetic overflow. This is a proposed paper fixture, not a run or a new Runnable Example.

## What Turing inherited

Turing has compute capability **7.5**. Independent thread scheduling (ITS) was introduced with **Volta**, and Turing retains it. Per-thread execution state allows scheduling and reconvergence below the warp level. Threads are still organized into 32-lane warps for SIMT execution; ITS does not turn the GPU into 32 independent CPU cores or promise a particular interleaving.

Old warp-synchronous code often treated instruction proximity as a publication guarantee. A delayed producer can invalidate that assumption. Replace legacy `__shfl`, `__ballot`, `__any` and `__all` patterns with the appropriate `*_sync` collective and an explicit participant mask. A synchronizing shuffle exchanges registers; it is not a shared-memory publication fence.

## Repair publication and reuse separately

Consider this original **unsafe pseudocode**, with all 32 lanes live and `lane` in 0–31:

```text
for round in [0, 1]:
    shared[lane] = input[32 * round + lane]
    output[lane] = shared[lane XOR 1]
```

There are two hazards. The peer may read before the producer writes; a fast lane may also overwrite its slot for round 1 before its peer finishes reading round 0. Insert a warp publication barrier after the write and a warp reuse barrier after the read. Both use the same full mask only because this fixture keeps all 32 lanes live through both rounds. Neither `volatile` nor replacing the mask with an instantaneous `__activemask()` repairs that proof.

For a partial logical group, establish membership collectively **before divergence**, for example with `__ballot_sync(parent_mask, predicate)` while all lanes named in the parent mask participate. Then ensure every lane named in the resulting mask executes the same required collective and every requested source lane belongs to that mask. A mask names participants; it does not activate absent lanes or initialize missing data. A tail count of 31 makes `lane XOR 1` invalid for lane 30 unless you change the partner rule or zero-fill a complete tile while keeping all 32 lanes participating.

`__activemask()` reports lanes active at that instruction; it is not a durable definition of all lanes that logically satisfy a predicate. `__syncwarp` cannot order a different warp's writes, and a block barrier inside a branch reached by only some non-exited block threads is invalid. Use the separate solutions to write the complete corrected ordering, not just the first barrier.

## Write the build and fallback contract

| Path | Device and target | Dtype / memory / feature conditions | Fallback |
| --- | --- | --- | --- |
| Explicitly synchronized baseline | Site CC 7.5+; build an image for the chosen device | Integer exchange above; 128 B shared; no warp lockstep assumption | Retain the same algorithm and explicit barriers |
| Turing-specific evaluation | CC 7.5; `compute_75` virtual target and `sm_75` real target | Same fixture; check launch and resource limits | Baseline; never remove barriers to imitate pre-Volta timing |

For a future comparison, select the existing CUDA 13.3.1 Toolkit Lane, NVCC 13.3.73, Ubuntu 24.04 x86-64, GCC 13.3.0 and C++17, paired with driver 610.43.02. This is a proposed configuration, not compilation evidence. The current documentation review is newer than that pinned lane: [SRC-CUDA-103](/en/sources-and-versions/#src-cuda-103) records guide 13.4.2 and release notes 13.4 Update 1 separately.

`nvcc --list-gpu-arch` lists virtual targets; `--list-gpu-code` lists real targets for the selected compiler. `compute_75` controls source feature availability; `sm_75` selects the machine image. `__CUDA_ARCH__` describes the device compilation pass, not a host runtime query. Before launching a specialized path, query the selected device and verify the binary contains a compatible image; a host `if` cannot make unsupported device instructions compile. PTX forward compatibility does not invent a new source-level feature branch or remove driver/JIT requirements. See [M17](/en/toolchain/compiler-architecture-targets/) for the longer target discussion.

## Tuning is a hypothesis

The Turing guide documents four warp schedulers per SM, at most 32 resident warps, and 64 KiB shared memory per SM. These are different quantities, not an optimal launch configuration. Per-block shared memory can reach 64 KiB, but more than 48 KiB requires dynamic shared memory and opt-in. Register pressure, shared-memory use and instruction dependencies constrain residency. The Exercise's 128 B does not establish achieved occupancy, latency hiding or speed.

## Evidence boundary

All four evidence arrays are empty. Architecture behavior, repaired-kernel execution, sanitizer outcomes and performance remain **Pending Hardware Verification** until qualifying Reference Environment evidence exists. No Compile-Checked, Community-Observed or Runtime-Verified status is granted by this unit or [VIS15](/en/visuals/architecture-evolution/). Native Linux is the only Supported Environment; the browser executes no CUDA. A future run needs an Environment Manifest, exact source/build/target, CPU expected values, checked launch/completion errors, and racecheck/synccheck reports. A clean report is supporting evidence, not a proof of every schedule.

## Retrieval check

1. Which architecture introduced ITS, and what is Turing's CC?
2. Which two ordering edges does a repeated exchange need?
3. Why does `__activemask()` inside a branch not recover the intended participant set?
4. What additional failure appears with 31 logical elements and an XOR partner?
5. Why are four schedulers, 32 resident warps and 32 lanes different facts?
6. Why can neither a compiler target nor a successful browser filter prove an observed hardware path?

## Practice and next step

Complete [H01 Exercises](/en/architecture/turing-warp-safety/exercises/) before the [separate solutions](/en/architecture/turing-warp-safety/solutions/). Then solve [PB-R7-001](/en/practice/#pb-r7-001). [H02](/en/architecture/ampere-pipelines-tensor-cores/) applies explicit participation and lifetime reasoning to asynchronous copies; first complete its M13 and L08 prerequisites. [VIS15](/en/visuals/architecture-evolution/) compares exact capabilities without detecting your device.

## Sources and licensing

Reviewed/accessed **2026-09-22**. [SRC-CUDA-103](/en/sources-and-versions/#src-cuda-103) records current Context7 discovery and exact owner sections: [Turing scheduling and occupancy](https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#turing-tuning), [capabilities](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html), and [NVCC targets](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/nvcc.html#nvcc-ptx-and-cubin-generation). Prose, fixtures, Exercises and comparison are original CC BY 4.0. NVIDIA documentation retains its own notices; no owner code, table, image or benchmark is copied or adapted.
