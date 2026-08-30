---
title: 'A04 参考解答：Atomic Correctness、Contention 与 Histogram Privatization'
description: A04 三道练习的 lost-update trace、shared phase proof 与 evidence-safe comparison plan。
pairId: a04-solutions
counterpart: /en/algorithms/privatized-histogram/solutions/
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
unitId: A04-SOLUTIONS
prerequisites:
  - A04-EXERCISES
relatedUnits:
  - A04
  - EX13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'A04,EX13' }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/privatized-histogram/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [A04 练习（Exercises）](/algorithms/privatized-histogram/exercises/)的独立参考页。Event traces 与 phase proof 验证 correctness；它们不是 GPU timing 或 contention observation。

## 解答 1：找出 lost update，再恢复 exact count

Plain read-modify-write 的一种错误 interleaving：

```text
T0 reads 0
T1 reads 0
T0 writes 1
T1 writes 1
final = 1
```

两个 `atomicAdd` 只能线性化为 `T0 then T1` 或 `T1 then T0`。无论顺序如何，第一个 operation 把 0 变为 1，第二个把 1 变为 2，因此 exact final count 是 2。两个 operations 仍然访问 same address，所以 correctness 不等于没有 contention。

## 解答 2：证明 privatized phase order

1. **Zero：** 每个 thread 从 `threadIdx.x` 开始按 `blockDim.x` stride，把所负责的 `shared_bins[b]` 设为 0。
2. **First barrier：** 所有 block participants 到达 `__syncthreads()`。
3. **Update：** 只有 `sample_valid` 的 thread 对 `shared_bins[bin_of(sample)]` 执行 `atomicAdd(..., 1)`。
4. **Second barrier：** 所有 block participants 再次到达 `__syncthreads()`。
5. **Merge：** 每个 thread 按相同 bin stride，把 `shared_bins[b]` 通过 `atomicAdd` 合入 `global_bins[b]`。

Lane coverage 分别是 `0,4,8`、`1,5,9`、`2,6`、`3,7`。First barrier 建立 all zero writes happen-before any update；second barrier 建立 all shared updates happen-before any merge read。Sample-invalid thread 只跳过中间 atomic，仍参加两个 barriers。

## 解答 3：比较 distributions，但不预写 speedup

Uniform 的 exact counts 是 `[2,2,2,2]`，destination sequence 是 `0,1,2,3,0,1,2,3`。Skewed 的 exact counts 是 `[8,0,0,0]`，destination sequence 是八次 bin 0，因此它形成 same hot bin hypothesis。

Measurement plan 固定 input bytes、bin mapping、counter type、launch configuration 和 output initialization；分别记录 exact variant、fixture、Toolkit lane、GPU、driver、compute capability、warm-up policy 与 timing boundary。每次 measurement 前先 exact-compare CPU reference，并检查 sum of bins。Timing、throughput 与 speedup fields 保持 `unrecorded`，直到 Reference Environment logs 存在。

## 有效替代方案

- Cooperative zero 与 merge 可以采用不同的 deterministic work partition，只要覆盖每个 bin 恰好一次或使用正确 atomic contract。
- 每个 thread 可以处理 grid-stride samples，前提是 sample ownership 唯一且所有 block participants 仍到达 barriers。
- Merge 可以跳过 zero private counts，但必须在 second barrier 之后读取，并保持 global exact counts。
- 当 histogram 不适合 shared capacity 时，可以选择 direct global atomics 或 library primitive；这不改变 correctness oracle。

## 常见错误

- 用 `histogram[b] += 1` 处理共享 output，并忽略 read-modify-write race。
- 把 atomic correctness 写成“没有 contention”。
- 只让前 `bin_count` 个 threads 清零，却没有处理 bins 多于 threads 的情况。
- 在 first barrier 前让 invalid sample thread return，或在 merge 前漏掉 second barrier。
- Shared update 不用 atomic，误以为 per-block privatization 等于 per-thread ownership。
- Merge 到 global bins 时使用 plain addition，导致 blocks 之间丢更新。
- 从 skewed destination trace 或 global atomic 数量填写未观察的 speedup。

复核日期：**2026-08-30**。Compilation 与 runtime evidence axes 保持为空。
