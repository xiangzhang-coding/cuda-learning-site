---
title: 'H04：Hopper 集群、分布式共享内存与 TMA'
description: 从可移植同步与暂存基线推导集群生命周期，以及与方向相关的拷贝完成条件。
pairId: h04
counterpart: /en/architecture/hopper-clusters-tma/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, clusters, dsm, tma, ordering, gates, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H04
prerequisites: [H02, M12, M13]
relatedUnits: [VIS15]
hardwareGate: none
estimatedMinutes: 45
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Hopper Tuning Guide', url: 'https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html', version: '13.4', platform: 'Source review; CC 9.0', accessDate: '2026-09-22' }
  - { title: 'Distributed Shared Memory', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#distributed-shared-memory', version: '13.4.2', platform: 'Source review; cluster lifetime', accessDate: '2026-09-22' }
  - { title: 'Tensor Memory Accelerator', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-the-tensor-memory-accelerator-tma', version: '13.4.2', platform: 'Source review; direction and completion', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h04 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,clusters,dsm,tma,ordering,gates,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H04 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H02,M12,M13' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/hopper-clusters-tma/" lang="en">Read the English counterpart</a>

## 学习目标

用 45 分钟解释：为什么跨块指针需要生命周期契约，为什么拷贝需要按方向区分完成条件。交付两份所有权账本和一份分派检查表。这些是纸面设计，不是新的可运行示例（Runnable Example）。

## 先修知识

精确有序先修边：**[H02, M12, M13]**。[H02](/architecture/ampere-pipelines-tensor-cores/)区分加速路径与可移植拷贝；[M12](/memory/cooperative-groups/)建立组成员及集体参与规则；[M13](/memory/asynchronous-copy-pipelines/)建立可读与可安全复用的区别。[VIS15](/visuals/architecture-evolution/)是相关资源。H03 不是先修。

## 两个可移植基线

**邻居交换：**两个逻辑块各拥有 256 个 int32 值，每个输出接收另一所有者的对应值。第一个普通内核把两个 1024 B 段写入 **2048 B 全局暂存**；同一流的第二个内核读取邻居段并写输出。输入、暂存、输出共 **6144 B**。有序内核边界提供跨块发布，无需网格自旋屏障。用 CPU 置换结果精确比较全部 512 个输出，包含不对称及零值输入。

**分块暂存：**把行主序 16×16 int32 分块拷入共享内存，线程块同步后写入独立全局输出。输入／输出共 **2048 B**，单个共享分块占 **1024 B**；专用版本的同步状态另计。普通加载／存储与块屏障即可完成。重复处理分块时，复用前所有读取者必须结束。逐元素精确比较，并保持填充保护区不变。

两个基线都要求一个兼容的 CC 7.5+ 原生 Linux GPU，问题大小远低于 8 GB。它们保留指定输出，不保留完全相同的指令或启动次数。交换基线有意支付第二次启动及全局暂存成本，不能复现 DSM 的远端共享地址空间。应比较完整交换操作，不能用一个专用内核对比只做了一半工作的基线。

## Hopper 增加协作的块组

Hopper 的计算能力（Compute Capability）为 **9.0**。线程块集群（Thread Block Cluster）是线程块与网格之间的可选层级。一个集群内的块保证在同一个 GPU 处理集群（GPU Processing Cluster，GPC）内共同调度。这不表示所有块位于同一个 SM，也不表示同步整个网格或建立多 GPU 共享内存。

可在编译期用 `__cluster_dims__` 声明集群维度，或在运行时通过 `cudaLaunchKernelEx` 与 `cudaLaunchAttributeClusterDimension` 设置；不能悄悄覆盖编译期要求。网格维度仍以块计，必须能被集群维度整除。纸面交换采用**一个 (2,1,1) 块集群**，每块 **(256,1,1) 线程**，网格 **(2,1,1)**。

八块是可移植集群大小的上限，不是无条件准入结果；小型 GPU 或 MIG 分区可能只允许更小的集群。针对实际内核／配置查询 `cudaDevAttrClusterLaunch`、`cudaOccupancyMaxPotentialClusterSize` 和 `cudaOccupancyMaxActiveClusters`。H100 可通过 `cudaFuncAttributeNonPortableClusterSizeAllowed` 启用非可移植大小 16；本练习（Exercise）使用两块，不假定 16 可用。集群变大时占用率可能下降。

## 分布式共享内存仍归各块所有

分布式共享内存（Distributed Shared Memory，DSM）允许线程访问集群内其他块的共享内存。分配仍然是**逐块的**：两块各 1024 B，合计在集群中暴露 2048 B，但单块不会因此得到 2048 B 本地分配。只在这个两块题设中，用 `1 - cluster.block_rank()` 得到邻居秩，通过 `cluster.map_shared_rank` 获得映射指针。

| 阶段 | 两个块的共同义务 | 原因 |
| --- | --- | --- |
| 初始化 | 每线程写自己的本地元素；所有线程到达 `cluster.sync()` | 所有所有者存在，初始化已发布 |
| 交换 | 通过映射邻居指针读取对应元素，写本地输出 | 远端存储存活，每个输出只有一个写者 |
| 结束 | 所有线程在复用或退出前到达第二个 `cluster.sync()` | 别的块仍在读取时，所有者不能销毁存储 |

该置换没有原子操作。若直方图中有多个写者，还需要合适的原子操作；集群屏障无法修复并发非原子更新。`__syncthreads()` 只协调一个块，不能替代任一集群级顺序边。屏蔽越界数据访问，但保留全部集体参与者。一块提早退出的小案例偶然成功，不构成生命周期证明。

## TMA 搬运字节，不做矩阵乘法

张量内存加速器（Tensor Memory Accelerator，TMA）始于 CC 9.0，扩展了 H02 的非批量 `cp.async` 全局到共享路径。它支持连续批量拷贝和最多五维的张量拷贝。普通全局↔共享 TMA **不要求集群**。集群 DSM／多播路径另有集群和目标屏障义务，不属于本单块分块题设。TMA 与 Tensor Core 算术不同，这里不会选择低精度数据类型。

| 选定路径 | 存储／描述符条件 | 完成机制 |
| --- | --- | --- |
| 一维批量全局 → 共享 | 两地址均 16 B 对齐；大小为 16 B 倍数；范围合法；无需张量映射 | 共享内存事务屏障 |
| 二维张量全局 → 共享 | 全局基址 16 B 对齐；外层字节步长为 16 B 倍数；共享目标 128 B 对齐；总拷贝为 16 B 倍数 | 共享内存事务屏障 |
| 共享 → 全局批量／张量 | 对应地址及描述符合法；生产者写入对异步代理可见 | 发起者的**批量异步组（Bulk Async-Group）**，不是加载屏障 |

对于 16×16 int32 题设：在主机通过 `cuTensorMapEncodeTiled` 编码 `CUtensorMap`，秩为 2，最快变化维度在前，维度 **[16,16]**、外层步长 **64 B**、box **[16,16]**、元素步长 **[1,1]**，无 interleave、无 swizzle、无 L2 promotion、无特殊浮点越界填充。类型用 `CU_TENSOR_MAP_DATA_TYPE_INT32`。保持描述符对齐（`CUtensorMap` 类型为 64 字节对齐），检查编码器结果，再作为 `const __grid_constant__` 参数传入。独立输入／输出分配需要独立映射。驱动 API 必须可用，通过 `-lcuda` 链接或经版本检查的入口调用；使用期间不得修改描述符。

事务屏障（Transaction Barrier）要求 8 字节对齐的共享存储，由 `cuda::barrier` 提供。共享分块按 128 字节对齐，精确传输 **1024 B**。所选张量题设没有尾块；不规则分块显式回退到已验证的普通拷贝，不使用未经检查的描述符或越界存储。重排（Swizzling）及设备端张量映射修改需要独立的布局／目标审查，不能把它们的规则套进本无重排、主机编码路径。

## 到达、传输完成与复用相互独立

概念性的 256 线程分块账本中，以 **256 次到达**初始化块作用域共享 `cuda::barrier` 并发布初始化。遵循所选 API 的异步代理（Async Proxy）可见性规则；原始屏障初始化需规定的排序，库初始化可能已经提供。恰好一个选出的发起者提交加载。显式事务计数路径只登记**一次 1024 预期字节**，而不是每个消费者登记一次；每个参与线程各贡献一次到达。已经自动计数字节的高层重载不能再手动重复计数。

1. 等待正确屏障阶段：全部到达**以及**全部事务字节均须完成。仅到达、普通块屏障或 H02 的非批量 `cp.async.wait_group` 都不能替代这个等待。
2. 消费者读取就绪分块。如果 TMA 存储前修改了共享内存，各写者需执行 `fence.proxy.async.shared::cta` 排序或对应文档包装，再做块内协调，之后发起者才能提交存储。
3. 发起者提交存储的批量组。**读取完成等待**表示传输已经读完共享源；发起者把该事实发布给块内其他线程后，源可复用。这不表示全局目标已可供任意读取者使用。
4. 完整批量组等待为发起者建立文档规定的目标完成条件；更广范围的消费者仍需正确发布边。本题设只在主机检查内核／流完成后消费全局输出。退出前排空全部传输，保护屏障及存储生命周期。

该协议只使用具名语义，没有复制权利方代码。未来实现时固定实际头文件／重载并检查生成指令。检索中出现的 `cuda::device::experimental` 示例不作为稳定课程（Stable Curriculum）依赖。高层拷贝调用成功本身不能证明选择了 TMA 指令或实际发生重叠。

## 精确门槛与回退

未来专用执行要求**一个 CC 9.0、至少 8 GB、空闲至少 512 MiB 的 GPU**，使用原生 Linux。拟议坐标：Ubuntu 24.04 x86-64／Toolkit 13.3.1／NVCC 13.3.73／GCC 13.3.0／C++17／驱动 610.43.02，独立记录于环境清单（Environment Manifest）。这些集群、DSM 和主机编码 TMA 路径使用 **`compute_90` / `sm_90`**。基本 TMA 不需要 `sm_90a`；设备端张量映射修改等架构专属功能不在范围内。`sm_90a` 镜像不是通用回退。检查编译器目标列表及运行时功能／资源准入；普通镜像也要为其服务的设备编译。

| 路径 | 额外内存／启动门槛 | 失败动作 |
| --- | --- | --- |
| 集群 + DSM 交换 | 每块 1024 B 共享；两块集群获准；4096 B 输入／输出；无需 TMA | 6144 B 全局暂存基线、两个有序内核 |
| 单块 TMA 分块 | 1024 B 共享 + 屏障及对齐填充；描述符和 2048 B 全局；无需集群 | 普通分块拷贝，保留块发布／复用 |
| 普通基线 | CC 7.5 用 `compute_75` / `sm_75`；选定 GPU 使用匹配的 `compute_89` / `sm_89` 或 `compute_90` / `sm_90` | 实际内存或目标不满足时缩小／拒绝；不启动不合格专用路径 |

Hopper **每块最多 227 KiB 共享内存**，来自每 SM 228 KiB 的共享资源；超过 48 KiB 需动态分配及显式启用。启动前计算屏障、填充、全部缓冲区及内核资源约束。DSM 总容量不会提高单块上限。

## 正确后再调优

先验证精确 CPU 置换／拷贝、启动与完成错误，以及适用的 memcheck／racecheck／synccheck 报告。干净报告只能辅助生命周期证明，不能替代它。随后在同一 GPU 上比较相同完整操作：两个基线内核对完整集群交换，或普通暂存对完整 TMA 暂存。记录预热、重复次数、计时边界及分布。1024 B 的小分块可能不足以摊薄描述符或同步成本；增加阶段和集群大小可能减少驻留。

指令／资源检查及单独的 Nsight Compute 采集可检验解释。记录精确分析器版本、目标、指标、重放／缓存设置及集群配置。硬件计数器需要管理员授权；`ERR_NVGPUCTRPERM` 表示相关判断未测量。无分析器计时另行记录。纸面推理、普通正确性／事件计时无需计数器权限。来源容量、功能资格和流水线图都不能给出通用速度排名。

## 证据边界与实验状态

四个证据数组为空。架构行为、DSM 生命周期结果、TMA 指令选择与性能均**待硬件验证（Pending Hardware Verification）**。合格的基准环境（Reference Environment）运行需要完整环境清单、精确构建／产物、正确性、带错误检查的完成点及保留报告。原生 Linux 是唯一受支持环境（Supported Environment）；浏览器不执行 CUDA。

**LAB19 保持未发布**，直到 H06 提供可移植比较契约。这些有界纸面对照不发布实验（Lab）、可运行项目或执行证据。不提供空的 LAB19 路由、导航项或目录记录。

## 快速回忆

1. DSM 段初始化后，为什么两个块仍须存活？
2. 八块可移植上限是否保证任意 MIG 分区启动成功？
3. 为什么 TMA 分块加载并不天然需要集群或 Tensor Core？
4. 加载屏障阶段的完成由哪两个量决定？
5. 为什么批量读取完成等待允许源复用，却不允许任意全局消费？

## 练习与后续边

先做 [H04 练习（Exercise）](/architecture/hopper-clusters-tma/exercises/)，再看[独立解答](/architecture/hopper-clusters-tma/solutions/)及[练习题库（Practice Bank）PB-R7-004](/practice/#pb-r7-004)。在[可视化讲解（Visual Explainer）VIS15](/visuals/architecture-evolution/)筛选 TMA，比较 CC 8.9 与 9.0。后续可移植专用化综合单元必须逐功能准入；本单元提供其需要的集群生命周期及拷贝完成推理。

## 来源与许可

核对日期 **2026-09-22**。[SRC-CUDA-106](/sources-and-versions/#src-cuda-106)记录当前 Context7 检索及精确的 [Hopper 调优 1.4 节](https://docs.nvidia.com/cuda/hopper-tuning-guide/index.html)、[DSM 2.3.3.8 节](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html#distributed-shared-memory)、[TMA 4.12.2 节](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-the-tensor-memory-accelerator-tma)、编译器及发布文档。Guide 13.4.2 和 tuning 13.4 是核对版本，不改变工具包通道（Toolkit Lane）。原创讲解、所有权账本及练习采用 CC BY 4.0；权利方资料保留专有声明。未复制或改编示例、图片或表格。
