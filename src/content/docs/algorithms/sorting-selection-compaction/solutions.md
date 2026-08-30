---
title: 'A09 复核解答：Flag Scan、Stable Bucket Rank 与 Production Decision'
description: 复核 stable compaction table、bounded-key movement、CUB/Thrust/custom decision packet、有效替代方案与常见错误。
pairId: a09-solutions
counterpart: /en/algorithms/sorting-selection-compaction/solutions/
factCheckDate: '2026-08-31'
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
unitId: A09-SOLUTIONS
prerequisites:
  - A09-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a09-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/sorting-selection-compaction/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/sorting-selection-compaction/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A09 Exercises](/algorithms/sorting-selection-compaction/exercises/)的独立解答。Tables 与 decision packet 都是静态 reasoning，不是 library execution 或 performance evidence。

## 解答 1：Stable compaction

Even flags 为 `[1,0,0,1,0,1]`。Exclusive positions 为 `[0,1,1,1,2,2]`。Indices 0、3、5 分别 scatter 到 0、1、2，因此 output 是 `[8,4,2]`。最后 `count=position[5]+flag[5]=2+1=3`。Prefix rank 按 input order 增加，证明 stability。

## 解答 2：Stable bounded-key movement

Histogram counts 是 `[2,2,2]`，exclusive starts 是 `[0,2,4]`。每项 within-bin ranks 依次为 `[0,0,0,1,1,1]`；加上对应 start 后 destinations 为 `[4,0,2,5,3,1]`。Scatter 后 keys 是 `[0,0,1,1,2,2]`，每个 equal-key pair 保持原先 index order。Histogram 与 starts 没有单独提供这些 ranks。

## 解答 3：Production decision

先冻结 stable key/value sort 与 stable predicate compaction。CUB path 检查 `DeviceRadixSort`/`DeviceSelect` 的 supported types、stability、temporary storage 与 stream；Thrust path 检查 iterator、execution policy、`stable_sort`/`copy_if` semantics；custom path 需要 API mismatch 或 correctness-qualified measured need，并承担版本、测试、调优与维护。没有 run，因此三个 performance cells 都是 `unrecorded`，不能排名。

## 有效替代方案

- 可输出 selected indices 而不是 values，只要 payload contract 明确。
- Unordered compaction 可使用 atomic slot allocation，但必须明确放弃 stability。
- Sorting 可采用 comparison-based vocabulary，而不是 bounded-key bins；复杂度与 API contract 要重新声明。
- Framework-managed primitive 可作为 production path，只要 exact component/backend 与 semantics 可记录。

## 常见错误

- 把 inclusive scan 当作 selected item 的 zero-based destination。
- 忘记最后一个 flag，得到错误 count。
- 认为 histogram 与 bin starts 已经决定每个 item 的 destination。
- 从 atomic uniqueness 推断 stable order。
- 把 temporary-storage size、API availability 或 source review当成 measured speed。
- 因为 custom code 更低层就默认它适合 production。

复核日期：**2026-08-31**。四个 evidence arrays 保持为空。
