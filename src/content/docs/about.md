---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
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

<a class="locale-pair" data-locale-counterpart href="/en/about/" lang="en">Read the English counterpart</a>

## 为什么做这个学习站

CUDA 学习站（Learning Site）是一套公开、双语的 CUDA 与 GPU 编程自学课程。它优先服务作者自己的系统学习，也希望让其他认真学习 CUDA 的读者获得一条清楚、可核对的路线。

## 当前范围

本站维护按先修关系组织的稳定课程（Stable Curriculum），并搭配可运行示例（Runnable Example）、实验（Lab）、练习（Exercise）、可视化讲解（Visual Explainer）和术语表（Glossary）。只有完整材料会进入导航。本网站保持静态，不提供账号、进度跟踪、服务端应用、API 或浏览器内 CUDA 执行。

稳定课程已完整双语发布 O01-O08、F01-F08、M01-M19、A01-A07 和 Q01-Q05，共 47 个学习单元（Learning Unit）。并行算法路线在 A01-A04 之后加入 [A05 矩阵转置](/algorithms/matrix-transpose-layout/)、[A06 Stencil 邻域与 Halo](/algorithms/stencil-neighborhood-reuse/)和 [A07 Direct 2D Convolution](/algorithms/convolution-reuse-layout/)；O02-O08、F01-F08、M01-M19、A01-A07 与 Q01-Q05 都有练习和独立参考解答。

R1 仍是最近一次已完成的聚合发布复核。[Issue #21](https://github.com/xiangzhang-coding/cuda-learning-site/issues/21) 的 A01-A04、Q02、EX11-EX13 与 VIS10 保留在当前发布中；[Issue #22](https://github.com/xiangzhang-coding/cuda-learning-site/issues/22) 本次加入 A05-A07、EX14、VIS11 及其配套学习材料。这不表示 R2 已完成，R2 聚合发布复核仍在 [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) 中等待完成。

完整严格先修图在既有边之外加入 `A05<-[M02,M03,M04]`、`A06<-[M03,M04,M05]` 与 `A07<-[A06,M03]`；对应资源边是 `EX14<-A05` 与 `VIS11<-A05`。F08 与 LAB03 相关但不是先修；Q11 与 LAB10 未发布，因此不进入图。

其余公开内容严格是十五个可运行示例（Runnable Example）：EX01-EX14 与 [EX16](/examples/sanitizer-defect-suite/)；EX15 不存在公开目标。[EX14 分块矩阵转置](/examples/tiled-transpose/)依赖 A05。实验严格是六个非连续 ID：LAB01-LAB05 与 LAB07；LAB06 继续缺席，Q11 与 LAB10 也保持未发布。十五项正式可视化讲解由十一个独立页面 VIS01-VIS11 和内嵌 VIS19-VIS22 组成，其中 [VIS11 Tiled transpose](/visuals/tiled-transpose/)依赖 A05。当前 catalog 是 6 个 Lab、48 个[练习题库（Practice Bank）](/practice/)条目、15 项 Visual Explainer、146 项[术语表](/glossary/)和 59 项[来源与版本记录](/sources-and-versions/)，共 274 条记录；公开源文件形成 178 个双语发布对（Publication Pair）和 356 条 source route。

M09-M19、A01-A07 与 Q01-Q05 的 compilation/runtime axes 为空；静态教学、练习、来源复核和 Context7 cross-check 都不授予 CUDA Evidence Status。EX14 在三条 Toolkit Lane 共用一份原创 C++17 实现，compilation evidence 为空，runtime 为 Pending Hardware Verification，recorded observations 为空；host reference pass 不建立 GPU correctness。网站没有执行 EX14 或 cuDNN，也不发布实际输出、计时、speedup 或其他性能数字。十五项 Visual Explainer 都是确定性的 browser-only model，提供静态或文字回退，不执行 CUDA，也没有 CUDA Evidence Status；VIS11 的 static layouts 不是 bank、runtime 或 performance observation。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-08-30**。
