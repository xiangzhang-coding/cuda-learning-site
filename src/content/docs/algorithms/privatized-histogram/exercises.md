---
title: 'A04 练习：Atomic Correctness、Contention 与 Histogram Privatization'
description: 用三道任务追踪 lost update、证明 shared histogram phases，并设计不越过证据边界的 variant comparison。
pairId: a04-exercises
counterpart: /en/algorithms/privatized-histogram/exercises/
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
unitId: A04-EXERCISES
prerequisites:
  - A04
relatedUnits:
  - A04
  - EX13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'A04,EX13' }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/privatized-histogram/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [A04：私有化直方图（Privatized Histogram）](/algorithms/privatized-histogram/)。任务要求 exact count tables、phase ledger 与 measurement plan；不要求 GPU，也不产生 runtime evidence。

## 作答说明

每题分别标出正确性（correctness）、争用（contention）和证据（evidence）。不要用一个维度的结论替代另一个维度。

## 练习 1：找出 lost update，再恢复 exact count

**目标：** 两个 threads 同时把初值为 0 的同一 bin 增加 1。写出 plain read-modify-write 产生 lost update 的一种 interleaving，再写出 `atomicAdd` 的合法结果集合。

**约束：** Plain trace 必须包含两次 read 与两次 write；atomic trace 必须把每次 read-modify-write 视为不可分割操作；只讨论一个合法 bin；counter 不溢出。

**预期证据：** 两条 event timeline、最终 counter、以及一段把 atomic correctness 与 contention 分开的解释。

**验收条件：** Plain interleaving 可以从 0 得到错误结果 1；两次 `atomicAdd` 后 exact result 必须是 2；无论 atomic 顺序如何都不丢更新；不能由此断言低 contention 或更快。

<details><summary>提示 1</summary>让两个 plain reads 都在任何 write 之前发生。</details>

<details><summary>提示 2</summary>Atomic ordering 可以变化，但两个 increments 都必须出现在最终值中。</details>

## 练习 2：证明 privatized phase order

**目标：** 为 `bin_count = 10`、`blockDim.x = 4` 的 block-private shared histogram 写 pseudocode，覆盖 cooperative zero、first barrier、shared updates、second barrier 与 global merge。

**约束：** Zero 与 merge 都使用 stride loop；bounds-invalid sample thread 仍到达两个 barriers；shared update 与 global merge 都在可能冲突时使用 `atomicAdd`；不得假定 bins 数量等于 threads 数量。

**预期证据：** 一份五阶段 pseudocode、每个 lane 清零/合并的 bin list、以及两条 barrier happens-before statements。

**验收条件：** Lanes 0..3 分别覆盖 bins `0,4,8`、`1,5,9`、`2,6`、`3,7`；first barrier 位于所有 zero writes 与任一 update 之间；second barrier 位于所有 updates 与任一 merge read 之间；没有 early return 穿过 barrier region。

<details><summary>提示 1</summary>Stride loop 的索引是 `threadIdx.x + k * blockDim.x`。</details>

<details><summary>提示 2</summary>Invalid sample 只跳过 update，不跳过 phase boundary。</details>

## 练习 3：比较 distributions，但不预写 speedup

**目标：** 对 4 bins 的 `uniform = [0,1,2,3,0,1,2,3]` 与 `skewed = [0,0,0,0,0,0,0,0]`，计算 exact histogram、列出 global-atomic destination sequence，并为 direct 与 privatized variants 写 measurement plan。

**约束：** 两个 variants 必须使用相同 input 与 bin contract；先 exact-compare CPU/GPU outputs；计划声明 Environment Manifest、launch、warm-up 与 timing boundary；不得填写未观察的 timing、throughput 或 speedup。

**预期证据：** 两个 exact count vectors、两条 destination traces、一份 controlled-variable table 和三个可记录 observation fields。

**验收条件：** Uniform counts 是 `[2,2,2,2]`；skewed counts 是 `[8,0,0,0]`；skewed trace 识别 same hot bin；计划把 correctness gate 放在性能解释之前；结果栏保持未记录。

<details><summary>提示 1</summary>Destination sequence 描述 address concentration，不等于 timing result。</details>

<details><summary>提示 2</summary>至少记录 exact kernel variant、input fixture 与完整 Environment Manifest。</details>

## 下一步

完成后查看独立的[参考解答](/algorithms/privatized-histogram/solutions/)，再用相同 phase ledger 审查 EX13 `histogram-kernels`。
