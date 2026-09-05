---
title: 'L04 练习：选择 CUB Warp 与 Block Primitives'
description: 为 logical-warp outputs、partial block reduction 与 blocked-array scan 选择 collectives，并审查参与者、TempStorage、同步、布局和确定性。
pairId: l04-exercises
counterpart: /en/libraries/cub-warp-block-primitives/exercises/
factCheckDate: '2026-09-05'
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
unitId: L04-EXERCISES
prerequisites:
  - L04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l04-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cub-warp-block-primitives/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L04 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cub-warp-block-primitives/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [L04](/libraries/cub-warp-block-primitives/)。三项任务都产出 static primitive-selection packet，不展示、编译或运行 CUDA/C++；四个 evidence arrays 保持为空。

## 作答说明

候选范围只有 `WarpReduce`、`WarpScan`、`BlockReduce` 与 `BlockScan`。每题先声明 scope、participants 和 output shape，再选择 primitive、overload 与 algorithm requirement。必须同时审查 `TempStorage` slot、reuse barrier、row-major/blocked layout、partial-valid contract 与 output validity。打开[独立复核解答](/libraries/cub-warp-block-primitives/solutions/)前不要寻找实现答案。

## 练习（Exercise）1：为 8-lane logical groups 选择两种 output shape

**目标：** 一个 physical warp 被划成四个连续 8-lane groups。请求 A 每组只要一个 sum；请求 B 每个 lane 都要 inclusive prefix，并让每组所有 lanes 取得 group aggregate。分别选择最窄的 warp collective。

**约束：** `LogicalWarpThreads` 固定为 8；每个 group 的所有 8 lanes 共同调用，且同时活动的 groups 不 alias `TempStorage`。声明 request A/B 的 output-validity set、reuse 前的准确 `__syncwarp(mask)` participant set，以及另一轮中四个 groups 都只有前 5 个 items 有效时的处理；同一 calling hardware warp 不得提交彼此不同的 `valid_items`。

**预期证据：** 两行 selection table、四组 participant masks、TempStorage slot map、full/partial validity ledger、output-reader set 与 reuse phase edge。

**验收条件：** 一种选择只授权 logical lane 0 读取 scalar；另一种为每个 participating lane 产生 prefix，并把 requested aggregate 提供给整组；partial round 中所有 32 callers 对 count 一致，无效 inputs 不进入 operation；所有 required lanes 仍参与；每个 live group 使用独占 scratch，且没有 performance claim。

<details><summary>提示 1</summary>先画 output cardinality：每组一个值与每 lane 一个值是不同 collective contract。</details>

<details><summary>提示 2</summary>再把“谁必须调用”“谁贡献有效 input”“谁可读取 output”画成三个集合，它们不一定相同。</details>

## 练习 2：选择 2D block 的 partial reduction

**目标：** Launch shape 为 `16 x 8 x 1`，只有 row-major 前 93 个 threads 拥有有效整数，每个有效 thread 提供一个 item；选择产生一个 block aggregate 的 primitive 与 partial overload。

**约束：** Template shape 必须与 launch 完全匹配；整个 128-thread block 到达 collective。只允许 row-major 前缀参与数据，结果只由 documented reader 消费。Requirement 要求相同输入的 repeated kernel invocations 保持 reduction order，因此不得选择明确放弃该 guarantee 的 algorithm variant。

**预期证据：** Template/launch equality、row-major rank formula、participant-versus-contributor sets、output-validity rule、algorithm requirement、TempStorage ownership 与 reuse barrier。

**验收条件：** 93 个 contributors 与 128 个 callers 被分开；未初始化的 invalid input 不进入 operation；只有一个 documented thread 消费结果；shared storage 在全 block phase edge 前不复用；不选择明确声明 variable order 的 variant，且不把其他 variant 扩展成未经证实的强 determinism 或速度主张。

<details><summary>提示 1</summary>把 `(x,y,z)` 转成 linear rank 后，才能精确定义“前 93 个”。</details>

<details><summary>提示 2</summary>确定 contributor set 后，再检查哪种 overload表达 count，以及 algorithm name 是否改变 operation-order guarantee。</details>

## 练习 3：选择 blocked-array exclusive scan

**目标：** 一个 128-thread 1D block 中每个 thread 持有 4 个连续 counts；需要按完整 512-item logical sequence 生成 exclusive offsets，并让所有 threads 取得 tile aggregate。

**约束：** 输入必须是 row-major blocked arrangement；每个 thread 的四项在 global sequence 中连续。整个 block调用，output 可与 local input arrays alias。指定 zero identity、per-item output validity、aggregate validity、algorithm family requirement，以及把同一 shared region 交给 following collective 前的 barrier。

**预期证据：** 512-item index mapping、primitive/overload selection、first/last-thread output semantics、aggregate-reader set、TempStorage phase diagram 与不含 timing 的 variant rationale。

**验收条件：** Logical index `4 * thread + local_item` 的 exclusive prefix 正确；512 个 outputs 分布回各 thread；aggregate 对所有 block threads 有效；following storage use 位于 full-block barrier 后；没有把 striped layout 当成 blocked，也没有从 variant 名字推断 winner。

<details><summary>提示 1</summary>先按 thread rank，再按 local item index 展开前八个 logical positions。</details>

<details><summary>提示 2</summary>确认 arrangement 后，再分别标出 per-item outputs、tile aggregate 和 scratch reuse 的三个 phase boundaries。</details>

## 下一步

查看[独立复核解答](/libraries/cub-warp-block-primitives/solutions/)，再完成 [PB-R4-004](/practice/#pb-r4-004)，并继续只复用 [VIS10](/visuals/reduction-stages/)。
