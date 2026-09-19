---
title: 'G04 练习：核对参与者与结果'
description: 修复集合通信契约，设计独立的逐 rank 参考检查。
pairId: g04-exercises
counterpart: /en/multi-gpu/nccl-communicators-collectives/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, contract, oracle, review]
resourceKind: exercise-set
unitId: G04-EXERCISES
prerequisites: [G04]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL collective API', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/api/colls.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,contract,oracle,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G04 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-communicators-collectives/exercises/" lang="en">Read the English counterpart</a>

## 先修与作答要求

精确先修 **[G04]**：[通信器与集合通信](/multi-gpu/nccl-communicators-collectives/)。来源复核：[SRC-CUDA-097](/sources-and-versions/#src-cuda-097)，2026-09-19。纸面任务无需 GPU。可选 EX24 执行须满足其完整原生 Linux、NCCL 2.31.2／CUDA 13.3.1 双 GPU 门槛与环境清单（Environment Manifest）；没有合格证据时仍待硬件验证（Pending Hardware Verification）。

## 练习一：修复参与者步骤表

**目标：** 修复一个虚构双 rank 程序。两个 rank 都选择设备 0。Rank 0 以 count 1028、`ncclInt32` 调用 all-reduce；rank 1 以 count 257、root 0 调用 reduce。各分配只容纳 257 个 int32。

**约束：** 保留“每个 rank 都得到总和”的意图；使用不同完整 GPU；count 以元素计。不要运行这个不匹配程序。提交通信器成员、rank／设备映射、数据类型、操作顺序、缓冲区长度与结果放置。

**验收：** 各行使用匹配的 all-reduce，count 257、无 root，每个 rank 的发送／接收分配各 1028 字节，rank 与设备一一对应，检查全部输出。解释返回码为何不能替代参与匹配。

<details><summary>提示一</summary>1028 是字节长度，不是 int32 元素数。</details>
<details><summary>提示二</summary>即使算术相同，reduce 和 all-reduce 的结果放置也不同。</details>

## 练习二：发现遗漏或陈旧的 rank

**目标：** 推导 EX24 参考公式，设计能发现缺失 rank 贡献和陈旧输出的变异检查。

**约束：** 使用 R=2、R=4，计数 1、257，有符号输入与全元素比较。把手算预期与未来 GPU 日志分开；不声称延迟或算法。

**验收：** 推导 R=2/i=0 的 -7 与 R=4/i=16 的 62。解释所有 rank 共用常数输入为何诊断能力较弱。对不匹配、缺少 GPU、异步错误或超时规定非零进程状态；没有硬件时已记录观察为空。

<details><summary>提示一</summary>分别求和依赖 rank 的项与依赖索引的项。</details>
<details><summary>提示二</summary>Rank 0 数组正确，不能说明另一个未检查的接收数组正确。</details>

## 独立复核

完成两题后阅读[解答](/multi-gpu/nccl-communicators-collectives/solutions/)，再审查 [PB-R6-004](/practice/#pb-r6-004)。
