---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-08-28'
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
      content: '2026-08-28'
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

The Stable Curriculum completely publishes O01-O08, F01-F08, and M01-M08 in both languages. The memory track includes [M01 Address Spaces, Ownership, Scope, and Lifetime](/en/memory/address-spaces/), [M02 Coalescing as Transaction Shaping](/en/memory/coalescing-transactions/), [M03 Shared-memory Tiling](/en/memory/shared-memory-tiling/), [M04 Bank Conflicts and Layout Transforms](/en/memory/bank-conflicts-layouts/), [M05 Synchronization Scopes and Memory Visibility](/en/memory/synchronization-scopes/), [M06 Divergence, Reconvergence, and Warp-safe Reasoning](/en/memory/warp-divergence-reconvergence/), [M07 Streams Replace a Global-order Mental Model](/en/memory/stream-ordering/), and [M08 Events as Dependencies and Device-time Measurements](/en/memory/event-dependencies-timing/). O02-O08, F01-F08, and M01-M08 each have Exercises and separate reviewed solutions. M05-M08 link directly to [M05 Exercises](/en/memory/synchronization-scopes/exercises/) and [solutions](/en/memory/synchronization-scopes/solutions/), [M06 Exercises](/en/memory/warp-divergence-reconvergence/exercises/) and [solutions](/en/memory/warp-divergence-reconvergence/solutions/), [M07 Exercises](/en/memory/stream-ordering/exercises/) and [solutions](/en/memory/stream-ordering/solutions/), and [M08 Exercises](/en/memory/event-dependencies-timing/exercises/) and [solutions](/en/memory/event-dependencies-timing/solutions/).

The complete strict edges include `F05<-F04`, `F06<-[F02,O03]`, `F07<-[F04,F05]`, `F08<-[F02,F03,F06]`, `M01<-[F04,F06]`, `M02<-[M01,F03]`, `M03<-[M01,M02]`, `M04<-M03`, `M05<-[F02,M01]`, `M06<-[F02,M05]`, `M07<-[F05,M01]`, and `M08<-M07`; `EX04<-F05`, `EX05<-M02`, `EX06<-[M03,M04]`, and `LAB03<-[F03,F05]` remain unchanged. F08 is related to LAB03 but is not a LAB03 prerequisite.

The remaining public surface has exactly six Runnable Examples, EX01-EX06, with no EX07, and exactly three Labs: [LAB01](/en/labs/record-cuda-environment/), [LAB02](/en/labs/vector-addition/), and [LAB03](/en/labs/break-and-repair-indexing/). Eleven formal Visual Explainers comprise seven standalone pages, [VIS01](/en/visuals/kernel-journey/), [VIS02](/en/visuals/indexing/), [VIS03](/en/visuals/warp-divergence/), [VIS04](/en/visuals/memory-transactions/), [VIS05](/en/visuals/shared-memory-banks/), [VIS06](/en/visuals/memory-hierarchy-lifetime/), and [VIS07](/en/visuals/stream-event-dependencies/), plus embedded VIS19-VIS22. The final catalog has 3 Labs, 25 [Practice Bank](/en/practice/) entries, 11 Visual Explainers, 86 [Glossary](/en/glossary/) terms, and 36 [Sources and Version Record](/en/sources-and-versions/) entries, for 161 total. Public source files form 93 Publication Pairs and 186 source routes.

EX01 has no Compile-Checked claim, and its runtime axis is Pending Hardware Verification. LAB01 likewise has no compilation claim, and its runtime axis is Pending Hardware Verification. EX02 and LAB02 retain their existing Compile-Checked status, while both runtime axes remain Pending Hardware Verification. EX03-EX06 each use one original C++17 implementation across Toolkit Lanes 11.8.0, 12.9.2, and 13.3.1. EX05 and EX06 have no qualifying retained compile records, so compilation evidence is empty; runtime is Pending Hardware Verification, recorded observations are empty, and only expected observations are published. The website ran no EX03-EX06 CUDA binary and publishes no actual output, timing, speedup, or other performance number for them. All eleven Visual Explainers are deterministic browser-only models with static or textual fallbacks; they execute no CUDA and have no CUDA Evidence Status. F04's original static lifecycle table remains neither a Visual Explainer nor an evidence source.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-28**.
