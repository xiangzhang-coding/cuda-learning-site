---
title: 'A10 复核解答：Stable Softmax、Online State 与 Traffic Ledger'
description: 复核 large-offset softmax 数值、online invariant、pass/fusion traffic、有效替代方案与常见错误。
pairId: a10-solutions
counterpart: /en/algorithms/numerically-stable-softmax/solutions/
factCheckDate: '2026-09-03'
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
unitId: A10-SOLUTIONS
prerequisites:
  - A10-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a10-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/numerically-stable-softmax/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A10-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/numerically-stable-softmax/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A10 Exercises](/algorithms/numerically-stable-softmax/exercises/)的独立解答。所有数字都是 rounded host arithmetic 或 static accounting，不是 CUDA observation。

## 解答 1：Large-offset stable softmax

`m=1003`，shifted logits 是 `[-3,-2,-1,0]`。Exponentials 约为 `[0.04978707,0.13533528,0.36787944,1]`，denominator 是 `1.55300179`；除后得到 `[0.03205860,0.08714432,0.23688282,0.64391426]`。每项非负，显示值之和约为 1。Max-shift 避免 positive-exponent overflow，但非常负的 shifted exponent 仍可能 underflow 到 0。

## 解答 2：Online normalizer invariant

四个 states 是 `(1000,1)`、`(1001,1*exp(-1)+1=1.36787944)`、`(1002,1.36787944*exp(-1)+1=1.50321472)`、`(1003,1.50321472*exp(-1)+1=1.55300179)`。例如第三步也等于 `exp(-2)+exp(-1)+1`，第四步等于 `exp(-3)+exp(-2)+exp(-1)+1`，所以 invariant 使用当前 maximum 成立。第一遍得到 final `(m,l)`；若 logits 没有留在 fast storage，第二遍重读并写 `exp(x_i-m)/l`。

## 解答 3：Pass 与 fusion traffic

Stable schedule 是 `4*1024=4096` elements，即 `16384 B`；online-plus-output 是 `3*1024=3072` elements，即 `12288 B`；静态差值 `4096 B`。Intermediate fusion 在给定假设下删除 `2*4096=8192` element transfers，即 `2*4096*4=32768 B`。这些只是 logical requested bytes；actual transferred bytes、cache、spills、resource pressure、elapsed time 与 speedup 都未知。

## 有效替代方案

- 可以使用任意共同 offset 的 finite fixture，只要独立 reference 与显示精度明确。
- 可以用分块 merge 而不是逐元素 online scan，只要证明同一 `(m,l)` invariant。
- 可以选择另一个 memory boundary，但必须重新列出 included/excluded traffic。
- 可以 materialize exponentials，但 pass count 和 ledger 必须相应增加。

## 常见错误

- 直接计算大正 logits 的原始 exponentials，再把 overflow 当作 softmax 定义的一部分。
- 把“避免 overflow”写成“没有 underflow 或 rounding error”。
- Maximum 更新时不重标定旧 denominator。
- 忽略输出 probabilities 所需的第二遍读。
- 把 `2Mb` static difference 写成 actual DRAM traffic 或 speedup。
- 把 host arithmetic 或本页解答写成 CUDA Evidence Status。

复核日期：**2026-09-03**。四个 evidence arrays 保持为空。
