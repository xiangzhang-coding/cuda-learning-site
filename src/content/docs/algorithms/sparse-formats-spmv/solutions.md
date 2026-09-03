---
title: 'A12 复核解答：COO、CSR、存储账本与 SpMV'
description: 复核稀疏数组、空行、payload formulas、SpMV 计算、有效替代方案与常见错误。
pairId: a12-solutions
counterpart: /en/algorithms/sparse-formats-spmv/solutions/
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
unitId: A12-SOLUTIONS
prerequisites:
  - A12-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a12-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/sparse-formats-spmv/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A12-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A12-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/sparse-formats-spmv/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A12 Exercises](/algorithms/sparse-formats-spmv/exercises/)的独立解答。所有数组、bytes 与结果都是 representation reasoning、exact host arithmetic 或 static accounting，不是 CUDA/cuSPARSE observation。

## 解答 1：COO 与 CSR

按 row-then-column order，六个 coordinates 是 `(0,0,4)`、`(0,2,-1)`、`(2,1,2)`、`(2,4,3)`、`(3,0,5)`、`(3,3,7)`。所以 COO rows/columns/values 分别是 `[0,0,2,2,3,3]`、`[0,2,1,4,0,3]`、`[4,-1,2,3,5,7]`。累计每行 stored count `2,0,2,2` 得 CSR offsets `[0,2,2,4,6]`；ranges 是 `[0,2)`、`[2,2)`、`[2,4)`、`[4,6)`。Offsets 从 0 开始、单调不减、长度 5、末项 6；unique coordinate 与 repeated empty-row offsets 不冲突。

## 解答 2：Storage payload

通用 formulas 是 `mn*b_v`、`nnz*(b_v+2b_i)`与 `nnz*(b_v+b_i)+(m+1)b_i`。代入得到 dense `100*80*4=32000 B`，COO `600*(4+8)=7200 B`，CSR `600*(4+4)+101*4=4800+404=5204 B`。若改用 64-bit indices，COO 的两个 index terms 和 CSR 的 column/offset terms都翻倍，FP32 values 不变。这个结论不覆盖 allocator、alignment、workspace、traffic 或 time。

## 解答 3：SpMV

四行分别为 `4*1-1*3=1`、empty sum `0`、`2*2+3*5=19`、`5*1+7*4=33`，所以 `y=[1,0,19,33]`。Row lengths 是 `[2,0,2,2]`。Static categories 包含 six value reads、six column-index reads、row offsets、six logical x gathers 与 four outputs；cache/transactions、parallel assignment、imbalance、instruction count、elapsed time 和 speedup 都未观察。

## 有效替代方案

- 可以选择一基索引，但所有 row/column indices、offset interpretation 和 checks 必须一致改写。
- 可以保留 explicit zeros，但 `nnz`、arrays、storage 和 operation count 必须按 stored entries 重算。
- 可以采用无序行内 columns，只要 exact operation/version 允许且 duplicate policy 明确；不能继承本题 sorted assumption。
- 可以使用不同 traffic boundary，但要列出 included/excluded arrays，而不是复用这里的 payload numbers。

## 常见错误

- 省略 CSR 末尾 sentinel offset，或把 offsets 长度写成 `m`。
- 删除空行的 repeated offset，导致后续 row ranges 移位。
- 把 duplicate coordinates 与 repeated row offsets 混为一谈。
- 忘记 index arrays 也占 storage。
- 按 stored-entry ordinal 而不是 column index 读取 x。
- 从较少 payload 或 products 推断实际 GPU traffic、timing 或 speedup。

复核日期：**2026-09-04**。四个 evidence arrays 保持为空。
