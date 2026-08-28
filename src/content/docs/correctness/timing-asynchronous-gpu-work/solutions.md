---
title: 'Q05 参考解答：设计可审查的异步计时'
description: Q05 练习的 event/host timing repairs、preregistered sampling protocol 与完整 performance manifest review。
pairId: q05-solutions
counterpart: /en/correctness/timing-asynchronous-gpu-work/solutions/
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
unitId: Q05-SOLUTIONS
prerequisites:
  - Q05-EXERCISES
relatedUnits:
  - Q05
  - LAB04
  - LAB05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q05-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q05,LAB04,LAB05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/timing-asynchronous-gpu-work/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [Q05 练习（Exercise）](/correctness/timing-asynchronous-gpu-work/exercises/)解成 symbolic protocol。它们没有运行 CUDA、填入 time value 或建立 performance evidence。

## 解答 1：修复一个只测到 enqueue 的程序

原 sequence 的 `host_stop` 紧跟 asynchronous launch，只能界定 host-side submission path；没有 completion edge，也没有 correctness 或 warm-up contract。

Kernel-only event ledger：

```text
same input -> baseline result -> completion -> Q01 comparison -> PASS
same input -> candidate result -> completion -> Q01 comparison -> PASS
separate warm-up for exact measured path -> completion -> exclude
record timing-enabled start in measured stream
-> enqueue measured kernel
-> record timing-enabled stop in same declared stream
-> cudaEventSynchronize(stop)
-> cudaEventElapsedTime(start, stop)
-> append checked raw sample
```

End-to-end host ledger 使用不同 metric：先完成可能污染 interval 的 prior work，获取 host start，执行明确列出的 preparation/submission/transfers，在 declared completion synchronization 返回后获取 host end。它可以有意包含 launch overhead 和 wait；不能命名为 pure kernel device time。任一 CUDA error 或 correctness failure 都终止 comparison，不计算 speedup。

## 解答 2：预注册 repetition 与 statistics protocol

Pre-registration 应在观察前锁定：source/build、input、baseline/candidate order 或 interleaving policy、loading mode/preload/library setup、warm-up count 与 exclusion、symbolic measured count `N`、event 或 host endpoints、completion check、median、chosen spread、outlier rule 和 raw artifact path。

Sample schema 可以是：

| field | symbolic content |
| --- | --- |
| sample index | acquisition order `i` |
| variant | baseline or candidate |
| correctness | pre-timing PASS reference |
| start/stop | named endpoint pair and stream |
| completion | checked return/status |
| raw value | observation slot, initially empty |
| flag | predeclared rule result, never deletion |

Decision tree 是：任一 variant 不正确则 stop；manifest/protocol 不可比较则 unsupported；raw samples 不完整则 unsupported；否则按预先声明的方法分别计算 median 与 spread，再计算并解释 ratio。Flagged sample 仍保留，且任何 exclusion 都同时报告 reason 与 inclusive view。

## 解答 3：把一句 benchmark note 补成 manifest

完整 template 至少分为：

1. **Hardware：** GPU identity/UUID、compute capability/query、GPU count、memory、topology。
2. **Software：** driver、CUDA Toolkit、component versions、NVCC、host compiler、operating system/kernel。
3. **Source/build：** repository/commit、build type、dialect/target、all flags/link mode/environment、exact build/run commands。
4. **Workload/input：** variant、shape/data type/batch/iterations、input generator/seed or dataset、memory footprint。
5. **Access/state：** permissions、container/MIG/MPS、concurrent load、persistence/clocks/power/thermal/cooldown policy。
6. **Correctness：** method、criteria、per-variant verdict and logs。
7. **Measurement：** metric name、timer/version、warm-up/lazy-loading setup、endpoints/included work/streams、synchronization、repetition order/count、raw samples、median/spread/outlier policy。
8. **Custody：** observation date、observer、artifact path/hash 与 Reference Environment status。

原 note 没有 observations、correctness verdict、metric definition、raw samples 或 manifest，因此 speedup verdict 是 **unsupported**。把 fields 改成 unknown 是诚实 inventory，不会让 claim 变成 supported；必须由 real run 填写。

## 有效替代方案

- Single-stream region 可以使用 timing-enabled events；multi-stream region 可以先用 explicit dependencies 汇聚到 stop stream。
- 若 metric 有意是 whole-operation host latency，可以使用 synchronized monotonic host timer，不必冒充 device event time。
- Spread 可以预声明 IQR 或 full range；重点是在观察前固定并与 raw samples 一起报告。
- Baseline/candidate 可以 blocked 或 interleaved order 运行，只要 order policy 预声明、可复核且没有看 data 后更改。

## 常见错误

- 在 asynchronous launch 后立即 stop host timer。
- 把 warm-up 混入 measured samples。
- 使用 `cudaEventDisableTiming` endpoints 做 elapsed time。
- Record stop 后未调用 `cudaEventSynchronize` 或等价 completion check。
- Event interval 与 host end-to-end interval 使用同一 label。
- 只发布 best 或 mean，丢弃 raw repeated samples。
- 看完 data 才选择 median/spread 或删除 outlier。
- Manifest 缺 build、clock/power、input 或 endpoints。
- Candidate 错误时仍报告 speedup。
- 用 template placeholders 或 fabricated numbers 冒充 observations。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
