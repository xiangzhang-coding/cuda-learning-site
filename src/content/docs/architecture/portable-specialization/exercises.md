---
title: 'H06 练习：分派与比较边界'
description: 修正回退选择，并建立有意义的异步比较。
pairId: h06-exercises
counterpart: /en/architecture/portable-specialization/exercises/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, dispatch, comparison, review]
resourceKind: exercise-set
unitId: H06-EXERCISES
prerequisites: [H06]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'PTX bulk copy', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'Paper exercise', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,dispatch,comparison,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H06 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/portable-specialization/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付物

精确先修：[H06](/architecture/portable-specialization/)。提交分派真值表和修正后的比较协议。纸面练习（Exercise）无需 GPU，执行仍**待硬件验证（Pending Hardware Verification）**。核对日期 2026-10-04，见 [SRC-CUDA-108](/sources-and-versions/#src-cuda-108)。

## 练习一：启动前回退

**目标：**审查 100f 程序在 10.3、12.1 设备上的 `portable`、`auto`、`specialized` 和非法模式行为。某处理器捕获所有特化启动失败，运行普通代码后打印“specialized PASS”。

**约束：**保留 EX25 整数契约、目标配置和错误语义。硬件失败不是资格判断；不引入实验性 API 或新精度模式。

**验收：**列出各情况的启动前选择或拒绝，指出虚假成功标签及上下文复用风险，提出未知 CC、跨家族 CC、缺少特化和非法模式测试。解释主机测试无法证明哪些 GPU 执行性质。

<details><summary>提示一</summary>显式请求特化与自动选择具有不同的失败契约。</details>
<details><summary>提示二</summary>启动前将构建目标集合与实际 CC 取交集，绝不通过回退抹去异步错误。</details>

## 练习二：完成与等量工作

**目标：**修正一个合成协议：屏障初始化为 128 次到达，但只有线程 0 到达；随后只计时 bulk copy 的提交，并与完整可移植内核比较。

**约束：**保持 256 个 int32 的 tile、128 个线程、一个提交者、1024 预期字节、对齐存储和不变输出。使用 EX25 的五次预热、十个各含 100 次启动的样本。不提供测量值。

**验收：**修正到达计数、阶段等待、消费者发布和存储生命周期；定义等价 event 区间、独立全输出／保护区检查、计数器缺失处理及分开的预期／记录字段。解释为什么增加阶段需要重新证明。

<details><summary>提示一</summary>事务屏障同时跟踪到达与字节，消费者数不必等于到达者数。</details>
<details><summary>提示二</summary>两条路径都测量完整的加载／消费内核，报告批次毫秒及启动次数。</details>

## 独立复核

尝试后阅读[解答](/architecture/portable-specialization/solutions/)，再做 [PB-R7-006](/practice/#pb-r7-006)。原创 CC BY 4.0；权利方引用保留原声明。
