---
title: 'L12 练习：FFT 布局与计划生命周期'
description: 推导实数变换存储、审核跨步长批量 C2C 变换，并区分工作区安全复用、启动开销和回调限制。
pairId: l12-exercises
counterpart: /en/libraries/cufft-plans-layouts-startup/exercises/
factCheckDate: '2026-09-08'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L12-EXERCISES
prerequisites: [L12]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'cuFFT storage and plan contract'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cufft/index.html'
    version: 'Toolkit 12.9.2 archive; cuFFT 11.4.1.4'
    platform: 'Static reasoning, not CUDA execution'
    accessDate: '2026-09-08'
  - title: 'cuFFT 13.3 Update 1 known issue'
    url: 'https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html#cufft-release-13-3-update-1'
    version: 'Live 13.3 Update 1; cuFFT 12.3.0.29'
    platform: 'Real-side LTO callback exclusion, not a reproduced failure'
    accessDate: '2026-09-08'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l12-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/libraries/cufft-plans-layouts-startup/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-08' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L12-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L12 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cufft-plans-layouts-startup/exercises/" lang="en">Read the English counterpart</a>

## 前置知识

先完成 [L12](/libraries/cufft-plans-layouts-startup/)。这些是纸面练习（Exercise），不是实验（Lab），不要求 GPU 或 CUDA 执行。四个证据数组均为空。

## 提交要求

先提交地址表、公式、所有权依赖和拒绝理由，再阅读[独立解答](/libraries/cufft-plans-layouts-startup/solutions/)。区分题目给定值、实际查询值和测量值。FP32 实数元素按 4 字节、FP32 复数元素按 8 字节计算。不得为了得到通过结果而调整容差，也不要编造性能数据。

## 练习 1：按实数变换的存储规则分配

**目标：** 为三个独立的长度 10 实数信号设计原位（in-place）R2C 和随后的 C2R。

**约束：** 秩为 1，元素步长为 1，各批次连续排列，只保留实数变换必需的填充；基地址满足对齐；两个变换类型分别使用计划（plan）。逻辑长度保持 10。C2R 之后可能还有一个消费者需要原频谱。

**预期提交证据：** 推导 K、每批物理实数元素数、按各自类型计数的输入输出距离、总字节数、实数和复数视角的批次起点字节偏移，以及往返缩放。为两个方向各列一行分配表，并说明频谱的生命周期。

**验收标准：** 两个方向的数值距离虽然不同，物理批次起点必须相同。填充不是逻辑样本。C2R 输入满足厄米对称（Hermitian symmetry），包括虚部为零的直流和奈奎斯特分量。按逻辑长度缩放，不按存储容量或批次数缩放。即便改成非原位 C2R，也不能假定输入频谱会保留。

<details><summary>提示 1：先数非冗余频谱</summary>从 floor(N/2)+1 个复数系数开始，再把同一容量换算成实数元素。每个批次都需要自己的填充，不能只在整个分配末尾增加两个浮点数。</details>

<details><summary>提示 2：把两侧距离换成字节</summary>实数侧距离和复数侧距离可以是不同的数，却指向同一地址。另行判断后续消费者需要的是原频谱，还是逆变换输出。</details>

## 练习 2：审核两种不同的 C2C 布局

**目标：** 在使用输出之前，证明批量长度 4 C2C 计划的地址与数学符号正确。

**约束：** 两个批次；输入步长 2、批间距 11、分配 22 个复数；输出步长 3、批间距 16、分配 32 个复数。两侧嵌入数组（embedding）都非空，内容均为 4。纸面计算使用批次 0 `[1,2,3,4]` 和批次 1 `[0,1,0,0]`。这是练习输入，不是 EX19 的可执行测试输入。

**预期提交证据：** 列出全部逻辑输入输出偏移、最小触及范围和实际分配字节数。按负指数推导两个正向频谱，再计算不归一化逆变换与所需缩放。解释为何传空嵌入数组、或直接交换输入输出指针进行逆变换会出错。

**验收标准：** 保留批次身份与自然频率顺序。区分最小触及范围和有意留填充的容量。复用同一个计划时，把已完成输出重新打包到计划要求的输入布局；也可以明确提出第二个逆变换计划，交换布局参数。往返检查不能取代独立正向参考，未使用的填充不属于数学输出。

<details><summary>提示 1：先追踪一个批次的地址</summary>分别对输入和输出使用 b*distance+x*stride。最后触及的元素下标加一得到最小范围，但它不是项目选择的完整填充分配容量。</details>

<details><summary>提示 2：使用四个单位根</summary>负指数对应的长度 4 单位根是 1、-i、-1、i。独立计算脉冲批次，避免正逆变换同时倒置符号后仍通过往返检查。</details>

## 练习 3：区分复用、并发和启动

**目标：** 审核两个工作者的流水线，不把计划缓存命中当成正确性或性能证据。

**约束：** 题目假设计划 A 需要 4096 字节工作区（workspace），计划 B 需要 6144 字节，预算 8192 字节。这些是虚构的规划后查询值，不是测量。A、B 各有独立流和可写输入输出。分别考虑并发执行与显式串行化。此外，审核一个新进程计时提案，以及 13.3.1 上长度 17554 和 8192 的 FP32 实数侧 LTO R2C 回调。

**预期提交证据：** 计算并发与串行的工作区需求；画出保护复用和清理的完成依赖；说明部分初始化失败时如何处理。为主机规划、缓存状态、第一次执行和热变换分别设计留空记录表。用已知问题的完整条件判断两个回调长度。

**验收标准：** 不得让重叠执行共享同一工作区。符合预算不等于已经分配。查询成功、绑定、真实容量、生命周期和设备上下文都必须成立。新进程不等于冷驱动缓存。区分四段 cuFFT 包版本与 API 返回的已加载主次补丁版本。不提交虚构的计时、缓存命中、回调结果或 GPU 正确性结论。

<details><summary>提示 1：并发容量求和，串行容量取最大值</summary>两个工作者执行重叠时需要独占的临时空间。只有建立完成依赖之后才能复用，前一次主机提交返回并不意味着设备已结束使用。</details>

<details><summary>提示 2：保留所有风险条件</summary>17554 可分解为 2*67*131，8192 为 2^13。实数侧 LTO 警告还要求偶数长度和精度对应的阈值。不命中这个条件组合，不等于普遍受支持。</details>

## 下一步

对照[解答](/libraries/cufft-plans-layouts-startup/solutions/)，再做 [PB-R4-013](/practice/#pb-r4-013)、[PB-R4-014](/practice/#pb-r4-014)，并阅读规范示例 [EX19](/examples/cufft-batched-transform/)。来源为 [SRC-CUDA-073](/sources-and-versions/#src-cuda-073) 和 [SRC-CUDA-074](/sources-and-versions/#src-cuda-074)，核查于 **2026-09-08**。纸面答案不会升级 EX19 的独立证据状态。
