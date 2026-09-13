---
title: 'P09 独立参考解答'
description: 推导相邻边贡献，保持 fake 元数据，拒绝没有依据的梯度主张。
pairId: p09-solutions
counterpart: /en/frameworks/operator-registration/solutions/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: solution-set
unitId: P09-SOLUTIONS
prerequisites: [P09-EXERCISES]
relatedUnits: [P09, EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p09-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/operator-registration/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P09-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'P09,EX22' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/operator-registration/solutions/" lang="en">Read the English counterpart</a>

## 先独立尝试

前置：[P09 练习（Exercise）](/frameworks/operator-registration/exercises/)。回顾 [P09](/frameworks/operator-registration/)，通过 [EX22](/examples/adjacent-energy/)对照代码。以下计算是原创预测，不是硬件观察记录。

## 解答 1：带符号的贡献

`x=[-1,1,0]` 的差分为 `[2,-1]`，因此 `y=[4,1]`。给定 `g=[2,-3]`，得到 `q=[8,6]`、`dx=[-8,2,6]`。内部输入接受前一条边的正贡献和后一条边的负贡献。梯度和为零，与平移不变性一致，但仍需逐分量比较。

长度五的偏移输入产生新连续长度四张量，步长一、存储偏移零，dtype 和设备不变。fake 不读取数值，却必须实施本地输入限制。使用带符号 n-1 的 new_empty 和表示范围的 torch._check。在 setup_context 保存 x，在规范反向函数中使用补零后的贡献之差。n=1 时空 q 两边补零都形成一个零。**有效替代方案：** 显式处理单元素后拼接端点与内部差分，前提是符号追踪和高阶导数仍成立。**常见错误：** fake 返回视图、忽略 g、符号颠倒、detach 保存的 x 导致二阶导数丢失。

## 解答 2：证据不能互换

真实长度四输入返回长度三，而 empty_like 返回长度四；元数据比较无需检查梯度算术便能暴露缺陷。改为新分配 n-1 输出。零反向会在练习 1 的非恒定输入和加权梯度上失败：预期 `[-8,2,6]` 不是零。用 float64 gradcheck 和有限差分容差，再用 gradgradcheck 检查支持的二阶导数。

保留 opcheck 检查模式、注册、fake 和 AOT 集成。除了显式 meta 调用，再在两个合法长度执行 fullgraph 动态前向与反向以检验符号元数据。**有效替代方案：** 为小向量独立构造稠密雅可比矩阵，作为补充而非删除数值检查。**常见错误：** 只用恒定输入、引用未保留的通过断言、把 fullgraph 当成融合承诺、把 CPU 报告变为 CUDA 运行已验证（Runtime-Verified）证据。

## 继续学习

对照 2026-09-13 核对的 [SRC-CUDA-084](/sources-and-versions/#src-cuda-084)评判 [PB-R5-009](/practice/#pb-r5-009)。集成结果、数值导数和设备执行分别记录。
