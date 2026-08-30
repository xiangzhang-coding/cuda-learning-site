---
title: 'A02 复核解答：Reduction Stages 与 Operation Order'
description: A02 三道练习的 partial trace、uniform-barrier repair、floating-point decision contract、有效替代方案与常见错误。
pairId: a02-solutions
counterpart: /en/algorithms/multi-stage-reduction/solutions/
factCheckDate: '2026-08-30'
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
unitId: A02-SOLUTIONS
prerequisites:
  - A02-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a02-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/multi-stage-reduction/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A02-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/multi-stage-reduction/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A02 练习（Exercise）](/algorithms/multi-stage-reduction/exercises/)的独立复核解答。多阶段归约（multi-stage reduction）tables、pseudocode 和 floating-point reasoning 都是静态 review artifacts；没有 GPU execution，也没有 compilation、runtime 或 performance evidence。

## 解答 1：跟踪两个 blocks 与最终 partial

第一 block 的 shared tree：

| phase | active-lane outputs | barrier participants |
| --- | --- | ---: |
| guarded load | `[1,2,3,4,5,6,7,8]` | 8 |
| stride 4 | `[6,8,10,12]` | 8 |
| stride 2 | `[16,20]` | 8 |
| stride 1 | `[36]` | 8 |

第二 block 的 invalid lanes 5..7 写 identity：

| phase | active-lane outputs | barrier participants |
| --- | --- | ---: |
| guarded load | `[9,10,11,12,13,0,0,0]` | 8 |
| stride 4 | `[22,10,11,12]` | 8 |
| stride 2 | `[33,22]` | 8 |
| stride 1 | `[55]` | 8 |

第一 kernel 写 global partial array `[36,55]`。第二 kernel 把其余 shared slots 填 0，先发布完整 slots，再由 lane 0 在相应 tree 中得到 `36 + 55 = 91`。Inactive lanes 在每个 stage 的 combine action 为空，但 barrier participation 仍为 true。

## 解答 2：修复 inactive-lane early return 与 conditional barrier

```text
value = input[global_index] if global_index < n else identity
shared[tid] = value
__syncthreads()

stride = block_size / 2
while stride >= 1:
  if tid < stride:
    shared[tid] = combine(shared[tid], shared[tid + stride])
  __syncthreads()
  stride = stride / 2

if tid == 0:
  global_partials[blockIdx.x] = shared[0]
```

- Value selection removes the out-of-bounds load without removing a barrier participant。
- Every lane defines one shared slot, so the initial barrier publishes a complete stage 0。
- The active predicate encloses only the combine；the barrier is uniform across the block。
- Each barrier orders a stage write before the next stage reads that slot。
- Lane 0 stores only after the declared final stage；no block claims a partial early。

这份教学 baseline 保留每轮统一 barrier。更窄的 group 或最后阶段优化需要单独 proof，不能从这份答案偷偷推导。

## 解答 3：声明 floating-point order 与 production decision

Parentheses 是：

```text
serial: (((1e20f + 1.0f) + -1e20f) + 1.0f)
tree:   (1e20f + 1.0f) + (-1e20f + 1.0f)
```

在声明为 binary32、round-to-nearest 的 expected reasoning 中，两个 `1.0f` 都可能在与大数相加时丢失。Serial path 先抵消大数后再加最后一个 1，常见推导为 1；adjacent-pair tree 的两个 pair 先丢失小量，再相加为 0。这个 ledger 说明 operation order 能改变 rounding path；它不是某个 compiler/GPU run 的 recorded observation。

Production decision table 应至少包含：

| gate | CUB `DeviceReduce` | hand-written teaching path |
| --- | --- | --- |
| result contract | 同一 inputs、type、operation、reference、tolerance | 必须完全相同 |
| source role | production baseline | learning artifact 或已说明的特殊需求 |
| evidence | 记录 exact CCCL/Toolkit、Environment Manifest 与 output | 记录 exact custom source、相同 environment 与 output |
| measurement | correctness gates 通过后使用同一 boundary | 只有同一 boundary 才可比较 |

若两者都通过 acceptance rule，再记录 operation order 与 observed results。不能复制 CUB implementation，也不能因 handwritten source 显示了 tree 就预先宣布性能优势。

## 有效替代方案

- Exercise 1 可以使用 adjacent-pair tree；partial 仍应为 36、55 和 91，但必须重新画 operation order。
- Cooperative Groups 的显式 group collective 可以替代表达方式，前提是 participant set 和 synchronization contract 完整。
- Warp shuffle 可用于已证明的 warp-sized tail，但不能让未命名 lanes 或 masks 消失。
- Widened accumulator、compensated summation 或固定 tree 可改变 numerical contract；它们都需独立 reference 与 acceptance policy。
- Production 直接保留 CUB `DeviceReduce` 是有效结论；没有 custom-kernel requirement 时无需制造一个。

## 常见错误

- Invalid lane 在初始 barrier 前 return，导致 participation 不完整。
- 只让 active lanes 执行 `__syncthreads()`，形成 conditional barrier。
- 忘记 invalid shared slots 的 identity，后续 stage 读取未定义值。
- 用 block barrier 假装不同 blocks 已经 grid-wide synchronized。
- 把 tree floating-point result 与 serial bit pattern 不同直接判错或直接放行，没有 tolerance contract。
- 把 CUB 写成 A02 prerequisite，或从 CUB source 复制 implementation 作为教学答案。
- 从 diagram、operation count 或 source shape 声称 custom reduction 更快。

复核日期：**2026-08-30**。四个 evidence arrays 与对应 head metadata 均保持为空。
