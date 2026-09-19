---
title: 'G05 练习：找出缺失的完成依赖'
description: 修复分组提交与生产、通信、消费依赖图。
pairId: g05-exercises
counterpart: /en/multi-gpu/nccl-stream-dependencies/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, group, dependency, review]
resourceKind: exercise-set
unitId: G05-EXERCISES
prerequisites: [G05]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,group,dependency,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G05 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-stream-dependencies/exercises/" lang="en">Read the English counterpart</a>

## 先修与作答要求

精确先修 **[G05]**：[流依赖](/multi-gpu/nccl-stream-dependencies/)。2026-09-19 复核，[SRC-CUDA-098](/sources-and-versions/#src-cuda-098)。无需硬件即可画步骤表。可选实现需要 LAB17 的双 GPU 环境清单（Environment Manifest）；合格执行前运行保持待硬件验证（Pending Hardware Verification）。

## 练习一：组内等待

**目标：** 修复单线程顺序：group start → rank 0 all-reduce → 同步 rank 0 流 → rank 1 all-reduce → group end。

**约束：** 保留两个本地 rank 与默认阻塞通信器。检查立即错误和分组错误。不要在共享基础设施上故意测试挂起。

**验收：** 先提交两个 rank，再关闭组，之后轮询每个 rank 的流与异步错误状态。解释延迟入队，以及 group end 为什么仍不是 GPU 完成。为阻塞主机调用设置外部超时，并说明非阻塞通信器返回 `ncclInProgress` 时的不同处理。

<details><summary>提示一</summary>Rank 0 等待时，rank 1 是否已经提交？</details>
<details><summary>提示二</summary>Group end 返回与成功完成检查返回，是两个不同的时刻。</details>

## 练习二：补上事件依赖

**目标：** 生产者在流 p 写入，all-reduce 在 c 运行，消费者在 q 读取；主机按该顺序调用，却没有事件。修复依赖图。

**约束：** 使用显式非阻塞流，一次只考虑一个迭代；事件归属各 rank 的设备。不使用设备级同步，不声称未经验证的重叠。另外分析两次通信使用不同流但被放进同一组的情况。

**验收：** 生产后记录 ready，且先提交记录，再提交 c 的等待；集合通信成功入队后记录 done，q 在消费前等待；最后一次使用早于复用／释放。解释混合流分组增加的跨流同步。说明静态图不能测量重叠。

<details><summary>提示一</summary>不同流之间的主机提交顺序，不是生产／消费依赖边。</details>
<details><summary>提示二</summary>列出每个事件证明什么，以及谁能记录它。</details>

## 独立复核

随后阅读[解答](/multi-gpu/nccl-stream-dependencies/solutions/)和 [PB-R6-005](/practice/#pb-r6-005)。
