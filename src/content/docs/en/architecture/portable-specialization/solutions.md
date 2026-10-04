---
title: 'H06 Solutions: Admit, Complete, Then Compare'
description: Worked dispatch decisions and a one-arriver bulk-copy completion proof.
pairId: h06-solutions
counterpart: /architecture/portable-specialization/solutions/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, dispatch, comparison, evidence]
resourceKind: solution-set
unitId: H06-SOLUTIONS
prerequisites: [H06-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'PTX bulk copy', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,dispatch,comparison,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/portable-specialization/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Attempt [H06 Exercises](/en/architecture/portable-specialization/exercises/) before reading these original worked answers.

## Dispatch decisions

| Mode | 100f build / CC 10.3 | 100f build / CC 12.1 |
| --- | --- | --- |
| portable | baseline only | baseline only |
| auto | baseline then specialization | baseline only |
| specialized | baseline then specialization | reject before launch |
| invalid | reject | reject |

A launch failure is neither an admission miss nor successful specialized execution. Stop and retain it; reusing a damaged context can make subsequent results meaningless. Test an unknown CC (e.g. 130), a cross-family CC (120), the portable-only build and an invalid mode. Host tests establish decisions and oracle behavior, not image loading, GPU synchronization or correctness. Actual CUDA calls still need checked completion.

## Complete comparable work

Initialize the aligned barrier for **one arrival** because only the issuer arrives. Register 1024 expected bytes once, publish initialization to the async proxy and issue the aligned bulk copy. Wait for phase zero to finish both arrival and transfer accounting; then publish with a block barrier. All consumers read, a final block barrier ends their reads, and the issuer invalidates the transaction barrier. A 128-arrival initialization with one arriver cannot complete.

Time complete load/consume kernels with events in the same stream: five warmups and ten samples of 100 launches on both paths. Check all outputs and guards independently before and after timing. Record raw batch milliseconds, workload, target and execution order; no counter permission means unmeasured counters, not zero. A pipeline with reused buffers adds phases and read-versus-reuse dependencies that this one-phase proof does not cover.

## Evidence and rights

Expected observations may describe matching payloads and intact guards. Recorded observations remain empty until a qualifying run supplies logs and an Environment Manifest; runtime and performance remain **Pending Hardware Verification**. Reviewed 2026-10-04: [SRC-CUDA-108](/en/sources-and-versions/#src-cuda-108). Original CC BY 4.0; owner references retain their notices.
