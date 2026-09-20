---
title: 'G06 练习：流水线与时间线审查'
description: 实现依赖安全的流水线，先分类合成区间，再检查硬件证据。
pairId: g06-exercises
counterpart: /en/multi-gpu/communication-computation-overlap/exercises/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, timeline, pipeline, review]
resourceKind: exercise-set
unitId: G06-EXERCISES
prerequisites: [G06]
relatedUnits: [LAB18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,timeline,pipeline,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G06 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/communication-computation-overlap/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付

精确先修 **[G06]**：[通信与计算重叠](/multi-gpu/communication-computation-overlap/)。2026-09-20 复核，[SRC-CUDA-099](/sources-and-versions/#src-cuda-099)。先提交推理，再打开解答。纸面分析无需 GPU；实现执行遵循 [LAB18](/labs/pipeline-nccl-computation/) 的双 GPU 门槛，取得合格证据前保持待硬件验证（Pending Hardware Verification）。

## 练习一：分类时间线

**目标：**分类[合成 fixture](/assets/overlap-fixtures/lab18-timeline.json) 的三个案例，计算每个 rank 的 A0/P1 交集，并声明可得结论。

**约束：**使用半开区间、无量纲刻度；没有记录 GPU 执行。不能把并发区间相加当成经过时间。再考虑一份其他方面完整的真实报告：GPU 0 计算为 [4,10)，仅 GPU 1 通信为 [5,8)，区分全系统同时发生与同 GPU 重叠。最后移除 rank 1 活动行，判断是否仍满足分类条件。

**验收：**区分合成重叠、合成串行和仅主机数据的无法判断；解释端点相接、缺行和跨设备范围。列出真实双 GPU 结论所需的正确性、源码／二进制、环境清单（Environment Manifest）、拓扑、权限、profiler 诊断及关联。明确拒绝从 fixture 推断吞吐量或瓶颈。

<details><summary>提示一</summary>只比较目标范围内、同一设备上相互独立工作的区间。</details>
<details><summary>提示二</summary>使用 max(0, min(结束) − max(开始))；缺少设备活动条不是长度为零的区间。</details>

## 练习二：构建流水线

**目标：**用 p/c/q 流（Stream）、每块独立 ready/done 事件（Event）与公开整数参考式，实现 LAB18 串行和流水线（Pipeline）模式。两种模式保持相同内核和集合通信序列。

**约束：**单进程／线程；R=2–8 个不同且合格的 GPU；N≤1048576；C≤N；分块≤1024；非原地 int32 求和；每块一个匹配的全 rank 分组；默认阻塞通信器；组内不能同步。使用不相交切片并保持缓冲区存活，检查错误，保留外部 watchdog，每次迭代后逐 rank、逐元素验证。

**验收：**处理 (N,C)=(1,1),(257,128),(1048576,65536)，包括单元素尾块。解释每条事件边、为什么必须在 group end 成功后才记录 done 并提交消费者，以及为什么事件能在已完成的迭代间复用。提供五次经过验证的预热、匹配的计时范围、重复无 profiler 统计和独立采集计划。分别从竞争与启动开销预测流水线变慢的原因，不要求性能改善。纸面扩展：为两个可复用缓冲槽补充寿命依赖。

<details><summary>提示一</summary>主机提交顺序不能连接不同 CUDA 流。找出每个切片的写入者和下一个读取者。</details>
<details><summary>提示二</summary>消费者完成经依赖传递证明生产者与集合通信完成；下一代覆盖复用槽之前必须等待上一代消费者。</details>

## 复核

对照[独立解答](/multi-gpu/communication-computation-overlap/solutions/)，再完成 [LAB18](/labs/pipeline-nccl-computation/) 和 [PB-R6-006](/practice/#pb-r6-006)/[PB-R6-007](/practice/#pb-r6-007)。下载源码是参考解答，不是运行证据。
