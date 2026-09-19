---
title: 'G05：把 NCCL 工作排进 CUDA 流'
description: 区分主机返回、分组入队、流完成与跨流依赖。
pairId: g05
counterpart: /en/multi-gpu/nccl-stream-dependencies/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, enqueue,grouping, dependencies, multi-stream, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G05
prerequisites: [G04, M07, M08]
relatedUnits: []
hardwareGate: none
estimatedMinutes: 60
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL pinned stream and group semantics', url: 'https://github.com/NVIDIA/nccl/tree/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g05 } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/en/multi-gpu/nccl-stream-dependencies/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,enqueue,grouping,dependencies,multi-stream,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G05 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G04,M07,M08' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-stream-dependencies/" lang="en">Read the English counterpart</a>

## 学习目标

为每个 rank 画出并论证“生产者 → 集合通信（Collective）→ 消费者”依赖链，指出主机何时只是提交、设备何时真正完成。使用 [EX24](/examples/nccl-all-reduce/)，完成 [LAB17](/labs/nccl-all-reduce/)。预计 60 分钟；图示不执行 CUDA。

## 精确先修

**[G04, M07, M08]**：[集合通信契约](/multi-gpu/nccl-communicators-collectives/)、[流（Stream）](/memory/stream-ordering/)与[事件（Event）](/memory/event-dependencies-timing/)。代码路径使用 G04 的双 GPU 环境，不使用浏览器 GPU。

## 主机调用为什么不是执行时间线

CUDA 流让主机提交按依赖排序的工作，由设备异步执行。NCCL 沿用这一模型，而不是让每个主机调用都成为“通信已完成”的屏障。因此，画出主机调用顺序后，还要补一层设备执行边。分组（Grouping）也解决了一个实际死锁问题：一个主机线程不能阻塞等待自己尚未提交的另一个本地 rank。

## 三个不同的时刻

对组外的阻塞通信器（Blocking Communicator），集合通信成功返回表示工作已入队到指定流，**不表示完成**。在组内，连入队都可能推迟到最外层 `ncclGroupEnd`。它以阻塞方式成功返回后，才表示分组工作已入队。设备完成仍需要 CUDA 流／事件完成检查及错误处理。

“阻塞通信器”描述 NCCL 的主机进度行为，不会把集合通信变成设备同步 API。相反，`cudaStreamNonBlocking` 控制 CUDA 与 legacy 流之间的隐式依赖，不会选中非阻塞 NCCL 通信器。EX24 使用默认阻塞 NCCL 通信器和非阻塞 CUDA 流。

用 `ncclCommInitRankConfig` 配置 `config.blocking=0` 的非阻塞通信器具有另一套主机进度契约：group end 可能返回 `ncclInProgress`。在相关 CUDA 操作前，轮询**所有参与通信器**到 `ncclSuccess`，检查查询错误、异步状态和截止期限。此时才确立入队，GPU 完成仍是后续条件。这是固定版本的对照说明，不是 EX24 的运行配置。

## 先完成分组，再等待

一个线程管理 R 个设备时，开启一组，为每个 rank 提交匹配的 all-reduce，再关闭组。不要在组内同步第一个 rank：工作可能仍未入队，后续 rank 也尚未到达。始终检查单次调用与 group end；没有 watchdog 时，不应把故意制造匹配错误当成安全实验。

分组不免除集合通信顺序要求。Rank 0 提交 A 再 B、rank 1 提交 B 再 A，分组不会修复它，仍可能挂起或产生错误结果。初始化和通信分开分组。嵌套组只在最外层结束时启动。NCCL 2.x 的组内通信调用不要求每次先选择设备，但 CUDA 分配／拷贝／事件调用及 `ncclCommInitRank` 仍要满足设备归属。

## 证明生产与消费依赖边

EX24 每个 rank 使用一个显式流；H2D 上传、all-reduce 和 D2H 下载在同一流内排序。所有下载都在 group end 成功后提交，所有 rank 完成后才进行主机比较、复用或清理。可分页主机向量可能使拷贝阻塞；`Async` 后缀不能证明观察到了重叠。输入／输出向量一直存活到完成。

将来改成双流时，可用下面的**逻辑步骤表**，它不是采集的追踪：

| 每个 rank 的顺序 | 流 | 必需依赖 |
| --- | --- | --- |
| 生产输入，记录 ready 事件 | 生产流 | 记录位于所有写入之后 |
| 等待 ready，提交集合通信 | 通信流 | 先提交事件记录，再提交等待 |
| 分组成功入队后记录 done | 通信流 | done 位于集合通信之后 |
| 等待 done，消费输出 | 消费流 | 消费者不能提前读取 |
| 最后一次使用完成后才复用／释放 | 主机或归属流 | 输入不变，输出保持存活 |

事件归属于设备，必须在该设备的流上记录。等待一个从未记录过的事件，不等于承诺等待未来的记录。重记录事件需要按代次分析；这里假设每次只处理一个迭代。不要跨设备事件计算经过时间。依赖分析复用[流／事件可视化](/memory/event-dependencies-timing/)，逻辑消息路径使用 [VIS16](/visuals/collective-paths/)。

## 多个流不等于相互独立

固定 NCCL 流指南指出：在一个组内混用多个流，会在 NCCL 内核开始前建立这些流之间的依赖，并阻塞它们直到内核完成。这是**参与流之间**的同步点，不是整个主机或整个设备的屏障。把本可独立的操作合组，可能扩大依赖；分成不同组也不会自动证明重叠。

一个设备使用多个通信器时，所有 rank 必须保持一致的全局启动顺序。NCCL 2.26 引入可选的 `NCCL_LAUNCH_ORDER_IMPLICIT`，启用后仍要求一致的主机提交顺序。不要依赖未记录的环境默认值，也不要让多个主机线程竞争启动顺序。EX24 有意只用一组通信器成员和一个提交线程。即使流与通信器不同，缓冲区别名也可能添加依赖。

## 练习与验收

先做[练习](/multi-gpu/nccl-stream-dependencies/exercises/)，再看[解答](/multi-gpu/nccl-stream-dependencies/solutions/)，审查 [PB-R6-005](/practice/#pb-r6-005)。LAB17 保留 rank 日志、设备分配、拓扑、版本、进程模型、流依赖图与正确性记录。验收要求各 rank 精确输出且清理成功，不由此推断延迟或重叠。EX24 与 LAB17 均保持待硬件验证（Pending Hardware Verification）；公开编译证据独立为空，直至有经过复核的记录。

## 回忆问题

1. 组内的集合通信成功返回表示什么？
2. 为什么阻塞 NCCL 通信器仍可在 GPU 上异步执行？
3. 为什么单主机线程必须先对所有本地 rank 分组，再等待？
4. 消费者等待的完成事件应记录在哪里？
5. 多个流合组会增加什么依赖？
6. 为什么改成两个流不能证明通信／计算重叠？

## 一手来源与权利

复核日期 **2026-09-19**。[SRC-CUDA-098](/sources-and-versions/#src-cuda-098) 在当前 Context7 检索后，将流／分组／通信器语义固定到 NCCL 2.31.2；CUDA 事件归属沿用 G01/M08 记录的归档契约。步骤表与正文原创，采用 CC BY 4.0。不伪造时间线、算法或性能观察。
