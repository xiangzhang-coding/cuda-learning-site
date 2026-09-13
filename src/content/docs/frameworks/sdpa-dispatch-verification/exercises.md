---
title: 'P12 练习：审计派发证据'
description: 建立后端验证矩阵，诊断伪装成回退的语义修改。
pairId: p12-exercises
counterpart: /en/frameworks/sdpa-dispatch-verification/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, matrix, debugging, review]
resourceKind: exercise-set
unitId: P12-EXERCISES
prerequisites: [P12]
relatedUnits: [VIS18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p12-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/sdpa-dispatch-verification/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,matrix,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P12 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: VIS18 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/sdpa-dispatch-verification/exercises/" lang="en">Read the English counterpart</a>

## 练习合同

先完成 [P12](/frameworks/sdpa-dispatch-verification/)，只使用 PyTorch 2.11.0+cu128 的事实。书面预测不需要 GPU；运行行需要外部环境和真实产物。以下情景全部为构造案例。

## 练习 1：设计能区分结论的矩阵

**目标：** 对固定 `[1,2,128,64]` 输入，在 AUTO 和四种单后端策略间区分开启策略、可用条件与实际执行。

**约束：** 保留舍入后的输入，无掩码/dropout/GQA，scale=0.125，使用 P12 按 dtype 预定的容差。仅 CPU 区间不能标识 CUDA 后端。检查原生 BF16 门槛，保留不支持的行。

**预期证据：** 提交 dtype、步幅、策略、可用性/诊断、后端事件、设备内核、完成、误差、容差、源码/构建及环境清单（Environment Manifest）列。为报告解析器加入假想的仅 CPU 轨迹、多后端事件和强制不可用用例。

**验收标准：** 设备证据缺失或有歧义时按失败处理；不满足条件与执行失败不同；数值不匹配不能吞掉后记为跳过。不能从请求列表顺序推断 AUTO 结果。

<details><summary>提示 1：使用策略上下文</summary><p>单后端上下文阻止静默数学回退；多后端列表允许多个选择，只有 set_priority=True 才请求列表顺序。</p></details>
<details><summary>提示 2：命名前先关联</summary><p>把精确 ATen 后端事件与已完成设备工作关联。宽泛的 SDPA 区间或可用性谓词都不够。</p></details>

## 练习 2：诊断语义回退

**目标：** 审计一个程序：融合候选被拒绝后删除布尔掩码，在评估时使用 dropout_p=0.2，并放宽容差直到输出通过。

**约束：** 目标操作包含掩码，要求无 dropout 的确定性推理。不能重写参考、静默转换输入或声称 eval 会关闭函数式 dropout。

**预期证据：** 解释三个独立缺陷，提出保持参考的回退或明确不支持结果。为带掩码请求设计新的源码审查与矩阵；它超出 P12 狭窄的可执行夹具。

**验收标准：** 保留 True 表示参与的掩码语义和 scale，显式传 dropout_p=0.0，比较前固定容差，分别记录确定性（Determinism）与准确性。后端名称或 VIS18 动画不能证明这些性质。

<details><summary>提示 1：重读请求公式</summary><p>删除掩码会改变参与的 key。即使张量形状不变，也已是另一种操作。</p></details>
<details><summary>提示 2：保持三项决策独立</summary><p>Dropout 概率、后端可用性、数值验收是不同控制；不能仅为让一行变绿而修改它们。</p></details>

## 复核

对照[独立解答](/frameworks/sdpa-dispatch-verification/solutions/) 和 [PB-R5-012](/practice/#pb-r5-012)。[SRC-CUDA-086](/sources-and-versions/#src-cuda-086) 记录精确来源及权利，审查日期 2026-09-13。
