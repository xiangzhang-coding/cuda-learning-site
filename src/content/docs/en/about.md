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

The Stable Curriculum completely publishes O01-O08, F01-F08, M01-M19, A01-A04, and Q01-Q05 in both languages, for 44 Learning Units. The memory track runs from [M01 Address Spaces, Ownership, Scope, and Lifetime](/en/memory/address-spaces/) through [M14 CUDA Graphs and Repeated Launch Structure](/en/memory/cuda-graphs/); the toolchain track publishes M15-M19; the algorithms track publishes [A01 Elementwise Map](/en/algorithms/elementwise-map/), [A02 Multi-Stage Reduction](/en/algorithms/multi-stage-reduction/), [A03 Inclusive and Exclusive Scan](/en/algorithms/inclusive-exclusive-scan/), and [A04 Privatized Histogram](/en/algorithms/privatized-histogram/); and the correctness track completely publishes [Q01 CPU References, Tolerances, and Invariants](/en/correctness/cpu-references-tolerances-invariants/), [Q02 Floating-point Order, Determinism, and Bitwise Reproducibility](/en/correctness/floating-point-order-reproducibility/), [Q03 Memcheck and Invalid Memory Access](/en/correctness/memcheck-invalid-memory-access/), [Q04 Diagnose with Racecheck, Initcheck, and Synccheck](/en/correctness/racecheck-initcheck-synccheck/), and [Q05 Time Asynchronous GPU Work Honestly](/en/correctness/timing-asynchronous-gpu-work/). O02-O08, F01-F08, M01-M19, A01-A04, and Q01-Q05 each have Exercises and separate reviewed solutions.

R1 remains the latest completed aggregate release review. The M09-M14, EX07-EX09, and VIS08 material scoped by [Issue #19](https://github.com/xiangzhang-coding/cuda-learning-site/issues/19), along with the existing M15-M19, EX10, and VIS09 material, remains in the current publication. [Issue #21](https://github.com/xiangzhang-coding/cuda-learning-site/issues/21) now adds A01-A04, Q02, EX11-EX13, VIS10, and their supporting learning material. This does not complete R2; the aggregate R2 release review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

The complete strict edges include `F05<-F04`, `F06<-[F02,O03]`, `F07<-[F04,F05]`, `F08<-[F02,F03,F06]`, `M01<-[F04,F06]`, `M02<-[M01,F03]`, `M03<-[M01,M02]`, `M04<-M03`, `M05<-[F02,M01]`, `M06<-[F02,M05]`, `M07<-[F05,M01]`, `M08<-M07`, `M09<-[M07,M08]`, `M10<-[M01,M02]`, `M11<-[M07,M08]`, `M12<-[M05,M06]`, `M13<-[M03,M05,M08]`, `M14<-[M07,M08]`, `M15<-[F04,O04]`, `M16<-[M15,F06]`, `M17<-[M16,F06]`, `M18<-[M15,M16]`, `M19<-[O04,M15]`, `A01<-[F03,F04,M02]`, `A02<-[M03,M05,M06]`, `A03<-[A02,M05]`, `A04<-[M03,M05]`, `Q01<-[F04,O04]`, `Q02<-[Q01,A02]`, `Q03<-[F05,Q01]`, `Q04<-[M05,M06,Q03]`, and `Q05<-[M08,Q01]`. Example, visual, and Lab edges include `EX04<-F05`, `EX05<-M02`, `EX06<-[M03,M04]`, `EX07<-[M07,M08,M09]`, `EX08<-M10`, `EX09<-M14`, `EX10<-[M15,M16]`, `EX11<-[A02,Q02]`, `EX12<-A03`, `EX13<-A04`, `EX16<-[Q03,Q04]`, `VIS08<-[M01,M02,M10]`, `VIS09<-[M15,M16,M17]`, `VIS10<-A02`, `LAB03<-[F03,F05]`, `LAB04<-[M02,Q05]`, `LAB05<-[M04,Q05]`, and `LAB07<-[Q03,Q04]`. F08 is related to LAB03 but is not a LAB03 prerequisite.

The remaining public surface has exactly fourteen Runnable Examples, EX01-EX13 and [EX16](/en/examples/sanitizer-defect-suite/); EX14 and EX15 have no public destinations. [EX11 Multi-Stage Reduction](/en/examples/multi-stage-reduction/) requires A02 and Q02, [EX12 Inclusive and Exclusive Scan](/en/examples/inclusive-exclusive-scan/) requires A03, and [EX13 Privatized Histogram](/en/examples/privatized-histogram/) requires A04. The site has exactly six noncontiguous Labs: [LAB01](/en/labs/record-cuda-environment/), [LAB02](/en/labs/vector-addition/), [LAB03](/en/labs/break-and-repair-indexing/), [LAB04](/en/labs/observe-coalescing/), [LAB05](/en/labs/remove-shared-memory-bank-conflicts/), and [LAB07](/en/labs/diagnose-four-sanitizer-failures/). LAB06 remains absent because its required timeline-profiler prerequisite is not public. Fourteen formal Visual Explainers comprise standalone VIS01-VIS10 plus embedded VIS19-VIS22; [VIS08 Managed-Memory Page Migration](/en/visuals/page-migration/) requires M01, M02, and M10, [VIS09 NVCC Artifact Pipeline](/en/visuals/artifact-pipeline/) requires M15, M16, and M17, and [VIS10 Reduction Tree and Inactive Lanes](/en/visuals/reduction-stages/) requires A02. The current catalog has 6 Labs, 45 [Practice Bank](/en/practice/) entries, 14 Visual Explainers, 139 [Glossary](/en/glossary/) terms, and 56 [Sources and Version Record](/en/sources-and-versions/) entries, for 260 records total. Public source files form 167 Publication Pairs and 334 source routes.

M09-M19, A01-A04, and Q01-Q05 have empty compilation and runtime axes; static teaching, Exercises, source review, and Context7 cross-checks grant no CUDA Evidence Status. EX01 has no Compile-Checked claim, and its runtime axis is Pending Hardware Verification. LAB01 likewise has no compilation claim, and its runtime axis is Pending Hardware Verification. EX02, EX10, and LAB02 retain Compile-Checked evidence. EX03-EX09 and EX11-EX13 each use one original C++17 implementation across Toolkit Lanes 11.8.0, 12.9.2, and 13.3.1; EX16 is one original Apache-2.0 C++17 project that builds eight isolated binaries across the same Lanes. EX05-EX09, EX11-EX13, EX16, LAB04, LAB05, and LAB07 have empty compilation evidence, Pending Hardware Verification runtime, empty recorded observations, and expected observations only. EX10's five ordinary records come from run 33275734951. It generates and inspects build artifacts but executes neither the final host artifact nor a GPU executable, so its runtime is explicitly Runtime-Not-Applicable. Its separate CUDA 13.3.1/NVCC 13.3.73/GCC 14.2.0 C++23 probe is a retained narrow pass and declares no ordinary C++23 support, other compiler or platform, runtime, or performance. A host-only utility cannot establish GPU correctness, overlap, migration, graph replay, scan, histogram, reduction runtime behavior, or performance. The website ran no EX03-EX13/EX16 CUDA binary, Compute Sanitizer tool, or profiler and publishes no sanitizer report, actual output, timing, speedup, or other performance number for them. All fourteen Visual Explainers are deterministic browser-only models with static or textual fallbacks; they execute no CUDA and have no CUDA Evidence Status. VIS09's host/device flow and artifact plan are original teaching, not compiler or artifact observations. VIS10's static stage diagram is a deterministic fallback, not a runtime or performance observation. F04's original static lifecycle table remains neither a Visual Explainer nor an evidence source.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). Page facts were reviewed on **2026-08-30**.
