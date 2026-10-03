---
title: 'H03：Ada 缓存与有界工作集'
description: 先区分设备容量、缓存复用与工作站约束，再提出 Ada 优化假设。
pairId: h03
counterpart: /en/architecture/ada-working-sets/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, history, working-set, policy, gates, measurement, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H03
prerequisites: [H02, M02, Q10]
relatedUnits: [VIS15]
hardwareGate: none
estimatedMinutes: 30
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ada Tuning Guide', url: 'https://docs.nvidia.com/cuda/ada-tuning-guide/index.html', version: '13.4', platform: 'Source review; CC 8.9', accessDate: '2026-09-22' }
  - { title: 'L2 Cache Control', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/l2-cache-control.html', version: '13.4.2', platform: 'Source review; capacity and policy', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h03 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,history,working-set,policy,gates,measurement,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H03 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H02,M02,Q10' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/ada-working-sets/" lang="en">Read the English counterpart</a>

## 学习目标

用 30 分钟建立字节账本和可证伪的缓存假设。区分“分配能装进显存”和“下次复用前数据可能仍在二级缓存（L2 Cache）中”。交付物是一份设计审查及未来测量方案。

## 先修知识

精确有序先修边：**[H02, M02, Q10]**。[H02](/architecture/ampere-pipelines-tensor-cores/)提供逐功能门槛；[M02](/memory/coalescing-transactions/)提供事务与访问模式；[Q10](/correctness/roofline-arithmetic-intensity/)区分请求字节与实测流量。[VIS15](/visuals/architecture-evolution/)是相关资源，不增加先修。

## 从普通拷贝基线开始

考虑重复拷贝一个连续的 32 位整数数组：普通合并加载／存储（Coalesced Loads/Stores）配合边界检查，输入与输出不重叠。每次启动拷贝全部元素，同一流的多次启动复用同一输入。这里不需要算术、原子操作、共享内存或缓存策略。在检查完成错误后，用 CPU 逐元素按位比较输出与输入。除大容量案例外，还检查长度 0、1、255、256、257；零长度跳过启动。

基线要求兼容的 CC 7.5+ 原生 Linux GPU，问题内存小于 8 GB；也可用匹配镜像在 Ada 上运行。比较默认缓存与可选持久化策略时，保持源码、大小、重复次数及输出语义相同。默认策略仍然使用缓存，不能称作“禁用缓存”的对照。

## Ada 改变了什么

Ada 的计算能力（Compute Capability）为 **8.9**。NVIDIA 为 **AD102** 记录了 **98304 KiB（96 MiB）** L2，相比 GA102 的实现容量更大。这是具体实现的例子，不是每款 Ada 产品的保证。应在选定设备上查询 `cudaDeviceProp::l2CacheSize`。CC 判断不能给出该值、可用显存、时钟行为或实测带宽。

Ada 的 L1／共享／纹理组合资源为 128 KiB，每 SM 共享内存最多 100 KiB，**每块最多 99 KiB**，这些与 L2 分开计算。超过 48 KiB 的共享内存需要动态分配和显式启用。首选划分（Carveout）是偏好，不是保证占用率的资源预留。即便能启动，H02 增加流水线阶段仍可能减少驻留块数。

## 计算工作集与复用距离

工作集（Working Set）是复用间隔内竞争缓存的数据，不只是被命名为“输入”的分配。复用距离（Reuse Distance）关注两次访问间经过的不同数据；合并访问关注线程束内事务。合并良好的单遍流式访问也可能没有有用的时间复用。

| 输入 W | 输出 W | 分配字节 | 每次启动请求的拷贝流量 |
| --- | --- | --- | --- |
| 4 MiB | 4 MiB | 8 MiB | 8 MiB |
| 32 MiB | 32 MiB | 64 MiB | 64 MiB |
| 128 MiB | 128 MiB | 256 MiB | 256 MiB |

MiB 为 2²⁰ 字节。最大案例前要求至少 **512 MiB 空闲显存**；256 MiB 有效载荷之外，在本练习（Exercise）预算内另留 256 MiB 余量。记录上下文建立后的实际空闲内存。输入与输出流量、寄存器溢出、其他内核及显示任务均可能竞争 L2。请求流量 `2W` 不等于实测 DRAM 流量；纯拷贝的算术 FLOP 数为零，不能用 FLOP/s Roofline 给它打速度分。

**测量前预测：**假设设备报告 64 MiB L2，哪些大小可能因重复访问获益？什么证据能推翻假设？即便两数组总共 64 MiB，也不能保证全部驻留在 64 MiB 缓存中，替换、访问顺序和其他使用者都会影响结果。128 MiB 输入不能同时完整驻留于该缓存。这两个判断都不能预测耗时。

## 可选策略只是提示

L2 持久化（L2 Persistence）控制始于 CC 8.0，并非 Ada 专属。查询 `persistingL2CacheMaxSize`、`accessPolicyMaxWindowSize` 及当前 `cudaLimitPersistingL2CacheSize`。预留区与窗口必须同时受设备限制和合法输入字节范围约束。`hitRatio` 指定获得持久化属性的大致比例，**不是实测缓存命中率**。并发窗口共享同一预留区：两个比例为 1 的 24 MiB 窗口可能在 32 MiB 预留区中相互竞争。降低比例可能减少竞争，但不会划出私有分区。

多实例 GPU（MIG）模式下 L2 预留区功能禁用；多进程服务（MPS）下大小在服务启动时配置，不能由客户端 `cudaDeviceSetLimit` 更改。这些是环境检查，不表示每款 Ada 都提供 MIG。模式、API 或容量条件不满足时保留默认缓存。所拥有的任务完成后，禁用它的访问策略窗口，并按约定的上下文策略重置持久化状态；只禁用窗口不会立即使旧缓存行恢复普通状态。重置要与同一上下文的其他使用者协调。

## 为未来比较设置门槛

阅读和纸面练习无需 GPU。专用比较要求**一个 CC 8.9、至少 8 GB 的 GPU**，并满足 512 MiB 空闲显存门槛。拟使用本站已有 Ubuntu 24.04 x86-64／CUDA Toolkit 13.3.1／NVCC 13.3.73／GCC 13.3.0／C++17／驱动 610.43.02 坐标，仍以实际环境清单（Environment Manifest）为准。这不是已声明的基准环境（Reference Environment）或构建报告。

| 路径 | 虚拟／真实目标 | 资源与功能条件 | 可移植对照 |
| --- | --- | --- | --- |
| 普通拷贝 | CC 7.5 用 `compute_75` / `sm_75`；其他设备用匹配目标 | 2W 全局字节；边界和完成检查；无需集群或 TMA | 选定设备上的同一默认缓存拷贝 |
| Ada 默认缓存拷贝 | `compute_89` / `sm_89` | 精确 CC 8.9；查询 L2 和空闲内存；无需集群或 TMA | 算法相同；跨设备耗时混入 L2 以外因素 |
| Ada 持久化候选 | `compute_89` / `sm_89` | 上述条件及允许的预留区／窗口／模式；无需共享内存 | 同一 GPU 默认策略；相同数据与工作量 |

编译器必须列出所选目标（`--list-gpu-arch` 为虚拟目标，`--list-gpu-code` 为真实目标）。分派前检查生成镜像和运行时设备；PTX JIT 需要兼容的驱动支持。目标名称不能保证缓存驻留。

## 测量工作负载，也记录工作站约束

先做独立正确性检查。计时时单独预热代码加载，声明数据冷／热协议，在同一流内用事件包围固定次数的重复启动，等待结束事件并保留多轮结果分布。首遍与重复遍结果分别报告。计时相同有效工作，将初始化、校验及传输移出内核区间，另报端到端成本。不能让大数据集少运行几次后直接比较而不归一化。

归因缓存时另做一次 **Nsight Compute** 采集，记录精确工具版本、指标名称／单位、重放（Replay）与缓存控制设置。硬件计数器需要管理员授权的性能分析权限；`ERR_NVGPUCTRPERM` 表示缺少证据，不是零流量。默认重放缓存清理可能破坏热缓存假设；带显式预热的应用重放或缓存控制设置都需单独审查。无分析器计时与插桩运行分开。本纸面练习及基本事件计时无需性能分析器权限。

工作站还应记录显示占用、并发进程、功耗／时钟／温度状态、可用内存及传输边界。先在同一 GPU 比较；换产品会同时改变 SM 数、带宽、时钟和软件。结论应限定为“此设置下的此工作负载”，不能写“Ada 普遍更快”。

## 证据边界与常见错误

四个元数据证据数组为空。架构执行、缓存行为及性能均**待硬件验证（Pending Hardware Verification）**。没有本地 CUDA 构建、GPU 执行或分析器观察。合格基准环境运行需源码／目标身份、环境清单、正确性输出、启动／完成错误检查、适用的消毒器结果，以及保留的计时／计数器报告。常见错误是把分配字节等同缓存驻留、把 `hitRatio` 当测量结果，或用清理过缓存的重放计数器解释无插桩热计时。

## 快速回忆

1. 为什么 AD102 的 96 MiB 不是每个 CC 8.9 设备的属性？
2. 合并访问良好时，为什么仍可能没有时间复用？
3. 推测输入缓存复用时，为什么要考虑输出流量？
4. `hitRatio=0.5` 指定了什么，又没有测量什么？
5. 哪些分析器和工作站条件会使热缓存比较失效？

## 练习与后续边

先做 [H03 练习（Exercise）](/architecture/ada-working-sets/exercises/)，再看[独立解答](/architecture/ada-working-sets/solutions/)和[练习题库（Practice Bank）PB-R7-003](/practice/#pb-r7-003)。在[可视化讲解（Visual Explainer）VIS15](/visuals/architecture-evolution/)比较 CC 8.9 的 L2 策略资格与缺失的集群／TMA 路径。本单元结束缓存分支；H04 有自己的 M12／M13 先修。

## 来源与许可

事实核对日期 **2026-09-22**。[SRC-CUDA-105](/sources-and-versions/#src-cuda-105)记录当前 Context7 检索与精确的 [Ada 调优 1.4.2 节](https://docs.nvidia.com/cuda/ada-tuning-guide/index.html#memory-system)、[L2 策略 4.14 节](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/l2-cache-control.html)、编译器、分析器及发布文档。Guide 13.4.2 和 tuning 13.4 为事实核对坐标，不改变固定工具包通道（Toolkit Lane）。原创讲解、字节账本与练习采用 CC BY 4.0；NVIDIA 资料保留专有声明。未复制权利方示例、图片或表格。
