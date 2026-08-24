---
title: 'O03 参考解答：补全环境和测量记录'
description: O03 三道练习的独立复核解答、替代方案和常见错误。
pairId: o03-solutions
counterpart: /en/start/environment-manifest/solutions/
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
unitId: O03-SOLUTIONS
prerequisites:
  - O03-EXERCISES
relatedUnits:
  - O03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-24' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/environment-manifest/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [O03 练习（Exercise）](/start/environment-manifest/exercises/)的**参考解答**。字段名称可以调整，但坐标不能合并到失去含义。

## 解答 1：修复最小 manifest

一个合格模板至少包含：

- **硬件：** GPU identity、compute capability、GPU count、memory requirement、permissions。
- **软件：** driver version、CUDA Toolkit version、相关 component versions、NVCC、host compiler、operating system/release/architecture。
- **工作负载：** 项目与提交、数据类型、shape、迭代、输入来源。
- **执行：** exact command、环境变量、selected dialect、target。
- **正确性：** method、reference/tolerance/invariant、明确 criteria。
- **记录：** observation date、日志和产物位置。

所有值都应保持 `<待采集：方法>`，直到有人真正执行查询。原句里的 `PASS` 只能作为待核对的原始文字，不能独立证明正确。

## 解答 2：修复支持边界

第一条更正：**原生 Linux 是本站唯一 Supported Environment。** NVIDIA 对 WSL 的产品支持不会自动扩大本站的 setup、troubleshooting、Lab 或 validation 责任；WSL 只能作为非支持比较。

第二条更正：**8 GB 本身不能决定 tier。** Baseline 要求 compute capability 7.5 或更新，并使用适配 8 GB 的问题；Modern 要求 compute capability 8.0 或更新且至少 8 GB。GPU count、features 和 permissions 仍可能增加活动门槛。

## 解答 3：扩展性能 manifest

在完整正确性 manifest 后追加：

1. baseline 与 hypothesis；
2. 两侧完全相同的 workload、shape 和 correctness method；
3. clocks、power policy、温度或其他必要稳定条件；
4. warm-up 次数和排除规则；
5. synchronization 的位置与理由；
6. timer/profiler 名称和精确版本；
7. sample 数量、统计量、离群值政策；
8. `result: <待观察>`；
9. interpretation boundaries，明确不外推到其他 GPU、driver、Toolkit、组件或 workload。

替代方案可以选择端到端计时或 kernel 计时，但必须说明所回答的问题不同，不能把两者混成一个延迟。

## 常见错误

- 用 Toolkit 版本替代 driver、NVCC 或库版本。
- 只写 GPU 产品名，不记录 compute capability 和实际 GPU count。
- 把 NVIDIA 支持矩阵当作本站 Supported Environment。
- 在异步 GPU 工作前后使用主机计时器却不记录 synchronization。
- 给空的 result 字段填入“预计 2x”。

复核日期：**2026-08-24**。解答只提供模板，没有记录真实环境或测量。
