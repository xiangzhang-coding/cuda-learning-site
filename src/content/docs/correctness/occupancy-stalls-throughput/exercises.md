---
title: 'Q09 练习：审查 Occupancy、Scheduler States 与 Throughput Claims'
description: 用三道静态任务建立 occupancy 计算合同、scheduler-state ladder 与非因果 profiler claim audit。
pairId: q09-exercises
counterpart: /en/correctness/occupancy-stalls-throughput/exercises/
factCheckDate: '2026-09-01'
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
unitId: Q09-EXERCISES
prerequisites:
  - Q09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q09-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/occupancy-stalls-throughput/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q09 }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/occupancy-stalls-throughput/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [Q09](/correctness/occupancy-stalls-throughput/)。三题都提交 static worksheet，不运行 GPU、profiler 或 occupancy calculator，也不填写任何 observation。

## 作答方法

把 unknown 保持为 unknown。先固定 exact device/binary/launch/query fields，再写代数关系，最后写允许和禁止的 interpretation。完成后再查看[复核解答](/correctness/occupancy-stalls-throughput/solutions/)。

## 练习 1：建立 theoretical/achieved occupancy worksheet

**目标：** 为一个未指定 GPU 与未指定 kernel binary 设计 worksheet，用 `W_model`、`W_observed`、`W_max` 分别表达 modeled active warps、execution-derived active warps 与 exact-device maximum active warps，并写出两个 occupancy ratios。

**约束：** 必须列出 grid/block、registers、static/dynamic shared memory、allocation granularity、resident block/warp limits、exact GPU/CC 与 query source。不得填入设备上限、occupancy percentage 或 limiter；不得把 achieved value 从 theoretical value 推出来。

**预期证据：** 一张 input/provenance table，`O_theoretical = W_model / W_max` 与 `O_achieved = W_observed / W_max`，以及 missing-input stop rule。

**验收标准：** 两个 ratio 使用兼容 denominator，但分子来源不同；worksheet 区分 residency 与 utilization；任何 exact coordinate 缺失都会停止 numerical conclusion。

<details><summary>提示 1</summary>先问 `W_model` 是由哪个 launch/resource model 得到，而不是先问 percentage。</details>

<details><summary>提示 2</summary>`W_observed` 还需要 report 的 sampling、aggregation 与 time scope。</details>

## 练习 2：画出 active-to-issued scheduler ladder

**目标：** 对抽象状态 `resident -> eligible -> selected/issued` 画一张 decision ladder，并把 fetch、memory dependency、execution dependency 与 barrier waits 放到 eligible 之前。

**约束：** Ready 只能作为 eligible 的普通说明，不能发明新的 profiler state。必须说明 issued 不等于 completed，stall 不等于 whole-kernel bottleneck，更多 resident warps 只能提供潜在 latency-hiding candidates。

**预期证据：** 三状态表、四类 wait placement、no-eligible issue-gap rule，以及 latency versus throughput 对照。

**验收标准：** Active、eligible 与 issued 没有互换；答案解释 occupancy 可能帮助隐藏但不会缩短 latency；没有从 stall category 得出 repair 或 speedup。

<details><summary>提示 1</summary>一个 active warp 可以 stalled，因此 active count 不是 ready-work count。</details>

<details><summary>提示 2</summary>Scheduler 在 eligible set 中选择，未选择的 eligible warp 仍然 eligible。</details>

## 练习 3：审查三个百分比式结论

**目标：** 修复这条无边界 claim：“occupancy 很高、某 stall share 最大、某 throughput percentage 也高，所以 kernel 已经受 memory 限制，增加 occupancy 会得到剩余 speedup。”

**约束：** 要求 exact names、units、definitions、denominators、scopes、availability、GPU/tool/report、filter、replay、workload 与 correctness。把 residency、issue failure、stall sampling 与 resource throughput 分成四行；提出一个只改变一个 mechanism 的 falsifiable next experiment，不提供 numerical result。

**预期证据：** Claim-audit table、missing-evidence inventory、permitted narrow statements、competing explanations 与 controlled experiment contract。

**验收标准：** 原 bottleneck/speedup claim 被标记 unsupported；high occupancy、largest stall share 与 throughput percentage 都不单独决定优化；actual query output 到来前不写 metric spelling 或 value。

<details><summary>提示 1</summary>先验证 scheduler 是否缺少 eligible work，再决定 stall breakdown 是否值得追查。</details>

<details><summary>提示 2</summary>“离 ceiling 还有多少”不是“可以加速多少”；两者 denominator 不同。</details>

## 下一步

查看独立的[复核解答](/correctness/occupancy-stalls-throughput/solutions/)，再完成[练习题库（Practice Bank）PB-R3-004](/practice/#pb-r3-004)，然后进入 [Q10](/correctness/roofline-arithmetic-intensity/)。
