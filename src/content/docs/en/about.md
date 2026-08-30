---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-08-30'
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
      content: '2026-08-30'
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

The Stable Curriculum completely publishes O01-O08, F01-F08, M01-M19, A01-A07, and Q01-Q05 in both languages, for 47 Learning Units. After A01-A04, the algorithms track adds [A05 Matrix Transpose](/en/algorithms/matrix-transpose-layout/), [A06 Stencil Neighborhoods and Halos](/en/algorithms/stencil-neighborhood-reuse/), and [A07 Direct 2D Convolution](/en/algorithms/convolution-reuse-layout/). O02-O08, F01-F08, M01-M19, A01-A07, and Q01-Q05 each have Exercises and separate reviewed solutions.

R1 remains the latest completed aggregate release review. The A01-A04, Q02, EX11-EX13, and VIS10 material from [Issue #21](https://github.com/xiangzhang-coding/cuda-learning-site/issues/21) remains current. [Issue #22](https://github.com/xiangzhang-coding/cuda-learning-site/issues/22) now adds A05-A07, EX14, VIS11, and their supporting material. This does not complete R2; the aggregate R2 release review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

The strict graph adds `A05<-[M02,M03,M04]`, `A06<-[M03,M04,M05]`, and `A07<-[A06,M03]` to the existing edges. The matching resource edges are `EX14<-A05` and `VIS11<-A05`. F08 remains related to LAB03 but is not a prerequisite. Q11 and LAB10 are unpublished and do not enter the graph.

The remaining public surface has exactly fifteen Runnable Examples, EX01-EX14 and [EX16](/en/examples/sanitizer-defect-suite/); EX15 has no public destination. [EX14 Tiled Transpose](/en/examples/tiled-transpose/) requires A05. The site has exactly six noncontiguous Labs, LAB01-LAB05 and LAB07; LAB06 remains absent, while Q11 and LAB10 also remain unpublished. Fifteen formal Visual Explainers comprise standalone VIS01-VIS11 plus embedded VIS19-VIS22; [VIS11 Tiled Transpose](/en/visuals/tiled-transpose/) requires A05. The current catalog has 6 Labs, 48 [Practice Bank](/en/practice/) entries, 15 Visual Explainers, 146 [Glossary](/en/glossary/) terms, and 59 [Sources and Version Record](/en/sources-and-versions/) entries, for 274 records total. Public source files form 178 Publication Pairs and 356 source routes.

M09-M19, A01-A07, and Q01-Q05 have empty compilation and runtime axes; static teaching, Exercises, source review, and Context7 cross-checks grant no CUDA Evidence Status. EX14 uses one original C++17 implementation across all three Toolkit Lanes, has empty compilation evidence, remains Pending Hardware Verification, and has no recorded observations. A host-reference pass establishes no GPU correctness. The site executes neither EX14 nor cuDNN and publishes no actual output, timing, speedup, or other performance number. All fifteen Visual Explainers are deterministic browser-only models with static or textual fallbacks and no CUDA Evidence Status; VIS11's static layouts are not bank, runtime, or performance observations.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-30**.
