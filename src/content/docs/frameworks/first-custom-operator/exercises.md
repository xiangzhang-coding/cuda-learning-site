---
title: 'P08 练习：相邻边、块尾与流'
description: 实现原创相邻边合同，诊断块尾越界读取与错误流启动。
pairId: p08-exercises
counterpart: /en/frameworks/first-custom-operator/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: exercise-set
unitId: P08-EXERCISES
prerequisites: [P08]
relatedUnits: [EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p08-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/first-custom-operator/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P08 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX22 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/first-custom-operator/exercises/" lang="en">Read the English counterpart</a>

## 练习合同

前置：[P08](/frameworks/first-custom-operator/)。先在纸上解，再在自己的 [EX22](/examples/adjacent-energy/) 副本中实现。原生执行使用选定 Linux 配置，书面作答不需要 GPU。练习（Exercise）的预测与实际观察分开保存。

## 练习 1：每个输出实现一条边

**目标：** 实现相邻差分能量的 CPU 与 CUDA 前向路径，不把参考张量表达式当作本地实现。

**约束：** 只接受 P08 的输入合同。使用新输出、每线程一个输出、共用验证边界与输入设备的当前流。n=1 时不启动。

**预期证据：** 提交代码差异、`[0,0.5,-0.5,1]` 的手算输出，以及 n=1、257、258 时的输出数、块数、不活动线程数表。未执行测试标记为计划。

**验收标准：** 每个合法输出恰写一次，输入不变；偏移连续视图可用，步长二视图被拒绝。在准备好的主机上，CPU/CUDA 验证应在完成后比较全部元素。

<details><summary>提示 1：先数边</summary><p>含 n 个顶点的向量有 n-1 条相邻边。工作数量与最大合法输入读取下标不是同一个量。</p></details>
<details><summary>提示 2：保护两次读取</summary><p>分配 n-1 个输出，工作数为零时跳过启动；只有证明 i 小于输出数以后，才读取输入 i 和 i+1。</p></details>

## 练习 2：调试几乎正确的启动

**目标：** 诊断一个分配 n 个输出、用 i 小于 n 作保护、读取 x[i+1]，且总在默认流启动的候选实现。

**约束：** 生产者与消费者使用同一非默认当前流。不允许通过同步整个设备，或悄悄把所有输入复制到 CPU 修补候选实现。

**预期证据：** 给出 n=258 时首次越界的输入下标，解释 CPU 结果为什么不能证明流顺序，并提出 n=1 和当前流生产者—算子—消费者链的回归检查。

**验收标准：** 同时识别大小错误和独立的流顺序错误；修复分配、启动数量、边界保护及空输出处理；使用设备 guard 和当前流；检查结果前显式等待消费者完成。

<details><summary>提示 1：两个缺陷可以同时存在</summary><p>正确的边界不会自动排列另一条流中的工作。索引正确性与生产者—消费者顺序是两个独立主张。</p></details>
<details><summary>提示 2：提交顺序有作用域</summary><p>选定流必须依次承载生产者、算子和消费者。启动错误查询不是跨流依赖，也不是设备完成等待。</p></details>

## 审查你的证据

记录尝试后再阅读[独立解答](/frameworks/first-custom-operator/solutions/)，然后完成 [PB-R5-008](/practice/#pb-r5-008)。[SRC-CUDA-084](/sources-and-versions/#src-cuda-084)提供精确一手来源和 2026-09-13 复核边界。练习答案不授予 CUDA 证据状态（Evidence Status）。
