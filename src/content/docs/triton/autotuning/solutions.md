---
title: 'T05 解答：审查选中配置'
description: 保留冷启动成本，把性能结论限定在合格测量范围内。
pairId: t05-solutions
counterpart: /en/triton/autotuning/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice, next]
resourceKind: solution-set
unitId: T05-SOLUTIONS
prerequisites: [T05-EXERCISES]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton autotuner', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/runtime/autotuner.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/autotuning/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/autotuning/solutions/" lang="en">Read the English counterpart</a>

## 前置

精确前置 **[T05-EXERCISES]**：先完成[练习（Exercise）](/triton/autotuning/exercises/)。任何解答都不是 GPU 观察。核查于 2026-09-14；[SRC-CUDA-089](/sources-and-versions/#src-cuda-089)。

## 解答 1：选择需要候选历史

回调接受两个参数，记录 `return_mode='all'` 样本，检查正值/有限性并返回中位数。按声明顺序记录四个候选，验证选中 Config 等于首个最小中位数候选。保留未完成尝试与失败阶段，不能把缺失候选序列化成成功。实验原创 `check.py` 与 `contract.py` 实现此验收边界。

先执行编译请求与全部候选正确性，再预热候选，用新的形状局部调优器搜索。相同键调用必须保持回调次数不变。重新验证选中输出，预热选中配置的直接启动和输出匹配的原生基线，再收集新的三轮稳态样本。单独保留搜索与缓存命中墙钟时间，它们都不是稳态内核事件统计。

## 解答 2：比值需要相同范围

虚构输入的 `40/0.1=400` 算术正确，却不能得出稳态变慢结论。分子可能含编译与搜索，分母范围未声明。保留成本供一次性分析，另行收集匹配的稳态样本。不要丢弃冷启动成本，也不要把内部样本加到外部墙钟总计上。

JIT 产物、内存选择、磁盘选择及 GPU 数据缓存各有用途。记录 GPU UUID/CC/内存、驱动、包锁、Python/torch/Triton/工具链、源码哈希/提交、形状/类型/步长/精度、候选、同步/缓存范围、预热、时钟/功耗/负载及原始重复统计。缺少合格硬件时保留待硬件验证（Pending Hardware Verification）。轮次重叠或不稳定时，应判为差异不明确，而非挑最好结果。

## 练习题库复核

[PB-R5-018](/practice/#pb-r5-018)：M/N/K 加类型的键不是设备身份。不要把第一块 GPU 的缓存选择当作第二块的证据。对第二块使用新进程/调优器，重新执行环境、正确性、搜索和选后计时。即使选中 Config 恰好相同，也分别保留两份环境清单（Environment Manifest）和结论。本答案不暗示新结果。

## 继续

返回 [LAB16](/labs/autotune-triton-gemm/) 与 [T05](/triton/autotuning/)。原创解答采用 CC BY 4.0。把调优选择解释为合格证据前，必须有经过审查的独立环境清单。
