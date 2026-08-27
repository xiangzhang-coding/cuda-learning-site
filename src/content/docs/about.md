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

稳定课程的 O01-O08 导学部分已经完整双语发布：[O01](/start/using-the-learning-site/)、[O02](/start/evidence-status/)、[O03](/start/environment-manifest/)、[O04](/start/cpp17-for-cuda/)、[O05](/start/linux-command-line/)、[O06](/start/architecture-refresher/)、[O07](/start/programmable-gpus/)和 [O08](/start/reference-environment-candidate/)。稳定课程还包括 [F01 第一个 CUDA kernel](/foundations/first-cuda-kernel/)、[F02 CUDA 执行层次](/foundations/execution-hierarchy/)、[F03 多维索引](/foundations/multidimensional-indexing/)、[F04 host-device 生命周期](/foundations/host-device-lifecycle/)、[F05 异步错误](/foundations/asynchronous-errors/)、[F06 compute capability](/foundations/compute-capability/)、[F07 Runtime/Driver API 边界](/foundations/runtime-driver-api/)与 [F08 launch geometry](/foundations/launch-geometry/)。O02-O08 与 F01-F08 都有练习和独立参考解答。

新增的严格先修边是 F05 仅依赖 F04；F06 同时依赖 F02 和 O03；F07 同时依赖 F04 和 F05；F08 同时依赖 F02、F03 和 F06；[EX04](/examples/error-handling-lifecycle/)仅依赖 F05；[LAB03](/labs/break-and-repair-indexing/)同时依赖 F03 和 F05。F08 与 LAB03 相关，但不是 LAB03 的先修条件。

其余公开内容包括 [EX01 环境报告](/examples/environment-report/)、[EX02 向量加法](/examples/vector-addition/)、[EX03 多维索引](/examples/multidimensional-indexing/)和 [EX04 错误处理生命周期](/examples/error-handling-lifecycle/)可运行示例（Runnable Example）；[LAB01 记录并解读 CUDA 环境](/labs/record-cuda-environment/)、[LAB02 向量加法](/labs/vector-addition/)和 [LAB03 破坏并修复索引](/labs/break-and-repair-indexing/)三个实验；六项正式可视化讲解，包括独立页面 [VIS01 kernel 路径](/visuals/kernel-journey/)与 [VIS02 索引](/visuals/indexing/)，以及内嵌的 [VIS19 错误暴露时间线](/foundations/asynchronous-errors/#vis19)、[VIS20 计算能力合同筛选器](/foundations/compute-capability/#vis20)、[VIS21 Runtime/Driver API 边界](/foundations/runtime-driver-api/#vis21)与 [VIS22 线程块形状约束探索器](/foundations/launch-geometry/#vis22)；包含十七道题的[练习题库（Practice Bank）](/practice/)、65 项[术语表](/glossary/)和 31 项[来源与版本记录](/sources-and-versions/)。导航不为四项内嵌讲解重复创建独立页面，也不显示未完成学习单元。

EX01 没有编译已检查（Compile-Checked）声明，运行轴为待硬件验证（Pending Hardware Verification）；LAB01 同样没有编译声明，运行轴为待硬件验证。EX02 和 LAB02 保留现有编译已检查状态，运行轴均为待硬件验证。EX03 保留现有状态：在 11.8.0、12.9.2 和 13.3.1 三条工具包通道（Toolkit Lane）使用同一份原创 C++17 source，compilation evidence 为空，运行仍为 Pending Hardware Verification。EX04 与 LAB03 的 compilation evidence 也都为空，runtime 都是 Pending Hardware Verification。网站没有执行 EX03 或 EX04 CUDA binary，也不发布它们的实际输出、错误码或性能数字。F02-F04 复用独立的 VIS01/VIS02；F05-F08 分别内嵌 VIS19-VIS22。六项可视化讲解都提供静态或文字回退，不执行 CUDA，不产生证据。F04 的原创静态生命周期表仍不是 Visual Explainer 或证据来源。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-08-26**。
