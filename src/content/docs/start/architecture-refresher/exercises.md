---
title: 'O06 练习：辨析性能语言与强度边界'
description: 用两道练习分类架构声明，并计算一个不冒充测量的强度上界。
pairId: o06-exercises
counterpart: /en/start/architecture-refresher/exercises/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - next
resourceKind: exercise-set
unitId: O06-EXERCISES
prerequisites:
  - O06
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
    attrs: { name: 'cuda:pair-id', content: o06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O06 }
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

<a class="locale-pair" data-locale-counterpart href="/en/start/architecture-refresher/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [O06：架构回顾：速率、延迟与数据移动](/start/architecture-refresher/)，掌握延迟（latency）、吞吐量（throughput）、带宽（bandwidth）、并发（concurrency）和算术强度（arithmetic intensity）的边界。两道练习（Exercise）都使用假设输入，不需要 GPU，也不产生运行证据。

## 作答方法

先提交完整推理，再按顺序打开提示。每个结论都要写出对象、路径、时间或单位边界，不得把可能发生写成已经观察。这里不含答案；完成后再打开独立的[参考解答](/start/architecture-refresher/solutions/)。

## 练习 1：分类并修复架构声明

**目标：** 把下面八条声明按主要概念归入 latency、throughput、bandwidth 或 concurrency，判断每条是准确、不准确还是部分准确，并重写所有不完整声明。

**待审查声明：**

A. “一个 request 在 `t0` 开始、在 `t1` 完成，所以 `t1 - t0` 描述这一个 request 的 latency。”

B. “服务在时间窗口 `delta_t` 内完成 `N` 个 item，所以 `N / delta_t` 是该服务的 latency。”

C. “只要单位写成 `GB/s`，bandwidth 声明就完整；不需要路径和方向，也可以互换 theoretical、effective 与 actual bandwidth。”

D. “一个 warp 等待 memory 时，scheduler 可以发出 ready warp；这可能隐藏等待对 aggregate progress 的影响，但没有缩短被等待 memory operation 的 latency。”

E. “一个 SM 上驻留四个 block，就证明四个 kernel 正在 concurrent execution。”

F. “Occupancy 越高，throughput 必然越高，runtime 必然越短。”

G. “把两个 kernel 和一个 copy 放进两个 non-default stream，就保证三者在时间上重叠。”

H. “GPU 执行当前 kernel 时，CPU 准备下一批输入，这属于 CPU/GPU overlap，即使 GPU 上只有一个 active kernel。”

**约束：** 每条只能选一个主要类别，但修订可以指出相关概念；bandwidth 修订必须写出端点、方向、byte/time 单位和 bandwidth 类型；concurrency 修订必须区分资格、提交、驻留和已观察 overlap；不得添加 profiler 结果。

**预期证据：** 八行审查记录，每行包含主要类别、判断、理由和精确改写。

**验收条件：** Latency 与 rate 不混用；ready-warp 解释不声称降低 memory latency；bandwidth 三种口径不互换；resident blocks、occupancy、kernels、streams、copy/compute overlap 和 CPU/GPU overlap 保持独立；所有“发生过”声明都要求 timeline 或等价观察。

<details><summary>提示 1</summary>先圈出每句话的分子、分母、单个事件边界或同时存在的工作。</details>

<details><summary>提示 2</summary>为 bandwidth 写一个固定模板：“在某方向上，沿某端点到某端点的路径，以某种 byte 口径除以某个时间区间，单位为……”</details>

<details><summary>提示 3</summary>对 concurrency 逐层问：工作只是已提交、具备重叠资格、已驻留，还是 timeline 已显示时间交集？</details>

## 练习 2：计算并限制 intensity 上界

**目标：** 根据明确给定的 operation 与 DRAM byte 计算一个 arithmetic-intensity 模型，并解释它能支持的 memory-bound 上界。

**给定模型输入：** 一个假设 steady-state work unit 执行 `96` 个按题目口径计数的 arithmetic operation。对明确的 `device DRAM <-> SM` 路径，它从 DRAM 读取 `32 bytes`，并向 DRAM 写回 `16 bytes`。同一路径的 bandwidth ceiling 记为 `B_DRAM bytes/s`，compute ceiling 记为 `P_compute operations/s`。这些都是题目给定的建模输入，不是 profiler measurement。

**任务：** 先求总 DRAM traffic，再计算 `I = operations / DRAM bytes`；接着写出 memory-side bound `P_memory <= I * B_DRAM` 和完整的简化边界 `P <= min(P_compute, I * B_DRAM)`；最后说明模型在什么条件下称为 memory-bound，并列出至少四个不能从这个结果推断的事实。

**约束：** 不运行代码；不添加 cache、shared-memory 或 host/device traffic；不改变题目给定的 operation-count convention；不虚构 `B_DRAM`、`P_compute`、time、achieved rate 或 speedup；结论必须写明 DRAM path 和 units。

**预期证据：** 一段带单位的计算、一个符号上界、一个有作用域的 memory-bound 判断，以及一份“不是测量”的限制清单。

**验收条件：** Read 与 write byte 都进入分母；operations/byte 与 operations/s 不混淆；只在 memory-side ceiling 低于 compute ceiling 时使用 memory-bound；把 Roofline 写成 upper bound 而不是 prediction；没有运行或性能证据声明。

<details><summary>提示 1</summary>先把同一 DRAM path 上的 read bytes 与 write bytes 相加，再处理 operation count。</details>

<details><summary>提示 2</summary>`operations / bytes` 乘以 `bytes / second` 后，检查剩余单位。</details>

<details><summary>提示 3</summary>比较两个符号 ceiling，不需要给它们填数字；然后检查 latency、parallelism、cache、launch 和 end-to-end overhead 是否被模型覆盖。</details>

## 下一步

独立完成两道题后，对照[参考解答](/start/architecture-refresher/solutions/)。[练习题库（Practice Bank）PB-R1-003](/practice/#pb-r1-003)把同一组分类放进更长的性能审查记录。
