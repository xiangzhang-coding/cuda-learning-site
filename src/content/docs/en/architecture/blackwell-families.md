---
title: 'H05: Blackwell Families and Compiler Target Scopes'
description: Separate documented capability families, compiler targets and actual feature admission before tuning.
pairId: h05
counterpart: /architecture/blackwell-families/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, families, targets, compiler, features, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H05
prerequisites: [H04, M17, L08]
relatedUnits: [H06, VIS15]
hardwareGate: none
estimatedMinutes: 40
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Compute Capabilities', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Documented Blackwell families', accessDate: '2026-10-04' }
  - { title: 'NVCC archived target tables', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html', version: '13.3', platform: 'Toolkit 13.3.1 archive', accessDate: '2026-10-04' }
  - { title: 'Blackwell Tuning Guide', url: 'https://docs.nvidia.com/cuda/blackwell-tuning-guide/index.html', version: '13.4', platform: 'Source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h05 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,families,targets,compiler,features,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H05 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H04,M17,L08' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/blackwell-families/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

In 40 minutes, build a target-admission ledger for three devices with CC 10.3, 11.0 and 12.1. Explain why a newer product cannot automatically execute an older architecture-specific image. A target is a feature contract; it is not a performance score.

## Prerequisites

Exact ordered edges: **[H04, M17, L08]**. [H04](/en/architecture/hopper-clusters-tma/) supplies copy completion and cluster lifetime; [M17](/en/toolchain/compiler-architecture-targets/) supplies virtual and real target selection; [L08](/en/libraries/tensor-core-precision-contracts/) supplies precision and Tensor Core participation. Use [VIS15](/en/visuals/architecture-evolution/) to compare the resulting contracts.

## Blackwell is several capability families

The reviewed Programming Guide 13.4.2 distinguishes **10.0, 10.3, 10.7, 11.0, 12.0 and 12.1**. Do not collapse them into `major >= 10`. The current table documents 10.7, while the selected Toolkit 13.3.1 compiler archive lists 100/103/110/120/121 targets. That difference matters: a documented device is not automatically an EX25 build target.

The historical progression is useful: Turing exposes the consequences of independent thread scheduling, Ampere adds copy/barrier hardware, Hopper adds cluster cooperation and TMA, and Blackwell adds family-scoped specialization alongside diverging compute resources. Marketing architecture, exact CC, supported instruction set, memory capacity and deployment platform answer different questions.

## Three target scopes

| Contract | Example | Admission rule |
| --- | --- | --- |
| Ordinary virtual target | `compute_100` | Baseline features; PTX can be JIT-compiled for compatible later devices with a suitable driver |
| Architecture-specific | `compute_100a` / `sm_100a` | Exact CC 10.0 only; neither forward nor backward compatibility outside it |
| Family-specific | `compute_100f` / `sm_100f` | Only the documented family target set; not all Blackwell devices |

The family relationship is directional. In the current guide, **100f → {10.0,10.3,10.7}; 103f → {10.3,10.7}; 107f → {10.7}; 110f → {11.0}; 120f → {12.0,12.1}; 121f → {12.1}**. Thus 103f does not serve 10.0, 100f does not serve 11.0, and 121f does not serve 12.0. Do not extrapolate a single-member set to hypothetical later products.

The `a` feature set contains the `f` set, which contains the ordinary set; broader features mean narrower compatibility. Ordinary **cubin** compatibility is not ordinary **PTX** forward compatibility: do not expect an `sm_90` cubin to run on a different major CC. Keep an ordinary PTX fallback and/or matching cubins. A driver that cannot understand the PTX version still rejects it. Neither suffix makes incompatible instructions portable.

## Compiler support is a separate ledger

[EX25](/en/examples/feature-gated-copy/) pins the full comparison to **Toolkit Lane cuda-13.3: Toolkit 13.3.1, NVCC 13.3.73, Ubuntu 24.04 x86-64, GCC 13.3.0, C++17**. The specialized project targets are `90`, `100f`, `103f`, `110f`, `120f`, `121f`. For example, target 100f emits `arch=compute_100f,code=[sm_100f,compute_100f]`; the separate baseline emits `compute_75` → `sm_75,compute_75` and `compute_100` → `sm_100`. The source tree's Makefile is authoritative.

The 11.8.0/NVCC 11.8.89 and 12.9.2/NVCC 12.9.86 lanes select only EX25's `portable` build. This is a project support choice, not a claim that 12.9 cannot compile any Blackwell target. Compiler target listings are discovery aids; actual suffixed compilation and artifact inspection decide acceptance. EX25 deliberately rejects 10.7 specialization until its build profile is reviewed. Run the independently built ordinary path when compatible; do not silently turn 100f into 100a or upgrade the Toolkit Lane.

## Features and resource gates

Current capability tables list clusters, DSM and TMA for 10.x, 11.0 and 12.x. Their presence does not remove H04's lifetime, resource or completion obligations. Tensor Core formats differ: native FP64 inputs are listed for 10.0 and 10.7, but not 10.3, 11.0 or 12.x. FP4/FP6 support is not a license to replace FP32 arithmetic; define scaling, rounding, accumulation, output precision and an accepted error budget first. EX25 uses exact int32 copies and changes no precision.

For the reviewed per-block shared-memory ceilings: 10.0/10.3/11.0 allow **227 KiB**, 12.x **99 KiB**, and 10.7 **327 KiB**. More than 48 KiB requires dynamic allocation and explicit opt-in; 10.7's 328 KiB per-SM configuration additionally needs the documented oversized-shared-memory mode. Query actual device and kernel limits. The Blackwell tuning guide's broader 12.0 resource statements differ from the current capability table in some per-SM details; this unit uses the capability table for this selected per-block ledger and does not infer occupancy from either.

EX25 needs only a 1024 B tile plus an 8 B barrier for its specialized load. Global input/output with guards total at most **524352 B**. No tensor map, cluster, multicast, TMA store, Tensor Core instruction, or family-exclusive instruction is used. Building the common bulk-copy protocol for an exact family teaches target admission without pretending it demonstrates every Blackwell feature.

## Tune a bounded workload

First establish correct outputs, then inspect instruction/resource artifacts and compare on the same device. Small 1024 B transfers may not amortize issue/wait overhead. Larger stage counts consume shared memory and may reduce occupancy. Capacity, declared feature support and a successful build do not establish bandwidth, overlap or speedup.

Record the actual GPU/CC, clocks, power, MIG/MPS, free memory, driver, compiler, target images, input sizes and timing boundaries. Nsight Compute requires administrator-approved performance-counter access and metrics available on the exact GPU; permission denial leaves that observation missing. A single-GPU copy says nothing about NVLink, multi-GPU scaling or matrix multiplication.

## Evidence boundary

This Learning Unit has four empty evidence arrays. Architecture behavior and performance remain **Pending Hardware Verification**. EX25 compilation is tracked independently per target; LAB19 and LAB20 require qualifying Reference Environment execution and complete Environment Manifests. Native Linux is the only Supported Environment; the browser executes no CUDA.

## Retrieval check

1. Which of 100f, 103f and 110f can serve CC 10.3 in the documented sets?
2. Why is `compute_100a` PTX not a forward-compatible fallback for 12.1?
3. Why can 10.7 appear in VIS15 but be rejected by EX25 specialization?
4. Does a 227 KiB ceiling mean the chosen kernel can launch at that size?
5. What numerical decision is still missing when FP4 hardware is available?

## Practice and next edge

Complete [H05 Exercises](/en/architecture/blackwell-families/exercises/), then read the [separate solutions](/en/architecture/blackwell-families/solutions/) and [PB-R7-005](/en/practice/#pb-r7-005). [H06](/en/architecture/portable-specialization/) turns these sets into a dispatch and fallback contract; [LAB20](/en/labs/blackwell-portable-comparison/) supplies a bounded execution protocol.

## Sources and licensing

Reviewed **2026-10-04** through current Context7 discovery and exact owner pages: [capabilities §5.1](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html), [Toolkit 13.3.1 NVCC §5.2/5.5](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html#gpu-feature-list), and [Blackwell tuning §1.4](https://docs.nvidia.com/cuda/blackwell-tuning-guide/index.html). [SRC-CUDA-107](/en/sources-and-versions/#src-cuda-107) records the version boundary. Original teaching ledger and prose: CC BY 4.0. NVIDIA documentation retains its proprietary notices; no owner table, figure or sample is copied or adapted.
