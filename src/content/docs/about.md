---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-08-31'
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
      content: '2026-08-31'
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

稳定课程已完整双语发布 O01-O08、F01-F08、M01-M19、A01-A09 和 Q01-Q05，共 49 个学习单元（Learning Unit）。新增 [A08 Tiled GEMM](/algorithms/tiled-gemm-correctness/)与 [A09 Sorting、Selection、Compaction](/algorithms/sorting-selection-compaction/)；A01-A09 都有 Exercises 与独立 solutions。

R1 仍是最近一次已完成的聚合发布复核；Issue #23 发布 A08/A09、EX15、VIS12 与配套材料，但 R2 聚合复核仍由 [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) 单独设门。

严格图新增 `A08<-[A05,M03,M04,A02]`、`A09<-[A03,A04]`、`EX15<-A08` 与 `VIS12<-A08`。Q13、L06 与 LAB12 未发布；LAB12 必须等待前两项先修。

公开内容有 16 个 Runnable Examples（EX01-EX16）、6 个非连续 Labs、16 项 Visual Explainer（独立 VIS01-VIS12 与内嵌 VIS19-VIS22）、50 个[练习题库](/practice/)条目、151 项[术语表](/glossary/)词条和 61 项[来源记录](/sources-and-versions/)，共 284 条 catalog records；公开源文件形成 186 个 Publication Pairs 和 372 条 source routes。

A01-A09 与 Q01-Q05 的 compilation/runtime axes 为空。EX15 在三条 Toolkit Lane 共用一份原创 C++17 FP32 implementation，compilation evidence 为空，runtime 为 Pending Hardware Verification；host reference pass 不建立 GPU correctness。网站没有执行 EX15、CUB 或 Thrust，也不发布 output、timing、speedup 或 production winner。16 项 Visual Explainer 都是 evidence-neutral browser models。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-08-31**。
