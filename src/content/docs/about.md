---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
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

<a class="locale-pair" data-locale-counterpart href="/en/about/" lang="en">Read the English counterpart</a>

## 为什么做这个学习站

CUDA 学习站（Learning Site）是一套公开、双语的 CUDA 与 GPU 编程自学课程。它优先服务作者自己的系统学习，也希望让其他认真学习 CUDA 的读者获得一条清楚、可核对的路线。

## 当前范围

本站维护按先修关系组织的稳定课程（Stable Curriculum），并搭配可运行示例（Runnable Example）、实验（Lab）、练习（Exercise）、可视化讲解（Visual Explainer）和术语表（Glossary）。只有完整材料会进入导航。本网站保持静态，不提供账号、进度跟踪、服务端应用、API 或浏览器内 CUDA 执行。

稳定课程的 O01-O08 导学部分已经完整双语发布：[O01](/start/using-the-learning-site/)、[O02](/start/evidence-status/)、[O03](/start/environment-manifest/)、[O04](/start/cpp17-for-cuda/)、[O05](/start/linux-command-line/)、[O06](/start/architecture-refresher/)、[O07](/start/programmable-gpus/)和 [O08](/start/reference-environment-candidate/)。O02-O08 都有练习与独立参考解答。

其余公开内容包括基础学习单元（Learning Unit）[F01](/foundations/first-cuda-kernel/)及其练习与解答，[EX01 环境报告](/examples/environment-report/)和 [EX02 向量加法](/examples/vector-addition/)可运行示例，[LAB01 记录并解读 CUDA 环境](/labs/record-cuda-environment/)和 [LAB02 向量加法](/labs/vector-addition/)实验，[VIS01 kernel 路径](/visuals/kernel-journey/)和 [VIS02 索引](/visuals/indexing/)，以及包含十道题的[练习题库（Practice Bank）](/practice/)、[术语表](/glossary/)和[来源与版本记录](/sources-and-versions/)。

EX01 没有编译已检查（Compile-Checked）声明，运行轴为待硬件验证（Pending Hardware Verification）；LAB01 同样没有编译声明，运行轴为待硬件验证。EX02 和 LAB02 保留现有编译已检查状态，运行轴均为待硬件验证。网站没有执行任何 CUDA binary，也没有声明基准环境（Reference Environment）。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-08-26**。
