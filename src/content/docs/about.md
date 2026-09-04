---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-09-04'
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
      content: '2026-09-04'
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

Issue #31 的严格图新增 `A12<-[M01,M02]`与 `A13<-[A12,A08]`。L13 与 EX20 仍未发布；当前算法页不发明 Generic API code、workspace cost、determinism、structured-sparsity support 或 performance result。

R3 公开内容有 16 个 Runnable Examples（EX01-EX16）、10 个 Labs（LAB01-LAB10）、19 项 Visual Explainer（独立 VIS01-VIS14/VIS18，加上内嵌 VIS19-VIS22）、66 个[练习题库](/practice/)条目、176 项[术语表](/glossary/)词条和 76 项[来源记录](/sources-and-versions/)，共 347 条 catalog records；公开源文件形成 232 个 Publication Pairs 和 464 条 source routes。

Q06-Q13 与 A10-A14 作为 Learning Units，其四个 evidence arrays 均为空且不授予 Evidence Status。五份 profiler fixtures 都是 Environment Manifest 未填写、recorded observations 为空的 expected-only plans，不是 captured reports。Matrices、storage/contribution ledgers、owner review 与 shared static composition 都是 host arithmetic/static analysis；没有 CUDA/cuSPARSE execution、workspace/preprocessing/determinism observation、structured-sparsity support、actual traffic、timing、speedup 或 winner。19 项 Visual Explainer 仍是 evidence-neutral browser models。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-09-04**。
