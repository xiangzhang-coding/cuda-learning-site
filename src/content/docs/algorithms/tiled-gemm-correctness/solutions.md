---
title: 'A08 复核解答：GEMM Oracle、Partial Tiles 与数值验收'
description: 复核 hand-computable GEMM、partial M/N/K barrier proof、finite tolerance packet、有效替代方案与常见错误。
pairId: a08-solutions
counterpart: /en/algorithms/tiled-gemm-correctness/solutions/
factCheckDate: '2026-08-31'
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
unitId: A08-SOLUTIONS
prerequisites:
  - A08-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a08-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/tiled-gemm-correctness/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A08-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/tiled-gemm-correctness/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A08 Exercises](/algorithms/tiled-gemm-correctness/exercises/)的独立解答。所有结果都是 host arithmetic 与 static phase proof，不是 CUDA observation。

## 解答 1：Hand-computable oracle

四项是 `1*1+2*3+3*5=22`、`1*2+2*4+3*6=28`、`4*1+5*3+6*5=49`、`4*2+5*4+6*6=64`。C 的 row-major indices 依次为 0、1、2、3，所以 vector 是 `[22,28,49,64]`。A addresses 使用 `row*3+p`，B addresses 使用 `p*2+col`，C 使用 `row*2+col`。

## 解答 2：Partial tile participation

Output grid 是 `ceil(17/16) x ceil(18/16)=2x2`。Bottom-right origin `(16,16)` 只覆盖 rows 16、17 与 column 16，所以有 2 个 valid outputs。K slices 是 `[0,15]` 与 `[16,18]`。第二 slice 只有 3 个 K positions；其他 A/B shared slots 写 0。每个 slice 的 ledger 固定为 `guarded loads -> 256-thread barrier -> 16 products -> 256-thread barrier`，最后仅 2 个 owners store。

## 解答 3：Tolerance packet

`reference=0` 的 allowed error 是 `0.0001`，`0.00005` 通过。`reference=1000` 的 allowed error 是 `0.0001+0.02=0.0201`，约 `0.01` 的 error 通过。`reference=4` 的 allowed error 是 `0.00018`，`0.5` 失败。NaN 在公式前被 finite policy 拒绝。Mismatch record 写 index/row/column、4、4.5、0.5 与 0.00018。Compilation、runtime 与 performance fields 仍为空。

## 有效替代方案

- 可以使用另一个非方形 hand fixture，只要三个 leading dimensions 和逐项 oracle 都明确。
- Tile 可以不是 `16x16x16`，但必须重新证明 ownership、shared extents、guards 与 resource bound。
- CPU reference 可以采用更高精度库；必须与 candidate implementation 独立。
- 可声明更严格 tolerance 或 exact integer fixture，但不能在观察失败后放宽标准。

## 常见错误

- 把 B address stride 写成 K，或把 C 写成 M stride。
- 为每个 K slice 增加 output block，造成多个 writers。
- Invalid output thread 在 barrier 前 return。
- K-tail slot 不 zero-fill，读取旧 shared value。
- 只用 absolute 或 relative error，却没有声明合同。
- 把 host-reference pass、source inspection 或 VIS12 state 写成 CUDA evidence。

复核日期：**2026-08-31**。四个 evidence arrays 保持为空。
