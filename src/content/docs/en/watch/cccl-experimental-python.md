---
title: 'W05: CCCL Experimental Namespaces and Python'
description: Read stability promises at the namespace and package level.
pairId: w05
counterpart: /watch/cccl-experimental-python/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W05
prerequisites: [L03, L05, P01]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CCCL experimental stability', url: 'https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/cudax/index.rst', version: '3.4.3', platform: 'C++ API and ABI', accessDate: '2026-10-04' }
  - { title: 'CCCL Python package metadata', url: 'https://github.com/NVIDIA/cccl/blob/v3.4.3/python/cuda_cccl/pyproject.toml', version: '3.4.3', platform: 'Python package', accessDate: '2026-10-04' }
  - { title: 'cuda.compute beta API', url: 'https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/python/compute_api.rst', version: '3.4.3', platform: 'Python API', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w05 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W05 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'L03,L05,P01' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/watch/cccl-experimental-python/" lang="zh-CN">阅读中文对应页</a>

## Motivation

CCCL groups reusable algorithms and CUDA C++ building blocks, but a repository name is not one stability promise. A stable CUB primitive cannot lend its contract to an experimental task graph or a Python binding that happens to live beside it.

## Stable prerequisites

[L03: CUB device primitives](/en/libraries/cub-device-primitives/), [L05: libcu++ synchronization](/en/libraries/libcu-plus-plus-synchronization/) and [P01: CUDA Python bridge](/en/python/cuda-python-bridge/) distinguish algorithm ownership, completion and language bindings.

## Current interface status

The reviewed source tag is **CCCL v3.4.3**. `cuda::experimental` (cudax) explicitly offers **no API or ABI stability guarantees** and is distributed through GitHub rather than as part of the Toolkit in this version's documentation. Separately, **cuda.compute is public beta**, with API changes possible without notice. `cuda.coop._experimental` provides block/warp cooperative primitives; the spelling is part of the warning. `cuda-cccl` package metadata is classified Beta. Do not confuse these surfaces with the Stable Curriculum's selected Thrust, CUB or libcu++ interfaces.

## Software and hardware gates

The Python README specifies Python **3.10+**, Toolkit **12.x or 13.x**, and CC **6.0+** as upstream requirements. The site's baseline remains CC 7.5+. The `cu12`/`cu13` extras can install Toolkit components; `sysctk12`/`sysctk13` leave compatible system components to the user. At v3.4.3 the bindings constraints differ: **>=12.9.1,<13.0.0** versus **>=13.0.0,<14.0.0**. Numba-backed extras also constrain numba-cuda and exclude specific releases. Lock the resolved dependency set, compiler/LTO interfaces and target in a separate native Linux environment; a package name or broad extra is not a reproducible profile. C++ experimental headers require their own release-specific compiler and dialect review rather than borrowing the Python requirements.

## Limitations and license

Device-wide algorithms and block primitives have different participant and temporary-storage obligations. An experimental executor does not make captured pointers outlive their allocations. Recheck API shape, ownership, stream completion and compiled artifacts after any dependency change. The reviewed Python `pyproject.toml` declares **Apache-2.0 WITH LLVM-exception** in its file header; inspect individual files and the repository licenses before adaptation. This entry links rather than redistributes upstream code. [Promotion](/en/watch/#promotion-is-a-separate-decision) remains a separate decision; no build, runtime or performance evidence is claimed.

## Retrieval check

Does “CCCL v3.4.3” imply that a `cuda::experimental` binary interface is stable, or that `cuda.compute` left beta? No. Read the specific namespace's contract and the package's versioned metadata.

## Owner sources

Accessed **2026-10-04**, tag **v3.4.3**: [cudax stability](https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/cudax/index.rst), [Python README](https://github.com/NVIDIA/cccl/blob/v3.4.3/python/cuda_cccl/README.md), [package and file metadata](https://github.com/NVIDIA/cccl/blob/v3.4.3/python/cuda_cccl/pyproject.toml), [beta API warning](https://github.com/NVIDIA/cccl/blob/v3.4.3/docs/python/compute_api.rst), [release fixes](https://github.com/NVIDIA/cccl/releases/tag/v3.4.3), and [owner test tree](https://github.com/NVIDIA/cccl/tree/v3.4.3/python/cuda_cccl/tests). Test presence is not a local test run. [Watch index](/en/watch/).
