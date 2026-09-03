---
title: 'A11 复核解答：Attention 数值分解、Tile Merge 与 IO Ledger'
description: 复核 scaled attention row、跨 tile exact merge、VIS18 traffic、有效替代方案与常见错误。
pairId: a11-solutions
counterpart: /en/algorithms/attention-as-an-io-problem/solutions/
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
unitId: A11-SOLUTIONS
prerequisites:
  - A11-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a11-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/attention-as-an-io-problem/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A11-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/attention-as-an-io-problem/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A11 Exercises](/algorithms/attention-as-an-io-problem/exercises/)的独立解答。数值是 rounded real-arithmetic reference，traffic 是 static logical ledger；两者都不是 GPU observation。

## 解答 1：Scaled attention row

Dot products 是 `[1,0,1]`，除以 `sqrt(2)` 得 `[0.70710678,0,0.70710678]`。减去 maximum 后 weights 是 `[1,exp(-0.70710678),1] ~= [1,0.49306869,1]`，denominator `2.49306869`，所以 P 约为 `[0.40111209,0.19777581,0.40111209]`。`O[0]=p0+3p2=1.60444837`，`O[1]=2p1+p2=0.79666372`。P 非负且和为 1；显示 rounding 不授予 bitwise claim。

## 解答 2：Two-tile merge

First tile `[2,1]` 给 `(m_1,l_1,a_1)=(2,1+exp(-1),1+2exp(-1)) ~= (2,1.36787944,1.73575888)`。Second tile `[3,0]` 给 `(3,1+exp(-3),4+8exp(-3)) ~= (3,1.04978707,4.39829655)`。Merged maximum 是 3，旧 state 乘 `exp(-1)`，得到 `l=1.55300179`、`a=5.03684655`、`o=a/l=3.24329732`。Full-row shifted weights `[exp(-1),exp(-2),1,exp(-3)]` 给同一实数结果。

## 解答 3：VIS18 traffic

Materialized score 是 Q/K reads `64` 加 S write `64`，共 128 elements；normalize 是三次 S read 加 P write，共 256；value 是 P read 64、V read 32、O write 32，共 128。总计 512 elements 或 `2048 B`。Tiled 有 `T_r=T_c=2` 和四块 `4x4` scores：score 读 Q 32、K 64，共 96；normalize 不跨 boundary，0；value 读 V 64、写 O 32，共 96。总计 192 elements 或 `768 B`，静态差值 `1280 B`。Actual transaction、cache、time 与 backend 仍未知。

## 有效替代方案

- 可以交换为另一个小型 finite Q/K/V fixture，只要 shapes、scale 与独立 reference 明确。
- 可以用更多 tiles 合并，只要每一步保持 `(m,l,a)` invariant。
- 可以选择 K/V-outer schedule，但必须重算 Q/O state replay 与 residency。
- 可以加入 mask，但要定义 all-masked row、neutral value 和 traffic contract。

## 常见错误

- 把 `d_k` scale 写成 `d_v`，或沿 query dimension 做 softmax。
- 先 max-shift 再忘记 `1/sqrt(d_k)`，把两个目的混为一谈。
- Maximum 变化时只重标定 `l`，不重标定 `a`。
- 把 normalize 的 `0 B` 误读为没有 arithmetic work。
- 把 VIS18 query-outer ledger 称为 FlashAttention implementation traffic。
- 从 static logical bytes 推断 actual speedup 或 backend selection。

复核日期：**2026-09-03**。四个 evidence arrays 保持为空。
