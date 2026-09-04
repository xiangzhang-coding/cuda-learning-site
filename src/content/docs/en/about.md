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

Issue #31 adds `A12<-[M01,M02]` and `A13<-[A12,A08]` to the strict graph. L13 and EX20 remain unpublished. The current algorithm pages invent no Generic API code, workspace cost, determinism, structured-sparsity support, or performance result.

The R3 public surface has 16 Runnable Examples (EX01-EX16), 10 Labs (LAB01-LAB10), 19 formal Visual Explainers (standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22), 66 [Practice Bank](/en/practice/) entries, 176 [Glossary](/en/glossary/) terms, and 76 [source records](/en/sources-and-versions/), for 347 catalog records. Public source files form 232 Publication Pairs and 464 source routes.

Q06-Q13 and A10-A14 are Learning Units with all four evidence arrays empty and grant no Evidence Status. The five profiler fixtures are expected-only plans with unfilled Environment Manifests and empty recorded observations, not captured reports. Matrices, storage and contribution ledgers, owner review, and the shared static composition are host arithmetic or static analysis. There is no CUDA or cuSPARSE execution, workspace, preprocessing, determinism or structured-sparsity observation, actual traffic, timing, speedup, or winner. All 19 Visual Explainers remain evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-09-04**.
