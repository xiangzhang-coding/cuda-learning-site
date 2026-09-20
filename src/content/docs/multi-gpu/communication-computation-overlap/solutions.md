---
title: 'G06 解答：依赖、区间与证据'
description: 复核区间范围与完整原创流水线实现，不提升运行证据状态。
pairId: g06-solutions
counterpart: /en/multi-gpu/communication-computation-overlap/solutions/
factCheckDate: '2026-09-20'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, timeline, pipeline, retrieval, sources]
resourceKind: solution-set
unitId: G06-SOLUTIONS
prerequisites: [G06-EXERCISES]
relatedUnits: [G06, LAB18]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-20' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-20' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,timeline,pipeline,retrieval,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/communication-computation-overlap/solutions/" lang="en">Read the English counterpart</a>

## 阅读前

先完成 [G06-EXERCISES](/multi-gpu/communication-computation-overlap/exercises/)，依赖模型见 [G06](/multi-gpu/communication-computation-overlap/)。复核日期 2026-09-20。

## 解答一：区间有范围

合成重叠案例在**每个** rank 上均有 `min(10,8)-max(4,5)=3` 个刻度交集。串行案例为 `max(0,min(10,13)-max(4,10))=0`。主机 API 区间不揭示 GPU 活动，因此第三例无法判断。三者均非实测证据。跨 GPU 相交仅确立不同设备同时发生的活动，不能证明局部重叠；缺少 rank 活动使双 GPU 分析不完整。

真实分类需要合格双 GPU 环境清单（Environment Manifest）和拓扑、源码／二进制身份、完整逐 rank 正确性、授权跟踪、完整诊断及原始报告保管、同一时间域，以及能论证的操作／分块关联。单独的条不能说明数据独立性。合成时间线不提供这些证据。SM 或带宽竞争下，重叠也可能伴随更差吞吐量；因果判断需要受控实验。

## 解答二：完整有界实现

下载[原创 Apache-2.0 CUDA 解答](/assets/exercise-solutions/g06-pipeline.cu)，按 [LAB18](/labs/pipeline-nccl-computation/) 执行精确构建、watchdog、工作负载矩阵、验证和采集流程。它使用 `produce`、每块覆盖全部 rank 的分组 `ncclAllReduce` 及 `consume`。输入／输出为独立完整数组，各块拥有自身切片，因此下一个生产者不会覆盖仍在通信的切片。归约和与 rank 有关，消费者变换有独立闭式参考结果。

在 p 上记录 `ready[k]` 后才提交 c 的等待。默认阻塞 NCCL 通信器在最外层 group end 成功时确立入队，之后才能在 c 记录 `done[k]`。q 等待 done 再消费。等待**每个 rank** 的最终 q 完成，经依赖传递证明此前工作完成。事件（Event）只能在下一次已完成并验证的迭代重新记录，避免等待错误代次。禁用计时的事件用于排序，不跨设备计算经过时间。

N=257/C=128 时，数量为 128、128、1，偏移为 0、128、256，最后一个元素必须使用全局下标 256。R=2/t=0/i=0 时输入 -5、-2，归约结果 -7，消费后为 **-13**。五次预热均验证，全部保留迭代均检查。Rank≤8 保持整数算术有界。错误路径不释放仍在使用的缓冲区，在外部期限保护下中止通信器。

串行模式每块后等待消费者；流水线（Pipeline）移除中间主机等待。这创造机会，不承诺调度并发。小内核可能受提交开销支配，NCCL 可能与它们竞争。不能通过删验证、改工作量或把采集样本当成无 profiler 样本来“修复”意外变慢。

可选双槽变体在 Q(k) 后记录 `consumed[generation]`。P(k+2) 覆盖槽 k mod 2 之前，所在流必须等待上一代消费者。不能等待尚未记录的事件，也不能在旧代消费者仍依赖它时重新记录。参考实现有意采用不相交切片。

## 回忆问题答案

1. done 保护消费；成功入队后在通信流记录。
2. 下一块拥有独立输入／输出切片，不消费前一块归约结果。
3. 上一代消费者完成必须先于下一代覆盖复用槽。
4. 流表达顺序，资源可用性、传输选择与竞争仍决定执行。
5. 可以：竞争、启动／事件开销和填充／排空可能抵消并发收益。
6. 设备行、正确性、身份、完整采集或操作映射缺失时应判为无法判断。

## 来源与证据边界

[SRC-CUDA-099](/sources-and-versions/#src-cuda-099)，2026-09-20 复核。原创讲解和 fixture 为 CC BY 4.0，解答软件为 Apache-2.0。未附采集执行。独立合格证据复核前，LAB18 保持**待硬件验证（Pending Hardware Verification）**，编译与已记录观察为空。
