---
title: 'G08：捕获 NCCL 工作，保留完整契约'
description: 区分集合捕获与重放、缓冲区注册、生命周期、图混用和架构专属优化。
pairId: g08
counterpart: /en/multi-gpu/nccl-graph-capture/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, environment, capture, replay, lifetime, topology, registration, advanced, mixing, failure, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G08
prerequisites: [G05, M14]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 95
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL CUDA Graph contract', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/cudagraph.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'NCCL buffer registration', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/bufferreg.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'CUDA stream capture API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__STREAM.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g08 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/nccl-graph-capture/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,environment,capture,replay,lifetime,topology,registration,advanced,mixing,failure,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G08 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G05,M14' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-graph-capture/" lang="en">Read the English counterpart</a>

## 学习目标

面对双 rank 工作流，判断谁参与捕获（capture）、谁参与重放（replay）、何时能修改缓冲区，以及哪些优化结论还缺证据。建立捕获与生命周期账本，在外部实现前排除非法状态转换。建议用时 95 分钟。阅读无需硬件；捕获成功、注册效果和性能均为**待硬件验证（Pending Hardware Verification）**。没有记录 GPU 执行或加速结果。

## 精确先修条件

**[G05, M14]**：[NCCL 流依赖](/multi-gpu/nccl-stream-dependencies/)提供集合通信（collective）顺序以及入队与完成的区别；[CUDA 图（CUDA Graphs）](/memory/cuda-graphs/)提供捕获、实例化、失效和外部资源生命周期。先复习这两个单元。设备通信 API 不是先修条件。

## 为什么先有捕获，后有注册

即使工作不变，主机重复提交也可能有开销。CUDA Graphs 复用实例化的依赖图，并不消除通信。NCCL **2.9 + CUDA 11.3** 开始支持集合通信、点对点通信和分组操作的捕获；NCCL **2.11** 再加入 CollNet 图注册优化。这是两个历史边界：普通捕获 all-reduce 不要求 CollNet、NVLS 或注册用户缓冲区。下文选定版本比这些最低版本更新；历史最低版本不是今天的受支持安装方案。

## 选定外部环境

使用原生 Ubuntu 24.04 x86-64、工具包（Toolkit）**13.3.1**、NVCC **13.3.73**、GCC **13.3.0**、C++17，以及独立固定的 NCCL **2.31.2**，提交 `7b83616df3ae082a1f32bb74c27458bfe8153a13`，软件包 `2.31.2-1+cuda13.3`。复用 [EX24 的精确软件包与构建坐标](/examples/nccl-all-reduce/)及 [SRC-CUDA-097](/sources-and-versions/#src-cuda-097)。保守原生驱动下限为 **610.43.02**，还必须支持实际 GPU；本配置不使用兼容垫片。G07 打包的 NCCL 2.28.9 属于另一环境。

基础练习选择**两个不同的完整 GPU，每个进程管理一个 GPU**；每卡**计算能力（Compute Capability，CC）≥7.5**、总显存 ≥8 GB、空闲 ≥1 GiB。N=4096 个 FP32 元素，分离的发送与接收载荷每 rank 共 **32,768 字节**；上下文、NCCL 工作区及图资源另计。每个进程使用一个健康的阻塞通信器（communicator）及一个显式 `cudaStreamNonBlocking` 流（stream）。单节点获授权的 PCIe 路径即可；基础路径不要求 NVLink、NVSwitch 或 InfiniBand。记录实际传输方式，不能由拓扑推断。不要把 EX24 的单进程多 GPU 主机循环直接用于图重放：一次阻塞的 `cudaGraphLaunch` 可能阻止同一线程启动对端。

保留[环境清单（Environment Manifest）](/start/environment-manifest/)：软件包与已加载库身份、源码版本、OS／内核／编译器、驱动、Toolkit／NCCL、rank→PID→设备映射、CC 与空闲／总显存、拓扑／对等访问、流依赖、分配器／基址／偏移／长度、图代次、标志／配置文件／插件、命令、每个 rank 的错误与退出码。要求设备访问、获授权的拓扑查询、本地引导套接字和主机／共享内存可用。缺失字段阻止验收。正确性无需性能分析器（profiler）。可选分析必须获准追踪各进程并写报告；硬件计数器另需管理员授权。记录被拒绝的权限及分析器精确版本，不能用预期时间线替代缺失报告。[LAB18](/labs/pipeline-nccl-computation/)提供测量规范。

## 捕获是集合一致的构建决定

在捕获外初始化通信器并分配缓冲区。先完成普通路径的正确性基线，预热相同操作和内核路径。本练习把输入生产保留在捕获外。每个 rank 调用 `cudaStreamBeginCapture(stream, cudaStreamCaptureModeThreadLocal)`，只捕获约定的 `ncclAllReduce` → 乘二消费者序列，在同一源流、同一线程调用 `cudaStreamEndCapture`。每次重放前，先在重放流生产新输入，再启动图。检查每次 CUDA／NCCL 返回值。线程局部模式不会让捕获内同步或其他不安全操作变合法。若使用分组，必须在约定捕获区域内开启并结束；分组结束仍不是设备完成。

捕获操作定义节点，不执行节点。每个操作的参与 rank 必须一致选择是否捕获。集合通信需要通信器全部 rank；点对点通信需要匹配的发送方和接收方。只让 rank 0 捕获、rank 1 普通提交 all-reduce 是非法方案。按 G05 对齐元素数、数据类型、归约操作、通信器和操作顺序。其他捕获流必须通过合法捕获事件边分叉，并在结束捕获前重新汇入源流。

| 边界 | Rank 0 | Rank 1 | 能说明什么 |
| --- | --- | --- | --- |
| 基线 | 普通序列；等待完成 | 匹配序列；等待完成 | 实际检查后才是对照候选 |
| 捕获代次 A | 只捕获归约／消费 | 只捕获匹配的归约／消费 | 图定义；输入生产者在图外 |
| 实例化 A | 自己的 `cudaGraphExec_t` | 自己的 `cudaGraphExec_t` | 本地可执行图，没有结果 |
| 重放 A，第 k 次 | 启动自己的 A | 启动自己的 A | 匹配参与，不是完成 |
| 完成第 k 次 | 检查流及通信器 | 检查流及通信器 | 成功后才允许主机比较 |

## 重放保留参与成员和地址

捕获成功后，要求图非空且 `cudaGraphInstantiate` 成功。每个参与 rank 启动自己**源自同一次集合捕获**的可执行图，并保持原参与 rank 集合。重放本身也是集合参与。某个 rank 独自重新捕获的图，即使元素数相同，也不能直接替换。图外约定图代次和重放序号；不能因本地分支跳过某个 rank 的重放。

基础路径串行迭代，先完成上一轮使用，再覆盖下一轮输入。只要在读取前正确排序，可以修改仍存活的缓冲区内容。给主机指针变量赋新地址，不会更新已捕获地址。本单元对于元素数、类型、归约、通信器、地址或依赖变化，一律先排空旧工作，再由各 rank 协调重新捕获并实例化。通用 CUDA 节点更新能力不保证可以安全修补 NCCL 的不透明内部节点。不要编辑 NCCL 内部节点。

原创参考公式为 `send[r][i] = r + 1 + k`，`ncclFloat`、`ncclSum`、N=4096、两个 rank、三次重放 k=0,1,2。生产者在同一流上、图启动前写入输入；捕获的消费者把归约输出乘二。每个元素的预期结果依次为 **6、10、14**。这是推导值，不是日志。每次完成后，每个 rank 的所有元素必须有限且精确相等。分离的非原地输入避免把上一次原地归约的和误作新输入。

## 保持对象和存储存活

捕获记录地址和资源引用，不复制应用数据。图模板、可执行图、用户分配、注册句柄和通信器有不同的所有者。不能把 `cudaGraphDestroy` 或 `cudaGraphExecDestroy` 当作同步。CUDA 用户对象（user object）的引用保留可能延迟析构；仅销毁源图不能证明图关联注册已经消失。

| 对象 | 本单元采用的保守释放边界 |
| --- | --- |
| 可执行图 | 最后一次重放及依赖消费者完成后，调用 `cudaGraphExecDestroy` |
| 图模板及所有克隆 | 本练习保留到最后；释放可执行图后，对所有模板调用 `cudaGraphDestroy` |
| 图管理注册 | 由 NCCL 随图生命周期管理；不能手动注销内部句柄 |
| 显式本地注册句柄 | 所有注册使用及保留图结束后，在对应通信器上调用 `ncclCommDeregister` |
| 发送／接收分配 | 所有使用及注册释放后，按分配器配对 `cudaFree` 或 `ncclMemFree` |
| 通信器／流 | 保留到图及注册清理结束；健康路径 `ncclCommDestroy`，再销毁流 |

这是保守顺序，不是说 CUDA 重放总需要源图模板。异步复制使用的主机暂存内存也要保持存活。生命周期保护本身不会阻止显式覆盖。另一流上的消费者需要等待重放后的事件，复用／释放前还必须确认该消费者完成。

## 拓扑仍是运行时输入

CUDA 依赖图与 NCCL 拓扑图不是同一对象。捕获不会创造对等可达性、固定网络算法或保证注册资格。保留各 rank 的设备放置、对等矩阵、获授权拓扑及实际传输诊断。本地注册调用成功，不证明所选集合操作使用了零拷贝传输。不能在普通 PCIe 硬件上强行要求 NVLS，也不能把不符合拓扑条件写成注册成功结果。

## 两种注册所有权模型

**图注册（graph registration）**由 NCCL 对符合条件的捕获操作管理，随图生命周期释放。**本地注册（local registration）**在操作前调用 `ncclCommRegister(comm, base, bytes, &handle)`，最后使用后调用 `ncclCommDeregister(comm, handle)`。本地注册可不经重新捕获而复用；两者都不是 CUDA 主机内存固定，也不是执行完成信号。

只要通信器某个 rank 向通信操作传入注册缓冲区，其他 rank 就必须传入各自的注册缓冲区；启用优化需要同时注册源和目标。混用注册与未注册参与可能产生未定义行为，不能期待平稳回退。对于 NVLS，各 rank 的发送地址相对各自发送分配基址的偏移要一致，接收偏移也分别一致；发送与接收偏移不必彼此相同，不同进程的绝对虚拟地址也不必相同。

高级注册练习使用 `ncclMemAlloc`。自定义虚拟内存管理（VMM）分配器必须满足推荐分配粒度、虚拟基址及长度对齐、POSIX FD 共享，以及支持时的 fabric 句柄要求。通用注册默认禁用旧式 `cudaMalloc` 注册：开启 `NCCL_LEGACY_CUDA_REGISTER=1` 可能导致执行挂起和失败／中止时的段错误，应保持禁用。基础路径仍可捕获使用普通未注册 `cudaMalloc` 缓冲区的操作；分配不等于注册。

## 高级路径门槛账本

所有行都保留精确 **NCCL 2.31.2 / Toolkit 13.3.1 / driver≥610.43.02** 配置、每 GPU 一个进程、**每卡总显存 ≥8 GB、空闲 ≥1 GiB**、N=4096 和 32,768 字节载荷，另计实际分配粒度及工作区开销。每行都要求上述清单与权限，测量时还需独立的分析权限。最低版本仅解释历史。可选资格不满足时记录**不符合条件**，使用另行验证的普通路径；API、分配或异步错误则必须停止，不能在受损通信器内重试。

| 可选路径 | 架构、GPU 数量与互连门槛 | 注册／版本契约及回退 | 为什么不属于基础路径 |
| --- | --- | --- | --- |
| CollNet 图注册 | CC≥7.5；≥2 节点、合计 ≥2 GPU；每进程至多一个 GPU；节点内 GPU 两两可 P2P；可用且兼容的 CollNet 插件／互连 | 始于 2.11；`NCCL_GRAPH_REGISTER=1` 默认开启但需要实际选中 CollNet；运行前记录插件／provider／固件精确版本；缺少插件配置即不符合条件 | 依赖算法与集群；该标志不是通用注册开关 |
| 通用节点内注册 | CC≥7.5 且支持 VMM／可共享分配；单节点 ≥2 个对等可达 GPU，PCIe 或 NVLink | 始于 2.23.x；图注册或本地注册，合格分配器；用普通未注册缓冲区作对照；不开旧式注册覆盖 | 增加分配器、共享和对等路径契约 |
| NVLS 注册 | 选定下限 CC≥9.0，**同时**要求具备 NVLink SHARP 的第三代或更新 NVSwitch 域；≥2 个合格完整 GPU，仅有两张 Hopper 卡不够 | 始于 2.19.x；`ncclMemAlloc`、各 rank 偏移匹配、图注册或本地注册；硬件不支持 NVLS 可用普通算法；支持但资源分配失败在 2.31.2 中为错误，包括默认 `NCCL_NVLS_ENABLE=2` | 多播／互连／资源要求；只满足 CC 不够 |
| IB SHARP 注册 | CC≥7.5；≥2 节点，每节点恰好一个参与 GPU／rank；可用 IB SHARP 互连／插件及获准的 RDMA 访问 | 始于 2.21.x；两缓冲区本地注册或捕获；准入前记录 SHARP／插件／OFED／固件精确版本；PXN 排斥网络注册，即使 `ncclCommRegister` 成功；禁用 PXN 是独立测量配置 | 此处没有提供集群 provider 配置，复核前仍不符合执行条件 |

跨节点注册时，`ncclMemAlloc` 或具备相应 RDMA 能力的 VMM 内存能避免一种内部暂存原因，并不证明暂存已经消失。不要混合分配器类型，也不要认定 `NCCL_PXN_DISABLE=1` 自动更快。注册成本、初始化、稳态执行和销毁需分开测量，保持正确性、工作量、拓扑与标志一致。没有任何行具有已测收益。

保持**新特性观察（Emerging Feature Watch）**的边界：新引入的设备 API、**CFT**、**单边 RMA（one-sided RMA）**、对称窗口／零 CTA 路径和新 NVLS 相关算法，都不是本练习的依赖或替代实现。选定发行说明记载了 Blackwell 上 Toolkit≥13.3 的 CFT、PAT+NVLS 在 H100 上的性能回退、B40 对称 TMA 非法访问及 B100 PCIe MLoPart 分配错误。这些不是基础捕获的证据；不能把其临时绕行配置复制到基线。本单元不为这些观察项提供可执行配置。

## 图混用与排序

基础串行路径保留默认 `NCCL_GRAPH_STREAM_ORDERING=1` 和图混用（graph mixing）策略，记录有效环境／配置覆盖。同一主机线程启动多个通信器的图，可能因混用机制死锁。每进程一 GPU、单通信器能减少这种风险，但不能免除一致参与义务。

`NCCL_GRAPH_MIXING_SUPPORT=0` 不是通用修复。关闭混用后，同一通信器或拆分共享通信器的并行图启动不受支持；使用这些通信器的图仍**未完成（outstanding）**时，主机发起普通 NCCL 调用也不受支持，即使放在同一流。未完成区间始于主机启动，止于设备内核完成。仅添加流依赖不会让这个区间消失；必须先完成图，再发起普通主机调用。

高级排序绕过 `NCCL_GRAPH_STREAM_ORDERING=0`（始于 2.30）不属于本单元的执行配置。它与 `graphUsageMode=2` 不兼容；显式 `NCCL_GRAPH_MIXING_SUPPORT=1` 会在初始化时强制 mode 2，覆盖配置中的更低模式。绕过后，应用必须在执行时串行化每 GPU 上跨图、跨通信器、捕获与普通调用的所有 NCCL 工作。通信器字段 `graphStreamOrdering=0` 具有相同义务。保留默认排序，不把减少依赖边当作免费优化。

## 失效和失败不同于不符合条件

不要对正在捕获的流／上下文调用 `cudaStreamSynchronize`、`cudaStreamQuery` 或更广的设备同步，也不要在捕获内隐藏旧式流同步复制。失效的捕获仍需在源流／源线程结束。保留第一处错误，检查 `cudaStreamEndCapture`，拒绝返回的空图，绝不实例化。某个 rank 捕获失败时，必须通知外部监督器，让对端停止进入重放。另一 rank 成功结束捕获／实例化不能修复该失败。

捕获外检查即时 API 错误，在截止时间内轮询流完成与 `ncclCommGetAsyncError`。使用**整作业 180 秒外部截止时间**，先 TERM，再留 **10 秒 KILL 宽限**，因为阻塞主机 API 可能阻止进程内轮询。保留所有 rank 日志和启动器退出码。异步失败时输出无效：停止全部 rank，保留最早错误，走官方中止／监督器路径；不能插入恢复集合通信，也不能释放活跃存储后继续。健康销毁与失败作业终止使用不同账本。超时即验收失败。

## 练习与验收

先完成[捕获与生命周期练习](/multi-gpu/nccl-graph-capture/exercises/)，再读[独立解答](/multi-gpu/nccl-graph-capture/solutions/)。随后审查 [PB-R6-010](/practice/#pb-r6-010) 和 [PB-R6-011](/practice/#pb-r6-011)。静态方案无需 GPU。外部实现必须保留每个 rank 的普通基线检查、捕获／实例化成功记录、三次已完成重放与 6／10／14 的比较、清理结果及清单。可选注册对照需要独立获准的配置行，以及区分请求注册与实际注册的日志。不要在共享硬件上故意执行损坏的集合通信时序。页面四组证据数组为空；捕获、注册与性能仍待硬件验证（Pending Hardware Verification）。

## 检索问题

1. 为什么支持捕获不意味着支持 NVLS 或 CollNet？
2. 哪些 rank 必须一致选择捕获，哪些必须重放？
3. 为什么修改主机指针变量不会更新捕获的缓冲区地址？
4. 什么允许覆盖输入，什么允许释放分配？
5. 为什么本地句柄和图管理注册的释放方式不同？
6. 为什么同流普通入队仍可能违反关闭混用的契约？
7. 捕获失效后，丢弃结果前必须做什么？
8. 不支持 NVLS 的硬件、资源分配失败与测得注册收益有何区别？

## 一手来源与权利

复核日期 **2026-09-20**：先检索当前 Context7，再核对精确版本的官方文档／源码／测试。[SRC-CUDA-101](/sources-and-versions/#src-cuda-101)保留不可变文件哈希、注册／混用语义、CUDA 归档、发行问题及独立 nccl-tests 源码阅读边界。上游测试只阅读，未执行。原创正文／表格／参考公式为 CC BY 4.0，本站测试为 Apache-2.0。没有复制上游代码、图、日志或性能结果。
