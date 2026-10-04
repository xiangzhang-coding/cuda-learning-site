---
title: 'W04：NCCL 设备端与 fabric 新功能'
description: 分清通信发起、传输要求与跨版本兼容性。
pairId: w04
counterpart: /en/watch/nccl-device-fabric/
factCheckDate: '2026-10-04'
license: CC-BY-4.0
provenance: original
structure: [motivation, prerequisites, status, gates, limitations, check, sources]
resourceKind: emerging-feature-watch
unitId: W04
prerequisites: [G03, G08, G09]
hardwareGate: none
toolkitLanes: []
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL device-initiated communication', url: 'https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/deviceapi.html', version: '2.32.3', platform: 'Native Linux; source review', accessDate: '2026-10-04' }
  - { title: 'NCCL Compute Fabric Transport', url: 'https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/cft.html', version: '2.32.3', platform: 'Blackwell fabric; source review', accessDate: '2026-10-04' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: w04 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-10-04' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'motivation,prerequisites,status,gates,limitations,check,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: emerging-feature-watch } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: W04 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G03,G08,G09' } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/watch/nccl-device-fabric/" lang="en">Read the English counterpart</a>

## 动机

宿主入队的集合通信（Collective Communication）与用户内核内部发起的通信，对程序提出不同要求。计算通信融合可能改变同步与资源所有权，但不会消除完成条件或 rank 参与要求。

## 稳定前置知识

[G03：拓扑路径](/multi-gpu/topology-paths/)、[G08：图捕获与缓冲区](/multi-gpu/nccl-graph-capture/)和 [G09：多节点故障](/multi-gpu/multi-node-transport-failures/)提供稳定的比较基础。它们的 NCCL 配置不会继承本条目的较新版本。

## 当前接口状态

本次核对 **NCCL 2.32.3** 指南。设备 API 从 **2.28** 引入，GPU 发起网络通信（GPU-Initiated Networking，GIN）从 **2.28.7** 引入，计算 fabric 传输（Compute Fabric Transport，CFT）从 **2.31** 引入。这些是新引入或持续变化的接口，不代表所有 NCCL API 都是预览。LSA 使用可通过加载/存储访问的对端；multimem 使用硬件多播；GIN 跨网络路径；CFT 面向 CUDA fabric 逻辑端点。宿主 `ncclAllReduce` 成功不能验证这些自定义内核路径。

## 软件与硬件门槛

设备通信使用对称内存窗口（Symmetric Memory Window）与 GPU 虚拟内存管理。LSA 要求真实的 CUDA P2P 连通性，multimem 还要求支持 NVLink SHARP 的硬件。GIN 要求 **CUDA 12.2+ 编译 GPU 代码**、Volta 或更新设备、**>=510.40.3 驱动**，以及后端特定的 NIC/RDMA 支持。CPU Proxy 与 GDAKI 后端的软件门槛不同：例如 GDAKI 要求 CX4+、rdma-core >=44.0，并根据部署方式满足 Linux 内核、DMA-BUF 或 nvidia-peermem/OFED/DOCA 条件。这些上游最低要求不会扩展本站基础 GPU 能力层级（Baseline GPU Capability Tier）。

本版指南中 CFT 要求 **CUDA 13.3+**、**Blackwell 或更新设备**、**>=610.43.02 驱动**，以及可用的 fabric 逻辑端点配置。仅有“两张 Blackwell GPU”不能证明满足 fabric 支持。外部原生 Linux 探测前应完整核对后端要求；阅读本页不需要 GPU。

## 限制与兼容性

设备代码与宿主初始化必须针对相同 NCCL 版本编译。编译时版本通常不能高于运行时 `libnccl.so`。指南说明从 2.29 起宿主结构带版本，并描述 LSA/multimem 的向后兼容；但 **NCCL 升级后 GIN 内核需要重新编译**。不能把宿主 ABI 假设套给 GIN，也不能虚构 CFT 兼容保证。窗口生命周期、通信器资源、同步与销毁仍须显式管理。NCCL v2.32.3-1 使用 Apache-2.0 并保留 BSD 和逐文件条款，CUDA 和网络依赖保留单独条款。本页不复制维护方内核或网络结果。[晋升](/watch/#晋升需要单独决策)和运行验证仍是独立步骤，本页没有证据声明。

## 回忆检查

图捕获成功且存在 NVLink 连接，能否证明升级库后 GIN 内核仍然可用？不能：图捕获、P2P、GIN 后端准入和 GIN 二进制兼容是不同门槛。

## 维护方来源

访问日期 **2026-10-04**：[2.32.3 设备 API 指南与兼容规则](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/deviceapi.html)、[CFT 要求与初始化](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/usage/cft.html)、[v2.32.3-1 发布说明](https://github.com/NVIDIA/nccl/releases/tag/v2.32.3-1)、[带版本 NCCL 许可](https://github.com/NVIDIA/nccl/blob/v2.32.3-1/LICENSE.txt)。该版本新增 CFT 计数操作和 socket GIN；socket GIN 当前需要显式启用 GDRCopy。上文 NIC 门槛描述 RDMA 后端，不是所有 GIN 后端。上游要求和示例不构成基准环境（Reference Environment）运行记录。[观察区索引](/watch/)。
