---
title: 'T04 练习：明确块归属并检查精度'
description: 实现三组独立掩码，审查存储输入的正确性。
pairId: t04-exercises
counterpart: /en/triton/blocked-matrix-multiplication/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T04-EXERCISES
prerequisites: [T04]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton dot and masks', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/blocked-matrix-multiplication/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T04 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/blocked-matrix-multiplication/exercises/" lang="en">Read the English counterpart</a>

## 前置与说明

精确前置 **[T04]**：[分块乘法](/triton/blocked-matrix-multiplication/)。先做纸面练习（Exercise），再用 [LAB16](/labs/autotune-triton-gemm/) 学习者副本执行，继承其 Linux/GPU 门禁。证据数组保持为空。来源核查：2026-09-14，[SRC-CUDA-089](/sources-and-versions/#src-cuda-089)。

## 练习 1：实现矩形尾部

**目标：**保持实验签名实现 `blocked_product`，每程序负责一个输出块并遍历 K。推导 `(M,N,K)=(65,97,63)`、`(BM,BN,BK)=(32,64,32)` 的最后程序。

**约束：**连续 FP16 输入/输出、FP32 累加器、独立 A/B 读取与 C 写入掩码；禁止原子操作、输出取模回绕及故意不安全启动。保留四个候选和参考不变。

**验收：**给出网格、K 循环次数、有效输出坐标、最后 K 有效性及全部指针公式；解释零填充。提交实现差异和完整实验候选检查通过记录，或硬件阻塞及主机进展。

<details><summary>提示 1：把归属与归约分开</summary>网格覆盖 M/N，每个程序遍历 K。循环内部只有 K 坐标变化。</details>
<details><summary>提示 2：每次内存操作取两个条件的交集</summary>A 检查行/归约，B 检查归约/列，C 检查行/列。广播列向量与行向量，形成各指针矩阵。</details>

## 练习 2：拒绝误导性的精度检查

**目标：**审查“FP32 累加使 FP16 输入存储不再重要；和原生输出比较时允许相同 NaN 就够了；尾部干净证明读取安全”。

**约束：**保持实验 `0.02 + 0.002*abs(reference)` 阈值及有限性要求。不捏造 GPU 输出，不把候选当作自己的参考。

**验收：**找出三项错误，说明已存储值参考的构造方法，精确计算 A=`[[1,-2,3],[0,4,-1]]`、B=`[[2,1],[3,-1],[-2,2]]` 的乘积。解释即使原生与 Triton 共享缺陷，仍能检测哪些错误。

<details><summary>提示 1：列出三个精度边界</summary>输入舍入先于累加，输出舍入后于累加；更宽累加器无法撤销第一个边界。</details>
<details><summary>提示 2：检查独立值</summary>对已存储值做标量双精度乘积和补偿求和。容差比较前要求有限性；输入/保护区检查是额外证据。</details>

## 单独复核

尝试两题后再打开[解答](/triton/blocked-matrix-multiplication/solutions/)。[PB-R5-017](/practice/#pb-r5-017) 增加一项未见过的 K 尾部审查。
