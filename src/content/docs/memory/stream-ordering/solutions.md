---
title: 'M07 参考解答：绘制显式流顺序图'
description: M07 练习的 missing-edge repair、explicit-stream rewrite 与 order/eligibility classification。
pairId: m07-solutions
counterpart: /en/memory/stream-ordering/solutions/
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
unitId: M07-SOLUTIONS
prerequisites:
  - M07-EXERCISES
relatedUnits:
  - M07
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
    attrs: { name: 'cuda:pair-id', content: m07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M07,M08,VIS07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/stream-ordering/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些参考答案把 [M07 练习（Exercise）](/memory/stream-ordering/exercises/)解成 dependency graphs，不包含 device timeline 或 performance observation。

## 解答 1：找出缺失的 cross-stream edge

Initial graph 有两条 chain：

```text
stream_prepare: H2D(input) -> prepare_kernel
stream_consume: consume_kernel -> D2H(output)
```

只有两条 horizontal edge 得到 guarantee。因为 `consume_kernel` 读取 `prepare_kernel.output`，应使用 documented cross-stream dependency 添加 `prepare_kernel -> consume_kernel`。Repair 前，两个 kernels 对 graph 而言 unordered，consumer 可能过早 eligible。

## 解答 2：消除 default-stream ambiguity

未声明 mode 时，`K1 -> K0 -> K2` interpretation under-specified。Legacy mode 下，implicit default stream 可以与 `cudaStreamCreate` 创建的 blocking stream synchronize；per-thread mode 的关系不同。Stable rewrite 可命名 `stream_left` 与 `stream_right`，均以 `cudaStreamNonBlocking` 创建，deliberately 放置 operations，并只添加 algorithm 真正需要的 data dependencies。

Rewrite 删除 accidental legacy edge，但不声称 newly unordered operations 会同时执行。

## 解答 3：分类 order、eligibility 与 evidence

- 同一 stream 的 consecutive operations 有 guaranteed per-stream order。
- Different-stream operations 没有 edge 时 unordered。
- Documented cross-stream dependency ordering producer 与 dependent consumer。
- Host synchronization ordering host access 与该 boundary 覆盖的 work。
- Unordered pair 在 graph 下可以 eligible，但仍受其他 constraints。
- Side-by-side boxes 不建立 execution intervals。
- 创建 separate streams 不建立 simultaneous execution。
- Static graph 不产生 performance conclusion。

每项 accepted order claim 都指向 stream、dependency 或 host-boundary edge；更强的 execution claim 只能改写为 eligibility。

## 有效替代方案

- 若 serialization 符合 algorithm，可把 producer/consumer 放进一个 stream。
- 后续可用 event edge 选择性 ordering cross-stream work，而不是 device-wide host wait。
- 只有在 mode、stream flags 与 implicit edges 均明确声明并复核时，才保留 legacy default-stream design。

## 常见错误

- 把 host API-call order 当成 device-wide queue。
- 因两项 operation 位于不同 stream lanes 就称其 concurrent。
- 忘记 `cudaStreamCreate` stream 会与 legacy default stream interaction，除非创建为 non-blocking。
- 未记录 build configuration 就假设 per-thread default-stream mode。
- 只需一个 producer-consumer edge，却加入 device-wide wait。
- 把 dependency drawing 写成 performance result。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
