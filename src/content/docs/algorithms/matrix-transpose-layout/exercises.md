---
title: 'A05 练习：Transpose Mapping、Tile Phases 与 Bank Padding'
description: 用三道深入任务证明 rectangular transpose 双射、partial-tile barrier safety 与 +1 physical padding 的 bank mapping，并保持 evidence boundary。
pairId: a05-exercises
counterpart: /en/algorithms/matrix-transpose-layout/exercises/
factCheckDate: '2026-08-30'
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
unitId: A05-EXERCISES
prerequisites:
  - A05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a05-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/matrix-transpose-layout/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A05 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/matrix-transpose-layout/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [A05：矩阵转置、合并访问与共享内存布局](/algorithms/matrix-transpose-layout/)。这组练习提交 address tables、phase proof 与 evidence plan；不要求 GPU，也不产生 compilation 或 runtime evidence。

## 作答说明

每题先写 logical contract，再写 physical address 或 participation ledger。独立完成三题后才查看[复核解答](/algorithms/matrix-transpose-layout/solutions/)。

## 练习 1：证明 rectangular transpose mapping

**目标：** 对 `rows = 2`、`cols = 3`、row-major input `[a,b,c,d,e,f]`，为每个 `(row,col)` 写出 input linear index、output coordinate 与 `output[col * rows + row]` index，并证明 output ownership 是双射。

**约束：** Output shape 必须写成 `3 x 2`；不得借助 square-matrix assumption；每个 input 与 output index 都必须恰好出现一次；CPU reference 采用 exact element comparison。

**预期证据：** 六行 mapping table、一个 row-major output vector、以及关于 injective 与 complete coverage 的简短证明。

**验收条件：** Table 使用 input leading dimension `cols` 与 output leading dimension `rows`；output index set 恰为 `0..5`；没有 collision 或遗漏；proof 可推广到任意正的 `rows, cols`。

<details><summary>提示 1</summary>先固定 `row`，让 `col` 从 0 增加到 2，再计算两个 linear indices。</details>

<details><summary>提示 2</summary>可用 inverse mapping `row = output_col`、`col = output_row` 证明唯一性。</details>

## 练习 2：审查 partial tile 的 barrier 与 guards

**目标：** 对 `rows = 18`、`cols = 20`、`T = 16` 的 tiled transpose，审查 grid 中 bottom-right block。写出 valid input region、valid element count、load guard、交换后的 store guard与完整 block phase ledger。

**约束：** Block 有 `16 x 16` threads；invalid thread 可以跳过 global load/store，但 256 个 threads 都到达同一个 barrier；不得在 barrier 前 return；必须证明合法 store 不读未初始化 shared slot。

**预期证据：** Grid/block coordinate diagram、valid-thread count、`load -> barrier -> transposed read/store` ledger，以及一条 source-validity implication。

**验收条件：** Bottom-right input region 只含 rows `16..17` 与 cols `16..19`，共 8 个 values；barrier participant count 是 256；load 与 store 使用各自 coordinate system；每个合法 output owner 都对应一个已完成的合法 load。

<details><summary>提示 1</summary>Grid 的 x extent 来自 `cols`，y extent 来自 `rows`。</details>

<details><summary>提示 2</summary>Store 时 tile 的 block coordinates 与 thread coordinates都要交换。</details>

## 练习 3：分离 logical tile、physical padding 与 evidence

**目标：** 在简化模型 `T = 32`、32 banks、每个 `float` 一个 bank word 下，比较 physical strides 32 与 33。对固定 logical column 的 transposed warp read，写出 lane `l` 的 bank formula，并设计验证 expected mapping 的 observation plan。

**约束：** Logical tile 始终是 `32 x 32`；padding slot 不得被当作 matrix element；先完成 static bank-index table，再列出需要的 GPU、instruction/access width 与 tool record；不得填写 timing、conflict count 或 speedup。

**预期证据：** 两条 bank formulas、lanes `0..31` 的 distinct-bank summary、logical-versus-physical layout sketch，以及 expected/observed 两栏计划。

**验收条件：** Stride 32 的公式映射固定 column 到同一 bank；stride 33 的公式在简化模型中覆盖 32 个 banks；transpose output 不变；所有 measured fields 保持 `unrecorded`。

<details><summary>提示 1</summary>使用 `(lane * physical_stride + fixed_column) mod 32`。</details>

<details><summary>提示 2</summary>Bank formula 是 expected reasoning；它不能替代一份具名 environment record。</details>

## 下一步

完成后查看独立的[复核解答](/algorithms/matrix-transpose-layout/solutions/)，再审查 [PB-R2-017](/practice/#pb-r2-017)、EX14 的 `cpu-reference`/`tiled-transpose` ranges 与 [VIS11](/visuals/tiled-transpose/)。
