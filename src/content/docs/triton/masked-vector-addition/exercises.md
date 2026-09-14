---
title: 'T02 练习：保护读取与写入'
description: 修复掩码方案并设计能发现边界问题的正确性测试，不执行不安全内核。
pairId: t02-exercises
counterpart: /en/triton/masked-vector-addition/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T02-EXERCISES
prerequisites: [T02]
relatedUnits: [EX23]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton masked memory semantics', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/core.py', version: '3.7.1', platform: 'Paper exercise', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/masked-vector-addition/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T02 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX23 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/masked-vector-addition/exercises/" lang="en">Read the English counterpart</a>

## 前置与说明

精确前置为 `[T02]`：阅读 [T02](/triton/masked-vector-addition/) 并检查 [EX23](/examples/triton-vector-add/)。在纸面审查改动，不执行故意去掉掩码的内存访问。所有证据数组保持为空。来源核查：2026-09-14，[SRC-CUDA-087](/sources-and-versions/#src-cuda-087)。

## 练习 1：选值不等于保护读取

**目标：** 修复一个方案：第一个输入使用 `tl.where(i < N, tl.load(a + i), 0.0)`，只有第二个输入读取带掩码，结果写入没有掩码。取 `N=259, B=128`。

**约束：** 保持逐元素运算与输入等长。针对规范源码说明改动，不维护第二份完整内核。不得把输出保护区当作有效输出。

**验收条件：** 计算程序实例（program instance）数、最后一个实例的有效与无效索引区间，并指出每个不安全操作。说明两次读取的掩码、填充值和写入掩码；解释为何选择零不能保护已经求值的读取。

<details><summary>提示 1：推理求值顺序</summary>`where` 选值前会求值参数。内存操作需要自己的谓词。</details>
<details><summary>提示 2：有三次访问要保护</summary>最后一个实例从 256 开始。由 `i < 259` 推导有效性，把谓词传给每个指针张量读写操作，而不只是算术。</details>

## 练习 2：发现最后一个输出漏写

**目标：** 一个变异将写入谓词从 `i < N` 改成 `i < N-1`。设计即使最后一个预期和为零，也能确定失败的测试。

**约束：** 使用 CPU 参考并在完成后检查所有输出。不依赖未初始化内存、校验和或只检查前缀。至少包含一个恰好整除尺寸和一个不完整块尺寸。

**验收条件：** 指定初始化、尺寸、比较与有限性规则、保护区检查，以及它们各自能发现的缺陷。说明 CPU 模拟通过为什么不能建立 GPU 正确性。

<details><summary>提示 1：不要依赖恰好有利的初值</summary>预期值为零时，零初始化会掩盖漏写。选择验收规则排除的哨兵值。</details>
<details><summary>提示 2：测试两种边界</summary>使用 256 和 257，拒绝有效输出中的任何非有限值。分开逻辑输出检查和尾部保持不变检查。</details>

## 单独核对

写完测试契约后，再对照[解答](/triton/masked-vector-addition/solutions/)。[练习题库](/practice/#pb-r5-014) 另有一项报告审查任务。
