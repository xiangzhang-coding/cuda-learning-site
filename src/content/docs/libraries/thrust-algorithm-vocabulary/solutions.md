---
title: 'L02 复核解答：Thrust 算法与迭代器组合'
description: 复核 stage naming、virtual segmented keys、stream dependencies、有效替代方案与常见 composition errors。
pairId: l02-solutions
counterpart: /en/libraries/thrust-algorithm-vocabulary/solutions/
factCheckDate: '2026-09-04'
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
unitId: L02-SOLUTIONS
prerequisites:
  - L02-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l02-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/thrust-algorithm-vocabulary/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L02-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/thrust-algorithm-vocabulary/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [L02 练习](/libraries/thrust-algorithm-vocabulary/exercises/)的独立参考解答与复核记录，只复核 contracts。不存在 displayed implementation、local API check、compilation、execution、allocation path 或 timing。

## 解答 1：三个具名 stage

Stage one 是 `N` 个 FP32 inputs 到 `N` 个 square outputs 的 `thrust::transform`，允许 exact in-place，不允许其他 partial overlap；它保留 A01 ownership/callable contract。Stage two 是对 `N` values 加法的 `thrust::inclusive_scan`，支持 exact in-place，并用 tolerance 接受合法 parallel floating-point ordering；它保留 A03 prefix/numerical contract。Stage three 是对 `N` mutable prefix keys 与 `N` nonoverlapping records 执行 `thrust::stable_sort_by_key`，comparator 满足 strict weak ordering；它保留 A09 movement/stability contract。一个 compatible policy、stream、extent 与 lifetime ledger 连接三个 stage。没有 backend、kernel count、fusion、traffic 或 performance result。

## 解答 2：Virtual segmented keys

用 unit-stride `cuda::counting_iterator` 表示 indices，用 `cuda::transform_iterator` 让 callable 按 value 返回 `index/4`。Virtual key range 与 value range 都恰好覆盖 `N`；explicit device policy 或 iterator systems 必须与 consumer 一致。Base iterator 与 callable state 必须在消费完成前有效。Materialized `N`-element key array 是有效 fallback。Virtual form 在 logical composition 中省略 stored intermediate，但不证明更少 device transactions、一个 fused kernel 或 speedup。根据 #10965 避免 legacy optional-stride factory；任何 zip composition 都必须声明 equal extents。

## 解答 3：Stream dependency graph

先在 stream A enqueue no-sync transform，再在 stream A enqueue scan；enqueue order 提供这条 edge。Scan 后记录 event E；stream B consumer 前 wait E。Host access 与释放任何 input、temporary 或 output allocation 前，记录或同步 final consumer completion。后续 synchronization 可能暴露 deferred errors。两种 invalid schedule 是：stream-B consumer 没有 wait 就启动，以及 `par_nosync` 返回后立即释放 allocation。该 graph 不需要 device-wide barrier，但 static graph 不是 observed execution。

## 有效替代方案

- 当 materialized squared/key range 简化 ownership、debugging 或 repeated use 时，保留它。
- 当 host readiness at return 属于所选合同，使用 explicit synchronized CUDA policy。
- 当所有 iterator systems 有意兼容且已记录时，使用 policy-free dispatch。
- 当 equivalent-record order 明确无关时，选择 unstable `sort_by_key`。

## 常见错误

- 把 Thrust name 当作 range、numerical、stability 或 lifetime contracts 的替代品。
- 假设 `par_nosync` 永不同步，或返回就能安全 host access。
- 混用 host/device iterator systems 并期待自动迁移。
- 期待 zip 停在最短 component，或从 transformed temporary 返回 reference。
- 把选定 3.4 deprecations 泛化到每个 fancy iterator。
- 从 virtual range 或 owner test 推断 fusion、traffic reduction 或 speedup。

复核日期：**2026-09-04**。四个 evidence arrays 仍为空。
