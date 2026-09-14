---
title: 'T02 Reviewed Solutions'
description: Review safe masking repairs, sentinel-based missed-store detection and evidence limits.
pairId: t02-solutions
counterpart: /triton/masked-vector-addition/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, practice-bank, sources]
resourceKind: solution-set
unitId: T02-SOLUTIONS
prerequisites: [T02-EXERCISES]
relatedUnits: [T02]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton masked memory semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper solution', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/masked-vector-addition/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,practice-bank,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: T02 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/masked-vector-addition/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review after attempting

Exact prerequisite `[T02-EXERCISES]`: complete the [Exercises](/en/triton/masked-vector-addition/exercises/) first. These reviewed logical answers grant no compilation or runtime evidence.

## Solution 1: guard memory at the operation

Three programs cover 384 positions. Program 2 constructs 256–383: only 256–258 are valid and 259–383 are masked, giving 125 invalid positions. The first unmasked load and the unmasked store violate the memory contract. Both input loads need `mask=i<N` with `other=0.0`; the store independently needs `mask=i<N`. A masked store does not repair an unsafe load.

`where` evaluates both value arguments. By the time it selects zero, the unmasked load has already been expressed as a memory operation. Use the corrected canonical pattern in [T02](/en/triton/masked-vector-addition/) and keep input pointers, mask and values at compatible block shapes. The output guard is a detection tool, not extra logical output.

## Solution 2: make an unwritten value inadmissible

Initialize valid output and tail guard to NaN. Use lengths 256 and 257; for the zero-last-sum case choose binary-exact opposite last inputs, such as 0.5 and −0.5. Synchronize, copy to CPU, reject nonfinite valid outputs, then compare all values against the independent CPU reference. The mutation leaves the last valid output NaN and must fail even though its expected value is zero.

Check tail guards separately for writes beyond `N`. An unchanged guard does not prove every valid output was written or every load was in bounds. A CPU simulation can test the oracle and planned indexing, but only a qualifying GPU run can test the compiled kernel. Do not convert simulation success into Runtime-Verified status.

## Practice Bank review

<a id="pb-r5-014-solution"></a>
For [PB-R5-014](/en/practice/#pb-r5-014), checking only the first 128 values of `N=1003` never reaches the last program. An unchanged output guard alone cannot detect missing valid stores, and an EX02 compiler report concerns a different subject. Request all-output finite comparison, exact EX23 source/environment identity, synchronization, actual run logs and reviewed evidence. Keep EX23 Pending Hardware Verification in the absence of qualifying execution; do not invent a performance comparison.

## Sources and return

Return to [T02](/en/triton/masked-vector-addition/). [SRC-CUDA-087](/en/sources-and-versions/#src-cuda-087) grounds masking and evaluation semantics, reviewed 2026-09-14. Original solutions: CC BY 4.0.
