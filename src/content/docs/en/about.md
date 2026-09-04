---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-09-04'
license: CC-BY-4.0
provenance: original
structure:
  - purpose
  - scope
  - author
  - feedback
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: about
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-09-04'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'purpose,scope,author,feedback'
---

<a class="locale-pair" data-locale-counterpart href="/about/" lang="zh-CN">阅读中文对应页</a>

## Why this Learning Site exists

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. It is optimized for the author's own systematic learning while giving other serious learners a route they can inspect and verify.

## Current scope

The site maintains a prerequisite-bearing Stable Curriculum alongside Runnable Examples, external Labs, Exercises, Visual Explainers, and a Glossary. Only complete material enters navigation. The website remains static, with no account, progress tracking, server application, API, or in-browser CUDA execution.

The R3 Stable Curriculum release completed its bilingual review in [issue #32](https://github.com/xiangzhang-coding/cuda-learning-site/issues/32), publishing O01-O08, F01-F08, M01-M19, A01-A14, and Q01-Q13 for 62 Learning Units. [A12](/en/algorithms/sparse-formats-spmv/) establishes COO and CSR, storage, and SpMV contracts. [A13](/en/algorithms/sparse-matrix-multiplication-preprocessing/) establishes SpMM, descriptor, workspace, and preprocessing decision boundaries.

The completed R3 aggregate release review is an immutable snapshot fixed at 232 Publication Pairs, 464 source routes, and 347 catalog records. It includes 61 Exercise sets, 61 separate reviewed-solution sets, and 10 Nsight report-analysis Practice Bank entries. R1 and R2 remain historical coordinates, and the R4 aggregate review remains pending.

Issue #31 adds `A12<-[M01,M02]` and `A13<-[A12,A08]` to the strict graph. [Issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33) adds [L01](/en/libraries/library-primitive-dsl-custom-kernel/)`<-[A02,A03,A08,Q06]` and [L02](/en/libraries/thrust-algorithm-vocabulary/)`<-[A01,A03,A09]` to the rolling R4 surface. L03-L13, LAB11/LAB12, and EX20 remain unpublished.

The rolling current public surface has 64 Learning Units, 16 Runnable Examples (EX01-EX16), 10 Labs (LAB01-LAB10), 19 formal Visual Explainers (standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22), 68 [Practice Bank](/en/practice/) entries, 182 [Glossary](/en/glossary/) terms, and 78 [source records](/en/sources-and-versions/), for 357 catalog records. Public source files form 238 Publication Pairs and 476 source routes, including 63 Exercise sets and 63 separate reviewed-solution sets.

Q06-Q13, A10-A14, and L01-L02 are Learning Units with all four evidence arrays empty and grant no Evidence Status. L01/L02 use original decision and vocabulary tables, display no owner source, and record no local API availability, build, runtime, synchronization, traffic, fusion, timing, speedup, or winner. The selected CCCL v3.4.2 coordinate is independent from Toolkit labels, applies only to 12.9.2/13.3.1 evaluation, and excludes 11.8. All 19 Visual Explainers remain evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-09-04**.
