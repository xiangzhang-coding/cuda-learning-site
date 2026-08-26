---
title: 'F03 参考解答：诊断并修复多维索引合同'
description: F03 三道练习的独立复核解答、有效替代方案和常见错误。
pairId: f03-solutions
counterpart: /en/foundations/multidimensional-indexing/solutions/
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
unitId: F03-SOLUTIONS
prerequisites:
  - F03-EXERCISES
relatedUnits:
  - F03
  - VIS02
  - EX03
  - F04
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
    attrs: { name: 'cuda:pair-id', content: f03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F03,VIS02,EX03,F04' }
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

<a class="locale-pair" data-locale-counterpart href="/en/foundations/multidimensional-indexing/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F03 练习（Exercise）](/foundations/multidimensional-indexing/exercises/)的**参考解答**。先比较逐轴推理、访问顺序和证据边界，再比较最终数字。

## 解答 1：分类三维 partial fringe

Grid shape 为 `(ceil(10 / 4), ceil(7 / 3), ceil(5 / 2)) = (3, 3, 3)`。对 `blockIdx = (2, 2, 2)`，block 原点是 `(8, 6, 4)`。

| `threadIdx` | global `(gx, gy, gz)` | x bounds | y bounds | z bounds | 结论 |
| --- | --- | --- | --- | --- | --- |
| `(1, 0, 0)` | `(9, 6, 4)` | `9 < 10` | `6 < 7` | `4 < 5` | IN；index `349` |
| `(2, 0, 0)` | `(10, 6, 4)` | false | true | true | OUT；x 越界 |
| `(1, 1, 0)` | `(9, 7, 4)` | true | false | true | OUT；y 越界 |
| `(1, 0, 1)` | `(9, 6, 5)` | true | true | false | OUT；z 越界 |

唯一合法坐标的映射是 `((4 * 7) + 6) * 10 + 9 = 349`，正好是 350 个元素中的最后一个。其余坐标在展平前停止。

## 解答 2：修复 x/y/z 边界保护

修复后的 early-return 语义是：`gx >= width OR gy >= height OR gz >= depth` 时返回。练习 1 的三个反例分别只让第一个、第二个、第三个无效谓词为 true；原来的 `AND` 因此三次都为 false，让错误 thread 继续执行。

等价的正向写法只在 `gx < width AND gy < height AND gz < depth` 时包围展平和全部数组访问。两种写法的关键相同：合法性是三个有效轴谓词的交集，任一轴失败都不得产生访问。

## 解答 3：修复 flattening 并保住独立参考边界

x-fastest row-major 合同是 `index = ((gz * height) + gy) * width + gx`。在 `10 x 7 x 5` 范围中：

| 坐标 | 预期 index | 增量含义 |
| --- | ---: | --- |
| `(0, 0, 0)` | 0 | 原点 |
| `(1, 0, 0)` | 1 | x 增加一个元素 |
| `(0, 1, 0)` | 10 | y 跨过一行 |
| `(0, 0, 1)` | 70 | z 跨过一层 |
| `(9, 6, 4)` | 349 | 最后合法元素 |

独立 host 检查可用 z/y/x 三层循环生成坐标与预期值，并按上述应用合同放入 host 容器。待测映射单独接受这些坐标；它不能反过来生成 expected 值。这样，错误式 `((gx * height) + gy) * depth + gz` 会在非原点坐标暴露 stride 错误。

这个检查没有 launch CUDA。它只能说明 host reference 和映射验收通过，不能声明 device 结果、Runtime-Verified 或性能。

## 有效替代方案

- 练习 1 可以用三张 2D slice 图替代表格，只要四个指定 thread 的三个轴谓词和 index 仍可复核。
- 边界保护可以采用 early return，也可以用正向条件包围全部访问；不能让任何展平或数组操作留在条件外。
- 展平公式可以写成 `gx + width * (gy + height * gz)` 或显式 stride 形式，只要 x、y、z 增量分别是 `1`、`width`、`width * height`。
- Host reference 可以使用嵌套循环、预先列出的 oracle table 或另一种清晰实现，但不能与待测路径共享可能出错的映射结果。

## 常见错误

- 把 `gridDim` 当作逻辑数据 extent，忽略最后 block 的 partial 区域。
- 只检查 x，或用 `AND` 连接三个“越界”谓词。
- 在检查 y 或 z 前先展平、读取或写入。
- 把 width、height、depth 当成可互换 stride，或误以为 CUDA geometry 自动选择 row-major。
- 让 CPU reference 调用与 kernel 相同的错误 helper，使两边以同一种方式出错却仍然相等。
- 把 host-only 通过、浏览器模型或手算表写成 GPU 运行或性能证据。

复核日期：**2026-08-26**。这些解答没有执行 CUDA，也没有生成编译、运行或性能记录。
