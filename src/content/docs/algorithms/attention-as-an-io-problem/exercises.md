---
title: 'A11 练习：Attention 数值分解、Tile Merge 与 IO Ledger'
description: 用一个可手算 attention row、跨 tile 的 exact online merge 和完整 materialized/tiled ledger 复核 A11。
pairId: a11-exercises
counterpart: /en/algorithms/attention-as-an-io-problem/exercises/
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
unitId: A11-EXERCISES
prerequisites:
  - A11
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a11-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/attention-as-an-io-problem/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A11 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/attention-as-an-io-problem/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需完成 [A11](/algorithms/attention-as-an-io-problem/)。三题分别提交 numerical decomposition、exact merge proof 与 static IO ledger；不调用任何后续 backend API。

## 作答说明

先冻结 shapes、precision、included/excluded operations 与 rounding，再计算。把 real-arithmetic reference 和 static traffic 与 CUDA/runtime evidence 分开。独立完成后才查看[复核解答](/algorithms/attention-as-an-io-problem/solutions/)。

## 练习 1：手算一个 scaled attention row

**目标：** 使用 `q=[1,0]`，`K=[[1,0],[0,1],[1,1]]`，`V=[[1,0],[0,2],[3,1]]` 与 scale `1/sqrt(2)`，计算三项 scores、stable row probabilities 和 output vector。

**约束：** 显示 `d_k=2,d_v=2,n_q=1,n_k=3`；先 scale 再 max-shift；显示至少 6 位小数；把结果标为 rounded real-arithmetic reference。

**预期证据：** Shape table、三个 dot products、softmax worksheet、一个 `1x2` output 和 probability invariants。

**验收条件：** Scores 约为 `[0.707107,0,0.707107]`，probabilities 约为 `[0.401112,0.197776,0.401112]`，output 约为 `[1.604448,0.796664]`；没有 bitwise 或 GPU claim。

<details><summary>提示 1</summary>减去 row maximum 后 logits 是 `[0,-1/sqrt(2),0]`。</details>

<details><summary>提示 2</summary>Output 第一项是 `p0*1+p1*0+p2*3`。</details>

## 练习 2：合并两个 online attention tiles

**目标：** 对 scores `[2,1,3,0]`、scalar V `[1,2,4,8]`，按 tiles `[2,1]` 与 `[3,0]` 计算各自 `(m_t,l_t,a_t)`，再用 A11 recurrence 合并并输出 `o=a/l`。

**约束：** 初始 running state 是 `(-infinity,0,0)`；必须显式写旧 tile 的 rescale factor；用独立 full-row stable calculation 复核；exact 只指实数算术等价。

**预期证据：** 两个 tile-state rows、一个 merge row、full-row reference 与 floating-point boundary note。

**验收条件：** First tile 约为 `(2,1.367879,1.735759)`，second tile 约为 `(3,1.049787,4.398297)`；merged `(m,l,a)` 约为 `(3,1.553002,5.036847)`，`o` 约为 `3.243297`。

<details><summary>提示 1</summary>合并时 `m'=3`，旧 tile state 乘 `exp(2-3)`。</details>

<details><summary>提示 2</summary>Full-row reference 使用 shifted weights `[exp(-1),exp(-2),1,exp(-3)]`。</details>

## 练习 3：独立推导 VIS18 traffic

**目标：** 对 unmasked self-attention `N=8,d=4`、FP32、`Br=Bc=4`，分别核算 materialized stable schedule 和 query-outer tiled schedule 的每阶段 elements/bytes、tile counts 与总差值。

**约束：** Q/K/V 已存在；O 分离；materialized normalization 三读 S、一写 P；tiled Q/accumulator/row state 留在 fast storage；不计 projection、cache line、transaction、mask、backward 或 spill。差值标为 static analysis。

**预期证据：** 两张三阶段表、一张 `2x2` temporary-score-tile grid、总和检查与“不支持的 claim”列表。

**验收条件：** Materialized stages 是 `128/256/128 elements`，共 `2048 B`；tiled stages 是 `96/0/96 elements`，共 `768 B`；四个 score tiles，每块 16 elements；difference 是 `1280 B`，没有 timing/speedup/backend conclusion。

<details><summary>提示 1</summary>Materialized total 使用 `4Nd+6N^2`。</details>

<details><summary>提示 2</summary>Tiled score 读 `Q=32,K=64`，value stage 读 `V=64`并写 `O=32`。</details>

## 下一步

查看[复核解答](/algorithms/attention-as-an-io-problem/solutions/)，再操作 [VIS18](/visuals/attention-memory-traffic/)并完成 [PB-R3-014](/practice/#pb-r3-014)。
