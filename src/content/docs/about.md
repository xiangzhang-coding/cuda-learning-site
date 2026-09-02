---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-09-02'
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
      content: '2026-09-02'
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

稳定课程的当前滚动发布已在 [issue #27](https://github.com/xiangzhang-coding/cuda-learning-site/issues/27) 后完整双语发布 O01-O08、F01-F08、M01-M19、A01-A09/A14 和 Q01-Q11，共 56 个学习单元（Learning Unit）。[Q11 用受控证据优化 Canonical Transpose](/correctness/transpose-optimization-case-study/)从 immutable [EX14](/examples/tiled-transpose/)开始并复用 evidence-neutral [VIS11](/visuals/tiled-transpose/)；[LAB10 优化 canonical transpose](/labs/optimize-canonical-transpose/)把它带入站外实验。

已完成的 R2 聚合发布复核是不可变快照，固定为 186 个 Publication Pairs、372 条 source routes 与 284 条 catalog records。当前增量发布已前进到 213 个 Publication Pairs 与 426 条 source routes，但不会改写 R2；R3 聚合复核仍待完成。

Issue #27 的严格图新增 `Q11<-[A05,Q06,Q08,Q10]` 与 `LAB10<-[Q11]`。Q13、L06 与 LAB12 仍未发布；LAB12 必须等待 Q13 与 L06。

当前公开内容有 16 个 Runnable Examples（EX01-EX16）、10 个 Labs（LAB01-LAB10）、18 项 Visual Explainer（独立 VIS01-VIS14，加上内嵌 VIS19-VIS22）、58 个[练习题库](/practice/)条目、165 项[术语表](/glossary/)词条和 70 项[来源记录](/sources-and-versions/)，共 321 条 catalog records；当前滚动公开源文件形成 213 个 Publication Pairs 和 426 条 source routes。

Q11 作为 Learning Unit，其 compilation、runtime、expected-observation 与 recorded-observation 四个 evidence arrays 均为空；它不授予 Evidence Status，只汇总关联对象。关联的 EX14 与 LAB10 的 compilation 和 recorded observations 为空、runtime 为 Pending Hardware Verification；immutable EX14 source、VIS11、static/browser evidence 与 expected-only fixture 都不会改变这些边界。LAB10 声明 `4096x4096` `float` workload、134,221,952-byte 保守上界、一次排除的 warm-up、显式同步，以及十次 attempts 的 median 与 min/max 方法，但没有 timing、metric、speedup、bottleneck、winner、Reference Environment 或 `performanceObservations`。18 项 Visual Explainer 仍是 evidence-neutral browser models。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-09-02**。
