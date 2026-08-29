---
title: 'M12 练习：让同步组可组合'
description: 用三道静态任务规定 explicit helper contract，修复 tile collective participation/arguments，并 gate dynamic 与 grid-wide groups。
pairId: m12-exercises
counterpart: /en/memory/cooperative-groups/exercises/
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
unitId: M12-EXERCISES
prerequisites:
  - M12
relatedUnits:
  - M12
  - M13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m12-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M12-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M12 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M12,M13' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/cooperative-groups/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M12：协作组与可组合同步](/memory/cooperative-groups/)。这些练习产生 static group/launch contracts，不执行 collective，也不产生 CUDA Evidence Status。

## 作答方法

对每项 operation 写 handle、membership、scope 与 required participants。对 collectives，逐个复核 corresponding arguments。查看[参考解答](/memory/cooperative-groups/solutions/)前，分开 dynamic active-set discovery 与 cooperative grid launch 两个 boundaries。

## 练习 1：暴露 helper 的 group contract

**目标（Goal）：** 重新设计一个 device helper：原 helper 写一项 shared-memory value，并在 body 中隐藏 `__syncthreads()`；新 helper 应接受 explicit group handle，并说明 caller obligations。

**约束（Constraints）：** 在 call site 使用 `this_thread_block()`，把 handle 传入 helper。说明 membership、memory scope、leader selection 与哪些 block threads 必须调用。不得从 only part of block 到达的 branch 调用 helper。

**预期证据（Expected evidence）：** Helper signature、一个 call-site sketch、four-field group-contract table，以及显示 participation repair 的 before/after control-flow diagram。

**验收条件（Acceptance criteria）：** Handle explicit；`thread_rank()` 选择一个 leader；每个 block member 到达 group sync；sync complete 前不读取 shared memory；缺少 caller-participation clause 时不能把 helper 复核为 safe。

<details><summary>提示 1（Hint 1）</summary>把 synchronization scope 从 implicit intrinsic name 移到由 caller 提供 type/value 的 parameter 中。</details>

<details><summary>提示 2（Hint 2）</summary>除非每个 block member 都进入 branch，否则 branch condition 应位于 collective helper call 之后。</details>

## 练习 2：修复 partition 与 collective contracts

**目标（Goal）：** 修复以下代码：只有 `threadIdx.x < 32` 时才调用 `tiled_partition<32>(block)`，之后 returned tile 的一个 subset 使用不同 operation selectors 调用 `reduce(tile, value, op)`。

**约束（Constraints）：** Partition construction 必须对 parent block collective。Later reduce collective 必须对每个 participating tile uniform。允许 per-thread `value` inputs，但 group instance/reduction operation 必须按 contract agree。

**预期证据（Expected evidence）：** Parent-participation table、tile-membership map、一个 repaired control-flow sketch，以及 `tile`、`value`、`op` 的 argument matrix。

**验收条件（Acceptance criteria）：** 每个 parent-block member 到达 `tiled_partition`；调用 reduce 的 tile 中每个 member 到达同一 collective instance；`value` 可以因 thread 而异；group/operation 对 participants 一致；repair 不使用 assumed warp lockstep。

<details><summary>提示 1（Hint 1）</summary>先让 complete parent group partition，再使用 resulting handle 的 ranks branch。</details>

<details><summary>提示 2（Hint 2）</summary>“Same call”不代表“all arguments equal”；检查哪些 collective arguments 明确表示 per-thread contributions。</details>

## 练习 3：分开 dynamic set 与 gated grid

**目标（Goal）：** 复核两个 claims：“`coalesced_threads()` always returns the whole warp”与“`this_grid().sync()` works in an ordinary kernel launch”，并把两者替换成 complete、version-current contracts。

**约束（Constraints）：** 对 coalesced group 说明 construction point、dynamic membership 与 later divergence boundary。对 grid sync 包含 `cudaDevAttrCooperativeLaunch`、cooperative launch、grid-size/residency review 与 full-grid participation。把 archived multi-device APIs 标为 CUDA 13 中 non-current。

**预期证据（Expected evidence）：** Two contract cards、dynamic-membership timeline、host/device grid-launch checklist，以及 current 13.3/13.3.1 对比 12.9.1/11.8.0 archives 的 version table。

**验收条件（Acceptance criteria）：** 不给 `coalesced_threads` 分配 fixed 32-thread guarantee；later construction 可以有 different membership；拒绝 normal `<<<...>>>` launch 用于 grid sync；每项 launch gate 都存在；不把 multi-device Cooperative Groups synchronization 表述为 current CUDA 13 behavior。

<details><summary>提示 1（Hint 1）</summary>把 coalesced-group membership claim 绑定到 handle constructed 的 exact program point。</details>

<details><summary>提示 2（Hint 2）</summary>Grid handle 命名 scope；cooperative host launch 让它的 synchronization capability 有效。</details>

## 下一步

查看独立的[参考解答](/memory/cooperative-groups/solutions/)，再修复[练习题库（Practice Bank）PB-R2-004](/practice/#pb-r2-004)中的 combined participant/launch defects。
