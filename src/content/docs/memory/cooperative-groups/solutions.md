---
title: 'M12 参考解答：让同步组可组合'
description: M12 练习的 reviewed helper、tile-collective、dynamic-set 与 cooperative-grid contracts。
pairId: m12-solutions
counterpart: /en/memory/cooperative-groups/solutions/
factCheckDate: '2026-08-29'
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
unitId: M12-SOLUTIONS
prerequisites:
  - M12-EXERCISES
relatedUnits:
  - M12
  - M13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m12-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M12-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M12-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M12,M13' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/cooperative-groups/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [M12 练习（Exercise）](/memory/cooperative-groups/exercises/)解答为 static contracts。它们不包含 compiler output、device query、occupancy result、launch record 或 collective observation。

## 解答 1：暴露 helper 的 group contract

一种 reviewable interface 是：

```cpp
template <class Group>
__device__ void publish_then_sync(const Group& group, int* shared_value, int value) {
  if (group.thread_rank() == 0) *shared_value = value;
  group.sync();
}

cg::thread_block block = cg::this_thread_block();
publish_then_sync(block, &shared_value, value); // reached by the full block
```

Handle 是 `block`；membership 是该 block 全部 threads；synchronization/shared-memory visibility scope 是 block group；每个 block member 都参与。Rank zero 是 sole writer，reads 只发生在 helper sync 后。Caller 可以在 call 后 branch，但用 partial-block branch 包围 call 会违反 helper contract。

## 解答 2：修复 partition 与 collective contracts

在 divergent control 前构造 tile：

```cpp
cg::thread_block block = cg::this_thread_block();
auto tile = cg::tiled_partition<32>(block);
int result = cg::reduce(tile, value, cg::plus<int>());
```

所有 parent-block members 参与 partition，并得到自己的 tile handle。每个 tile 内所有 members 执行同一 reduce instance。Argument review 是：

| Argument | Group-wide rule |
| --- | --- |
| `tile` | 对该 collective participants 使用同一 tile instance |
| `value` | 可以不同；明确表示每 thread contribution |
| `cg::plus<int>()` | participants 使用同一种 reduction operation |

若只有 selected tiles 执行 later noncollective work，可以在 reduce 后 branch，或安排 whole tile 参与的 separate control path。Implicit warp lockstep 既不能修复 collective construction，也不能修复 argument disagreement。

## 解答 3：分开 dynamic set 与 gated grid

`coalesced_threads()` 从 active threads 创建 point-specific group。它不保证 32 members、particular active subset 或 persistent coalescing。该 handle 是 collective 的 authority；control flow 后的 later call 可能发现 different membership。

Current single-device grid-sync checklist 是：

1. 检查 `cudaDeviceGetAttribute` return，并要求 `cudaDevAttrCooperativeLaunch` nonzero。
2. 根据 occupancy/multiprocessor count 计算或以其他方式验证 cooperative grid block-count limit。
3. 使用 `cudaLaunchCooperativeKernel`，不能使用 ordinary launch。
4. 构造 grid group，并保证全部 grid threads 到达每个 `grid.sync()` instance。
5. 在 declared boundaries 检查 launch/completion errors。

CUDA 13 移除了 archived multi-device Cooperative Groups launch/synchronization path。12.9.1/11.8.0 records 是 historical comparisons，不能满足 current checklist。

## 有效替代方案

- 当同一 explicit handle/participation contract 仍 visible 时，用 `cg::sync(group)` 代替 `group.sync()`。
- 当 narrower accepted scope 更难误用时，为 `thread_block` 或 `thread_block_tile<N>` specialize helper。
- Fixed membership 是 actual algorithm requirement 时，使用 static tile，不用 `coalesced_threads()`。
- Kernel-completion boundary 比 cooperative grid gate 更合适时，把 algorithm 分为多个 ordinary kernels。

## 常见错误

- 在没有 caller-participation contract 的 helper 中隐藏 block-wide collective。
- 从 partial branch partition parent group。
- 只让部分 members 调用 collective instance。
- 要求 per-thread reduce values 相等，却允许 operation selector 不同。
- 把 coalesced group 当作 permanent 32-thread warp。
- Ordinary launch 后或没有 support/size gate 时调用 grid sync。
- 把 deprecated archive multi-device path 复制进 CUDA 13 design。

复核日期：**2026-08-29**。Compilation 与 runtime evidence axes 保持为空。
