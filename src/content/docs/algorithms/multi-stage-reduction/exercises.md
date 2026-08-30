---
title: 'A02 练习：跟踪 Reduction Stages 与 Operation Order'
description: 用三道任务跟踪 multi-stage partials、修复 conditional barrier，并为 floating-point order 与 CUB production baseline 写决策合同。
pairId: a02-exercises
counterpart: /en/algorithms/multi-stage-reduction/exercises/
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
unitId: A02-EXERCISES
prerequisites:
  - A02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a02-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/multi-stage-reduction/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A02 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/multi-stage-reduction/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [A02：多阶段归约、屏障与运算顺序](/algorithms/multi-stage-reduction/)。这组练习（Exercise）把多阶段归约（multi-stage reduction）当作静态 phase proof；不要求 GPU，不把 expected reasoning 记作 runtime observation。

## 作答方法

每个 stage 都提交 `lane role -> reads -> write -> barrier participation`。跨 block 时另画 global partial array 与下一次 kernel launch。先独立完成，再查看[复核解答](/algorithms/multi-stage-reduction/solutions/)。

## 练习 1：跟踪两个 blocks 与最终 partial

**目标：** 对整数 inputs `1..13`、每个 block 8 lanes 的 sum reduction，跟踪第一 kernel 的两个 blocks 和第二 kernel。每个 block 使用 shared slots、identity 0 与 strides `4, 2, 1`。

**约束：** Edge block 的 invalid lanes 写 0；初始 load 后和每个 combine stage 后所有 8 lanes 都到达 barrier；inactive lanes 不 combine 但不 return；每个 block 只向 global partial array 写一个 value。

**预期证据：** 两份 lane/stage tables、每个 barrier 的 participant count、第一 kernel 的 partial array，以及第二 kernel 的最终 tree。

**验收条件：** 第一个 block partial 是 36，第二个是 55，下一 kernel 得到 91；edge shared slots 是 `[9,10,11,12,13,0,0,0]`；每个声明的 barrier 有 8 participants；没有 invalid lane 读越界 input。

<details><summary>提示 1</summary>Stride 4 时 lane 0 组合 slots 0 和 4，lane 1 组合 1 和 5，以此类推。</details>

<details><summary>提示 2</summary>第二个 block 的第一轮 partials 是 `[22,10,11,12]`。</details>

## 练习 2：修复 inactive-lane early return 与 conditional barrier

**目标：** 修复下面的错误 phase skeleton，并逐项说明修复了什么 hazard。

```text
if global_index >= n: return
shared[tid] = input[global_index]
for stride = block_size / 2 down to 1:
  if tid < stride:
    shared[tid] = shared[tid] + shared[tid + stride]
    __syncthreads()
```

**约束：** 保留 bounds handling；使用 operation identity；所有 block threads 执行同一 barrier sequence；barrier 不得位于 active predicate 内；不得用 warp-synchronous assumption、atomic 或 grid-wide busy wait 替代 block proof。

**预期证据：** 修复后的 pseudocode、before/after control-flow graph，以及对 out-of-bounds read、uninitialized slot、barrier nonparticipation 和 next-stage stale read 的解释。

**验收条件：** Invalid input lane 写 identity；初始 barrier 发布完整 shared array；每轮只有 active lanes combine、所有 lanes 随后 barrier；无 return 穿过 barrier region；lane 0 只在最后 stage 完成后提交 block partial。

<details><summary>提示 1</summary>把 bounds branch 从 control-flow exit 改成 value selection。</details>

<details><summary>提示 2</summary>Active predicate 只包 combine，不包紧随其后的 barrier。</details>

## 练习 3：声明 floating-point order 与 production decision

**目标：** 对 values `[1e20f, 1.0f, -1e20f, 1.0f]` 写出 serial left fold 和 adjacent-pair tree 的 parentheses，解释 rounding 可能产生的差异，并为 CUB `DeviceReduce` 与 hand-written teaching reduction 写一份 production comparison plan。

**约束：** 区分数学实数结果、binary32 expected reasoning 和实际 observed result；在运行前声明 reference 与 tolerance；CUB `DeviceReduce` 必须是 production baseline，手写版本只用于学习理解或经证据支持的特殊需求；不得复制 CUB implementation 或声称 speedup。

**预期证据：** 两个 parenthesized expressions、一份 rounding ledger、一张 correctness/evidence decision table，以及列出 Environment Manifest 和 measurement boundary 的 plan。

**验收条件：** 答案指出 tree 与 serial operation order 不同；不把合法 rounding variation 当成自动通过；先验证两条 paths 的 acceptance contract；把 CUB 放在 custom benchmark 之前；没有未观察的 performance number 或结论。

<details><summary>提示 1</summary>先分别考虑 `1e20f + 1.0f` 和 `-1e20f + 1.0f` 的小量是否保留。</details>

<details><summary>提示 2</summary>Production decision 的第一行应是 correctness parity，而不是 timing。</details>

## 下一步

完成三题后查看独立的[复核解答](/algorithms/multi-stage-reduction/solutions/)，再用 [VIS10](/visuals/reduction-stages/)检查 tree variant。需要正式 numerical acceptance 时继续 [Q02](/correctness/floating-point-order-reproducibility/)。
