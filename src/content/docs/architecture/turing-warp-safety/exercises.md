---
title: 'H01 练习：修复线程束并检查目标门槛'
description: 证明两条内存顺序边，并拒绝不受支持的特化分派。
pairId: h01-exercises
counterpart: /en/architecture/turing-warp-safety/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, warp, gating, review]
resourceKind: exercise-set
unitId: H01-EXERCISES
prerequisites: [H01]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Turing independent thread scheduling', url: 'https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#independent-thread-scheduling', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,warp,gating,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H01 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/turing-warp-safety/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付物

精确先修为 **[H01]**（[学习单元（Learning Unit）](/architecture/turing-warp-safety/)）。交付修复后的伪代码顺序证明与分派账本。这些原创纸面练习（Exercise）不需要 GPU。来源核对日期 **2026-09-22**，见 [SRC-CUDA-103](/sources-and-versions/#src-cuda-103)。外部行为仍待硬件验证（Pending Hardware Verification）。

## 练习 1：修复重复邻居交换

**目标：**修复 H01 中不安全的两轮交换。固定一个块、32 个存活线程，`input[32*r+i]=100*r+i`，`r=0,1`，伙伴为 `i XOR 1`。每轮覆盖输出。采用整数存储，每通道一个共享槽位。

**约束：**不能用原子操作、`volatile`、假定锁步、提前返回或 CPU 同步代替设备同步。保留运算及全局 384 B／共享 128 B 内存占用。随后分析只有 31 个逻辑元素、仍有 32 个物理通道的情况。

**验收：**给出使原代码失败的合法生产者延迟交错；再给出只加发布屏障后仍会失败的交错；列出修复后两个屏障的参与者。推导最终输出的 0、1、30、31 号通道。对 31 元素情况声明完整边界约定，解释分支内 `__activemask()` 加 `__syncwarp` 为何无法初始化缺失伙伴。列出仍缺少的运行及消毒器证据。

<details><summary>提示 1</summary>同时跟踪第 0 轮的先写后读边和跨轮的先读后写边。</details>
<details><summary>提示 2</summary>快通道读完自己需要的值后，可能开始第 1 轮，而邻居还没读完第 0 轮。尾部掩码和缺失值约定回答的是不同问题。</details>

## 练习 2：拒绝按架构名称分派

**目标：**审查一个仅检查“GPU 名称含 Turing”的主机方案。产物只有 `sm_80` cubin，请求硬件全局到共享拷贝，每块分配 80 KiB 共享内存。实际设备报告 CC 7.5，没有嵌入 PTX。

**约束：**使用 H01 拟议的 C++17／工具包通道（Toolkit Lane），不更换设备。不能声称新驱动会增加硬件功能。不执行编译或启动。

**验收：**列出三个独立拒绝原因；替换为普通拷贝、128 B 共享内存交换及兼容目标；说明数据类型、问题总内存、精确环境坐标与显式同步。解释源代码编译期门槛、运行时 CC 查询、产物检查的不同用途。执行和性能观察保持为空。

<details><summary>提示 1</summary>分别检查可执行镜像、拷贝功能及单块存储。</details>
<details><summary>提示 2</summary>驱动兼容不是 cubin 向后兼容。只减少共享内存不能让 CC 7.5 获得 CC 8.0 指令。</details>

## 独立复核

写完两个证明后再看[解答](/architecture/turing-warp-safety/solutions/)。随后完成[练习题库（Practice Bank）PB-R7-001](/practice/#pb-r7-001)，其稀疏成员集合不同于完整线程束样例。练习与提示为原创 CC BY 4.0，权利方来源保留各自声明。
