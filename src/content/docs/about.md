---
title: 关于本站
description: CUDA 学习站的目的、范围、作者和反馈渠道。
pairId: about
counterpart: /en/about/
factCheckDate: '2026-08-29'
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
      content: '2026-08-29'
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

稳定课程已完整双语发布 O01-O08、F01-F08、M01-M19，以及非连续编号的 Q01/Q03-Q05 正确性与质量路线，共 39 个学习单元（Learning Unit）。内存路线从 [M01 地址空间、所有权、作用域与生命周期](/memory/address-spaces/)延伸至 [M14 CUDA 图与重复启动结构](/memory/cuda-graphs/)；工具链路线接着发布 [M15 NVCC 主机/设备编译流程](/toolchain/nvcc-compilation-flow/)、[M16 PTX、cubin、SASS 与 fatbinary](/toolchain/ptx-cubin-fatbinary/)、[M17 选择编译器架构目标](/toolchain/compiler-architecture-targets/)、[M18 分离编译与设备链接](/toolchain/separate-compilation-device-linking/)和 [M19 CUDA C++17、C++20 与 C++23 方言边界](/toolchain/cpp-dialect-boundaries/)。正确性路线仍包括 [Q01 CPU 参考实现、容差与不变量](/correctness/cpu-references-tolerances-invariants/)、[Q03 用 memcheck 定位非法内存访问](/correctness/memcheck-invalid-memory-access/)、[Q04 用 racecheck、initcheck 与 synccheck 定位缺陷](/correctness/racecheck-initcheck-synccheck/)和 [Q05 诚实计时异步 GPU 工作](/correctness/timing-asynchronous-gpu-work/)；Q02 没有公开页面或导航占位。O02-O08、F01-F08、M01-M19 与 Q01/Q03-Q05 都有练习和独立参考解答。

R1 仍是最近一次已完成的聚合发布复核。[Issue #19](https://github.com/xiangzhang-coding/cuda-learning-site/issues/19) 范围内的 M09-M14、EX07-EX09 与 VIS08 保留在当前发布中，当前增量清单又加入 M15-M19、EX10、VIS09 及其配套学习材料；这不表示 R2 已完成，R2 聚合发布复核仍在 [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) 中等待完成。

完整严格先修边包括 F05<-F04、F06<-[F02,O03]、F07<-[F04,F05]、F08<-[F02,F03,F06]、M01<-[F04,F06]、M02<-[M01,F03]、M03<-[M01,M02]、M04<-M03、M05<-[F02,M01]、M06<-[F02,M05]、M07<-[F05,M01]、M08<-M07、M09<-[M07,M08]、M10<-[M01,M02]、M11<-[M07,M08]、M12<-[M05,M06]、M13<-[M03,M05,M08]、M14<-[M07,M08]、M15<-[F04,O04]、M16<-[M15,F06]、M17<-[M16,F06]、M18<-[M15,M16]、M19<-[O04,M15]、Q01<-[F04,O04]、Q03<-[F05,Q01]、Q04<-[M05,M06,Q03] 与 Q05<-[M08,Q01]；示例、可视化和实验边包括 EX04<-F05、EX05<-M02、EX06<-[M03,M04]、EX07<-[M07,M08,M09]、EX08<-M10、EX09<-M14、EX10<-[M15,M16]、EX16<-[Q03,Q04]、VIS08<-[M01,M02,M10]、VIS09<-[M15,M16,M17]、LAB03<-[F03,F05]、LAB04<-[M02,Q05]、LAB05<-[M04,Q05] 与 LAB07<-[Q03,Q04]。F08 与 LAB03 相关，但不是 LAB03 的先修条件。

其余公开内容严格是十一个非连续可运行示例（Runnable Example）：EX01-EX10 与 [EX16](/examples/sanitizer-defect-suite/)；EX11-EX15 不存在公开目标。[EX10 PTX 与 Fatbinary 检查](/examples/ptx-fatbinary-inspection/)严格依赖 M15 与 M16。实验严格是六个非连续 ID：[LAB01](/labs/record-cuda-environment/)、[LAB02](/labs/vector-addition/)、[LAB03](/labs/break-and-repair-indexing/)、[LAB04](/labs/observe-coalescing/)、[LAB05](/labs/remove-shared-memory-bank-conflicts/)和 [LAB07](/labs/diagnose-four-sanitizer-failures/)；LAB06 继续缺席，因为所需的 timeline-profiler 先修单元尚未公开。十三项正式可视化讲解由九个独立页面 VIS01-VIS09 和内嵌 VIS19-VIS22 组成，其中 [VIS08 托管内存页面迁移](/visuals/page-migration/)依赖 M01、M02 和 M10，[VIS09 NVCC 构建产物流水线](/visuals/artifact-pipeline/)依赖 M15、M16 和 M17。当前 catalog 是 6 个 Lab、40 个[练习题库（Practice Bank）](/practice/)条目、13 项 Visual Explainer、125 项[术语表](/glossary/)和 50 项[来源与版本记录](/sources-and-versions/)，共 234 条记录；公开源文件形成 148 个双语发布对（Publication Pair）和 296 条 source route。

M09-M19 与 Q01/Q03-Q05 的 compilation/runtime axes 为空；静态教学、练习、来源复核和 Context7 cross-check 都不授予 CUDA Evidence Status。EX01 没有编译已检查（Compile-Checked）声明，运行轴为待硬件验证（Pending Hardware Verification）；LAB01 同样没有编译声明，运行轴为待硬件验证。EX02 和 LAB02 保留既有状态。EX03-EX09 各自在 11.8.0、12.9.2 和 13.3.1 三条工具包通道（Toolkit Lane）使用一份原创 C++17 实现；EX16 是一个跨相同 Lanes 构建八个隔离 binary 的原创 Apache-2.0 C++17 project。EX05-EX09、EX16、LAB04、LAB05 与 LAB07 的 compilation evidence 为空，runtime 为 Pending Hardware Verification，recorded observations 为空，只提供 expected observations。EX10 的 compilation evidence 也为空；它只生成和检查构建产物，不执行最终 host artifact 或 GPU executable，因此 runtime 明确为 Runtime-Not-Applicable。EX10 的普通 artifact-pipeline matrix 与独立 CUDA 13.3/GCC 14 C++23 probe 在合格保留记录提交前都不能授予 Compile-Checked。Host-only utility 不能建立 GPU correctness、overlap、migration、graph replay 或 sanitizer behavior；网站没有执行 EX03-EX10/EX16 CUDA binary、Compute Sanitizer 或 profiler，也不发布实际 sanitizer report、输出、计时、speedup 或其他性能数字。十三项 Visual Explainer 都是确定性的 browser-only model，提供静态或文字回退，不执行 CUDA，也没有 CUDA Evidence Status；VIS09 的 host/device flow 与 artifact plan 是原创讲解，不是 compiler 或 artifact observation。F04 的原创静态生命周期表仍不是 Visual Explainer 或证据来源。

## 作者

本站由 [Xiang Zhang](https://github.com/xiangzhang-coding) 维护。公开源码仓库为 [xiangzhang-coding/cuda-learning-site](https://github.com/xiangzhang-coding/cuda-learning-site)。

## 反馈

发现事实、双语对齐、链接、无障碍或源码问题时，请在 [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) 提交可复现说明。页面事实核查日期为 **2026-08-29**。
