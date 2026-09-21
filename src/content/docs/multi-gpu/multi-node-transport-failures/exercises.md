---
title: 'G09 练习：选择传输，限定诊断结论'
description: 分析身份脱敏的合成记录，不声称集群已经运行。
pairId: g09-exercises
counterpart: /en/multi-gpu/multi-node-transport-failures/exercises/
factCheckDate: '2026-09-21'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, transport, diagnosis, review]
resourceKind: exercise-set
unitId: G09-EXERCISES
prerequisites: [G09]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL network and failure contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-21' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g09-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-21' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,transport,diagnosis,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G09-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G09 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/multi-node-transport-failures/exercises/" lang="en">Read the English counterpart</a>

## 先修与交付物

精确先修 **[G09]**：[传输与故障证据](/multi-gpu/multi-node-transport-failures/)。复核于 2026-09-21；见 [SRC-CUDA-102](/sources-and-versions/#src-cuda-102)。提交选择账本与诊断／恢复账本，无需 GPU 或网络访问。所有诊断材料（diagnostic fixture）都是**合成**、原创、身份脱敏的教学数据，不是采集的 NCCL 输出。逻辑序号只排列节点内部事件，不是同步时间戳。多节点执行仍待硬件验证（Pending Hardware Verification）。

## 练习一：选择可接受的传输候选项

**目标：** 选择一个 Socket 比较候选项，指出 RDMA 提案还缺少什么。使用虚构材料 **F1**，按 G09 设定双节点，每节点一个进程／rank／完整 GPU。下列值是纸面前提，不是已验证路由。

<div data-diagnostic-fixture="F1" data-provenance="synthetic" data-evidence="none">

```text
fixture=F1 provenance=synthetic evidence=none
node=node-a process=process-a rank=0 local_rank=0 gpu_visible=0
node=node-b process=process-b rank=1 local_rank=0 gpu_visible=0
interface=mgmt0 state=UP peer_route=unknown
interface=data0 state=UP peer_route=declared-bidirectional-ipv4
interface=data1 state=UP peer_route=absent
hca=mlx5_0 port=1 link_layer=unknown provider=unknown
launcher=unselected selected_transport=unknown recorded_result=none
```

</div>

**约束：** 原生 Linux、NCCL 2.31.2；名称是双节点上假设的局部标签。不运行命令、不扩大防火墙规则、不编造启动器版本、不凭 HCA 存在就宣称 RDMA／GPUDirect。保留题设与实测证据的区别。

**验收：** 给出 Socket 候选项的精确接口匹配与地址族，解释为什么不宜用前缀 `data`，以及 `NCCL_IB_HCA` 为什么不能选择 IP 接口。列出至少四项缺失的 RDMA 事实以及启动／权限要求。说明确认实际传输与成功所需的逐 rank 消息及已完成正确性检查。包含文件名／内容脱敏，记录观察保持为空。纸面答案正确不等于可运行场景已获准。

<details><summary>提示一</summary>一个前缀会匹配两个数据接口。UP 不是远端连通结果。</details>
<details><summary>提示二</summary>分开 IP 地址族与 verbs HCA／端口／链路层，再分开请求的网络与证实选择及完成工作的日志。</details>

## 练习二：只诊断记录能够支持的结论

**目标：** 使用虚构材料 **F2** 排列假设优先级，否决“延长 IB 超时，然后复用 rank 0 输出”的建议。标出受支持事实、未知项及下一条观察。

<div data-diagnostic-fixture="F2" data-provenance="synthetic" data-evidence="none">

```text
fixture=F2 provenance=synthetic evidence=none
node=node-a rank=0 seq=1 phase=init state=complete
node=node-a rank=0 seq=2 phase=submit op=all-reduce count=257 dtype=int32
node=node-a rank=0 seq=3 phase=wait state=deadline-reached
node=node-b rank=1 seq=1 phase=init state=complete
node=node-b rank=1 seq=2 phase=producer state=cuda-error
node=node-b rank=1 seq=3 phase=process state=exited
node=node-b rank=1 collective_submit=missing
selected_transport=unknown clocks=uncorrelated termination=unconfirmed
recovery=unattempted recorded_result=none
```

</div>

**约束：** CUDA 错误没有给出数值代码或原因。没有网络选择日志、rank 1 提交记录、输出检查或全节点终止回执。不能推断特定 GPU 缺陷、交换机故障、全局时间戳顺序或恢复成功。不故意执行错误的分布式时序。

**验收：** 说明为何应优先调查进程／应用失败，再考虑传输调参；同时指出缺少提交证据本身不能证明未发生调用。索取生产者即时错误、启动器退出原因、逐 rank 操作／传输账本及 Q07 本地时间线。区分 socket 重试休眠、verbs 超时、应用期限与作业期限；由默认值推导 59,500 ms，但不能把它当执行时长。为恢复尝试规定全节点终止、新作业／通信器／输入、每 rank 判据检查与清理回执。执行前落实 G09 未来准入账本，并给出保留 rank／阶段关系的公开脱敏清单。

<details><summary>提示一</summary>哪条节点内链路在进程退出前报告了失败？该节点缺少什么证据？</details>
<details><summary>提示二</summary>期限限制等待，不能确认原因、输出有效性或远端终止。新尝试需要自己的环境清单和结果账本。</details>

## 单独核对

完成两份账本后，再对照[参考解答](/multi-gpu/multi-node-transport-failures/solutions/)。继续练习 [PB-R6-012](/practice/#pb-r6-012) 与 [PB-R6-013](/practice/#pb-r6-013)。静态材料检查仅确认教学一致性，不授予编译或运行证据状态（Evidence Status）。
