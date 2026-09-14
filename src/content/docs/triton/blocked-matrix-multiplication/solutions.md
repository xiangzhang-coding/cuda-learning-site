---
title: 'T04 解答：掩码与存储值参考'
description: 复核归属和数值推导，不虚构运行证据。
pairId: t04-solutions
counterpart: /en/triton/blocked-matrix-multiplication/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice, next]
resourceKind: solution-set
unitId: T04-SOLUTIONS
prerequisites: [T04-EXERCISES]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton dot and masks', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/blocked-matrix-multiplication/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/blocked-matrix-multiplication/solutions/" lang="en">Read the English counterpart</a>

## 前置

精确前置 **[T04-EXERCISES]**：先尝试[练习（Exercise）](/triton/blocked-matrix-multiplication/exercises/)。这些是推导，不是已记录 GPU 观察。来源日期：2026-09-14；[SRC-CUDA-089](/sources-and-versions/#src-cuda-089)。

## 解答 1：矩形归属

网格 `(3,2)` 有六个程序。最后 `(pm,pn)=(2,1)` 从行 64、列 64 开始，只有行 64、列 64–96 有效，共 33 个输出。两次 K 迭代覆盖 0–31 和 32–63，其中坐标 63 无效。A 用 `row*K+inner`，B 用 `inner*N+column`，C 用 `row*N+column`。A 的行/归约掩码和 B 的归约/列掩码将无效乘积填零；C 的行/列掩码阻止写入。两次迭代间保持 FP32 累加器，最后一次性转为 FP16。[T04](/triton/blocked-matrix-multiplication/) 直接呈现审查过的实验内核，不保留第二份可执行副本。

## 解答 2：独立精度检查

精确乘积为 `[[-10,9],[14,-6]]`。例如左上角为 `1*2 + (-2)*3 + 3*(-2) = -10`。标量参考可以发现原生/候选共享缺陷，因为两实现都不定义预期值。对已存储 FP16 输入的双精度乘积应用声明的混合容差，并要求输出有限。相同 NaN 也必须失败。FP32 累加只改善中间阶段，输入和最终 FP16 舍入仍存在。尾部哨兵只能检测部分输出写，不能证明输入读取合法或所有写都安全。

## 练习题库复核

[PB-R5-017](/practice/#pb-r5-017) 中，K=33、BK=32 需要两次迭代。第二次只有归约坐标 32 有效，33–63 在**两个**操作数中都必须填零。M=N=32 无输出尾部，不代表没有 K 尾部。K=32 用例通过不能证明此行为；需要固定非整除 K 用例及完整参考检查。主机推导不授予运行状态。

## 继续

用 [LAB16](/labs/autotune-triton-gemm/) 验证，再进入 [T05](/triton/autotuning/) 测量。原创解答采用 CC BY 4.0；合格硬件证据出现前保持待硬件验证（Pending Hardware Verification）。
