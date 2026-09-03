---
title: 'A10 练习：Stable Softmax、Online State 与 Traffic Ledger'
description: 用 large-offset 数值 fixture、online normalizer invariant 和明确 boundary 的 fusion ledger 复核 A10。
pairId: a10-exercises
counterpart: /en/algorithms/numerically-stable-softmax/exercises/
factCheckDate: '2026-09-03'
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
unitId: A10-EXERCISES
prerequisites:
  - A10
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a10-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/numerically-stable-softmax/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A10 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/numerically-stable-softmax/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需完成 [A10](/algorithms/numerically-stable-softmax/)。三题提交 numerical worksheet、state invariant 和 static IO ledger；不编译或运行 CUDA。

## 作答说明

每题先声明 input domain 与 accounting boundary，再计算，最后写出结果不能支持的 claim。独立完成后才查看[复核解答](/algorithms/numerically-stable-softmax/solutions/)。

## 练习 1：手算 large-offset stable softmax

**目标：** 对 `x=[1000,1001,1002,1003]` 计算 row maximum、shifted logits、shifted exponentials、denominator 和四个 probabilities，并检查 nonnegative 与 sum-near-one invariants。

**约束：** 不直接计算 `exp(1000)` 等原始指数；显示至少 8 位小数；把显示值标为 rounded real-arithmetic reference；说明 max-shift 没有消除哪类 underflow。

**预期证据：** 一张含 `x_i-m`、`exp(x_i-m)`、`p_i` 的四行表，以及两个 invariant checks 和一条 evidence-boundary note。

**验收条件：** `m=1003`，denominator 约 `1.55300179`，最后一个 probability 约 `0.64391426`；四项和在显示精度内接近 1；没有 GPU 或 timing claim。

<details><summary>提示 1</summary>先把 logits 改写为 `[-3,-2,-1,0]`。</details>

<details><summary>提示 2</summary>至少一个 shifted exponential 等于 1，所以 finite-input denominator 不小于 1。</details>

## 练习 2：复核 online normalizer invariant

**目标：** 用 `m_0=-infinity,l_0=0` 扫描同一四项，列出每一步 `(m_j,l_j)`，并用 invariant `l_j=sum_{k<=j} exp(x_k-m_j)` 独立复核最后两步。

**约束：** 每次 maximum 改变时必须显式写 old-state rescale factor；不能先保存全部 exponentials 再称为 online；说明为什么输出所有 probabilities 仍可能需要第二遍 input read。

**预期证据：** 四行 state table、两个 invariant substitutions 和一个 pass ledger。

**验收条件：** States 依次约为 `(1000,1)`、`(1001,1.36787944)`、`(1002,1.50321472)`、`(1003,1.55300179)`；pass ledger 区分 normalizer pass 与 output pass。

<details><summary>提示 1</summary>Maximum 每增加 1，旧 `l` 先乘 `exp(-1)`。</details>

<details><summary>提示 2</summary>Invariant 的 exponent reference 总是当前 `m_j`，不是最初 maximum。</details>

## 练习 3：核算 pass 与 fusion traffic

**目标：** 对 `n=1024` 的 FP32 row，核算 stable three-pass 与 online-plus-output 的 logical bytes；再对 `M=4096` 的 FP32 intermediate 核算 fusion 删除一次 write/read 的 bytes。

**约束：** Scalar state 留在 fast storage；不保存 exponent array；不计 cache line、transaction overfetch 或 write allocation；fusion intermediate 没有其他 consumer 且不 spill。把所有 differences 标为 static analysis。

**预期证据：** 两条 pass ledgers、一条 `2Mb` substitution、assumption list 与“仍未知”列表。

**验收条件：** 两种 softmax schedule 分别是 `16384 B` 与 `12288 B`，difference 为 `4096 B`；fusion intermediate difference 为 `32768 B`；仍未知至少包含 actual traffic 与 elapsed time，不能填写 speedup。

<details><summary>提示 1</summary>Stable schedule 是 `4n` elements，online schedule 是 `3n` elements。</details>

<details><summary>提示 2</summary>Intermediate 的 write 和 later read 共 `2*4096*4` byte。</details>

## 下一步

查看[复核解答](/algorithms/numerically-stable-softmax/solutions/)，再完成 [PB-R3-013](/practice/#pb-r3-013)并进入 [A11](/algorithms/attention-as-an-io-problem/)。
