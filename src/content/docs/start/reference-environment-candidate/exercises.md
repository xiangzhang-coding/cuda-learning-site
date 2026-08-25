---
title: 'O08 练习：审查基准环境候选配置'
description: 分诊一套不完整候选配置，并复核错误的兼容性判断与过早声明。
pairId: o08-exercises
counterpart: /en/start/reference-environment-candidate/exercises/
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
unitId: O08-EXERCISES
prerequisites:
  - O08
relatedUnits:
  - O08
  - EX01
  - LAB01
exampleIds:
  - EX01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o08-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O08 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O08,EX01,LAB01' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX01 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/reference-environment-candidate/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [O08：准备基准环境候选配置](/start/reference-environment-candidate/)，掌握基准环境（Reference Environment）候选配置的审查门槛。这些练习（Exercise）只使用假设材料，不需要 GPU，也不记录机器观察或 CUDA 证据。

## 作答方法

把题目给出的每一行都当作未经验证的输入。打开提示 1 前先写出可复核产物；只有门槛仍不清楚时再看提示 2。不得虚构 version、query result、package、permission、log、maintainer action 或 baseline outcome。完整答案放在独立的[参考解答页](/start/reference-environment-candidate/solutions/)。

## 练习 1：分诊不完整候选配置

下面只是一份假设的接收记录（intake note），不是已观察的环境清单（Environment Manifest）：

```text
Host: native Linux
GPU: 16 GB
CUDA: 13.3
EX01: complete
Build: PASS
```

**目标：** 判断现有文字能说明什么、不能说明什么，再把它改造成采集与复核计划。

**约束：** 五行文字必须保留为未经验证的原始文字。不能推断 GPU identity、compute capability、GPU count、KMD、driver-supported CUDA API、Toolkit patch、component version、适用 tier、compatibility path、maintainer control 或 baseline success。兼容性初筛只能使用 `documented-path`、`not-documented` 和 `indeterminate`。

**预期证据：** 一张按 manifest、tier、compatibility、control 和 baseline 分组的缺口表，一份精确查询计划，以及声明判断。

**验收条件：**

- 要求 O08 的全部 manifest 坐标，包括 direct compute-capability query，以及相互独立的 KMD、driver-supported CUDA API、Toolkit 和 component 字段。
- 在必需坐标采集完成前，把 tier 与 compatibility 都标为 `indeterminate`。
- 要求单独指定 baseline，在执行前声明 correctness criteria，并在执行后保留日志。
- 明确目前没有声明任何 Reference Environment，EX01 输出、一次构建、`nvidia-smi`、compatibility 结果或社区报告都不足以声明。
- 不从这份 note 授予编译已检查（Compile-Checked）、社区已观察（Community-Observed）或运行已验证（Runtime-Verified）。

<details><summary>提示 1</summary>“16 GB”最多只能填写一个 memory 坐标。“CUDA 13.3”可能指 driver-supported API banner、Toolkit family，也可能只是非正式简称。</details>

<details><summary>提示 2</summary>先执行 `nvidia-smi --query-gpu=name,compute_cap --format=csv,noheader` 采集 direct query，再分别采集 KMD、CUDA UMD 或 `cudaDriverGetVersion()`、Toolkit、components、control 与仍未执行的 baseline protocol。</details>

## 练习 2：复核兼容性判断与声明尝试

复核第二份假设材料：

```text
KMD: 525.60.13
Toolkit: 13.3.1
Compatibility Explorer: documented-path
Community report: PASS
Declaration attempt:
  "The CUDA 12.x floor covers Toolkit 13.3.1,
   so this is now a Reference Environment and Runtime-Verified."
```

**目标：** 审核兼容性推理，再用诚实的证据判断与补全路径替换原声明。

**约束：** 只使用 O08 所列三条 Lane 事实：11.8.0 floor `450.80.02`、12.9.2 floor `525.60.13`、13.3.1 floor `R580` 或 `>= 580`。不能假设 system eligibility、forward-compatibility package、user-mode library selection、manifest completeness、maintainer control、baseline execution 或 community-report completeness。

**预期证据：** 一份带注释的兼容性判断、现有坐标对应的正确 explorer outcome、声明判断，以及仍需采集和运行验证的清单。

**验收条件：**

- 拒绝把 `525.60.13` 当成 CUDA 13.3.1 minor-version floor，并解释 same-major minor compatibility 为什么不能跨 CUDA 12.x 与 13.x 使用。
- 只有记录 eligible system、matching package、user-mode selection 和 feature restriction 后，才评估 forward-package path；在此之前保持 `indeterminate`。
- 说明即使以后得到 `documented-path`，仍需 runtime validation，且结果不授予 CUDA Evidence Status。
- 声明前要求完整 manifest、适用的 GPU 能力层级（GPU Capability Tier）、maintainer control，以及一项按预声明正确性标准成功的独立 baseline。
- 明确目前没有声明任何 Reference Environment，community `PASS` 不能让材料变成 Runtime-Verified。

<details><summary>提示 1</summary>Floor 属于一个 CUDA major family。跨 major family 会改变 compatibility 问题，不能借用旧 family 的 floor。</details>

<details><summary>提示 2</summary>Forward-compatibility package 按文档 eligibility 与 loading rule 提供指定 user-mode driver library；它不替换 KMD，也不会产生 maintainer control 或 runtime evidence。</details>

## 下一步

把产物与[参考解答](/start/reference-environment-candidate/solutions/)对照，再完成[练习题库（Practice Bank）PB-R1-005](/practice/#pb-r1-005)，不得把任何假设字段改写成观察。
