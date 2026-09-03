---
title: 'A13 练习：SpMM、Sparse-vs-Dense 与预处理生命周期'
description: 手算 sparse-times-dense matrix product，审查稀疏与稠密账本，并设计可复用 preprocessing/workspace 合同。
pairId: a13-exercises
counterpart: /en/algorithms/sparse-matrix-multiplication-preprocessing/exercises/
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
unitId: A13-EXERCISES
prerequisites:
  - A13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a13-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/sparse-matrix-multiplication-preprocessing/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A13-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A13 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/sparse-matrix-multiplication-preprocessing/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需完成 [A13](/algorithms/sparse-matrix-multiplication-preprocessing/)。三题提交 SpMM worksheet、sparse-vs-dense audit 和 preprocessing lifecycle；不调用 L13 API，也不运行 EX20。

## 作答说明

先写 representation/operation contract，再做 arithmetic，最后列出尚缺的 version、workspace 与 runtime evidence。独立完成后才查看[复核解答](/algorithms/sparse-matrix-multiplication-preprocessing/solutions/)。

## 练习 1：手算 sparse-times-dense SpMM

**目标：** 对 A12 的 `A=[[4,0,-1,0,0],[0,0,0,0,0],[0,2,0,0,3],[5,0,0,7,0]]` 与 `B=[[1,2],[0,1],[3,0],[2,-1],[1,4]]`，按 stored entries 计算 `C=A B`。

**约束：** 写出 `M,K,N,nnz`；每个 A entry 更新 C 的两个 columns；empty row 输出两个零；分别核算 dense `MKN` 与 sparse `nnz*N` contributions。不得把 contribution difference 写成 timing。

**预期证据：** Shape contract、四条 row equations、完整 C、两条 contribution counts 与 evidence-boundary note。

**验收条件：** `C=[[1,8],[0,0],[3,14],[19,3]]`；dense 与 sparse counts 分别为 40 和 12；结果来自 exact host arithmetic，不是 GPU observation。

<details><summary>提示 1</summary>一个 stored `(i,k,a)` 把 `a*B[k,:]` 加到整行 `C[i,:]`。</details>

<details><summary>提示 2</summary>Row 3 是 `5*[1,2]+7*[2,-1]`。</details>

## 练习 2：拒绝只看 density 的 winner

**目标：** 审查 `M=3,K=4,N=3,nnz=5` 的候选。A 的 dense FP32 payload、CSR FP32/32-bit-index payload、dense contributions 和 sparse contributions 各是多少？解释为什么 storage 与 arithmetic 可能给出不同方向。

**约束：** CSR 使用 `nnz*(4+4)+(M+1)*4`；只计 A payload；不计 B/C traffic、conversion、workspace、preprocessing、cache、imbalance 或 tiling；最后写出 matched sparse-vs-dense experiment 所需 coordinates。

**预期证据：** 四个数字、included/excluded ledger、至少六项待测 coordinates 与 bounded verdict。

**验收条件：** Dense A 是 `48 B`，CSR A 是 `56 B`；dense 与 sparse contributions 是 36 和 15；结论指出本例 CSR payload 更大但 products 更少，无法选择 performance winner。

<details><summary>提示 1</summary>小矩阵中的 `M+1` offsets 可能抵消跳过零值的 storage savings。</details>

<details><summary>提示 2</summary>Matched experiment 至少要冻结 shape/distribution、types/layout、algorithm/workspace、hardware 与 correctness/timing method。</details>

## 练习 3：设计可复用 preprocessing/workspace 合同

**目标：** 一个固定 CSR sparsity pattern 将执行 500 次 SpMM；values 与 B/C pointers 可能逐次变化。写出从 descriptors、buffer-size query、conditional workspace allocation、optional preprocessing 到 repeated execution/verification 的 lifecycle，并定义何时必须重新准备。

**约束：** 使用 cuSPARSE v13.3 high-level owner facts但不写 API code；核对 exact format/algorithm support；一次只保留一个 active preprocessing buffer；indices/pattern 和 active workspace contents 按 reuse contract 保持；workspace bytes 未查询前写 `unknown`。不得假定 preprocessing 有收益或 observed determinism。

**预期证据：** 五阶段 sequence、ownership/lifetime table、reuse/invalidation rules、workspace-budget gate、correctness acceptance 与 falsifiable measurement plan。

**验收条件：** Plan 区分 descriptor metadata 与 call-level operation/compute type/algorithm，在 queried size 为零时不要求 allocation，并在更换 indices/pattern、algorithm-dependent contract 或 active buffer 时重新查询/准备；把 values/B/C changes 与 pattern changes 分开；不填写 workspace size、timing、speedup、winner 或 Evidence Status。

<details><summary>提示 1</summary>Persistent CSR arrays 与 temporary/acceleration workspace 是不同 allocation 和 lifetime。</details>

<details><summary>提示 2</summary>“500 次”只提供 amortization opportunity；是否获益仍需 exact support 和 matched measurement。</details>

## 下一步

查看[复核解答](/algorithms/sparse-matrix-multiplication-preprocessing/solutions/)，再完成 [PB-R3-016](/practice/#pb-r3-016)。L13 与 EX20 仍延后。
