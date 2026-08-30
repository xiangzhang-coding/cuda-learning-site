---
title: 'A01 练习：证明 Map Ownership 与数据移动'
description: 用三道任务建立逐元素 owner table、符号化 memory-movement ledger 和 grid-stride ownership proof。
pairId: a01-exercises
counterpart: /en/algorithms/elementwise-map/exercises/
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
unitId: A01-EXERCISES
prerequisites:
  - A01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a01-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/elementwise-map/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A01 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/elementwise-map/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [A01：逐元素映射与一元素一所有者](/algorithms/elementwise-map/)。这组练习（Exercise）要求你为逐元素映射（elementwise map）提交 owner table、符号化账本和证明；不需要 CUDA-capable system，也不产生 runtime 或 performance evidence。

## 作答方法

每题先写 contract，再写 expected reasoning。把“由 index 和 bounds 可证明”与“必须运行后才能观察”分栏记录。完成后再查看独立的[复核解答](/algorithms/elementwise-map/solutions/)。

## 练习 1：为 rounded-up grid 建 owner table

**目标：** 对 `n = 10`、`blockDim.x = 4`、`gridDim.x = 3` 的一维 launch，列出所有 12 个 threads 的 `blockIdx.x`、`threadIdx.x`、global index、bounds predicate 和 output action。

**约束：** 使用 `i = blockIdx.x * blockDim.x + threadIdx.x`；每个合法 element 必须恰有一个 owner；indices 10 和 11 不得 load 或 store；不得删去 extra threads，也不得加入 atomic 或 barrier。

**预期证据：** 一张 12-row owner table、一组 write sets，以及覆盖和唯一性的短证明。

**验收条件：** `output[0]` 到 `output[9]` 各出现一次且仅一次；global indices 10 和 11 的 predicate 为 false、action 为 skip；任意两个合法 threads 的 write sets 不相交。

<details><summary>提示 1</summary>先按 block 展开 local thread index，再计算 global index。</details>

<details><summary>提示 2</summary>Extra thread 仍被 launch；bounds predicate 只阻止它访问逻辑数组。</details>

## 练习 2：把 arithmetic 与 memory movement 分账

**目标：** 为 `output[i] = left[i] + right[i]` 写两个符号账本：场景 A 的两个 inputs 起初在 host 且 output 最终由 host 读取；场景 B 的 inputs 已在 device，output 被下一次 device kernel 消费。

**约束：** 只用 `n`、`sizeof(float)` 和 operation counts；分别列 H2D、kernel global load、kernel global store 与 D2H；不得把 requested values 写成 hardware transactions，也不得填写 timing、bandwidth 或 speedup。

**预期证据：** 两张 movement tables、一行 element arithmetic summary，以及解释两个场景数学 map contract 相同的段落。

**验收条件：** 场景 A 包含两个 input H2D copies、每个合法 element 的两个 loads 和一个 store、一个 output D2H copy；场景 B 不为本次调用虚构 H2D/D2H；两张表都把 transfer bytes 与 kernel value requests 分开。

<details><summary>提示 1</summary>场景 A 中每个完整 array 的符号大小是 `n * sizeof(float)`。</details>

<details><summary>提示 2</summary>Device residency 改变 lifecycle ledger，不改变 `output[i] = left[i] + right[i]`。</details>

## 练习 3：证明 grid-stride map 的 ownership

**目标：** 为 `n = 17`、总 launched threads 为 6 的 grid-stride map 写 pseudocode，并证明 `output[i] = 2 * input[i] + 1` 的每个合法 index 恰由一个 thread 处理。

**约束：** 初始 index 是 global thread index，stride 等于全部 launched threads；每轮先检查 `i < n`；列出每个 thread 的 index sequence；另外说明 `input` 与 `output` 完全相同地址时为什么这个特定 pointwise transform 可以原地执行。

**预期证据：** 六条 index sequences、一份 coverage/uniqueness proof、一个 in-place read-before-write contract，以及一个指出仍需 runtime validation 的 evidence boundary。

**验收条件：** 六条 sequences 的并集恰为 `0..16` 且交集为空；每次 iteration 只读写同一个 `i`；in-place 论证不依赖 thread execution order；答案不把 proof 当作 compilation、runtime 或 performance observation。

<details><summary>提示 1</summary>Thread `t` 处理 `t, t + 6, t + 12, ...` 中小于 17 的 indices。</details>

<details><summary>提示 2</summary>用除以 6 的 remainder 证明两个不同 threads 不会得到同一个 index。</details>

## 下一步

完成三题后查看独立的[复核解答](/algorithms/elementwise-map/solutions/)。若你随后运行自己的 kernel，请新建 Environment Manifest 和 correctness record；不要把本页的 expected evidence 改写成 observed evidence。
