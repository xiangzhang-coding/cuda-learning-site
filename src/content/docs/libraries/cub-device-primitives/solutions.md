---
title: 'L03 复核解答：选择 CUB Device Primitives'
description: 复核 scalar reduction、exclusive offsets、cross-stream inclusive prefixes、有效替代方案与常见 device-primitive errors。
pairId: l03-solutions
counterpart: /en/libraries/cub-device-primitives/solutions/
factCheckDate: '2026-09-05'
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
unitId: L03-SOLUTIONS
prerequisites:
  - L03-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l03-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cub-device-primitives/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L03-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cub-device-primitives/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [L03 练习](/libraries/cub-device-primitives/exercises/)的独立 reference。它复核 primitive selection 与 contracts，不提供第二份 EX17 implementation。没有 CUDA/C++ source、local compile、execution、output、allocation observation 或 timing；四个 evidence arrays 仍为空。

## 解答 1：一个 FP32 aggregate

**复核结论：** 选择 `cub::DeviceReduce::Sum`。它用零初值归约全部 `N` 项，并只向 nonoverlapping `d_out` 写一个 aggregate。先以 `nullptr` 查询 bytes，再分配 scratch，最后在 `stream_reduce` 上用相同 overload、types、current device 与 problem configuration 执行。Input、output 和 scratch 保持有效，直到 stream completion；host read 位于该边之后。

Numerical packet 要求 problem-specific tolerance，并把三件事分开：bundled CUB 1.15.1、2.8.2、3.3.4 与 selected 3.4.2 的传统 `DeviceReduce::Sum` 都记录 same-GPU run-to-run determinism；并行结果不必等于 serial left fold；不同 compute capability 不承诺同一 bits。Static answer 没有产生一项 runtime observation。

## 解答 2：Exclusive offsets

**复核结论：** 选择 `cub::DeviceScan::ExclusiveSum`。逻辑结果是 `y[0] = 0`，且 `y[i]` 只包含 `x[0]` 到 `x[i-1]`。`N` inputs 对应 `N` outputs。Ranges 可以 exact in-place，也可以完全 disjoint，不能 partial overlap。Query 与 execute 的 `NumItemsT`、iterator types、operation、problem size 和 current device 必须一致；任何变化都重新查询。

32-bit 或 64-bit 选择只有配合 declared maximum prefix 和无溢出证明才成立。把 output 改宽并不自动改变内部 accumulation contract，不能代替 range analysis。正确零 identity 与无溢出前提下，integer addition 要求 exact prefix results；这保留 EX17 的 exact `uint32_t` scan acceptance，但不声称发生过 GPU run。Query 写 byte count 且不执行 GPU work。

## 解答 3：跨流 Inclusive prefixes

**复核结论：** 选择 `cub::DeviceScan::InclusiveSum`，因为 `y[i]` 必须包含 `x[i]`。传统 query 完成并分配 scratch 后，在 `stream_prefix` enqueue execution；紧接着在同一 stream record event E。`stream_consume` 在 consumer 前 wait E。Final consumer completion 之后才允许 host observation，以及 input、output、scratch 的释放或无序复用。

这份 selection 对 bundled CUB 1.15.1/2.8.2/3.3.4 和 selected 3.4.2 使用共同的传统 API。对于 FP32 pseudo-associative scans，CUB 1.15.1 记录带 cross-compute-capability caveat 的 same-GPU run-to-run determinism；2.8.2、3.3.4 与 selected 3.4.2 记录 possible run-to-run variation。每一行仍应用自己的 numerical acceptance rule。Event graph 建立 ordering，不证明 observed output、overlap 或 performance。

## 有效替代方案

- 当调用方需要 custom associative operation 或显式 initial value 时，选择对应 generic `DeviceReduce::Reduce` 或 `DeviceScan` scan form，并重新审查其 exact contract；它们不改变本题答案。
- Scan 可以 exact in-place，也可以为简化 ownership/debugging 保留 disjoint output。
- Cross-stream consumer 可以改放到 producer stream，利用 stream order；如果保持两条 streams，event dependency 更精确，device-wide synchronization 也正确但通常扩大了 boundary。
- 只面向 independent CCCL 3.4.x 的新项目可以单独评估 environment overload；跨本题 bundle matrix 的 EX17 仍保留传统 form。

## 常见错误

- 为一个 scalar 选择 scan，或为 `N` 个 prefixes 选择 reduction。
- 把 query call 记成一次 execution，或改变 `NumItemsT`/device 后沿用旧 byte count。
- 让 reduction output 落入 input range，或把 scan 的 partial overlap 误当作 in-place。
- 在 API 返回后立即读取 output、释放 scratch，或让另一 stream 无依赖地复用 scratch。
- 拒绝 inspected CUB 1.15.1 scan guarantee、把它继承到 2.8.2/3.3.4/3.4.2 scan rows，或把任何 same-GPU guarantee 扩展成 serial/cross-GPU equality。
- 从 owner tests、API availability 或 version matrix 推断本站 compile、runtime 或 speedup evidence。

复核日期：**2026-09-05**。四个 evidence arrays 保持为空。
