---
title: 'O02 参考解答：分类和修复证据声明'
description: O02 三道练习的独立复核解答、取舍和常见错误。
pairId: o02-solutions
counterpart: /en/start/evidence-status/solutions/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - common-errors
resourceKind: solution-set
unitId: O02-SOLUTIONS
prerequisites:
  - O02-EXERCISES
relatedUnits:
  - O02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o02-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/evidence-status/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [O02 练习（Exercise）](/start/evidence-status/exercises/)的**参考解答**。答案不只有一种措辞；先提交自己的答案，再比较分类是否被实际证据支持。

## 解答 1：给混合记录分类

| 记录 | 编译轴 | 运行轴 | 仍缺少的证据 |
| --- | --- | --- | --- |
| 1 | Compile-Checked | Pending Hardware Verification | 合格运行、完整 manifest、标准和日期 |
| 2 | 无 | Community-Observed + Pending Hardware Verification | 维护者在声明的 Reference Environment 中复现 |
| 3 | 无 | 若验收要求运行则 Pending Hardware Verification | 首先需要实际开始并成功完成构建 |
| 4 | Compile-Checked | Runtime-Not-Applicable | 无运行证据要求；保留 PTX 检查产物即可 |

第 2 行也可以另有编译证据，但题目没有提供，因此不能补写。第 3 行的运行状态取决于原任务的验收条件；信息不足时应把条件写出来，而不是猜。

## 解答 2：拆开预期和记录

- **当前状态：** 没有 Compile-Checked，也没有运行状态可授予。
- **预期观察：** 在未来合格运行中，程序预期输出 `PASS`；这仍是假设。
- **已记录观察：** 空。
- **下一步证据：** 先在声明的 Lane 记录构建命令、环境和日志；若验收要求 GPU 行为，再准备完整 Environment Manifest、正确性标准、运行日志和日期。任何性能结论还要补基线、预热、同步、计时器/分析器版本和统计方法。

有效替代答案可以用结构化表格或 JSON，只要字段边界清楚且不制造观察。

## 解答 3：审查状态升级请求

**决定：拒绝升级，但保留 Community-Observed。**

理由一：报告来自社区成员，不是维护者控制下的复现。理由二：运行环境没有被正式声明为 Reference Environment。升级需要维护者控制该配置、完成受控基线运行、记录完整 manifest、明确所属 GPU Capability Tier，并保存满足标准的日志和验证日期。

这不是否定社区证据。更诚实的组合是 `Community-Observed + Pending Hardware Verification`。

## 常见错误

- 把“有日志”直接等同于 Runtime-Verified，忽略观察者和 Reference Environment。
- 把 blocked 当作失败或成功；blocked 只说明所需工作没有完成。
- 看到 PTX 就推断 GPU 行为，或用 Runtime-Not-Applicable 隐藏运行验收。
- 保留没有测量方法的“2x”数字。

复核日期：**2026-08-24**。这些解答只分析假设记录，没有新增 CUDA 观察。
