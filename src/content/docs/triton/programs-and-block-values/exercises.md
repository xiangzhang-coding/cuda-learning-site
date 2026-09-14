---
title: 'T01 练习：证明逻辑归属'
description: 推导程序实例归属并恢复行主序坐标，不凭空指定物理通道布局。
pairId: t01-exercises
counterpart: /en/triton/programs-and-block-values/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T01-EXERCISES
prerequisites: [T01]
relatedUnits: [VIS17]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton language semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper exercise', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/programs-and-block-values/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T01 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: VIS17 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/programs-and-block-values/exercises/" lang="en">Read the English counterpart</a>

## 前置与说明

先完成 [T01](/triton/programs-and-block-values/)，精确前置为 `[T01]`。先做纸面推导，再用 [VIS17](/visuals/simt-triton-mapping/)。不需要 GPU，不授予证据状态（Evidence Status）。这些原创练习于 2026-09-14 依据 [SRC-CUDA-087](/sources-and-versions/#src-cuda-087) 核查。

## 练习 1：不一致的两种网格

**目标：** 用 Triton `B=32` 映射 `N=73`，对照每块 64 线程的 CUDA。定位两个模型中的索引 63、64、72，计算程序实例数、CUDA 块数及两种网格各自的无效位置数。

**约束：** 使用零起点索引与连续标量 CUDA 归属。不要根据 `i % B` 指定 Triton 物理通道（lane）。

**验收条件：** 提交商余数公式、三个索引的两种归属、尾部计数，以及每个有效输出恰好有一个逻辑所有者的证明。

<details><summary>提示 1：分清除数</summary>CUDA 用全局索引除以 64，Triton 除以 32。余数在两种模型中含义不同。</details>
<details><summary>提示 2：先算覆盖，再相减</summary>分别向上取整两个网格，乘上各自的块范围，再减去 73。用整数商余数的唯一性证明归属。</details>

## 练习 2：展平是一项选择

**目标：** 用 `B=16` 的展平 Triton 网格映射一个行主序 `5 × 7` 矩阵。指出最后一个程序实例负责的行列坐标，并解释为什么 `program_id(0)` 不一定是矩阵行号。

**约束：** 不填充行、不改变步长、不假定物理通道。只有索引小于逻辑元素总数时，写入才有效。

**验收条件：** 给出网格、最后实例的索引区间、全部有效行列对、掩码计数，以及将实例号当作行号的反例。

<details><summary>提示 1：从元素总数开始</summary>展平向量有 35 个元素。用宽度 7 的商和余数恢复行列。</details>
<details><summary>提示 2：分开形状与有效性</summary>最后一个实例仍有 16 个逻辑位置。只有小于 35 的索引有效；程序实例号与恢复出的行号不必相等。</details>

## 单独核对

提交两份推导后再打开[参考解答](/triton/programs-and-block-values/solutions/)。如果仍把网格数和物理线程数混淆，请回到 [T01](/triton/programs-and-block-values/)。
