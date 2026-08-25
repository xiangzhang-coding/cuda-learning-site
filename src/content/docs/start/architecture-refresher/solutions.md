---
title: 'O06 参考解答：辨析性能语言与强度边界'
description: O06 两道练习的复核解答、推理、有效替代方案和常见错误。
pairId: o06-solutions
counterpart: /en/start/architecture-refresher/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O06-SOLUTIONS
prerequisites:
  - O06-EXERCISES
relatedUnits:
  - O06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O06 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/start/architecture-refresher/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [O06 练习（Exercise）](/start/architecture-refresher/exercises/)的**参考解答**。先比较延迟（latency）、吞吐量（throughput）、带宽（bandwidth）、并发（concurrency）和算术强度（arithmetic intensity）的推理边界，再比较最终标签与计算。本页没有运行 CUDA，也没有运行证据。

## 解答 1：分类并修复架构声明

A. **Latency，准确。** `t1 - t0` 是同一个 request 在已声明起止边界间的 elapsed time。仍应随真实结果记录 time unit。

B. **Throughput，不准确。** `N / delta_t` 是完成 item 的 aggregate rate。修订为：“服务在 `delta_t` 内完成 `N` 个 item，因此 throughput 是 `N / delta_t items` 每单位时间。”一个 item 的 latency 需要该 item 自己的起止边界。

C. **Bandwidth，不准确。** 修订为：“先声明 bandwidth 是 theoretical、effective 还是 actual，再声明 source/destination、direction、read/write byte convention、time interval，以及 GB/s 或 GiB/s。”只有这些坐标兼容时才可比较。

D. **Latency，准确。** Scheduler 让 ready warp 推进，从而隐藏 stalled warp 对 aggregate issue 的影响。等待中的 memory operation 没有因此更早完成。

E. **Concurrency，不准确。** 四个 resident block 可能全部来自同一个 kernel。修订为：“Resident blocks 说明 SM 已为这些 block 分配状态与资源；只有来自不同 launch 的 kernel work 在 timeline 上有时间交集，才观察到 concurrent kernels。”

F. **Concurrency，且不准确。** Occupancy 只表示 active warp 相对硬件上限的比例。修订为：“更高 occupancy 可能提供更多 ready-warp 候选，但 register pressure、shared-memory use、instruction mix、memory behavior 和其他瓶颈决定 throughput；必须测量 runtime。”

G. **Concurrency，不准确。** 多个 stream 可以建立 overlap 资格，不能保证 overlap。修订为：“在 dependency、memory property、copy engine、device capability 和资源允许时，不同 stream 中的独立操作可能重叠；用 timeline 复核实际执行。”

H. **Concurrency，准确。** 这是一段 host work 与 device work 的时间交集，所以是 CPU/GPU overlap。它没有声称 concurrent kernels，也没有声称 copy/compute overlap。

复核关键是区分**定义**与**观察**。公式或 API structure 可以定义 rate、order 或 overlap potential；只有带明确边界的 measurement 才能说明某次执行得到什么数值或实际发生了什么重叠。

## 解答 2：计算并限制 intensity 上界

同一 `device DRAM <-> SM` 路径上的总 traffic 是：

```text
32 bytes read + 16 bytes written = 48 DRAM bytes
```

因此 arithmetic intensity 为：

```text
I = 96 operations / 48 DRAM bytes = 2 operations/byte
```

单位检查后，memory-side bound 是：

```text
P_memory <= (2 operations/byte) * B_DRAM
```

因为 `B_DRAM` 的单位是 bytes/s，右侧的单位是 operations/s。完整简化 Roofline bound 是 `P <= min(P_compute, (2 operations/byte) * B_DRAM)`。只有当 `(2 operations/byte) * B_DRAM < P_compute` 时，这个模型才把该 work unit 分类为**相对于已声明 DRAM path 的 memory-bound**。若 compute ceiling 更低，则简化模型落在 compute-bound 一侧；相等时处于 ridge condition。

这个结果仍然不是 measurement，理由如下：`96` operations 与 `48` bytes 是题目给定值；`B_DRAM` 和 `P_compute` 没有数值；没有 elapsed time 或 achieved rate；模型没有证明有足够 ready work 达到 ceiling；也没有表示 cache、memory latency、instruction issue、dependency、imbalance、launch、synchronization、host/device transfer 或 end-to-end overhead。它只给出指定计数规则和 DRAM boundary 下的 upper bound。

## 有效替代方案

- 第一题可以用审查矩阵、批注清单或因果图表达，只要八条声明的主要类别、判断、理由和修订都可复核。
- Bandwidth 路径可以用箭头图替代文字，但必须保留 endpoints、direction、byte convention、time 和 units。
- 第二题可以先写 `I = 96 / (32 + 16)`，也可以先合并 DRAM traffic；两种顺序必须得到同一单位。
- 上界可以写成 `min` 形式或分段条件。若采用另一种 operation-count convention，必须先重新声明并一致重算，不能悄悄改写题目给出的 `96`。
- 可以使用 operational intensity 一词，但必须说明它采用同一 operation rule 和 DRAM traffic boundary，不能只换名称。

## 常见错误

- 把一个 request 的 reciprocal latency 当作整个系统 throughput，却没有说明可并发工作量、队列或资源数量。
- 用 theoretical bandwidth 代替 measured result，或把 requested/effective bytes 与 actual transaction bytes 混为一谈。
- 把 resident blocks、occupancy、streams 或 asynchronous submission 当作 observed concurrent execution。
- 声称 latency hiding 降低了 DRAM operation 的 latency。
- 在 intensity 分母中漏掉 write bytes，或加入题目没有声明的 host/device 和 shared-memory traffic。
- 把 `operations/byte` 写成 `operations/s`，或给 `B_DRAM` 填入虚构数字。
- 从符号 Roofline bound 宣布实际 memory bottleneck、runtime 或 speedup。

复核日期：**2026-08-26**。解答只复核静态分类与假设计算，没有 hardware requirement、profiler observation 或 runtime Evidence Status。
