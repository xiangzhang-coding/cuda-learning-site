---
title: 'A08 练习：GEMM Oracle、Partial Tiles 与数值验收'
description: 用手算 oracle、partial M/N/K participation ledger 和 finite abs-plus-rel comparison packet 复核 tiled GEMM。
pairId: a08-exercises
counterpart: /en/algorithms/tiled-gemm-correctness/exercises/
factCheckDate: '2026-08-31'
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
unitId: A08-EXERCISES
prerequisites:
  - A08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a08-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/tiled-gemm-correctness/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A08 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/tiled-gemm-correctness/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [A08](/algorithms/tiled-gemm-correctness/)。这三题提交静态 oracle、phase ledger 与 acceptance packet；不编译或执行 CUDA。

## 作答说明

先写 logical equation，再写 ownership/phase，最后写 evidence boundary。独立完成后才查看[复核解答](/algorithms/tiled-gemm-correctness/solutions/)。

## 练习 1：建立 hand-computable naive GEMM oracle

**目标：** 对 row-major `A=[[1,2,3],[4,5,6]]`、`B=[[1,2],[3,4],[5,6]]`、`alpha=1`、`beta=0`，写出 `M=2,K=3,N=2` 的每个 output dot product、linear addresses 与 final C vector。

**约束：** 每个 output 只有一个 owner；必须使用 A stride K 与 B/C stride N；不得用 square assumption；逐项显示 K=3 的累加。

**预期证据：** 四条 dot-product equations、一张 address table 与 row-major C vector。

**验收条件：** C 是 `[22,28,49,64]`；indices 覆盖 `0..3` 恰好一次；equation 可直接作为 CPU reference fixture。

<details><summary>提示 1</summary>先固定 `(row,col)`，让 `p` 从 0 到 2。</details>

<details><summary>提示 2</summary>`A[row*K+p]` 与 `B[p*N+col]` 使用不同 leading dimension。</details>

## 练习 2：证明 partial M/N/K tile 的统一参与

**目标：** 对 `M=18,K=19,N=17`、`TM=TN=TK=16`，审查 bottom-right output block。写出 output grid、valid outputs、两个 K slices 的 valid shared loads、zero-fill 与 barrier ledger。

**约束：** Block 有 256 threads；每个 K slice 有 load、barrier、compute、barrier；invalid output thread 不能 early return；第二个 K slice 的 K-valid width 是 3。

**预期证据：** `2x2` output-grid diagram、每 slice 的 A/B guard table、两次 256-participant barrier 和 final-store guard。

**验收条件：** Bottom-right block 有 `2x1=2` valid outputs；K slices 数是 2；所有 out-of-bounds shared slots 写 0；每 slice 两个 barriers 都有 256 participants。

<details><summary>提示 1</summary>Output block origin 是 `(row=16,col=16)`。</details>

<details><summary>提示 2</summary>K-tail validity 与 output M/N validity 是三个独立 predicates。</details>

## 练习 3：设计 finite tolerance 与 evidence packet

**目标：** 使用 `atol=1e-4`、`rtol=2e-5`，分别判断 `(reference,candidate)` 为 `(0,0.00005)`、`(1000,1000.01)`、`(4,4.5)`，再处理 NaN。为第一个失败值写 mismatch record。

**约束：** Allowed error 必须按 `atol + rtol * abs(reference)` 逐项计算；NaN/infinity 直接拒绝；host pass、CUDA compile、GPU correctness 与 timing 分成独立 fields。

**预期证据：** 四行 comparison table、一个 first-mismatch schema 与空的 compilation/runtime/performance observations。

**验收条件：** 前两项通过，`4.5` 失败，NaN 被拒绝；packet 不把 host test 写成 Compile-Checked，不填写 timing 或 speedup。

<details><summary>提示 1</summary>Reference 为 1000 时 relative term 是 `0.02`。</details>

<details><summary>提示 2</summary>Finite policy 在 error formula 之前执行。</details>

## 下一步

查看[复核解答](/algorithms/tiled-gemm-correctness/solutions/)，再用 [PB-R2-020](/practice/#pb-r2-020)、[EX15](/examples/tiled-gemm/)和 [VIS12](/visuals/gemm-tiling-hierarchy/)复核。
