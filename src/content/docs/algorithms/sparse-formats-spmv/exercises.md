---
title: 'A12 练习：COO、CSR、存储账本与 SpMV'
description: 从精确矩阵重建稀疏数组，核算 index overhead，并手算包含空行的 SpMV。
pairId: a12-exercises
counterpart: /en/algorithms/sparse-formats-spmv/exercises/
factCheckDate: '2026-09-04'
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
unitId: A12-EXERCISES
prerequisites:
  - A12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a12-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/sparse-formats-spmv/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A12-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A12 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/sparse-formats-spmv/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需完成 [A12](/algorithms/sparse-formats-spmv/)。三题提交 representation worksheet、storage ledger 与手算 SpMV；不编译或运行 CUDA/cuSPARSE。

## 作答说明

每题先冻结 shape、stored-entry policy、index base/type 与 value type，再计算。把 host arithmetic、static bytes 与 runtime evidence 分开；独立完成后才查看[复核解答](/algorithms/sparse-formats-spmv/solutions/)。

## 练习 1：从矩阵重建 COO 与 CSR

**目标：** 对 `A=[[4,0,-1,0,0],[0,0,0,0,0],[0,2,0,0,3],[5,0,0,7,0]]`，按零基、row-then-column order、unique coordinates 构造 COO `row_indices/column_indices/values` 与 CSR `row_offsets/column_indices/values`。

**约束：** 只存数学非零项；明确 `m,n,nnz`；说明空 row 1 的表示；检查 offsets 单调不减、首项为 0、末项为 `nnz`。不得把 repeated offsets 写成 duplicate coordinate。

**预期证据：** 一张六行 coordinate table、四个 physical arrays、四个 row ranges 和四条 structural invariants。

**验收条件：** `nnz=6`；COO rows 为 `[0,0,2,2,3,3]`，columns 为 `[0,2,1,4,0,3]`，values 为 `[4,-1,2,3,5,7]`；CSR offsets 为 `[0,2,2,4,6]`；row 1 range 是 `[2,2)`。

<details><summary>提示 1</summary>按行扫描，每遇到一个非零项就记录完整 `(row,column,value)`。</details>

<details><summary>提示 2</summary>CSR 的下一个 offset 等于当前累计 stored-entry count；空行不会增加它。</details>

## 练习 2：核算 index overhead 与 break-even 条件

**目标：** 对 `m=100,n=80,nnz=600`、FP32 values 与 32-bit indices，核算 dense、COO、CSR 的矩阵 payload，并写出三种通用公式。

**约束：** 不计 descriptor、allocator、alignment、workspace、vector/output 或 conversion；不能把 payload difference 改写成 transferred bytes 或 speedup；说明 index 改为 64-bit 后哪些项变化。

**预期证据：** 三条 symbolic formulas、三次 byte substitution、一条 64-bit sensitivity note 与一条 evidence boundary。

**验收条件：** Dense 为 `32000 B`，COO 为 `7200 B`，CSR 为 `5204 B`；指出 CSR 的 row-offset 部分是 `101*4=404 B`；只得出本 boundary 下的 storage comparison。

<details><summary>提示 1</summary>COO 每个 entry 是一个 value 加两个 indices；CSR 是 value、column index，再加 `m+1` offsets。</details>

<details><summary>提示 2</summary>使用 `dense=mn*b_v`、`COO=nnz*(b_v+2b_i)`、`CSR=nnz*(b_v+b_i)+(m+1)b_i`。</details>

## 练习 3：用 CSR ranges 手算 SpMV

**目标：** 使用练习 1 的 CSR 与 `x=[1,2,3,4,5]`，逐行计算 `y=A x`，并把 value reads、index reads、x gathers 与 row reductions 分开描述。

**约束：** 必须从 half-open ranges 取 entries；empty row 输出 0；列出 row lengths；只计六个 scalar product contributions，不声称 cache、transaction、load balance 或 runtime 结果。

**预期证据：** 四条 row equations、最终 y、row-length vector、requested-data categories 与 still-unknown list。

**验收条件：** `y=[1,0,19,33]`，row lengths 是 `[2,0,2,2]`；still unknown 至少包含 actual transferred traffic 与 elapsed time；没有 cuSPARSE call 或 Evidence Status。

<details><summary>提示 1</summary>Row 2 range `[2,4)` 对应 columns 1 与 4。</details>

<details><summary>提示 2</summary>`column_indices[k]` 选择 `x`；它可能形成 gather，而不是把 x 当作连续六项读取。</details>

## 下一步

查看[复核解答](/algorithms/sparse-formats-spmv/solutions/)，再完成 [PB-R3-015](/practice/#pb-r3-015)并进入 [A13](/algorithms/sparse-matrix-multiplication-preprocessing/)。
