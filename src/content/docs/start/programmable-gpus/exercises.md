---
title: 'O07 练习：判断接口边界并重写因果历史'
description: 区分固定功能、可编程图形阶段和通用 GPU 接口，再把产品年表改写成有来源归属、由抽象压力驱动的解释。
pairId: o07-exercises
counterpart: /en/start/programmable-gpus/exercises/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - next
resourceKind: exercise-set
unitId: O07-EXERCISES
prerequisites:
  - O07
relatedUnits:
  - O07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O07 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/programmable-gpus/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [O07：GPU 为什么变得可编程](/start/programmable-gpus/)。这组练习（Exercise）检查接口边界和历史推理，不考产品名称记忆。

## 作答方法

先完成可复核产物，再按需打开提示。请一致使用 O07 的固定功能接口（fixed-function interface）、可编程图形阶段接口（programmed graphics-stage interface）和通用 GPU 接口（general-purpose GPU interface）定义。两道题都有完整草稿之前，不要打开独立的[参考解答](/start/programmable-gpus/solutions/)。

## 练习 1：判断接口边界

**目标：** 把每种接口归入**固定功能**、**可编程图形阶段**或**通用 GPU**，同时保留必要限定，不把不同边界强行说成相同。

| 情形 | 程序员面对的接口 |
| --- | --- |
| A | 选择预定义 transform、lighting、texture-combine 和 fog 状态，不提交自定义指令序列 |
| B | 上传逐 vertex 指令程序；clipping、primitive assembly 和 rasterization 仍在程序之外 |
| C | 把类似 C 的函数编译到 vertex 或 fragment profile，输入输出由图形 API 提供 |
| D | 把非图形数组放进 texture，用 drawing operation 调用 fragment program，再从 render target 收集结果 |
| E | 在扩展 C 语言中编写 stream 和 kernel，由 compiler/runtime 把它们映射到图形硬件 |
| F | 在 grid of thread blocks 上启动 kernel，不把工作表达成 drawing operation |

**约束：** 判断程序员面对的接口，而不是工作负载属于哪个领域，也不是语言看起来像什么。每种情形只能有一个主要类别。C、D、E 还要写一条限定，指出仍保留的图形约束或抽象层。不得用产品年代作理由。

**预期证据：** 一张六行表格，列出主要类别、程序员控制的操作、仍保留的调用/输入/输出限制，以及一句理由。

**验收条件：** 六种情形都有一个主要类别；A 与 B 根据谁定义操作序列区分；D 不会因为工作内容不是图形就自动变成通用接口；C 与 E 不会只凭类似 C 的语法分类；F 用 kernel 和 thread block 解释，而不是用速度解释。

<details><summary>提示 1</summary>逐项追问：谁定义操作，什么事件产生一次调用，输入来自哪里，输出允许去哪里？</details>

<details><summary>提示 2</summary>把编程目标和暴露出来的合同分开。一个系统可以面向通用工作，但实现仍经过图形机制。</details>

## 练习 2：把年代顺序改写成因果关系

**目标：** 把下面这段产品年表改写成一个紧凑的抽象压力因果解释：

> GPU 历史就是更新的产品不断增加功能。先有 shader，后来出现 Cg 和 Brook，最后 CUDA 替代旧方法，让所有程序都变快。因此，是最新产品解释了 GPU 为什么变得可编程。

**约束：** 按压力、接口回应和保留边界组织改写。覆盖独立图形工作与 aggregate throughput、固定状态僵化、有限 vertex/fragment programmability、借道图形接口的 GPGPU、Cg 与 Brook 不同的 language/runtime 作用，以及 CUDA 的异构 kernel、thread block、locality 和 block independence。每个日期或接口专属事实都要归属到 O07 的 owner source。不得写产品代际排名、普遍加速、完全替代或“史上首个”声明。

**预期证据：** 一个因果段落，后接 claim-to-source map。来源表要为每次主要转变至少列出一项来源，并包含 Khronos 规范、Cg DOI、BrookGPU 页面或 DOI、CUDA Programming Guide v13.3 introduction，以及 Nickolls 等 2008 年论文。

**验收条件：** 每次转变都回答“上一层抽象承受了什么压力”；Cg 与 Brook 的作用不同；CUDA 的转变落在编程模型而不是产品名；block independence 与可扩展性相连；每项具体历史事实都有匹配来源。

<details><summary>提示 1</summary>先把每句话写成“因为 X 暴露限制 Y，所以接口 Z 开放 A，同时保留 B”，完成后再删掉模板痕迹。</details>

<details><summary>提示 2</summary>ARB 规范支持明确阶段程序，Cg/Brook 论文支持 language/runtime 结论，CUDA guide 与 2008 年论文支持通用模型和 block scalability。</details>

## 下一步

把两份产物与[参考解答](/start/programmable-gpus/solutions/)对照，再到[练习题库（Practice Bank）PB-R1-004](/practice/#pb-r1-004)迁移这套因果方法。
