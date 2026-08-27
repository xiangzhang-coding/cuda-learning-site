---
title: 'M01 练习：签发内存对象责任合同'
description: 用三道静态任务分类 CUDA 对象的 owner、scope、lifetime、physical location 和 matching release，并拒绝 cache 与 register-placement 猜测。
pairId: m01-exercises
counterpart: /en/memory/address-spaces/exercises/
factCheckDate: '2026-08-27'
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
unitId: M01-EXERCISES
prerequisites:
  - M01
relatedUnits:
  - M01
  - VIS06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m01-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M01 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M01,VIS06' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/address-spaces/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M01：地址空间、所有权、作用域与生命周期](/memory/address-spaces/)。三道练习（Exercise）只要求静态分类、伪代码审查和 source record；不需要 CUDA-capable system，也不能产生 compilation、runtime 或性能 Evidence Status。

## 作答方法

每题先写 owner/allocation、accessibility/scope、lifetime、physical location 和 release，再写允许的最窄结论。独立完成后再打开提示和[参考解答](/memory/address-spaces/solutions/)。

## 练习 1：完成六对象 ledger

**目标：** 分类以下对象：host `std::vector<float>`、`cudaMalloc` buffer、module-scope `__constant__` coefficients、per-block `__shared__` tile、kernel 内 variable-indexed local array，以及一个可能分配到 register 的 scalar accumulator。

**约束：** 每行必须分开记录 creator、可访问者、共享实例 scope、有效终点、physical location、release owner/action 和仍由 compiler/device 决定的事实；不得按速度排序；不得把 source declaration 当成 register placement 证据。

**预期证据：** 一张六行、至少七列的 object ledger，以及每行一句“已知”和一句“未知”。

**验收条件：** Global buffer 的 release 是完成最后使用后的 `cudaFree`；constant symbol 不用 `cudaFree`；每个 block 有独立 shared instance；local 与 register 都是 thread-private；local physical location 是 device memory；accumulator 的最终 register/spill placement 保持未知。

<details><summary>提示 1</summary>把 source-level visibility 与 physical location 放在不同列。</details>

<details><summary>提示 2</summary>“自动结束”也是 release contract，但不是一个 API call。</details>

## 练习 2：修复错误的 release plan

**目标：** 审查这份 plan：“launch 后立即 `cudaFree(d_data)`；host 随后释放 kernel 的 shared tile；每个 thread 用 `cudaFree` 释放 local array；constant symbol 在每次 block 完成时释放。”

**约束：** 必须逐句指出错误的 owner、lifetime 或 completion assumption；修复版必须保留 F04 的 launch/error/completion boundary；不得假设 default-stream timing 自动证明所有 use 已完成。

**预期证据：** 原句到 violated contract 的映射，以及按 allocation、last use、completion proof、release 排序的新 plan。

**验收条件：** 只有显式 global allocation 使用 `cudaFree`；release 发生在其最后可能使用者完成后；shared/local 自动随 block/thread execution 结束；constant 由 module/context 生命周期管理；答案不制造 host 可释放的 shared/local pointer。

<details><summary>提示 1</summary>先圈出真正返回给 host 的 allocation handle。</details>

<details><summary>提示 2</summary>“kernel launch 已返回”与“kernel 已完成”不是同一个事实。</details>

## 练习 3：把 placement claim 改写成可复核合同

**目标：** 修复三句断言：“所有 scalar 都在 register”“local memory 是最快的 per-thread cache”“shared memory 容量和 L1 比例在所有 GPU 上相同”。

**约束：** 每句必须分成稳定语义、selected-environment query/compile fact 和需要 measurement 才能回答的问题；引用 M01 的 owner source 范围；不得提供虚构容量、latency 或 speedup 数字。

**预期证据：** 三份 before/after record，每份包含 claim、缺失前提、合法改写和验证方法。

**验收条件：** 合法改写说明 register placement 由 compiler/resource pressure 决定且可能 spill；local 是 thread-private address space、物理位于 device memory，不是 cache level；shared capacity/cache configuration 按 architecture/device/kernel 查询；没有通用速度排序。

<details><summary>提示 1</summary>Compiler output 可以回答 placement，但 source spelling 不能。</details>

<details><summary>提示 2</summary>先写“语义不变”，再写“环境事实会变”。</details>

## 下一步

完成三份合同后，查看独立的[参考解答](/memory/address-spaces/solutions/)，再到[练习题库（Practice Bank）PB-R1-013](/practice/#pb-r1-013)复核另一份对象清单。
