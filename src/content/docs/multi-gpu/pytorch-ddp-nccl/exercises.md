---
title: 'G07 练习：所有权、梯度与最早失败'
description: 证明 rank 所有权和梯度缩放，再诊断合成失败，不编造运行。
pairId: g07-exercises
counterpart: /en/multi-gpu/pytorch-ddp-nccl/exercises/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, ownership, correctness, diagnosis, review]
resourceKind: exercise-set
unitId: G07-EXERCISES
prerequisites: [G07]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Pinned DDP API', url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py', version: '2.11.0+cu128', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g07-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/pytorch-ddp-nccl/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,ownership,correctness,diagnosis,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G07 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/pytorch-ddp-nccl/exercises/" lang="en">Read the English counterpart</a>

## 先修与提交

精确先修 **[G07]**：[把 PyTorch DDP 看作 NCCL 客户端](/multi-gpu/pytorch-ddp-nccl/)。2026-09-20 复核；[SRC-CUDA-100](/sources-and-versions/#src-cuda-100)。打开解答前提交 rank 表、独立代数、实现和诊断工作表。静态推理无需 GPU；外部执行须满足 G07 的原生 Linux、至少两张 GPU、精确 wheel 依赖闭包和看门狗要求。运行仍为**待硬件验证（Pending Hardware Verification）**。

## 练习 1：证明所有权和流依赖

**目标：** 修复一个把两个工作进程都指向 `cuda:0` 的配置，以及在建立完成依赖前就读取异步全归约（All-reduce）结果的消费者 Q。

**约束：** 共享可见列表代表物理设备 2、5。一进程一 GPU，用本地 rank 选择设备，只使用默认 NCCL 进程组（Process Group）和立即初始化的 `device_id`。payload 在 P 上分配／写入，集合通信在 C 上调用，消费在 Q 上运行。不能用睡眠替代证明，也不能直接复用 DDP 内部通信器。

**预期证据：** rank→可见→物理映射表、有序的初始化／模型放置过程，以及带分配来源／生命周期列的 P→C→NCCL→Q 依赖表。

**验收标准：** 两个进程拥有不同物理设备；本地全部张量／模型／DDP 标识一致。标出 C 等待 P 的位置，以及在 Q 上调用 `work.wait()` 的位置。区分持有引用或 `record_stream(Q)` 与数据就绪，阻止最后使用前显式覆盖，主机验证／释放前要求 Q 完成。

<details><summary>提示 1：分开命名空间</summary>CUDA 可见性会重新编号设备。本地 rank 选择可见列表的序号，全局 rank 则属于进程组。</details>
<details><summary>提示 2：检查调用流</summary>后端观察集合通信提交时的当前流。等待必须保护实际消费者；仅登记分配器生命周期并不能连接生产者写入。</details>

## 练习 2：实现两次正确的 DDP 更新

**目标：** 实现 G07 的两种标量训练模式和独立异步标量集合通信，逐 rank 与不依赖 DDP 推导的参考比较。

**约束：** 单节点 R=2–8；FP64 单权重线性模型，无偏置，`w=1`，目标零，损失 `(w*x)^2/2`，SGD `lr=1/8`，两步，无动量／AMP／钩子／未使用参数。基线使用 `x=r+1`；累积使用 `x=r+1,r+2`，每对微批次（Microbatch）更新一次。使用 G07 的 60 秒进程组超时和外部启动期限。全部训练工作留在同一当前流。

**预期证据：** 推导依赖 R 的梯度系数；手算 R=2 两种模式的结果；提交代码及已记录观察为空的环境清单（Environment Manifest）模板。有合格硬件时，在私有存储保留完整逐 rank 阶段日志、数值、加载库身份、拓扑、完成／销毁及退出状态。

**验收标准：** 正确缩放每个累积损失，把第一次前向／反向都放入 `no_sync`，第二次同步，仅在更新边界清空梯度。每个梯度和更新后权重要求有限值，使用 `atol=rtol=1e-12` 检查；独立标量集合通信精确比较。即使存活 rank 一致，也要拒绝缺失 rank／步骤或失败退出。不能二次归约 DDP 梯度，也不能把预期数值打印成观察。

<details><summary>提示 1：先求局部导数</summary>局部损失对权重的导数是 w 乘 x 的平方。求导之后再跨 rank 取均值，不是在优化器更新后取均值。</details>
<details><summary>提示 2：保持一个有效批次</summary>累积要对两个微批次和 R 个 rank 取均值。第二次更新从上次更新后的权重开始，且此前清空梯度。</details>

## 练习 3：不执行错误集合通信也能诊断

**目标：** 分类[合成 fixture](/assets/ddp-fixtures/g07-diagnosis.json) 中的 D0–D3，给出各项首要检查，设计有界证据收集计划。

**约束：** 这些是虚构逻辑记录，不是实测日志。D1 明确给出更早的 rank-1 异常；D3 没有 rank-1 记录。不能编造时间戳、NCCL 消息、传输选择或硬件结果。保持单节点，不故意执行不匹配集合通信。

**预期证据：** 四种分类和支持分类的给定事实；缺失证据请求；60／90／180 秒超时策略解释；私有到公开日志的脱敏计划。

**验收标准：** 区分重复所有权、更早局部异常、集合通信次数不等、证据不足。解释超时不是根因，区分进程组超时、看门狗监控和外部监督器。异步失败后停止，不在错误路径加入屏障，保留最早异常，不假定请求的转储必然存在。分享派生文件前移除可识别主机／设备／网络／路径信息及凭据。

<details><summary>提示 1：找最早的已知事实</summary>一个 rank 没到达下一次归约，会让正常同伴等待。同伴超时是下游证据，不一定是起始错误。</details>
<details><summary>提示 2：缺失不是测量</summary>缺少工作进程记录，不能证明其 GPU 或网络失败。请求该进程最早错误、身份映射及启动器退出信息。</details>

## 复核与迁移

对照[独立编号解答](/multi-gpu/pytorch-ddp-nccl/solutions/)，完成 [PB-R6-008](/practice/#pb-r6-008)／[PB-R6-009](/practice/#pb-r6-009)。一手依据是[固定 DDP API](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/nn/parallel/distributed.py)。原创练习，CC BY 4.0，不宣称硬件执行。
