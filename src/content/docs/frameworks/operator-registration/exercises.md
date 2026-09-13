---
title: 'P09 练习：元数据与导数'
description: 实现符号 fake 核函数及反向传播，再诊断误导性的集成报告。
pairId: p09-exercises
counterpart: /en/frameworks/operator-registration/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation,debugging, review]
resourceKind: exercise-set
unitId: P09-EXERCISES
prerequisites: [P09]
relatedUnits: [EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p09-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/operator-registration/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P09 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX22 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/operator-registration/exercises/" lang="en">Read the English counterpart</a>

## 练习合同

先完成 [P09](/frameworks/operator-registration/)。在自己的 [EX22](/examples/adjacent-energy/) 副本中使用 PyTorch 2.11.0+cu128 实现。练习（Exercise）的书面预测不需要 GPU；执行检查要保留实际设备及结果。

## 练习 1：元数据与向量—雅可比积

**目标：** 为本地相邻能量算子实现无存储 fake 注册和可微反向传播。

**约束：** 保持本地形状、布局、dtype、设备、大小及新输出检查；不读取 fake 数据。通过 setup_context 保存 x，反向只使用可微 PyTorch 操作，包括 n=1 情况。

**预期证据：** 提交差异，推导 `x=[-1,1,0]`、`g=[2,-3]` 的 y 和 dx。列出长度 5、存储偏移 2 的连续输入对应的 fake 输出元数据，并加入数值一阶、二阶导数及 opcheck 案例。

**验收标准：** 推导与实现一致；输出不别名输入；单元素反向为一个零；非法输入在本地与 fake 路径一致；opcheck 与 float64 gradcheck 分别记录用途。

<details><summary>提示 1：对一条边求导</summary><p>每个平方差向左输入贡献负项，向右输入贡献正项，两项都要乘以该输出的上游导数。</p></details>
<details><summary>提示 2：补零放置贡献</summary><p>计算 q=2*diff(x)*g。左补零定位正贡献，右补零定位负贡献；两者相减也能处理空 q。</p></details>

## 练习 2：调试错误验收报告

**目标：** 诊断 fake 返回 empty_like(x)、反向返回零张量、报告声称“opcheck 通过，因此梯度正确”的候选实现。

**约束：** 不放宽输出合同，不删除 opcheck。报告只提供上述断言而无真实日志，不得虚构观察到的失败输出。

**预期证据：** 指出 fake 形状不符以及关于导数的错误推论。设计分别暴露两个缺陷的独立测试，包括非均匀上游向量和 fullgraph 动态编译下的两个长度。

**验收标准：** fake 修复为 n-1 且拥有新存储元数据。导数由数值检查验证，不能由集成检查认证。缺失日志仍标记缺失；修正实现不能被称为运行已验证（Runtime-Verified）。

<details><summary>提示 1：分开报告与事实</summary><p>书面“通过”不是执行结果。即使真实集成检查通过，也不替代数学导数比较。</p></details>
<details><summary>提示 2：不要只选常量输入</summary><p>常量输入的差分为零，会掩盖零梯度缺陷。选择相邻值不等的输入，再用不等上游权重乘输出。</p></details>

## 审查

先尝试两项任务，再对照[独立解答](/frameworks/operator-registration/solutions/)，继续 [PB-R5-009](/practice/#pb-r5-009)。[SRC-CUDA-084](/sources-and-versions/#src-cuda-084)记录 2026-09-13 的 API 与源码边界。
