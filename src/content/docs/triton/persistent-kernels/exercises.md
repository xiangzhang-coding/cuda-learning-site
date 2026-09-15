---
title: 'T07 练习：证明调度并质疑速度声明'
description: 实现循环 GEMM 分块归属和具备门槛的非持久化比较。
pairId: t07-exercises
counterpart: /en/triton/persistent-kernels/exercises/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T07-EXERCISES
prerequisites: [T07]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton persistent matmul tutorial', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/tutorials/09-persistent-matmul.py', version: '3.7.1', platform: 'CUDA architecture-gated source', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t07-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/triton/persistent-kernels/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T07 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/triton/persistent-kernels/exercises/" lang="en">Read the English counterpart</a>

## 先修与作答方式

精确先修 **[T07]**：[持久化内核（persistent kernel）](/triton/persistent-kernels/)。使用 [LAB16](/labs/autotune-triton-gemm/) 学习者副本并保留非持久化基线。遵循 T07 的架构、形状、类型、内存和分析器权限门槛。核查于 2026-09-15；[SRC-CUDA-091](/sources-and-versions/#src-cuda-091)。

## 练习 1：实现持久化归属

**目标：** 把基线的二维程序到块映射，换成一维循环输出块遍历。性能比较前先提交证明与正确性报告。

**约束：** BM=BN=BK=32，四线程束（warp）、两阶段、`num_ctas=1`；FP16 输入/输出、FP32 累加器；不使用 TMA、FP8、队列、全局屏障、split-K 或原子操作。维度必须为正。实际启动 P 就是步长；每个输出块都重置累加器。使用 T07 五种形状、两种 P 策略和 LAB16 独立数值/守卫检查。

**验收：** P=1、P=T、P=min(T,S)、P=min(T,2S) 下每块恰好出现一次。代数说明尾块归属。包括主机模型 T=10/P=3 与 T=35/P=8。保留源码变化、目标/配置及所有正确性结果或精确阻塞，不把主机覆盖当作 GPU 执行。扩展学习者工具测试候选，不替换基线、不发布选中配置。

<details><summary>提示 1：两次使用商与余数</summary>先将 t 除以 P 确定所属程序，再除以 Tn 解码行列块。</details>
<details><summary>提示 2：沿状态生命周期检查</summary>一个累加器只属于一个输出块。该块的 K 循环必须在下一块开始前完成，掩码仍保护三个维度。</details>

## 练习 2：审查持久化性能声明

**目标：** 评估虚构报告：“P 等于 SM 数，所以所有程序恰好每 SM 驻留一个；100% 占用率（occupancy）说明内核最优；程序减少节省主机启动。”设计真正能支持决策的测量。

**约束：** 不虚构替代计时或占用率值。覆盖单块、多块、计数器权限缺失和候选资源失败。探索其他配置前保持分块设置相同。沿用 T07 配对预热、三轮、原始样本、独立编译与分析器流程。

**验收：** 反驳各项无依据推断，保留非持久化后备路径，列出环境清单（Environment Manifest）全部坐标。说明何时比较无意义、何时只能比较计时、何时差异不明确。解释等待未调度生产者的 CTA 为什么可能死锁。没有合格证据时硬件结果保持待硬件验证（Pending Hardware Verification）。

<details><summary>提示 1：在主机边界计算启动数</summary>基线已通过一次启动覆盖整个输出网格。网格缩小改变的是任务分配，不是调用次数。</details>
<details><summary>提示 2：区分容量与调度</summary>实际寄存器/共享内存/线程束上限用于理论驻留；测得的活跃与可发射线程束描述执行；独立、无插桩计时用于决策。</details>

## 单独复核

先完成两题，再看[解答](/triton/persistent-kernels/solutions/)，随后审查 [PB-R5-020](/practice/#pb-r5-020)。
