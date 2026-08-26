---
title: 'F02 练习：拆解执行层次与所有权'
description: 用三道独立任务检查 launch 实例分类、二维边界预测和无序调度推理。
pairId: f02-exercises
counterpart: /en/foundations/execution-hierarchy/exercises/
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
unitId: F02-EXERCISES
prerequisites:
  - F02
relatedUnits:
  - F02
  - VIS01
  - VIS02
  - F03
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
    attrs: { name: 'cuda:pair-id', content: f02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F02 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F02,VIS01,VIS02,F03' }
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

<a class="locale-pair" data-locale-counterpart href="/en/foundations/execution-hierarchy/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [F02：理解 CUDA 执行层次](/foundations/execution-hierarchy/)。三道练习（Exercise）只要求静态推理，不需要 GPU，也不产生编译或运行证据。

## 作答方法

先写出可复核的公式、分类或调度表，再按顺序打开提示。不要用 [VIS01](/visuals/kernel-journey/)或 [VIS02](/visuals/indexing/)的最终状态替代预测；可以在完成答案后用它们检查概念。解答位于独立的[参考解答页](/foundations/execution-hierarchy/solutions/)。

## 练习 1：区分函数与两次 launch

一个程序只定义一次 `__global__ void classify(...)`，随后执行两次 launch：

```text
Launch A: gridDim = (3, 1, 1), blockDim = (64, 1, 1)
Launch B: gridDim = (2, 2, 1), blockDim = (16, 8, 1)
```

**目标：** 为 kernel 函数、两个 grid 实例、各自的 block、thread、warp/lane 和可能接收 block 的 SM 制作类型与实例图，并计算每次 launch 的 block、thread 和 warp 数。

**约束：** 只能计为一个源码函数和两个动态 grid；warp 必须在每个 block 内从局部编号 0 重新划分；SM 不得画成 execution configuration 的坐标；不得添加 block 分派或完成顺序。

**预期证据：** 一张表或关系图，逐项给出“定义还是实例”、数量、包含关系、可推导事实和不受保证的事实，并附计算式。

**验收条件：** 两次 launch 的 grid 身份分开；A 与 B 的 block、thread 和 warp 总数全部正确；thread block 与 warp 的边界没有合并；说明 execution configuration 不选择具体 SM 或 block 顺序。

<details><summary>提示 1</summary>先分别计算 `gridDim.x * gridDim.y * gridDim.z` 与 `blockDim.x * blockDim.y * blockDim.z`。</details>

<details><summary>提示 2</summary>A 的每个 block 有 2 个 warp；B 的每个 block 有 4 个 warp。函数数量不随 launch 增加。</details>

## 练习 2：预测二维边界所有权

逻辑数组宽 `53`、高 `19`，采用 x 最快的 row-major 布局；`blockDim = (16, 8)`。关注最后一个 block，并检查 `threadIdx = (4, 2)`、`(5, 2)` 和 `(4, 3)`。

**目标：** 计算 `gridDim`、最后一个 `blockIdx`，再为三个指定 thread 推导全局坐标、局部线性编号、warp、lane、逐轴 bounds 和合法时的数据索引。

**约束：** 必须先写 ceiling-division、全局坐标和 x-fastest 局部线性化公式；每个轴分别判断；只有两个轴都合法时才计算可访问的 row-major `dataIndex`；不能运行代码后反推。

**预期证据：** 一张包含配置、`blockIdx`、`threadIdx`、global `(x, y)`、local ID、warp/lane、x/y bounds、ownership 和 `dataIndex` 的表。

**验收条件：** 正确找到二维 grid 与边界 block；三个 thread 的局部编号和 warp/lane 正确；准确识别最后一个元素的 owner、x 越界和 y 越界；没有把越界坐标线性化成合法访问。

<details><summary>提示 1</summary>`gridDim = (ceil(53 / 16), ceil(19 / 8))`，最后一个 block 的每个坐标都比对应 grid dimension 小 1。</details>

<details><summary>提示 2</summary>二维局部编号是 `threadIdx.x + 16 * threadIdx.y`；再分别对 32 做整除和取模。</details>

## 练习 3：构造两个合法调度解释

考虑一个包含 `B0`、`B1`、`B2`、`B3` 四个独立 block 的 grid。为便于画表，假设两个符合条件的 SM 每次各接收一个 block，且四个 block 都能在任一 SM 上执行。这只是逻辑调度题，不是硬件测量模型。

**目标：** 构造两份 block 分派顺序不同但都满足 CUDA 层次合同的调度表，并判断以下说法：`blockIdx` 顺序保证分派顺序；一个 block 的 thread 留在同一 SM；lane 编号给出逐 thread 时间顺序；再次 launch 同一函数会复用原 grid。

**约束：** 每份表都必须恰好放置四个 block 一次；一个 block 不得跨 SM 拆分；不能声称某份表是真实观察；不得加入时间、速度、occupancy 或跨 block 隐含同步结论。

**预期证据：** 两张以调度步骤和 SM 为列的表，外加四条“成立/不成立”判断；每条判断都引用 grid、block、warp/lane 或 SM 边界解释原因。

**验收条件：** 两份顺序确实不同且都合法；明确没有承诺的 block 分派与完成顺序；保留 block 到单个 SM 的边界；拒绝把 lane 当时间顺序，也拒绝把第二次 launch 当成原 grid。

<details><summary>提示 1</summary>从 `SM0: B2 -> B3`、`SM1: B0 -> B1` 开始，再交换首批和后续 block 形成第二份表。</details>

<details><summary>提示 2</summary>坐标用于识别工作；它不是队列编号。Warp/lane 用于执行分组；它也不是逐 thread 时间表。</details>

## 下一步

先独立完成三道题，再查看[参考解答](/foundations/execution-hierarchy/solutions/)。继续在 [VIS01](/visuals/kernel-journey/)与 [VIS02](/visuals/indexing/)复核层次和公式，并在[练习题库（Practice Bank）](/practice/#pb-r1-006)完成 PB-R1-006。
