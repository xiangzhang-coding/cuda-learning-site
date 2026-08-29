---
title: 'Q05 练习：设计可审查的异步计时'
description: 用三道静态任务修复 asynchronous timing、预注册 sample/statistics protocol，并补全 performance Environment Manifest。
pairId: q05-exercises
counterpart: /en/correctness/timing-asynchronous-gpu-work/exercises/
factCheckDate: '2026-08-28'
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
unitId: Q05-EXERCISES
prerequisites:
  - Q05
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
    attrs: { name: 'cuda:pair-id', content: q05-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q05 }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/timing-asynchronous-gpu-work/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q05：诚实计时异步 GPU 工作](/correctness/timing-asynchronous-gpu-work/)。所有 tasks 都使用 symbolic values 与未填写 observation fields，不需要 GPU，也不允许虚构 measurements。

## 作答方法

先写 correctness gate，再写 warm-up exclusion、timing endpoints、completion boundary、raw-sample storage、statistics 和 manifest。每个 unknown field 明确写 unknown。独立完成后再查看[参考解答](/correctness/timing-asynchronous-gpu-work/solutions/)。

## 练习 1：修复一个只测到 enqueue 的程序

**目标：** 审查以下 conceptual sequence，并分别设计 kernel-only CUDA-event protocol 与 end-to-end host-wall-clock protocol：`host_start -> launch candidate -> host_stop -> print faster`。原 sequence 没有 correctness comparison、warm-up 或 synchronization。

**约束：** 两种 protocol 都必须先让 baseline/candidate 在相同 input 上通过 Q01 criteria；warm-up 单独执行并排除；event path 使用 timing-enabled `start`/`stop`、`cudaEventRecord`、`cudaEventSynchronize(stop)` 与 `cudaEventElapsedTime`；host path 必须声明 start/end synchronization 和 included work；不得提供 numerical time 或 speedup。

**预期证据：** 一张 bad-edge diagnosis、两份 ordered timing ledger、API/error-check checklist、endpoint/included-work table，以及明确的 no-speedup-if-wrong rule。

**验收条件：** 原 sequence 被标为 host enqueue latency 而非 completed GPU duration；event ledger 等待 stop；host ledger 在 end timestamp 前完成 declared work；两种 metric 保持不同名称；correctness failure 会阻止统计与 speedup。

<details><summary>提示 1</summary>在每个 end timestamp 前追问：“哪项 operation 证明被测 work 已完成？”</details>

<details><summary>提示 2</summary>Event endpoints 定义 device interval；host timestamps 可以包住更多 host work，不能混用 labels。</details>

## 练习 2：预注册 repetition 与 statistics protocol

**目标：** 为 baseline/candidate comparison 写一份 observation 前 protocol，覆盖 lazy loading、warm-up、symbolic repetition count `N`、run order、raw sample custody、median、spread 与 outlier handling。

**约束：** `N`、warm-up count、primary median、chosen spread 和 run order 都必须在采样前固定；warm-up 不进入 raw samples；保存 acquisition order；不得 silent delete outliers 或在看完 data 后换 statistic；记录 loading mode 与 preload/library setup；不填写任何 sample value。

**预期证据：** 一份 preregistration form、baseline/candidate sample-table schema、raw artifact naming rule、predeclared exclusion policy，以及支持或拒绝 speedup 的 decision tree。

**验收条件：** Protocol 能区分 warm-up 与 measurement；每个 raw sample 可追溯到 variant/order/endpoint/completion status；median 和 spread 都预声明；flagged samples 仍保留；只有两项 variants 都正确且 protocol 可比较时才允许 ratio。

<details><summary>提示 1</summary>先设计空表和 decision rules，再想象填入 observations。</details>

<details><summary>提示 2</summary>Outlier flag 是 metadata，不是删除 raw value 的许可。</details>

## 练习 3：把一句 benchmark note 补成 manifest

**目标：** 把不完整记录“某 GPU、某 CUDA、candidate 更快”改写成一份尚待填写的完整 performance Environment Manifest，并判断当前 speedup claim 的 Evidence Status。

**约束：** Template 至少覆盖 GPU identity、compute capability、GPU count、driver、CUDA Toolkit、component versions、NVCC、host compiler、operating system、source/build/flags、exact command、workload/input/memory、permissions、correctness method/criteria、clock-power/thermal/load、warm-up、timing endpoints、synchronization、repetitions/raw samples/statistics、observation date/custody；空项只能写 unknown，不得猜测或制造 numbers。

**预期证据：** 一张 complete field table、missing-field inventory、correctness/timing acceptance checklist，以及对原 speedup sentence 的 supported/unsupported verdict 和理由。

**验收条件：** Hardware/software/build/input/measurement coordinates 保持分离；timer endpoints 与 host/device metric 被命名；correctness verdict 是 speedup gate；原 claim 在没有 observations、raw samples 与完整 manifest 时被判为 unsupported。

<details><summary>提示 1</summary>“CUDA version”不能替代 driver、Toolkit、NVCC、runtime/library/profiler 各自版本。</details>

<details><summary>提示 2</summary>Manifest template 说明该记录还缺什么；它本身不是 observation。</details>

## 下一步

完成后查看独立的[参考解答](/correctness/timing-asynchronous-gpu-work/solutions/)，再到[练习题库（Practice Bank）PB-R1-024](/practice/#pb-r1-024)修复另一份 one-shot timing claim。
