---
title: 'M04 练习：从 Word Address 证明 Bank Mapping'
description: 用三道任务推导 stride/broadcast bank tables、证明 32x33 padding，并建立不虚构 speedup 的 layout decision ledger。
pairId: m04-exercises
counterpart: /en/memory/bank-conflicts-layouts/exercises/
factCheckDate: '2026-08-27'
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
unitId: M04-EXERCISES
prerequisites:
  - M04
relatedUnits:
  - M04
  - EX06
  - VIS05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M04,EX06,VIS05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/bank-conflicts-layouts/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M04：Bank conflict 与布局变换](/memory/bank-conflicts-layouts/)。练习使用 selected 32-bank, 32-bit-word fixture，只需静态表和整数证明；不需要 CUDA-capable system。

## 作答方法

每题先列 exact word addresses，再用 `bank = word_index mod 32`。同地址 reads 先去重为 broadcast；不同 words 才进入 per-bank conflict count。完成后查看[参考解答](/memory/bank-conflicts-layouts/solutions/)。

## 练习 1：区分三个 stride 与 broadcast

**目标：** 32 active lanes 分别读取 `word(i)=i`、`2i`、`32i` 和 `0`，为四条独立 instructions 建立 lane/word/bank table。

**约束：** 必须记录每个 busiest bank 的 distinct word set；same-address read case 不得只看 bank sequence；N-way 不得改写成 cycles 或 runtime ratio。

**预期证据：** 四张或一张分组 table，包含 mapping、unique banks、max distinct words per bank、classification 和最窄结论。

**验收条件：** Stride 1 conflict-free；stride 2 使用 16 banks 且 2-way；stride 32 的 32 distinct words 全在 bank 0 且 32-way；word 0 same-address reads 是 broadcast 且不是 bank conflict。

<details><summary>提示 1</summary>先按 exact word address 去重，再按 bank 分组。</details>

<details><summary>提示 2</summary>`32i mod 32 = 0`，但 `32i` 彼此不同；broadcast case 的 word address 都是 0。</details>

## 练习 2：证明 32x33 transform

**目标：** 对固定 column `c = 5`，分别列 `float tile[32][32]` 与 `float tile[32][33]` 中 lanes 0..31 的 word/bank mapping，并证明 padded mapping 是 permutation。

**约束：** Logical shape 必须保持 32x32；第 33 列不能被算法读取为 logical data；计算 storage words 与额外 bytes；保留 M03 B1/B2 contract。

**预期证据：** 两组公式、至少首四行与末一行 mapping、permutation proof、footprint ledger 和 unchanged-correctness statement。

**验收条件：** Unpadded bank 全是 5 且 32-way；padded bank 是 `(i+5) mod 32` 并覆盖每个 bank 一次；storage 从 1024 到 1056 words，增加 128 bytes；logical indices/results 与 barriers 不变。

<details><summary>提示 1</summary>如果 `(i+5) mod 32 = (j+5) mod 32` 且 `i,j` 都在 0..31，则 `i=j`。</details>

<details><summary>提示 2</summary>Padding 是 storage stride，不是第 33 个 matrix column。</details>

## 练习 3：审查“padding 带来 32x speedup”

**目标：** 把这句 claim 改写成一份 EX06 `shared-layouts` decision ledger，分别记录 correctness、expected bank model、resource footprint、future profiler observation 与 timing。

**约束：** Unpadded/padded variants 必须相同 input、logical output、launch 和 M03 phase contract；当前 observation/timing fields 为空；不得从 32-way -> conflict-free 推出 32x、任何 latency 或 occupancy 数字。

**预期证据：** 一张五阶段 ledger、允许的最窄结论、需要 future run 填入的 exact coordinates 和禁止结论列表。

**验收条件：** 只声明 selected fixture 下 named column instruction 的 expected mapping 改变；记录 +128-byte shared footprint；要求 exact Environment Manifest、tool/metric definition、correctness pass、warm-up、sync/timing boundary 和 repetitions；speedup 保持 unestablished。

<details><summary>提示 1</summary>Conflict degree 不是 kernel 时间分解。</details>

<details><summary>提示 2</summary>Profiler 可能看到其他 shared instructions；给 metric 绑定 source range。</details>

## 下一步

完成后查看独立的[参考解答](/memory/bank-conflicts-layouts/solutions/)，再到[练习题库（Practice Bank）PB-R1-016](/practice/#pb-r1-016)审查 broadcast 与 padding claim。
