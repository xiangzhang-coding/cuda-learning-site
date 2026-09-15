---
title: 'T07 解答：分开归属、驻留与性能'
description: 证明循环覆盖，复核持久化调度声明的边界。
pairId: t07-solutions
counterpart: /en/triton/persistent-kernels/solutions/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-review, next]
resourceKind: solution-set
unitId: T07-SOLUTIONS
prerequisites: [T07-EXERCISES]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton persistent matmul tutorial', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/tutorials/09-persistent-matmul.py', version: '3.7.1', platform: 'CUDA architecture-gated source', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t07-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/persistent-kernels/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-review,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T07-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/persistent-kernels/solutions/" lang="en">Read the English counterpart</a>

## 尝试后再阅读

精确先修 **[T07-EXERCISES]**：[作答](/triton/persistent-kernels/exercises/)。这些是原创、经过复核的推导，不是性能观察。核查于 2026-09-15；[SRC-CUDA-091](/sources-and-versions/#src-cuda-091)。

## 解答 1：映射任务，不混用状态

使用一维网格 `(P,)`。t 从 `tl.program_id(0)` 开始，小于 T 时继续循环，每次加 `tl.num_programs(0)`。把 t 解码为行列块，以新建的 FP32 累加器执行原有带掩码（mask）的 K 归约，再按输出掩码存储 FP16。学习者比较中的非持久化内核保持原样。证明为 `t=qP+r`：解的存在保证覆盖，余数唯一保证写入者唯一。P=1 使块归属串行，P=T 则每程序一块。

合成 T=35/P=8 时，程序 0、1、2 各获五块，其余各四块。第 34 块属于程序 2 的第五次迭代。T=10/P=3 时程序 0 四块，其余三块。这是计数，不是时间。若网格 P=3 而步长为 8，会遗漏第 3–7 块；若网格 P=8 而步长为 3，多个程序可能到达同一块。实际网格必须与步长一致。

采用 T07 五种形状和固定配置，按 FP16 容差逐元素对照 FP64 预言机（oracle），检查守卫和输入不变。至少让每程序处理两个连续输出块，以暴露漏清零累加器。现有主机模型测试只证明归属算术；编译要面向实际 GPU，外部执行需完整环境清单（Environment Manifest）。不能虚构选中 P 或资源数量。

## 解答 2：公平比较可以否定持久化

P 等于 SM 数只规定启动多少程序，不规定放置或同时驻留（residency）。两种版本都启动一次。理论 100% 占用率（occupancy）描述特定资源约束下的容量，不描述延迟、有效工作或最优性。等待中的 CTA 可能占用未调度生产者所需资源；这里的全局自旋屏障没有驻留保证。

先保留正确性和逐目标资源/编译记录。固定配对分块，20 次预热、三轮交替顺序，保留所有原始样本，25/100 ms 基准预算与缓存策略一致。单块案例对多块调度假设只能验证正确性。资源失败说明候选未取得资格，不能据此计算速度比。没有计数器权限时只允许有范围限定的无插桩计时比较，不能解释占用率。

若要解释机制，保留实际目标的占用率/启动和最少调度/停顿报告，附查询指标、单位、内核/启动选择、重放与权限记录；耗时使用独立无插桩样本。环境清单绑定源码/锁、形状/类型/步长/容差、候选/网格、GPU/CC/SM/数量/内存、驱动/Toolkit/编译器/工具版本、OS、时钟/功耗/负载、同步/缓存策略、观察者/日期和报告留存链。更慢或差异不明确都是有效结果。没有合格基准环境（Reference Environment）证据时，保持待硬件验证（Pending Hardware Verification）。

## 练习题库复核

**PB-R5-020：** 合成 T=35、P=8 中，八个程序 ID 不等于八个 SM。块数相同也不能证明耗时相同，这里块数甚至不同。必须分开程序数、驻留 CTA 容量和已达占用率。测试配对非持久化后备路径与另一 P，保留数值检查和资源记录，再评估测得时间。计数器查询被拒绝是明确的机制证据缺口，绝不是零停顿或 100% 占用率。

## 返回基线

返回 [T07](/triton/persistent-kernels/) 与 [LAB16](/labs/autotune-triton-gemm/)。对负面结果和正面结果同样认真留存。
