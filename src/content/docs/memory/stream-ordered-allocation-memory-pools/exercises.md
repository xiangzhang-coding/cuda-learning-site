---
title: 'M11 练习：排列分配生命周期与内存池策略'
description: 对比 ordinary 与 same-stream-ordered lifetime，修复 multi-stream free，并复核 memory-pool controls，不虚构 address reuse 或 performance evidence。
pairId: m11-exercises
counterpart: /en/memory/stream-ordered-allocation-memory-pools/exercises/
factCheckDate: '2026-08-29'
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
unitId: M11-EXERCISES
prerequisites:
  - M11
relatedUnits:
  - M11
  - M09
  - M14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m11-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M11 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M11,M09,M14' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/stream-ordered-allocation-memory-pools/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M11：流顺序分配与内存池](/memory/stream-ordered-allocation-memory-pools/)。这些练习使用 static dependency/policy records，不需要 CUDA-capable system，也不产生 allocator observation。

## 作答方法

对每次 allocation 标出 allocation readiness、每个 stream 中的 first/last use 与 release boundary；把 ordinary host-call path 与 stream-ordered operations 分开。对每项 pool claim，分开 permitted policy 与 observed outcome。完成三题后再查看[参考解答](/memory/stream-ordered-allocation-memory-pools/solutions/)。

## 练习 1：对比 ordinary 与 same-stream lifetime

**目标（Goal）：** 把同一 initialize-and-consume workload 画两次：先使用 ordinary `cudaMalloc`/`cudaFree`，再使用同一 ordered `stream_work` 中的 `cudaMallocAsync`、两个 kernels 与 `cudaFreeAsync`。

**约束（Constraints）：** 两条 path 保持 logical input、两个 kernels 与 output oracle 不变。Ordinary path 要在 host release 前显示全部 asynchronous uses completion，并标出 broader synchronization boundary。Stream-ordered path 的四项 operations 必须位于同一 explicitly named stream，不得添加 device-wide synchronization。不得把 async pointer return 当作 allocation-operation completion。

**预期证据（Expected evidence）：** 一张 side-by-side lifetime table、async path 的一条 stream lane、logical usable intervals、host API return/stream execution labels，以及分别判定 readiness 前 use 与 release 后 use 的一句话。

**验收条件（Acceptance criteria）：** 两条 path 都把同样两个 kernels ordering 在 valid lifetime 内；ordinary path 在 `cudaFree` 前完成每个 asynchronous use；async kernels 在 allocation completion 后、execution reaches `cudaFreeAsync` 前执行；host return 不标为 async completion；没有 address 或 speed claim。

<details><summary>提示 1（Hint 1）</summary>Ordinary allocation/free calls 没有 caller-selected stream；把 host boundary 与 named work stream 分开画。</details>

<details><summary>提示 2（Hint 2）</summary>对 async path，把 pointer return 放在 lane 旁边；per-stream order 提供 required execution edges。</details>

## 练习 2：Free 前 join 每个 last use

**目标（Goal）：** 修复一张 graph：`stream_allocate` 分配 `ptr`，`stream_a`/`stream_b` 分别使用它，`stream_release` 释放它，但目前只有 `stream_a` 到 free 的 edge。

**约束（Constraints）：** 使用 event record/wait edges，不使用 host source order。两个 first uses 都必须 ordering 在 allocation completion 后；free 必须 ordering 在两个 last uses 后。除非 repair 需要 documented edge，否则两个 use streams 保持 unordered。

**预期证据（Expected evidence）：** 四条 stream lanes、一个 allocation-ready event state、每个 use stream 各一个 completion event、所有 wait edges，以及从 allocation 到每个 use、从每个 use 到 free 的 reachability table。

**验收条件（Acceptance criteria）：** 每个 first use 都有来自 allocation completion 的 path；free 有来自两个 last uses 的 incoming paths；不得因某个 host call 先出现就推断 use order；repaired graph 明确所有 accesses 都位于 logical lifetime 内。

<details><summary>提示 1（Hint 1）</summary>两个 consumers 需要同一 captured allocation prefix 时，一个 ready event 可以供多个 waits 使用。</details>

<details><summary>提示 2（Hint 2）</summary>Release stream 必须 join 两条 completion paths，不能选择一个 winner。</details>

## 练习 3：复核 pool controls，不作过度声明

**目标（Goal）：** 复核一项 proposal：创建 explicit pool，启用三个 reuse attributes，设置较大的 release threshold，然后断言“每次 allocation 都复用相同 address，program 也更快”。

**约束（Constraints）：** 分别判断 support gating、pool selection、每个 reuse policy、release threshold、pointer equality、footprint 与 performance。保留 valid configuration choice，同时删除 unsupported outcomes。

**预期证据（Expected evidence）：** 一张 policy matrix，命名 `cudaDevAttrMemoryPoolsSupported`、default/current 与 explicit selection、三个 reuse attributes、`cudaMemPoolAttrReleaseThreshold`，并列出每个 outcome claim 所需的 measurement。

**验收条件（Acceptance criteria）：** 设计在 allocator path 前检查 support；policies 被描述为 permissions；threshold 不称为 hard cap 或 exact retained-byte promise；拒绝 pointer equality guarantee；没有 workload measurements 时 speedup 保持 unknown。

<details><summary>提示 1（Hint 1）</summary>对 reuse attributes 问“allocator 可以考虑什么”；只有 real observation 才能回答“发生了什么”。</details>

<details><summary>提示 2（Hint 2）</summary>Pool caching 与 logical pointer lifetime 应位于 review 的不同 columns。</details>

## 下一步

查看独立的[参考解答](/memory/stream-ordered-allocation-memory-pools/solutions/)，再修复[练习题库（Practice Bank）PB-R2-003](/practice/#pb-r2-003)中的 longer allocation record。
