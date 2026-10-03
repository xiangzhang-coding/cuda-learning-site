---
title: 'H03: Ada Caches and Bounded Working Sets'
description: Separate device capacity, cache reuse and workstation constraints before proposing an Ada optimization.
pairId: h03
counterpart: /architecture/ada-working-sets/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, history, working-set, policy, gates, measurement, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H03
prerequisites: [H02, M02, Q10]
relatedUnits: [VIS15]
hardwareGate: none
estimatedMinutes: 30
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ada Tuning Guide', url: 'https://docs.nvidia.com/cuda/ada-tuning-guide/index.html', version: '13.4', platform: 'Source review; CC 8.9', accessDate: '2026-09-22' }
  - { title: 'L2 Cache Control', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/l2-cache-control.html', version: '13.4.2', platform: 'Source review; capacity and policy', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h03 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,history,working-set,policy,gates,measurement,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H03 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H02,M02,Q10' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/ada-working-sets/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

In 30 minutes, build a byte ledger and a falsifiable cache hypothesis. You should distinguish an allocation that fits in device memory from data that might survive until its next reuse in L2. The deliverable is a design review with a future measurement protocol.

## Prerequisites

Exact ordered edges: **[H02, M02, Q10]**. [H02](/en/architecture/ampere-pipelines-tensor-cores/) supplies feature-specific gates; [M02](/en/memory/coalescing-transactions/) supplies transactions and access patterns; [Q10](/en/correctness/roofline-arithmetic-intensity/) separates requested bytes from measured traffic. [VIS15](/en/visuals/architecture-evolution/) is related, not an extra prerequisite.

## Start with an ordinary-copy baseline

Consider repeated out-of-place copies of a contiguous array of 32-bit integers, using ordinary coalesced loads/stores and a bounds check. Each launch copies every element once to a separate output; launches in one stream reuse the same input. No arithmetic, atomics, shared memory or cache policy is required. Compare every output element bit-for-bit with the input on the CPU after checked completion. Test lengths 0, 1, 255, 256 and 257 as well as the larger capacity cases; zero length skips the launch.

The baseline runs on a compatible CC 7.5+ native-Linux GPU; problem memory stays below 8 GB. It also runs on the Ada device with a matching image. Keep the same source, sizes, repetition count and output semantics when comparing default caching with an optional persistence policy. A default policy still uses caches: this is not a cache-disabled control.

## What changed with Ada

Ada has compute capability **8.9**. NVIDIA documents **98304 KiB (96 MiB)** L2 for **AD102**, compared with GA102's smaller implementation. This is an implementation example, not a promise for every Ada product. Query `cudaDeviceProp::l2CacheSize` on the selected device. A CC test cannot supply that number, available VRAM, clock behavior or measured bandwidth.

Ada has a 128 KiB combined L1/shared/texture resource, up to 100 KiB shared memory per SM and **99 KiB per block**. These are separate from L2. Above 48 KiB, shared memory requires dynamic allocation and opt-in. A preferred carveout is a preference, not a reservation guaranteeing occupancy. H02's extra stages can reduce residency even when a launch fits.

## Budget the working set and reuse distance

The working set is the data competing for cache during the reuse interval, not just the named input allocation. Reuse distance counts intervening distinct data; coalescing describes transactions within a warp. A coalesced single-pass stream can have no useful temporal reuse.

| Input W | Output W | Allocated bytes | Requested copy traffic per launch |
| --- | --- | --- | --- |
| 4 MiB | 4 MiB | 8 MiB | 8 MiB |
| 32 MiB | 32 MiB | 64 MiB | 64 MiB |
| 128 MiB | 128 MiB | 256 MiB | 256 MiB |

MiB means 2²⁰ bytes. Reserve at least **512 MiB free device memory** before the largest case; the 256 MiB payload leaves 256 MiB headroom within this exercise budget. Record actual free memory after context setup. Input plus output traffic, spills, other kernels and display work can compete for L2. Requested traffic `2W` is not measured DRAM traffic; the copy has zero arithmetic FLOPs, so a FLOP/s roofline is not a meaningful speed score for it.

**Predict before measuring:** for a hypothetical device reporting 64 MiB L2, which sizes might benefit from repetition, and what could falsify the hypothesis? Even 64 MiB of total arrays is not guaranteed to reside in a 64 MiB cache: replacement, traffic ordering and other clients matter. A 128 MiB input cannot all remain in that cache simultaneously. Neither statement predicts elapsed time.

## An optional policy is a hint

L2 persistence control starts at CC 8.0, so it is not Ada-exclusive. Query `persistingL2CacheMaxSize`, `accessPolicyMaxWindowSize`, and the current `cudaLimitPersistingL2CacheSize`. Bound the set-aside and window to supported limits and valid input bytes. `hitRatio` selects the approximate fraction receiving the persisting property; it is **not an observed cache hit rate**. Concurrent windows share the same set-aside. Two 24 MiB windows with ratio 1 can compete in a 32 MiB set-aside; choosing lower ratios may reduce competition without reserving private partitions.

In MIG mode the L2 set-aside is disabled. With MPS, its size is configured at server startup, not by a client's `cudaDeviceSetLimit`. These are environment checks, not claims that every Ada product offers MIG. If the mode, API or capacity gate fails, retain default caching. After the owned workload completes, disable its access-policy window and reset persisting status under an agreed context policy; disabling a window alone does not immediately normalize old lines. Coordinate reset with other users of that context.

## Gate the future comparison

Reading and paper Exercises require no GPU. The specialized comparison requires **one CC 8.9 GPU, at least 8 GB**, and the 512 MiB free-memory gate. Use the site's proposed Ubuntu 24.04 x86-64 / CUDA Toolkit 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / driver 610.43.02 coordinate, subject to the actual Environment Manifest. This is not a declared Reference Environment or a build report.

| Path | Virtual / real target | Resource and feature conditions | Portable comparison |
| --- | --- | --- | --- |
| Ordinary copy | `compute_75` / `sm_75` on CC 7.5; matching targets on other devices | 2W global bytes; bounds and checked completion; no cluster or TMA | Same default-cache copy on the selected device |
| Ada default-cache copy | `compute_89` / `sm_89` | Exact CC 8.9; queried L2 and free memory; no cluster or TMA | Same algorithm; cross-device times confound more than L2 |
| Ada persistence candidate | `compute_89` / `sm_89` | Above gates plus allowed set-aside/window/mode; no shared-memory requirement | Default policy on the same GPU; same data and work |

The compiler must advertise the chosen targets (`--list-gpu-arch` lists virtual, `--list-gpu-code` real). Check generated images and runtime device before dispatch; PTX JIT needs compatible driver support. A target name is not a cache-residency guarantee.

## Measure the workload, including workstation constraints

Use independent correctness checks first. For timing, warm up code loading separately, state the data warm/cold protocol, bracket a fixed repeated-launch batch with events in the same stream, synchronize the end event and preserve the distribution across trials. Report first-pass and repeated-pass results separately. Time identical useful work and keep initialization, validation and transfers outside the kernel interval; report end-to-end cost separately. A larger dataset must not receive fewer repetitions without normalization.

For cache attribution, use a separately recorded **Nsight Compute** pass with exact tool version, metric names/units, replay and cache-control settings. Hardware counters require administrator-authorized profiling access (`ERR_NVGPUCTRPERM` means unavailable evidence, not zero traffic). Default replay cache flushing can destroy a warm-cache hypothesis; application replay with an explicit warming sequence or documented cache-control settings needs its own review. Unprofiled timing remains separate from instrumented execution. No profiler permission is needed for this paper exercise or basic event timing.

On a workstation, record display use, concurrent processes, power/clock/thermal state, available memory and transfer boundaries. Compare on the same GPU first; a second product changes SM count, bandwidth, clocks and software as well as cache. Stop at a scoped conclusion such as “this workload under these settings,” never “Ada is universally faster.”

## Evidence boundary and common errors

All four metadata arrays are empty. Architecture execution, cache behavior and performance remain **Pending Hardware Verification**. There is no local CUDA build, GPU run or profiler observation. A qualifying Reference Environment run needs source/target identity, Environment Manifest, correctness output, checked launch/completion, sanitizer results where applicable and retained timing/counter reports. Typical invalid conclusions are equating allocated bytes with cache residency, treating `hitRatio` as a measurement, or using replay-flushed counters to explain unprofiled warm timing.

## Retrieval check

1. Why is AD102's 96 MiB not a property of every CC 8.9 device?
2. How can coalescing be good while temporal reuse is absent?
3. Why must output traffic be considered in a read-input cache hypothesis?
4. What does `hitRatio=0.5` specify, and what does it not measure?
5. Which profiler and workstation conditions could invalidate a warm-cache comparison?

## Practice and next edges

Complete [H03 Exercises](/en/architecture/ada-working-sets/exercises/), then [separate solutions](/en/architecture/ada-working-sets/solutions/) and [PB-R7-003](/en/practice/#pb-r7-003). In [VIS15](/en/visuals/architecture-evolution/), compare CC 8.9's L2-policy eligibility with its absent cluster/TMA paths. This finishes the cache branch; H04 has its own M12/M13 prerequisites.

## Sources and licensing

Fact-checked **2026-09-22**. [SRC-CUDA-105](/en/sources-and-versions/#src-cuda-105) records current Context7 discovery and exact [Ada tuning §1.4.2](https://docs.nvidia.com/cuda/ada-tuning-guide/index.html#memory-system), [L2 policy §4.14](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/l2-cache-control.html), compiler, profiler and release documentation. Guide 13.4.2 and tuning 13.4 describe reviewed facts; they do not change pinned Toolkit Lanes. Original text, byte ledger and Exercises are CC BY 4.0; NVIDIA references retain their proprietary notices. No owner sample, diagram or table is copied.
