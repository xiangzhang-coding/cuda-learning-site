---
title: 'G09 解答：保留未知项与重启证据'
description: 带有明确证据边界的传输与故障账本解答。
pairId: g09-solutions
counterpart: /en/multi-gpu/multi-node-transport-failures/solutions/
factCheckDate: '2026-09-21'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, transport, diagnosis, transfer]
resourceKind: solution-set
unitId: G09-SOLUTIONS
prerequisites: [G09-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL network and failure contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-21' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g09-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-21' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,transport,diagnosis,transfer' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G09-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/multi-node-transport-failures/solutions/" lang="en">Read the English counterpart</a>

## 先修与范围

精确先修 **[G09-EXERCISES]**：先完成[两份静态账本](/multi-gpu/multi-node-transport-failures/exercises/)。[G09](/multi-gpu/multi-node-transport-failures/) 和 [SRC-CUDA-102](/sources-and-versions/#src-cuda-102) 提供契约，复核于 2026-09-21。以下是合成材料的推论，不是实测操作。多节点行为仍待硬件验证（Pending Hardware Verification）。

## 解答一：候选项不等于实际所选传输

在 F1 题设内，建议为独立准入的比较使用 `NCCL_SOCKET_IFNAME='=data0'`、`NCCL_SOCKET_FAMILY=AF_INET`、`NCCL_NET=Socket`。前缀 `data` 包含题设中没有路由的 `data1`；`mgmt0` 的 UP 状态不能说明对端路由。HCA 过滤针对 verbs 设备，不是 IP 接口。这些建议值均不能提供实际端点可达证据或启动器。

RDMA 需要双节点的 HCA／端口与链路层身份、活动状态、固件／provider 版本、获准的 rail／交换机图、GPU–NIC 连接、内存注册限制及 GPU 内存路径能力。固定实际启动器，证明 rank 放置、环境传播、库可见性、权限及全节点终止。在这些事实齐全前不要复制 MPI 命令。每个 rank 的引导与网络选择日志，加上应用阶段记录，才能区分请求值与所选传输。完成后每个 rank 的每个元素都要检查通过，清理和作业状态也必须成功；仅选择网络不够。

公开材料保留稳定的节点／rank 别名、所选网络类别及版本事实。删除凭证，在路径、文件名和内容中一致替换身份，原始值到别名的映射私有保留。明确列出已脱敏字段类别和缺失日志。F1 没有实际结果；分析通过不授予运行状态。

## 解答二：先诊断生产者，再调未知的网络

F2 给出 node-b 的局部链路：初始化 → 生产者 CUDA 错误 → 进程退出，集合提交记录缺失。node-a 提交后到达期限。先调查生产者即时错误及更早 CUDA 操作、启动器 stderr／退出原因和操作账本。CUDA 错误可能暴露更早的异步工作，不能据此认定某块 GPU 损坏。日志缺失不证明集合未提交。未关联时钟不能建立跨节点全序。传输选择未知，因此材料不支持调整 IB 超时。

Socket 默认休眠总和为 `100*(1+2+...+34) = 59,500 ms`；实际尝试及其他阶段另计。Verbs 确认采用 `4.096 µs * 2^20 ≈ 4.295 s`，并有自己的重试策略。应用期限限制进度监控；监督器整作业期限覆盖卡住的初始化／清理和远端 rank。任何一种期限都不能证明根因或输出有效性。

新尝试前，停止提交、保留原始证据、带外协调失败，并请求幸存 rank 安全中止。非阻塞通信器处理必须遵守进行中状态，abort 期间不能并发调用 NCCL，同时保留整作业终止后备机制。取得每节点终止回执、运维人员批准的修复与变量变更账本。分配新作业、通信器／ID 和已知输入，不复用 rank 0 不确定的接收缓冲区。落实完整 G09 环境清单（Environment Manifest），再验证每个 rank 和清理。缺少任何回执或检查，应记为未完成／失败尝试，而非恢复。

G09 建议的 R=2、N=257 判据为 `9+2*((i mod 17)-8)`。以下是算术检查，不是 GPU 结果；未来运行仍须验证全部 257 个位置。

| i | Rank 0 输入 | Rank 1 输入 | 两个 rank 的期望和 |
| --- | --- | --- | --- |
| 0 | -5 | -2 | -7 |
| 16 | 11 | 14 | 25 |
| 256 | -4 | -1 | -5 |

只发布经过复核、一致别名化的 rank／阶段记录，附版本、尝试身份和明确的证据缺口。检查正文与附件中的主机名／地址／UUID、路径和文件名、作业／通信器身份、token 及环境转储。脱敏不能把两个节点合成一个别名，也不能删去失败却保留其后的超时。

## 迁移推理

在 [PB-R6-012](/practice/#pb-r6-012) 中，引导连通与数据传输是不同主张。在 [PB-R6-013](/practice/#pb-r6-013) 中，本地启动器退出与全节点终止是不同主张。回到 [G09](/multi-gpu/multi-node-transport-failures/)，继续分开预期行为、合成前提和记录观察。扩展性、拓扑、传输、挂起诊断与恢复结果均未实测。
