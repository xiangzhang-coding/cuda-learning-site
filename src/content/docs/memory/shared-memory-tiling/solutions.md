---
title: 'M03 参考解答：证明 Shared Tile 的阶段正确性'
description: M03 三道练习的 edge-tile trace、two-barrier repair 与 neutral/reuse proof obligations。
pairId: m03-solutions
counterpart: /en/memory/shared-memory-tiling/solutions/
factCheckDate: '2026-08-27'
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
unitId: M03-SOLUTIONS
prerequisites:
  - M03-EXERCISES
relatedUnits:
  - M03
  - EX06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M03,EX06' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/shared-memory-tiling/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [M03 练习（Exercise）](/memory/shared-memory-tiling/exercises/)的**参考解答**。这些 trace 证明 pseudocode contract，不证明 GPU scheduler 或 barrier 已被实际观察。

## 解答 1：跟踪一个 edge tile

| iteration | lanes 0..4 | lanes 5..7 | B1 participants | tile after B1 | B2 participants |
| --- | --- | --- | ---: | --- | ---: |
| `base = 0` | write `x0..x4` | write `x5..x7` | 8 | `[x0,x1,x2,x3,x4,x5,x6,x7]` | 8 |
| `base = 8` | write `x8..x12` | write `0,0,0` | 8 | `[x8,x9,x10,x11,x12,0,0,0]` | 8 |

第二轮 lanes 5..7 的 `load_valid` 为 false，但 participation 为 true。它们不读取越界 input，而是完成自己的 L write、到达 B1、按 output contract 选择是否 use/commit，再到达 B2。B2 完成后才允许任何 lane 开始下一次 L。

## 解答 2：修复 early return 与缺失 B2

```cpp
for (int base = 0; base < n; base += blockDim.x) {
  const int input_index = base + threadIdx.x;
  tile[threadIdx.x] = input_index < n ? input[input_index] : neutral;
  __syncthreads();

  if (output_index < n) {
    consume(tile);
  }

  __syncthreads();
}
```

- Conditional value selection removes out-of-bounds reads while retaining all participants.
- Every slot receives a defined value before B1, eliminating uninitialized edge slots.
- B1 prevents use from preceding peers' loads.
- Output guard controls commit/work only；it does not hide a barrier。
- B2 prevents a fast lane's next load from overwriting a value a slower lane still reads.
- Uniform `base` progression gives the block one barrier sequence.

## 解答 3：为 neutral 与 reuse 写 proof obligation

**Sum contract:** Domain 是 nonnegative 32-bit values，combine 是 addition，neutral `0` 满足 `x + 0 = x`。每个 valid output 的 declared window 读取具体 tile slots；invalid output 不 commit，但仍到达 B2。

**Max contract:** Domain 是 signed 32-bit values，combine 是 max，neutral `INT32_MIN` 满足 `max(x, INT32_MIN) = x`。若合法 domain 或 accumulator representation 排除这个 identity，合同必须改写 validity mask，不能默默替换。

Counterexample：合法 values `[-7,-3]` 配 neutral 0 会得到 0，而正确 maximum 是 -3，所以 “所有 edge slot 填 0” 错误。Reuse map 可以写成 `slot j -> outputs whose declared window includes base+j`；必须枚举 window rule，不能只写 “tile is reused”。

## 有效替代方案

- Edge validity 可以用并行 validity array 表示，而不是 neutral，前提是所有 readers 都检查它且 barriers 仍统一。
- Double buffering 可以改变 overwrite proof，但必须为每个 buffer 明确 ownership 与 reuse barrier；它不属于本题最小答案。
- 一轮、没有 overwrite 的 kernel 可以没有 B2，但必须证明 control flow 确实不会重用同一 storage。
- `cooperative_groups::thread_block` barrier 可表达 block synchronization，但 M03 portable baseline 的语义 proof 仍需完整，且不能引入更窄 scope 猜测。

## 常见错误

- 把 `load_valid = false` 当成可以不参加 barrier。
- 只为 valid lanes 写 tile，使 edge slots 未定义。
- 把 B1 放进 output/input predicate，或用 early return 穿过 barrier sequence。
- 认为 B1 也自动阻止下一轮 overwrite，遗漏 B2。
- 对 max、min 或 product 未验证 identity 就统一填 0。
- 从 pseudocode、shared reuse count 或 host trace 声称 transaction reduction 或 speedup。

复核日期：**2026-08-27**。Compilation 与 runtime evidence axes 保持为空。
