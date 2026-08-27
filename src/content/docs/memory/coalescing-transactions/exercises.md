---
title: 'M02 练习：从地址集合推导 Segment'
description: 用三道任务计算 aligned、offset、stride 与 tail-warp segment sets，修复错误模型，并设计 prediction/measurement ledger。
pairId: m02-exercises
counterpart: /en/memory/coalescing-transactions/exercises/
factCheckDate: '2026-08-27'
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
unitId: M02-EXERCISES
prerequisites:
  - M02
relatedUnits:
  - M02
  - EX05
  - VIS04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M02 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M02,EX05,VIS04' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/coalescing-transactions/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M02：把合并访问理解为事务塑形](/memory/coalescing-transactions/)。练习只要求整数地址推理、伪代码或 host/browser helper；不需要 CUDA-capable system，静态 count 不是 runtime evidence。

## 作答方法

每题固定 capability boundary、instruction、active mask、word width、base alignment、offset 与 stride，再列 requested words、segment set 和最窄结论。完成后查看[参考解答](/memory/coalescing-transactions/solutions/)。

## 练习 1：重建三个 frozen fixtures

**目标：** 设 `B mod 32 = 0`，32 lanes 全部 active，每 lane 读一个自然对齐 4-byte word，分别计算 `(offsetBytes, strideWords) = (0,1)`、`(4,1)`、`(0,2)`。

**约束：** 必须列 first/last requested word、每个 32-byte segment boundary 和 distinct segment indices；不得只写答案；不得产生 runtime ratio。

**预期证据：** 三行 address ledger，包含公式、requested byte interval 或离散 words、segment set、segment count 与 requested payload bytes。

**验收条件：** Aligned contiguous 得到 `{0,1,2,3}` 和 4；one-word offset 得到 `{0,1,2,3,4}` 和 5；stride two 得到 `{0,1,2,3,4,5,6,7}` 和 8；三者 requested payload 都是 128 bytes；结论不包含 speedup。

<details><summary>提示 1</summary>用 relative segment index `floor((address - B) / 32)`。</details>

<details><summary>提示 2</summary>Stride case 不是一个连续 128-byte interval；列每个 word start。</details>

## 练习 2：让 active mask 先于 segment count

**目标：** 为 aligned base、stride 1、4-byte words 计算三条 instruction：A 的 active lanes 是 0..4；B 的 active lanes 是 7..9；C 的 active lanes 是 0..31，但 lane address 被 reverse permutation 为 `B + 4*(31-i)`。

**约束：** 每条 instruction 独立建 set；inactive lanes 不得补齐；permutation 只改变 lane-to-address mapping 时不得改变 address set；不得把三条 instruction 合并。

**预期证据：** Active lane -> address -> segment mapping，以及对“tail warp 总是四个 segments”和“reverse order 一定不 coalesced”两句的审查。

**验收条件：** A 只触及 segment `{0}`；B 触及 `{0,1}`，因为 lane 7 请求 bytes 28..31，lanes 8..9 位于下一 segment；C 仍触及 `{0,1,2,3}`；两句绝对断言都被拒绝。

<details><summary>提示 1</summary>Segment count 取决于 address set，不取决于 lane 编号是否连续。</details>

<details><summary>提示 2</summary>Lane 7 的 word 仍完全位于 segment 0；lane 8 才进入 segment 1。</details>

## 练习 3：设计 EX05 prediction/observation ledger

**目标：** 为 EX05 `access-kernel` 的 aligned、offset、stride modes 写一份未来可执行但当前不执行的验证计划，防止 segment prediction 被误报为 profiler 或 speed evidence。

**约束：** 固定 logical payload、input、output verification、launch shape 和 compiler target；分别记录 expected segments、metric name/definition、cache state policy、Environment Manifest、warm-up、timing boundary 和 repetitions；当前 observation fields 必须为空。

**预期证据：** 一张 prediction/observation schema、三条 expected rows 和一份禁止结论列表。

**验收条件：** Expected rows 是 4/5/8；schema 不要求 profiler transaction counter 与它们逐值相等；actual requests/cache reuse/timing 都保留为 unobserved；禁止从 count 写 latency、bandwidth、faster 或 speedup；correctness verification 先于 timing。

<details><summary>提示 1</summary>Prediction 字段描述 address model；observation 字段必须带 tool/metric/run coordinates。</details>

<details><summary>提示 2</summary>“未观测”比填入由 hand calculation 推出的假数据更完整。</details>

## 下一步

完成后查看独立的[参考解答](/memory/coalescing-transactions/solutions/)，再到[练习题库（Practice Bank）PB-R1-014](/practice/#pb-r1-014)审查另一份越界结论。
