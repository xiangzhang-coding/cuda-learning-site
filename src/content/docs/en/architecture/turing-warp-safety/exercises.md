---
title: 'H01 Exercises: Repair the Warp and Gate the Target'
description: Prove both memory-ordering edges and reject an unsupported specialized dispatch.
pairId: h01-exercises
counterpart: /architecture/turing-warp-safety/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, warp, gating, review]
resourceKind: exercise-set
unitId: H01-EXERCISES
prerequisites: [H01]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Turing independent thread scheduling', url: 'https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#independent-thread-scheduling', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,warp,gating,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H01 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/turing-warp-safety/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite: **[H01]** ([unit](/en/architecture/turing-warp-safety/)). Deliver a corrected pseudocode ordering proof and a dispatch ledger. These original paper Exercises need no GPU. Source review: **2026-09-22**, [SRC-CUDA-103](/en/sources-and-versions/#src-cuda-103). External behavior remains **Pending Hardware Verification**.

## Exercise 1: repair a repeated neighbor exchange

**Goal:** repair H01's two-round unsafe exchange. Fix one block at exactly 32 live threads, `input[32*r+i]=100*r+i`, `r=0,1`, and partner `i XOR 1`. Output is overwritten each round. Use integer storage and one shared slot per lane.

**Constraints:** no atomics, `volatile`, guessed lockstep, early return or CPU-side synchronization as a substitute for device synchronization. Preserve the operation and its 384 B global / 128 B shared footprint. Then analyze 31 logical elements with all 32 physical lanes still present.

**Acceptance:** show a legal delayed-producer interleaving that fails the original; show a second interleaving that still fails after adding only a publication barrier; name the participants in both repaired barriers. Derive final output lanes 0, 1, 30 and 31. For the 31-element case, state a complete boundary convention and why an in-branch `__activemask()` plus `__syncwarp` cannot initialize the missing partner. Name runtime and sanitizer evidence still absent.

<details><summary>Hint 1</summary>Follow both the read-after-write edge of round 0 and the write-after-read edge between rounds.</details>
<details><summary>Hint 2</summary>A fast lane can begin round 1 after its own read while its neighbor has not read round 0. For tails, a mask and a data-value convention answer different questions.</details>

## Exercise 2: reject the generation-name gate

**Goal:** review a proposal whose only host condition is “GPU name contains Turing.” The artifact contains only an `sm_80` cubin, requests hardware global-to-shared copy, and allocates 80 KiB shared memory per block. The actual selected device reports CC 7.5. No PTX is embedded.

**Constraints:** use H01's proposed C++17/Toolkit Lane and do not change the device. Do not claim a newer driver adds hardware features. No compilation or launch is performed.

**Acceptance:** identify three independent rejection reasons; replace the proposal with an ordinary-copy, 128 B shared-memory exchange and a compatible target; specify dtype, total problem memory, exact environment coordinates and explicit synchronization. Explain the separate purposes of a source compile-time gate, a runtime CC query and artifact inspection. Leave execution and performance observations empty.

<details><summary>Hint 1</summary>Check the executable image, copy feature and per-block storage separately.</details>
<details><summary>Hint 2</summary>Driver compatibility is not cubin backward compatibility. Reducing shared memory alone cannot make a CC 8.0 instruction available at 7.5.</details>

## Review separately

Open the [solutions](/en/architecture/turing-warp-safety/solutions/) after writing both proofs. Then tackle [PB-R7-001](/en/practice/#pb-r7-001), whose sparse membership differs from the full-warp fixture. The Exercises and hints are original CC BY 4.0; owner references retain their notices.
