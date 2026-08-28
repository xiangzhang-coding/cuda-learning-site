---
title: 'M05 练习：按作用域选择同步'
description: 用三道静态任务分类 synchronization obligations、修复 publication protocol，并选择最窄的合法 coordination scope。
pairId: m05-exercises
counterpart: /en/memory/synchronization-scopes/exercises/
factCheckDate: '2026-08-28'
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
unitId: M05-EXERCISES
prerequisites:
  - M05
relatedUnits:
  - M05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m05-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M05 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: M05 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/synchronization-scopes/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M05：同步作用域与内存可见性](/memory/synchronization-scopes/)。这些练习只使用 static participant table、ordering graph 与 proof obligation，不需要 CUDA-capable system。

## 作答方法

对每条 communication edge 写出 participants、location、progress、rendezvous、ordering/visibility 与 atomicity。不要凭 source proximity 或习惯选择 primitive。独立完成后再查看[参考解答](/memory/synchronization-scopes/solutions/)。

## 练习 1：分类保证，不混为一谈

**目标：** 对 `__syncwarp(mask)`、`__syncthreads()`、device-scope relaxed atomic increment 与 device-scope memory fence，分类 participant scope，并判断各自是否提供 rendezvous、ordering、visibility 或 atomicity。

**约束：** 只标记“该 operation 的文档明确提供”的保证；把 warp mask 当作 participant contract；不得声称 fence 会 signal completion，也不得声称 barrier 会让所有 update 变成 atomic。

**预期证据：** 一张四行 guarantee matrix，每个勾选或留空的 cell 都有一句理由。

**验收条件：** Matrix 分开四类 guarantee，逐行命名 participants，把 relaxed atomic increment 标为 atomic 但不虚构 payload ordering，并明确 fence 不是 rendezvous。

<details><summary>提示 1</summary>询问 peer 是否必须执行同一 operation，caller 才能继续。</details>

<details><summary>提示 2</summary>Atomicity 描述一次 access；ordering 可以连接不同 locations。</details>

## 练习 2：修复 payload publication proof

**目标：** 修复这段 device-wide claim：“Producer 写 `payload`，调用 `__threadfence()`；fence 已告诉 consumer 生产完成，所以 consumer 可以读 `payload`。”

**约束：** Producer 与 consumer 保持在不同 blocks；使用 global payload 与 publication flag；说明双方所需 scope 和 ordering，但只写 protocol pseudocode，不写 runnable CUDA。

**预期证据：** Producer/consumer happens-before graph、原 claim 缺失 guarantee 的清单，以及带 explicit publication/observation 的修复 pseudocode。

**验收条件：** 答案指出 fence 本身不 notify consumer；给出 device-scope release/acquire publication relation 或等价 documented protocol；payload write 位于 publication 前；payload read 不得早于 observation。

<details><summary>提示 1</summary>Consumer 需要一个可观察的 value，而不只是 producer 执行过某个 operation。</details>

<details><summary>提示 2</summary>在 ordering graph 中把 payload 与 flag 分成两行。</details>

## 练习 3：为四种场景选择作用域

**目标：** 为四种 conceptual case 选择最窄 candidate coordination scope：named lanes 交换值；一个 block 消费 shared tile；blocks 发布 global results，另一个 kernel 在 explicit host boundary 后消费；CPU 通过 system-accessible memory 消费数据。

**约束：** 在 warp、block、device 与 system 中选择，并说明额外 ordering、accessibility 或 progress condition；不能为 ordinary blocks 推断 grid-wide barrier，也不能认为“最宽”就必然正确。

**预期证据：** 四份完整 six-field scope ledger；每种场景都拒绝一个过窄 scope，并说明原因。

**验收条件：** 每个 choice 包含所有 named participants；shared-tile case 保持 block scope；cross-kernel publication 命名 explicit boundary；CPU case 验证 system accessibility 与 system-scope support；任何答案都不依赖 assumed block scheduling。

<details><summary>提示 1</summary>先圈出距离最远的 producer 与 consumer。</details>

<details><summary>提示 2</summary>Scope 即使包含 participants，也可能仍缺 rendezvous 或 publication mechanism。</details>

## 下一步

完成后查看独立的[参考解答](/memory/synchronization-scopes/solutions/)，再到[练习题库（Practice Bank）PB-R1-017](/practice/#pb-r1-017)分类另一份错误协议。
