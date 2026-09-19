---
title: 'G03 练习：限定拓扑结论'
description: 采集带版本的拓扑工作表，拒绝暴露身份或误导读者的夹具。
pairId: g03-exercises
counterpart: /en/multi-gpu/topology-paths/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: G03-EXERCISES
prerequisites: [G03]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NVIDIA System Management Interface', url: 'https://docs.nvidia.com/deploy/nvidia-smi/index.html', version: 'rolling documentation reviewed 2026-09-19; installed CLI version required', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/topology-paths/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G03 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'rolling documentation reviewed 2026-09-19; installed CLI version required' } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/topology-paths/exercises/" lang="en">Read the English counterpart</a>

## 先修条件与说明

精确先修 **[G03]**：[拓扑路径](/multi-gpu/topology-paths/)。复核于 2026-09-19；[SRC-CUDA-096](/sources-and-versions/#src-cuda-096)。纸面任务无硬件要求。真实采集须满足 G03 原生 Linux／双 GPU 配置，记录逐设备精确 CC、内存、驱动／Toolkit／CLI 版本、进程模型、已知或未知的 peer 兼容性、拓扑来源、权限及完整环境清单（Environment Manifest）。缺乏合格证据时，真实观察保持待硬件验证（Pending Hardware Verification）。

## 练习一：制作采集与预测工作表

**目标：**采集获准使用的 `topo -m` 和 `topo -mp` 记录，解释一个 GPU–GPU 关系；若有 NIC，再解释一个 GPU–NIC 关系。没有硬件时提交空白工作表并明确阻塞。

**约束：**私有保存命令／帮助／版本／退出状态，通过私有稳定身份对齐 CUDA 和工具序号。阅读精确图例。包含观察、假设、缺失证据和证伪测试四列。不能根据产品名称补出不存在的 NIC、NVLink 或远端路径。不运行网络或集合通信工作负载。

**验收：**区分纯 PCI 与含 NVLink 的视图，将权限／选项不支持保持为未知；没有独立证据时数值带宽留空。说明 `S/B` 为什么至多是在 B 已知时的理想化下界模型。为拟议比较记录主机位置、共享链路及流量大小假设。不要求或虚构测量时间。

<details><summary>提示一：先识别，再比较</summary>重排后的 CUDA 序号与工具序号可能指不同设备。判断两份视图矛盾前先对齐身份。</details>
<details><summary>提示二：本地边止于本地</summary>GPU–NIC 邻近性不能识别远端端点、传输方式或网络路由。</details>

## 练习二：审核合成夹具

**目标：**验证一个虚构图，别名为 GPU-A、GPU-B、NIC-A。GPU 对在纯 PCI 视图中的关系为 PIX，两个方向的 peer 能力及网络路径均未知。某个修改提案添加自由文本主机名，并由 PIX 声称实测带宽。

**约束：**使用纯主机 `scripts/lib/topology-fixture-policy.mjs` 合同。来源保持 `synthetic`，命令身份为 `topo-mp`，来源版本为 `synthetic`，没有证据的字段保持未知。测试中不放真实机器标识。测试额外键、错误标签、重复／反向边，以及添加性能或运行状态字段的尝试。

**验收：**合法别名数据生成新的等值对象；身份字段及不受支持的结论被拒绝，固定诊断不回显输入。未知不能变成 false 或后备路径。合成图不能标成 reviewed-observation。说明真实派生产物还需要哪些私有来源／派生哈希、别名映射和人工审核记录。

<details><summary>提示一：建立白名单</summary>从任意文本里删除已知秘密模式，不如直接拒绝任意文本。</details>
<details><summary>提示二：来源不是验证</summary>小型合法结构仍可能描述虚构机器。运行状态属于独立证据审核。</details>

## 单独复核

完成两个尝试后阅读[解答](/multi-gpu/topology-paths/solutions/)，再审核 [PB-R6-003](/practice/#pb-r6-003)。
