---
title: 'G04 Solutions: Match Before Measuring'
description: Review matching participation and a rank-sensitive correctness oracle.
pairId: g04-solutions
counterpart: /multi-gpu/nccl-communicators-collectives/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, contract, oracle, review]
resourceKind: solution-set
unitId: G04-SOLUTIONS
prerequisites: [G04-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL collective API', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/api/colls.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,contract,oracle,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/nccl-communicators-collectives/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Attempt [G04-EXERCISES](/en/multi-gpu/nccl-communicators-collectives/exercises/) first. Reviewed 2026-09-19 against [SRC-CUDA-097](/en/sources-and-versions/#src-cuda-097).

## Solution 1: matching ledger

Use distinct visible devices 0 and 1, ranks 0 and 1 in the same two-member communicator, matching `ncclAllReduce`, `ncclInt32`, `ncclSum`, and count 257. Each separate buffer needs `257*4=1028` bytes. A root argument belongs to reduce/broadcast, not all-reduce. One thread groups both calls before waiting. The local API cannot prove the other rank's datatype, count, order or output placement: establish those as application invariants.

**Valid alternative:** reorder the two selected devices while retaining a bijective rank map and recording it. **Common errors:** one GPU twice, byte count as element count, reduce on only one participant, checking only rank 0.

## Solution 2: independent oracle

The rank terms sum to `3*R*(R+1)/2`; the repeated index term contributes `R*((i mod 17)-8)`. For R=2/i=0 this is `9-16=-7`; for R=4/i=16 it is `30+32=62`. Omit rank 1 at i=0 in the two-rank fixture and the candidate is -5, not -7. Replace a completed rank-1 output with its local input -2 and it also fails. Change each output position in turn in a host test to prove comparison coverage. Rank-dependent inputs distinguish contributions; checking all arrays detects a stale receive buffer outside rank 0.

Missing GPUs block before communication. Mismatch, async failure, timeout and cleanup failure return nonzero. Keep input vectors alive until all stream work finishes, including downloads. These arithmetic examples and host mutations are not collected GPU results.

## Evidence review

An optional execution needs EX24's exact two-GPU gate, rank logs and Environment Manifest. Without qualifying records, compilation stays independently empty, runtime stays **Pending Hardware Verification**, and recorded observations remain empty. Do not infer algorithm choice or performance from this solution.
