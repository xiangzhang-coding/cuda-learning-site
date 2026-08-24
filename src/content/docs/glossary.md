---
title: 术语表
description: CUDA 学习站首批规范中英文术语。
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

## 首批词条

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
- **相关单元：** O01。
- **版本说明：** 概念模型和特定硬件行为必须分开说明。

### Glossary · 术语表

- **定义：** 面向学习者的双语规范术语索引。
- **避免使用：** 字典、关键词清单。
- **相关单元：** O01。
- **版本说明：** 词条会随课程复核，但不会暗示接口兼容性。

## 维护规则

这些词条与 O01 的事实核查日期同为 **2026-08-24**。新增词条必须保留规范英文、首选中文、定义、避免别名、相关单元和必要的版本说明；对应的[英文页](/en/glossary/)必须同时完成。
