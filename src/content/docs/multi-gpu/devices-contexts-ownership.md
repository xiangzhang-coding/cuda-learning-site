---
title: 'G01：明确设备、上下文与资源归属'
description: 在使用双 GPU 前，为每个进程和主机线程建立明确的资源归属表。
pairId: g01
counterpart: /en/multi-gpu/devices-contexts-ownership/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, model, ownership, execution, environment, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G01
prerequisites: [F07, M07]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 50
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Runtime context management', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/driver-vs-runtime-api.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
  - { title: 'CUDA multi-GPU systems', url: 'https://docs.nvidia.com/cuda/archive/13.2.0/cuda-programming-guide/03-advanced/multi-gpu-systems.html', version: '13.2.0', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g01 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/devices-contexts-ownership/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,model,ownership,execution,environment,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G01 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'F07,M07' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1,13.2.0' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/devices-contexts-ownership/" lang="en">Read the English counterpart</a>

## 学习目标

面对双设备工作负载，说明每个分配、流和事件的所有者与生命周期，选择进程模型，并明确哪个主机线程选择哪个设备。阅读与纸面练习（Exercise）不需要 GPU。建议 50 分钟，另加外部实现时间。

## 精确先修条件

**[F07, M07]**：[Runtime 与 Driver API](/foundations/runtime-driver-api/) 和[流顺序](/memory/stream-ordering/)。不要求集合通信库。

## 单设备简化为何不再够用

第一个 CUDA 程序可以让运行时默认选择设备零。增加 GPU 并不会把原有上下文（context）扩展成覆盖整台机器的执行空间。Driver API 暴露上下文管理，Runtime API 则通过主上下文（primary context）减少管理工作。多 GPU 程序需要重新明确这些责任：单独一个指针、流或设备序号都不足以描述资源归属（ownership）。

## 区分五种对象

| 对象 | 本单元中的含义 | 不能据此推断 |
| --- | --- | --- |
| 设备（device） | 用 `cudaGetDeviceCount` 和 `cudaGetDeviceProperties` 查询的可见 CUDA 设备 | 序号不是跨进程、跨可见性设置稳定的物理身份 |
| 上下文 | 设备执行状态及关联资源 | 一个上下文不覆盖全部 GPU |
| 进程（process） | 拥有自身 CUDA 状态的地址空间 | 另一个进程不能解引用传来的设备指针数值 |
| 主机线程（host thread） | 通过 `cudaSetDevice` 选择当前设备 | 一个线程的选择不为所有其他线程分配设备 |
| 所有者 | 应用对创建、使用、完成和销毁承担的责任 | 共享上下文不会自动解决竞态与生命周期错误 |

本单元采用普通 Runtime API 路径，不设置显式 Driver 当前上下文或显式执行上下文：**每个进程的每个设备有一个主上下文**，由该进程内的运行时用户共享。精确的 13.3.1 API 还支持显式执行上下文，本单元不使用它。如果 Driver 上下文已经是当前上下文，运行时与驱动互操作便遵循该上下文。不能把默认路径模型推广成所有 CUDA 接口的统一规则。

每个工作线程在设备专属操作前显式调用并检查 `cudaSetDevice(d)`。分配、内核启动、流创建和事件创建都关联所选设备。线程切换设备不会迁移流。在其他设备所属的流上启动内核会失败。各设备有自己的默认流（default stream），两个默认流之间没有自动的跨设备顺序。`cudaDeviceSynchronize` 等待当前设备，而不是进程内全部 GPU。

## 先写资源归属表

下面是**合成分配方案**，不是机器观察。A、B 是从实际进程可见设备列表解析出的本地别名。

| 资源 | 进程／主机线程 | 设备／上下文 | 最后使用与释放 |
| --- | --- | --- | --- |
| 缓冲区 A、流 A | 进程 0／工作线程 A | A／主上下文 A | 等全部使用者完成，选择 A，再释放 |
| 缓冲区 B、流 B | 进程 0／工作线程 B | B／主上下文 B | 等全部使用者完成，选择 B，再释放 |
| 主机结果缓冲区 | 进程 0／协调线程 | 主机地址空间 | join 工作线程并完成传输后才能复用 |

后续的对等消费者会延长生产者缓冲区的生命周期。分配者不能仅因自己的生产流完成就释放内存。分配归属与临时访问权限必须分开。库不应把 `cudaDeviceReset` 当作常规清理：共享主上下文的其他用户可能仍持有资源。只能在完成后释放组件自己拥有的资源。

## 选择并验证进程模型

1. **单进程、单主机线程：**选择 A、创建 A 的资源并提交工作，再选择 B 并执行同样步骤。分别等待两个设备并检查错误。主机提交是串行的；设备执行可能重叠，但不保证重叠。
2. **单进程、双主机线程：**每个工作线程选择自己的设备并管理资源。主机屏障或 join 只排列主机管理操作；读取结果或释放缓冲区前仍须等待流／设备完成。同一 GPU 的共享主上下文不是主机互斥锁。
3. **双进程：**各自解析可见序号并创建资源。不同可见性设置可能使两个进程都使用本地零号，却对应不同物理 GPU。启动独立程序，不假定已初始化进程的 CUDA 状态能在 fork 后继续使用。消息中的普通指针不是进程间通信（IPC）。显式 CUDA IPC 或其他共享协议需要独立的生命周期与同步合同，不属于本练习。

实现练习先枚举设备，少于两个合格可见设备就停止。在 A、B 上分别分配 257 个 `uint32_t` 元素，产生 `1000*d+i`，其中 d 是显式分配的本地设备序号；拷回主机后与 CPU 公式逐元素精确比较。检查每个 API 返回值、启动错误和完成边界。网格向上取整，使用 `i < 257` 边界保护。先写单线程版本，再改为双线程，两者都必须符合预言机（oracle）。错误设备的流只做纸面诊断，不故意启动。

## 外部环境与证据合同

G01–G03 的运行活动统一采用**原生 Ubuntu 24.04 x86-64 Linux**、CUDA Toolkit **13.3.1**、C++17 和既有 13.3 工具包通道（Toolkit Lane）的主机编译器策略。本练习配置选择兼容的 Linux 驱动 **610.43.02 或更新**；记录精确安装驱动、`nvcc` 与主机编译器版本。这是练习门槛，不是所有 CUDA 13.x 应用的最低驱动。至少需要**两个完整、可见的 NVIDIA GPU**，每个 **CC ≥ 7.5、总内存 ≥ 8 GB、空闲内存 ≥ 256 MiB**。记录各自精确的 `major.minor`，为固定编译器接受的实际目标构建。额外设备要登记，但只让选定的两个参与。此配置不包含 MIG、MPS 或虚拟化执行。

G01 每 GPU 的有效载荷只有 1,028 字节，上下文开销另计。G02 每 GPU 最多使用 4 MiB，另用 4 MiB 锁页主机中转内存。显存和 CC 门槛不能推导对等兼容性。两个方向都要查询；G01 的独立计算不需要对等访问（peer access）。G02 直接路径要求查询与启用成功。直接访问不可用时，正确的中转路径仍然有用。

**执行前**填写完整[环境清单（Environment Manifest）](/start/environment-manifest/)，并增加以下多设备字段：

| 字段组 | 必须记录的内容 |
| --- | --- |
| 身份与构建 | 源码提交／哈希、命令与选项、OS／内核／架构、Toolkit／运行时／驱动、`nvcc` 与主机编译器版本、时间与观察者 |
| 逐设备信息 | 可见 GPU 数量／顺序、私有 UUID 与 PCI bus ID 到公开别名的映射、精确 CC、总／空闲内存、选定设备对、独占／共享使用与计算模式 |
| 归属 | 进程数、每进程线程数、各线程所选设备、上下文模型、可见性映射、分配／流／事件表和销毁顺序 |
| 兼容性 | 有方向的 peer 查询、启用结果与责任方、所选后备路径、PCIe peer 传输前由操作者确认的 IOMMU／ACS 状态 |
| 拓扑与权限 | `nvidia-smi --version`、`nvidia-smi topo -h`、命令／退出状态及采集日期；GPU／NIC／NUMA 关系；设备访问、sysfs 可见性和查询权限；不可得字段保持未知 |
| 方法与证据 | 形状、字节数、预言机、同步方式、若计时则记录预热／重复次数、时钟／功耗／负载、原始产物哈希、审核后派生产物哈希及限制 |

基础正确性任务不需要性能计数器权限。查询权限失败或 IOMMU 状态未知会阻塞相关观察；记录原因，不提升权限或修改机器配置。原始拓扑可能识别机器：原件私有留存，只公开审核后的别名字段。本站没有合格的双 GPU 基准环境（Reference Environment）证据。拟议的运行与拓扑观察全部保持**待硬件验证（Pending Hardware Verification）**；编译与运行互相独立，本学习单元（Learning Unit）的四个证据数组保持为空。

## 练习与复核

先完成[资源归属练习](/multi-gpu/devices-contexts-ownership/exercises/)，再看[独立解答](/multi-gpu/devices-contexts-ownership/solutions/)。[PB-R6-001](/practice/#pb-r6-001) 检查插件的清理权限。满足先修条件后，继续[对等访问](/multi-gpu/peer-access-copies/)或[拓扑](/multi-gpu/topology-paths/)。

## 检索自测

1. `cudaSetDevice` 选择什么，对谁生效？
2. 两个运行时用户何时共享主上下文？
3. 两个进程为什么能都报告本地设备零，却不共享资源？
4. 为什么 join 提交线程不一定意味着 GPU 工作完成？
5. 什么会把生产者分配的生命周期延长到自身流完成之后？
6. 为什么设备 reset 不能作为插件的清理策略？

## 一手来源与权利

复核日期 **2026-09-19**。[SRC-CUDA-094](/sources-and-versions/#src-cuda-094) 记录当前 Context7 查询、精确 Runtime API 13.3.1 上下文规则和归档 13.2 多设备执行指南。解释、表格和练习均为原创 CC BY 4.0。NVIDIA 文档只链接并转述，不重新发布其样例程序、图片或测量结果。
