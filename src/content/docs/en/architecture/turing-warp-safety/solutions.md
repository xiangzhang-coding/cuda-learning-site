---
title: 'H01 Solutions: Publication, Reuse and Dispatch'
description: A worked ordering proof for two rounds and an explicit compatible fallback.
pairId: h01-solutions
counterpart: /architecture/turing-warp-safety/solutions/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, warp, gating, evidence]
resourceKind: solution-set
unitId: H01-SOLUTIONS
prerequisites: [H01-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Turing independent thread scheduling', url: 'https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#independent-thread-scheduling', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,warp,gating,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/turing-warp-safety/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Exact prerequisite: [H01-EXERCISES](/en/architecture/turing-warp-safety/exercises/). Complete the attempts before comparing this original solution. Reviewed **2026-09-22**; [SRC-CUDA-103](/en/sources-and-versions/#src-cuda-103).

## Repair both ordering edges

Without publication, lane 0 can read slot 1 before lane 1 writes it. With only publication, both lanes first write round 0 and cross the barrier; lane 1 then reads slot 0 and overwrites slot 1 with 101 for round 1 before lane 0 reads the intended value 1. This is a permitted counterexample, not an observed GPU trace.

```text
require blockDim = (32, 1, 1), gridDim = (1, 1, 1)
require all 32 lanes participate in both rounds
mask = 0xffffffff
for round in [0, 1]:
    shared[lane] = input[32 * round + lane]
    __syncwarp(mask)                 // publication
    output[lane] = shared[lane XOR 1]
    __syncwarp(mask)                 // readers finish before reuse
```

The first barrier orders every participant's write before the corresponding peer read. The second orders every read before any next-round write. All participants use the same mask and no lane exits early. The final-round reuse barrier is conservative but valid.

| Lane | Final partner | Final expected value |
| --- | --- | --- |
| 0 | 1 | 101 |
| 1 | 0 | 100 |
| 30 | 31 | 131 |
| 31 | 30 | 130 |

For 31 logical elements, keep all 32 physical threads and shared slots, write zero to slot 31 in **each** round, and retain both full-warp barriers. Only output lanes 0–30 are valid; lane 30 returns zero under this explicit padding convention. Predicate input/output accesses, not the barriers. The unused allocated input/output slots are never accessed. If instead you drop lane 31 from membership, requesting lane 31 as a source remains invalid. An active mask cannot manufacture its data.

## Reject and replace the proposal

Reject independently: the sole `sm_80` cubin cannot execute at CC 7.5; hardware `cp.async` is unavailable there; 80 KiB exceeds Turing's 64 KiB per-block shared-memory maximum even with opt-in. A product string addresses none of these conditions.

Select the ordinary-copy exchange with 32-bit integers, 384 B global and 128 B shared storage, `compute_75` / `sm_75`, and both explicit warp barriers. The proposed environment is native Ubuntu 24.04 x86-64, Toolkit 13.3.1, NVCC 13.3.73, GCC 13.3.0, C++17 and driver 610.43.02, one CC 7.5 GPU; the bounded problem fits within 8 GB. Query actual device/resource properties and check the artifact before dispatch.

Compile-time feature guards prevent incompatible source branches entering the target pass. A host CC query chooses among built paths. Artifact inspection confirms images and generated instructions. None alone proves the runtime selected and correctly completed the intended path; do not silently fall back after an arbitrary execution failure.

## Evidence still needed

External behavior remains **Pending Hardware Verification**. This paper proof adds no compilation, runtime or performance observation. A future implementation needs source identity, complete Environment Manifest, retained build/target records, error-checked launch/completion, CPU comparison including both rounds and tails, and racecheck/synccheck reports in a qualifying Reference Environment. The original prose and pseudocode use CC BY 4.0; NVIDIA references keep their notices.
