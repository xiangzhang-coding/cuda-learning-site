---
title: 'A14 复核解答：从 Traffic Ledger 到可证伪优化'
description: 复核四算法 accounting matrix、elementwise fusion、candidate experiment、有效替代方案与常见错误。
pairId: a14-solutions
counterpart: /en/algorithms/algorithm-choice-arithmetic-intensity/solutions/
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
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/algorithm-choice-arithmetic-intensity/solutions/' }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/algorithm-choice-arithmetic-intensity/solutions/" lang="en">Read the English counterpart</a>

## 复核前

以下答案复核 [A14 Exercises](/algorithms/algorithm-choice-arithmetic-intensity/exercises/)的 static estimates 与 experiment contracts，不发布 algorithm winner 或 GPU observation。

## 解答 1：四算法 accounting matrix

| algorithm | work | compulsory FP32 bytes | compulsory intensity |
| --- | --- | --- | --- |
| vector addition | `N FLOP` | `12N byte` | `1/12 FLOP/byte` |
| sum reduction | `N-1 FLOP` | `4N+4 byte` | `(N-1)/(4N+4) FLOP/byte` |
| out-of-place transpose | `0 FLOP` | `8MN byte` | `0 FLOP/byte` |
| GEMM | `2MNK FLOP` | `4(MK+KN+MN) byte` | `2MNK/[4(MK+KN+MN)] FLOP/byte` |

Implementation traffic 可因 materialized partials、transaction overfetch、repeated GEMM requests 或 cache eviction 增加；cache hits 也可能降低真正穿过 DRAM 的 repeated requests。每项都保留 boundary label。

**复核：** 通过。Operation convention、logical elements、bytes 与 assumptions 均可追踪。

## 解答 2：Materialized versus fused pipeline

两版本 work 都是 `6N FLOP`。Unfused traffic 是 vector addition `12N` 加 map `8N`，合计 `20N byte`，所以 intensity 是 `6/20 = 0.3 FLOP/byte`。Fused traffic 是 read a/b + write z 的 `12N byte`，intensity 是 `6/12 = 0.5 FLOP/byte`。Predicted logical traffic ratio 是 `12/20 = 0.6`。

Mechanism claim：“在 exact DRAM definition 下 fused candidate traffic lower”；traffic 未下降就拒绝。Performance claim：“same correct workload 下 fused elapsed time lower”；time 未下降就拒绝。Cache serving intermediate、register pressure、occupancy/issue changes 与 launch overhead 都可能解释 deviation。Slots 在 measurement 前为空。

**复核：** 通过。Higher modeled intensity 没有改写成 observed speedup。

## 解答 3：选择首个 candidate experiment

一个可复核 workload packet 声明 reduction pipeline 会 materialize 大量 partials，transpose 不是 dominant phase，并且 larger GEMM tile 会同时改变多项资源。三候选表为：

| candidate | predicted traffic boundary/formula | added cost | falsifier 与 defer reason |
| --- | --- | --- | --- |
| reduction-stage fusion | named global/DRAM boundary 上 `T_base = 4N + 8 * sum(P_i) + 4`；若删除 partial array `P_j` 的 write+read，则 `T_candidate = T_base - 8P_j` | operation order、synchronization、register lifetime 或 atomic handoff | correctness 失败、exact traffic 未按预先声明的方向/阈值下降，或 elapsed time 未改善时拒绝对应 claim |
| tiled transpose | logical requested lower bound 在 baseline/candidate 都是 `8MN byte`；hypothesis 改为 named-path transferred bytes 或 requested/transferred efficiency 改善 | shared-memory traffic、barriers、padding 与 partial tiles | attributed bytes/efficiency 未改善或 correctness 失败；本 packet 中 transpose 非 dominant，先 defer |
| larger GEMM tile | baseline 使用 `4[ceil(N/TN0)MK + ceil(M/TM0)KN + MN]`，candidate 用 `(TM1,TN1)` 代入同一 formula；只有相同 path/cache assumptions 下才比较 | registers、shared memory、occupancy、tails 与 layout sensitivity | exact-path traffic 未下降、correctness/timing 不改善，或多个 resource changes 无法归因；先缩小 experiment |

本 packet 首先选择 reduction-stage fusion，因为 `8P_j` 是最大的可移除 modeled denominator，且该 exact boundary 可观察。Transpose 因 workload relevance 较低而 defer；GEMM 因同时改变多项资源而 defer。One-experiment protocol 只改变 fusion，冻结 input、correctness、build、device/software、warm-up、timed interval、metric definition 与 acquisition policy。

Support/reject thresholds 必须在采集前写入：mechanism 只有在完整 qualifying batch 的同名 traffic metric 按预先声明的 margin（大于 metric resolution 与 retained spread policy）下降时才获支持；performance 只有在 Q05 statistic 的预先声明阈值下改善时才获支持。任一 correctness failure 立即 rollback；traffic 或 timing 未达各自阈值时拒绝对应 claim，证据不完整时保持 inconclusive。所有 actual slots 仍为空，Roofline region 只作 model label。

**复核：** 通过。三项都有 formula、cost 与 falsifier；首个实验、defer reason、threshold method 和 rollback condition 均明确。

## 有效替代方案

- Transpose 可以使用 requested/transferred-byte efficiency 而不是 FLOP intensity，只要单位与 boundary 明确。
- Reduction 可以比较 atomic、multi-pass 或 fused-consumer方案，但 operation order 与 numerical acceptance 必须同步声明。
- GEMM 可以用 per-block tile request formula 或 per-output formula；二者必须写清 cache 与 path assumptions。
- 首个实验可以不是最大 predicted byte reduction，而是最容易保持 correctness 和归因的 candidate。

## 常见错误

- 把 compulsory lower bound 称作 observed traffic。
- 在一个 denominator 中混加 DRAM、L2 与 shared bytes。
- 忘记 intermediate 的 write+later-read 两次 movement。
- 因 transpose intensity 为零而断言无法优化。
- 把 naive GEMM request estimate 当作 guaranteed DRAM traffic。
- 只比较 arithmetic intensity，不考虑 resource、synchronization、correctness 或 workload size。
- 同时改变多个 mechanisms 后把 speedup 归给其中一个。
- 让 Roofline region 自动决定 optimization winner。

复核日期：**2026-09-01**。四个 evidence arrays 保持为空。
