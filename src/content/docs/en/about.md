---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-09-01'
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
      content: '2026-09-01'
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

After [issue #26](https://github.com/xiangzhang-coding/cuda-learning-site/issues/26), the current rolling Stable Curriculum publication completely publishes O01-O08, F01-F08, M01-M19, A01-A09/A14, and Q01-Q10 in both languages, for 55 Learning Units. [A14 Arithmetic-Intensity Algorithm Choice](/en/algorithms/algorithm-choice-arithmetic-intensity/), [Q09 Occupancy, Stalls, and Throughput](/en/correctness/occupancy-stalls-throughput/), and [Q10 Roofline](/en/correctness/roofline-arithmetic-intensity/) all have Exercises and separate solutions.

The completed R2 aggregate review is an immutable snapshot fixed at 186 Publication Pairs, 372 source routes, and 284 catalog records. The current incremental publication has advanced to 209 Publication Pairs and 418 source routes without rewriting R2; the R3 aggregate review remains pending.

The strict graph adds `A14<-[A01,A02,A05,A08]`, `Q09<-[Q08,F08]`, `Q10<-[Q05,A14]`, `LAB09<-[Q10]`, and `VIS13<-[Q10]`. Future Q11/LAB10 and Q13/L06/LAB12 remain unpublished.

The current public surface has 16 Runnable Examples (EX01-EX16), 9 Labs (LAB01-LAB09), 18 formal Visual Explainers (standalone VIS01-VIS14 plus embedded VIS19-VIS22), 56 [Practice Bank](/en/practice/) entries, 165 [Glossary](/en/glossary/) terms, and 68 [source records](/en/sources-and-versions/), for 316 catalog records. Current rolling public source files form 209 Publication Pairs and 418 source routes.

A14, Q09-Q10, and VIS13 have empty compilation and runtime axes. LAB09 has empty compilation evidence and recorded observations and Pending Hardware Verification runtime; there is no Reference Environment or `performanceObservations` entry. VIS13 browser values and its static chart are not GPU evidence. The site has not executed issue #26 LAB09 and publishes no metric, hardware ceiling, Roofline point, timing, bottleneck, speedup, or production-winner observation. All 18 Visual Explainers are evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-09-01**.
