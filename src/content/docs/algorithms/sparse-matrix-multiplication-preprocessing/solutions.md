---
title: 'A13 复核解答：SpMM、Sparse-vs-Dense 与预处理生命周期'
description: 复核 SpMM matrix result、矛盾的静态账本、preprocessing/workspace reuse、有效替代方案与常见错误。
pairId: a13-solutions
counterpart: /en/algorithms/sparse-matrix-multiplication-preprocessing/solutions/
factCheckDate: '2026-09-04'
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
unitId: A13-SOLUTIONS
prerequisites:
  - A13-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a13-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/sparse-matrix-multiplication-preprocessing/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A13-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A13-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/sparse-matrix-multiplication-preprocessing/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A13 Exercises](/algorithms/sparse-matrix-multiplication-preprocessing/exercises/)的独立解答。计算和 lifecycle 都是 host/static review，不是已执行的 cuSPARSE workflow。

## 解答 1：SpMM

`M=4,K=5,N=2,nnz=6`。Rows 分别是 `4*[1,2]-[3,0]=[1,8]`、`[0,0]`、`2*[0,1]+3*[1,4]=[3,14]`、`5*[1,2]+7*[2,-1]=[19,3]`，所以 `C=[[1,8],[0,0],[3,14],[19,3]]`。Dense definition 有 `4*5*2=40` contributions，stored-entry traversal 有 `6*2=12`。28 项 difference 只属于数学账本，不是 measured instruction、traffic 或 time。

## 解答 2：冲突的静态信号

Dense A payload 是 `3*4*4=48 B`；CSR 是 `5*(4+4)+(3+1)*4=40+16=56 B`。Dense contributions 是 `3*4*3=36`，sparse 是 `5*3=15`。所以该 boundary 下 CSR 多 8 B，但跳过 21 个 zero-product contributions。两项都没有覆盖 B/C traffic、access regularity、conversion、workspace、preprocessing、parallelism 或 hardware。Matched experiment 需要 exact matrix distribution、types/layouts、sparse/dense algorithms、workspace/preprocessing policy、device/software manifest、independent reference/tolerance 和同步后的 retained timing attempts。

## 解答 3：Preprocessing lifecycle

Sequence 是：冻结 representation 与 call-level operation/compute type/algorithm；创建只记录 object metadata 并引用 caller-owned arrays 的 descriptors；查询 exact combination 的 workspace bytes；仅在 size 大于零时于 budget 内分配 active device buffer；若 exact combination 支持且 pattern 将复用则选择性 preprocess；随后重复 execution 与 independent correctness check。Indices/pattern、descriptor metadata、call contract 或 active buffer 改变时重新验证 sizing/support 并按需 preprocess。Values 和 B/C pointers 的变化与 structural pattern changes 分开记录，是否允许复用由 exact v13.3 contract 核对。500 次只提供摊薄机会；workspace size、preparation cost、timing、determinism 与 winner 都保持 unknown，直到 L13/EX20 之后有合格 evidence。

## 有效替代方案

- 可以选择 COO 或其他 current-supported format，但必须重新核对 algorithm、workspace、preprocessing 与 ordering constraints。
- 可以选择 one-shot no-preprocess path，并把省略 preparation 写为 hypothesis 而不是 winner。
- 可以与 dense GEMM 比较，但必须让 operation、types、layouts、correctness 与 measurement boundary 匹配。
- Values 可以在 pattern 不变时更新，但 exact descriptor/API reuse rules 仍须按 pinned version 验证。

## 常见错误

- 把 `nnz*N` 当作完整 instruction 或 traffic count。
- 看到 sparse products 少就忽略 index overhead 与 irregular rows。
- 把 descriptor 当作 matrix values 的复制品。
- 在 buffer-size query 前发明 workspace bytes。
- 更换 indices 或 active buffer 后继续声称旧 preprocessing data 有效。
- 把 owner performance note、static arithmetic 或重复次数写成 observed speedup/determinism。

复核日期：**2026-09-04**。四个 evidence arrays 保持为空；L13 与 EX20 仍未发布。
