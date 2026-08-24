---
title: 'O02 练习：分类和修复证据声明'
description: 用约束、分层提示和验收条件练习证据分类。
pairId: o02-exercises
counterpart: /en/start/evidence-status/exercises/
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
unitId: O02-EXERCISES
prerequisites:
  - O02
relatedUnits:
  - O02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O02 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/evidence-status/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [O02：诚实记录证据状态](/start/evidence-status/)，掌握证据状态（Evidence Status）。这些练习（Exercise）不需要 GPU，也不依赖尚未发布的后续示例或实验（Lab）；它们不会授予 CUDA 证据状态。

## 作答方法

先提交自己的分类和理由，再逐层展开提示。完整解答不在本页；作答后再打开[独立参考解答](/start/evidence-status/solutions/)。

## 练习 1：给混合记录分类

**目标：** 为四条记录分别填写编译轴、运行轴和仍缺少的材料。

**约束：** 只能使用 O02 的五个受控标签；不得把 blocked、网页测试或“expected”写成已观察证据。

**题目：**

1. 精确工具包通道（Toolkit Lane）的构建日志成功，活动要求 GPU 正确性，但没有运行日志。
2. 社区成员提交完整 manifest、输出日志、标准和日期；维护者没有对应机器。
3. 构建任务因镜像仓库超时而没有开始。
4. 验收只要求生成 PTX 并检查符号，不要求 GPU 行为；构建成功。

**预期证据：** 一张四行表，包含“编译状态、运行状态、依据、缺口”。

**验收条件：** 每行使用合法组合；第 2 行保留维护者待验证；第 3 行没有 Compile-Checked；第 4 行没有 GPU 执行断言。

<details><summary>提示 1</summary>先问“实际发生了构建吗”，再问“验收要求 GPU 行为吗”。</details>

<details><summary>提示 2</summary>社区观察和维护者待验证可以同时为真；Runtime-Not-Applicable 只取决于验收是否要求 GPU 行为。</details>

## 练习 2：拆开预期和记录

**目标：** 重写下面这句话，使它不再把计划、输出和性能推断混在一起：“程序应该输出 PASS，所以已经验证；新 GPU 大概快两倍。”

**约束：** 只能使用已给事实：没有构建日志、没有运行日志、没有 Environment Manifest、没有基线和计时方法。

**预期证据：** 四个独立字段：当前状态、预期观察、已记录观察、下一步证据。

**验收条件：** 已记录观察为空；没有速度数字；没有 Compile-Checked 或 Runtime-Verified；下一步同时覆盖构建与运行所需材料。

<details><summary>提示 1</summary>“应该”只能进入预期观察，不能进入已记录观察。</details>

<details><summary>提示 2</summary>性能结论还需要基线、同步、计时器、预热和统计方法；缺少这些就不要保留倍数。</details>

## 练习 3：审查状态升级请求

**目标：** 审查一份把 Community-Observed 升级成 Runtime-Verified 的请求。

**约束：** 报告有完整 manifest 和日志，也满足正确性标准；但执行者不是维护者，环境未被声明为 Reference Environment。

**预期证据：** 一个“接受/拒绝”决定、两条理由，以及可执行的升级条件。

**验收条件：** 不贬低社区报告；不把它误写成维护者复现；明确控制权、正式声明、完整 manifest、标准和日期缺一不可。

<details><summary>提示 1</summary>证据质量和证据主体是两个问题。</details>

<details><summary>提示 2</summary>保留 Community-Observed，并在维护者复现前继续保留 Pending Hardware Verification。</details>

## 下一步

完成后对照[参考解答](/start/evidence-status/solutions/)，记录自己的误判模式，再到[练习题库（Practice Bank）PB-R0-001](/practice/)做一次迁移练习。
