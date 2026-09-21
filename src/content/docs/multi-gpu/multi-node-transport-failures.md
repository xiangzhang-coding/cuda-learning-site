---
title: 'G09：追踪多节点传输与故障证据'
description: 用有边界的证据区分启动、引导、传输与应用故障。
pairId: g09
counterpart: /en/multi-gpu/multi-node-transport-failures/
factCheckDate: '2026-09-21'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, identities, transport, selection, logging, timeouts, diagnosis, admission, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G09
prerequisites: [G03, G04, Q07]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 65
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL network and failure contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-21' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g09 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-21' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,identities,transport,selection,logging,timeouts,diagnosis,admission,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G09 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G03,G04,Q07' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/multi-node-transport-failures/" lang="en">Read the English counterpart</a>

## 学习目标

建立 rank 到节点的账本，论证接口／传输候选项，写出区分事实、假设和证据缺口的诊断。建议 65 分钟。阅读与静态练习（Exercise）无需 GPU。多节点执行、传输选择、恢复与性能均待硬件验证（Pending Hardware Verification）；本单元没有已运营集群或实测运行作为依据。

## 精确先修

**[G03, G04, Q07]**：[拓扑路径](/multi-gpu/topology-paths/)、[通信器与集合通信](/multi-gpu/nccl-communicators-collectives/)以及[时间线优先诊断](/correctness/timeline-first-nsight-systems/)。先区分邻接与传输、集合参与与结果放置、主机提交与设备完成。

## 跨节点为何改变问题

在一台机器上，设备序号和本地拓扑查询可以标识资源。跨机器后，独立的操作系统、地址空间、名称、路由与时钟进入链路。集合通信库保留 rank 层面的操作，传输实现负责搬运。这种分工让应用可移植，也增加了故障域（failure domain）：正确的 GPU kernel 无法补齐缺失的进程或不可达的接口。

## 把不同身份放在不同列

节点（node）是分配到作业中的机器；进程（process）是程序的一个操作系统实例；rank 是通信器（communicator）内的身份。本地 rank（local rank）由启动器／应用定义，表示节点内索引。它们都不等于 CUDA 可见序号、GPU UUID、主机名或 IP 地址。网络接口（network interface）属于节点；路由（route）决定如何到达端点；传输（transport）实现通信；拓扑（topology）描述连接与路径，不代表传输已成功。

下列虚构双节点账本每节点包含一个进程、一个 rank 和一个完整 GPU。两个进程都选择可见设备 0 可以是正确的。符号是公开别名，不是需要解析的地址。

| 节点别名 | 进程别名 | 全局 rank | 本地 rank | 可见 GPU | 接口别名 |
| --- | --- | --- | --- | --- | --- |
| node-a | process-a | 0 | 0 | 0 | data-a |
| node-b | process-b | 1 | 0 | 0 | data-b |

在私有记录中，将每一行对应到主机名解析、GPU 身份、PCIe／NUMA 连接、NIC／HCA 端口及资源分配归属。主机名可能解析到管理网络；两个节点上同名接口也不一定属于同一网络。G03 的本地 GPU–NIC 距离不能证明远端交换路径或路由。比较 Q07 时间线前，先记录节点内事件顺序、时钟同步及其误差；两个主机的时间戳本身不能证明重叠或最早的全局故障。

## 分开启动、引导与数据搬运

进程启动器（process launcher）启动进程并提供放置与环境；NCCL 不启动进程。一个进程调用 `ncclGetUniqueId`，通过带外（out-of-band）CPU 机制分发 ID，再由不同 rank 调用 `ncclCommInitRank`。`ncclCommInitAll` 只限单进程，修改接口变量不能让它成为多节点启动器。EX24 采用的就是这一局部设计。

启动控制、NCCL 引导（bootstrap）和集合通信数据可以走不同路径。TCP 引导可以与 IB／RoCE 数据传输共存。启动器连接成功或一条引导消息，都不能证明集合完成或 GPUDirect RDMA 生效。Socket 传输使用 TCP/IP；NCCL 内置 `IB` 网络通过 verbs 支持 InfiniBand 或 RoCE。插件可以提供其他命名网络。RDMA 可用、GPU 内存直接访问及算法选择是不同主张，分别需要证据。

已检查的 nccl-tests 修订版要求通过 MPI 构建（`MPI=1`）支持多进程；总 rank 数等于进程数 × 每进程线程数 × 每线程 GPU 数。CPU ID 分发使用 `MPI_Bcast`；`src/common.cu` 按本地 rank 选择设备。这说明源码行为，不是已验证的启动配方。未来可运行场景准入前，必须固定 MPI 实现／版本及其远端启动、环境传播和终止语义。

## 先选候选项，再验证实际路径

以下是供推理的**配置值**，不是 shell 启动脚本。`data0`、`data1`、`mlx5_0` 是假设的本地名称；只有在每个原生 Linux 节点完成授权盘点后才能替换。

| NCCL 2.31.2 控制项 | 含义与证据边界 |
| --- | --- |
| `NCCL_SOCKET_IFNAME='=data0'` | 精确 IP 接口过滤；`data` 是前缀，`^=data1` 排除精确名称。手动选择绕过自动选择，可能匹配多个接口。它不选择 RDMA HCA。 |
| `NCCL_SOCKET_FAMILY=AF_INET` | 限制 IPv4；`AF_INET6` 选择 IPv6。地址族、本地地址和远端路由必须一致。 |
| `NCCL_IB_HCA='=mlx5_0:1'` | 精确 verbs 设备与端口过滤；IP 接口名不是这个命名空间。没有精确匹配前缀的 `mlx5_1` 也可能匹配 `mlx5_10`。 |
| `NCCL_NET=Socket` 或 `NCCL_NET=IB` | 请求指定网络，而不依赖自动选择。检查每个 rank 日志中的可用性与所选网络；强制不存在的网络可能失败。 |
| `NCCL_IB_DISABLE=1` | 在受控比较中关闭内置 verbs；它不能修复路由，也不能证明外部插件选了什么。 |

自动 IP 选择优先考虑 `ib` 名称，通常排除 loopback／docker 接口，除非没有其他接口。UP 接口仍可能不可达。检查获准的地址、双向路由、地址族、端口策略及远端端点。NCCL 除数据传输外也会建立 TCP 连接；只开放启动器端口并不够。管理员批准的端口范围／防火墙属于环境要求，不应变成让学习者全面关闭防火墙的指令。

对于 RDMA，另外记录 HCA／端口、活动状态、链路层、固件／provider 版本、网络／rail 映射及内存注册权限。IP 可达不证明 RDMA 路径；主机内存 verbs 测试成功不证明 GPU 内存路径。记录版本、权限及内存模式后，才使用环境负责人批准的底层测试。NCCL 2.31.2 动态选择 RoCE GID；不要把旧的固定 `NCCL_IB_GID_INDEX` 变通配置搬进本配置。网络 traffic class 策略由运维人员负责。每次只改变一个获准变量，比较后移除调试覆盖值。

## 日志保留因果，发布隐藏身份

未来诊断可请求 `NCCL_DEBUG=INFO` 及 `NCCL_DEBUG_SUBSYS=INIT,BOOTSTRAP,NET,ENV,GRAPH,COLL`。选择 `COLL` 不保证 INFO 级别包含每次调用轨迹；另外保留应用序列标记及即时返回值。保存启动器 stderr／状态、每个 rank 的应用阶段、CUDA／异步 NCCL 状态及传输消息。日志缺失就是证据缺失，不是成功。

`NCCL_DEBUG_FILE` 支持 `%h`（主机名）、`%p`（PID），会覆盖同名旧文件；进程共用文件名可能丢失或破坏输出。每次尝试使用新的私有作业目录和各进程独立文件名。原始材料私有保存。发布前，在**文件名和内容**中一致替换主机名、IP／MAC／GID 地址、GPU UUID、总线 ID、作业 ID、用户名、路径及通信器 ID，启动命令也要处理。凭证／token 和无关环境变量必须全部删除，不发布完整环境转储。保留 rank 关系、阶段顺序、错误类别及版本事实，并给出脱敏账本。压缩包、元数据和截图也要检查。

练习包含原创、合成、身份脱敏的诊断材料（diagnostic fixture）。它们是结构化教学记录，不是逐字 NCCL 日志，也不是已执行故障报告。仅使用节点／进程／接口别名和逻辑序号，不暗示计时、主机名、路由地址、凭证或结果。

## 超时是边界，不是根因

| 边界 | 固定版本含义 | 不能证明什么 |
| --- | --- | --- |
| Socket 重试 | 默认 `NCCL_SOCKET_RETRY_CNT=34`、`NCCL_SOCKET_RETRY_SLEEP_MSEC=100` 用于指定连接错误；线性等待总和为 34×35/2×100 ms = 59,500 ms | 不是全局 59.5 秒初始化或作业期限；连接尝试及其他阶段还需要时间 |
| Verbs 确认 | `NCCL_IB_TIMEOUT=20`：4.096 µs × 2^20 ≈ 4.295 s；默认 `NCCL_IB_RETRY_CNT=7` | 不是集合通信期限；timeout 为零或 ≥32 表示无限超时，不是立即失败 |
| 应用进度 | 轮询流进度，并检查 `ncclCommGetAsyncError` 的返回状态和输出状态；明确阶段期限 | 查询成功不等于通信器健康或工作完成 |
| 整个作业 | 外部监督器限制启动、初始化、集合、清理及远端终止时间 | 只杀本地启动器不证明远端 rank 已停止 |

延长超时无法修复集合调用 count／顺序不匹配、rank 缺失或无效路由。挂起（hang）意味着观察窗口内未确认进度；应定位阶段与缺少的证据，而不是宣布交换机损坏。仅使用阻塞流同步，可能在异步网络故障后无限等待。

## 按故障域诊断，保留恢复证据

从最小已知失败阶段入手，选择能区分假设的观察：

| 未来报告中的症状 | 候选故障域 | 下一条区分性证据 |
| --- | --- | --- |
| 一个 rank 从未输出应用启动标记 | 启动器、程序／库可见性、放置、权限、进程退出 | NCCL 前的逐节点启动器状态、程序／构建身份和 stderr |
| 引导开始但对端未连接 | 名称／地址选择、地址族、路由、TCP 策略、对端缺失 | 双端所选接口／路由及逐 rank 启动覆盖 |
| 初始化完成，操作序列不同 | 应用参与、count／dtype／顺序、生产者依赖 | 所有 rank 的操作账本及本地 Q07 时间线；不要先调网络 |
| Verbs 完成／注册失败 | provider、HCA／端口、内存限制、网络、对端退出 | 每个 rank 的第一条错误、获准的端口／provider／计数器及内存限制证据；计数器需要前后区间 |
| rank 1 退出后 rank 0 超时 | 进程故障可能通过通信器传播 | rank 1 更早的局部错误及启动器退出原因；超时报文本身不能证明网络致因 |

节点故障可移除多个 rank；一个进程或 GPU 故障可让所有对端等待；共享交换机可影响多个作业。共享故障域中的相关性只是猜想，不是归因。重试前保存失败材料。停止新工作，带外协调失败，在没有并发 NCCL 调用时让幸存 rank 尝试中止通信器，并由监督器强制整作业终止。应用管理的可中止设计需要固定文档规定的非阻塞通信器与轮询；abort／destroy 本身仍可能阻塞。不要对卡在阻塞调用中的线程引入不安全的并发 abort。

教学恢复策略是在运维人员批准修复后重新启动整个作业。记录新旧尝试 ID、失败阶段、错误／退出状态、每节点终止确认、配置变更、新通信器／ID，以及恢复的输入／checkpoint 身份。不能把不确定的输出当作 checkpoint。新尝试中所有 rank 完成正确性检查和清理，才可接受恢复结果。缺少这些证据的重试不证明恢复；删掉一个 rank 会改变数学契约。容错 shrink／grow 及无人值守重试需要另外设计。

## 未来外部运行的准入契约

本单元交付静态分析，不提供可执行的多节点实验（Lab）。未来运行在发布命令前，需要**至少两个原生 Linux 节点**和完整[环境清单（Environment Manifest）](/start/environment-manifest/)。建议最小范围为双节点，每节点一个进程／rank／完整 GPU，每卡 CC≥7.5、总显存 ≥8 GB、空闲 ≥1 GiB；不以 MIG 或 VM 替代。下表是要求账本，不是已配置硬件记录：

| 必填字段 | 建议范围或仍需提供的信息 |
| --- | --- |
| OS／编译器／驱动／Toolkit／NCCL | 原生 Ubuntu 24.04 x86-64、GCC 13.3.0／C++17、Toolkit 13.3.1（NVCC 13.3.73）、NCCL 软件包 2.31.2-1+cuda13.3、驱动 ≥610.43.02；记录双节点精确安装构建 |
| GPU／网络拓扑 | 精确 GPU 能力／数量／显存和 GPU–NIC PCIe／NUMA 映射；实际 NIC／HCA／端口、固件／provider、交换机／rail 连接、链路速率、MTU、接口、地址／地址族及双向路由／端口策略；目前未知 |
| 启动器与权限 | 精确 MPI 或其他启动器／版本／构建、节点分配、rank 映射、远端环境传播、程序／库可见性及全节点终止；GPU／设备、socket、主机／共享／锁页内存及私有日志权限；目前未选定 |
| 工作负载与判据 | 建议自编 int32 求和 all-reduce，R=2、N=257，输入 x[r,i]=3*(r+1)+(i mod 17)-8，两个 rank 期望值均为 9+2*((i mod 17)-8)；独立收发数组每 GPU 合计 2,056 字节，另加上下文／库开销；完成后检查所有元素 |
| 时限与日志 | 建议每阶段进度期限 60 秒、整作业期限 180 秒、终止宽限 10 秒，由选定监督器在每节点落实；超时也记录结果；保留全部逐 rank／启动器材料与脱敏账本 |
| 预期与记录 | 预期：获准启动、所选传输有记录、各 rank 结果正确、清理完成且作业状态为零。记录：无。编译证据：无。运行：待硬件验证（Pending Hardware Verification）。 |

判据来自手工推导，不是 nccl-tests 输出；上游基准测试需要独立的精确选项及验证契约。Socket 与 RDMA 比较分别需要准入清单。扩展性／性能需要多次完成的测量、相同负载／放置、时钟与计时边界及不确定性；这里不预测数值。社区材料可标为社区已观察（Community-Observed），但在合格基准环境（Reference Environment）出现前，维护者运行验证仍待完成。

## 练习

完成[传输与诊断练习](/multi-gpu/multi-node-transport-failures/exercises/)，再阅读[独立解答](/multi-gpu/multi-node-transport-failures/solutions/)。将模型用于 [PB-R6-012](/practice/#pb-r6-012) 和 [PB-R6-013](/practice/#pb-r6-013)。

## 检索问题

1. 为什么 rank 0 和 rank 1 都可以持有可见 GPU 0？
2. 哪些证据能区分启动器可达、引导与数据传输？
3. 为什么 IP 接口过滤不选择 HCA 端口？
4. 两个未同步节点的时间戳可能无法排列什么顺序？
5. 为什么 59,500 ms 重试休眠不是作业期限？
6. 什么证据能区分集合不匹配与网络故障？
7. 发布失败尝试前，哪些信息应保留、哪些应脱敏？
8. 什么条件让新尝试成为已验证恢复，而不只是再试一次？

## 一手来源与权利

复核于 **2026-09-21**。[SRC-CUDA-102](/sources-and-versions/#src-cuda-102) 记录当前 Context7 检索、不可变 NCCL 文档／实现及 nccl-tests 启动／验证源码、哈希与精确许可。讲解、表格、合成材料及练习为原创 CC BY 4.0；本站检查为 Apache-2.0。不分发上游日志、示例、二进制或测试。硬件行为仍待硬件验证（Pending Hardware Verification）。
