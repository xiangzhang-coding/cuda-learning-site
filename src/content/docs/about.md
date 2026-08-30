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

稳定课程已完整双语发布 O01-O08、F01-F08、M01-M19、A01-A04 和 Q01-Q05，共 44 个学习单元（Learning Unit）。内存路线从 [M01 地址空间、所有权、作用域与生命周期](/memory/address-spaces/)延伸至 [M14 CUDA 图与重复启动结构](/memory/cuda-graphs/)；工具链路线接着发布 M15-M19；并行算法路线发布 [A01 逐元素映射](/algorithms/elementwise-map/)、[A02 多阶段归约](/algorithms/multi-stage-reduction/)、[A03 包含式与排除式扫描](/algorithms/inclusive-exclusive-scan/)和 [A04 私有化直方图](/algorithms/privatized-histogram/)；正确性路线完整发布 [Q01 CPU 参考实现、容差与不变量](/correctness/cpu-references-tolerances-invariants/)、[Q02 浮点顺序、确定性与逐位可复现性](/correctness/floating-point-order-reproducibility/)、[Q03 用 memcheck 定位非法内存访问](/correctness/memcheck-invalid-memory-access/)、[Q04 用 racecheck、initcheck 与 synccheck 定位缺陷](/correctness/racecheck-initcheck-synccheck/)和 [Q05 诚实计时异步 GPU 工作](/correctness/timing-asynchronous-gpu-work/)。O02-O08、F01-F08、M01-M19、A01-A04 与 Q01-Q05 都有练习和独立参考解答。

R1 仍是最近一次已完成的聚合发布复核。[Issue #19](https://github.com/xiangzhang-coding/cuda-learning-site/issues/19) 范围内的 M09-M14、EX07-EX09 与 VIS08，以及既有 M15-M19、EX10 与 VIS09 材料都保留在当前发布中。[Issue #21](https://github.com/xiangzhang-coding/cuda-learning-site/issues/21) 本次加入 A01-A04、Q02、EX11-EX13、VIS10 及其配套学习材料；这不表示 R2 已完成，R2 聚合发布复核仍在 [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) 中等待完成。

完整严格先修边包括 F05<-F04、F06<-[F02,O03]、F07<-[F04,F05]、F08<-[F02,F03,F06]、M01<-[F04,F06]、M02<-[M01,F03]、M03<-[M01,M02]、M04<-M03、M05<-[F02,M01]、M06<-[F02,M05]、M07<-[F05,M01]、M08<-M07、M09<-[M07,M08]、M10<-[M01,M02]、M11<-[M07,M08]、M12<-[M05,M06]、M13<-[M03,M05,M08]、M14<-[M07,M08]、M15<-[F04,O04]、M16<-[M15,F06]、M17<-[M16,F06]、M18<-[M15,M16]、M19<-[O04,M15]、A01<-[F03,F04,M02]、A02<-[M03,M05,M06]、A03<-[A02,M05]、A04<-[M03,M05]、Q01<-[F04,O04]、Q02<-[Q01,A02]、Q03<-[F05,Q01]、Q04<-[M05,M06,Q03] 与 Q05<-[M08,Q01]；示例、可视化和实验边包括 EX04<-F05、EX05<-M02、EX06<-[M03,M04]、EX07<-[M07,M08,M09]、EX08<-M10、EX09<-M14、EX10<-[M15,M16]、EX11<-[A02,Q02]、EX12<-A03、EX13<-A04、EX16<-[Q03,Q04]、VIS08<-[M01,M02,M10]、VIS09<-[M15,M16,M17]、VIS10<-A02、LAB03<-[F03,F05]、LAB04<-[M02,Q05]、LAB05<-[M04,Q05] 与 LAB07<-[Q03,Q04]。F08 与 LAB03 相关，但不是 LAB03 的先修条件。

其余公开内容严格是十四个可运行示例（Runnable Example）：EX01-EX13 与 [EX16](/examples/sanitizer-defect-suite/)；EX14 和 EX15 不存在公开目标。[EX11 多阶段归约](/examples/multi-stage-reduction/)依赖 A02 与 Q02，[EX12 Inclusive 与 Exclusive Scan](/examples/inclusive-exclusive-scan/)依赖 A03，[EX13 私有化 Histogram](/examples/privatized-histogram/)依赖 A04。实验严格是六个非连续 ID：[LAB01](/labs/record-cuda-environment/)、[LAB02](/labs/vector-addition/)、[LAB03](/labs/break-and-repair-indexing/)、[LAB04](/labs/observe-coalescing/)、[LAB05](/labs/remove-shared-memory-bank-conflicts/)和 [LAB07](/labs/diagnose-four-sanitizer-failures/)；LAB06 继续缺席，因为所需的 timeline-profiler 先修单元尚未公开。十四项正式可视化讲解由十个独立页面 VIS01-VIS10 和内嵌 VIS19-VIS22 组成，其中 [VIS08 托管内存页面迁移](/visuals/page-migration/)依赖 M01、M02 和 M10，[VIS09 NVCC 构建产物流水线](/visuals/artifact-pipeline/)依赖 M15、M16 和 M17，[VIS10 Reduction tree 与非活动通道](/visuals/reduction-stages/)依赖 A02。当前 catalog 是 6 个 Lab、45 个[练习题库（Practice Bank）](/practice/)条目、14 项 Visual Explainer、139 项[术语表](/glossary/)和 56 项[来源与版本记录](/sources-and-versions/)，共 260 条记录；公开源文件形成 167 个双语发布对（Publication Pair）和 334 条 source route。

M09-M19、A01-A04 与 Q01-Q05 的 compilation/runtime axes 为空；静态教学、练习、来源复核和 Context7 cross-check 都不授予 CUDA Evidence Status。EX01 没有编译已检查（Compile-Checked）声明，运行轴为待硬件验证（Pending Hardware Verification）；LAB01 同样没有编译声明，运行轴为待硬件验证。EX02、EX10 和 LAB02 保留 Compile-Checked evidence。EX03-EX09 与 EX11-EX13 各自在 11.8.0、12.9.2 和 13.3.1 三条工具包通道（Toolkit Lane）使用一份原创 C++17 实现；EX16 是一个跨相同 Lanes 构建八个隔离 binary 的原创 Apache-2.0 C++17 project。EX05-EX09、EX11-EX13、EX16、LAB04、LAB05 与 LAB07 的 compilation evidence 为空，runtime 为 Pending Hardware Verification，recorded observations 为空，只提供 expected observations。EX10 的五项 ordinary records 来自 run 33275734951；它只生成和检查构建产物，不执行最终 host artifact 或 GPU executable，因此 runtime 明确为 Runtime-Not-Applicable。独立 CUDA 13.3.1/NVCC 13.3.73/GCC 14.2.0 C++23 probe 是 retained narrow pass，不声明 ordinary C++23 support、其他 compiler/platform、runtime 或 performance。Host-only utility 不能建立 GPU correctness、overlap、migration、graph replay、scan、histogram、reduction runtime behavior 或 performance；网站没有执行 EX03-EX13/EX16 CUDA binary、Compute Sanitizer 或 profiler，也不发布实际 sanitizer report、输出、计时、speedup 或其他性能数字。十四项 Visual Explainer 都是确定性的 browser-only model，提供静态或文字回退，不执行 CUDA，也没有 CUDA Evidence Status；VIS09 的 host/device flow 与 artifact plan 是原创讲解，不是 compiler 或 artifact observation；VIS10 的静态 stage diagram 是确定性回退，不是 runtime 或 performance observation。F04 的原创静态生命周期表仍不是 Visual Explainer 或证据来源。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-08-30**。
