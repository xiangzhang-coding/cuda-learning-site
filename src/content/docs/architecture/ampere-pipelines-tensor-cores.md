---
title: 'H02：Ampere 流水线与 Tensor Core 契约'
description: 将显式同步基线与带门槛的异步拷贝、分离屏障及数值路径作比较。
pairId: h02
counterpart: /en/architecture/ampere-pipelines-tensor-cores/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, history, pipeline, barriers, tensor, gates, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H02
prerequisites: [H01, M13, L08]
relatedUnits: [VIS15]
hardwareGate: none
estimatedMinutes: 45
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ampere Tuning Guide', url: 'https://docs.nvidia.com/cuda/ampere-tuning-guide/index.html', version: '13.4', platform: 'Source review; CC 8.x', accessDate: '2026-09-22' }
  - { title: 'Asynchronous Data Copies', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-ldgsts', version: '13.4.2', platform: 'Source review; global to shared', accessDate: '2026-09-22' }
  - { title: 'Asynchronous Barriers', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-barriers.html', version: '13.4.2', platform: 'Source review; phases and participation', accessDate: '2026-09-22' }
  - { title: 'CUDA Compute Capabilities', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Source review; native Tensor Core types', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h02 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,history,pipeline,barriers,tensor,gates,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H02 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H01,M13,L08' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/ampere-pipelines-tensor-cores/" lang="en">Read the English counterpart</a>

## 学习目标

用约 45 分钟建立双缓冲所有权账本，区分到达与完成，并按数据类型和精确计算能力（Compute Capability，CC）选择 Tensor Core 路径。交付物是设计和正确性审查，不是基准测试结果。

## 先修关系

精确有序先修边：**[H01, M13, L08]**。[H01](/architecture/turing-warp-safety/)提供显式线程束参与规则；[M13](/memory/asynchronous-copy-pipelines/)提供生产者／消费者阶段概念；[L08](/libraries/tensor-core-precision-contracts/)提供输入、累加与输出契约。VIS15 是相关资源，不是先修。

## 先确定可移植基线

对有界单 GPU 工作负载，采用普通全局加载、寄存器值和共享存储，然后依次执行块级发布屏障、计算、块级复用屏障。线程不能提前退出这些集体阶段。每个分块有 256 个 FP32 元素，两个共享缓冲各 1024 B，输入共三个分块：输入 3072 B，输出 3072 B。共享缓冲预算为 2048 B，还需加上实现所用的同步对象存储；不能把共享内存当成设备显存。

本站基线为 CC 7.5+、原生 Linux 上单 GPU、问题内存在 8 GB 内。只读拷贝／重排必须精确保留 FP32 值；这项拷贝比较不做算术。矩阵基线另用普通 FP32 单指令多线程（SIMT）GEMM，明确边界并保留 CPU 参考，不要求 Tensor Core。用 FP32 替代 BF16/TF32 乘法会改变数值语义，必须明确接受并重新验证。

## Ampere 改变了什么

Ampere 覆盖 **8.x**，但架构名称不能确定精确契约。本单元与[可视化讲解（Visual Explainer）VIS15](/visuals/architecture-evolution/)完整核对的行是 CC **8.0、8.6、8.7**。全局到共享内存的硬件异步拷贝（Asynchronous Copy）及共享内存分离到达／等待屏障（Split Arrive/Wait Barrier）加速始于 CC 8.0。这些机制允许重叠，并能省去普通加载／存储拷贝的中间数据寄存器，但不保证实际重叠或更快执行。

这类内核内拷贝应与主机 `cudaMemcpyAsync`、统一内存迁移及后续架构的批量传输机制分开。这里讨论非批量 `cp.async` / LDGSTS，不是 TMA。

## 跟踪缓冲区的流水线生命周期

以下原创顺序账本沿用 M13 的阶段模型。S0、S1 是存储槽位，不是时钟区间：

| 阶段 | 生产者义务 | 消费者义务 |
| --- | --- | --- |
| 预填充 | 获取 S0/S1，提交分块 0/1，各自提交阶段 | 暂不读取槽位 |
| 消费分块 0 | 不得覆盖 S0 | 等待分块 0 完成，向全部读取者发布，读 S0，全体读完后释放 |
| 再填充 | 获取已释放的 S0，提交分块 2 及其阶段 | 分块 1 完成自己的等待后可从 S1 消费 |
| 排空 | 不提交越界分块 3 | 等待／读取／释放分块 2，完成全部未结束工作 |

线程作用域流水线（Pipeline）的 `consumer_wait()` 等待本线程相关工作，不会自动等待其他线程的拷贝。其他线程读取这些目标时，在拷贝完成之后、读取之前加 `__syncthreads()`；任何线程复用槽位之前再加一次。块作用域流水线则要明确生产者／消费者成员及 acquire/commit/wait/release 义务，不能混用作用域。本单元纸面解答采用保守的“线程作用域加块屏障”形式。

`cuda::memcpy_async` 各重载使用的同步对象不同，应记录实际重载及头文件，如 `<cuda/pipeline>` 或 `<cuda/barrier>`。硬件非批量拷贝采用 **4、8 或 16 B** 粒度，要求对应对齐、全局源、共享目标、有效字节范围及可平凡复制的元素类型。`aligned_size_t<16>` 承诺要求源和目标对齐，且大小是 16 的倍数；它无法修复偏移一个 FP32 元素的指针。高层调用在硬件条件不满足时可能生成同步路径。本比较应显式选普通拷贝回退，并在宣称硬件路径之前检查生成指令。

带谓词的尾部加载不能让 commit、wait 或复用边界所需的参与者缺席。Ampere 的流水线批次序列存在**线程束纠缠（Warp Entanglement）**：分歧提交可能产生额外批次和过度等待。commit 与 arrive-on 操作前，用 H01 中有效的掩码重汇合预期参与者，不能临时用活跃掩码替代。图示无法决定指令选择或停顿时长。

## 到达不代表可以读取

共享内存中的 `cuda::barrier<cuda::thread_scope_block>` 必须由一个线程按预期到达次数初始化，参与前先发布初始化结果。`arrive()` 对当前阶段贡献到达并返回令牌，`wait(token)` 等待该阶段完成。两者之间的工作必须独立于屏障所保护、尚未就绪的数据。

通过相应 `cuda::memcpy_async` 屏障重载绑定拷贝后，完成条件同时包含参与线程到达和绑定拷贝完成。仅把无关拷贝放在 `arrive()` 附近并不建立绑定。令牌属于特定阶段，必须在当前或紧接的下一阶段使用，不能跨任意次复用。提前退出需要正确的 `arrive_and_drop` 协议；本入门样例直接保留所有参与者。数据发布和安全复用仍是不同阶段。CC 8.0 以下的 API 可用性不等于硬件分离屏障加速；可移植基线仍是普通屏障。

## 保留 Tensor Core 数值契约

先从 L08 的 FP32 SIMT 基线出发，再选择具体的线程束矩阵乘加（Warp Matrix Multiply-Accumulate，WMMA）。下列形状是 **C++ WMMA 分块**，不是调优指南中的机器指令尺寸表：

| 路径 | 本比较的输入／累加器／输出 | WMMA M×N×K | 已核对行中的原生能力 |
| --- | --- | --- | --- |
| FP16 | `__half` / `float` / FP32 | 16×16×16 | 7.5、8.0、8.6、8.7 |
| BF16 | `__nv_bfloat16` / `float` / FP32 | 16×16×16 | 8.0、8.6、8.7 |
| TF32 | `precision::tf32` / `float` / FP32；存储仍为 `float` | 16×16×8 | 8.0、8.6、8.7 |
| FP64 | `double` / `double` / FP64 | 8×8×4 | **仅 8.0** |

BF16 与 TF32 WMMA 的 API 目标要求为 `sm_80` 或更高，但不代表每个更高 CC 都具有原生 FP64 Tensor Core；CC 8.6 与 8.7 没有。普通 FP64 算术是另一项能力。TF32 输入需要文档规定的转换；`float` 存储及 FP32 累加不能让乘法变成普通 FP32。不能因为 CC 门槛通过就悄悄选择低精度路径。

使用完整线程束，保持集合参数一致，提供完整有效分块及要求的指针对齐、前导维度。FP16 WMMA 加载指针需 32 B 对齐，half 的 `ldm` 需为 8 的倍数。集合加载前补零尾部分块，只在后续有界拷贝时按元素加谓词，不能让单个通道提前退出 WMMA。按 L08 同时对比原始输入与转换后输入的 CPU 参考，说明容差和非有限值处理。拷贝资格、数值验收及线程束安全是不同门槛。

## 同时选择目标、资源与回退

未来 7.5、8.0、8.6 比较沿用 H01 拟议配置：CUDA 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / Ubuntu 24.04 x86-64 / 驱动 610.43.02。现代单 GPU 能力层级（Modern Single-GPU Capability Tier）要求 CC 8.0+ 且至少 8 GB。CC 8.7 的硬件行不代表获准使用 x86-64 环境；执行前需独立选择并核对其原生 Linux 平台、驱动、主机编译器与 Toolkit 兼容性。

| 路径 | 虚拟／真实目标 | 附加门槛 | 声明的回退 |
| --- | --- | --- | --- |
| 普通拷贝／FP32 SIMT | Turing 用 `compute_75` / `sm_75`，其他设备用匹配目标 | 有效范围、屏障、分配预算 | 基线本身 |
| Ampere 拷贝／分离屏障 | `compute_80` / `sm_80`、`compute_86` / `sm_86` 或 `compute_87` / `sm_87` | 精确设备；全局／共享方向、对齐、阶段和参与证明 | 普通拷贝及显式发布／复用屏障 |
| BF16 / TF32 WMMA | 对应已核对的 8.x 目标 | 明确接受数值契约、完整线程束、有效形状／布局／存储 | 明确接受并重新验证的 FP32 SIMT |
| 原生 FP64 Tensor Core | `compute_80` / `sm_80`，本表中的 CC 8.0 | FP64 形状与完整线程束契约 | 普通 FP64 SIMT，独立验证数值 |

胖二进制（Fatbinary）可以同时保留基线镜像和特化镜像。每次编译时保护源代码功能分支，分派前核对运行时所选设备。只有 `sm_75` cubin 不构成 Ampere 镜像，`sm_80` 镜像也不能在 CC 7.5 运行。PTX 回退另需兼容驱动的 JIT 支持，不能创造硬件功能。查询编译器目标清单并检查真实产物；这里不声称执行过任何命令。

## 针对明确工作负载调优

CC 8.0/8.6/8.7 每块共享内存上限分别为 **163/99/163 KiB**；超过 48 KiB 要动态共享内存并显式启用。不能把 CC 8.0 的容量赋给所有 Ampere 设备。更多阶段消耗共享内存，可能降低驻留；小拷贝也未必能摊薄流水线开销。保持数据类型、形状、数值验收和计时边界一致，检查生成指令，再分别测量正确的基线与特化路径。峰值规格和更大的 CC 都不是加速比。

## 证据边界

四个元数据证据数组保持为空。外部流水线、屏障、Tensor Core 行为及性能均**待硬件验证（Pending Hardware Verification）**。本单元没有构建、GPU 运行、消毒器结果、生成代码检查或实测重叠。合格运行需要自己的环境清单（Environment Manifest）与基准环境（Reference Environment）、精确目标和源码、带错误检查的完成点、正确性比较及保留报告。VIS15 仅筛选已核对事实，不授予证据状态（Evidence Status）。浏览器不执行 CUDA。

## 回忆检查

1. 为什么等待本线程拷贝不等于发布其他线程的数据？
2. 哪条顺序边防止生产者覆盖仍在读取的槽位？
3. 为什么 arrive 与 wait 之间可以做独立工作，却不能消费未就绪分块？
4. 断言 16 B 对齐前必须满足哪些条件？
5. 为什么 CC 8.6 不满足原生 FP64 Tensor Core 门槛，却满足 TF32 门槛？
6. TF32 回退到 FP32 SIMT 时改变了哪些数值假设？
7. 在 CC 8.7 平台执行前，还需独立核对什么？

## 练习

完成 [H02 练习](/architecture/ampere-pipelines-tensor-cores/exercises/)，再看[独立解答](/architecture/ampere-pipelines-tensor-cores/solutions/)并做[练习题库（Practice Bank）PB-R7-002](/practice/#pb-r7-002)。用 [VIS15](/visuals/architecture-evolution/)查找 CC 8.6 与原生 FP64 Tensor Core 的空交集，再用文字说明回退。

## 来源与许可

核对日期 **2026-09-22**。[SRC-CUDA-104](/sources-and-versions/#src-cuda-104)记录 [Ampere 调优](https://docs.nvidia.com/cuda/ampere-tuning-guide/index.html)、[非批量拷贝](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-ldgsts)、[屏障阶段](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-barriers.html)、[WMMA](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#warp-matrix-functions)及[原生能力](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html)。当前 Context7 用于检索，权利方文档决定契约。原创讲解、账本和练习采用 CC BY 4.0；没有复制 NVIDIA 示例或插图。在线指南 13.4.2、调优指南 13.4 与发布说明 13.4 Update 1 是带日期的复核，不改变固定工具包通道或本地证据。
