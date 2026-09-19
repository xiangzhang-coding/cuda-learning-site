---
title: 'G03：读懂拓扑，再预测通信'
description: 将观察到的 PCIe、NVLink 与 NIC 关系转为有边界的假设，不编造路径或带宽。
pairId: g03
counterpart: /en/multi-gpu/topology-paths/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, acquisition, interpretation, prediction, sanitization, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G03
prerequisites: [G01, O03]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 55
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVIDIA System Management Interface', url: 'https://docs.nvidia.com/deploy/nvidia-smi/index.html', version: 'rolling documentation reviewed 2026-09-19; installed CLI version required', platform: 'native Linux', accessDate: '2026-09-19' }
  - { title: 'CUDA multi-GPU systems', url: 'https://docs.nvidia.com/cuda/archive/13.2.0/cuda-programming-guide/03-advanced/multi-gpu-systems.html', version: '13.2.0', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g03 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/topology-paths/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,acquisition,interpretation,prediction,sanitization,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G03 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G01,O03' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'rolling documentation reviewed 2026-09-19; installed CLI version required,13.2.0' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/topology-paths/" lang="en">Read the English counterpart</a>

## 学习目标

在获准使用的真实 Linux 主机上采集拓扑（topology），对齐设备身份，阅读工具自身的图例，区分连接假设与实测通信路径。建议 55 分钟，另加外部观察时间。纸面分析不需要 GPU；本站的真实观察仍为待硬件验证（Pending Hardware Verification）。

## 精确先修条件

**[G01, O03]**：[设备与归属](/multi-gpu/devices-contexts-ownership/)和[读懂环境清单（Environment Manifest）](/start/environment-manifest/)。本单元不要求 G02 或集合通信库。单独采集的 CUDA peer 查询属于额外证据，不是阅读拓扑矩阵的先修条件。

## 为什么设备列表不等于拓扑

增加 GPU 会增加可能的通信边，却不一定增加每条边的容量。PCIe 层级共享交换机和主机桥；非一致内存访问（NUMA）位置会影响主机中转；存在 NVLink 时，它提供另一种互联。网络接口卡（NIC）增加了通向主机外部的本地连接点。GPU 数量或产品名称不能识别这些路径。工具展示的是关系，工作负载究竟走了哪条路径仍需测量确认。

## 先采集真实观察，再画连接图

采用完整的 [G01 环境与清单合同](/multi-gpu/devices-contexts-ownership/#外部环境与证据合同)：原生 Ubuntu 24.04 x86-64 Linux、Toolkit 13.3.1、所选驱动 ≥610.43.02、至少两个完整可见 GPU，各自精确 CC≥7.5、总内存 ≥8 GB、空闲 ≥256 MiB。即使只读命令不分配练习载荷，也要记录精确安装版本。采集器使用单进程；被观察工作负载的进程模型另外记录。本活动不发送网络流量。

在该主机运行以下只读命令，私有保留命令、退出状态、stderr、采集日期、精确的 `nvidia-smi --version` 和帮助／图例。官方手册是于 2026-09-19 复核的滚动文档，**不代表**每个驱动都实现所有选项。

```sh
nvidia-smi --version
nvidia-smi topo -h
nvidia-smi -L
nvidia-smi topo -m
nvidia-smi topo -mp
nvidia-smi topo -p2p r
nvidia-smi topo -p2p w
nvidia-smi nvlink -h
nvidia-smi nvlink --status
```

先检查本地帮助；不支持的命令或权限失败保持不可用／未知，不能变成空连接或零带宽。`-L` 含 UUID，不能用作公开夹具。通过私有留存的 UUID／PCI bus ID 映射对齐 CUDA 序号和 NVML／工具序号。`CUDA_VISIBLE_DEVICES` 可以重排 CUDA 序号，不能只按 `GPU0` 连接两份清单。

记录 GPU 设备访问、sysfs 可见性及查询权限。部分拓扑／NIC 检查依赖 OS／驱动权限；必要时请操作者提供只读记录。本任务不包含提升 root 权限、修改时钟、GPU reset 或性能计数器权限。IOMMU／ACS 状态写成已知或未知；读到矩阵不等于可以运行 peer 传输。

## 阅读图例及其边界

下表是对已复核官方图例的原创转述，不是采集到的拓扑矩阵。解释实际记录时，以安装工具自己的图例为准。

| 标签 | 描述的关系 | 边界 |
| --- | --- | --- |
| X | 自身 | 不是通信吞吐值 |
| PIX | 已复核 `topo -m` 图例中经过单个交换机的 PCIe 连接 | 不保证 CUDA peer 访问 |
| PXB | 经过多个 PCIe 交换机，不跨主机桥 | 交换机上行链路可能共享 |
| PHB | PCIe 加主机桥，通常是 CPU | 不证明实际经过 CPU 中转 |
| NODE | 同一 NUMA 节点内跨主机桥 | 不是应用网络路由 |
| SYS | PCIe 加 NUMA 节点间互联 | 不等于主机外网络 |
| NV# | 由指定数量 NVLink 组成的连接 | 数量不是代际、有效载荷速率或实测带宽 |

`topo -m` 包含 NVLink 关系及 GPU／NIC 亲和性；`topo -mp` 排除 NVLink，显示纯 PCI 关系。同一设备对出现不同标签不一定矛盾。CPU／内存亲和性支持位置假设，却不证明线程已绑定。`topo -p2p r/w` 分别报告读／写能力；不能用图例替代应用 CUDA 查询与启用。NVLink status 可以描述链路状态，却不表明某次拷贝使用了它。

NIC 存在不保证远程直接内存访问（RDMA）可用；手册说明，绑定的 NIC 即使没有 RDMA 能力也可能被列出。本地 GPU–NIC 关系只到本地连接点。要声称网络路径，还需另行获得经授权的接口／端口、路由或网络结构证据、远端端点、传输选择及传输日志，并记录版本和权限。这些观察及多节点执行超出本双 GPU 活动范围。远端路径写成未知，不能由本地邻近关系编出路由。

## 只做证据允许的预测

若 S 字节经过已知瓶颈，且有效载荷容量 B 已由**独立证据建立**，理想化下界为 `time ≥ S/B`；这不是实测时间，也不是延迟上界。串行主机中转需要设备→主机和主机→设备两个区间及额外开销。争用、消息大小、设置、同步、NUMA 位置和协议效率都可能改变实际吞吐。单独的 NV# 标签不能提供数值 B。

合格工作表应包含**观察／假设／缺失证据／证伪测试**。例如，*若真实记录显示*共享交换机上行链路，可以假设同时传输会产生争用，再用固定字节数和相同完成定义比较单独与并发传输。不要填写猜测速率。尚未完成 G02 时，提交测量设计，不实现其中的 peer 操作。查询被拒绝只能得到“未知”，不能据此排名慢路径。产品名称不能补全缺失边。

## 保持拓扑夹具精简且不暴露身份

公开教学夹具仅包含固定别名 `GPU-A`、`GPU-B`、`NIC-A`，白名单关系标签及明确来源。**合成**夹具只教解释方法，不能称为“脱敏观察”。不要把整份真实 `nvidia-smi` 报告粘贴到源码、测试或 issue 评论。私有原件可能含 UUID、序列号、主机名、PCI 地址、网络地址、路径及账号数据。

原创纯主机校验器 `scripts/lib/topology-fixture-policy.mjs` 接受小型、已审核的别名结构，拒绝额外键及非法边，保留未知状态，并构建新的白名单对象。它不解析原始工具文本，也不建立运行验证。合成案例位于其单元测试中。公开真实派生产物前，先私有记录精确来源／命令／版本、原件哈希、别名映射、派生产物哈希、审核者和删除策略；允许保留的关系也需审核，因为拓扑本身可能识别主机。派生产物的 `reviewed-observation` 只描述来源，**不会授予**社区已观察（Community-Observed）或运行已验证（Runtime-Verified）状态。证据审核仍需完整环境清单（Environment Manifest）与日志。

## 练习与复核

用[拓扑练习](/multi-gpu/topology-paths/exercises/)制作空白采集表并审核合成别名图，再看[独立解答](/multi-gpu/topology-paths/solutions/)。[PB-R6-003](/practice/#pb-r6-003) 挑战由本地邻近关系推导网络路由的说法。本页不提供真实拓扑、带宽、路由或计时结果。

## 检索自测

1. 为什么 CUDA 设备零可能不同于 `nvidia-smi` 的 GPU0？
2. 为什么 `topo -m` 与 `topo -mp` 可以合理地不同？
3. NV# 缺少哪些数值带宽预测所需信息？
4. 为什么 SYS 不表示主机外网络跳转？
5. 需要什么额外证据才能由 NIC 邻近关系声称网络路径？
6. 合成夹具、审核后的派生产物和合格运行证据有何区别？

## 一手来源与权利

复核日期 **2026-09-19**。[SRC-CUDA-096](/sources-and-versions/#src-cuda-096) 记录 NVIDIA 滚动 CLI 手册及归档 CUDA 13.2 拓扑约束。当前 Context7 多 GPU 查询已与这些一手来源交叉检查。官方手册仍受 NVIDIA 自身条款约束；这里只转述事实并链接，不复制其表格或真实机器输出。原创讲解采用 CC BY 4.0；纯主机校验器／测试采用 Apache-2.0。
