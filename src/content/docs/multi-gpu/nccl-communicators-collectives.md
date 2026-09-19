---
title: 'G04：让所有 rank 遵守同一集合通信契约'
description: 创建通信器，核对计数、数据类型、参与顺序和每个 rank 的结果。
pairId: g04
counterpart: /en/multi-gpu/nccl-communicators-collectives/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, communicator, collective, correctness, failure, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G04
prerequisites: [G01, G03]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 60
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL pinned communicator and collective contracts', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g04 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/nccl-communicators-collectives/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,communicator,collective,correctness,failure,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G04 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G01,G03' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-communicators-collectives/" lang="en">Read the English counterpart</a>

## 学习目标

在启动通信前写清集合通信（Collective）契约：参与 rank、设备归属、操作顺序、数据类型（Datatype）、元素计数（Count）和验收参考。构建 [EX24](/examples/nccl-all-reduce/)，用 [VIS16](/visuals/collective-paths/) 区分集合通信结果与选定消息路径。预计 60 分钟，阅读不需要 GPU。

## 精确先修

**[G01, G03]**：[设备／上下文归属](/multi-gpu/devices-contexts-ownership/)与[拓扑路径](/multi-gpu/topology-paths/)。接着在 [G05](/multi-gpu/nccl-stream-dependencies/) 学习流顺序，再到 [LAB17](/labs/nccl-all-reduce/) 应用。

## 为什么需要集合通信抽象

对等拷贝（Peer Copy）在指定端点间移动数据，分布式归约还需要参与者、匹配规则和结果放置规则。集合通信接口为这个共享操作命名，使库能选择适合机器的消息路径。NCCL 提供与 CUDA 流关联的 GPU 通信原语。一个数学求和并不承诺 ring 算法、NVLink 使用或已达到的带宽。沿用 MPI 风格的 rank 术语也不代表必须使用 MPI：EX24 是单进程程序。

## Rank 与通信器归属

Rank 是通信器（Communicator）内部 `[0, R)` 的整数，不是永久 GPU 编号、进程 ID 或全局身份。每个通信器句柄关联固定 rank 和 CUDA 设备。这条稳定路径让每个 rank 使用独立的**完整 GPU**；同一通信器把一个设备重复用作多个 rank 不受支持，可能挂起。2.31 的实验性 MIG 支持不进入本课程路径。

`ncclCommInitAll(comms, R, devices)` 在一个进程内创建全部本地句柄。`devices` 的第 r 项决定 rank r 的 CUDA 可见设备；重排列表会改变映射。EX24 使用可见序号 `0..R-1`，通过 `ncclCommUserRank`、`ncclCommCount` 和 `ncclCommCuDevice` 核对。按 G03 在私有记录中把这些序号对应到物理身份；可见性重映射会改变序号含义。

多进程方案需要一个参与者调用 `ncclGetUniqueId`，通过**带外 CPU 机制**分发 ID，再让各参与者选择设备并用同一 ID、同一 rank 数及唯一 rank 调用 `ncclCommInitRank`。NCCL 不替你启动进程或分发 ID。一个线程管理多个 rank 时必须分组初始化，不能在同一组混合初始化与集合通信。EX24 选择 `InitAll`，不引入进程启动器。

## 匹配完整的集合通信契约

所有参与 rank 都必须按相同顺序提交相容操作。Count 是**指定数据类型的元素数**，不是字节数。每次调用使用通信器所属设备上的有效缓冲区，并满足长度和生命周期要求。Root 是通信器 rank，不是 CUDA 序号。本地 API 成功返回不能证明其他 rank 使用了匹配参数。

| 操作 | 计数与放置契约 |
| --- | --- |
| 全归约（All-reduce） | 每个 rank 输入／输出 `count` 个元素；每个 rank 都得到归约结果；没有 root 参数 |
| 归约（Reduce） | 每个 rank 输入 `count` 个元素；只在 root rank 使用归约输出 |
| 广播（Broadcast） | 把 root rank 的 `count` 个元素复制给所有 rank |
| 全收集（All-gather） | 每个 rank 输入 `sendcount` 个元素；输出按 rank 排列的 `R*sendcount` 个元素 |
| 归约散发（Reduce-scatter） | 每个 rank 输入 `R*recvcount` 个元素；rank r 获得对应块的 `recvcount` 个归约元素 |

基本 all-reduce 参数为发送／接收指针、count、datatype、归约操作、通信器和流。`ncclInt32` 搭配 `ncclSum` 表示有符号 32 位整数加法；传入 FP32 缓冲区或把字节数当 count 都违约。发送和接收指针完全相同可选择受支持的原地（In-place）all-reduce；任意部分重叠不等价。EX24 用独立数组明确归属。

## 能发现参与错误的参考答案

EX24 输入为 `x[r,i] = 3*(r+1)+(i mod 17)-8`。R 个 rank 的独立推导结果为 `3*R*(R+1)/2 + R*((i mod 17)-8)`。R=2、i=0 时，输入 -5 与 -2 得到 -7；R=4、i=16 时预期为 62。这些是**手算预期**，不是 GPU 日志。计数 1、257、1048576 分别覆盖标量、不规则长度和较大缓冲区。R 限定为 2–8，所有部分和均不溢出 int32。完成后比较所有 rank 的每个元素，不只检查 rank 0 或校验和。

浮点归约重排会改变舍入；要求它与顺序 CPU 求和精确相同并非通用正确性标准。测试前应说明数据类型、累加行为、有限值规则、容差与输入尺度。All-reduce 的一致结果放置契约与跨版本逐位可重复性是不同问题。整数 EX24 有意避开这一歧义。

## 失败也是契约的一部分

检查 CUDA／NCCL 返回值、group-end 状态和 `ncclCommGetAsyncError`。后者有**两个状态**：查询是否成功，以及通过输出指针写回的通信器状态。网络或异步错误可能让流永不完成，因此单独阻塞在 `cudaStreamSynchronize` 不是合适的错误监控方式。

EX24 提交后轮询全部 rank 的流与异步状态，期限为 60 秒；外部 180 秒进程 watchdog 还覆盖可能阻塞的初始化、分组、finalize 和 abort。致命分组错误影响整个组，操作可能只完成一部分；对所有已取得的通信器尝试 abort，并让进程失败。不伪造成功结果，也不复用状态不明的缓冲区。EX24 的致命路径不释放可能仍在使用的缓冲区，而是退出；它不是容错恢复服务。正常清理先等待任务完成，再分组 finalize、销毁句柄、释放分配和流。清理失败同样使本次执行失败。

## 练习与硬件门槛

先做[练习](/multi-gpu/nccl-communicators-collectives/exercises/)，再看[独立解答](/multi-gpu/nccl-communicators-collectives/solutions/)及 [PB-R6-004](/practice/#pb-r6-004)。EX24 独立固定 NCCL **2.31.2-1+cuda13.3**、Toolkit **13.3.1**、原生 Ubuntu 24.04 x86-64、C++17、驱动 ≥610.43.02。至少两个独立完整 GPU，每个 CC≥7.5、总内存 ≥8 GB、空闲 ≥256 MiB；库和上下文另需资源。LAB17 要求完整环境清单（Environment Manifest）与拓扑／平台评估。编译证据独立记录；没有合格双 GPU 证据时，EX24 和 LAB17 保持待硬件验证（Pending Hardware Verification）。

## 回忆问题

1. Rank 0 为什么可以对应 CUDA 可见设备 3？
2. 对 `ncclInt32` 而言，`count=257` 表示什么？
3. 为什么 all-gather 的输出分配比输入大？
4. 只检查 rank 0 会漏掉什么？
5. 异步错误查询必须检查哪两个结果？
6. 为什么数学结果正确不能证明 ring 或 NVLink 路径？

## 一手来源与权利

复核日期 **2026-09-19**。[SRC-CUDA-097](/sources-and-versions/#src-cuda-097) 记录当前 Context7 检索、固定 2.31.2 的通信器／集合通信／分组／错误／版本源码核对、二进制包哈希和精确许可。讲解、算术与练习原创，采用 CC BY 4.0；EX24 原创软件采用 Apache-2.0。没有改编上游示例代码或已记录结果。
