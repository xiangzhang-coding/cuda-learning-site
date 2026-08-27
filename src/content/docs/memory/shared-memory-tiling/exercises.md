---
title: 'M03 练习：证明 Shared Tile 的阶段正确性'
description: 用三道任务跟踪 edge tile、修复 barrier divergence，并为 neutral value 与 loop reuse 写出 invariant proof。
pairId: m03-exercises
counterpart: /en/memory/shared-memory-tiling/exercises/
factCheckDate: '2026-08-27'
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
unitId: M03-EXERCISES
prerequisites:
  - M03
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
    attrs: { name: 'cuda:pair-id', content: m03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M03 }
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

<a class="locale-pair" data-locale-counterpart href="/en/memory/shared-memory-tiling/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M03：共享内存分块](/memory/shared-memory-tiling/)。所有练习只要求 phase trace、pseudocode 和 invariant；不需要 CUDA-capable system，答案不构成 runtime barrier observation。

## 作答方法

对每题标出 `L/B1/U/B2`、每个 thread 的 predicates、tile slot value 和 output action。先证明 correctness，再查看[参考解答](/memory/shared-memory-tiling/solutions/)。

## 练习 1：跟踪一个 edge tile

**目标：** 一个 block 有 8 threads，input length `n = 13`，loop bases 为 0 和 8。Input values 记作 `x0..x12`，运算是 sum，neutral 是 0。写出两轮每个 lane 的 tile write 和 barrier participation。

**约束：** Lanes 0..7 每轮都要写自己的 slot；base 8 时 lanes 5..7 不得读取 input 或 return；所有 8 threads 都到达 B1 与 B2；不得假定 output validity 等于 load validity。

**预期证据：** 两张 8-lane table、`L -> B1 -> U -> B2` timeline，以及 edge iteration 的 tile contents。

**验收条件：** 第一轮 tile 是 `[x0,...,x7]`；第二轮是 `[x8,x9,x10,x11,x12,0,0,0]`；两轮每个 barrier 都有 8 participants；invalid loaders 写 0；没有 thread 在 barrier 前 return。

<details><summary>提示 1</summary>Participation 是 control-flow fact，不是 load-validity fact。</details>

<details><summary>提示 2</summary>把 B2 写在下一轮 L 之前，而不是只写在 kernel 末尾。</details>

## 练习 2：修复 early return 与缺失 B2

**目标：** 修复下面 skeleton，并标出每个修改消除的 hazard：

```cpp
if (input_index >= n) return;
tile[threadIdx.x] = input[input_index];
__syncthreads();
if (output_index < n) consume(tile);
// next iteration overwrites tile
```

**约束：** 保留 input/output bounds；只用 portable C++17 synchronous baseline；不能引入 async copy、warp-only assumption 或 future M05 primitives；所有 block threads 采用相同 loop trip count。

**预期证据：** 修复后的 pseudocode、before/after phase graph、对 uninitialized read、barrier nonparticipation 和 read/overwrite race 的逐项解释。

**验收条件：** Invalid input 写 operation-appropriate neutral；first barrier 位于所有 writes 后；output guard 不包围 barrier；second barrier 位于 last tile read 与 next overwrite 之间；无 early return 穿过 barrier region。

<details><summary>提示 1</summary>把 return 改成 value selection，不是删除 bounds。</details>

<details><summary>提示 2</summary>B1 保护 load -> read；B2 保护 read -> next load。</details>

## 练习 3：为 neutral 与 reuse 写 proof obligation

**目标：** 分别为 sum over nonnegative integers 和 max over signed 32-bit integers 定义 neutral、validity rule、reuse set 和 output commit rule，再说明为何“所有运算都填 0”不成立。

**约束：** 声明 numeric domain；max neutral 必须不改变任何合法 maximum；每个 loaded slot 要列出哪些 outputs 可读取；若 output invalid，只能跳过 commit，不能跳过后续 B2；不得写性能结论。

**预期证据：** 两份 operation contract、一份 per-slot reuse map 和一段反例。

**验收条件：** Sum neutral 是 0；signed 32-bit max 可使用 `INT32_MIN`（前提是 domain 包含该 identity contract）；`0` 对全负 max 会改变结果；两份合同都保留 B1/B2 participation；reuse map 具体而非“可能复用”。

<details><summary>提示 1</summary>Neutral 必须满足 `combine(x, neutral) = x`。</details>

<details><summary>提示 2</summary>用输入 `[-7,-3]` 测试 max 填 0 的错误。</details>

## 下一步

完成后查看独立的[参考解答](/memory/shared-memory-tiling/solutions/)，再到[练习题库（Practice Bank）PB-R1-015](/practice/#pb-r1-015)修复另一份 barrier review。
