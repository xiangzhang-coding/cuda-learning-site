---
title: 'A14 Reviewed Solutions: From Traffic Ledger to Falsifiable Optimization'
description: Reviewed four-algorithm accounting matrix, elementwise fusion, candidate experiment, valid alternatives, and common errors.
pairId: a14-solutions
counterpart: /algorithms/algorithm-choice-arithmetic-intensity/solutions/
factCheckDate: '2026-09-01'
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
unitId: A14-SOLUTIONS
prerequisites:
  - A14-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a14-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/algorithm-choice-arithmetic-intensity/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A14-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A14-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/algorithm-choice-arithmetic-intensity/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers review static estimates and experiment contracts in the [A14 Exercises](/en/algorithms/algorithm-choice-arithmetic-intensity/exercises/). They publish no algorithm winner or GPU observation.

## Solution 1: Four-algorithm accounting matrix

| algorithm | work | compulsory FP32 bytes | compulsory intensity |
| --- | --- | --- | --- |
| vector addition | `N FLOP` | `12N byte` | `1/12 FLOP/byte` |
| sum reduction | `N-1 FLOP` | `4N+4 byte` | `(N-1)/(4N+4) FLOP/byte` |
| out-of-place transpose | `0 FLOP` | `8MN byte` | `0 FLOP/byte` |
| GEMM | `2MNK FLOP` | `4(MK+KN+MN) byte` | `2MNK/[4(MK+KN+MN)] FLOP/byte` |

Materialized partials, transaction overfetch, repeated GEMM requests, or cache eviction can raise implementation traffic. Cache hits can also prevent repeated requests from crossing DRAM. Every row retains its boundary label.

**Review:** Passes. Operation convention, logical elements, bytes, and assumptions are traceable.

## Solution 2: Materialized versus fused pipeline

Both versions perform `6N FLOP`. Unfused traffic is vector addition's `12N` plus map's `8N`, totaling `20N byte`, so intensity is `6/20 = 0.3 FLOP/byte`. Fused traffic is `12N byte` for reading a/b and writing z, so intensity is `6/12 = 0.5 FLOP/byte`. The predicted logical traffic ratio is `12/20 = 0.6`.

The mechanism claim says fused candidate traffic is lower under one exact DRAM definition and is rejected if traffic does not fall. The performance claim says fused elapsed time is lower for the same correct workload and is rejected if time does not fall. Cache service of the intermediate, register pressure, occupancy or issue changes, and launch overhead can explain deviations. Slots remain empty before measurement.

**Review:** Passes. Higher modeled intensity never becomes observed speedup.

## Solution 3: Select the first candidate experiment

A reviewable workload packet states that its reduction pipeline materializes many partials, transpose is not the dominant phase, and a larger GEMM tile would change several resources at once. Its three-candidate table is:

| candidate | predicted traffic boundary/formula | added cost | falsifier and defer reason |
| --- | --- | --- | --- |
| reduction-stage fusion | At one named global/DRAM boundary, `T_base = 4N + 8 * sum(P_i) + 4`; removing partial array `P_j` and its write/read gives `T_candidate = T_base - 8P_j` | operation order, synchronization, register lifetime, or an atomic handoff | reject the corresponding claim on correctness failure, no traffic decrease in the predeclared direction/threshold, or no elapsed-time improvement |
| tiled transpose | Logical requested traffic remains `8MN byte` for baseline and candidate; the hypothesis instead predicts lower named-path transferred bytes or better requested/transferred efficiency | shared-memory traffic, barriers, padding, and partial tiles | reject when attributed bytes/efficiency do not improve or correctness fails; defer because transpose is not dominant in this packet |
| larger GEMM tile | Baseline uses `4[ceil(N/TN0)MK + ceil(M/TM0)KN + MN]`; substitute `(TM1,TN1)` in the same formula for the candidate and compare only under identical path/cache assumptions | registers, shared memory, occupancy, tails, and layout sensitivity | reject on unchanged exact-path traffic, failed correctness/timing, or confounded resource changes; narrow before testing |

This packet selects reduction-stage fusion first because `8P_j` is its largest removable modeled denominator and the exact boundary is observable. Transpose is deferred for low workload relevance; GEMM is deferred because several resource coordinates would change. The one-experiment protocol changes only fusion and freezes input, correctness, build, device/software, warm-up, timed interval, metric definition, and acquisition policy.

Support and rejection thresholds are written before collection: the mechanism is supported only when the same named traffic metric from a complete qualifying batch falls by the declared margin, larger than the metric-resolution and retained-spread policy; performance is supported only when the Q05 statistic crosses its separately declared threshold. Any correctness failure triggers rollback. Failure to cross the traffic or timing threshold rejects the corresponding claim, while incomplete evidence remains inconclusive. All actual-result slots stay empty, and a Roofline region remains only a model label.

**Review:** Passes. Every candidate has a formula, cost, and falsifier; the first experiment, defer reasons, threshold method, and rollback condition are explicit.

## Valid alternatives

- Transpose may use requested-versus-transferred-byte efficiency instead of FLOP intensity when units and boundary are explicit.
- Reduction may compare atomic, multi-pass, or fused-consumer designs when operation order and numerical acceptance are declared too.
- GEMM may use a per-block tile-request or per-output formula; either one states cache and path assumptions.
- The first experiment need not have the largest predicted byte reduction; the easiest candidate to keep correct and attributable can come first.

## Common errors

- Calling a compulsory lower bound observed traffic.
- Adding DRAM, L2, and shared bytes into one denominator.
- Forgetting both the write and later read of an intermediate.
- Declaring transpose unoptimizable because its intensity is zero.
- Treating a naive GEMM request estimate as guaranteed DRAM traffic.
- Comparing only arithmetic intensity while ignoring resources, synchronization, correctness, or workload size.
- Changing several mechanisms and attributing speedup to one.
- Allowing a Roofline region to choose an optimization winner automatically.

Reviewed: **2026-09-01**. All four evidence arrays remain empty.
