---
title: 'A05 复核解答：Transpose Mapping、Tile Phases 与 Bank Padding'
description: 复核 A05 三道练习的 rectangular mapping、partial-tile barrier proof、physical padding bank arithmetic、有效替代方案与常见错误。
pairId: a05-solutions
counterpart: /en/algorithms/matrix-transpose-layout/solutions/
factCheckDate: '2026-08-30'
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
unitId: A05-SOLUTIONS
prerequisites:
  - A05-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a05-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/matrix-transpose-layout/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A05-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/matrix-transpose-layout/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A05 练习](/algorithms/matrix-transpose-layout/exercises/)的独立复核页。Mapping tables、barrier proof 与 bank arithmetic 都是静态 reasoning artifacts；它们没有编译或运行 EX14，也不是 measured performance evidence。

## 解答 1：证明 rectangular transpose mapping

六个 coordinates 的 mapping 是：

| input `(row,col)` | input index `row*3+col` | output `(col,row)` | output index `col*2+row` |
| --- | ---: | --- | ---: |
| `(0,0)` | 0 | `(0,0)` | 0 |
| `(0,1)` | 1 | `(1,0)` | 2 |
| `(0,2)` | 2 | `(2,0)` | 4 |
| `(1,0)` | 3 | `(0,1)` | 1 |
| `(1,1)` | 4 | `(1,1)` | 3 |
| `(1,2)` | 5 | `(2,1)` | 5 |

因此 `3 x 2` row-major output vector 是 `[a,d,b,e,c,f]`。Reasoning 是 coordinate swap 有 inverse：任一 output `(out_row,out_col)` 唯一还原为 input `(out_col,out_row)`。所以两个不同 input coordinates 不会 collision，且 `rows * cols` 个合法 inputs 覆盖同样大小的完整 output domain。Exact CPU comparison 应逐项得到同一 vector。

## 解答 2：审查 partial tile 的 barrier 与 guards

Grid shape 是 `ceil(20/16) x ceil(18/16) = 2 x 2`。Bottom-right block `(1,1)` 的 input origin 是 `(row=16,col=16)`；合法 rows 只有 16、17，合法 columns 只有 16、17、18、19，因此 valid load 数是 `2 * 4 = 8`。

每个 thread 都先计算 input coordinates。仅这 8 个 owners 执行 guarded load，但全体 `16 * 16 = 256` threads 随后到达同一 `__syncthreads()`。Store 使用交换后的 block/thread coordinates，并分别检查 output row `< cols` 与 output column `< rows`。合法 store 的 shared source 是 transpose 前的一个合法 `(row,col)`；inverse coordinate swap 保证它属于上述 8 个 completed loads。Invalid threads 只 predicate data movement，不退出 rendezvous。

Reasoning 的关键是把 source validity 写成 implication：`legal_output(out_row,out_col)` 对应 `input(row=out_col,col=out_row)`，而这对 coordinates 满足原 input bounds。因此合法 output 不读取 partial tile 中未写入的 slot。

## 解答 3：分离 logical tile、physical padding 与 evidence

令固定 logical column 为 `c`，lane 为 `l`。简化 bank 公式是 `(l * physical_stride + c) mod 32`。

- Stride 32：`(32l + c) mod 32 = c`，32 lanes 映射到同一 bank。
- Stride 33：`(33l + c) mod 32 = (l + c) mod 32`，lanes `0..31` 覆盖 32 个 distinct banks。

Reasoning 只涉及 physical shared row stride。两种 allocations 都只允许 logical rows/columns `0..31`；column 32 是 padding，transpose vector 与 output shape 不变。Observation plan 记录 exact GPU、compute capability、Toolkit、element/access width、instruction、launch、fixture 与 profiler/tool output。实际 conflict count、timing 与 speedup 继续是 `unrecorded`，因此 static formula 没有被误标成 observed evidence。

## 有效替代方案

- 解答 1 可以按 output order 而不是 input order排列 table，只要双射与两个 leading dimensions 完整可见。
- 解答 2 可以把 invalid shared slots 初始化为 neutral sentinel 再证明它们不被读取，但仍不能让任何 thread 跳过 barrier。
- Tile 可以不是方形，只要 source/destination coordinate transforms、physical strides 和 guards 全部重新声明。
- Bank analysis 可以使用 byte address 与 documented bank width，而不是 word index；必须得到与所声明模型一致的 mapping。
- 实际 implementation 可选其他 conflict-avoiding layout，但 logical transpose oracle 必须保持不变。

## 常见错误

- 把 output index 写成 `col * cols + row`，只在 square fixture 中偶然隐藏错误。
- 只交换 thread coordinates，不交换 multi-tile grid coordinates。
- 让 edge-invalid thread 在 `__syncthreads()` 前 return。
- 复用 input guard 变量却没有证明交换后的 output bounds。
- 把 physical padding column 计入 logical shape 或 global output leading dimension。
- 从 stride-33 bank formula 直接填写未观察的 conflict counter、timing 或 speedup。
- 把 VIS11 browser state 或 EX14 source inspection 记为 runtime evidence。

复核日期：**2026-08-30**。四个 evidence arrays 保持为空。
