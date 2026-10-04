---
title: 'W03: Developer Preview and Toolkit Lane Boundaries'
description: Distinguish the archived preview, current download and admitted evidence targets.
pairId: w03
counterpart: /watch/developer-preview/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W03
prerequisites: [O03, M17]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Toolkit archive', url: 'https://developer.nvidia.com/cuda-toolkit-archive', version: '13.4.0 Developer Preview; 13.4.2', platform: 'Release discovery', accessDate: '2026-10-04' }
  - { title: 'CUDA release notes', url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html', version: '13.4.2', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w03 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W03 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'O03,M17' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/watch/developer-preview/" lang="zh-CN">阅读中文对应页</a>

## Motivation

A Toolkit Lane is a reproducible evidence target. A download channel is a way to obtain software. Confusing them silently changes the compiler, headers, libraries and driver assumptions behind a lesson.

## Stable prerequisites

[O03: Environment Manifest](/en/start/environment-manifest/) explains what to record; [M17: compiler targets](/en/toolchain/compiler-architecture-targets/) explains why a supported target is not the same as a supported device deployment.

## Current release status

As reviewed on **2026-10-04**, the owner archive lists **13.4.0 Developer Preview (July 2026)** and subsequent **13.4.1 and 13.4.2 (September 2026)** releases. The download page currently offers **13.4.2**, not an active 13.4.0 preview. This entry preserves the preview boundary without inventing a newer preview or relabeling 13.4.2 as preview. Neither preview availability nor a later general release automatically admits a Toolkit Lane.

## Software and hardware gates

The current release notes distinguish existing CUDA 13.x applications under minor-version compatibility on **driver >=580** from new 13.4 features/platforms requiring **R615 or later**. For a concrete edge case, CUTLASS v4.8.0 says Rubin SM107 execution needs R615; R610 from the 13.4 Developer Preview is insufficient. “CUDA 13” alone does not settle this question. Match OS, CPU architecture, host compiler, exact Toolkit components, GPU target, driver and API before attempting a separate probe. Native Linux is the site's only Supported Environment.

## Limitations and license

The site's admitted lanes remain **cuda-11.8 (11.8.0), cuda-12.9 (12.9.2), cuda-13.3 (13.3.1)**. Their pinned compile policy must change through explicit review, not a `latest` download or package resolver. Preview software can have API, ABI and component changes; archive labels do not establish a migration contract. Review the [CUDA EULA and component attachments](https://docs.nvidia.com/cuda/eula/index.html) for the exact distribution. No binaries, headers or samples are redistributed by this entry. [Promotion](/en/watch/#promotion-is-a-separate-decision) requires stable interfaces and local evidence; this source-only entry provides neither build nor runtime evidence.

## Retrieval check

A source page mentions 13.4.2 while a Lab pins 13.3.1. Should you replace the Lab compiler? No. Preserve its declared lane and treat any newer experiment as a separate environment with its own manifest, correctness criteria and evidence.

## Owner sources

Accessed **2026-10-04**: [release archive](https://developer.nvidia.com/cuda-toolkit-archive), [13.4.2 downloads](https://developer.nvidia.com/cuda-downloads), [release notes](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html), [CUTLASS v4.8.0 release note driver boundary](https://github.com/NVIDIA/cutlass/releases/tag/v4.8.0), and [CUDA EULA](https://docs.nvidia.com/cuda/eula/index.html). [Watch index](/en/watch/).
