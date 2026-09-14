---
title: 'T03 练习：实现并审计 Softmax'
description: 实现稳定的带掩码归约，区分字节账本与运行证据。
pairId: t03-exercises
counterpart: /en/triton/fused-softmax/exercises/
factCheckDate: '2026-09-14'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T03-EXERCISES
prerequisites: [T03]
relatedUnits: [LAB15]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton reduction source', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/triton/language/standard.py', version: '3.7.1', platform: 'Paper and externally gated implementation', accessDate: '2026-09-14' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/fused-softmax/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-14' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T03 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB15 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/fused-softmax/exercises/" lang="en">Read the English counterpart</a>

## 先修条件与说明

精确前置 **[T03]**：[融合 Softmax](/triton/fused-softmax/)。先纸面作答，再使用 [LAB15](/labs/verify-fused-softmax/) 的学习者副本。实现的执行继承实验（Lab）的精确 Linux/GPU 门槛。这里所有证据数组为空。审查日期 2026-09-14；[SRC-CUDA-088](/sources-and-versions/#src-cuda-088)。

## 练习一：实现稳定的填充行

**目标：** 保持实验签名，实现每行一个程序实例（program instance）的 `normalize_rows`。看代码前解释三个相等 −1000 逻辑值以及 `[1000,1001,1002]` 的输出。

**约束：** FP32 有限连续行，列数至多 2048，无原子操作，无跨行通信，不用 `tl.softmax` 捷径。显式使用 max、exp、sum；加载/存储掩码保护所有尾部。不要运行故意省略掩码的不安全候选。

**验收：** 预测列数 33 的 tile 与无效列，说明加载填充值的中性作用，列出四阶段算术；不改容差，通过 LAB15 全部独立参考/有限值/行和/保护区检查。解释主机参考通过为何不等于 GPU 结果。提交实现差异与实际阶段退出码，或硬件阻塞。

<details><summary>提示一：赋予填充值中性作用</summary>最大值必须忽略无效位置，它们的指数贡献必须为零。零逻辑值通常不是中性值。</details>
<details><summary>提示二：分开地址有效性与归约</summary>使用二次幂 tile，两处内存操作都加 `columns &lt; WIDTH`，加载填负无穷。求指数前减去一个行最大值，再用一个行和归一化。</details>

## 练习二：修正性能结论

**目标：** 审核 `R=5,C=33` 的假设报告：“字节比就是加速比；首次启动就是稳态；`warmup=25` 表示 25 次迭代；四线程束最优。”报告没有测量或环境清单（Environment Manifest）。

**约束：** 不编造替代计时。对照原生 `torch.softmax`，匹配 dtype、形状和预分配输出范围。单独保留编译与调优成本。

**验收：** 算出物化和融合的逻辑字节数，标明比值含义，逐条纠正说法，列出独立参考、计时门禁、原始统计和环境坐标，并保持待硬件验证（Pending Hardware Verification）。至少包含一个窄行和一个宽行用例，以及差异不确定时的决策规则。

<details><summary>提示一：每个计数都带单位</summary>这里有 165 个 FP32 值。物化账本还包括按行大小计算的项；元素数需要乘四字节。</details>
<details><summary>提示二：看结果前先选测量范围</summary>新缓存编译请求、首次执行、设备预热和重复设备事件样本是不同阶段。所选辅助函数接受时间预算；声明线程束数量不等于已测选择。</details>

## 单独复核

作答后打开[解答](/triton/fused-softmax/solutions/)。[PB-R5-015](/practice/#pb-r5-015) 检查新的填充错误；[PB-R5-016](/practice/#pb-r5-016) 检查基准范围推理。
