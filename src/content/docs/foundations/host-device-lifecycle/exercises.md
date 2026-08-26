---
title: 'F04 练习：审查显式 host-device 生命周期'
description: 用三道深入练习复核生命周期顺序、失败路径所有权和 GPU 证据边界。
pairId: f04-exercises
counterpart: /en/foundations/host-device-lifecycle/exercises/
factCheckDate: '2026-08-26'
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
unitId: F04-EXERCISES
prerequisites:
  - F04
relatedUnits:
  - F04
  - O04
  - EX03
exampleIds:
  - EX03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F04,O04,EX03' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/host-device-lifecycle/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F04：显式 host-device 资源生命周期](/foundations/host-device-lifecycle/)。三道练习（Exercise）都可以通过静态审查完成；没有真实 GPU 运行就不得填写运行观察。

## 作答方法

先提交自己的资源账本、修复方案或证据矩阵，再按顺序打开提示。需要核对实现时，从[固定提交中的 EX03 canonical project](https://github.com/xiangzhang-coding/cuda-learning-site/tree/b5d0dab070946eedc41e2bfe0106b67d8c01706b/examples/ex03-multidimensional-indexing)开始；不要从 Learning Unit 拼接第二份完整程序。答案在独立的[参考解答页](/foundations/host-device-lifecycle/solutions/)。

## 练习 1：重建顺序与最后使用边界

一份 review note 把九个动作打乱为：D2H copy-back、release device output、初始化 host data、kernel launch、分配 device buffers、host comparison、H2D transfer、`cudaDeviceSynchronize`、`cudaGetLastError`。

**目标：** 恢复 canonical 成功路径，并为 host input、device input、device output 和 host output 标出 owner、首次可用状态、最后使用和 release 责任。

**约束：** 必须保留全部九个动作；不能用“运行后看结果”决定顺序；必须明确 `cudaMalloc` 不初始化 storage；不得把 pointer value 与 allocation 合并成同一个 resource。

**预期证据：** 一张按顺序排列的 lifecycle ledger，至少包含 action、owner、state before、state after、last use 和 cleanup obligation 六列，再附四句话解释四类资源。

**验收条件：** 顺序严格为 host 初始化、device 分配、H2D、launch、`cudaGetLastError`、`cudaDeviceSynchronize`、D2H、host comparison、release；三个 last-use 边界正确；comparison verdict 在 cleanup 前保存、cleanup 后返回。

<details><summary>提示 1</summary>先找出三条生产者关系：host 初始化生产 H2D source，kernel 生产 device output，D2H 生产 host comparison input。</details>

<details><summary>提示 2</summary>同步成功时可以确认 device input 的 last use 已结束；D2H 成功时可以确认 device output 的 last use 已结束；host output 的 last use 在 comparison。</details>

## 练习 2：设计部分失败也安全的 cleanup

假设 EX03 需要三个 device allocation。前两个 `cudaMalloc` 成功，第三个失败；另一个 success-path defect 会在 host comparison 发现 mismatch 时立即 return，跳过 cleanup。

**目标：** 设计一份控制流修复方案，使 acquisition、use、comparison 和 release 在成功与失败路径上都满足 ownership 与 last-use 规则。

**约束：** 只 release 已成功取得的 allocation，每项恰好一次；失败之后不得执行依赖该结果的 copy、launch 或 comparison；成功路径仍保持 F04 的九步顺序；不引入 stream、managed memory 或新的发布实现。

**预期证据：** 一张包含 allocation 1/2/3、launch、sync、copy-back、comparison 和 cleanup 的路径表，以及 review-only pseudocode 或结构化步骤；标出每个失败点跳向哪个 cleanup state。

**验收条件：** 第三个 allocation 失败时只释放前两个；launch 或 sync 失败时不执行 D2H/comparison；comparison 先保存 verdict 再进入 cleanup；所有返回都发生在 cleanup 之后；方案可以对照 EX03 `lifecycle` range 复核。

<details><summary>提示 1</summary>给每个 allocation 一个“尚未取得/已取得/已释放”状态，比根据 pointer 是否看起来非空更容易审查。</details>

<details><summary>提示 2</summary>可以使用单一 cleanup block，也可以使用显式 owner；两者都必须让 mismatch verdict 与资源释放解耦。</details>

## 练习 3：修复一组越界证据声明

Review packet 包含三句话：“host-only tests 通过，所以 kernel 已正确运行”“源码编译成功，所以 runtime 已验证”“静态生命周期表展示了顺序，所以表中每个 API 都已执行”。Packet 没有 GPU 日志或 Reference Environment 记录。

**目标：** 把每句话拆成 subject、实际 evidence、允许的 claim、禁止的 inference 和仍为空的观察字段，并给 EX03 与 F04 分别写出正确状态。

**约束：** 不虚构命令、输出、日期、硬件或性能；host-only test 只覆盖实际运行的 host contract；编译事实与 runtime 分轴；静态教学表不获得 CUDA Evidence Status。

**预期证据：** 一张三行 claim-review matrix，加两句最终状态：一句针对 EX03，一句针对 F04 Learning Unit。

**验收条件：** 三条原声明都被收窄；EX03 保留 Pending Hardware Verification；F04 的 compilation/runtime axes 保持为空；明确只有满足声明环境和验收标准的实际 GPU execution 才能提供 runtime observation，并且没有性能推断。

<details><summary>提示 1</summary>先问每个 artifact 实际执行了什么：host code、compiler，还是 GPU kernel。</details>

<details><summary>提示 2</summary>Evidence Status 属于具体 subject。不要把 EX03 的 Pending Hardware Verification 复制给 Learning Unit。</details>

## 下一步

先独立完成三道题，再对照[参考解答](/foundations/host-device-lifecycle/solutions/)。随后到[练习题库（Practice Bank）PB-R1-008](/practice/#pb-r1-008)审查一份更长的 lifecycle record。
