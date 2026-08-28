---
title: 'M05 参考解答：按作用域选择同步'
description: M05 练习的 guarantee classification、device-scope publication repair 与四种 participant-driven scope selection。
pairId: m05-solutions
counterpart: /en/memory/synchronization-scopes/solutions/
factCheckDate: '2026-08-28'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: M05-SOLUTIONS
prerequisites:
  - M05-EXERCISES
relatedUnits:
  - M05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m05-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: M05 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/synchronization-scopes/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [M05 练习（Exercise）](/memory/synchronization-scopes/exercises/)的参考答案。它们证明 static contract，不报告 execution 或 performance evidence。

## 解答 1：分类保证，不混为一谈

| operation | named participants | rendezvous | ordering / visibility | atomicity |
| --- | --- | --- | --- | --- |
| `__syncwarp(mask)` | `mask` 命名的 lanes | 是，限 documented warp synchronization point | participating lanes 之间的 documented memory ordering | 不提供 arbitrary read-modify-write atomicity |
| `__syncthreads()` | 一个 block 中的 participating threads | 是 | prior memory accesses 按 block contract 变得可见 | 不提供 arbitrary read-modify-write atomicity |
| device-scope relaxed atomic increment | 在 sufficient scope 访问该 atomic 的 device participants | 否 | relaxed order 不 ordering unrelated payload | 对该 increment 提供 atomicity |
| device-scope memory fence | calling thread 的 operations，按 device scope ordering | 否 | ordering 该 thread 的 memory operations；仍需 protocol 连接 observer | 否 |

分类结果不追求“每行只勾一项”。一个 primitive 可以提供多项 guarantee，但仅限 named participants 与 documented scope。

## 解答 2：修复 payload publication proof

原 claim 缺 observable publication、consumer-side ordering action，以及双方 scope 足够宽的证明。一个修复图是：

```text
producer: write payload
          -> device-scope release store ready = 1
consumer: device-scope acquire load ready observes 1
          -> read payload
```

当 acquire 观察到 released value 时，release/acquire pair 建立 cross-thread relation。Standalone `__threadfence()` 可以在 device scope ordering producer operations，但它既不写 `ready`，也不让 consumer wait。等价 legacy protocol 仍必须提供 atomic publication、sufficient fence ordering 与 matching observation；“fence means done” 依旧错误。

## 解答 3：为四种场景选择作用域

| scenario | narrowest candidate | additional proof |
| --- | --- | --- |
| named lanes 交换值 | warp | explicit mask 命名全部 participating lanes，且每个 named lane 执行 collective |
| block 消费 shared tile | block | 每个 required thread 到达 block barrier；shared storage 属于该 block |
| later kernel 消费 global results | device communication 加 explicit launch boundary | boundary ordering producer completion 与 consumer launch；不虚构 in-kernel block rendezvous |
| CPU 消费 system-accessible data | system | allocation accessibility 与 system-scope primitive support 同时覆盖 CPU/GPU participants |

Warp 对 whole block 过窄，block 对 cross-block publication 过窄，CPU 成为 participant 时 device 也过窄。前三项不能只因 system 更宽就选 system；protocol 应表达 actual participant set。

## 有效替代方案

- Documented block collective 若命名同一 required participant set 并提供所需 memory effects，可替代 `__syncthreads()`。
- Legacy fence-plus-atomic-flag message-passing protocol 可以成立，但必须显式证明双方 ordering 与 scope。
- 后续单元的 event 或 stream boundary 可以 ordering work submissions，但必须按该 API documented scope 分析，不能直接替换 in-kernel barrier proof。

## 常见错误

- 把 fence 当作 rendezvous 或 notification。
- 把 atomic update 当作 ordering 所有 unrelated memory access。
- 用 `__syncthreads()` 协调不同 blocks 的 participants。
- Warp mask proof 漏掉 inactive lanes，却仍期待它们的 value。
- 未检查 memory accessibility 或 primitive support 就选择 system scope。
- 认为 static ledger 已证明 execution 或 performance。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
