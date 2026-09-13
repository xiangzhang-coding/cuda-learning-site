---
title: 'P12 独立参考解答'
description: 让派发声明对应已完成设备工作，在拒绝时保留注意力语义。
pairId: p12-solutions
counterpart: /en/frameworks/sdpa-dispatch-verification/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [review, matrix, debugging, transfer]
resourceKind: solution-set
unitId: P12-SOLUTIONS
prerequisites: [P12-EXERCISES]
relatedUnits: [P12]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p12-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/sdpa-dispatch-verification/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,matrix,debugging,transfer' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P12-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: P12 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/sdpa-dispatch-verification/solutions/" lang="en">Read the English counterpart</a>

## 复核你的尝试

先尝试[练习](/frameworks/sdpa-dispatch-verification/exercises/)。以下各行都不描述已经执行的后端。

## 解答 1：分阶段矩阵

每个 dtype/策略行都需要独立的可用性、完成、数值和轨迹字段。只有 CPU 区间不能提供 CUDA 派发；多个已识别后端事件有歧义；谓词为假表示不满足条件，不是成功回退。非预期执行失败和容差失败都会使尝试失败。不同选择使用相同的已舍入输入与 CPU float64 参考，遵守 P12 预定阈值。保存源码/wheel/组件/设备标识和实际轨迹哈希。没有 set_priority=True 的列表不是有序请求；即使请求有序，也不是已观察的选择。

## 解答 2：保留原操作

删除掩码改变注意力分布，dropout_p=0.2 在评估时仍执行 dropout，看见误差后放宽容差使验收失效。恢复 True 表示参与的原布尔掩码，显式传 dropout_p=0.0，测试前固定阈值。审查哪个实现支持完整请求；保留能够表达该请求的数学参考，或报告不支持。不能静默降精度或删功能。单独记录确定性（Determinism）控制；若改变可用条件，重新验证。VIS18 逻辑流量模型既不证明后端身份，也不证明数值验收。

## 迁移推理

[PB-R5-012](/practice/#pb-r5-012) 检查另一种错误派发推断。回到 [P12](/frameworks/sdpa-dispatch-verification/) 与 [SRC-CUDA-086](/sources-and-versions/#src-cuda-086)，审查日期 2026-09-13。书面解答不改变运行证据。
