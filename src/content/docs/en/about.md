---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-09-02'
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
      content: '2026-09-02'
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

After [issue #27](https://github.com/xiangzhang-coding/cuda-learning-site/issues/27), the current rolling Stable Curriculum publication completely publishes O01-O08, F01-F08, M01-M19, A01-A09/A14, and Q01-Q11 in both languages, for 56 Learning Units. [Q11 Optimize the Canonical Transpose with Controlled Evidence](/en/correctness/transpose-optimization-case-study/) starts from immutable [EX14](/en/examples/tiled-transpose/) and reuses evidence-neutral [VIS11](/en/visuals/tiled-transpose/); [LAB10 Optimize the Canonical Transpose](/en/labs/optimize-canonical-transpose/) carries it into an external Lab.

The completed R2 aggregate review is an immutable snapshot fixed at 186 Publication Pairs, 372 source routes, and 284 catalog records. The current incremental publication has advanced to 213 Publication Pairs and 426 source routes without rewriting R2; the R3 aggregate review remains pending.

Issue #27 adds `Q11<-[A05,Q06,Q08,Q10]` and `LAB10<-[Q11]` to the strict graph. Q13, L06, and LAB12 remain unpublished; LAB12 waits for Q13 and L06.

The current public surface has 16 Runnable Examples (EX01-EX16), 10 Labs (LAB01-LAB10), 18 formal Visual Explainers (standalone VIS01-VIS14 plus embedded VIS19-VIS22), 58 [Practice Bank](/en/practice/) entries, 165 [Glossary](/en/glossary/) terms, and 70 [source records](/en/sources-and-versions/), for 321 catalog records. Current rolling public source files form 213 Publication Pairs and 426 source routes.

As a Learning Unit, Q11 has empty compilation, runtime, expected-observation, and recorded-observation arrays; it grants no Evidence Status and only summarizes linked subjects. Linked EX14 and LAB10 have empty compilation and recorded observations and remain Pending Hardware Verification; immutable EX14 source, VIS11, static or browser evidence, and the expected-only fixture do not change those boundaries. LAB10 declares a `4096x4096` `float` workload, a conservative 134,221,952-byte bound, one excluded warm-up, explicit synchronization, and a ten-attempt median plus min/max method, but no timing, metric, speedup, bottleneck, winner, Reference Environment, or `performanceObservations`. All 18 Visual Explainers remain evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-09-02**.
