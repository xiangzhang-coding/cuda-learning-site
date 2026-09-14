---
title: 'T03 独立参考解答'
description: 完成练习后复核稳定掩码、独立检查和有边界的性能结论。
pairId: t03-solutions
counterpart: /en/triton/fused-softmax/solutions/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank, next]
resourceKind: solution-set
unitId: T03-SOLUTIONS
prerequisites: [T03-EXERCISES]
relatedUnits: [T03, LAB15]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton reduction source', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/standard.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/fused-softmax/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'T03,LAB15' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/fused-softmax/solutions/" lang="en">Read the English counterpart</a>

## 先尝试再对照

精确前置 **[T03-EXERCISES]**：先完成[练习](/triton/fused-softmax/exercises/)。这里是推导解答，不是 GPU 观察。审查日期 2026-09-14；[SRC-CUDA-088](/sources-and-versions/#src-cuda-088)。

## 解答一：同时保留归约和地址合同

三个相等的 −1000 分数（logits）归一化后，每项为三分之一。对 `[1000,1001,1002]` 减去 1002，权重正比于 `[exp(-2),exp(-1),1]`，概率约为 `[0.09003057317,0.24472847105,0.66524095577]`。这是数学参考值，不是实测 GPU 输出。

列数 33 使用 tile 64：有效列 0–32，无效列 33–63。将你的实现与 [T03](/triton/fused-softmax/) 呈现的共用源码比较。无效加载填负无穷，减最大值、求指数、归约权重、相除，再屏蔽存储。填零会污染归一化；存储掩码不能修复算术。每行有唯一归属者，因此不需要跨行屏障。

对全部实验（Lab）用例执行不变的独立参考、有限值/范围和行和检查。即使零输出看似合理，NaN 哨兵也能暴露最后一项漏写。保留尾部保护区和输入不变检查。主机通过验证的是主机策略；只有合格外部运行才能提供 GPU 证据。

## 解答二：流量账本不是基准测试

共 165 个元素。物化账本为 `4*(8*165+4*5) = 5360` 字节；融合账本为 `8*165 = 1320` 字节。比值约 4.06，单位是**逻辑字节之比**，不是时间之比。原生 Softmax 不一定物化这份规格。

首次启动墙钟可能包含编译和初始化。单独保存编译，声明未自动调优，预热设备执行，按所选辅助函数的毫秒预算和 `return_mode='all'` 测量。匹配预分配输出、已存储输入、dtype、流、缓存策略与负载。保留窄行和宽行的全部轮次、中位数与范围。受控证据支持选择前，四线程束只是候选。若波动掩盖差异，报告不确定。没有实际日志与完整环境清单（Environment Manifest）时，LAB15 保持待硬件验证（Pending Hardware Verification）。

## 练习题库（Practice Bank）解答

<a id="pb-r5-015-solution"></a>

### PB-R5-015：零填充陷阱

三个相等 −1000 值以零填充至四项，零成为最大值。有效项指数下溢，无效项指数为一。存储的有效概率因此变为零而非三分之一，行和检查失败。负无穷填充保留最大值 −1000，产生三个一和一个零，再除以三。只测整二次幂列数会漏掉这一缺陷。

<a id="pb-r5-016-solution"></a>

### PB-R5-016：不可比的范围

预分配的 Triton 前向与包含传输/分配的原生 Softmax 属于不同工作负载。图重放时间与清理缓存的设备事件时间也不同。按同一声明协议重跑双方，将首次调用/JIT 和调优与稳态分开，保留所有形状/轮次以及硬件和负载坐标。较小的数字或流量账本都不能建立加速比。在这些观察存在前，不能宣布赢家或流量结论。

## 继续

返回 [T03](/triton/fused-softmax/)，或在固定环境执行 [LAB15](/labs/verify-fused-softmax/)。正确且有记录地发生性能回退也是有效结果；不要用预期值代替缺失测量。
