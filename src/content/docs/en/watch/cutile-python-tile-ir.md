---
title: 'W02: cuTile Python and CUDA Tile IR'
description: Track frontend, compiler and exported-kernel contracts independently.
pairId: w02
counterpart: /watch/cutile-python-tile-ir/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W02
prerequisites: [P03, T01, T04]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'cuTile release notes', url: 'https://docs.nvidia.com/cuda/cutile-python/generated/release_notes.html', version: '1.6.0', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'cuTile quickstart', url: 'https://docs.nvidia.com/cuda/cutile-python/quickstart.html', version: '1.6.0', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'Tile IR specification', url: 'https://docs.nvidia.com/cuda/tile-ir/', version: '13.4', platform: 'Compiler interface', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w02 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W02 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P03,T01,T04' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/watch/cutile-python-tile-ir/" lang="zh-CN">阅读中文对应页</a>

## Motivation

A Python tile frontend, its intermediate representation and the machine-code compiler are different contracts. cuTile expresses element groups; CUDA Tile IR carries tile semantics to the compiler. A Python package version alone cannot identify the generated-kernel ABI or hardware support.

## Stable prerequisites

[P03: runtime compilation](/en/python/runtime-compilation-linking/), [T01: block values](/en/triton/programs-and-block-values/) and [T04: blocked GEMM](/en/triton/blocked-matrix-multiplication/) provide the comparison vocabulary. Their completion does not require W02 or a cuTile installation.

## Current interface status

The reviewed released package is **cuda-tile 1.6.0**, dated 2026-09-09; the import namespace is `cuda.tile`. This is not a blanket preview label. The repository separately identifies `cuda.tile_preview` / `cuda-tile-preview` as actively developing APIs outside the stable namespace. Version 1.6.0 adds CTK 13.4 features, including unchecked accesses and dependent launch; version 1.5.0 introduced calling convention v2 for static shapes or tuple arguments, and 1.3.0 changed how constant parameters participate in the kernel ABI. Preserve the calling convention when exporting or consuming a kernel.

## Software and hardware gates

The current quickstart lists Python **3.10–3.14 and 3.14t**, driver **r580+**, and CC **8.x, 9.x, 10.x, 11.x or 12.x**. This is a frontend support envelope, not permission to run every operation on every device. The compiler packages `nvidia-cuda-tileiras`, `nvidia-cuda-nvcc` and `nvidia-nvvm` must share a major.minor version. System Toolkit use starts at 13.1, but Ampere/Ada support arrived with 13.2 and Hopper with 13.3; CTK 13.4 operations need that compiler and a driver supporting the new feature. The stale repository README discusses tileiras 13.2 and excludes Hopper; the 1.4.0 release notes explicitly add it. Do not combine those snapshots. This site's support boundary remains native Linux.

## Limitations and promotion boundary

Tile IR is not PTX, and a frontend decorator is not a runtime correctness test. Portable bytecode export without a GPU target requires bytecode version 13.3 or later in the 1.6.0 notes. Disabling bounds checking asserts all accesses are valid; it does not repair ragged tiles. Python syntax is a documented subset, not arbitrary host Python. cuTile source is Apache-2.0; bundled compiler components keep separate CUDA terms. No code or owner sample is copied here. The [promotion criteria](/en/watch/#promotion-is-a-separate-decision) remain unmet by this source review; all evidence arrays are empty.

## Retrieval check

Can a newer Python wheel make a 13.2 compiler support Hopper, or make an old caller understand calling convention v2? No. Record and verify each layer independently; do not upgrade a Stable Curriculum lane to make an optional experiment work.

## Owner sources

Accessed **2026-10-04**: [1.6.0 and historical release notes](https://docs.nvidia.com/cuda/cutile-python/generated/release_notes.html), [quickstart](https://docs.nvidia.com/cuda/cutile-python/quickstart.html), [Tile IR specification](https://docs.nvidia.com/cuda/tile-ir/), and [repository README, preview namespace, test instructions and license declaration](https://github.com/NVIDIA/cutile-python/blob/main/README.md). Owner test instructions describe upstream coverage, not execution evidence from this site. [Watch index](/en/watch/).
