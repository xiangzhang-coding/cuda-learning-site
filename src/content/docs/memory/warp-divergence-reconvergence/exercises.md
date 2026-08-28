---
title: 'M06 练习：用显式线程束掩码推理'
description: 用三道静态任务跟踪 branch masks、修复 implicit-lockstep exchange，并区分 source guarantee 与 unknown schedule。
pairId: m06-exercises
counterpart: /en/memory/warp-divergence-reconvergence/exercises/
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
unitId: M06-EXERCISES
prerequisites:
  - M06
relatedUnits:
  - M06
  - VIS03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M06 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M06,VIS03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/warp-divergence-reconvergence/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M06：分支发散、重汇合与线程束安全推理](/memory/warp-divergence-reconvergence/)。每题都是 static mask 或 dependency proof，不要求 GPU execution。

## 作答方法

先写 lane predicates，再写 masks；区分 current activity 与 intended participation；unknown schedule fact 必须标为 unknown。三题完成后再查看[参考解答](/memory/warp-divergence-reconvergence/solutions/)。

## 练习 1：跟踪两条 branch mask 与后续 collective

**目标：** 对 lanes 0 到 7 跟踪 `if (lane < 3) A; else B; C;`，再为 `C` 中需要全部八个 lanes 的 collective 定义 participant set。

**约束：** 展示 `A`、`B` 与 `C` 的 masks；不得断言 hardware 先 issue `A` 还是 `B`；不得从仅位于一个 arm 的 `__activemask()` 调用形成 all-lane participant set。

**预期证据：** 一张 eight-lane predicate table、三个 source-region masks、一个 intended participation mask，以及 unknown schedule facts 清单。

**验收条件：** 每个 lane 只属于一个 branch arm，之后回到 modeled common region；branch-local activity 与 all-lane collective set 保持分离；不虚构 path issue order。

<details><summary>提示 1</summary>先计算 lane predicate，再写任何 hexadecimal mask。</details>

<details><summary>提示 2</summary>Collective 的 intended members 来自 algorithm，而不是恰好调用 helper 的 branch。</details>

## 练习 2：修复 implicit-lockstep exchange

**目标：** 审查一个 warp：每个 lane 写 `shared[lane]`，lanes 1 到 7 随即读取 `shared[lane - 1]`，但没有 explicit synchronization。

**约束：** 第一种修复保留 shared memory，另给一份 register-exchange alternative；命名所有 participants 并 guard lane 0；不能把 “same warp” 当作 ordering guarantee。

**预期证据：** Missing-edge diagram、两种修复的 static pseudocode，以及 mask/source-lane proof obligations。

**验收条件：** Shared-memory repair 包含使用 valid mask 的 documented warp synchronization；alternative 使用 source lanes 合法的 documented collective；两者都不依赖 implicit lockstep。

<details><summary>提示 1</summary>先画 write -> synchronization -> read，再选 syntax。</details>

<details><summary>提示 2</summary>Lane 0 没有 predecessor，所以 participation 与 source validity 是两个问题。</details>

## 练习 3：区分 source fact 与 schedule guess

**目标：** 把关于 divergent `if/else` 的十条 statement 分类为 source guarantee、API guarantee 或 unknown implementation detail。

**约束：** Statements 必须覆盖 lane predicates、active masks、source-level join、memory visibility、path issue order、instruction interleaving 与 CC 7.0+ Independent Thread Scheduling；修正每条 false statement，但不添加 timing claim。

**预期证据：** 一张十行 classification table，以及每条 rejected statement 的 corrected wording。

**验收条件：** 答案说明 source-level join is not synchronization，把 exact path order 与 interleaving 标为 unknown，保留 per-lane scalar semantics，并要求 cross-lane data 使用 documented synchronization。

<details><summary>提示 1</summary>若 GPU implementation 改变某事实却不违反 programming model，该事实就不是 portable guarantee。</details>

<details><summary>提示 2</summary>Control-flow eligibility 与 memory visibility 应放在不同 columns。</details>

## 下一步

完成后查看独立的[参考解答](/memory/warp-divergence-reconvergence/solutions/)，审查[练习题库（Practice Bank）PB-R1-018](/practice/#pb-r1-018)，并在 [VIS03](/visuals/warp-divergence/)比较 masks。
