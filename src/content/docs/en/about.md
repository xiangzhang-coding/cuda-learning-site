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

After [issue #30](https://github.com/xiangzhang-coding/cuda-learning-site/issues/30), the current rolling Stable Curriculum publication completely publishes O01-O08, F01-F08, M01-M19, A01-A11/A14, and Q01-Q13 in both languages, for 60 Learning Units. [A10](/en/algorithms/numerically-stable-softmax/) establishes stable and online softmax; [A11](/en/algorithms/attention-as-an-io-problem/) treats attention as an IO problem; evidence-neutral [VIS18](/en/visuals/attention-memory-traffic/) connects sequence and tile shapes, stages, and static traffic.

The completed R2 aggregate review is an immutable snapshot fixed at 186 Publication Pairs, 372 source routes, and 284 catalog records. The current incremental publication has advanced to 226 Publication Pairs and 452 source routes without rewriting R2; the R3 aggregate review remains pending.

Issue #30 adds `A10<-[A02,M02,M03]`, `A11<-[A08,A10]`, and `VIS18<-[A11]` to the strict graph. Later framework, cuDNN, and Triton units remain unpublished; the current algorithm pages invent no backend availability.

The current public surface has 16 Runnable Examples (EX01-EX16), 10 Labs (LAB01-LAB10), 19 formal Visual Explainers (standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22), 64 [Practice Bank](/en/practice/) entries, 170 [Glossary](/en/glossary/) terms, and 74 [source records](/en/sources-and-versions/), for 337 catalog records. Current rolling public source files form 226 Publication Pairs and 452 source routes.

A10 and A11 are Learning Units with all four evidence arrays empty and grant no Evidence Status. Hand calculations, paper review, logical traffic formulas, and VIS18 browser state are static analysis. There is no GPU numerical output, actual traffic, backend or dtype observation, timing, speedup, or winner. All 19 Visual Explainers remain evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-09-03**.
