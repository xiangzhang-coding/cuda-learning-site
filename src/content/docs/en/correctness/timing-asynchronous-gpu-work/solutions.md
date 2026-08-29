---
title: 'Q05 Reviewed Solutions: Design reviewable asynchronous timing'
description: Event and host timing repairs, a preregistered sampling protocol, and a complete performance-manifest review for the Q05 Exercises.
pairId: q05-solutions
counterpart: /correctness/timing-asynchronous-gpu-work/solutions/
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

<a class="locale-pair" data-locale-counterpart href="/correctness/timing-asynchronous-gpu-work/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [Q05 Exercises](/en/correctness/timing-asynchronous-gpu-work/exercises/) as symbolic protocols. They do not run CUDA, fill a time value, or establish performance evidence.

## Solution 1: Repair a program that times enqueue only

The original `host_stop` immediately follows an asynchronous launch, so it bounds only the host submission path. It has no completion edge, correctness gate, or warm-up contract.

Kernel-only event ledger:

```text
same input -> baseline result -> completion -> Q01 comparison -> PASS
same input -> candidate result -> completion -> Q01 comparison -> PASS
separate warm-up for exact measured path -> completion -> exclude
record timing-enabled start in measured stream
-> enqueue measured kernel
-> record timing-enabled stop in the same declared stream
-> cudaEventSynchronize(stop)
-> cudaEventElapsedTime(start, stop)
-> append checked raw sample
```

The end-to-end host ledger uses a different metric. It first completes prior work that would contaminate the interval, takes the host start timestamp, performs the explicitly listed preparation, submission, and transfers, and takes host end only after the declared completion synchronization returns. It may intentionally include launch overhead and waiting, so it is not pure kernel device time. Any CUDA error or correctness failure stops the comparison and blocks speedup.

## Solution 2: Preregister repetition and statistics

Before observation, lock source and build, input, baseline/candidate order or interleaving, loading mode and preload/library setup, warm-up count and exclusion, symbolic measured count `N`, event or host endpoints, completion check, median, chosen spread, outlier rule, and raw-artifact path.

One sample schema is:

| field | symbolic content |
| --- | --- |
| sample index | acquisition order `i` |
| variant | baseline or candidate |
| correctness | pre-timing PASS reference |
| start and stop | named endpoint pair and stream |
| completion | checked return or status |
| raw value | observation slot, initially empty |
| flag | predeclared rule result, never deletion |

The decision tree stops if either variant is incorrect, marks the claim unsupported if manifests or protocols are incomparable, and marks it unsupported if raw samples are incomplete. Otherwise, compute median and spread separately by the predeclared method, then compute and interpret the ratio. A flagged sample remains present, and any exclusion reports its reason plus an inclusive view.

## Solution 3: Expand one benchmark note into a manifest

A complete template separates at least:

1. **Hardware:** GPU identity and UUID, compute capability and query, GPU count, memory, topology.
2. **Software:** driver, CUDA Toolkit, component versions, NVCC, host compiler, operating system and kernel.
3. **Source/build:** repository and commit, build type, dialect and target, all flags, link mode, environment, exact build and run commands.
4. **Workload/input:** variant, shape, data type, batch and iterations, input generator and seed or dataset, memory footprint.
5. **Access/state:** permissions, container/MIG/MPS, concurrent load, persistence, clocks, power, thermal, and cooldown policy.
6. **Correctness:** method, criteria, per-variant verdict, and logs.
7. **Measurement:** metric name, timer and version, warm-up and lazy-loading setup, endpoints, included work, streams, synchronization, repetition order and count, raw samples, median, spread, and outlier policy.
8. **Custody:** observation date, observer, artifact path or hash, and Reference Environment status.

The original note has no observations, correctness verdict, metric definition, raw samples, or manifest. Its speedup verdict is therefore **unsupported**. Replacing blanks with unknown is an honest inventory, not support for the claim. A real run must fill them.

## Valid alternatives

- A single-stream region can use timing-enabled events; a multi-stream region can converge explicit dependencies into a stop stream.
- A metric intentionally defined as whole-operation host latency may use a synchronized monotonic host timer without pretending to be device event time.
- Spread may be preregistered as IQR or full range. It must be fixed before observation and reported with raw samples.
- Baseline and candidate may run in blocked or interleaved order when the order policy is preregistered, reviewable, and unchanged after seeing data.

## Common errors

- Stopping a host timer immediately after an asynchronous launch.
- Mixing warm-up into measured samples.
- Using `cudaEventDisableTiming` endpoints for elapsed time.
- Recording stop without `cudaEventSynchronize` or an equivalent completion check.
- Giving event and host end-to-end intervals one label.
- Publishing only the best value or mean while discarding raw repeated samples.
- Choosing median or spread, or deleting an outlier, after viewing data.
- Omitting build, clock or power, input, or endpoints from the manifest.
- Reporting speedup for an incorrect candidate.
- Presenting template placeholders or fabricated numbers as observations.

Reviewed: **2026-08-28**. Compilation and runtime evidence axes remain empty.
