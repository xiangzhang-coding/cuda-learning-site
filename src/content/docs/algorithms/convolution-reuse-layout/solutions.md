---
title: 'A07 复核解答：Convolution Semantics、Reuse Patch 与 Production Gates'
description: 复核 A07 三道练习的 asymmetric-filter oracle、stride/padding patch、uniform phases、future cuDNN gates、有效替代方案与常见错误。
pairId: a07-solutions
counterpart: /en/algorithms/convolution-reuse-layout/solutions/
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
unitId: A07-SOLUTIONS
prerequisites:
  - A07-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a07-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/convolution-reuse-layout/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/convolution-reuse-layout/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A07 练习](/algorithms/convolution-reuse-layout/exercises/)的独立复核页。下列 equations、patch diagrams 与 production gates 都是静态 reasoning artifacts；它们没有编译 CUDA、执行 cuDNN 或产生 performance evidence。

## 解答 1：用 asymmetric filter 区分两种 operation

`H=W=4`、`R=S=2`、stride/dilation 为 1 且 padding 为 0，因此 `P=Q=3`。本站 teaching cross-correlation 不翻转 filter；每个 output 等于窗口左上值减去右下值：

| output | source values | result |
| --- | --- | ---: |
| `(0,0)` 至 `(0,2)` | `1-6`, `2-7`, `3-8` | `-5,-5,-5` |
| `(1,0)` 至 `(1,2)` | `5-10`, `6-11`, `7-12` | `-5,-5,-5` |
| `(2,0)` 至 `(2,2)` | `9-14`, `10-15`, `11-16` | `-5,-5,-5` |

所以 cross-correlation output 是三行 `[-5,-5,-5]`。Mathematical convolution 沿两个 spatial axes 翻转 filter，得到 `[[-1,0],[0,1]]`；同样九个 windows 变成右下值减左上值，output 三行都是 `[5,5,5]`。Asymmetric filter 让 orientation 差异无法被 symmetry 隐藏，CPU oracle 只接受未翻转的 teaching result。

## 解答 2：推导 stride/padding staged patch

完整 operation 的 `P=Q=floor((7+2-2-1)/2)+1=4`。所选 output tile 覆盖 `oy=0..1`、`ox=0..2`。Patch height 是 `(2-1)*2+(3-1)*1+1=5`，width 是 `(3-1)*2+(3-1)*1+1=7`。考虑 padding 后，staged coordinates 是 y `-1..3` 与 x `-1..5`，共 35 slots。

其中 top row 的 7 个 slots 与其余四行的 leftmost slot 都在 input domain 外，共 11 个 explicit zeros；其余 24 个 slots 从 input rows `0..3`、columns `0..5` 读取。六个 outputs 各有九个 taps，因此 direct logical references 是 `6*9=54`。Cooperative loader 先给 35 个 slots 分配唯一 owner，再让 owner load 或写 zero；全 block 随后到达 barrier，只有六个 valid output owners compute/store。`54/35` 只描述重叠与 staging opportunity，不是 transaction 或 speedup ratio。

## 解答 3：写 future cuDNN production gates

Ordered packet 先固定 `cuDNN library + cuDNN Frontend + Toolkit + driver + GPU + build` component matrix，再固定 NCHW/KCRS/NKPQ shapes、strides、types、cross-correlation、padding、stride 与 dilation。随后依次记录 graph validation、operation-graph build、heuristics candidates、filters、selected execution plan、workspace bytes/alignment/allocation/lifetime、CPU-oracle/tolerance verdict、same-scope determinism policy，最后才留下 measurement template。

每个失败有独立分类：descriptor/validation failure、build/support failure、no eligible plan、workspace budget/lifetime failure、numerical mismatch 与 determinism failure都不能改写成 kernel timing。cuDNN Frontend v1.27.0 只作为 cuDNN 9.24.0+ 的 future coordinate；尚未发布的后续 cuDNN library 单元才固定 production matrix。当前所有 build、plan、workspace、output、timing 与 speedup cells 都是 `unrecorded`，所以不存在 hand-written winner。

## 有效替代方案

- 解答 1 可以逐项展开全部四个 products；零权重项仍需保留 filter orientation。
- 解答 2 可以 stage 只含实际 taps 的 sparse footprint，但必须重新证明 coverage、ownership 与 address mapping。
- Production packet 可以先采用 framework 提供的 cuDNN path，而不是直接使用 Frontend；仍需固定 component、semantic、workspace、correctness 与 evidence scope。
- 若 application 只要求 numerical acceptance，可以不要求 bitwise reproducibility，但必须明确 tolerance 与 determinism verdict 的差别。

## 常见错误

- 用 symmetric filter 测试，导致 convolution 与 cross-correlation 的差异不可见。
- 把 padding 当作 input allocation 中真实元素，或在 zero policy 下执行越界 read。
- 忘记 stride 2 会改变相邻 output origin，或把 54 logical taps 当作 54 unique staged values。
- 因 thread 没有 output 就让它跳过 cooperative load 或 barrier。
- 把 heuristics candidate 当 selected plan，把 workspace query 当 allocation/lifetime proof。
- 在后续 cuDNN library 单元固定 component matrix、correctness parity 和 measurement record 之前宣布 custom kernel 或 cuDNN 获胜。

复核日期：**2026-08-30**。四个 evidence arrays 保持为空。
