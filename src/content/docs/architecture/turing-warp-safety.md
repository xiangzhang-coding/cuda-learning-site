---
title: 'H01：Turing 与显式线程束安全'
description: 用参与掩码及发布、复用屏障修复隐式线程束时序假设。
pairId: h01
counterpart: /en/architecture/turing-warp-safety/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, history, repair, gates, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H01
prerequisites: [F06, M06]
relatedUnits: [H02, VIS15]
hardwareGate: none
estimatedMinutes: 35
difficulty: intermediate
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Turing Tuning Guide', url: 'https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#independent-thread-scheduling', version: '13.4', platform: 'Source review; CC 7.5', accessDate: '2026-09-22' }
  - { title: 'CUDA Compute Capabilities', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Source review; feature and resource contracts', accessDate: '2026-09-22' }
  - { title: 'NVCC compilation targets', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/nvcc.html', version: '13.4.2', platform: 'Source review; no build', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h01 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,history,repair,gates,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H01 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'F06,M06' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/turing-warp-safety/" lang="en">Read the English counterpart</a>

## 学习目标

用约 35 分钟解释“同属一个线程束（Warp）”为什么不能建立内存依赖，修复两轮交换，并区分文档中的计算能力（Compute Capability，CC）与实际编译、执行的路径。最后完成练习（Exercise）；阅读不需要 GPU。

## 先修关系

精确有序先修边为 **[F06, M06]**：[F06：计算能力](/foundations/compute-capability/)建立功能门槛；[M06：线程束分歧与重汇合](/memory/warp-divergence-reconvergence/)建立通道参与概念。H02 和 VIS15 是相关资源，不增加先修边。

## 先建立可移植基线

在本站 CC 7.5 及更新设备范围内，采用普通加载／存储与显式同步。整个线程块（Thread Block）共同生产和消费共享分块时，在生产后、复用前执行 `__syncthreads()`；块内每个未退出线程都必须到达相应屏障。仅在线程束内部交换时，`__syncwarp(mask)` 为参与通道建立内存顺序。跨线程束通信仍需块级协调。

选择原生 Linux 上的一块 GPU，将问题总分配限定在 8 GB 内，先用 32 位整数隔离顺序错误与舍入误差。本练习固定一个含 32 线程的块，输入为两轮各 32 个整数，输出为 32 个整数，共享数组含 32 个整数：全局内存 384 B，共享内存 128 B。所有输入都在有符号 32 位整数范围内；没有算术溢出。这是拟议的纸面样例，不是运行记录或新的可运行示例（Runnable Example）。

## Turing 继承了什么

Turing 的计算能力为 **7.5**。独立线程调度（Independent Thread Scheduling，ITS）由 **Volta** 引入，Turing 沿用这一机制。每线程执行状态允许在线程束以下的粒度调度与重汇合。线程仍按 32 通道组成线程束执行单指令多线程（SIMT）工作；ITS 不会把 GPU 变成 32 个独立 CPU 核，也不承诺某种交错顺序。

旧式隐式线程束同步代码常把指令相邻误认为数据已经发布。生产者稍有延迟，这个假设就可能失效。把旧 `__shfl`、`__ballot`、`__any` 和 `__all` 模式改为相应的 `*_sync` 集合操作，并明确参与掩码。同步 shuffle 交换寄存器，不是共享内存发布栅栏。

## 分别修复发布与复用

以下是原创的**不安全伪代码**，32 个通道全都存活，`lane` 为 0–31：

```text
for round in [0, 1]:
    shared[lane] = input[32 * round + lane]
    output[lane] = shared[lane XOR 1]
```

这里有两个风险：伙伴可能先读后写；快通道也可能在伙伴读完第 0 轮之前，用第 1 轮覆盖原槽位。在写入后加线程束发布屏障，在读取后加线程束复用屏障。只有因为该样例让全部 32 通道参与两轮，两个屏障才可以使用同一个全掩码。`volatile` 或临时改用 `__activemask()` 都不能补齐这个证明。

部分逻辑分组应在**分歧之前**集体确定成员，例如父掩码中的全部通道参与 `__ballot_sync(parent_mask, predicate)`。随后保证结果掩码列出的每个通道执行相同的必要集合操作，且每个被读取的源通道都属于该集合。掩码只描述参与者，不会激活缺席通道或初始化缺失数据。逻辑尾部只有 31 个元素时，通道 30 的 `lane XOR 1` 无效；必须改变伙伴规则，或者保留 32 个参与通道并将完整分块的缺失元素补零。

`__activemask()` 只报告当前指令活跃的通道，不能持久定义所有满足逻辑谓词的通道。`__syncwarp` 不能排序另一个线程束的写入；只有部分未退出块线程进入的分支内也不能放置块屏障。请在独立解答中写出完整修复顺序，而不是只补第一个屏障。

## 写清构建与回退契约

| 路径 | 设备与目标 | 数据类型／内存／功能条件 | 回退 |
| --- | --- | --- | --- |
| 显式同步基线 | 本站 CC 7.5+；为所选设备构建兼容镜像 | 上述整数交换；共享内存 128 B；不依赖线程束锁步 | 保留相同算法及显式屏障 |
| Turing 专项评估 | CC 7.5；虚拟目标 `compute_75`，真实目标 `sm_75` | 相同样例；检查启动和资源限制 | 基线；绝不能通过删除屏障模仿 Volta 之前的时序 |

未来比较可选择已有 CUDA 13.3.1 工具包通道（Toolkit Lane）：NVCC 13.3.73、Ubuntu 24.04 x86-64、GCC 13.3.0、C++17，配套驱动 610.43.02。这是拟议配置，不是编译证据。此次文档复核比固定通道更新：[SRC-CUDA-103](/sources-and-versions/#src-cuda-103)分别记录指南 13.4.2 与发布说明 13.4 Update 1。

`nvcc --list-gpu-arch` 列出所选编译器的虚拟目标，`--list-gpu-code` 列出真实目标。`compute_75` 控制源代码可用的功能集，`sm_75` 选择机器镜像。`__CUDA_ARCH__` 描述设备编译阶段，不是主机运行时查询。启动特化路径前，查询所选设备并确认二进制含兼容镜像；主机 `if` 无法让不支持的设备指令通过编译。PTX 前向兼容不会创造新的源代码功能分支，也不会消除驱动／JIT 要求。详见 [M17](/toolchain/compiler-architecture-targets/)。

## 调优结论仍是待检验假设

Turing 指南记录每个流式多处理器（Streaming Multiprocessor，SM）有四个线程束调度器，最多驻留 32 个线程束，共享内存每 SM 为 64 KiB。这些是不同数量，不能直接推导最优启动配置。单块共享内存可达 64 KiB，但超过 48 KiB 需要动态共享内存并显式启用。寄存器压力、共享内存用量和指令依赖会限制驻留。本练习的 128 B 无法证明实际占用率、延迟隐藏或速度。

## 证据边界

四个证据数组均为空。架构行为、修复内核执行、消毒器结果及性能仍**待硬件验证（Pending Hardware Verification）**，需要合格的基准环境（Reference Environment）证据。本单元与 [VIS15](/visuals/architecture-evolution/)不授予编译已检查（Compile-Checked）、社区已观察（Community-Observed）或运行已验证（Runtime-Verified）状态。原生 Linux 是唯一受支持环境（Supported Environment），浏览器不执行 CUDA。未来运行需要环境清单（Environment Manifest）、精确源码／构建／目标、CPU 期望值、启动与完成错误检查以及 racecheck/synccheck 报告。干净报告是辅助证据，不是对所有调度的证明。

## 回忆检查

1. ITS 始于哪个架构？Turing 的 CC 是多少？
2. 重复交换需要哪两条顺序边？
3. 为什么分支内的 `__activemask()` 不能恢复预期参与集合？
4. 31 个逻辑元素配 XOR 伙伴会增加什么错误？
5. 四个调度器、32 个驻留线程束和 32 个通道分别描述什么？
6. 为什么编译目标和浏览器筛选成功都不能证明实际硬件路径？

## 练习与下一步

先做 [H01 练习](/architecture/turing-warp-safety/exercises/)，再看[独立解答](/architecture/turing-warp-safety/solutions/)，随后完成[练习题库（Practice Bank）PB-R7-001](/practice/#pb-r7-001)。[H02](/architecture/ampere-pipelines-tensor-cores/)把显式参与和生命周期推理用于异步拷贝；进入前先完成其 M13、L08 先修。[可视化讲解（Visual Explainer）VIS15](/visuals/architecture-evolution/)比较精确能力，不检测你的设备。

## 来源与许可

核对／访问日期为 **2026-09-22**。[SRC-CUDA-103](/sources-and-versions/#src-cuda-103)记录当前 Context7 检索及权利方精确章节：[Turing 调度与占用率](https://docs.nvidia.com/cuda/turing-tuning-guide/index.html#turing-tuning)、[计算能力](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html)、[NVCC 目标](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/nvcc.html#nvcc-ptx-and-cubin-generation)。讲解、样例、练习及对照均为原创 CC BY 4.0 内容。NVIDIA 文档保留自己的权利声明；没有复制或改编其代码、表格、图片或基准数据。
