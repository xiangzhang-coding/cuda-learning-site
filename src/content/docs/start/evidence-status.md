---
title: 'O02：诚实记录证据状态'
description: 用独立的编译轴和运行轴分类 CUDA 证据，不把预期当作观察。
pairId: o02
counterpart: /en/start/evidence-status/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - outcome
  - prerequisites
  - model
  - statuses
  - decision
  - examples
  - retrieval
  - practice
  - sources
resourceKind: learning-unit
unitId: O02
prerequisites:
  - O01
relatedUnits:
  - O01
exampleIds:
  - O02-CASE-A
  - O02-CASE-B
  - O02-CASE-C
  - O02-CASE-D
  - O02-CASE-E
  - O02-CASE-F
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
sources:
  - title: NVIDIA CUDA Compiler Driver - Supported Phases
    url: 'https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases'
    version: 'CUDA Toolkit 13.3.1'
    platform: 'Linux and Windows'
    accessDate: '2026-08-24'
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: o02
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
      content: 'outcome,prerequisites,model,statuses,decision,examples,retrieval,practice,sources'
  - tag: meta
    attrs:
      name: 'cuda:resource-kind'
      content: learning-unit
  - tag: meta
    attrs:
      name: 'cuda:unit-id'
      content: O02
  - tag: meta
    attrs:
      name: 'cuda:prerequisites'
      content: O01
  - tag: meta
    attrs:
      name: 'cuda:related-units'
      content: O01
  - tag: meta
    attrs:
      name: 'cuda:example-ids'
      content: 'O02-CASE-A,O02-CASE-B,O02-CASE-C,O02-CASE-D,O02-CASE-E,O02-CASE-F'
  - tag: meta
    attrs:
      name: 'cuda:hardware-gate'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:evidence-compilation'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:evidence-runtime'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:expected-observations'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:recorded-observations'
      content: none
  - tag: meta
    attrs:
      name: 'cuda:source-count'
      content: '1'
  - tag: meta
    attrs:
      name: 'cuda:source-versions'
      content: '13.3.1'
---

<a class="locale-pair" data-locale-counterpart href="/en/start/evidence-status/" lang="en">Read the English counterpart</a>

证据状态（Evidence Status）回答的不是“这段内容看起来是否可信”，而是“我们实际做了什么、在哪里做、留下了什么记录”。一条清楚的状态能阻止编译成功被写成运行成功，也能让后来的人知道还缺哪一步。

## 学完本单元，你应该能

- 分开记录编译证据和运行证据。
- 正确使用五个受控标签，并拒绝没有证据支持的升级。
- 区分预期观察与已记录观察。
- 根据环境清单（Environment Manifest）、日志、验收条件和观察者身份判断证据边界。

## 先修关系

先完成 [O01：如何使用学习站](/start/using-the-learning-site/)。O01 说明资源类型和站点边界；O02 规定这些资源怎样陈述 CUDA 证据。

## 两条独立的轴

**编译证据和运行证据相互独立。** 编译轴只回答“要求的源代码是否在声明的工具包通道（Toolkit Lane）中成功构建”。运行轴回答“是否发生了满足条件的 GPU 执行或该任务是否根本不要求 GPU 行为”。

因此，同一个对象可以同时是 `Compile-Checked + Pending Hardware Verification`。这不是矛盾：前者记录已经观察到的构建，后者记录仍未观察到的运行。社区报告也可以和待硬件验证（Pending Hardware Verification）并存，直到维护者在基准环境（Reference Environment）中复现。

## 五个受控标签

### 编译已检查（Compile-Checked）

只有要求的源代码实际构建成功，并记录精确 Toolkit Lane、C++ 方言、目标、命令和观察到的构建环境，才能使用。NVIDIA 的 `nvcc` 文档把编译、生成 PTX/CUBIN 和运行列为不同阶段；完成编译阶段不等于执行了程序。

跳过、阻塞或失败的任务不能授予此状态。网页 CI、仅主机端工具、浏览器模型和一句“应该能编译”也不能授予此状态。

### 社区已观察（Community-Observed）

第三方报告必须包含完整环境清单（Environment Manifest）、日志或产物、明确的正确性/观察标准以及观察日期。它记录社区确实观察到什么，但不冒充维护者复现。

### 运行已验证（Runtime-Verified）

必须在已经声明、由维护者控制的基准环境（Reference Environment）中执行，保存完整环境清单，并满足预先写明的正确性和观察标准。还要记录验证日期和支持证据。候选机器、缺字段的记录、编译结果或社区报告都不够。

### 待硬件验证（Pending Hardware Verification）

当验收需要 GPU 行为，而合格的运行证据还不存在时使用。它不能被“预期可用”、虚构输出、推测加速比或编译成功替代。

### 无需运行验证（Runtime-Not-Applicable）

只有验收条件要求编译或检查产物、完全不要求 GPU 行为时使用。它不能用来隐藏本来应该验证的运行正确性或性能观察。

## 一个可重复的判断顺序

1. 先写清对象和验收条件：源代码、实验（Lab）、构建产物还是浏览器解释器？
2. 问“实际构建成功了吗？”如果没有，就不要写 Compile-Checked。
3. 问“验收是否要求 GPU 行为？”如果不要求，运行轴才可能是 Runtime-Not-Applicable。
4. 如果要求运行，检查是谁运行、在哪里运行、环境清单是否完整、标准是否满足。
5. 把预期观察和已记录观察放在不同字段；没有合格日志时，已记录观察保持为空。
6. 给结论加上 GPU、驱动、Toolkit、组件、工作负载和方法边界，不外推到未测试坐标。

## 六个假设案例

下表只用于练习（Exercise）分类。**示例输出：预期，不是已记录观察。** 本页没有执行 CUDA，也没有由这些案例获得任何状态。

| 案例 | 已知事实 | 正确分类 | 不能声称什么 |
| --- | --- | --- | --- |
| O02-CASE-A | 声明的 Lane 构建成功；活动还要求 GPU 正确性，但没有运行 | `Compile-Checked + Pending Hardware Verification` | 不能写 Runtime-Verified |
| O02-CASE-B | 构建成功；在已声明 Reference Environment 中运行，完整 manifest 和标准均满足 | `Compile-Checked + Runtime-Verified` | 结果不能外推到未测试环境 |
| O02-CASE-C | 验收只要求构建并检查生成的 PTX，不要求 GPU 行为；构建和检查均成功 | `Compile-Checked + Runtime-Not-Applicable` | 不能把 PTX 检查写成运行结果 |
| O02-CASE-D | 社区提交完整 manifest、日志和日期；维护者尚未复现 | `Community-Observed + Pending Hardware Verification` | 不能写维护者 Runtime-Verified |
| O02-CASE-E | 容器仓库不可用，编译任务被阻塞 | 无 Compile-Checked；若活动需要运行则仍为 Pending Hardware Verification | 阻塞不是通过 |
| O02-CASE-F | 浏览器模型和网页质量测试全部通过 | 无 CUDA Evidence Status | 浏览器交互不是 CUDA 执行 |

## 离开前检查

1. 为什么 Compile-Checked 和 Pending Hardware Verification 可以同时出现？
2. Community-Observed 需要哪些材料，为什么它不会自动变成 Runtime-Verified？
3. 什么条件下才能使用 Runtime-Not-Applicable？
4. 为什么预期输出必须和已记录观察分开？

## 继续练习

- 完成 [O02 练习](/start/evidence-status/exercises/)，再到独立的[参考解答](/start/evidence-status/solutions/)复核。
- 在[练习题库（Practice Bank）](/practice/)完成 PB-R0-001，练习修复混乱的状态声明。
- 阅读 [O03：读懂环境清单](/start/environment-manifest/)，学习给证据加上可解释的环境坐标。

## 来源与边界

状态名称和授予规则是本站的原创教学合同。编译与运行阶段的区分依据 NVIDIA CUDA Compiler Driver 13.3.1 的[受支持阶段](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases)，链接于 **2026-08-24** 复核。完整来源坐标见[来源与版本记录](/sources-and-versions/)。

**事实核查日期：2026-08-24。** 本页没有运行 CUDA，没有记录性能数字，也没有授予 Compile-Checked、Community-Observed 或 Runtime-Verified。
