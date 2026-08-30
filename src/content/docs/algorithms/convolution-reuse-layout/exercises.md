---
title: 'A07 练习：Convolution Semantics、Reuse Patch 与 Production Gates'
description: 用三道深入任务固定 cross-correlation semantics、证明 stride/padding 下的 staged patch，并设计不执行 cuDNN 的 future production comparison contract。
pairId: a07-exercises
counterpart: /en/algorithms/convolution-reuse-layout/exercises/
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
unitId: A07-EXERCISES
prerequisites:
  - A07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a07-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/convolution-reuse-layout/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A07 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/convolution-reuse-layout/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [A07：Direct 2D Convolution、邻域复用与布局合同](/algorithms/convolution-reuse-layout/)。三题提交 semantics table、reuse/phase proof 与 future decision record；不要求 GPU，也不执行 cuDNN。

## 作答说明

每题先写 tensor shape/layout 与 operation convention，再做 arithmetic。把 expected reasoning、correctness evidence 和 production measurement 分开。

## 练习 1：用 asymmetric filter 区分 correlation 与 convolution

**目标：** 对 `N=C=K=1`、input shape `1x1x4x4`、row-major values `1..16`，使用 filter `[[1,0],[0,-1]]`、stride 1、dilation 1、padding 0，推导本页 cross-correlation output；再对同一 filter 推导 mathematical convolution 的 spatial flip 结果。

**约束：** 明确 input/filter/output layouts；先计算 `P,Q`；列出九个 output neighborhoods 与 products；teaching result 使用未翻转 filter；第二个 result 必须显式翻转两个 spatial axes；使用 exact integer arithmetic。

**预期证据：** Shape ledger、九行 cross-correlation table、flipped-filter table、两个 `3x3` output matrices，以及解释符号差异的 reasoning。

**验收条件：** Output extents 根据公式得到 `3x3`；每个 source address 位于 input domain；两种 operations 的 filter orientation 清楚可见；CPU oracle 明确选择 cross-correlation，而不是把两个结果都判为正确。

<details><summary>提示 1</summary>每个 teaching output 使用窗口左上元素乘 1、右下元素乘 -1。</details>

<details><summary>提示 2</summary>沿两个 spatial axes 翻转后，filter 的 1 与 -1 交换对角位置。</details>

## 练习 2：推导 stride/padding 下的 staged patch

**目标：** 对 `H=W=7`、单 channel、`R=S=3`、stride `(2,2)`、dilation `(1,1)`、padding `(1,1)`，为从 output `(0,0)` 开始的 `T_y=2,T_x=3` tile 推导 dense staged bounding patch、zero-padding positions 与 synchronous phase ledger。

**约束：** 使用 A07 patch-extent formulas；把 padded coordinates 映射到 global input 或 zero；direct logical references 与 staged positions 分别计数；全 block 参加 load barrier；没有 output 的 thread 不得 early return；不得把 count ratio写成 speedup。

**预期证据：** Patch origin/extents、`5x7` coordinate diagram、54-entry logical-reference count derivation、35-slot cooperative assignment plan，以及 `load -> barrier -> compute` participant ledger。

**验收条件：** Padded y range 是 `-1..3`、x range 是 `-1..5`；每 channel bounding patch 有 35 slots；六个 outputs 各有九个 logical taps；域外 slots 生成 zero 而不读取 global memory；barrier participant set 与 output validity 无关。

<details><summary>提示 1</summary>Height 使用 `(2-1)*2 + (3-1)*1 + 1`，width 对 `T_x=3` 同理。</details>

<details><summary>提示 2</summary>先给 staged rectangle 的每个 linear slot 分配 owner，再决定该 slot load global value 还是写 zero。</details>

## 练习 3：写 future cuDNN production comparison gate

**目标：** 为同一 direct teaching operation 与未来 cuDNN Frontend/API path 写一份 production comparison checklist，覆盖 component pin、semantic parity、graph validation/build、heuristics/plan selection、workspace、correctness、tolerance 与 determinism。

**约束：** 明确说明尚未发布的后续 cuDNN library 单元才固定 component matrix；A07 当前不教授或执行 cuDNN；记录 cuDNN Frontend v1.27.0 只是 cuDNN 9.24.0+ future coordinate；所有 build、plan、workspace、output、timing 与 speedup fields 必须保持 `unrecorded`。

**预期证据：** 一张 ordered gate table、失败分类、workspace lifetime diagram、correctness/determinism acceptance contract，以及未填写的 measurement record template。

**验收条件：** Graph validation 与 build 是独立 gates；heuristics candidates 与 selected plan 分开记录；workspace bytes/alignment/lifetime 有明确字段；CPU oracle 与 tolerance 先于 measurement；没有声称 hand-written kernel 胜过 cuDNN。

<details><summary>提示 1</summary>把 descriptor/graph failure、plan-unavailable、workspace-budget failure 与 numerical mismatch 分成不同 rows。</details>

<details><summary>提示 2</summary>Determinism 是待声明和验证的 contract，不是由相同 input 自动保证的属性。</details>

## 下一步

完成后查看独立的[复核解答](/algorithms/convolution-reuse-layout/solutions/)，再审查 [PB-R2-019](/practice/#pb-r2-019)并用 [TERM-145](/glossary/#term-145)/[TERM-146](/glossary/#term-146)检查 operation naming。
