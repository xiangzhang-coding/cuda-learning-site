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

The O01-O08 orientation of the Stable Curriculum is completely published in both languages: [O01](/en/start/using-the-learning-site/), [O02](/en/start/evidence-status/), [O03](/en/start/environment-manifest/), [O04](/en/start/cpp17-for-cuda/), [O05](/en/start/linux-command-line/), [O06](/en/start/architecture-refresher/), [O07](/en/start/programmable-gpus/), and [O08](/en/start/reference-environment-candidate/). The Stable Curriculum also includes [F01 First CUDA Kernel](/en/foundations/first-cuda-kernel/), [F02 CUDA Execution Hierarchy](/en/foundations/execution-hierarchy/), [F03 Multidimensional Indexing](/en/foundations/multidimensional-indexing/), [F04 Host-Device Lifecycle](/en/foundations/host-device-lifecycle/), [F05 Asynchronous Errors](/en/foundations/asynchronous-errors/), [F06 Compute Capability](/en/foundations/compute-capability/), [F07 Runtime/Driver API Boundary](/en/foundations/runtime-driver-api/), and [F08 Launch Geometry](/en/foundations/launch-geometry/). O02-O08 and F01-F08 each have Exercises and separate reviewed solutions.

The added strict prerequisite edges are F05 from F04; F06 from F02 and O03; F07 from F04 and F05; F08 from F02, F03, and F06; [EX04](/en/examples/error-handling-lifecycle/) from F05; and [LAB03](/en/labs/break-and-repair-indexing/) from F03 and F05. F08 is related to LAB03 but is not a LAB03 prerequisite.

The remaining public surface contains the [EX01 environment-report](/en/examples/environment-report/), [EX02 vector-addition](/en/examples/vector-addition/), [EX03 multidimensional-indexing](/en/examples/multidimensional-indexing/), and [EX04 error-handling-lifecycle](/en/examples/error-handling-lifecycle/) Runnable Examples; [LAB01 Record and Interpret a CUDA Environment](/en/labs/record-cuda-environment/), [LAB02 Vector Addition](/en/labs/vector-addition/), and [LAB03 Break and Repair Indexing](/en/labs/break-and-repair-indexing/); only the two formal Visual Explainer routes, [VIS01 Kernel Journey](/en/visuals/kernel-journey/) and [VIS02 Indexing](/en/visuals/indexing/); a seventeen-entry [Practice Bank](/en/practice/); 65 [Glossary](/en/glossary/) terms; and 31 [Sources and Version Record](/en/sources-and-versions/) entries. Navigation exposes no unfinished Learning Unit.

EX01 has no Compile-Checked claim, and its runtime axis is Pending Hardware Verification. LAB01 likewise has no compilation claim, and its runtime axis is Pending Hardware Verification. EX02 and LAB02 retain their existing Compile-Checked compilation status, while both runtime axes remain Pending Hardware Verification. EX03 retains its existing status: the same original C++17 source across Toolkit Lanes 11.8.0, 12.9.2, and 13.3.1, empty compilation evidence, and Pending Hardware Verification runtime. EX04 and LAB03 also each have empty compilation evidence and Pending Hardware Verification runtime. The website ran no EX03 or EX04 CUDA binary and publishes no actual output, error code, or performance number for either subject. F02-F04 reuse VIS01/VIS02. F05's error timeline, F06's capability filter, F07's API boundary, and F08's block-shape explorer are four original embedded teaching surfaces, not standalone Visual Explainers or new VIS routes. They provide static or textual fallbacks, execute no CUDA, and create no evidence. F04's original static lifecycle table is likewise neither a Visual Explainer nor an evidence source.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-26**.
