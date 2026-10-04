---
title: 'H05 Solutions: Keep Target and Numerical Contracts Separate'
description: Worked directional target matrix and an equivalence-preserving fallback review.
pairId: h05-solutions
counterpart: /architecture/blackwell-families/solutions/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, targets, fallback, evidence]
resourceKind: solution-set
unitId: H05-SOLUTIONS
prerequisites: [H05-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA capability scopes', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,targets,fallback,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/blackwell-families/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Attempt [H05 Exercises](/en/architecture/blackwell-families/exercises/) first. These are worked paper answers, not execution records.

## Target matrix

| Target | 10.0 | 10.3 | 10.7 | 11.0 | 12.0 | 12.1 |
| --- | --- | --- | --- | --- | --- | --- |
| 100a | yes | no | no | no | no | no |
| 100f | yes | yes | yes | no | no | no |
| 103f | no | yes | yes | no | no | no |
| 110f | no | no | no | yes | no | no |
| 120f | no | no | no | no | yes | yes |
| 121f | no | no | no | no | no | yes |

These are documented sets. Counterexamples include 103f→10.0, 100f→11.0 and 121f→12.0. EX25 intersects them with its 13.3.1 reviewed set, excluding 10.7. A successful 100f build alone supplies no 10.7 project validation. Use ordinary code with a compatible cubin or PTX and a driver able to consume the emitted PTX version. An ordinary cubin does not cross major CC boundaries merely because PTX can be forward-compatible.

## Preserve the numerical contract

100a cannot serve CC 12.1. Changing its spelling does not translate the instruction set. CC 12.x lacks native FP64 Tensor Core input support in the reviewed table, but supports ordinary FP64 arithmetic. FP4 changes representable values and numerical error; caller permission and a complete new contract would be needed.

A candidate ordinary FP64 SIMT implementation preserves the original inputs, output shape and specified accumulation/error contract. Define absolute/relative tolerances, NaN/infinity handling and signed-zero requirements before running; compare cancellation, extreme values and representative data to an independent high-precision reference. Different reduction order may require justified tolerances rather than assumed bitwise identity. If the original contract requires bitwise identity and it cannot be met, reject the replacement. Retain exact compiler/image targets and correctness logs before bounded same-device timing.

## Evidence and rights

Source review 2026-10-04: [SRC-CUDA-107](/en/sources-and-versions/#src-cuda-107). No compiler output or GPU result is supplied by these answers. Runtime and performance remain **Pending Hardware Verification**. Original CC BY 4.0; owner references retain their notices.
