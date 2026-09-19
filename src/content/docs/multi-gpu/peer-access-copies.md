---
title: 'G02：查询对等访问并排列跨设备拷贝'
description: 区分能力、启用、数据移动和完成，并提供明确的主机中转后备路径。
pairId: g02
counterpart: /en/multi-gpu/peer-access-copies/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, capability, ordering, fallback, gates, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G02
prerequisites: [G01, M01, M08]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 60
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA peer access API', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/group__CUDART__PEER.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
  - { title: 'CUDA multi-GPU systems', url: 'https://docs.nvidia.com/cuda/archive/13.2.0/cuda-programming-guide/03-advanced/multi-gpu-systems.html', version: '13.2.0', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g02 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/peer-access-copies/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,capability,ordering,fallback,gates,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G02 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G01,M01,M08' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1,13.2.0' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/peer-access-copies/" lang="en">Read the English counterpart</a>

## 学习目标

建立决策表，区分查询成功、访问启用成功、有序拷贝和结果正确。实现有意采用保守同步的主机中转后备路径。建议 60 分钟，另加实现时间；阅读没有硬件门槛。

## 精确先修条件

**[G01, M01, M08]**：[设备归属](/multi-gpu/devices-contexts-ownership/)、[地址空间](/memory/address-spaces/)与[事件依赖和计时](/memory/event-dependencies-timing/)。实现使用一个进程、一个提交主机线程和两个 GPU，不需要 NCCL 知识。

## 为什么指针不等于对等访问

没有直接对等传输时，数据可以经过主机内存中转。对等访问（peer access）使合适的设备能访问另一个设备的分配，并让拷贝绕过主机中转。统一虚拟寻址（unified virtual addressing）简化指针识别，但既不授予访问权限，也不为生产者同步。物理连接、CUDA 权限和应用顺序是三个不同问题。

## 先查询方向，再有意启用

对不同设备 A、B，调用并检查 `cudaDeviceCanAccessPeer(&canAB, A, B)` 与 `cudaDeviceCanAccessPeer(&canBA, B, A)`。成功返回零表示**已知不可用**，调用失败表示**未知／错误**，不能写成零。A→B 表示 A 上的内核可以访问 B 分配的内存，并不代表每个拷贝 API 的载荷移动方向。

要启用 B→A，先选择 B，再调用 `cudaDeviceEnablePeerAccess(A, 0)`，flags 必须为零。权限是单向的，不会同时启用 A→B。本练习的保守直接拷贝分支要求两个查询值都为一，且两个方向都成功启用；这是练习策略，不是所有单向 peer 操作的普遍要求。这里使用普通 `cudaMalloc` 分配，内存池的访问权限属于另一合同。

| 状态 | 操作 |
| --- | --- |
| 查询成功，任一方向能力为零 | 记录不可用；采用显式主机中转 |
| 查询成功，两个值均为一 | 尝试双向启用，分别记录结果 |
| `cudaErrorPeerAccessAlreadyEnabled` | 在自有应用中记录已有状态；不声称是自己启用，也不撤销其他组件的权限 |
| 查询／启用／启动／完成出现其他错误 | 停止本轮并保留错误；不能把受损上下文悄悄改记成后备成功 |
| 有意强制中转模式 | 跳过 peer 启用，即使设备兼容也用相同预言机测试中转 |

启用不会传输数据，也不能证明远端内存的原子操作能力；它还可能增加分配的映射开销。连接上限依系统配置而异；归档指南为非 NVSwitch 系统规定每设备八个 peer 连接。不能把双设备单元推广成全互联启用策略。

## 画出生产—拷贝—消费链

使用 A 上的显式非阻塞流（nonblocking stream）sA 和 B 上的 sB，依赖事件关闭计时。下表是**操作顺序表**，不是可运行程序或实测轨迹。学习者实现必须检查全部调用、启动与完成错误。

| 步骤 | 所选设备 | 操作与理由 |
| --- | --- | --- |
| 1 | A | 生产者在 sA 写源缓冲区；随后在 sA 记录 readyA |
| 2 | B | 主机已提交该记录后，入队 `cudaStreamWaitEvent(sB, readyA, 0)` |
| 3 | B | 入队 `cudaMemcpyPeerAsync(dstB, B, srcA, A, bytes, sB)` |
| 4 | B | 在 sB 入队消费者；之后在 sB 记录 doneB |
| 5 | 主机 | 同步 doneB，检查完成，再拷回并逐元素精确比较 |
| 6 | 依次 A、B | 所有使用者完成后，释放自己的分配并销毁事件／流；只撤销本轮启用的权限 |

事件只能记录在自身设备所属的流中；流可以等待其他设备的事件，主机事件同步／查询也可以面向其他设备。必须先提交 readyA 的**记录**再提交等待：从未记录的事件不代表未来生产者。重录事件需要逐迭代分析生命周期；本练习一次只处理一个依赖周期。

`cudaEventElapsedTime` 不能相减不同设备的事件。本地工作使用同设备时间区间，端到端耗时使用主机单调时钟，并明确终点在两个设备完成之后。等待 doneB 排列了上表中的链，但其他无关工作仍须独立等待。`Async` 后缀不保证重叠。隐式 NULL 流的 peer 拷贝对两个设备都有更广的排序效果，可能掩盖显式依赖缺失并扭曲并发比较。

源数据在拷贝完成前不得修改；目标分配必须存活到所有消费者完成。不需要自旋标志或远端原子协议。peer 能力本身不能授权系统作用域（system-scope）原子操作。

## 让后备路径明显正确

用带 `cudaHostAllocPortable` 的 `cudaHostAlloc` 分配足够容纳载荷的锁页主机缓冲区。生产者之后，在 sA 用 `cudaMemcpyAsync` 排入 A→主机，并且**同步 sA**，然后才在 sB 提交主机→B。上传后在 sB 排入 B 消费者；读取结果、复用或释放中转区前同步 sB。这次主机等待是有意保守的：两个设备流不会自动排列它们对同一主机缓冲区的使用。

中转保持本地资源归属，但需要两次传输。明确记录为 `host-staged`，不能因 API 返回成功就把运行时不透明的实际路径称为“NVLink”。在 peer 兼容硬件上也要测试强制中转。分配或设备访问失败时记录阻塞，而不是假装后备已经运行。

## 工作负载、门槛与证据

采用完整的 [G01 环境合同](/multi-gpu/devices-contexts-ownership/#外部环境与证据合同)：原生 Linux、Toolkit 13.3.1、所选驱动 ≥610.43.02、两个完整 GPU，各自 CC≥7.5、总内存 ≥8 GB、空闲 ≥256 MiB；记录逐设备精确 CC／编译目标及完整[环境清单（Environment Manifest）](/start/environment-manifest/)。固定为单进程／单提交线程。分别记录双向查询值与 API 状态、启用责任、流／事件设备、私有拓扑来源和权限。

裸机 Linux 上进行任何 **PCIe peer 传输**前，必须由操作者确认 IOMMU／ACS 配置。所选归档指南不支持开启 IOMMU 的裸机 PCIe P2P，并提醒存在数据损坏风险；虚拟机直通是另一合同。状态未知或不兼容时，**不能运行直接分支**。采用独立本地拷贝／中转，并让机器操作者评估配置。本单元不要求关闭机器的 IOMMU 或 ACS。CC 兼容或 peer 查询成功都不能替代此平台检查。

对 `N = 1, 257, 1048576`，A 产生 `uint32_t` 的 `i mod 251`，B 在拷贝后加一。与 CPU 独立计算的 `(i mod 251)+1` 逐元素比较。每 GPU 最大载荷 **4 MiB**，可移植锁页中转区 **4 MiB**；主机预言机／输出数组及上下文开销另计。交换 A／B 角色再执行，并测试强制中转。预期验收为零失配、保留分支／错误记录、释放前完成；这些是标准，不是已观察输出。错误发生后停止，不进入计时。没有合格证据时，直接与中转 GPU 活动均保持**待硬件验证（Pending Hardware Verification）**，不声称编译已检查（Compile-Checked）或性能结果。

## 练习与复核

先做[对等访问练习](/multi-gpu/peer-access-copies/exercises/)，再看[独立解答](/multi-gpu/peer-access-copies/solutions/)。[PB-R6-002](/practice/#pb-r6-002) 检查 peer 能力有效时仍然存在的过早释放错误。

## 检索自测

1. `cudaDeviceCanAccessPeer(A,B)` 中的方向描述什么？
2. 查询失败与成功返回零为什么不同？
3. 哪个调用授予访问、哪个移动字节、哪个排列消费者？
4. 为什么必须先提交 readyA 的记录，再提交等待？
5. 为什么 B 可以等待 A 的事件，却不能用它与 B 的事件计算耗时？
6. 什么防止主机中转区过早复用？

## 一手来源与权利

复核日期 **2026-09-19**。[SRC-CUDA-095](/sources-and-versions/#src-cuda-095) 覆盖精确 13.3.1 peer API 与归档 13.2 多设备顺序／IOMMU 合同，并经当前 Context7 查询刷新。全部操作表、负载公式与练习均为原创 CC BY 4.0；NVIDIA 文档只链接并转述，不导入样例实现或实测吞吐量。
