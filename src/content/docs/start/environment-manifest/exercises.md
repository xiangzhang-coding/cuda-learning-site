---
title: 'O03 练习：补全环境和测量记录'
description: 修复不完整 manifest、支持边界和性能测量计划。
pairId: o03-exercises
counterpart: /en/start/environment-manifest/exercises/
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
unitId: O03-EXERCISES
prerequisites:
  - O03
relatedUnits:
  - O03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/environment-manifest/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [O03：读懂环境清单](/start/environment-manifest/)，掌握环境清单（Environment Manifest）。练习（Exercise）使用假设记录，不需要 GPU 或尚未发布的后续代码与实验（Lab）。

## 作答方法

先写出可复核产物，再按需打开提示。完整答案在独立的[参考解答页](/start/environment-manifest/solutions/)。

## 练习 1：修复最小 manifest

**目标：** 把“RTX 4090、CUDA 13.3.1、vector add PASS”改造成完整的正确性 manifest 模板。

**约束：** 不得虚构任何具体值；未知坐标用待填写标记，并说明获取方法。GPU、compute capability、driver、Toolkit 和 component 必须分列。

**预期证据：** 一份字段齐全的模板和缺口清单。

**验收条件：** 覆盖 O03 的全部核心坐标；同时列出 NVCC 与 host compiler；有 exact command、correctness method/criteria 和 observation date；没有性能推断。

<details><summary>提示 1</summary>先按硬件、软件、工作负载、命令、正确性和日期分组。</details>

<details><summary>提示 2</summary>`nvidia-smi` 可能帮助查 GPU、driver 和 compute capability，但不能提供 Toolkit、NVCC、host compiler、命令或正确性方法。</details>

## 练习 2：修复支持边界

**目标：** 审查这句话：“NVIDIA 支持 WSL，所以本站也支持 WSL；任何 8 GB GPU 都属于完整层级。”

**约束：** 只能使用 O03 的 Supported Environment 和两个 GPU Capability Tier 定义。

**预期证据：** 两条更正和每条更正的理由。

**验收条件：** 明确原生 Linux 是唯一 Supported Environment；把上游产品支持与本站责任分开；层级同时考虑 compute capability、memory、count、features 和 permissions。

<details><summary>提示 1</summary>“可能运行”和“本站承担支持责任”不是一回事。</details>

<details><summary>提示 2</summary>Baseline 从 7.5 起且问题适配 8 GB；Modern 从 8.0 起且至少 8 GB。</details>

## 练习 3：扩展成性能 manifest

**目标：** 在完整正确性 manifest 上增加能够解释一次延迟比较的字段。

**约束：** 不生成任何 timing 或 speedup 数字；不得把一次样本当作统计结果。

**预期证据：** 一份测量附录，包含 baseline、hypothesis、clocks/power、warm-up、synchronization、timer/profiler version、statistics/sample method、result 和 interpretation boundaries。

**验收条件：** 正确性标准仍保留；测量工具有精确版本；同步点明确；结果字段目前为空并标为待观察。

<details><summary>提示 1</summary>先问比较对象是否使用同一 workload、shape 和 correctness method。</details>

<details><summary>提示 2</summary>GPU 工作通常异步；没有明确 synchronization，计时区间可能不包含真正执行。</details>

## 下一步

对照[参考解答](/start/environment-manifest/solutions/)，再到[练习题库（Practice Bank）PB-R0-002](/practice/)处理一份同时包含 manifest 和支持边界错误的记录。
