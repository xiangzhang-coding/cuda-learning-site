---
title: 'G03 解答：缺失路径保持未知'
description: 复核拓扑解释、夹具来源及有边界的网络预测。
pairId: g03-solutions
counterpart: /en/multi-gpu/topology-paths/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-bank-review, retrieval]
resourceKind: solution-set
unitId: G03-SOLUTIONS
prerequisites: [G03-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVIDIA System Management Interface', url: 'https://docs.nvidia.com/deploy/nvidia-smi/index.html', version: 'rolling documentation reviewed 2026-09-19; installed CLI version required', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g03-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/topology-paths/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-bank-review,retrieval' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G03-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'rolling documentation reviewed 2026-09-19; installed CLI version required' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/topology-paths/solutions/" lang="en">Read the English counterpart</a>

## 先完成练习

精确先修 **[G03-EXERCISES]**：[拓扑练习](/multi-gpu/topology-paths/exercises/)。原创解答于 2026-09-19 根据 [SRC-CUDA-096](/sources-and-versions/#src-cuda-096) 复核，不含机器拓扑采集或通信测量结果。

## 解答一：保留观察边界

合格工作表记录命令、已安装工具版本、帮助／图例、日期、权限及退出状态，并私有关联身份与环境清单（Environment Manifest）。解释设备对标签前先对齐两份清单。纯 PCI 视图可以显示 PCIe 路径，而另一视图显示 NVLink；两者回答的问题不同。任一查询失败时保留失败，不用猜测标签替换。

对于真实观察到的共享 PCIe 资源，可以设计固定大小的独立／并发传输争用测试，采用相同完成定义，并记录 CPU／内存位置。没有测量或独立文档建立有效载荷容量 B，就不能作数值 `S/B` 估计。即使 B 已知，这个下界仍排除开销与争用，不能预测精确时间或实测带宽。没有 NIC 时 GPU–NIC 行标为不可用，不编造。没有硬件就交空白工作表并保持待硬件验证（Pending Hardware Verification）；这是诚实提交，不是纸面练习失败。

## 解答二：小型结构与明确来源

合成案例只保留别名、纯 PCI 的 PIX 边、未知的双向 peer 值及未知网络路径。额外的主机名、带宽和运行状态键被拒绝，不能删掉部分后继续透传。无向重复边及反向重复都非法；纯 PCI 记录不能声称 NVLink。输出重新构建，修改它不能改变输入。诊断固定，不包含被拒绝的值。

真实派生产物需要私有审核链，关联原始字节、精确来源／命令／版本、别名映射、派生字节及审核者。公开校验器检查已批准结构与来源版本格式，不检查该链是否真实，也不能证明有人审核过。`reviewed-observation` 仅声明来源。运行证据仍须独立审核环境清单与日志。虚构图保持 synthetic，可防止测试冒充硬件观察。常见错误是公开残留原始文本，以及把未知 peer 能力当作 false。

## 练习题库复核

[PB-R6-003](/practice/#pb-r6-003) 只提供合成本地 GPU–NIC 邻近标签。它不能建立 RDMA 能力、远端端点、所选接口、传输方式、网络路由或带宽。可信报告保留位置假设，并列出这些缺失观察。查询被拒绝仍是未知。拒绝这种无依据推断不需要集合通信库知识，也不应编造替代路径。

## 自测答案

可见性设置可能使 CUDA 序号相对工具清单重排。`-mp` 排除 NVLink，`-m` 可以包含它。NV# 不包含链路代际、协商状态、有效载荷效率、争用与实际使用。SYS 描述主机内 NUMA 间连接，不是主机外跳转。网络路径需要端点／接口／传输方式以及路由或网络结构证据。合成夹具是虚构的，审核后派生产物声明来源，合格证据还需要完整清单及按所声明证据策略复现的日志。
