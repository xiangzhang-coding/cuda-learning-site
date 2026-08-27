---
title: 'F08 练习：先证明 Launch Geometry 可行'
description: 用三道合同式任务检查二维 coverage、逐轴与 aggregate limits、安全算术、kernel resource 缺口和测量边界。
pairId: f08-exercises
counterpart: /en/foundations/launch-geometry/exercises/
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
unitId: F08-EXERCISES
prerequisites:
  - F08
relatedUnits:
  - F08
  - LAB03
  - VIS22
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f08-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F08 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F08,LAB03,VIS22' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/launch-geometry/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F08：Launch geometry 是先于速度的正确性与资源决策](/foundations/launch-geometry/)。三道练习（Exercise）只要求静态推理或 host/browser helper；没有真实 CUDA build、launch、结果验证和 Environment Manifest，就不要填写 GPU 运行或性能结论。

## 作答方法

每题都按合同提交：输入与选定 capability record、前置条件、逐项检查、只有成功时才存在的派生值、仍缺少的事实，以及允许写出的最窄结论。先独立完成，再打开提示和[参考解答](/foundations/launch-geometry/solutions/)。本单元没有 canonical example，不能从另一份程序反推答案。

## 练习 1：签发二维 launch-feasibility 记录

**目标：** 对 logical extent `1000 x 750`、`block = (32, 8)` 和以下选定 CC 7.5 record，判断 device-level launch geometry 是否通过，并计算完整 coverage ledger。

```text
maxThreadsDim.x = 1024
maxThreadsDim.y = 1024
maxThreadsPerBlock = 1024
maxGridSize.x = 2147483647
maxGridSize.y = 65535
```

**约束：** 先检查四个输入为正；分别检查 block.x、block.y 和 checked product；使用 `1 + floor((n - 1) / d)`；每个乘积必须在执行前检查；logical `width`/`height` 不得改成 rounded coverage；必须保留 kernel 的 `gx < width AND gy < height` 条件。

**预期证据：** 一张按顺序列出 input validity、axis limits、aggregate limit、grid shape、grid limits、coverage、block/grid products、launched threads、logical elements、fringe threads 和仍待核对 kernel resources 的表。

**验收条件：** 得到 block threads `256`、grid `(32, 94)`、grid blocks `3008`、coverage `1024 x 752`、launched threads `770048`、logical elements `750000` 和 fringe `20048`；只声明这些 device limits 通过；明确保留 function-specific max threads、register、static/dynamic shared memory 与实际 launch checks。

<details><summary>提示 1</summary>`ceil_div(1000, 32) = 32`，`ceil_div(750, 8) = 94`；coverage 不是新的 logical extent。</details>

<details><summary>提示 2</summary>先求 `3008 * 256` 与 `1000 * 750`，再相减；不要用浮点百分比代替整数 thread ledger。</details>

## 练习 2：实现 fail-closed 安全算术合同

**目标：** 为任意选定的无符号整数上限 `MAX` 写出 `parse_positive_decimal`、`checked_product(a, b, MAX)` 和 `ceil_div_positive(n, d)` 的伪代码或 host-only helper，并让无效输入不返回任何 grid、launch 或 fringe。

**约束：** Parse 必须拒绝空值、空格、符号、`0`、小数、指数和超过 `MAX` 的值；乘法必须在 `a * b` 前用除法式 guard；ceiling division 不能先计算 `n + d - 1`；任一失败必须传播为整体 invalid，而不是保留此前计算的部分 geometry。

**预期证据：** 三个 helper、一个按顺序调用它们的 planner、以及至少以下测试：`ceil_div_positive(MAX, 2)` 成功；`checked_product(MAX, 2, MAX)` 失败；`block = (1024, 2)` 在 axis limits 通过后因 aggregate 失败；`width = 0` 与 `block.y = "8.5"` 在算术前失败。

**验收条件：** Ceiling division 等价于 `1 + floor((n - 1) / d)`；product guard 等价于 `a > MAX / b` 时失败；四个反例得到正确状态；所有 invalid result 的 geometry 为 absent/null；没有 JavaScript `MAX_SAFE_INTEGER` 与 CUDA host 类型上限混用。

<details><summary>提示 1</summary>正整数前置条件让 `n - 1` 安全；这正是为什么 parse/validation 必须先发生。</details>

<details><summary>提示 2</summary>Planner 可以返回 discriminated result：`{ valid: false, issues, geometry: null }` 或 `{ valid: true, geometry }`。</details>

## 练习 3：拒绝没有 resource 与测量证据的“最快”结论

**目标：** 在同一 logical extent `1000 x 750` 上比较 `block A = (32, 8)` 与 `block B = (16, 16)` 的几何合同，审查“B 的 fringe 更少，所以 B 最快”这句话。

**约束：** 两个候选都使用练习 1 的 device record；分别计算 grid、coverage、launched 和 fringe；保持完全相同的逐轴 bounds 与 logical elements；列出 device record 无法提供的 `cudaFuncAttributes.maxThreadsPerBlock`、`numRegs`、`sharedSizeBytes`、requested dynamic shared memory 和实际 launch/result facts；不得生成 occupancy、latency 或 speedup 数字。

**预期证据：** 一张 A/B geometry table、一份按 correctness/device/kernel/measurement 排序的 decision ledger，以及对原句的最小合法改写。

**验收条件：** A 得到 grid `(32, 94)`、launch `770048`、fringe `20048`；B 得到 grid `(63, 47)`、coverage `1008 x 752`、launch `758016`、fringe `8016`；两者 device-level axis 与 aggregate checks 都通过；结论只说 B 在这个 logical extent 上产生较少 fringe，kernel feasibility 与任何速度排序仍未建立。

<details><summary>提示 1</summary>`ceil_div(1000, 16) = 63`，`ceil_div(750, 16) = 47`，两个 block 都有 256 threads。</details>

<details><summary>提示 2</summary>较少 launch thread 是待解释的几何差异，不是计时结果；先写“还缺什么”，再决定能否排名。</details>

## 下一步

完成三份合同后，查看独立的[参考解答](/foundations/launch-geometry/solutions/)，再到[练习题库（Practice Bank）PB-R1-012](/practice/#pb-r1-012)复核另一份混淆 legality 与 speed 的记录。[LAB03：破坏并修复索引](/labs/break-and-repair-indexing/)是相关实践，但这些手算和 host-only helper 都不构成 LAB03 的 CUDA 运行证据。
