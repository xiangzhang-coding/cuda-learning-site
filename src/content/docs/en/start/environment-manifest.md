---
title: 'O03: Reading an Environment Manifest'
description: Separate hardware, software, workload, and measurement coordinates so a CUDA claim has an honest scope.
pairId: o03
counterpart: /start/environment-manifest/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - outcome
  - prerequisites
  - manifest
  - relationships
  - support
  - tiers
  - lanes
  - reference-boundary
  - retrieval
  - practice
  - sources
resourceKind: learning-unit
unitId: O03
prerequisites:
  - O01
relatedUnits:
  - O02
exampleIds:
  - O03-MANIFEST-TEMPLATE
  - O03-INCOMPLETE-A
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
sources:
  - title: NVIDIA CUDA Toolkit Archive
    url: 'https://developer.nvidia.com/cuda-toolkit-archive'
    version: '11.8.0, 12.9.2, and 13.3.1 release identities'
    platform: 'All published platforms'
    accessDate: '2026-08-24'
  - title: CUDA Toolkit 11.8.0 Release Notes
    url: 'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html'
    version: '11.8.0'
    platform: 'Linux x86_64'
    accessDate: '2026-08-24'
  - title: CUDA Toolkit 12.9 Update 2 Release Notes
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-toolkit-release-notes/index.html'
    version: '12.9.2'
    platform: 'Linux x86_64'
    accessDate: '2026-08-24'
  - title: CUDA Toolkit 13.3 Update 1 Release Notes
    url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html'
    version: '13.3.1'
    platform: 'Linux x86_64'
    accessDate: '2026-08-24'
  - title: CUDA Installation Guide for Linux 12.9
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-installation-guide-linux/index.html#supported-c-dialects'
    version: '12.9.2'
    platform: 'Ubuntu 24.04 x86_64'
    accessDate: '2026-08-24'
  - title: CUDA Installation Guide for Linux 13.3
    url: 'https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#supported-c-dialects'
    version: '13.3.1'
    platform: 'Ubuntu 24.04 x86_64'
    accessDate: '2026-08-24'
  - title: CUDA Minor Version Compatibility
    url: 'https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html'
    version: 'Current on 2026-08-24'
    platform: 'Linux x86_64'
    accessDate: '2026-08-24'
  - title: CUDA Programming Guide - Compute Capabilities
    url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html'
    version: '13.3.1'
    platform: 'CUDA-capable GPUs'
    accessDate: '2026-08-24'
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o03 }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,manifest,relationships,support,tiers,lanes,reference-boundary,retrieval,practice,sources' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: learning-unit }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O03 }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O01 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O02 }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: 'O03-MANIFEST-TEMPLATE,O03-INCOMPLETE-A' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:source-count', content: '8' }
  - tag: meta
    attrs: { name: 'cuda:source-versions', content: '11.8.0,12.9.2,13.3.1' }
---

<a class="locale-pair" data-locale-counterpart href="/start/environment-manifest/" lang="zh-CN">阅读中文对应页</a>

An Environment Manifest is not “CUDA 13.3” or an `nvidia-smi` screenshot. It records the hardware, software, workload, and method coordinates needed to interpret one build, run, or measurement and to see where its conclusion stops.

## What you should be able to do

- Decide whether a manifest is complete and name missing coordinates.
- Keep GPU, compute capability, driver, Toolkit, components, compilers, and operating system separate.
- Use Supported Environment, Reference Environment, Toolkit Lane, and GPU Capability Tier without conflating them.
- Add the different fields required for correctness and performance evidence.

## Prerequisite

Complete [O01: Using the Learning Site](/en/start/using-the-learning-site/) first. O03 and O02 both depend directly on O01. Combine this unit with [O02](/en/start/evidence-status/) when assigning an Evidence Status to a manifest.

## A complete Environment Manifest

O03-MANIFEST-TEMPLATE is a field template, not a machine record. Replace every angle-bracket value with an observation; never infer an empty field.

| Coordinate | What to record | Why it stays separate |
| --- | --- | --- |
| GPU identity | `<model, device identifier, or UUID>` | A product name does not identify the exercised device by itself |
| compute capability | `<major.minor and query method>` | It describes feature and limit contracts, not a Toolkit version |
| GPU count | `<visible and actually used GPU count>` | Single- and multi-GPU reproduction differ |
| driver version | `<exact installed driver>` | The driver is independent of the Toolkit and affects runtime compatibility |
| CUDA Toolkit version | `<exact X.Y.Z>` | The Toolkit is a bundle, not the driver or every component version |
| component versions | `<relevant NVCC, cuBLAS, Nsight, and others>` | Components have been independently versioned since CUDA 11 |
| compiler information | `<NVCC version; host compiler name and version>` | NVCC invokes a host compiler, so both affect a build |
| operating system | `<distribution, release, architecture, relevant kernel>` | “Linux” alone is not precise enough |
| workload and shape | `<program, commit, data type, dimensions, iterations>` | Results apply only to the exercised workload |
| memory requirement | `<host/device requirement or limit>` | The capability tier must fit the problem |
| permissions | `<driver, counters, container, or multi-GPU permissions>` | Missing permissions change possible steps and measurements |
| exact command | `<unabridged build or run command>` | Flags, target, and environment variables are evidence coordinates |
| correctness method | `<reference, tolerance, hash, or invariant>` | Producing output is not the same as being correct |
| correctness criteria | `<explicit pass/fail conditions>` | Criteria must exist before observation |
| observation date | `<YYYY-MM-DD>` | Drivers, tools, and environments drift |

Compilation evidence also records the selected **C++ dialect** and compilation **target**. Performance evidence additionally records baseline and hypothesis, clocks or power policy, warm-up, synchronization, exact timer or profiler version, statistics and sample method, result, and interpretation boundaries.

O03-INCOMPLETE-A says only “RTX 4090, CUDA 13.3.1, ran matrix multiplication.” It omits compute capability, GPU count, driver, components, compilers, OS, shape, memory, permissions, exact command, correctness, and observation date. It cannot support an interpretable correctness or performance conclusion.

## Related but different coordinates

- **GPU model is not compute capability.** The model helps identify a device; compute capability defines architectural feature and limit contracts.
- **Compute capability is not a Toolkit version.** Several Toolkits may target one capability, subject to their exact target and component support.
- **Driver and CUDA Toolkit are independent.** NVIDIA's paired driver and minor-compatibility floor are different values too.
- **Toolkit and component versions are independent.** One Toolkit can contain differently numbered NVCC, cuBLAS, and profiler releases.
- A **Toolkit Lane** is a compile-evidence target, not a curriculum copy or Reference Environment.
- A **Supported Environment** is a family for which the site accepts support responsibility. A **Reference Environment** is one declared, maintainer-controlled configuration within it.
- **Hardware capability is not observed runtime behavior.** Meeting a gate permits a route; it does not prove that a program passed.

## The only Supported Environment

**Native Linux is the only Supported Environment.** The site accepts setup guidance, troubleshooting boundaries, and validation responsibility for native Linux. Windows, WSL, hosted notebooks, and other systems may appear only as bounded unsupported comparisons and create no setup, troubleshooting, Lab, or validation commitment.

An upstream vendor supporting a platform and this curriculum declaring a Supported Environment are different facts. The former describes the product; the latter describes this site's responsibility.

## Two GPU Capability Tiers

The **Baseline GPU Capability Tier** requires compute capability **7.5 or newer**. Stable Curriculum fundamentals use problem sizes that fit within **8 GB**. The memory bound is a workload contract, not an “8 GB tier.”

The **Modern Single-GPU Capability Tier** requires compute capability **8.0 or newer** and at least **8 GB**. It covers the complete single-GPU route. Multi-GPU and architecture-specific activities declare additional requirements.

Tiers combine compute capability, memory, GPU count, features, and permissions. A product nickname or more memory does not create another curriculum.

## Three Toolkit Lanes

EX02 completed preprocessing, compilation, linking, and inspection in all three Lanes in [CUDA Compile Evidence run 32717957107](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/32717957107): C++17 on 11.8.0 and both C++17/C++20 on 12.9.2 and 13.3.1 are Compile-Checked. That status belongs only to the exact EX02 source, dialect, target, and recorded environment. It upgrades no other subject and provides no GPU runtime evidence.

| Toolkit Lane | Selected OS | Curriculum dialects | Owner version coordinates, not local observations |
| --- | --- | --- | --- |
| CUDA 11.8.0 | Ubuntu 22.04 x86-64 | C++17 | NVCC 11.8.89; paired Linux driver 520.61.05; 11.x minor-compatibility floor 450.80.02 |
| CUDA 12.9.2 | Ubuntu 24.04 x86-64 | C++17, C++20 | NVCC 12.9.86; paired Linux driver 575.57.08; 12.x floor 525.60.13 |
| CUDA 13.3.1 | Ubuntu 24.04 x86-64 | C++17, C++20; separate C++23 probe | NVCC 13.3.73; paired Linux driver 610.43.02; 13.x floor R580/`>=580` |

The CUDA 13.3.1 Linux installation guide lists C++23, while the same-version NVCC `--std` option reference still lists only through C++20. The separate exact-image probe recorded GCC 13.3 and NVCC 13.3.73 and observed that `-std=c++23` is unsupported with the configured host compiler. Its result is `unsupported`, not EX02 C++23 Compile-Checked. A container tag by itself remains registry metadata.

## Reference Environment declaration boundary

**No Reference Environment is currently declared.** Declaration requires maintainer control, a suitable GPU and compatible driver, one successful controlled baseline run, a complete Environment Manifest, and an explicit GPU Capability Tier.

Ubuntu 24.04 x86-64 with CUDA 13.3.1 is only a candidate software coordinate. It lacks a GPU declaration, complete manifest, and controlled baseline run, so it is not a Reference Environment and cannot produce Runtime-Verified evidence.

## Retrieval check

1. Why must GPU model, compute capability, and Toolkit version stay separate?
2. How does a paired driver differ from a minor-compatibility floor?
3. What are Toolkit Lane, Supported Environment, and Reference Environment each for?
4. Which fields does a performance manifest add to a correctness manifest?
5. Why does meeting a GPU Capability Tier not prove runtime behavior?

## Continue with practice

- Complete the [O03 Exercises](/en/start/environment-manifest/exercises/), then inspect the separate [reviewed solutions](/en/start/environment-manifest/solutions/).
- Solve PB-R0-002 in the [Practice Bank](/en/practice/) to repair an incomplete manifest and support-boundary claim.

## Sources and review

Exact Toolkit, component, paired-driver, Linux qualification, and dialect facts come from NVIDIA versioned release notes and installation guides. Driver floors come from CUDA Compatibility, and compute capability comes from the CUDA Programming Guide. Every URL, version, platform, and access date is recorded in the [Sources and Version Record](/en/sources-and-versions/) and was reopened on **2026-08-24**.

**Fact-check date: 2026-08-24.** The manifest is a template and hypothetical counterexample. This page records no real machine, runtime output, or performance result.
