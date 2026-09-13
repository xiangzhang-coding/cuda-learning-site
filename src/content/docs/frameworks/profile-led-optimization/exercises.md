---
title: 'P11 练习：诊断并只改变一个变量'
description: 审计计时声明，制作保留算子合同的启动几何候选。
pairId: p11-exercises
counterpart: /en/frameworks/profile-led-optimization/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, diagnosis, implementation, review]
resourceKind: exercise-set
unitId: P11-EXERCISES
prerequisites: [P11]
relatedUnits: [EX22, LAB14]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p11-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/frameworks/profile-led-optimization/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,diagnosis,implementation,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P11-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P11 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'EX22,LAB14' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/frameworks/profile-led-optimization/exercises/" lang="en">Read the English counterpart</a>

## 练习合同

先完成 [P11](/frameworks/profile-led-optimization/)。书面审计不需要 GPU；[EX22](/examples/adjacent-energy/) 候选只在 [LAB14](/labs/profile-custom-operator/) 声明的环境中执行。以下构造情景不是已观察报告。

## 练习 1：拒绝不公平比较

**目标：** 审计“候选 CPU 提交区间只有一半，所以快两倍”的声明。

**约束：** 基线包含首次编译与形状记录；候选已预热。未提供 CUDA 完成、设备轨迹、源码/wheel 标识或环境清单（Environment Manifest）。不能编造缺失的时间。

**预期证据：** 提交分阶段表格，列明已知、未知和错误推断。设计匹配计时与独立分析运行，明确预热、事件完成、七组采样、分配范围和交替运行顺序。

**验收标准：** 拒绝加速比声明，保留两次尝试，要求匹配二进制标识、正确性和无分析器的原始样本。解释 CPU 提交时长为何不是设备完成时间。

<details><summary>提示 1：定位边界</summary><p>Python 调用返回时，它排队的 GPU 工作是否已经完成？</p></details>
<details><summary>提示 2：分开三类成本</summary><p>首次编译、稳态执行与分析器插桩不能在不同候选间混用。</p></details>

## 练习 2：实现 128 线程候选

**目标：** 只把 EX22 CUDA 启动几何从 256 改为 128 线程，并扩展边界验证。

**约束：** 保留 schema、CPU/CUDA 输入规则、单元素行为、偏移视图、当前流、启动检查、fake/meta、梯度和提前编译（Ahead-of-Time，AOT）打包。不使用 fast-math，也不缩窄 dtype。

**预期证据：** 提交差异、源码/wheel 哈希，推导 n=128,129,130,258 的线程块数，并提交实际 CPU/CUDA/集成/导入结果。在 LAB14 完整尺寸/dtype 矩阵上比较候选与原始 EX22。没有硬件是阻塞，不是通过。

**验收标准：** 全部输出、加权梯度、数值一阶/二阶梯度通过；两条原生路径可构建，已安装导入有效。没有可重复收益，或回退违反预先声明策略时保留原始实现。

<details><summary>提示 1：先数输出</summary><p>启动覆盖 n-1 个输出，不是 n 个输入元素。</p></details>
<details><summary>提示 2：保留向上取整</summary><p>正 count 和线程块大小 b 时，整数除法 blocks=(count+b-1)/b；零 count 在启动前处理。</p></details>

## 复核

尝试两题后打开[独立解答](/frameworks/profile-led-optimization/solutions/)，再审计 [PB-R5-011](/practice/#pb-r5-011)。精确来源和权利记录见 [SRC-CUDA-086](/sources-and-versions/#src-cuda-086)，审查日期 2026-09-13。
