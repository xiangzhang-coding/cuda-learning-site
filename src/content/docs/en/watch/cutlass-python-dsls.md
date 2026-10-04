---
title: 'W06: CUTLASS Python DSLs'
description: Track explicit layout programming, evolving compiler surfaces and separate proprietary terms.
pairId: w06
counterpart: /watch/cutlass-python-dsls/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W06
prerequisites: [L09, T04, T05]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUTLASS release', url: 'https://github.com/NVIDIA/cutlass/releases/tag/v4.8.0', version: '4.8.0', platform: 'Python DSL; source review', accessDate: '2026-10-04' }
  - { title: 'CUTLASS DSL quickstart', url: 'https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/quick_start.rst', version: '4.8.0', platform: 'Native Linux', accessDate: '2026-10-04' }
  - { title: 'CUTLASS DSL software license', url: 'https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/license.rst', version: '4.8.0; agreement 2025-05-08', platform: 'Package and materials', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w06 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W06 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'L09,T04,T05' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/watch/cutlass-python-dsls/" lang="zh-CN">阅读中文对应页</a>

## Motivation

CuTe DSL lets a Python author retain explicit layouts, tensors, copy/MMA atoms and pipelines rather than spelling C++ template metaprograms. Python syntax does not remove the thread/data hierarchy. Compare what the programmer controls before comparing it with cuTile or Triton.

## Stable prerequisites

[L09: CUTLASS C++ structure](/en/libraries/cutlass-cpp-gemm-structure/), [T04: blocked GEMM](/en/triton/blocked-matrix-multiplication/) and [T05: autotuning](/en/triton/autotuning/) provide layout, numerical and measurement contracts. Their completion requires no CUTLASS Python installation.

## Current interface status

Review coordinate: **CUTLASS v4.8.0**, package **nvidia-cutlass-dsl**. Released CuTe DSL, experimental primitives/task scheduling, and preview compiler paths need separate labels. The v4.8.0 notes describe the opt-in `cute_ext` compiler pipeline selected by `CUTE_DSL_USE_EXTENSION_COMPILER=1` as **preview**; do not turn its planned future default into a promise. The older Python interface that instantiated C++ kernels was deprecated as of 4.0; it is not the same API as native Python DSL kernel authoring. A release tag does not make every submodule stable.

## Software and hardware gates

The versioned 4.8 quickstart lists **Python 3.10–3.14t**, Linux x86_64/aarch64 and Windows x86_64. This Learning Site supports only native Linux. It distinguishes **CUDA 12.9** and **13.4**, with driver **575.51.03+** for 12.9 and the matching Toolkit driver requirements for 13.4. New Rubin SM107 execution requires **R615**, not the preview R610 driver. Architecture coverage is operation-specific: Ampere/Ada warp MMA, Hopper warpgroup/TMA and Blackwell tcgen05/TMEM are not interchangeable targets.

The wheel contains the kernel-generation stack; `[cu13]` selects a different dependency path. The owner also provides a separate `--pre` package channel. Match examples and setup scripts to the exact source commit and wheel. Never apply an unpinned installation command from current documentation to a Stable Curriculum environment.

## Limitations and separate license

Explicit layouts, pipeline lifetimes, dtype/accumulator choices and target-specific instructions still need correctness checks. JIT/AOT artifacts, calling conventions and caches must match the selected compiler and consumer; neither a wheel import nor similarity to CuTe C++ proves ABI compatibility or speed. The DSL does not automatically supply the complete C++ GEMM/Conv profiler and library interface.

**The Python DSL has separate proprietary terms.** At v4.8.0, `python/LICENSE.txt` is BSD-3-Clause, while `cutlass_compiler/LICENSE.txt` explicitly points `python/CuTeDSL` files to the NVIDIA EULA. The versioned DSL agreement (2025-05-08) restricts use and redistribution, permits specified sample derivatives under conditions, and distinguishes components under other licenses. Do not apply the repository's BSD label to the whole `nvidia-cutlass-dsl` package, or relicense owner examples as Apache-2.0/CC BY 4.0. This page contains original explanation and links only. [Promotion](/en/watch/#promotion-is-a-separate-decision) remains separate; evidence arrays are empty.

## Retrieval check

Does a BSD file elsewhere in CUTLASS authorize copying a DSL example into this site's canonical project? No. Review the exact file, package, release and governing terms first. Does a passing C++ GEMM test validate a Python DSL kernel? No: it is a different compiler path and subject.

## Owner sources

Accessed **2026-10-04**: [v4.8.0 release notes](https://github.com/NVIDIA/cutlass/releases/tag/v4.8.0), [versioned quickstart](https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/quick_start.rst), [current overview](https://docs.nvidia.com/cutlass/latest/media/docs/pythonDSL/overview.html), [Python directory license](https://github.com/NVIDIA/cutlass/blob/v4.8.0/python/LICENSE.txt), [compiler license exception](https://github.com/NVIDIA/cutlass/blob/v4.8.0/cutlass_compiler/LICENSE.txt), and [exact DSL agreement](https://github.com/NVIDIA/cutlass/blob/v4.8.0/media/docs/pythonDSL/license.rst). Release-note test claims are upstream claims, not local results. [Watch index](/en/watch/).
