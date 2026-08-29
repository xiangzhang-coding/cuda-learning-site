---
title: 'M09 练习：设计正确的重叠流水线'
description: 用三道深入静态任务审查 page-locked buffer ownership、推导可复用 chunk pipeline，并设计 capability-to-observation gate。
pairId: m09-exercises
counterpart: /en/memory/pinned-memory-transfer-overlap/exercises/
factCheckDate: '2026-08-29'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: M09-EXERCISES
prerequisites:
  - M09
relatedUnits:
  - M09
  - M10
  - Q05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m09-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M09 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M09,M10,Q05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/pinned-memory-transfer-overlap/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M09：页锁定内存与传输重叠](/memory/pinned-memory-transfer-overlap/)。这些练习产生 ownership ledger、dependency graph 与 evidence plan；它们不执行 EX07，也不授予 overlap evidence。

## 作答方法

每份答案先写 serialized correctness contract，再逐项加入 page locking、stream edges 与 hardware gates，并始终分开 “eligible” 与 “observed”。完成所有 artifacts 后再查看[参考解答](/memory/pinned-memory-transfer-overlap/solutions/)。

## 练习 1：审查 page-locked buffer plan

**目标：** 审查四个 host ranges：一个由 `cudaMallocHost` 分配，一个由 `cudaHostAlloc` 分配，一个 `malloc` range 由 `cudaHostRegister` 注册，另一个 ordinary pageable `std::vector` range 被传给 `cudaMemcpyAsync`。

**约束：** 每个 range 都要记录 creator、page-lock operation、matching unpin/free action、last asynchronous user、completion proof，以及它是否满足 M09 asynchronous-copy prerequisite。不得把 registration 改写成对 original allocation 的 ownership。Pinned working set 必须有界，并放在 steady-state enqueue loop 之外。

**预期证据：** 一张四行 ownership/lifetime ledger、每项 mismatched release 的 diagnosis，以及不含 runnable implementation 的 repaired acquisition-to-cleanup sequence。

**验收条件：** 每个 CUDA-created pinned allocation 恰有一次 matching `cudaFreeHost`；registered range 先 unregister，再由 original allocator 释放；任何 range 都不在 last copy 完成前 reuse；pageable range 不用于声称 overlap。

<details><summary>提示 1</summary>把“谁拥有这些 bytes”与“谁暂时 pin 这些 bytes”分开。</details>

<details><summary>提示 2</summary>先画 completion edge，再画 cleanup edge。</details>

## 练习 2：推导可复用的 three-chunk pipeline

**目标：** 使用两个 reusable host/device slots 与两个 named non-default streams 绘制 chunks 0、1、2。每个 chunk 都需要 H2D、kernel、D2H、host verification 与最终 slot reuse。

**约束：** 每个 chunk 都保留 `H2D(i) -> kernel(i) -> D2H(i)`。只添加 cross-stream data flow 与 safe reuse 所需的 event/host-completion edges。Chunk 2 复用 chunk 0 的 slot。不得从 side-by-side lanes 推导 execution interval 或 performance result。

**预期证据：** 两条 stream lanes、三条完整 chunk chains、一张随时间变化的 slot-ownership table、event-generation labels，以及 correctness edges 加完后仍保持 unordered 的 operation-pair list。

**验收条件：** Input slot 不会在 H2D use 完成前被 overwrite；output 不会在 D2H completion 前 verification；chunk 2 不能过早复用 slot 0；每条 producer-consumer edge 都明确；unordered pair 只能描述为 eligible。

<details><summary>提示 1</summary>分别跟踪 slot identity 与 chunk identity。</details>

<details><summary>提示 2</summary>保护 slot reuse 的 event 属于 previous occupant 已完成的 output path。</details>

## 练习 3：设计 capability-to-observation review

**目标：** 为未来 EX07 编写 review plan，使它能把 baseline correctness、overlap eligibility 与 observed transfer overlap 报告成三项独立 verdict。

**约束：** 声明 serialized baseline、相同 logical work、output oracle、所选 Toolkit Lane、完整 Environment Manifest、page-lock proof、exact device capability query、stream/event graph、warm-up policy、Q05 timing boundaries 与 device-timeline requirement。不得提供 duration、bandwidth、overlap percentage 或 speedup。

**预期证据：** 一张 three-gate decision table、每个 gate 所需 raw artifacts、explicit stop conditions，以及 pass、fail、unsupported、unobserved outcomes 的 allowed wording。

**验收条件：** Overlap capability 缺失时 correctness 仍可 pass；capability 不能代替 timeline；只有 correctness pass 后才解释 timeline；不能只从 API spelling 推断 copy-engine use；当前 observation fields 全部保持为空。

<details><summary>提示 1</summary>让每项更强 claim 依赖所有较弱 gates，但不要让 correctness 依赖 overlap。</details>

<details><summary>提示 2</summary>Device property 描述 possibility；timeline 提供一次 execution 的 intervals。</details>

## 下一步

完成后查看独立的[参考解答](/memory/pinned-memory-transfer-overlap/solutions/)，复核[练习题库（Practice Bank）PB-R2-001](/practice/#pb-r2-001)，并重读 [TERM-096](/glossary/#term-096)、[TERM-097](/glossary/#term-097)与 [TERM-098](/glossary/#term-098)。练习集复核日期：**2026-08-29**。
