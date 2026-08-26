---
title: 'F02 参考解答：拆解执行层次与所有权'
description: F02 三道练习的独立复核解答、有效替代方案和常见错误。
pairId: f02-solutions
counterpart: /en/foundations/execution-hierarchy/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: F02-SOLUTIONS
prerequisites:
  - F02-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: f02-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F02-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/foundations/execution-hierarchy/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F02 练习（Exercise）](/foundations/execution-hierarchy/exercises/)的**参考解答**。先比较对象边界、公式和不保证事项，再比较最终数字或调度表。

## 解答 1：区分函数与两次 launch

程序只有一个 `classify` kernel 函数定义。Launch A 和 Launch B 各创建一个 grid，因此有两个动态 grid 实例，且其中的 block、thread 和 warp 都互不复用。

| 项目 | Launch A | Launch B |
| --- | ---: | ---: |
| Grid 实例 | 1 | 1 |
| Block 数 | `3 * 1 * 1 = 3` | `2 * 2 * 1 = 4` |
| 每 block thread 数 | `64 * 1 * 1 = 64` | `16 * 8 * 1 = 128` |
| Launch thread 总数 | `3 * 64 = 192` | `4 * 128 = 512` |
| 每 block warp 数 | `64 / 32 = 2` | `128 / 32 = 4` |
| Launch warp 总数 | `3 * 2 = 6` | `4 * 4 = 16` |

Warp 编号在每个 block 内重新从 0 开始，所以“Launch A 有 6 个 warp”是总量，不代表存在一个跨 block 编号 `0..5` 的协作单元。Execution configuration 只给 grid 和 block 形状；warp/lane 从 block 内局部编号推导，具体 SM 和 block 顺序由调度决定。

## 解答 2：预测二维边界所有权

Ceiling division 给出：

```text
gridDim = (ceil(53 / 16), ceil(19 / 8)) = (4, 3)
final blockIdx = (3, 2)
```

逻辑坐标范围是 x 的 `0..52` 和 y 的 `0..18`。最后一个合法 row-major 数据索引是 `52 + 53 * 18 = 1006`。

| `threadIdx` | global `(x, y)` | local ID | warp, lane | bounds | ownership | `dataIndex` |
| --- | --- | ---: | --- | --- | --- | ---: |
| `(4, 2)` | `(52, 18)` | `4 + 16 * 2 = 36` | `1, 4` | x IN；y IN | 最后一个元素 | 1006 |
| `(5, 2)` | `(53, 18)` | `5 + 16 * 2 = 37` | `1, 5` | x OUT；y IN | 无 | 不访问 |
| `(4, 3)` | `(52, 19)` | `4 + 16 * 3 = 52` | `1, 20` | x IN；y OUT | 无 | 不访问 |

后两行即使代入线性公式能得到一个整数，也不能把该整数用作数组访问。先通过每个轴的 bounds，才有合法的二维 ownership 与 row-major `dataIndex`。

## 解答 3：构造两个合法调度解释

在题目给定的简化条件下，下面两种分派都合法：

| 调度步骤 | SM0 | SM1 |
| ---: | --- | --- |
| 1 | B2 | B0 |
| 2 | B3 | B1 |

| 调度步骤 | SM0 | SM1 |
| ---: | --- | --- |
| 1 | B1 | B3 |
| 2 | B0 | B2 |

表格只展示两种允许的逻辑顺序，不是设备记录，也不规定每一步的时长或完成先后。四条判断如下：

1. **“`blockIdx` 顺序保证分派顺序”不成立。** 坐标识别 grid 中的 block，不构成队列合同。
2. **“一个 block 的 thread 留在同一 SM”成立。** Block 作为单元分派到一个 SM，SM 调度它的 warp。
3. **“lane 编号给出逐 thread 时间顺序”不成立。** Lane 是 warp 内位置，不是 thread 的先后编号。
4. **“再次 launch 同一函数会复用原 grid”不成立。** 每次 launch 创建新的 grid 与新的 block/thread 实例。

## 有效替代方案

- 解答 1 可以使用嵌套框图代替表格，只要一个函数、两个 grid 以及每个 block 内独立的 warp/lane 边界清楚，并保留全部计数。
- 解答 2 可以先画坐标平面，再附局部编号表；只要三个指定 thread、逐轴 bounds、warp/lane 和“不访问”结论都可复核。
- 解答 3 的 block 顺序可以不同于上表。只要每个 block 恰好出现一次、没有跨 SM 拆分，并明确顺序未受保证，就是有效替代方案。

## 常见错误

- 把两次 launch 合并成一个 grid，或把两个 grid 误说成两个 kernel 函数定义。
- 用整个 grid 的 thread 总数连续划分 warp；warp 在每个 block 内从局部编号 0 重新开始。
- 二维局部编号写成 `threadIdx.y + blockDim.y * threadIdx.x`，破坏 x-fastest 规则。
- 只检查一个坐标轴，或把越界坐标线性化后当成合法数组索引。
- 认为低 `blockIdx` 必须先运行，或把一份教学调度表写成真实观察。
- 把 warp 当成 block 级 shared-memory 协作边界，或把 lane 编号当作时间顺序。

复核日期：**2026-08-26**。这些解答没有编译或执行 CUDA，也没有生成调度观察或性能记录。
