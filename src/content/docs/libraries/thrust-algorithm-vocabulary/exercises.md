---
title: 'L02 练习：Thrust 算法与迭代器组合'
description: 把 pipeline 映射到 Thrust contracts、审查 virtual range，并在不写 untracked code 的前提下放置正确 stream completion edges。
pairId: l02-exercises
counterpart: /en/libraries/thrust-algorithm-vocabulary/exercises/
factCheckDate: '2026-09-04'
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
unitId: L02-EXERCISES
prerequisites:
  - L02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l02-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/thrust-algorithm-vocabulary/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L02 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/thrust-algorithm-vocabulary/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需完成 [L02](/libraries/thrust-algorithm-vocabulary/)。这些练习产出 static composition packets，不展示、编译或运行 CUDA/Thrust source。

## 作答说明

以 CCCL v3.4.2 作为 Toolkit 12.9.2/13.3.1 的 independent API coordinate，并保持 11.8 排除。在选择名称前声明每个 range、policy、stream、completion 与 numerical contract。打开[复核解答](/libraries/thrust-algorithm-vocabulary/solutions/)前独立作答。

## 练习 1：命名三阶段 pipeline

**目标：** 把“平方 `N` 个 FP32 values、生成 inclusive prefixes、再按 prefix stable-sort records”映射到 Thrust vocabulary 及 A01/A03/A09 contracts。

**约束：** 声明 unary transform input/output/overlap、scan operation/numerical acceptance、sorting key/value extents/strict weak ordering、stability、policy、stream 与 lifetime。不得写 source，也不得声称 backend、kernel count、fusion、traffic reduction 或 speedup。

**预期证据：** 三行 stage table、exact algorithm names、每行关联 Learning Unit、range contracts 与 evidence-boundary statement。

**验收条件：** 选择 `transform`、`inclusive_scan`、`stable_sort_by_key`；三个 stage extent 都是 `N`；floating-point scan 在 tolerance 下允许合法 parallel-order differences；key/value ranges 不 overlap；没有 execution result。

<details><summary>提示 1</summary>Equivalent prefix keys 的 records 必须保持输入顺序，因此选择 stable by-key name。</details>

<details><summary>提示 2</summary>Algorithm names 不会替代 A01 ownership、A03 prefix semantics 或 A09 movement/stability contracts。</details>

## 练习 2：审查 virtual segmented-key range

**目标：** 表示 indices `0..N-1`，把每个 index 映射为 `floor(index/4)`，并用 virtual keys 执行 scan-by-key，不存储 key array。

**约束：** 选择 current `cuda::` iterator vocabulary、unit-stride counting、value-returning transform 与 compatible device consumer。声明 extent、system、value/reference behavior 与 lifetime。拒绝 unequal zip extents，以及 issue #10965 覆盖的 optional-stride legacy counting form。

**预期证据：** Range graph、four-contract audit、materialized alternative，以及把 possible intermediate-storage avoidance 与 unmeasured fusion/performance 分开的 claim ledger。

**验收条件：** 使用 `cuda::counting_iterator` 与 `cuda::transform_iterator`；virtual keys 和 values 都覆盖 `N`；transform 返回 key value；selected system compatible；避免 key storage 是 logical composition fact，traffic、kernel count 与 speed 仍 unknown。

<details><summary>提示 1</summary>Transform iterator 继承 base range，并在 dereference 时计算 value。</details>

<details><summary>提示 2</summary>Virtual range 改变 representation；只有 artifact inspection 与 measurement 能建立 execution consequence。</details>

## 练习 3：在 no-sync work 周围放置 stream dependencies

**目标：** 排序 `par_nosync.on(streamA)` transform、same-stream scan、`streamB` consumer 与 host read。

**约束：** Same-stream work 使用 enqueue order，另一 stream 在消费前使用 event dependency。Host access/allocation release 前必须完成。把 `par_nosync` 解释为允许省略 optional synchronization，而非保证零同步。声明 asynchronous errors 可能在哪里暴露。

**预期证据：** Ordered event graph、resource-lifetime endpoint、host-read completion point，以及两种 invalid schedule 和解释。

**验收条件：** Stream A transform 通过 enqueue order 先于 scan；scan 后记录的 event 被 stream B wait；host read/deallocation 位于 required completion 后；不发明 global device synchronization；不声称 runtime observation。

<details><summary>提示 1</summary>Same-stream ordering 提供一条 edge，但不会排序提交到另一 stream 的 work。</details>

<details><summary>提示 2</summary>把 event 放在最后一个 producer 后，并让每个 referenced allocation 活到 final consumer 完成。</details>

## 下一步

打开[复核解答](/libraries/thrust-algorithm-vocabulary/solutions/)，然后完成 [PB-R4-002](/practice/#pb-r4-002)。
