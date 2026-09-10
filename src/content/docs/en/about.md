---
title: About
description: The purpose, scope, author, and feedback path for CUDA Learning Site.
pairId: about
counterpart: /about/
factCheckDate: '2026-09-10'
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
      content: '2026-09-10'
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

R4 is the latest completed aggregate static release review, dated 2026-09-10. Schema 5 `src/r4-release-manifest.json` supplies `/release.json`; `/publication.json` records R4 as latest completed and R5 as next, with its aggregate review pending. R1-R3 remain exact historical snapshots. R3 retains 232 Publication Pairs, 464 source routes, 347 catalog records, 61 Exercise sets, 61 separate reviewed-solution sets, and ten Nsight report-analysis Practice Bank entries.

Issue #31 adds `A12<-[M01,M02]` and `A13<-[A12,A08]` to the strict graph. [Issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33) adds [L01](/en/libraries/library-primitive-dsl-custom-kernel/) and [L02](/en/libraries/thrust-algorithm-vocabulary/) to the rolling R4 publication. [Issue #34](https://github.com/xiangzhang-coding/cuda-learning-site/issues/34) publishes [L03: CUB Device Primitives](/en/libraries/cub-device-primitives/), [L04: CUB Warp and Block Primitives](/en/libraries/cub-warp-block-primitives/), [EX17: CUB Device Reduction and Scan](/en/examples/cub-device-reduction-scan/), and [LAB11: Compare a Custom Reduction with CUB](/en/labs/compare-custom-reduction-with-cub/), followed by [L05: libcu++ Synchronization Abstractions](/en/libraries/libcu-plus-plus-synchronization/) with strict prerequisites M05, M13, and M19. [Issue #36](https://github.com/xiangzhang-coding/cuda-learning-site/issues/36) adds [L06: cuBLAS GEMM](/en/libraries/cublas-gemm/)`<-[A08,Q01]`, [L07: cuBLASLt Matmul](/en/libraries/cublaslt-matmul/)`<-[L06,Q05]`, [EX18](/en/examples/cublas-gemm/)`<-[L06]`, and [LAB12](/en/labs/compare-gemm-with-cublas/)`<-[Q13,L06]`.

[Issue #37](https://github.com/xiangzhang-coding/cuda-learning-site/issues/37) adds [L08: Tensor Core Precision and Architecture Contracts](/en/libraries/tensor-core-precision-contracts/)`<-[Q02,L06,F06]` and [L09: CUTLASS C++ GEMM Structure](/en/libraries/cutlass-cpp-gemm-structure/)`<-[A08,L06,M17]`, each with exactly those ordered direct prerequisites. [L08 Exercises](/en/libraries/tensor-core-precision-contracts/exercises/) and [separate solutions](/en/libraries/tensor-core-precision-contracts/solutions/), plus [L09 Exercises](/en/libraries/cutlass-cpp-gemm-structure/exercises/) and [separate solutions](/en/libraries/cutlass-cpp-gemm-structure/solutions/), are directly available.

[Issue #38](https://github.com/xiangzhang-coding/cuda-learning-site/issues/38) adds [L10: cuDNN Graphs and Plans](/en/libraries/cudnn-graphs-and-plans/)`<-[A07,L01,Q05]` and [L11: Attention Backend Dispatch](/en/libraries/attention-backend-dispatch/)`<-[A11,L10,L08]`, related to L11 and VIS18 respectively, without changing older prerequisites. [L10 Exercises](/en/libraries/cudnn-graphs-and-plans/exercises/) and [separate solutions](/en/libraries/cudnn-graphs-and-plans/solutions/), plus [L11 Exercises](/en/libraries/attention-backend-dispatch/exercises/) and [separate solutions](/en/libraries/attention-backend-dispatch/solutions/), publish together.

[Issue #39](https://github.com/xiangzhang-coding/cuda-learning-site/issues/39) adds [L12: cuFFT Plans, Layouts, and Startup](/en/libraries/cufft-plans-layouts-startup/)`<-[Q05,M07]`, [L12 Exercises](/en/libraries/cufft-plans-layouts-startup/exercises/)`<-[L12]`, [separate solutions](/en/libraries/cufft-plans-layouts-startup/solutions/)`<-[L12-EXERCISES]`, and [EX19: cuFFT Batched Transform](/en/examples/cufft-batched-transform/)`<-[L12]`. These are four Publication Pairs and eight routes.

[Issue #40](https://github.com/xiangzhang-coding/cuda-learning-site/issues/40) adds [L13: cuSPARSE Descriptors, SpMV, and SpMM](/en/libraries/cusparse-descriptors-spmv-spmm/)`<-[A12,A13,L01]`, [L13 Exercises](/en/libraries/cusparse-descriptors-spmv-spmm/exercises/)`<-[L13]`, [separate solutions](/en/libraries/cusparse-descriptors-spmv-spmm/solutions/)`<-[L13-EXERCISES]`, and [EX20: cuSPARSE SpMV](/en/examples/cusparse-spmv/)`<-[L13]`. These add four Publication Pairs and eight routes. All L01-L13 are included in R4; the aggregate review adds no further pages or inventory.

The rolling current publication has 75 Learning Units, 20 Runnable Examples (EX01-EX20), 12 Labs (LAB01-LAB12), 19 formal Visual Explainers (standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22), 82 [Practice Bank](/en/practice/) entries, 196 [Glossary](/en/glossary/) terms, and 92 [source records](/en/sources-and-versions/), for 401 catalog records. Public source files form 277 Publication Pairs and 554 source routes, including 74 Exercise sets and 74 separate reviewed-solution sets.

**Aggregate static review: 2026-09-10.** Technical sources retain their individual access and review dates; fresh retrievals have a separate [aggregate disposition](/en/sources-and-versions/#r4-aggregate-review). [Issue #41](https://github.com/xiangzhang-coding/cuda-learning-site/issues/41) records CI, Preview, production, and smoke acceptance only after those results exist. R4 does not imply completion of framework or Triton tracks or publish placeholder destinations for them.

The existing 82-entry Practice Bank includes eight qualifying R4 library-and-algorithm-choice entries: `PB-R4-001`, `PB-R4-002`, `PB-R4-003`, `PB-R4-004`, `PB-R4-008`, `PB-R4-011`, `PB-R4-012`, and `PB-R4-016`, alongside the unchanged ten-entry R3 Nsight report-analysis subset. Only EX02, EX10, and LAB02 are Compile-Checked; EX10 is Runtime-Not-Applicable. The other 19 examples and all 12 Labs remain Pending Hardware Verification, 31 subjects total. Runtime-Verified, Community-Observed, Reference Environment, and performance-observation counts remain zero. All six profiler plans are expected-only; source review is not GPU evidence.

Q06-Q13, A10-A14, and L01-L13 have all four evidence arrays empty and grant no Evidence Status. L03-L05 only link and paraphrase exact owner source and test contracts; API presence and owner tests are not site compilation or runtime evidence. EX17/LAB11, EX18/LAB12, EX19, and EX20 have empty compilation evidence and recorded observations and Pending Hardware Verification runtime; no timing, speedup, or winner is recorded, and publishing L07 supplies no Lt selection runtime evidence. The selected CCCL v3.4.2 coordinate is independent from Toolkit labels, applies only to 12.9.2/13.3.1 evaluation, and excludes 11.8. All 19 Visual Explainers remain evidence-neutral browser models.

L08 separates input conversion, accumulation, output conversion, and WMMA architecture contracts. L09's structural reading is pinned to CUTLASS C++ v4.7.0 commit `dcf215af68a2d08d305076c152a06f201728cd53`, not a promise of DSL or executable support. Neither supplies local compilation, a real-instruction observation, CUDA runtime, or a performance result. VIS12's model is unchanged: its instruction panel remains a source-level scalar operation slot, not a real Tensor Core instruction.

L10/L11 independently pin cuDNN backend 9.24.0 and frontend 1.27.0 commit `f77fbc3d21be3f24cd0286b9b368105f7c518b8a` for source reading only. Backend EULA and frontend per-file Apache/MIT rights are separate, with no copied implementation or assets. Source/test review establishes no compilation, GPU, actual dispatch, dtype, or benchmark evidence.

L12 uses the archived 12.9.2 cuFFT teaching baseline and a live 13.3 reference accessed 2026-09-08; exact 13.3.1 API and release-note archives were unavailable. EX19 declares the same three pinned Toolkit Lanes with C++17 only and bundled cuFFT 10.9.0.58 / 11.4.1.4 / 12.3.0.29. Its FP32 C2C example excludes callbacks, low precision, multi-GPU execution, and timing; source identity and build gates provide no GPU evidence.

L13 uses the archived 12.9.2 cuSPARSE teaching baseline with exact 11.8.0 and 13.3.1 comparisons. The [SRC-CUDA-075/076 review](/en/sources-and-versions/#src-cuda-075) dated 2026-09-09 records available API and release-note archives, including 13.3.1, without rewriting EX19's historical archive-failure record. EX20 declares three C++17 non-executing build gates for Toolkit/cuSPARSE pairs 11.8.0/11.7.5.86, 12.9.2/12.5.10.65, and 13.3.1/12.8.2.51; no retained compile evidence or GPU result is granted. NVIDIA headers remain proprietary under the linked [libcusparse license](https://developer.download.nvidia.com/compute/cuda/redist/libcusparse/LICENSE.txt); no upstream material is copied or adapted. EX20 software is original Apache-2.0 and teaching prose is original CC BY 4.0.

## Author

[Xiang Zhang](https://github.com/xiangzhang-coding) maintains the site. Its public source repository is [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site).

## Feedback

For factual, bilingual-alignment, link, accessibility, or source problems, open a reproducible report in [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues). The page's aggregate release summary was checked on **2026-09-10**.
