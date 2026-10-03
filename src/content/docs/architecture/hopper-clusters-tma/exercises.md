---
title: 'H04 练习：集群生命周期与 TMA 完成条件'
description: 修复远端共享内存生命周期，以及混淆拷贝方向的 TMA 账本。
pairId: h04-exercises
counterpart: /en/architecture/hopper-clusters-tma/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, cluster, tma, review]
resourceKind: exercise-set
unitId: H04-EXERCISES
prerequisites: [H04]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Hopper feature contracts', url: 'https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,cluster,tma,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H04 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/hopper-clusters-tma/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付物

精确先修：[H04](/architecture/hopper-clusters-tma/)。提交两份修正账本和明确的可移植回退。原创纸面练习（Exercise）无需 GPU。核对日期 **2026-09-22**，[SRC-CUDA-106](/sources-and-versions/#src-cuda-106)。执行仍**待硬件验证（Pending Hardware Verification）**；LAB19 等待 H06，保持未发布。

## 练习 1：指针活得比所有者久

**目标：**修复 H04 两块邻居交换。提议在各块初始化本地 256 元素 int32 段后，只调用 `__syncthreads()`，随后读取映射邻居指针；块 0 自己读完即退出，但块 1 可能还在读取块 0 的段。

**约束：**一个 CC 9.0 GPU，`compute_90` / `sm_90`，集群／网格 (2,1,1)，每块 256 线程、1024 B 共享内存，全局输入／输出共 4096 B；保留每个参与者和精确置换语义。不使用时间假设、全局自旋屏障或 TMA。阅读无需硬件；拟议执行需 H04 的原生 Linux、≥8 GB／空闲 512 MiB 门槛以及实际集群准入。

**验收：**给出初始化发布与远端读取完成边，标明全部所有者／消费者，解释原块屏障与提早退出为何无效。声明逐块与集群总分布式共享内存（Distributed Shared Memory，DSM）预算。实际不支持两块集群时拒绝，提供 6144 B、两个内核的全局暂存基线。解释为何“可移植最大八块”不能代替实际占用率／分区查询，列出精确输出、完成检查及公平的整操作计时边界。

<details><summary>提示 1</summary>映射指针不会延长另一个块共享分配的生命周期。</details>
<details><summary>提示 2</summary>初始化后需要一个集群级边，全部远端读取之后需要另一个。二者都要求每个参与线程；第二个必须位于任一所有者退出之前。</details>

## 练习 2：选择正确的 TMA 完成条件

**目标：**修复单块 16×16 int32 往返。提议采用 60 B 外层步长、16 B 对齐的共享目标、主机编码后作为恒定网格参数传入的映射，并在仅 `arrive()`、没有等待后读取。256 个消费者各增加 1024 预期事务字节。修改分块后，发起者提交共享→全局传输，却等待**加载屏障**，随后所有线程覆盖共享源。

**约束：**CC 9.0，`compute_90` / `sm_90`，无 swizzle／interleave，独立的 1024 B 输入／输出，一块 1024 B 共享分块加对齐屏障存储；保留完整 int32 输出与 H04 的 256 个参与者。不使用集群、设备端描述符修改、低精度算术或 GPU 执行。CPU 预期输出为每个输入加一，输入限定为不会发生有符号溢出的范围。

**验收：**修复步长和对齐；列出完整维度／box／步长／类型及描述符生命周期契约。计算到达和字节计数，区分到达与等待，指明通用→异步可见性、组提交、源复用及主机消费的全部边。解释批量与非批量等待组为何不能互换，为何这里不需要 `sm_90a`，以及描述符、对齐或硬件条件失败时怎样回退普通暂存。明确读取完成没有证明全局目标的什么性质。

<details><summary>提示 1</summary>16 个 int32 每行占 64 B。张量路径的共享对齐比连续一维批量路径严格。</details>
<details><summary>提示 2</summary>整个分块共 1024 字节，不是每个等待者各 1024 字节。存储使用发起者局部的批量组；其他线程复用前，应发布发起者确认的源读取完成。</details>

## 独立复核

完成两题后再看[解答](/architecture/hopper-clusters-tma/solutions/)和[练习题库（Practice Bank）PB-R7-004](/practice/#pb-r7-004)。原创 CC BY 4.0；权利方资料保留声明。不提供架构或速度观察。
