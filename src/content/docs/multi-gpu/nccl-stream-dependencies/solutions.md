---
title: 'G05 解答：入队以后，还要证明完成'
description: 复核分组入队与显式事件依赖。
pairId: g05-solutions
counterpart: /en/multi-gpu/nccl-stream-dependencies/solutions/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, group, dependency, review]
resourceKind: solution-set
unitId: G05-SOLUTIONS
prerequisites: [G05-EXERCISES]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'NCCL stream semantics', url: 'https://github.com/NVIDIA/nccl/blob/7b83616df3ae082a1f32bb74c27458bfe8153a13/docs/userguide/source/usage/streams.rst', version: '2.31.2', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,group,dependency,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/en/multi-gpu/nccl-stream-dependencies/solutions/" lang="en">Read the English counterpart</a>

## 先修

先完成 [G05-EXERCISES](/multi-gpu/nccl-stream-dependencies/exercises/)。复核日期 2026-09-19，[SRC-CUDA-098](/sources-and-versions/#src-cuda-098)。

## 解答一：先提交，再等待

正确顺序：group start → rank 0 all-reduce → rank 1 all-reduce → 检查 group end → 全 rank 错误／完成轮询 → 比较。组内调用可能尚未入队；唯一提交线程等待时，尚未提交的第二个 rank 无法参与。阻塞 group end 成功只证明入队，不证明完成。非阻塞通信器的组若返回 `ncclInProgress`，先把所有参与通信器轮询到成功，再做相关 CUDA 操作；流完成另行检查。

保留立即调用和分组错误。致命分组失败应 abort 所有参与通信器；60 秒轮询期限无法中断阻塞主机调用，因此 EX24 另需外部 watchdog。**常见错误：** 把 `cudaStreamNonBlocking` 当成 NCCL 非阻塞进度配置。

## 解答二：事件提供证明依赖

每个 rank 在 p 生产并记录 ready。提交记录后，让 c 等待 ready。将所有 rank 的集合通信分组提交。成功入队后，在 c 记录 done；q 等待 done 后才读取接收缓冲区。发送缓冲区保持不变，接收缓冲区存活到最后一次使用结束。事件只能在所属设备的流上记录，不能把未记录事件当成未来通知。

**有效替代：** 像 EX24 一样，每个 rank 把生产、通信和消费放在同一流，依赖由流顺序提供。多个流中的通信被合组，会在参与流之间引入同步点，可能消除预想的独立性。两个方案都不是重叠测量；实际重叠需要另外界定的分析器与测量契约。

## 证据复核

可选实现遵循 LAB17 的双 GPU 环境清单（Environment Manifest）。没有硬件时已记录结果为空，保持待硬件验证（Pending Hardware Verification）。经过复核的依赖图不授予编译、计时或运行证据。
