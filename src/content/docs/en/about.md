---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-09-07'
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
      content: '2026-09-07'
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

The R3 Stable Curriculum release completed its bilingual review in [issue #32](https://github.com/xiangzhang-coding/cuda-learning-site/issues/32), publishing O01-O08, F01-F08, M01-M19, A01-A14, and Q01-Q13 for 62 Learning Units. [A12](/en/algorithms/sparse-formats-spmv/) establishes COO and CSR, storage, and SpMV contracts. [A13](/en/algorithms/sparse-matrix-multiplication-preprocessing/) establishes SpMM, descriptor, workspace, and preprocessing decision boundaries.

The completed R3 aggregate release review is an immutable snapshot fixed at 232 Publication Pairs, 464 source routes, and 347 catalog records. It includes 61 Exercise sets, 61 separate reviewed-solution sets, and 10 Nsight report-analysis Practice Bank entries. R1 and R2 remain historical coordinates, and the R4 aggregate review remains pending.

Issue #31 adds `A12<-[M01,M02]` and `A13<-[A12,A08]` to the strict graph. [Issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33) adds [L01](/en/libraries/library-primitive-dsl-custom-kernel/) and [L02](/en/libraries/thrust-algorithm-vocabulary/) to the rolling R4 publication. [Issue #34](https://github.com/xiangzhang-coding/cuda-learning-site/issues/34) publishes [L03: CUB Device Primitives](/en/libraries/cub-device-primitives/), [L04: CUB Warp and Block Primitives](/en/libraries/cub-warp-block-primitives/), [EX17: CUB Device Reduction and Scan](/en/examples/cub-device-reduction-scan/), and [LAB11: Compare a Custom Reduction with CUB](/en/labs/compare-custom-reduction-with-cub/), followed by [L05: libcu++ Synchronization Abstractions](/en/libraries/libcu-plus-plus-synchronization/) with strict prerequisites M05, M13, and M19. [Issue #36](https://github.com/xiangzhang-coding/cuda-learning-site/issues/36) adds [L06: cuBLAS GEMM](/en/libraries/cublas-gemm/)`<-[A08,Q01]`, [L07: cuBLASLt Matmul](/en/libraries/cublaslt-matmul/)`<-[L06,Q05]`, [EX18](/en/examples/cublas-gemm/)`<-[L06]`, and [LAB12](/en/labs/compare-gemm-with-cublas/)`<-[Q13,L06]`.

[Issue #37](https://github.com/xiangzhang-coding/cuda-learning-site/issues/37) adds [L08: Tensor Core Precision and Architecture Contracts](/en/libraries/tensor-core-precision-contracts/)`<-[Q02,L06,F06]` and [L09: CUTLASS C++ GEMM Structure](/en/libraries/cutlass-cpp-gemm-structure/)`<-[A08,L06,M17]`, each with exactly those ordered direct prerequisites. [L08 Exercises](/en/libraries/tensor-core-precision-contracts/exercises/) and [separate solutions](/en/libraries/tensor-core-precision-contracts/solutions/), plus [L09 Exercises](/en/libraries/cutlass-cpp-gemm-structure/exercises/) and [separate solutions](/en/libraries/cutlass-cpp-gemm-structure/solutions/), are directly available.

[Issue #38](https://github.com/xiangzhang-coding/cuda-learning-site/issues/38) adds [L10: cuDNN Graphs and Plans](/en/libraries/cudnn-graphs-and-plans/)`<-[A07,L01,Q05]` and [L11: Attention Backend Dispatch](/en/libraries/attention-backend-dispatch/)`<-[A11,L10,L08]`, related to L11 and VIS18 respectively, without changing older prerequisites. [L10 Exercises](/en/libraries/cudnn-graphs-and-plans/exercises/) and [separate solutions](/en/libraries/cudnn-graphs-and-plans/solutions/), plus [L11 Exercises](/en/libraries/attention-backend-dispatch/exercises/) and [separate solutions](/en/libraries/attention-backend-dispatch/solutions/), publish together. L12-L13 remain pending.

The rolling current publication has 73 Learning Units, 18 Runnable Examples (EX01-EX18), 12 Labs (LAB01-LAB12), 19 formal Visual Explainers (standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22), 78 [Practice Bank](/en/practice/) entries, 192 [Glossary](/en/glossary/) terms, and 88 [source records](/en/sources-and-versions/), for 389 catalog records. Public source files form 269 Publication Pairs and 538 source routes, including 72 Exercise sets and 72 separate reviewed-solution sets.

**Publication inventory and navigation updated: 2026-09-07.** The page date covers only this inventory update, not a new review of existing CUDA API facts; technical sources retain their individual access and review dates.

Q06-Q13, A10-A14, and L01-L11 have all four evidence arrays empty and grant no Evidence Status. L03-L05 only link and paraphrase exact owner source and test contracts; API presence and owner tests are not site compilation or runtime evidence. EX17/LAB11 and EX18/LAB12 have empty compilation evidence and recorded observations and Pending Hardware Verification runtime; no timing, speedup, or winner is recorded, and publishing L07 supplies no Lt selection runtime evidence. The selected CCCL v3.4.2 coordinate is independent from Toolkit labels, applies only to 12.9.2/13.3.1 evaluation, and excludes 11.8. All 19 Visual Explainers remain evidence-neutral browser models.

L08 separates input conversion, accumulation, output conversion, and WMMA architecture contracts. L09's structural reading is pinned to CUTLASS C++ v4.7.0 commit `dcf215af68a2d08d305076c152a06f201728cd53`, not a promise of DSL or executable support. Neither supplies local compilation, a real-instruction observation, CUDA runtime, or a performance result. VIS12's model is unchanged: its instruction panel remains a source-level scalar operation slot, not a real Tensor Core instruction.

L10/L11 independently pin cuDNN backend 9.24.0 and frontend 1.27.0 commit `f77fbc3d21be3f24cd0286b9b368105f7c518b8a` for source reading only. Backend EULA and frontend per-file Apache/MIT rights are separate, with no copied implementation or assets. Source/test review establishes no compilation, GPU, actual dispatch, dtype, or benchmark evidence.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). The page's publication inventory was checked on **2026-09-07**.
