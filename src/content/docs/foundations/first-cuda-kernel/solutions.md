---
title: 'F01 参考解答：预测、实现与验证第一个 kernel'
description: F01 三道练习的独立复核解答、有效替代方案和常见错误。
pairId: f01-solutions
counterpart: /en/foundations/first-cuda-kernel/solutions/
factCheckDate: '2026-08-24'
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
unitId: F01-SOLUTIONS
prerequisites:
  - F01-EXERCISES
relatedUnits:
  - F01
  - LAB02
exampleIds:
  - EX02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f01-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F01,LAB02' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/first-cuda-kernel/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F01 练习（Exercise）](/foundations/first-cuda-kernel/exercises/)的**参考解答**。先比较推理和验收边界，不要只比较最终数字。

## 解答 1：预测 partial block

Block 数是 `(1003 + 256 - 1) / 256 = 4`，最后一个 block 的 `blockIdx.x = 3`。

| `threadIdx.x` | global index | bounds | 理由 |
| ---: | ---: | --- | --- |
| 0 | 768 | IN BOUNDS | `768 < 1003` |
| 234 | 1002 | IN BOUNDS | 它拥有最后一个合法元素 |
| 235 | 1003 | OUT OF BOUNDS | 它等于 logical extent |
| 255 | 1023 | OUT OF BOUNDS | 它大于 logical extent |

因此最后一个 block 有 235 个合法 thread 和 21 个越界 thread。越界 thread 已经被 launch，但必须跳过数组访问。

## 解答 2：补全最小所有权规则

一份合格的临时实现只包含三个动作：用 block 坐标乘 block 尺寸再加 block 内坐标，得到一维全局 index；比较 `index < element_count`；仅在条件成立时把两个输入的同一元素相加到输出。它应与 EX02 的 `kernel` marker range 在语义上相同。

Diff 的价值是暴露多写、缺失 bounds 或错误公式，不是创建新的发布源码。复核完成后保留自己的练习记录，但所有页面和下载仍指向 canonical EX02。

## 解答 3：设计正确性验收记录

合格记录分为四组：

1. **环境与命令：** 完整 Environment Manifest、EX02 pinned commit、所选 C++17 Toolkit Lane、精确 build/run command、一个 GPU、compute capability 7.5 或更新。
2. **执行边界：** 三次 allocation、两次 H2D copy、launch error、synchronization、D2H copy 和三次 free 都走错误检查，进程最终为零退出状态。
3. **结果边界：** 独立 CPU reference 逐元素比较；绝对差 `<= 1e-5` 或相对差 `<= 1e-5 * scale` 时通过；只有两者都不接受才失败。
4. **观察边界：** 执行前只写 expected observations，recorded observations 保持空；真正运行后附日期、日志和 criteria result。没有测量计划时不解释性能。

这份模板不会自动授予 Runtime-Verified。学习者记录最多先按 O02 判断是否满足 Community-Observed；本站仍保留 Pending Hardware Verification，直到维护者在 Reference Environment 中复现。

## 有效替代方案

- 表格可以改成带公式的坐标图，只要四个指定 thread 和 bounds 理由都可复核。
- 临时实现可以先写伪代码再写本地 CUDA C++，但最终必须与 canonical marker range 比较，并且不能作为第二份发布源码。
- 正确性记录可以使用结构化 JSON 或 Markdown；字段名称可不同，但执行、结果、证据和未观察边界不能合并。

## 常见错误

- 用 `N / blockDim.x` 向下取整，漏掉最后三个元素。
- 把 global index `1003` 当成最后一个合法元素；零起始范围的最后值是 `1002`。
- 认为 bounds check 会阻止越界 thread 被 launch。
- 只检查 `cudaGetLastError`，没有等待执行错误；或只同步而不检查 launch。
- 要求绝对和相对容差同时满足；EX02 的规则是满足任一即可。
- 把 host test、Compile-Checked 或预期 `PASS` 写成 GPU 运行观察。

复核日期：**2026-08-24**。这些解答没有执行 CUDA，也没有生成运行或性能记录。
