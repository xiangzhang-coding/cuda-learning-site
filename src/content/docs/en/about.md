---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-08-31'
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
      content: '2026-08-31'
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

The Stable Curriculum completely publishes O01-O08, F01-F08, M01-M19, A01-A09, and Q01-Q05 in both languages, for 49 Learning Units. New [A08 Tiled GEMM](/en/algorithms/tiled-gemm-correctness/) and [A09 Sorting, Selection, and Compaction](/en/algorithms/sorting-selection-compaction/) join the algorithm track. A01-A09 all have Exercises and separate solutions.

R2 is the latest completed aggregate review. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) retains the dynamic acceptance record for protected `main`, Preview, production, and remote smoke. R3 and later material is outside R2.

The strict graph adds `A08<-[A05,M03,M04,A02]`, `A09<-[A03,A04]`, `EX15<-A08`, and `VIS12<-A08`. Q13, L06, and LAB12 are unpublished; LAB12 waits for both prerequisites.

The public surface has 16 Runnable Examples (EX01-EX16), 6 noncontiguous Labs, 16 formal Visual Explainers (standalone VIS01-VIS12 plus embedded VIS19-VIS22), 50 [Practice Bank](/en/practice/) entries, 151 [Glossary](/en/glossary/) terms, and 61 [source records](/en/sources-and-versions/), for 284 catalog records. Public source files form 186 Publication Pairs and 372 source routes.

A01-A09 and Q01-Q05 have empty compilation and runtime axes. EX15 uses one original C++17 FP32 implementation across three Toolkit Lanes, has empty compilation evidence, and remains Pending Hardware Verification. A host-reference pass establishes no GPU correctness. The site executes no EX15, CUB, or Thrust and publishes no output, timing, speedup, or production winner. All 16 Visual Explainers are evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-31**.
