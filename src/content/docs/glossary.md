---
title: 术语表
description: CUDA 学习站已发布的规范中英文术语和证据边界。
pairId: glossary
counterpart: /en/glossary/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - use
  - entries
  - maintenance
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: glossary
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'use,entries,maintenance'
---

<a class="locale-pair" data-locale-counterpart href="/en/glossary/" lang="en">Read the English counterpart</a>

术语表（Glossary）记录 CUDA 学习站（Learning Site）采用的规范词汇。中文正文第一次使用受控术语时会同时给出英文，方便你继续阅读代码、工具和上游资料。

## 如何使用

“避免使用”不是在禁止日常表达，而是在指出会改变本站教学合同或资源类型的称呼。每个词条都给出相关学习单元（Learning Unit）和版本边界。

## 已发布词条

### Learning Site · 学习站

- **定义：** 包含稳定课程（Stable Curriculum）、可运行示例（Runnable Example）、实验（Lab）和练习（Exercise）的完整公开学习资源。
- **避免使用：** 博客、文档站。
- **相关单元：** O01。
- **版本说明：** 不受特定 Toolkit 版本约束。

### Stable Curriculum · 稳定课程

- **定义：** 建立在非预览接口和耐久概念上的先修课程；“稳定”描述教学依赖合同，不表示每个动手活动都已有硬件观察。
- **避免使用：** 主课程、最新特性目录。
- **相关单元：** O01。
- **版本说明：** 课程持续维护，不按 Toolkit 复制多套版本。

### Learning Unit · 学习单元

- **定义：** 按顺序讲授一个主题的课程部分，先说明动机，再发展心智模型和相关历史背景，最后通过实践检查理解。
- **避免使用：** 文章、帖子。
- **相关单元：** O01。
- **版本说明：** 资源类型本身不受版本约束。

### Publication Pair · 双语发布对

- **定义：** 同一公开页面的中英文对应版本，共享事实、结构、代码、可视化、元数据和来源日期。
- **避免使用：** 翻译回退、可选翻译。
- **相关单元：** O01。
- **版本说明：** 适用于每次发布。

### Runnable Example · 可运行示例

- **定义：** 展示一个聚焦概念的独立源代码项目，是学习单元引用的规范可执行来源。
- **避免使用：** 代码片段、伪代码、实验。
- **相关单元：** O01。
- **版本说明：** 具体项目必须另行声明适用版本。

### Lab · 实验

- **定义：** 学习者在外部 CUDA 环境中执行的引导式活动，包含预期观察和验收条件。
- **避免使用：** 演示、浏览器游乐场。
- **相关单元：** O01。
- **版本说明：** 具体实验必须另行声明环境要求。

### Exercise · 练习

- **定义：** 由学习者完成的任务，说明目标、约束和验收条件，而不是只给出答案。
- **避免使用：** 示例、实验。
- **相关单元：** O01。
- **版本说明：** 资源类型本身不受版本约束。

### Practice Bank · 练习题库

- **定义：** 跨课程整理的原创问题集合，每个条目都会链接到教授其先修知识的学习单元。
- **避免使用：** 常见问题、复制的题目堆。
- **相关单元：** O01。
- **版本说明：** 具体条目在需要时声明版本边界。

### Visual Explainer · 可视化讲解

- **定义：** 用交互或动画显露空间、时间或架构行为的表示；可以在浏览器中建模 CUDA 概念，但不会执行 CUDA。
- **避免使用：** 装饰、CUDA 演示。
- **相关资源：** O01、[VIS01](/visuals/kernel-journey/)、[VIS02](/visuals/indexing/)。
- **版本说明：** 概念模型和特定硬件行为必须分开说明。

### Glossary · 术语表

- **定义：** 面向学习者的双语规范术语索引。
- **避免使用：** 字典、关键词清单。
- **相关单元：** O01。
- **版本说明：** 词条会随课程复核，但不会暗示接口兼容性。

### Evidence Status · 证据状态

- **定义：** 描述实验或可运行示例当前具有什么可复核证据的受控标签；编译轴和运行轴彼此独立。
- **避免使用：** 不加限定的“已验证”“已支持”。
- **相关单元：** O02。
- **版本说明：** 状态必须绑定对象、环境、标准和日期；网页发布本身不授予状态。

### Compile-Checked · 编译已检查

- **定义：** 要求的源代码在声明的 Toolkit Lane 中实际构建成功，并记录方言、目标、命令和构建环境；不要求也不暗示 GPU 执行。
- **避免使用：** 运行已验证、已在 GPU 测试。
- **相关单元：** O02、O03。
- **版本说明：** 每次声明都绑定精确 Toolkit Lane。

### Community-Observed · 社区已观察

- **定义：** 社区成员提交了完整 Environment Manifest、日志或产物、标准和日期的运行观察；它不等同于维护者复现。
- **避免使用：** Runtime-Verified、轶闻支持。
- **相关单元：** O02、O03。
- **版本说明：** 可与 Pending Hardware Verification 并存。

### Runtime-Verified · 运行已验证

- **定义：** 对象在已声明、由维护者控制的 Reference Environment 中执行，并满足预先声明的正确性和观察标准。
- **避免使用：** Compile-Checked、预期可运行。
- **相关单元：** O02、O03。
- **版本说明：** 结论只覆盖记录的 GPU、驱动、Toolkit、组件、工作负载和方法。

### Pending Hardware Verification · 待硬件验证

- **定义：** 验收需要 GPU 行为，但所需合格运行证据尚不存在。
- **避免使用：** Runtime-Verified、应该能运行。
- **相关单元：** O02。
- **版本说明：** 编译成功或社区观察不会自动移除此状态。

### Runtime-Not-Applicable · 无需运行验证

- **定义：** 验收只要求编译或检查产物，不要求任何 GPU 行为时使用的运行轴状态。
- **避免使用：** 编译专用、跳过运行。
- **相关单元：** O02。
- **版本说明：** 不能用来隐藏运行正确性或性能要求。

### Environment Manifest · 环境清单

- **定义：** 为解释构建、运行或测量而分别记录的 GPU、计算能力、数量、驱动、Toolkit、组件、编译器、操作系统、工作负载和方法坐标。
- **避免使用：** 版本字符串、机器描述。
- **相关单元：** O03。
- **版本说明：** 证据发生变化时必须记录新的观察日期和坐标。

### Supported Environment · 受支持环境

- **定义：** 本站承担安装说明、故障边界和验证声明责任的环境家族；只有原生 Linux 属于此范围。
- **避免使用：** 任何可能碰巧运行的平台。
- **相关单元：** O03。
- **版本说明：** 上游产品支持不会自动扩大本站责任。

### Reference Environment · 基准环境

- **定义：** 受支持环境中一套已声明、由维护者控制、拥有完整 manifest 和成功受控基线运行的具体配置。
- **避免使用：** 推荐环境、社区配置。
- **相关单元：** O03。
- **版本说明：** 当前尚未声明任何 Reference Environment。

### Toolkit Lane · 工具包通道

- **定义：** 固定 Toolkit 和主机环境、并声明所测 C++ 方言的编译证据目标。
- **避免使用：** 站点版本、文档版本。
- **相关单元：** O03。
- **版本说明：** Lane 不是课程副本或 Reference Environment；构建成功后才能获得 Compile-Checked。

### GPU Capability Tier · GPU 能力层级

- **定义：** 由计算能力、显存、GPU 数量、特性和权限共同定义的课程支持层级。
- **避免使用：** GPU class、显存档位。
- **相关单元：** O03。
- **版本说明：** 产品名和更大显存不能单独决定层级。

### Baseline GPU Capability Tier · 基础 GPU 能力层级

- **定义：** 稳定课程基础内容的层级，要求 compute capability 7.5 或更新，并采用能放入 8 GB 的问题规模。
- **避免使用：** 8 GB GPU tier、Turing tier。
- **相关单元：** O03。
- **版本说明：** 8 GB 描述工作负载边界，不是单独的硬件档位。

### Modern Single-GPU Capability Tier · 现代单 GPU 能力层级

- **定义：** 完整单 GPU 路线的层级，要求 compute capability 8.0 或更新并且至少 8 GB；额外活动另行声明门槛。
- **避免使用：** complete tier、Ampere tier。
- **相关单元：** O03。
- **版本说明：** 多 GPU 和架构专用活动不由此层级自动覆盖。

### CUDA Toolkit · CUDA 工具包

- **定义：** NVIDIA 提供的编译器、库、工具和运行时开发组件集合；它和已安装驱动、单个组件版本分别记录。
- **避免使用：** CUDA 驱动版本、整台 CUDA 环境。
- **相关单元：** O03。
- **版本说明：** 本站 Toolkit Lane 使用精确 `X.Y.Z` 坐标。

### compute capability · 计算能力

- **定义：** 描述一组 GPU 架构功能和技术限制的 major.minor 能力坐标。
- **避免使用：** GPU 代际、Toolkit 版本。
- **相关单元：** O03。
- **版本说明：** 型号映射和功能表必须按当前 NVIDIA 文档复核。

## 维护规则

这些词条与 O01、O02、O03 的事实核查日期同为 **2026-08-24**。新增词条必须保留规范英文、首选中文、定义、避免别名、相关单元和必要的版本说明；对应的[英文页](/en/glossary/)必须同时完成。
