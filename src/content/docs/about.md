---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
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

<a class="locale-pair" data-locale-counterpart href="/en/about/" lang="en">Read the English counterpart</a>

## 为什么做这个学习站

CUDA 学习站（Learning Site）是一套公开、双语的 CUDA 与 GPU 编程自学课程。它优先服务作者自己的系统学习，也希望让其他认真学习 CUDA 的读者获得一条清楚、可核对的路线。

## 当前范围

本站维护按先修关系组织的稳定课程（Stable Curriculum），并搭配可运行示例（Runnable Example）、实验（Lab）、练习（Exercise）、可视化讲解（Visual Explainer）和术语表（Glossary）。只有完整材料会进入导航。本网站保持静态，不提供账号、进度跟踪、服务端应用、API 或浏览器内 CUDA 执行。

稳定课程已完整双语发布 O01-O08、F01-F08 与 M01-M08。内存路线包括 [M01 地址空间、所有权、作用域与生命周期](/memory/address-spaces/)、[M02 合并访问与事务塑形](/memory/coalescing-transactions/)、[M03 共享内存分块](/memory/shared-memory-tiling/)、[M04 bank conflict 与布局变换](/memory/bank-conflicts-layouts/)、[M05 同步作用域与内存可见性](/memory/synchronization-scopes/)、[M06 分支发散、重汇合与线程束安全推理](/memory/warp-divergence-reconvergence/)、[M07 用流取代全局顺序心智模型](/memory/stream-ordering/)和 [M08 用事件表达依赖并测量设备时间](/memory/event-dependencies-timing/)。O02-O08、F01-F08 与 M01-M08 都有练习和独立参考解答；M05-M08 可直接进入 [M05 练习](/memory/synchronization-scopes/exercises/)与[解答](/memory/synchronization-scopes/solutions/)、[M06 练习](/memory/warp-divergence-reconvergence/exercises/)与[解答](/memory/warp-divergence-reconvergence/solutions/)、[M07 练习](/memory/stream-ordering/exercises/)与[解答](/memory/stream-ordering/solutions/)、[M08 练习](/memory/event-dependencies-timing/exercises/)与[解答](/memory/event-dependencies-timing/solutions/)。

完整严格先修边包括 F05<-F04、F06<-[F02,O03]、F07<-[F04,F05]、F08<-[F02,F03,F06]、M01<-[F04,F06]、M02<-[M01,F03]、M03<-[M01,M02]、M04<-M03、M05<-[F02,M01]、M06<-[F02,M05]、M07<-[F05,M01] 与 M08<-M07；EX04<-F05、EX05<-M02、EX06<-[M03,M04]、LAB03<-[F03,F05] 保持不变。F08 与 LAB03 相关，但不是 LAB03 的先修条件。

其余公开内容严格只有 EX01-EX06 六个可运行示例（Runnable Example），没有 EX07；严格只有 [LAB01](/labs/record-cuda-environment/)、[LAB02](/labs/vector-addition/)和 [LAB03](/labs/break-and-repair-indexing/)三个实验。十一项正式可视化讲解由七个独立页面 [VIS01](/visuals/kernel-journey/)、[VIS02](/visuals/indexing/)、[VIS03](/visuals/warp-divergence/)、[VIS04](/visuals/memory-transactions/)、[VIS05](/visuals/shared-memory-banks/)、[VIS06](/visuals/memory-hierarchy-lifetime/)、[VIS07](/visuals/stream-event-dependencies/)和内嵌 VIS19-VIS22 组成。最终 catalog 是 3 个 Lab、25 个[练习题库（Practice Bank）](/practice/)条目、11 项 Visual Explainer、86 项[术语表](/glossary/)和 36 项[来源与版本记录](/sources-and-versions/)，共 161 项；公开源文件形成 93 个双语发布对（Publication Pair）和 186 条 source route。

EX01 没有编译已检查（Compile-Checked）声明，运行轴为待硬件验证（Pending Hardware Verification）；LAB01 同样没有编译声明，运行轴为待硬件验证。EX02 和 LAB02 保留现有 Compile-Checked 状态，运行轴均为 Pending Hardware Verification。EX03-EX06 各自在 11.8.0、12.9.2 和 13.3.1 三条工具包通道（Toolkit Lane）使用一份原创 C++17 实现。EX05 与 EX06 没有符合条件的 retained compile record，因此 compilation evidence 为空；runtime 为 Pending Hardware Verification，recorded observations 为空，只提供 expected observations。网站没有执行 EX03-EX06 CUDA binary，也不发布它们的实际输出、计时、speedup 或其他性能数字。十一项 Visual Explainer 都是确定性的 browser-only model，提供静态或文字回退，不执行 CUDA，也没有 CUDA Evidence Status。F04 的原创静态生命周期表仍不是 Visual Explainer 或证据来源。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-08-28**。
