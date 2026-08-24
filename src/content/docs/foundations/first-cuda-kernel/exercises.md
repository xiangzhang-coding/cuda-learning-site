---
title: 'F01 练习：预测、实现与验证第一个 kernel'
description: 用三道独立任务检查索引预测、最小实现和正确性证据。
pairId: f01-exercises
counterpart: /en/foundations/first-cuda-kernel/exercises/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: F01-EXERCISES
prerequisites:
  - F01
relatedUnits:
  - F01
  - LAB02
exampleIds:
  - EX02
hardwareGate: 'None; implementation may be prepared without executing CUDA'
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f01-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F01 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F01,LAB02' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: 'None; implementation may be prepared without executing CUDA' }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/first-cuda-kernel/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F01：从预测到第一个 CUDA kernel](/foundations/first-cuda-kernel/)。三道练习（Exercise）都可以在没有 GPU 的情况下作答；没有实际运行就不得填写运行结果。

## 作答方法

先提交可复核产物，再依次打开提示。实现题必须从[固定提交中的 EX02 canonical project](https://github.com/xiangzhang-coding/cuda-learning-site/tree/d69f7131acff7f8b1dfcd780b494426b5948735b/examples/ex02-vector-addition)开始，不从学习页面复制拼接完整程序。解答在独立的[参考解答页](/foundations/first-cuda-kernel/solutions/)。

## 练习 1：预测 partial block

**目标：** 对 `element_count = 1003`、`blockDim.x = 256` 的一维 launch，计算 block 数，并给出最后一个 block 中四个代表 thread 的全局索引和 bounds 状态。

**约束：** 必须包含 `threadIdx.x = 0`、`234`、`235` 和 `255`；先写公式，再代入；不能运行代码后反推答案。

**预期证据：** 一张包含 block 数、`blockIdx.x`、`threadIdx.x`、global index、IN/OUT OF BOUNDS 和理由的表。

**验收条件：** 使用向上取整；索引公式正确；合法范围明确为 `0..1002`；准确划分最后一个 block 中执行写入和跳过的 thread。

<details><summary>提示 1</summary>用 `(element_count + blockDim.x - 1) / blockDim.x` 的整数形式计算 block 数。</details>

<details><summary>提示 2</summary>最后一个 block 的 `blockIdx.x` 是 3；每个 index 与 `element_count` 比较。</details>

## 练习 2：补全最小所有权规则

**目标：** 在 EX02 的本地工作副本中，先遮住 kernel body，再仅根据 F01 的所有权模型重新写出索引、bounds check 和逐元素加法；最后与 canonical range 做 diff。

**约束：** 不改变函数签名、数据类型、host launch 或 marker；不能增加 shared memory、循环、模板或优化；diff 不得替换 canonical 项目中的规范源码。

**预期证据：** 你的临时实现、与 `kernel` marker range 的 diff，以及三句话解释 index、bounds 和写入各自解决什么问题。

**验收条件：** 每个合法 thread 最多写一个元素；越界 thread 不读写数组；逻辑 extent 来自 `element_count`；最终复核明确 canonical EX02 仍是唯一发布来源。

<details><summary>提示 1</summary>先把“我是谁”与“我能否访问数据”写成两个独立步骤。</details>

<details><summary>提示 2</summary>你只需要 `blockIdx.x`、`blockDim.x`、`threadIdx.x` 和一个条件。</details>

## 练习 3：设计正确性验收记录

**目标：** 为一次未来的 EX02 GPU 运行写一份验收清单，使另一位学习者能判断“运行完成”和“结果正确”是否都成立。

**约束：** 不虚构输出、时间或 profiler 数据；必须分开 expected observations 与 recorded observations；社区记录即使满足 Community-Observed，也必须保留 Pending Hardware Verification，直到维护者在 Reference Environment 中复现。

**预期证据：** 一份执行前清单，覆盖 Environment Manifest、CUDA error path、CPU reference、容差规则、退出状态和待填写观察字段。

**验收条件：** 列出三次 allocation、两次 H2D copy、launch error、synchronization、D2H copy、CPU comparison 和三次 free；说明绝对 `1e-5` **或**相对 `1e-5` 接受即可；没有性能推断。

<details><summary>提示 1</summary>把“API 调用没有报错”和“每个元素被参考规则接受”分成两组。</details>

<details><summary>提示 2</summary>`cudaGetLastError` 覆盖 launch 边界；`cudaDeviceSynchronize` 才等待执行完成。</details>

## 下一步

先独立完成三道题，再查看[参考解答](/foundations/first-cuda-kernel/solutions/)。有合格原生 Linux CUDA 环境时，再用 [LAB02](/labs/vector-addition/)把第三题的空记录变成自己的观察。
