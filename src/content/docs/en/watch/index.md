---
title: Emerging Feature Watch
description: Read moving CUDA interfaces without changing the Stable Curriculum dependency contract.
pairId: emerging-feature-watch
counterpart: /watch/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [purpose, entries, review, promotion, evidence]
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'purpose,entries,review,promotion,evidence' } }
---

<a class="locale-pair" data-locale-counterpart href="/watch/" lang="zh-CN">阅读中文对应页</a>

## Why a separate watch?

Emerging Feature Watch tracks newly introduced, preview, beta and experimental interfaces without making them prerequisites for the Stable Curriculum. An upstream stable release can still remain here while teaching value and local evidence are reviewed. Reading any entry requires no GPU. Native Linux remains the only Supported Environment for external practice.

## Reviewed entries

| Entry | Question | Reviewed coordinates |
| --- | --- | --- |
| [W01: CUDA Tile C++](/en/watch/cuda-tile-cpp/) | What does the compiler own when work is expressed as tiles? | CUDA 13.3 introduction; current 13.4 compiler documentation |
| [W02: cuTile Python and Tile IR](/en/watch/cutile-python-tile-ir/) | Which frontend, bytecode and calling convention must agree? | cuda-tile 1.6.0; Tile IR 13.4 |
| [W03: Developer Preview boundary](/en/watch/developer-preview/) | Does a newer download change a Toolkit Lane? | Archived 13.4.0 Developer Preview; current download 13.4.2 |
| [W04: NCCL device and fabric](/en/watch/nccl-device-fabric/) | Who initiates communication, over which path? | NCCL 2.32.3; CFT introduced in 2.31 |
| [W05: CCCL experimental and Python](/en/watch/cccl-experimental-python/) | Which namespace actually promises stability? | CCCL v3.4.3; cuda.compute public beta |
| [W06: CUTLASS Python DSLs](/en/watch/cutlass-python-dsls/) | Which compiler, layout model and license apply? | CUTLASS v4.8.0; separate DSL terms |

## How to read and refresh a status

The review date is **2026-10-04**. Each entry links exact owner sources and distinguishes the package release, API/ABI contract, compiler, device and license. On each refresh, consult current Context7 where applicable, then check the exact owner documentation, release notes, source and relevant tests. A moving URL or successful package import cannot certify an older environment. Record disagreement rather than silently merging version claims. Source records are available in [Sources and Versions](/en/sources-and-versions/).

## Promotion is a separate decision

Promotion requires a non-preview stable interface, explicit project support, durable teaching value, Compile-Checked canonical Runnable Examples in applicable Toolkit Lanes, and Runtime-Verified required Labs in declared Reference Environments. Review the licenses and both Publication Pair counterparts. This publication promotes nothing and promises no future implementation. O–H units cannot depend on W entries, even through an intermediate resource. The admitted lanes remain cuda-11.8, cuda-12.9 and cuda-13.3; a release number is not an admission decision.

## Evidence boundary

These are source reviews, with no compilation or runtime evidence. No optional probe is published. If a later probe is added, retain its Environment Manifest, inputs, exact commands and actual logs, separate expected from recorded observations, and apply [Evidence Status](/en/start/evidence-status/) independently to compilation and runtime. Web tests and owner test listings do not grant GPU evidence or performance claims.
