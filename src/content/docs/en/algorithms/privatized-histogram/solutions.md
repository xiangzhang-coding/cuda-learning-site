---
title: 'A04 Reviewed Solutions: Atomic Correctness, Contention, and Histogram Privatization'
description: Review the lost-update trace, shared phase proof, and evidence-safe comparison plan for the three A04 exercises.
pairId: a04-solutions
counterpart: /algorithms/privatized-histogram/solutions/
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/privatized-histogram/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate review page for the [A04 Exercises](/en/algorithms/privatized-histogram/exercises/). Event traces and phase proofs verify correctness; they are not GPU timing or contention observations.

## Solution 1: Expose a lost update, then restore the exact count

One broken plain read-modify-write interleaving is:

```text
T0 reads 0
T1 reads 0
T0 writes 1
T1 writes 1
final = 1
```

Two `atomicAdd` operations can linearize only as `T0 then T1` or `T1 then T0`. In either order, the first operation changes 0 to 1 and the second changes 1 to 2, so the exact final count is 2. Both operations still target the same address, so correctness does not mean contention is absent.

## Solution 2: Prove the privatized phase order

```cpp
for (int b = threadIdx.x; b < bin_count; b += blockDim.x) shared_bins[b] = 0;
__syncthreads();

if (sample_valid) atomicAdd(&shared_bins[bin_of(sample)], 1);
__syncthreads();

for (int b = threadIdx.x; b < bin_count; b += blockDim.x) {
  atomicAdd(&global_bins[b], shared_bins[b]);
}
```

Lane coverage is `0,4,8`, `1,5,9`, `2,6`, and `3,7`. The first barrier establishes that all zero writes happen before any update. The second establishes that all shared updates happen before any merge read. A sample-invalid thread skips only the middle atomic and still participates in both barriers.

## Solution 3: Compare distributions without prewriting a speedup

Uniform exact counts are `[2,2,2,2]`, with destination sequence `0,1,2,3,0,1,2,3`. Skewed exact counts are `[8,0,0,0]`, with eight destinations at bin 0, which establishes a same-hot-bin hypothesis.

The measurement plan fixes input bytes, bin mapping, counter type, launch configuration, and output initialization. It records the exact variant, fixture, Toolkit lane, GPU, driver, compute capability, warm-up policy, and timing boundary. Before each measurement, exact-compare against the CPU reference and check the sum of bins. Timing, throughput, and speedup fields remain `unrecorded` until Reference Environment logs exist.

## Valid alternatives

- Cooperative zero and merge may use another deterministic work partition if every bin is covered exactly once or protected by a correct atomic contract.
- Each thread may process grid-stride samples if sample ownership is unique and all block participants still reach the barriers.
- Merge may skip zero private counts, but it reads after the second barrier and preserves exact global counts.
- When a histogram does not fit shared capacity, direct global atomics or a library primitive may be selected without changing the correctness oracle.

## Common errors

- Using `histogram[b] += 1` on shared output and ignoring the read-modify-write race.
- Describing atomic correctness as no contention.
- Clearing bins with only the first `bin_count` threads and failing when bins outnumber threads.
- Returning an invalid-sample thread before the first barrier, or omitting the second barrier before merge.
- Omitting atomics for shared updates because per-block privatization is confused with per-thread ownership.
- Using plain addition during global merge and losing updates between blocks.
- Filling an unobserved speedup from a skewed destination trace or a global-atomic count.

Reviewed on **2026-08-30**. Compilation and runtime evidence axes remain empty.
