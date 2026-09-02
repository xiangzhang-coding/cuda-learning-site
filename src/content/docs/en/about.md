---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-09-03'
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
      content: '2026-09-03'
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

After [issue #29](https://github.com/xiangzhang-coding/cuda-learning-site/issues/29), the current rolling Stable Curriculum publication completely publishes O01-O08, F01-F08, M01-M19, A01-A09/A14, and Q01-Q13 in both languages, for 58 Learning Units. [Q13 Optimize the Canonical GEMM with Controlled Evidence](/en/correctness/gemm-optimization-case-study/) starts from immutable [EX15](/en/examples/tiled-gemm/) and reuses evidence-neutral [VIS12](/en/visuals/gemm-tiling-hierarchy/). L03 and LAB11 remain unpublished.

The completed R2 aggregate review is an immutable snapshot fixed at 186 Publication Pairs, 372 source routes, and 284 catalog records. The current incremental publication has advanced to 219 Publication Pairs and 438 source routes without rewriting R2; the R3 aggregate review remains pending.

Issue #29 adds `Q13<-[A08,Q06,Q08,Q10]` to the strict graph. L03 and LAB11 remain unpublished. L06 and LAB12 also remain unpublished. Q13 now supplies LAB12's profiling prerequisite, but LAB12 still waits for L06.

The current public surface has 16 Runnable Examples (EX01-EX16), 10 Labs (LAB01-LAB10), 18 formal Visual Explainers (standalone VIS01-VIS14 plus embedded VIS19-VIS22), 62 [Practice Bank](/en/practice/) entries, 165 [Glossary](/en/glossary/) terms, and 72 [source records](/en/sources-and-versions/), for 327 catalog records. Current rolling public source files form 219 Publication Pairs and 438 source routes.

Q11-Q13 are Learning Units with all four evidence arrays empty and grant no Evidence Status. Linked EX11, EX14, EX15, and LAB10 retain empty compilation and recorded observations and Pending Hardware Verification runtime. Immutable source, VIS10-VIS12, static runner gates, and expected-only fixtures change no boundary. Q13 matrix, precision, workload, warm-up, synchronization, statistics, resource and occupancy, and profiler fields are an expected plan only; there is no numerical output, timing, metric, register, occupancy, or traffic observation, speedup, winner, cuBLAS or Tensor Core result, Reference Environment, or `performanceObservations`. All 18 Visual Explainers remain evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-09-03**.
