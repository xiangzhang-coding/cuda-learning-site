---
title: 'M06 参考解答：用显式线程束掩码推理'
description: M06 练习的 branch-mask trace、两种 explicit warp-exchange repair，以及 source/schedule classification。
pairId: m06-solutions
counterpart: /en/memory/warp-divergence-reconvergence/solutions/
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
unitId: M06-SOLUTIONS
prerequisites:
  - M06-EXERCISES
relatedUnits:
  - M06
  - VIS03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M06,VIS03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/warp-divergence-reconvergence/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些参考答案把 [M06 练习（Exercise）](/memory/warp-divergence-reconvergence/exercises/)解成 source-level proof；explanatory order 不是 captured hardware schedule。

## 解答 1：跟踪两条 branch mask 与后续 collective

| lane | `lane < 3` | region |
| ---: | --- | --- |
| 0, 1, 2 | true | `A` |
| 3, 4, 5, 6, 7 | false | `B` |

对 eight-lane teaching subset，`A` 包含 lanes `{0,1,2}`，`B` 包含 `{3,4,5,6,7}`，`C` 包含 `{0,1,2,3,4,5,6,7}`。`C` 的 collective participation set 为全部八个 lanes，因为 algorithm 明确需要它们，而不是因为某个 branch 查询了 current activity。Portable trace 不规定 `A`/`B` 谁先 issue，也不规定 instructions 如何 interleave。

## 解答 2：修复 implicit-lockstep exchange

缺失 relation 是 `write shared[lane] -> warp synchronization -> peer read`。一种 static repair 是：

```text
participants = mask naming lanes 0..7
shared[lane] = value
__syncwarp(participants)
if lane > 0: consume shared[lane - 1]
```

Register alternative 使用带同一 participant mask 的 synchronized shuffle operation。Lanes 1 到 7 分别请求 valid source lanes 0 到 6 的 value；lane 0 不消费 predecessor。Collective contract 替代 shared-memory exchange，但 mask 与 source-lane proof 仍不可省略。

## 解答 3：区分 source fact 与 schedule guess

1. **分类：source guarantee（源码保证）。** 计算 `lane < 3` 后，lanes 0 到 2 为 true，lanes 3 到 7 为 false；这是逐 lane 的 source fact。
2. **分类：source guarantee（源码保证）。** 在题设的 eight-lane fixture 中，`0x07 & 0xf8 == 0` 且 `0x07 | 0xf8 == 0xff`，所以两个 masks 互不重叠并完整覆盖参与者。
3. **分类：source guarantee（源码保证）。** 每个 lane 只走一条 scalar branch，并保留该 branch 写入的 `result`；这个结论不需要任何 cross-lane schedule claim。
4. **分类：rejected claim（拒绝该说法）。** Closing brace 只表示 control flow，不等同于 `__syncwarp`；algorithm 需要同步时必须加入 documented synchronization operation。
5. **分类：rejected claim（拒绝该说法）。** `C` 是 common source successor，但这不能建立一个 current active mask，也不能证明所有 lanes 同时执行一个 dynamic instruction instance。只能说每个尚未退出的 lane 最终沿 source path 到达 `C`。
6. **分类：rejected claim（拒绝该说法）。** Source-level join 不提供 memory-visibility edge。Cross-lane communication 必须使用具备所需 participants 与 scope 的 documented synchronization 或 memory-model relation。
7. **分类：API guarantee（API 保证）。** 当 `0xff` 命名的每个 non-exited lane 都按要求执行 `__syncwarp(0xff)` 时，该 intrinsic 为这些 lanes 提供 documented synchronization semantics。
8. **分类：rejected claim（拒绝该说法）。** `__activemask()` 报告调用当下 active 的 lanes，不能重建 earlier pre-branch group；应在 divergence 前计算或保存 intended participation mask。
9. **分类：unknown implementation detail（未知实现细节）。** Programming model 不规定 true path 与 false path 的 exact issue order；portable account 必须允许任一路径先 issue。
10. **分类：unknown implementation detail（未知实现细节）。** CC 7.0+ Independent Thread Scheduling 允许 per-thread execution state 与 sub-warp regrouping，但 source code 不能确定 exact instruction interleaving 或 timing。

## 有效替代方案

- Cooperative-groups tile 可以命名 participants，前提是 construction 与 collective contract 匹配 algorithm。
- 若 algorithm 确实排除其他 lanes，且每个 named lane 遵守 operation contract，更小 mask 可以合法。
- Shared-memory protocol 可以有多个 synchronized phases；每个 phase 都需要自己的 participant 与 visibility proof。

## 常见错误

- 不考虑调用位置，直接把 `__activemask()` 当作 intended group。
- Collective mask 命名未到达 operation 的 lanes。
- 从 inactive 或 invalid shuffle source lane 读取。
- 把 closing brace 当作 warp barrier。
- 图中先画 path A，再把这个画法升级成 hardware schedule。
- 认为 CC 7.0+ 消除了 explicit warp-safe reasoning 的需求。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
