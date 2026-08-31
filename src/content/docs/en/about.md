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

After [issue #25](https://github.com/xiangzhang-coding/cuda-learning-site/issues/25), the current rolling Stable Curriculum publication completely publishes O01-O08, F01-F08, M01-M19, A01-A09, and Q01-Q08 in both languages, for 52 Learning Units. [Q06 Use APOD as an Optimization Loop](/en/correctness/apod-optimization-loop/), [Q07 Read the Application Timeline First with Nsight Systems](/en/correctness/timeline-first-nsight-systems/), and [Q08 Ask One Selected Kernel Question with Nsight Compute](/en/correctness/kernel-first-nsight-compute/) are directly available. Existing [A08 Tiled GEMM](/en/algorithms/tiled-gemm-correctness/) and [A09 Sorting, Selection, and Compaction](/en/algorithms/sorting-selection-compaction/) remain published. A01-A09 and Q01-Q08 all have Exercises and separate solutions.

The completed R2 aggregate review is an immutable snapshot fixed at 186 Publication Pairs and 372 source routes. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) retains its dynamic acceptance record for protected `main`, Preview, production, and remote smoke. The current incremental publication has advanced to 198 Publication Pairs and 396 source routes without rewriting R2; the R3 aggregate review remains pending.

The strict graph retains `A08<-[A05,M03,M04,A02]`, `A09<-[A03,A04]`, `EX15<-A08`, and `VIS12<-A08`, then adds [Q06](/en/correctness/apod-optimization-loop/)`<-[Q05]`, [Q07](/en/correctness/timeline-first-nsight-systems/)`<-[M07,M09,Q05]`, [Q08](/en/correctness/kernel-first-nsight-compute/)`<-[Q07,M02,M03]`, [LAB06](/en/labs/build-overlapped-pipeline/)`<-[M09,Q07]`, [LAB08](/en/labs/profile-full-application-before-kernel/)`<-[Q07,Q08]`, and [VIS14](/en/visuals/nsight-systems-versus-nsight-compute/)`<-[Q07,Q08]`. Future Q11 and LAB10 are unpublished, with LAB10 waiting for Q11. Q13, L06, and LAB12 are also unpublished, with LAB12 waiting for Q13 and L06.

The current public surface has 16 Runnable Examples (EX01-EX16), 8 Labs (LAB01-LAB08), 17 formal Visual Explainers (standalone VIS01-VIS12 and VIS14, plus embedded VIS19-VIS22), 53 [Practice Bank](/en/practice/) entries, 159 [Glossary](/en/glossary/) terms, and 65 [source records](/en/sources-and-versions/), for 302 catalog records. Current rolling public source files form 198 Publication Pairs and 396 source routes.

A01-A09, Q01-Q08, and VIS14 have empty compilation and runtime axes. EX15 uses one original C++17 FP32 implementation across three Toolkit Lanes, has empty compilation evidence, and remains Pending Hardware Verification. A host-reference pass establishes no GPU correctness. LAB06 and LAB08 have empty compilation evidence, Pending Hardware Verification runtime, and empty recorded observations. The site executes no EX15, CUB, Thrust, or issue #25 profiler Lab. This increment publishes no runtime, profiler, timeline, metric, bottleneck, timing, speedup, or production-winner observation. All 17 Visual Explainers are evidence-neutral browser models.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-31**.
