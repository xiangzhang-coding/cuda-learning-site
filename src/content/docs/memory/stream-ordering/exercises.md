---
title: 'M07 练习：绘制显式流顺序图'
description: 用三道静态任务推导 per-stream edges、消除 default-stream ambiguity，并分类 eligibility claims。
pairId: m07-exercises
counterpart: /en/memory/stream-ordering/exercises/
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
unitId: M07-EXERCISES
prerequisites:
  - M07
relatedUnits:
  - M07
  - M08
  - VIS07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M07,M08,VIS07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/stream-ordering/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M07：用流取代全局顺序心智模型](/memory/stream-ordering/)。所有任务只使用 static queue/dependency ledger，不提交 CUDA work。

## 作答方法

命名每个 stream，只添加 documented edges，并把 unordered pairs 标成 eligible 而非 concurrent。独立完成后再查看[参考解答](/memory/stream-ordering/solutions/)。

## 练习 1：找出缺失的 cross-stream edge

**目标：** 为 `stream_prepare: H2D(input) -> prepare_kernel` 与 `stream_consume: consume_kernel -> D2H(output)` 绘图，其中 `consume_kernel` 读取 producer result。

**约束：** 两者都是使用 `cudaStreamNonBlocking` 创建并明确命名的 non-default streams；自动加入 per-stream edges，但不得从 host submission order 虚构 edge；单独标记 required producer-consumer relation。

**预期证据：** 两条 stream lanes、全部 guaranteed edges、一项 missing-edge diagnosis，以及不含 runnable code 的 corrected dependency graph。

**验收条件：** Graph 分别 ordering 每条 lane；repair 前两 lanes 保持 unordered；识别 data hazard；只添加 consumer 真正需要的 cross-stream dependency。

<details><summary>提示 1</summary>先画两条 disconnected chains。</details>

<details><summary>提示 2</summary>即便 producer API call 在 host source 中更早，仍需 data-flow arrow。</details>

## 练习 2：消除 default-stream ambiguity

**目标：** 审查一个 sequence：`K1` 位于 `cudaStreamCreate` 创建的 stream，`K0` 位于 implicit default stream，`K2` 回到 named stream；随后用两个 explicitly named non-default streams 改写 ledger。

**约束：** 原 build 未声明 legacy/per-thread default-stream mode，不能静默选择；改写必须命名 stream flags 和 required cross-stream edges，并保持 conceptual。

**预期证据：** 一项 “insufficient configuration” diagnosis、两种 default-mode relationship sketch，以及一份 unambiguous rewritten graph。

**验收条件：** 答案把 default-stream mode 记录为 missing input，区分 `cudaStreamCreate` blocking stream 与 `cudaStreamNonBlocking`，并消除对 implicit global order 的依赖。

<details><summary>提示 1</summary>同一 source 在不同 compilation setting 下可以有不同 default-stream relationship。</details>

<details><summary>提示 2</summary>Explicit stream names 不会消除绘制真实 dependency 的需求。</details>

## 练习 3：分类 order、eligibility 与 evidence

**目标：** 把关于两个 named streams 的八条 claim 分类为 guaranteed order、unordered、eligible under the graph 或 unsupported execution claim。

**约束：** 覆盖 same-stream operations、有/无 edge 的 different-stream operations、host wait 与 side-by-side visual；不使用 duration 或 throughput values。

**预期证据：** 一张八行 classification table；每项 guarantee 指向 exact graph edge，unsupported claim 给出 corrected wording。

**验收条件：** 保留 same-stream order；edge-free cross-stream pairs 保持 unordered；不把 eligibility 写成 observation；visual 只作为 dependency model，不作为 execution evidence。

<details><summary>提示 1</summary>“May be eligible together” 弱于 “ran together”。</details>

<details><summary>提示 2</summary>每项 order claim 必须指向一条 edge，否则就拒绝。</details>

## 下一步

完成后查看独立的[参考解答](/memory/stream-ordering/solutions/)，修复[练习题库（Practice Bank）PB-R1-019](/practice/#pb-r1-019)，并在 [VIS07](/visuals/stream-event-dependencies/)比较 graph。
