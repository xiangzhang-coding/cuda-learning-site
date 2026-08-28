---
title: 'M08 练习：跟踪事件依赖与计时'
description: 用三道静态任务跟踪 selective stream wait、为 re-recorded event 标版本，并设计 dependency/timing event contracts。
pairId: m08-exercises
counterpart: /en/memory/event-dependencies-timing/exercises/
factCheckDate: '2026-08-28'
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
unitId: M08-EXERCISES
prerequisites:
  - M08
relatedUnits:
  - M08
  - VIS07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m08-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M08 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M08,VIS07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/event-dependencies-timing/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M08：用事件表达依赖并测量设备时间](/memory/event-dependencies-timing/)。这些练习只使用 symbolic event generations/timestamps，不需要 CUDA-capable system。

## 作答方法

对每个 event operation 写 recording stream、captured prefix、event generation、API-call point 与 afterward ordered work。先分开 dependency/timing roles，再查看[参考解答](/memory/event-dependencies-timing/solutions/)。

## 练习 1：跟踪 selective event dependency

**目标：** 绘出 `stream_producer: P1 -> record(E) -> P2` 与 `stream_consumer: wait(E) -> C1 -> C2`；wait call 在 first record 后发出。

**约束：** 只添加 per-stream order、`cudaEventRecord` 与 `cudaStreamWaitEvent` 保证的 edges；说明 host 是否 wait；没有 separate edge 时不得 ordering `P2` 与 consumer work。

**预期证据：** 两条 stream lanes、一个 event marker、一条 cross-stream edge、captured prefix，以及 explicit unordered-pair list。

**验收条件：** Graph ordering `P1` before `C1`，保留两条 stream chains，把 `P2` 排除在 captured generation 外，并说明 stream wait 不 block host。

<details><summary>提示 1</summary>在 record marker 处精确切开 producer lane。</details>

<details><summary>提示 2</summary>Wait 约束 consumer stream 中 wait call 之后的 work。</details>

## 练习 2：为一个 re-recorded event handle 标版本

**目标：** 跟踪一个 handle `E`：在 `P1` 后 record，发出 wait `W1`，在 `P2` 后 re-record，调用 query `Q2`，发出 wait `W2`，最后调用 synchronize `S2`。

**约束：** 用 teaching labels `E1`/`E2` 表示 captured states，不虚构两个 handles；每个 API call 绑定其 own call time 的 current event generation；re-record 后不得 retarget `W1`。

**预期证据：** Generation table、两条 wait edges、query/synchronize host semantics，以及各 generation 排除哪些 later producer work 的说明。

**验收条件：** `W1` 仍绑定 first captured state；later calls 使用 second state；query 保持 non-blocking；synchronize 在 host wait；任何 API 都不默默捕获 record point 后的 work。

<details><summary>提示 1</summary>每次 `cudaEventRecord` overwrite handle 时写一个新 state label。</details>

<details><summary>提示 2</summary>Wait 由 API-call time 选择 captured state，不由 eventual execution time 选择。</details>

## 练习 3：分开 dependency flags 与 timing endpoints

**目标：** 为 symbolic region 设计一个 dependency-only event 和两个 timing endpoints，再说明 query、synchronize、wait 与 elapsed time 的 valid uses。

**约束：** Dependency event 使用 `cudaEventDisableTiming`；`start`/`stop` 保持 timing-enabled；只给出 `elapsed_ms = timestamp(stop) - timestamp(start)`，不得给 numerical result。

**预期证据：** Three-event flag table、dependency graph、timing-bracket contract、completion precondition，以及 invalid elapsed use 的 expected error classification。

**验收条件：** Dependency event 可以 wait/query，却不能进入 `cudaEventElapsedTime`；elapsed calculation 前 stop event 已 complete；公式只命名 intended endpoints，且不作为 execution evidence。

<details><summary>提示 1</summary>Creation flags 是 event 的 type-like contract 一部分。</details>

<details><summary>提示 2</summary>先决定 endpoints 包围哪个 interval，再写 subtraction。</details>

## 下一步

完成后查看独立的[参考解答](/memory/event-dependencies-timing/solutions/)，修复[练习题库（Practice Bank）PB-R1-020](/practice/#pb-r1-020)，并在 [VIS07](/visuals/stream-event-dependencies/)比较 generations。
