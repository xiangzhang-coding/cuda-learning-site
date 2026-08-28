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

The Stable Curriculum completely publishes O01-O08, F01-F08, M01-M08, and the noncontiguous Q01/Q03-Q05 correctness-and-quality track in both languages. The memory track runs from [M01 Address Spaces, Ownership, Scope, and Lifetime](/en/memory/address-spaces/) through [M08 Events as Dependencies and Device-time Measurements](/en/memory/event-dependencies-timing/). The correctness track contains [Q01 CPU References, Tolerances, and Invariants](/en/correctness/cpu-references-tolerances-invariants/), [Q03 Memcheck and Invalid Memory Access](/en/correctness/memcheck-invalid-memory-access/), [Q04 Diagnose with Racecheck, Initcheck, and Synccheck](/en/correctness/racecheck-initcheck-synccheck/), and [Q05 Time Asynchronous GPU Work Honestly](/en/correctness/timing-asynchronous-gpu-work/). Q02 has no public page or navigation placeholder. O02-O08, F01-F08, M01-M08, and Q01/Q03-Q05 each have Exercises and separate reviewed solutions. The Q track links directly to [Q01 Exercises](/en/correctness/cpu-references-tolerances-invariants/exercises/) and [solutions](/en/correctness/cpu-references-tolerances-invariants/solutions/), [Q03 Exercises](/en/correctness/memcheck-invalid-memory-access/exercises/) and [solutions](/en/correctness/memcheck-invalid-memory-access/solutions/), [Q04 Exercises](/en/correctness/racecheck-initcheck-synccheck/exercises/) and [solutions](/en/correctness/racecheck-initcheck-synccheck/solutions/), and [Q05 Exercises](/en/correctness/timing-asynchronous-gpu-work/exercises/) and [solutions](/en/correctness/timing-asynchronous-gpu-work/solutions/).

The complete strict edges include `F05<-F04`, `F06<-[F02,O03]`, `F07<-[F04,F05]`, `F08<-[F02,F03,F06]`, `M01<-[F04,F06]`, `M02<-[M01,F03]`, `M03<-[M01,M02]`, `M04<-M03`, `M05<-[F02,M01]`, `M06<-[F02,M05]`, `M07<-[F05,M01]`, `M08<-M07`, `Q01<-[F04,O04]`, `Q03<-[F05,Q01]`, `Q04<-[M05,M06,Q03]`, and `Q05<-[M08,Q01]`. Example and Lab edges include `EX04<-F05`, `EX05<-M02`, `EX06<-[M03,M04]`, `EX16<-[Q03,Q04]`, `LAB03<-[F03,F05]`, `LAB04<-[M02,Q05]`, `LAB05<-[M04,Q05]`, and `LAB07<-[Q03,Q04]`. F08 is related to LAB03 but is not a LAB03 prerequisite.

The remaining public surface has exactly seven noncontiguous Runnable Examples, EX01-EX06 and [EX16](/en/examples/sanitizer-defect-suite/); EX07-EX15 have no public destinations. It has exactly six noncontiguous Labs: [LAB01](/en/labs/record-cuda-environment/), [LAB02](/en/labs/vector-addition/), [LAB03](/en/labs/break-and-repair-indexing/), [LAB04](/en/labs/observe-coalescing/), [LAB05](/en/labs/remove-shared-memory-bank-conflicts/), and [LAB07](/en/labs/diagnose-four-sanitizer-failures/); LAB06 has no public destination. Eleven formal Visual Explainers comprise standalone VIS01-VIS07 plus embedded VIS19-VIS22. The final catalog has 6 Labs, 29 [Practice Bank](/en/practice/) entries, 11 Visual Explainers, 95 [Glossary](/en/glossary/) terms, and 39 [Sources and Version Record](/en/sources-and-versions/) entries, for 180 records total. Public source files form 109 Publication Pairs and 218 source routes.

Q01/Q03-Q05 have empty compilation and runtime axes; static teaching, Exercises, source review, and Context7 cross-checks grant no CUDA Evidence Status. EX01 has no Compile-Checked claim, and its runtime axis is Pending Hardware Verification. LAB01 likewise has no compilation claim, and its runtime axis is Pending Hardware Verification. EX02 and LAB02 retain their existing status. EX03-EX06 each use one original C++17 implementation across Toolkit Lanes 11.8.0, 12.9.2, and 13.3.1; EX16 is one original Apache-2.0 C++17 project that builds eight isolated binaries across the same Lanes. EX05, EX06, EX16, LAB04, LAB05, and LAB07 have empty compilation evidence, Pending Hardware Verification runtime, empty recorded observations, and expected observations only. A host-only utility cannot establish GPU correctness or sanitizer behavior. The website ran no EX03-EX06/EX16 CUDA binary, Compute Sanitizer tool, or profiler and publishes no sanitizer report, actual output, timing, speedup, or other performance number for them. All eleven Visual Explainers are deterministic browser-only models with static or textual fallbacks; they execute no CUDA and have no CUDA Evidence Status. F04's original static lifecycle table remains neither a Visual Explainer nor an evidence source.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-28**.
