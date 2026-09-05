---
title: 'L04 复核解答：选择 CUB Warp 与 Block Primitives'
description: 复核 logical-warp outputs、partial block reduction、blocked-array scan、有效替代方案与常见 collective errors。
pairId: l04-solutions
counterpart: /en/libraries/cub-warp-block-primitives/solutions/
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
unitId: L04-SOLUTIONS
prerequisites:
  - L04-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l04-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cub-warp-block-primitives/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L04-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cub-warp-block-primitives/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [L04 练习](/libraries/cub-warp-block-primitives/exercises/)的独立 reference，只复核 selection 与 contracts。它不提供 CUDA/C++ implementation、compile、execution、output 或 performance observation；四个 evidence arrays 仍为空。

## 解答 1：8-lane groups 的两种 outputs

**复核结论：** 请求 A 选择 `cub::WarpReduce<T, 8>`；每个连续 8-lane logical warp共同调用，只在 logical lane 0 消费 sum。请求 B 选择 `cub::WarpScan<T, 8>` 的 inclusive form 和 aggregate overload；每个 lane 取得自己的 prefix，group aggregate 对每个 participating lane 有效。四个同时活动 groups 各有独立 `TempStorage` slot。

Partial round 仍由全部 32 lanes 参与，而且 calling hardware warp 中的四组共同使用 `valid_items = 5`；每组前五项贡献。Scan 使用对应 partial form，invalid outputs 保持 unmodified。不能让同一 physical warp 的 sibling groups 在一次 call 中传入不同 counts。Reuse/repurpose 每个 slot 前，准确的八 lane mask共同执行 `__syncwarp(mask)`。该 protocol 没有性能结论。

## 解答 2：2D block partial reduction

**复核结论：** 选择形状与 launch 对齐的 `cub::BlockReduce<T, 16, Algorithm, 8, 1>`，并调用带 `num_valid = 93` 的 single-item `Sum` 或 generic `Reduce` overload。Row-major rank 是 `x + 16 * y`；前 93 ranks贡献，全部 128 threads参与。只有 linear thread 0 消费 aggregate。

Repeated-order requirement 排除 `BLOCK_REDUCE_WARP_REDUCTIONS_NONDETERMINISTIC`。`BLOCK_REDUCE_WARP_REDUCTIONS` default 或满足 operation constraints 的 raking variant 都是语义上有效候选，最终选择还需 exact type/operation compilation 与 measurement；本题不排名。Reuse `TempStorage` 前整个 block 执行 `__syncthreads()`。

## 解答 3：Blocked-array exclusive scan

**复核结论：** 选择 `cub::BlockScan<T, 128>` 的 array `ExclusiveSum` aggregate overload。Thread `t` 的 local item `j` 对应 logical index `4t + j`，所以 thread 0 得到 offsets 0 至 3 对应的 prefixes，thread 127 得到 offsets 508 至 511 对应的 prefixes。Local input/output arrays 可 alias，zero-initialized value必须是加法 identity。

全部 128 threads参与，512 个 per-item outputs 各自在 owner thread 有效，`block_aggregate` 对所有 threads 有效。默认 `BLOCK_SCAN_RAKING`、`BLOCK_SCAN_RAKING_MEMOIZE`或 shape-supported `BLOCK_SCAN_WARP_SCANS`可以进入后续验证，但名字不建立 winner。把 shared region 交给 following collective 前需要 `__syncthreads()`。

## 有效替代方案

- 如果每个 8-lane group 只需要 leader aggregate，不请求 prefixes，保留 warp reduction；如果 downstream 每个 lane 都需要 prefix，则不要用 leader broadcast 冒充 scan。
- 对 block tail，可以在 operation 有已证明 identity 时构造 guarded full tile；若 generic operation 没有 identity，改用有 explicit partial contract 的 abstraction。
- Explicit `TempStorage` 可为每组分配独立对象，也可在 nonoverlapping phases 通过 union 复用；后者必须保留正确 warp/block barrier。
- 若所需 group 是 runtime-selected arbitrary lanes 而非 CUB logical warp，先用 M12 的 group abstraction重新定义 contract，而不是伪造 `LogicalWarpThreads`。

## 常见错误

- 只让 valid-data threads 调用 collective，导致 required participants 缺席。
- 在所有 lanes 读取 WarpReduce/BlockReduce return，或只在 leader 读取 scan outputs。
- Launch shape 与 block template dimensions 不一致，或把 striped values 当作 blocked arrangement。
- 多个 live logical warps alias 同一 `TempStorage`，或在 reuse 前省略 `__syncwarp(mask)`/`__syncthreads()`。
- 认为内部 barrier 自动覆盖 following shared-memory consumer 的 publication edge。
- 把 `valid_items`/`num_valid`当作 participant count，而不是 contributor count。
- 选择 nondeterministic BlockReduce variant 后仍声称 repeated operation order，或从任何 variant name 推断 speedup。
- 把 owner tests 或 VIS10 解释为本站 compile/runtime evidence。

复核日期：**2026-09-05**。四个 evidence arrays 保持为空。
