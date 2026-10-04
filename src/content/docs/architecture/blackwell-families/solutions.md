---
title: 'H05 解答：分开目标契约与数值契约'
description: 给出有方向的目标矩阵，并审查保持等价的回退。
pairId: h05-solutions
counterpart: /en/architecture/blackwell-families/solutions/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, targets, fallback, evidence]
resourceKind: solution-set
unitId: H05-SOLUTIONS
prerequisites: [H05-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA capability scopes', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,targets,fallback,evidence' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/blackwell-families/solutions/" lang="en">Read the English counterpart</a>

## 先修

先尝试 [H05 练习（Exercise）](/architecture/blackwell-families/exercises/)。以下是纸面解答，不是执行记录。

## 目标矩阵

| 目标 | 10.0 | 10.3 | 10.7 | 11.0 | 12.0 | 12.1 |
| --- | --- | --- | --- | --- | --- | --- |
| 100a | 是 | 否 | 否 | 否 | 否 | 否 |
| 100f | 是 | 是 | 是 | 否 | 否 | 否 |
| 103f | 否 | 是 | 是 | 否 | 否 | 否 |
| 110f | 否 | 否 | 否 | 是 | 否 | 否 |
| 120f | 否 | 否 | 否 | 否 | 是 | 是 |
| 121f | 否 | 否 | 否 | 否 | 否 | 是 |

这是文档集合。反例包括 103f→10.0、100f→11.0、121f→12.0。EX25 与其 13.3.1 已核对集合取交集，排除 10.7。100f 构建成功本身不能提供 10.7 项目验证。使用具有兼容 cubin 或 PTX 的普通代码，且驱动必须能消费所生成的 PTX 版本。PTX 可以前向兼容，不等于普通 cubin 能跨主 CC。

## 保持数值契约

100a 不能服务 CC 12.1，改写后缀不会翻译指令集。已核对表格中 CC 12.x 没有原生 FP64 Tensor Core 输入支持，但支持普通 FP64 算术。FP4 会改变可表示数值和数值误差，需要调用者许可及完整的新契约。

候选普通 FP64 SIMT 实现保留原始输入、输出形状和约定的累加／误差契约。运行前定义绝对／相对容差、NaN／无穷处理和有符号零要求；使用独立高精度参考检查消去、极值和代表性数据。归约顺序不同可能需要有依据的容差，不能假定逐位一致。如果原契约要求逐位一致但无法满足，就拒绝替换。先保留精确编译器／镜像目标和正确性日志，再进行同设备有界计时。

## 证据与权利

来源核对日期 2026-10-04：[SRC-CUDA-107](/sources-and-versions/#src-cuda-107)。解答不提供编译器输出或 GPU 结果。运行与性能仍**待硬件验证（Pending Hardware Verification）**。原创 CC BY 4.0；权利方引用保留原声明。
