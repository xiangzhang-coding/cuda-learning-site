---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-08-26'
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
      content: '2026-08-26'
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

The O01-O08 orientation of the Stable Curriculum is completely published in both languages: [O01](/en/start/using-the-learning-site/), [O02](/en/start/evidence-status/), [O03](/en/start/environment-manifest/), [O04](/en/start/cpp17-for-cuda/), [O05](/en/start/linux-command-line/), [O06](/en/start/architecture-refresher/), [O07](/en/start/programmable-gpus/), and [O08](/en/start/reference-environment-candidate/). O02-O08 each have Exercises and separate reviewed solutions.

The remaining public surface contains foundational Learning Unit [F01](/en/foundations/first-cuda-kernel/) with Exercises and solutions; the [EX01 environment-report](/en/examples/environment-report/) and [EX02 vector-addition](/en/examples/vector-addition/) Runnable Examples; [LAB01 Record and Interpret a CUDA Environment](/en/labs/record-cuda-environment/) and [LAB02 Vector Addition](/en/labs/vector-addition/); [VIS01 Kernel Journey](/en/visuals/kernel-journey/); [VIS02 Indexing](/en/visuals/indexing/); a ten-entry [Practice Bank](/en/practice/); the [Glossary](/en/glossary/); and the [Sources and Version Record](/en/sources-and-versions/).

EX01 has no Compile-Checked claim, and its runtime axis is Pending Hardware Verification. LAB01 likewise has no compilation claim, and its runtime axis is Pending Hardware Verification. EX02 and LAB02 retain their existing Compile-Checked compilation status, while both runtime axes remain Pending Hardware Verification. The website ran no CUDA binary and declares no Reference Environment.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-26**.
