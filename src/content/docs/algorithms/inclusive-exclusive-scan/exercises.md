---
title: 'A03 练习：Inclusive/Exclusive Scan 与 Multi-block Propagation'
description: 用三道任务推导 scan identity、stage snapshots，以及 block sums 到 block offsets 的传播合同。
pairId: a03-exercises
counterpart: /en/algorithms/inclusive-exclusive-scan/exercises/
factCheckDate: '2026-08-30'
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
unitId: A03-EXERCISES
prerequisites:
  - A03
relatedUnits:
  - A03
  - EX12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'A03,EX12' }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/inclusive-exclusive-scan/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [A03：包含式与排除式扫描（Inclusive and Exclusive Scan）](/algorithms/inclusive-exclusive-scan/)。这些任务只要求表格、invariant 和 pseudocode；不需要 CUDA-capable system，也不产生 runtime evidence。

## 作答说明

每题都要写出单位元（identity）、逻辑有效范围、阶段（stage）读取的快照和同步边界。先按 acceptance criteria 自查，再进入下一题。

## 练习 1：从一个输入同时推导两种 scan

**目标：** 对 addition input `[4, 1, 3, 2, 6]`，写出包含式扫描（inclusive scan）与排除式扫描（exclusive scan），并逐位置验证两条 recurrence。

**约束：** Identity 必须显式声明；保持输入顺序；使用足以容纳总和的 accumulator；不得只写最终 total。

**预期证据：** 一张包含 `i`、`x[i]`、inclusive、exclusive 的五行 table，两条 recurrence 检查，以及 `inclusive[i] = exclusive[i] + x[i]` 检查。

**验收条件：** Inclusive 是 `[4,5,8,10,16]`；exclusive 是 `[0,4,5,8,10]`；第一个 exclusive output 是 identity 0；五个位置都满足声明的 invariant。

<details><summary>提示 1</summary>Inclusive 包含 current input；exclusive 在读取 current input 之前输出 accumulator。</details>

<details><summary>提示 2</summary>先写 `exclusive[0]`，再逐项移动 recurrence。</details>

## 练习 2：构造 stage snapshot

**目标：** 对四个 lanes 的 input `[2, 5, 1, 4]`，用距离 1 与 2 的 staged inclusive scan 写出每个 stage 的 shared snapshot，并标出 barrier。

**约束：** 每个 stage 只能读取 prior-stage snapshot；说明使用两个 ping-pong buffers 或给出等价 snapshot mechanism；四个 lanes 都参加每个 barrier；不允许 lane 提前 return。

**预期证据：** `stage 0/1/2` 三行 lane table、一张 read-from/write-to buffer ledger，以及两个 stage boundaries 的 participation count。

**验收条件：** Snapshots 依次为 `[2,5,1,4]`、`[2,7,6,5]`、`[2,7,8,12]`；每次 combine 保持左到右顺序；每个 barrier 有四个 participants；没有同-stage read/write race。

<details><summary>提示 1</summary>距离 1 时，lane 0 没有 predecessor；距离 2 时，lanes 0 和 1 没有 predecessor。</details>

<details><summary>提示 2</summary>Barrier 分隔 snapshots，但 buffer ownership 才保证本 stage 只读旧值。</details>

## 练习 3：完成 multi-block offset propagation

**目标：** 一个长度 10 的 addition input 被分成 blocks `[3,1,2,4]`、`[5,2,1,3]`、`[6,7]`。写出 local inclusive scans、block sums、exclusive block offsets 和最终 global inclusive scan。

**约束：** 第三个 block 是 partial block；block offsets 必须按 block 顺序；第一 offset 是 identity；明确三次 kernel phases 之间的 boundaries；不得声明任何 speedup。

**预期证据：** 三张 local table、一个 sums-to-offsets table、propagation equation，以及最终 recurrence check。

**验收条件：** Block sums 是 `[10,11,13]`；offsets 是 `[0,10,21]`；最终结果是 `[3,4,6,10,15,17,18,21,27,34]`；partial block 只计两个合法元素；传播后每个位置满足 global recurrence。

<details><summary>提示 1</summary>Block offset 是前面所有 block sums 的 exclusive scan。</details>

<details><summary>提示 2</summary>先验证 local prefix，再把同一个 block offset 应用到该 block 的每个合法 output。</details>

## 下一步

完成后查看独立的[参考解答](/algorithms/inclusive-exclusive-scan/solutions/)，再把同样的 recurrence checks 应用于 EX12 `multi-block-scan`。
