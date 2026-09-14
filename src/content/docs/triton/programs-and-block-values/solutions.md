---
title: 'T01 独立参考解答'
description: 核对商余数归属、展平矩阵坐标与逻辑通道断言的边界。
pairId: t01-solutions
counterpart: /en/triton/programs-and-block-values/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, practice-bank, sources]
resourceKind: solution-set
unitId: T01-SOLUTIONS
prerequisites: [T01-EXERCISES]
relatedUnits: [T01]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton language semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper solution', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t01-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/programs-and-block-values/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,practice-bank,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T01-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: T01 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/programs-and-block-values/solutions/" lang="en">Read the English counterpart</a>

## 尝试后核对

精确前置为 `[T01-EXERCISES]`：先完成[练习](/triton/programs-and-block-values/exercises/)再核对。这里是逻辑推导，四个证据数组为空，不是执行结果。

## 解答 1：分别计算商和余数

Triton 需要三个程序实例（program instance），覆盖 96 个位置，屏蔽 23 个。CUDA 需要两个各 64 线程的块，覆盖 128 个位置，保护 55 个。Triton 归属是 `(i//32, i%32)`；CUDA 归属是 `(i//64, i%64)`。

| 索引 | Triton 实例 / 位置 | CUDA 块 / 线程 |
| --- | --- | --- |
| 63 | 1 / 31 | 0 / 63 |
| 64 | 2 / 0 | 1 / 0 |
| 72 | 2 / 8 | 1 / 8 |

对每个有效非负索引 `i`，除以选定的正块范围，恰好得到唯一的商与范围内余数，因此逻辑覆盖与唯一性成立。逻辑位置不能决定 Triton 的物理通道（lane）。把任一网格数当作线程数，都不满足验收契约。

## 解答 2：程序实例不等于矩阵行

共 35 个值，三个实例。实例 2 构造索引 32–47，只有 32、33、34 有效，恢复的 `(行,列)` 为 `(4,4),(4,5),(4,6)`；十三个位置被屏蔽。实例号 2 与行号 4 已经构成反例。前面的实例也会跨行：每块覆盖 16 个元素，一行只有七个。一维网格不意味着原始问题是一维的。

## 练习题库核对

<a id="pb-r5-013-solution"></a>
对 [PB-R5-013](/practice/#pb-r5-013)，`B=256` 与四个 NVIDIA 线程束分别描述 256 个逻辑值和 128 个线程。算术平均是每线程两个值，但这不能证明位置 `j` 属于通道 `j%32`，也不能证明每线程负责某个相邻值对。应拒绝物理映射断言，并要求精确编译目标、选项以及实际检查过的生成布局或代码。正确的逻辑掩码与浏览器图不能提供这些观察。

## 来源与返回

返回 [T01](/triton/programs-and-block-values/)。[SRC-CUDA-087](/sources-and-versions/#src-cuda-087) 在 2026-09-14 核查了程序实例与形状语义。原创解答采用 CC BY 4.0。
