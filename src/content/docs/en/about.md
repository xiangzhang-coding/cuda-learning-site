---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-08-27'
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
      content: '2026-08-27'
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

The O01-O08 orientation of the Stable Curriculum is completely published in both languages: [O01](/en/start/using-the-learning-site/), [O02](/en/start/evidence-status/), [O03](/en/start/environment-manifest/), [O04](/en/start/cpp17-for-cuda/), [O05](/en/start/linux-command-line/), [O06](/en/start/architecture-refresher/), [O07](/en/start/programmable-gpus/), and [O08](/en/start/reference-environment-candidate/). The Stable Curriculum also includes [F01 First CUDA Kernel](/en/foundations/first-cuda-kernel/), [F02 CUDA Execution Hierarchy](/en/foundations/execution-hierarchy/), [F03 Multidimensional Indexing](/en/foundations/multidimensional-indexing/), [F04 Host-Device Lifecycle](/en/foundations/host-device-lifecycle/), [F05 Asynchronous Errors](/en/foundations/asynchronous-errors/), [F06 Compute Capability](/en/foundations/compute-capability/), [F07 Runtime/Driver API Boundary](/en/foundations/runtime-driver-api/), and [F08 Launch Geometry](/en/foundations/launch-geometry/), followed by [M01 Address Spaces, Ownership, Scope, and Lifetime](/en/memory/address-spaces/), [M02 Coalescing as Transaction Shaping](/en/memory/coalescing-transactions/), [M03 Shared-memory Tiling](/en/memory/shared-memory-tiling/), and [M04 Bank Conflicts and Layout Transforms](/en/memory/bank-conflicts-layouts/). O02-O08, F01-F08, and M01-M04 each have Exercises and separate reviewed solutions. The memory track links directly to [M01 Exercises](/en/memory/address-spaces/exercises/) and [solutions](/en/memory/address-spaces/solutions/), [M02 Exercises](/en/memory/coalescing-transactions/exercises/) and [solutions](/en/memory/coalescing-transactions/solutions/), [M03 Exercises](/en/memory/shared-memory-tiling/exercises/) and [solutions](/en/memory/shared-memory-tiling/solutions/), and [M04 Exercises](/en/memory/bank-conflicts-layouts/exercises/) and [solutions](/en/memory/bank-conflicts-layouts/solutions/).

The added strict prerequisite edges are F05 from F04; F06 from F02 and O03; F07 from F04 and F05; F08 from F02, F03, and F06; M01 from F04 and F06; M02 from M01 and F03; M03 from M01 and M02; M04 from M03; [EX04](/en/examples/error-handling-lifecycle/) from F05; [EX05](/en/examples/coalesced-strided-access/) from M02; [EX06](/en/examples/shared-memory-tile-bank-padding/) from M03 and M04; and [LAB03](/en/labs/break-and-repair-indexing/) from F03 and F05. F08 is related to LAB03 but is not a LAB03 prerequisite.

The remaining public surface contains the [EX01 environment-report](/en/examples/environment-report/), [EX02 vector-addition](/en/examples/vector-addition/), [EX03 multidimensional-indexing](/en/examples/multidimensional-indexing/), [EX04 error-handling-lifecycle](/en/examples/error-handling-lifecycle/), [EX05 coalesced-and-strided-access](/en/examples/coalesced-strided-access/), and [EX06 shared-memory-tile-bank-padding](/en/examples/shared-memory-tile-bank-padding/) Runnable Examples; exactly three Labs, [LAB01 Record and Interpret a CUDA Environment](/en/labs/record-cuda-environment/), [LAB02 Vector Addition](/en/labs/vector-addition/), and [LAB03 Break and Repair Indexing](/en/labs/break-and-repair-indexing/); nine formal Visual Explainers, comprising standalone [VIS01 Kernel Journey](/en/visuals/kernel-journey/), [VIS02 Indexing](/en/visuals/indexing/), [VIS04 Memory-request Segment Grouping](/en/visuals/memory-transactions/), [VIS05 Shared-memory Bank Mapping](/en/visuals/shared-memory-banks/), and [VIS06 Memory Hierarchy, Ownership, and Lifetime](/en/visuals/memory-hierarchy-lifetime/) plus embedded [VIS19 Error-Surfacing Timeline](/en/foundations/asynchronous-errors/#vis19), [VIS20 Compute-Capability Contract Filter](/en/foundations/compute-capability/#vis20), [VIS21 Runtime/Driver API Boundary](/en/foundations/runtime-driver-api/#vis21), and [VIS22 Block-Shape Constraint Explorer](/en/foundations/launch-geometry/#vis22); a 21-entry [Practice Bank](/en/practice/); 76 [Glossary](/en/glossary/) terms; and 34 [Sources and Version Record](/en/sources-and-versions/) entries. Navigation creates no four duplicate standalone pages for the embedded explainers and exposes no unfinished Learning Unit.

EX01 has no Compile-Checked claim, and its runtime axis is Pending Hardware Verification. LAB01 likewise has no compilation claim, and its runtime axis is Pending Hardware Verification. EX02 and LAB02 retain their existing Compile-Checked status, while both runtime axes remain Pending Hardware Verification. EX03-EX06 each use one original C++17 implementation across Toolkit Lanes 11.8.0, 12.9.2, and 13.3.1. EX05 and EX06 have no qualifying retained compile records, so compilation evidence is empty; runtime is Pending Hardware Verification, recorded observations are empty, and only expected observations are published. The website ran no EX03-EX06 CUDA binary and publishes no actual output, timing, speedup, or other performance number for them. All nine Visual Explainers are deterministic browser-only models with static or textual fallbacks; they execute no CUDA and have no CUDA Evidence Status. F04's original static lifecycle table remains neither a Visual Explainer nor an evidence source.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-27**.
