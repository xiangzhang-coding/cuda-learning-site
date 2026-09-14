---
title: 'T04 Solutions: Masks and Stored-Value References'
description: Review ownership and numerical derivations without inventing runtime evidence.
pairId: t04-solutions
counterpart: /triton/blocked-matrix-multiplication/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice, next]
resourceKind: solution-set
unitId: T04-SOLUTIONS
prerequisites: [T04-EXERCISES]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton dot and masks', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/blocked-matrix-multiplication/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/blocked-matrix-multiplication/solutions/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Exact prerequisite **[T04-EXERCISES]**: attempt the [Exercises](/en/triton/blocked-matrix-multiplication/exercises/) first. These are derivations, not recorded GPU observations. Source date: 2026-09-14; [SRC-CUDA-089](/en/sources-and-versions/#src-cuda-089).

## Solution 1: rectangular ownership

Grid `(3,2)` gives six programs. The last `(pm,pn)=(2,1)` begins at row 64, column 64, so only row 64 and columns 64–96 are valid: 33 outputs. Two K iterations cover 0–31 and 32–63; coordinate 63 is invalid. A uses `row*K+inner`, B `inner*N+column`, C `row*N+column`. A's row/inner mask and B's inner/column mask zero-fill invalid products; C's row/column mask prevents writes. Keep the FP32 accumulator across both iterations, then cast once to FP16. [T04](/en/triton/blocked-matrix-multiplication/) renders the exact reviewed Lab kernel without a second executable copy.

## Solution 2: independent precision checks

The exact product is `[[-10,9],[14,-6]]`. For example, its top-left entry is `1*2 + (-2)*3 + 3*(-2) = -10`. The scalar oracle catches shared native/candidate defects because neither implementation defines the expected result. Compare finite outputs to double products of stored FP16 inputs, with the declared mixed tolerance. Equal NaNs must fail. FP32 accumulation improves the middle stage only; input and final FP16 rounding remain. A tail sentinel detects some output writes, not invalid input loads or every possible write.

## Practice Bank review

For [PB-R5-017](/en/practice/#pb-r5-017), K=33 and BK=32 require two iterations. The second has only inner coordinate 32 valid; 33–63 must be zero-filled on **both** operands. M=N=32 having no output tail does not remove the K tail. A passing K=32 fixture cannot establish this behavior; require the fixed nonmultiple-K cases and complete oracle checks. No host derivation grants runtime status.

## Continue

Use [LAB16](/en/labs/autotune-triton-gemm/) for verification, then [T05](/en/triton/autotuning/) for measurement. Original solutions use CC BY 4.0. Keep Pending Hardware Verification until qualifying hardware evidence exists.
