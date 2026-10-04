---
title: 'H06：可移植基线与特化路径'
description: 建立显式准入、独立正确的回退和同设备上的有界比较。
pairId: h06
counterpart: /en/architecture/portable-specialization/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, contract, detection, build, fallback, correctness, comparison, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H06
prerequisites: [H01, H02, H04, H05]
relatedUnits: [EX25, LAB19, LAB20, VIS15]
hardwareGate: none
estimatedMinutes: 45
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVCC archived target tables', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html', version: '13.3', platform: 'Toolkit 13.3.1 archive', accessDate: '2026-10-04' }
  - { title: 'PTX bulk copy and mbarrier', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html', version: '9.3', platform: 'sm_90 and selected Blackwell targets', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h06 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,contract,detection,build,fallback,correctness,comparison,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H06 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H01,H02,H04,H05' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/architecture/portable-specialization/" lang="en">Read the English counterpart</a>

## 学习目标

用 45 分钟说明特化内核何时可以启动、回退计算什么，以及公平比较测量什么。随后构建可运行示例（Runnable Example）[EX25](/examples/feature-gated-copy/)，并在合格外部环境中完成实验（Lab）[LAB19](/labs/hopper-portable-comparison/)或 [LAB20](/labs/blackwell-portable-comparison/)。

## 先修知识

精确有序先修：**[H01, H02, H04, H05]**。[H01](/architecture/turing-warp-safety/)讲显式参与，[H02](/architecture/ampere-pipelines-tensor-cores/)区分流水线与精度契约，[H04](/architecture/hopper-clusters-tma/)建立 TMA 完成条件，[H05](/architecture/blackwell-families/)定义目标范围。[VIS15](/visuals/architecture-evolution/)仍是来源核对模型。

## 从可观察行为开始

EX25 将 int32 输入经共享 tile 拷贝到独立输出。规模为 **256、4096、65536**，均可被 256 整除。每块 128 个线程处理一个含 256 个值的 tile。输入覆盖随索引变化的有符号值、全零、交替 ±100000。两端各四个保护元素必须保持不变。可移植路径使用普通加载／存储和块屏障；特化路径使用 1024 B 全局到共享批量拷贝、一个事务屏障和块级发布。两者随后采用相同的邻位轮换输出所有权，得到相同数值。

这是**单阶段加载／消费流水线**，不声称计算与传输发生重叠。没有尾部、张量映射、集群、TMA 存储或 Tensor Core 精度变化。输入／输出含保护区最多 **524352 B**；每块共享内存为 1024 B，特化另需 8 B 屏障。四个 int32 保护元素使载荷偏移 16 B，保持 `cudaMalloc` 提供的对齐。

## 能力检测与准入

检查设备枚举和选择后，调用 `cudaGetDeviceProperties`，使用主／次计算能力（Compute Capability，CC），而不是产品名。记录驱动／运行时版本、总显存和可用显存。EX25 选择可见设备 0，要求 CC 7.5+、总显存 8 GB、可用显存 512 MiB，并把实际 CC 与**所编译目标的显式已核对集合**取交集。未知未来 CC 即使数字更大，也不能进入特化路径。

对于固定的 128 线程、约 1 KiB 共享内存内核，已核对架构具有所需资源。若扩展到大 tile、动态共享内存或集群，必须增加实际内核／设备资源及集群准入查询。编译期 `__CUDA_ARCH__` 标识设备编译轮次，不是运行时 GPU，也不是主机选择的路径。乐观的主机分支不能让带后缀镜像获得兼容性。

## 保持构建镜像分离

EX25 使用独立翻译单元，普通基线不会为 `compute_75` 编译 bulk-copy PTX。特化单元对 Hopper 精确使用 `compute_90/sm_90`，对 Blackwell 使用所选 `f` 目标对；可移植单元包含普通 75 PTX/cubin 和所选家族数值目标的基线 cubin。驱动支持对应 PTX 版本时，普通 PTX 保留回退能力。此协议不需要架构独有指令，因此不使用 `a` 镜像。

完整构建配置是 **Toolkit 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / Ubuntu 24.04 x86-64**。运行实验选择驱动 **610.43.02**；任何获准替换需另行记录。较早的 11.8.0 和 12.9.2 工具包通道（Toolkit Lane）只构建 `portable` 配置。目标目录、编译输出和产物列表独立，避免旧特化对象冒充新目标。编译器支持、镜像兼容、运行正确性分别检查。

## 启动前选择回退

| 请求模式 | 特化是否准入 | 结果 |
| --- | --- | --- |
| `portable` | 任意 | 仅运行并验证可移植路径 |
| `auto` | 是 | 先验证可移植路径，再验证特化路径 |
| `auto` | 否 | 运行可移植路径并打印实际选择 |
| `specialized` | 否 | 内核启动前失败，绝不把基线标为特化 |

非法模式失败。CUDA 分配、启动、完成或清理报错会使进程失败，不捕获后换名重试。异步内核失败可能破坏上下文。回退必须保留输入、输出、所有权、同步、错误处理与获准数值语义；不支持某数据类型时，不能自动改成低精度。

## 正确性等价与生命周期

主机端 oracle 按输入规则重新生成期望值，两条 GPU 路径不互为 oracle。在流完成后检查全部载荷和两端保护区，计时后再检查一次。主机测试逐位置破坏输出／保护区，并拒绝跨家族请求；通过这些测试不等于 GPU 正确。

批量路径以一次到达初始化对齐的 64 位 `mbarrier`，向异步代理发布初始化，**只登记一次 1024 预期字节**，提交一次 bulk copy，并等待第零阶段。本屏障只有**一个提交／到达线程**，不同于 H04 的 256 次到达概念账本。随后块屏障把完成发布给全部 128 个消费者；最后一个块屏障等待所有读取结束，再使事务屏障失效并结束存储生命周期。这里只使用一个阶段，没有 tile 复用循环；增加阶段需要重新证明阶段与复用条件。

在外部超时保护下，对每条获准路径运行 memcheck、racecheck、synccheck。干净报告支持推理，但不能证明任意负载等价。保留非零退出和工具／设备缺失情况。

## 有界比较

EX25 预热五次，再采集十个样本，每个样本 **100 次启动**，CUDA event 位于同一非阻塞流中。按路径和规模分别输出原始批次毫秒。主机／设备传输和初始化不在 event 区间内，提交间隙可能在内。只有报告对应的每次启动均值时才除以 100。不要拿完整特化阶段与基线的一部分比较。

固定 GPU、输入、时钟、功耗、编译器和启动形状。记录顺序执行路径及热缓存影响；交替执行 portable-only 与 specialized 进程，暴露顺序偏差。比较分布，包括特化更慢的情况，不丢弃不利样本。单独运行 **Nsight Compute 2026.2.1.5**，使用管理员批准的计数器权限，记录精确指标可用性、重放／缓存设置并保留报告。权限失败阻断计数器，不阻断普通正确性／event 计时。结论仅适用于此工作负载和设备，不形成通用架构排名。

## 证据边界

学习单元（Learning Unit）的四个证据数组为空。EX25 独立记录编译和运行；一个目标构建成功不能说明另一个目标。LAB19、LAB20、架构行为及性能均**待硬件验证（Pending Hardware Verification）**，直到合格基准环境（Reference Environment）执行满足标准并附完整环境清单（Environment Manifest）。预期输出不是已记录结果。原生 Linux 是唯一受支持环境（Supported Environment）；网站不执行 CUDA。

## 检索检查

1. 为什么 `major >= 10` 不能用作家族目标分派规则？
2. 为什么基线放在独立设备翻译单元？
3. 哪个模式必须拒绝不支持的特化，而不能换名回退？
4. 一次到达和 256 次到达的屏障协议有什么区别？
5. EX25 的 event 区间排除了哪些开销？

## 练习与实验

尝试 [H06 练习（Exercise）](/architecture/portable-specialization/exercises/)，阅读[独立解答](/architecture/portable-specialization/solutions/)和练习题库（Practice Bank）[PB-R7-006](/practice/#pb-r7-006)，然后构建 [EX25](/examples/feature-gated-copy/)。[LAB19](/labs/hopper-portable-comparison/)选择 CC 9.0；[LAB20](/labs/blackwell-portable-comparison/)选择精确 Blackwell 家族契约。

## 来源与许可

核对日期 **2026-10-04**。通过 Context7 和 [13.3.1 NVCC 归档](https://docs.nvidia.com/cuda/archive/13.3.1/cuda-compiler-driver-nvcc/index.html)、[PTX bulk-copy/mbarrier 规范](https://docs.nvidia.com/cuda/archive/13.3.1/parallel-thread-execution/index.html#data-movement-and-conversion-instructions-cp-async-bulk)、[当前能力范围](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html)复核。见 [SRC-CUDA-108](/sources-and-versions/#src-cuda-108)。原创文字／账本采用 CC BY 4.0，EX25 采用 Apache-2.0；权利方文档保留其声明，未复制权利方示例或图形。
