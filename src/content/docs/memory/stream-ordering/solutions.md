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

1. **分类：guaranteed order（有保证的顺序）。** Exact support 是 per-stream edge `A -> B`：`A` 完成后 `B` 才开始。
2. **分类：unsupported execution claim（不受支持的执行说法）。** Host submission order 本身不会增加 cross-stream device edge。修正后应写成：若没有 documented dependency，`A` 与 `X` 保持 unordered。
3. **分类：guaranteed order（有保证的顺序）。** `B` 后的 record 与 `C` 前的 wait 共同建立 documented event edge `B -> C`；该结论不扩展到 unrelated work。
4. **分类：unordered（无既定顺序）。** Graph 中没有 edge ordering `B` 与 `X`，所以不能推导 `B -> X` 或 `X -> B`。
5. **分类：guaranteed order（有保证的顺序）。** `cudaStreamSynchronize(stream_right)` 成功返回后，随后的 host read 位于该 stream 此前 work（包括 `C`）完成之后；这不是对 unrelated streams 的 blanket claim。
6. **分类：unsupported execution claim（不受支持的执行说法）。** Side-by-side boxes 只表达 graph placement，不是 measured execution intervals。修正后只能称 `B` 与 `X` unordered 或 potentially eligible。
7. **分类：unsupported execution claim（不受支持的执行说法）。** Separate streams 允许 independent scheduling，但不保证 simultaneous execution。修正后只能说 graph 没有 serializing `B` 与 `X`。
8. **分类：eligible under the graph（依赖图允许进入执行资格）。** 各自 predecessors 满足后，graph 可以让两项 operation 同时具备 eligibility，但仍受其他 constraints。Performance clause 必须拒绝：eligibility 既不是 observed overlap，也不是 improvement evidence。

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
