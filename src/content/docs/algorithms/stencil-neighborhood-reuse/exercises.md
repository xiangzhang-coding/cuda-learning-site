---
title: 'A06 练习：Boundary Policies、2D Halos 与 Reuse Arithmetic'
description: 用三道深入任务推导一维 boundary outputs、证明二维 center/side/corner coverage，并修复 barrier phase 后计算复用预算。
pairId: a06-exercises
counterpart: /en/algorithms/stencil-neighborhood-reuse/exercises/
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
unitId: A06-EXERCISES
prerequisites:
  - A06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a06-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/stencil-neighborhood-reuse/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A06 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/stencil-neighborhood-reuse/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [A06：Stencil 邻域、Halo 与 Cooperative Reuse](/algorithms/stencil-neighborhood-reuse/)。任务只要求手工 tables、coverage proof 与 phase ledger；不引入 executable，不生成 runtime evidence。

## 作答说明

每题都要先声明 stencil shape 和 boundary policy，再计算 addresses 或 counts。Reuse arithmetic 与 performance claim 必须分栏。

## 练习 1：对同一输入推导四种 boundary contracts

**目标：** 对 input `[2,4,6,8]`、radius 1、weights `[1,1,1]` 的一维 centered stencil，分别推导 `valid`、`clamp`、`zero` 与 `periodic` outputs，并写出每个 edge neighborhood 的 index/value trace。

**约束：** `valid` 只产生完整邻域；其他 policies 保持四个 output positions；periodic 对负 index 使用规范化 modulo；不得混合 policies；所有 sums 使用 exact integer arithmetic。

**预期证据：** 四组 output vectors、edge index/value table、每种 policy 的 output-domain statement，以及 CPU reference rule。

**验收条件：** Interior positions 1 和 2 在四种适用 contracts 中保持相同 sum；每个 edge value 可追溯到明确 source、clamped endpoint、zero 或 wrapped index；没有越界读取；四种结果没有被描述成同一 contract。

<details><summary>提示 1</summary>先列出 position 0 的 requested indices `[-1,0,1]`。</details>

<details><summary>提示 2</summary>对于长度 4，normalized periodic index 可写成 `((i % 4) + 4) % 4`。</details>

## 练习 2：覆盖 center、side halos 与 corner halos

**目标：** 一个二维 output tile 高 3、宽 4，square radius 1。画出完整 staged rectangle，并把它的 30 个 positions linearize 后分配给 8 个 threads，thread `t` 负责 indices `t, t+8, ...`。

**约束：** 必须分别标出 12 个 center positions、top/bottom、left/right 与四个 corners；linear index 采用 staged width 6；每个 staged slot 恰好一个 writer；所有 8 threads 在 load 后到达 barrier。

**预期证据：** `5 x 6` labeled diagram、八条 per-thread index lists、linear-to-2D mapping rule，以及 coverage/uniqueness/barrier proof。

**验收条件：** 30 个 indices `0..29` 全部且仅出现一次；四个 corners `0,5,24,29` 都有 owner；没有把 corner 重复计入 side strip；barrier participants 是 8，不取决于每个 thread 的 load count。

<details><summary>提示 1</summary>使用 `sy = floor(q / 6)` 与 `sx = q mod 6`。</details>

<details><summary>提示 2</summary>Thread 6 和 7 的 load 数可以少于其他 threads，但 participation 不变。</details>

## 练习 3：修复 early return 并计算复用预算

**目标：** 把“invalid output thread 在 cooperative load 前 return”的错误 skeleton 改为 uniform `load -> barrier -> compute` phase，并计算两项 interior reuse budget：一维 `B=8,r=2`，二维 `T_y=T_x=8,r=1` square stencil。

**约束：** Boundary policy 选 `zero` 并贯穿 loader/reference；全 block 定义 staged slots并到达 barrier；只有 valid output owner compute/store；counts 只比较 direct logical requests 与 complete staged unique positions；不得转换成 timing 或 speedup。

**预期证据：** 修复后的 pseudocode、participant ledger、一维与二维 count equations，以及 expected-reuse/observed-performance 两栏表。

**验收条件：** 一维 counts 为 `8*5` 与 `8+4`；二维 counts 为 `8*8*9` 与 `10*10`；invalid owner 不 early return；所有 performance fields 保持 `unrecorded`。

<details><summary>提示 1</summary>把 early return 替换为 `output_valid`，不要删除 thread 的 load assignment。</details>

<details><summary>提示 2</summary>Count ratio 描述 address reuse opportunity，不包含 barrier 或 transaction cost。</details>

## 下一步

完成后查看独立的[复核解答](/algorithms/stencil-neighborhood-reuse/solutions/)，再审查 [PB-R2-018](/practice/#pb-r2-018)并把同一 neighborhood ledger 带入 [A07](/algorithms/convolution-reuse-layout/)。
