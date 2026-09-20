---
title: 'G06：先证明依赖，再判断通信与计算重叠'
description: 分块安排独立工作，证明缓冲区寿命，用双 GPU 时间线判断重叠。
pairId: g06
counterpart: /en/multi-gpu/communication-computation-overlap/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, history, chunking, dependencies, engines, critical-path, timeline, practice, retrieval, sources]
resourceKind: learning-unit
unitId: G06
prerequisites: [G05, Q05, Q07]
relatedUnits: [LAB18, VIS16, VIS14, EX24]
hardwareGate: none
estimatedMinutes: 75
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
  - { title: 'Nsight Systems User Guide', url: 'https://docs.nvidia.com/nsight-systems/UserGuide/index.html', version: '2026.5', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g06 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,history,chunking,dependencies,engines,critical-path,timeline,practice,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G06 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'G05,Q05,Q07' } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: 'LAB18,VIS16,VIS14,EX24' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/communication-computation-overlap/" lang="en">Read the English counterpart</a>

## 学习目标

构建“生产者 → 全归约（All-reduce）→ 消费者”流水线（Pipeline），逐 rank 验证，再判断合格采集中的独立 GPU 活动是否重叠。完成 [LAB18](/labs/pipeline-nccl-computation/)，提交依赖证明及带证据限定的结论；证据不足时应回答“无法判断”。本单元预计 75 分钟；浏览器不执行 CUDA。

## 精确先修

**[G05, Q05, Q07]**：[NCCL 流依赖](/multi-gpu/nccl-stream-dependencies/)、[异步计时](/correctness/timing-asynchronous-gpu-work/)和[时间线优先分析](/correctness/timeline-first-nsight-systems/)。[EX24](/examples/nccl-all-reduce/)提供集合通信正确性基础；本实验的解答在此思路上增加实际的生产与消费内核（Kernel）。

## 为什么需要流水线

整体同步程序先计算整个数组，再通信，最后消费。即使下一个独立分块已经可以准备，每个阶段仍暴露等待。流（Stream）和事件（Event）允许软件表达更细的依赖图；NCCL 将拓扑感知的集合通信加入异步执行模型。这能移除不必要的顺序，但不会预留独立硬件，也不保证加速。

## 先分块，再添加流

总元素数 N、分块容量 C，对块 k 使用偏移 kC、数量 `min(C, N-kC)`。所有 rank 以相同顺序提交相同数量、类型和归约操作。LAB18 使用非原地的 `ncclInt32`/`ncclSum`、单进程单提交线程、默认阻塞通信器（Blocking Communicator），各块使用不相交的输入／输出切片。尾块也必须验证。比较分块大小时保持 N 不变。

不相交切片有意避开环形缓冲区复用风险。分配保持存活到最终完成；单次迭代中每块有独立事件。双缓冲实现则必须增加“消费者完成 → 下一代覆盖”的边。C 越小，启动、事件及集合通信开销可能越大；C 越大，独立工作可能越少。不存在通用最优端点。

## 证明依赖图

每个 rank 的每块 k：

| 步骤 | 流 | 必需依赖 |
| --- | --- | --- |
| 生产输入 P(k)，随后记录 ready(k) | p | 所有输入写入先于记录 |
| 等待 ready(k)，随后全归约 A(k) | c | 先提交记录，再提交等待 |
| 分组成功结束后记录 done(k) | c | 集合通信先入队，再记录事件 |
| 等待 done(k)，随后消费 Q(k) | q | 不得提前读取或覆盖 |
| 等待所有 rank 完成，下载并验证 | 主机 | 所有最终消费者完成后才观察或复用 |

一个线程管理多个 GPU 时，将**所有 rank** 的匹配 A(k) 调用分组，结束分组后才记录各自 done(k)。不能在组内同步。默认阻塞通信器的 group end 成功只确立入队，不表示 GPU 完成。非阻塞 NCCL 通信器需要 G05 的另一套进度协议，不在本实验实现范围内。

A(k) 到 P(k+1) 没有语义依赖边。这是重叠机会，不是重叠证明。串行对照每块后等待所有 q 流完成；候选流水线只在所有块提交后等待。两者运行完全相同的内核和集合通信序列。不要把生产流和通信流放入同一个混合流 NCCL 组：固定版本契约会在组操作前后同步参与流，扩大依赖图。内循环中的设备级同步也会消除机会。

## 区分资源与依赖

拷贝引擎（Copy Engine）为符合条件的拷贝操作移动数据；计算内核使用流式多处理器（SM）的执行资源。NCCL 可以使用 GPU 内核以及选定的传输／通信机制，不等同于独立拷贝引擎。通信可能与计算竞争 SM、显存带宽、互连、调度和功耗预算。引擎数量、不同流名、`Async` API 名称、PCIe 邻近关系或 NVLink 标签都不能确立并发。

LAB18 在 GPU 上生产数据，验证用 D2H 拷贝在计时区域之外，因此拷贝／计算相交不是目标结论。记录拓扑和实际 NCCL 配置；不要从 [VIS16](/visuals/collective-paths/) 推断所选算法。复用该逻辑模型分析参与者，用 [VIS14](/visuals/nsight-systems-versus-nsight-compute/) 选择下一项 profiler 问题。

## 分析关键路径

关键路径（Critical Path）是从提交到最终完成的最长依赖链。假设 K 个等大分块的三个独立阶段耗时为 p、a、q，理想流水线耗时为 `p+a+q+(K-1)*max(p,a,q)`，而非 `K*(p+a+q)`。这个简化模型忽略启动开销、竞争、rank 偏斜和填充／排空的不均衡。LAB18 的 P 和 Q 都使用计算资源，把三阶段当成独立服务资源尤其乐观。

用公式提出改进问题，不把它当成实测加速。重叠可能存在，吞吐量却下降。吞吐量结论需要条件匹配的无 profiler 对照／候选实验和重复端到端测量。瓶颈假设需要受控干预；一根长时间条并不能证明因果关系。

## 读取设备区间，而不是主机条

[原创教学 fixture](/assets/overlap-fixtures/lab18-timeline.json) 使用**无量纲合成刻度**，不是微秒，也不是采集报告。重叠案例中 rank 0 的 A(0) 为 [4,10)，P(1) 为 [5,8)，交集长度为 3 个刻度；rank 1 使用相同区间。这说明两个 GPU 各自的局部并发。GPU 0 的计算仅与 GPU 1 的通信相交，不能证明任一 GPU 上的局部重叠。串行案例端点相接，交集为零；仅有主机调用的案例即使 API 条相交也无法判断。

真实采集先核对源代码／二进制身份、正确性、rank／设备映射、同一报告时间域、完整 CUDA 活动以及可见的独立计算／通信区间。结合分块顺序和源代码关联集合通信启动，不能只猜内核名。检查流等待、同步、rank 偏斜、诊断和丢失记录。API 耗时与 GPU 耗时属于不同的行。缺行或映射不明应判为**无法判断**，不能当成零重叠。一次合格运行只支持该环境、该区域的结论。

## 练习与验收

先做[时间线与流水线练习](/multi-gpu/communication-computation-overlap/exercises/)，再看[独立解答](/multi-gpu/communication-computation-overlap/solutions/)，审查 [PB-R6-006](/practice/#pb-r6-006) 和 [PB-R6-007](/practice/#pb-r6-007)。LAB18 保持**待硬件验证（Pending Hardware Verification）**：没有发布合格双 GPU profiler 证据、吞吐量或瓶颈结果。合成 fixture 和浏览器模型不能提升证据状态（Evidence Status）。

## 回忆问题

1. 哪条边保护消费者？何时可以记录它等待的事件？
2. 为什么块 k+1 可能独立于全归约 k？
3. 双槽缓冲区增加哪条寿命依赖？
4. 为什么第二条流或拷贝引擎不能证明 NCCL 重叠？
5. 重叠增加时，端到端吞吐量能否下降？
6. 缺少哪些证据时应判为无法判断，而非串行？

## 一手来源与权利

复核日期 **2026-09-20**：[SRC-CUDA-099](/sources-and-versions/#src-cuda-099)。当前 Context7 检索结果已与不可变 NCCL 2.31.2 流／分组源码及官方 Nsight Systems 2026.5 指南核对；LAB18 要求记录实际安装的 profiler 精确构建版本。正文、依赖表、fixture 为原创 CC BY 4.0；可下载练习解答为原创 Apache-2.0。未复制官方图示或示例源码。
