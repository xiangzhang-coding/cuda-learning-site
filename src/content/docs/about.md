---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-09-05'
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
      content: '2026-09-05'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'purpose,scope,author,feedback'
---

<a class="locale-pair" data-locale-counterpart href="/en/about/" lang="en">Read the English counterpart</a>

## 为什么做这个学习站

CUDA 学习站（Learning Site）是一套公开、双语的 CUDA 与 GPU 编程自学课程。它优先服务作者自己的系统学习，也希望让其他认真学习 CUDA 的读者获得一条清楚、可核对的路线。

## 当前范围

本站维护按先修关系组织的稳定课程（Stable Curriculum），并搭配可运行示例（Runnable Example）、实验（Lab）、练习（Exercise）、可视化讲解（Visual Explainer）和术语表（Glossary）。只有完整材料会进入导航。本网站保持静态，不提供账号、进度跟踪、服务端应用、API 或浏览器内 CUDA 执行。

稳定课程的 R3 发布已在 [issue #32](https://github.com/xiangzhang-coding/cuda-learning-site/issues/32) 完整双语复核 O01-O08、F01-F08、M01-M19、A01-A14 和 Q01-Q13，共 62 个学习单元（Learning Unit）。[A12](/algorithms/sparse-formats-spmv/)建立 COO/CSR、storage 与 SpMV 合同，[A13](/algorithms/sparse-matrix-multiplication-preprocessing/)建立 SpMM、descriptor、workspace 与 preprocessing 决策边界。

已完成的 R3 聚合发布复核是不可变快照，固定为 232 个 Publication Pairs、464 条 source routes 与 347 条 catalog records。它包含 61 组 Exercises、61 组独立 reviewed solutions，以及 10 个 Nsight report-analysis Practice Bank 条目；R1/R2 继续作为历史坐标，R4 聚合复核仍待完成。

Issue #31 的严格图新增 `A12<-[M01,M02]`与 `A13<-[A12,A08]`。[Issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33)在滚动 R4 发布中新增 [L01](/libraries/library-primitive-dsl-custom-kernel/)与 [L02](/libraries/thrust-algorithm-vocabulary/)；[issue #34](https://github.com/xiangzhang-coding/cuda-learning-site/issues/34)发布 [L03：CUB Device Primitives](/libraries/cub-device-primitives/)、[L04：CUB Warp 与 Block Primitives](/libraries/cub-warp-block-primitives/)、[EX17：CUB Device Reduction and Scan](/examples/cub-device-reduction-scan/)和 [LAB11：比较自定义归约与 CUB](/labs/compare-custom-reduction-with-cub/)，随后发布严格依赖 M05、M13 与 M19 的 [L05：libcu++ 同步抽象](/libraries/libcu-plus-plus-synchronization/)。[Issue #36](https://github.com/xiangzhang-coding/cuda-learning-site/issues/36)新增 [L06：cuBLAS GEMM](/libraries/cublas-gemm/)`<-[A08,Q01]`、[L07：cuBLASLt Matmul](/libraries/cublaslt-matmul/)`<-[L06,Q05]`、[EX18](/examples/cublas-gemm/)`<-[L06]`与 [LAB12](/labs/compare-gemm-with-cublas/)`<-[Q13,L06]`。L08-L13 仍待发布。

当前滚动发布有 69 个学习单元、18 个可运行示例（EX01-EX18）、12 个实验（LAB01-LAB12）、19 项可视化讲解（独立 VIS01-VIS14/VIS18，加上内嵌 VIS19-VIS22）、74 个[练习题库](/practice/)条目、188 项[术语表](/glossary/)词条和 84 项[来源记录](/sources-and-versions/)，共 377 条资源目录记录；公开源文件形成 257 个双语发布对（Publication Pair）和 514 条源路由，包含 68 组练习与 68 组独立参考解答。

**发布清单与导航更新：2026-09-06。** 本次不重新核查 CUDA API 事实，技术来源保留各自访问与复核日期。

Q06-Q13、A10-A14 与 L01-L07 的四个证据数组均为空，不授予证据状态（Evidence Status）。L03-L05 只链接和复述精确的上游源码及测试合同；API 存在与上游测试不是本站编译或运行证据。EX17/LAB11 与 EX18/LAB12 的编译证据和实际观察记录为空，运行保持待硬件验证（Pending Hardware Verification）；没有计时、加速比或赢家记录，L07 的发布也不提供 Lt 选择的运行证据。选定的 CCCL v3.4.2 坐标独立于 Toolkit 标签，只用于 12.9.2/13.3.1 评估，并排除 11.8。19 项可视化讲解仍是无 CUDA 证据的浏览器模型。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-09-05**。
