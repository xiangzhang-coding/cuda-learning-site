---
title: 'W01: CUDA Tile C++'
description: Separate tile expressions, compiler support and curriculum admission.
pairId: w01
counterpart: /watch/cuda-tile-cpp/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W01
prerequisites: [M03, M17, M19]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVCC tile compilation', url: 'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html', version: '13.4', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'CUDA Tile C++ API', url: 'https://docs.nvidia.com/cuda/cuda-tile-cpp-api-reference/index.html', version: '13.4', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w01 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W01 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'M03,M17,M19' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/watch/cuda-tile-cpp/" lang="zh-CN">阅读中文对应页</a>

## Motivation

SIMT code assigns work to threads; tile code expresses operations on groups of elements and lets the compiler map intra-block parallelism. This can reduce manual scheduling work, but bounds, shapes, numerical contracts and dependencies still belong to the author. Tile is an execution abstraction, not a synonym for shared-memory tiling.

## Stable prerequisites

[M03: shared-memory tiling](/en/memory/shared-memory-tiling/), [M17: architecture targets](/en/toolchain/compiler-architecture-targets/) and [M19: C++ dialects](/en/toolchain/cpp-dialect-boundaries/) explain the concepts this entry compares. No Stable Curriculum unit requires W01.

## Current interface status

**Newly introduced interface, retained in the watch.** NVCC documents Tile C++ beginning with CUDA 13.3; the reviewed current compiler documentation is 13.4. The symbols `cuda_tile.h`, `__tile_global__` and `cuda::tiles` identify this frontend. It can share a translation unit with SIMT code. Do not label all Tile C++ “Developer Preview” just because an earlier Toolkit release was a preview. Conversely, inclusion in released documentation does not grant this site a stable teaching or ABI promise.

## Software and hardware gates

Tile code generation is opt-in via `--enable-tile`, needs **C++20 or later**, and is unavailable for the default Turing `sm_75` target. Select an explicitly supported target above that boundary and verify the exact compiler target table; do not infer every instruction from a major CC. The compiler can emit Tile IR or device images depending on selected output. NVRTC's tile path instead retrieves Tile IR for driver loading; it must not be treated as the same cubin path. Record Toolkit, NVCC/NVRTC, Tile IR producer/consumer, driver, target and host compiler separately. Reading needs no GPU; any future execution requires a compatible native Linux device and driver.

## Limitations and promotion boundary

The compiler owns mapping, not proof of your algorithm or a speedup guarantee. Compare shape legality, masked edges and synchronization before comparing performance. This entry adds no canonical example, Lab, Toolkit Lane or evidence label. [Promotion criteria](/en/watch/#promotion-is-a-separate-decision) apply separately. CUDA Toolkit components and headers have their own [EULA](/en/watch/developer-preview/#limitations-and-license); our prose does not redistribute `cuda_tile.h` or owner examples.

## Retrieval check

Would adding `--enable-tile` to an unchanged C++17, `sm_75` build establish Tile support? No: both dialect and target gates remain unsatisfied. A valid build still would not establish correct outputs or performance.

## Owner sources

Accessed **2026-10-04**: [NVCC, Tile Compilation in CUDA](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html) and [Tile C++ API reference](https://docs.nvidia.com/cuda/cuda-tile-cpp-api-reference/index.html), current 13.4 documentation; [NVRTC](https://docs.nvidia.com/cuda/nvrtc/index.html) for the distinct runtime-compiler path. These are documentation observations, not tests executed by this site. [Watch index](/en/watch/).
