---
title: 'Q09 复核解答：Occupancy、Scheduler States 与 Throughput Claims'
description: 复核 theoretical/achieved occupancy worksheet、active-to-issued ladder、profiler claim audit、有效替代方案与常见错误。
pairId: q09-solutions
counterpart: /en/correctness/occupancy-stalls-throughput/solutions/
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
unitId: Q09-SOLUTIONS
prerequisites:
  - Q09-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q09-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/occupancy-stalls-throughput/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: Q09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q09-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/occupancy-stalls-throughput/solutions/" lang="en">Read the English counterpart</a>

## 复核前

以下答案复核 [Q09 Exercises](/correctness/occupancy-stalls-throughput/exercises/)的静态 contracts。它们不查询 device、不运行 profiler，也不把 worksheet slot 变成 observation。

## 解答 1：Theoretical/achieved occupancy worksheet

Reviewed worksheet 先建立三类 provenance：`W_model` 来自 exact launch、binary resources、allocation rules 与 device limits；`W_observed` 来自 exact report 的 execution sampling/aggregation；`W_max` 来自同一 exact device 与兼容 scope。于是只能写：

`O_theoretical = W_model / W_max`

`O_achieved = W_observed / W_max`

Grid/block、registers、static/dynamic shared memory、resident block/warp limits、GPU/CC 与 query outputs 都是 required slots。任一项 unknown，就保留 symbolic result。Utilization 不进入这两个 ratio。

**复核：** 通过。两个 numerator 的 provenance 没有混合，没有虚构 limiter、ceiling 或 percentage。

## 解答 2：Active-to-issued scheduler ladder

Reviewed ladder 是 `active/resident -> eligible/ready-to-issue -> selected/issued`。Fetch、memory dependency、execution dependency 或 barrier wait 都可能让 active warp 暂时不 eligible。Eligible set 可以有多个 warps；scheduler 选择其中一个发射，其他仍 eligible。Issued 只记录 issue decision，不证明 completion 或 peak throughput。

Latency 是一个 operation/dependency interval 的等待；throughput 是 declared work/traffic per time。增加 resident candidates 可能让 scheduler 在等待期间找到另一个 eligible warp，所以隐藏 latency；它不改变原 dependency 的 latency。若没有 eligible warp，issue opportunity 才出现 gap，而 stall category 仍只是 diagnosis lead。

**复核：** 通过。Residency、readiness、issue、completion、latency 与 throughput 都保持独立。

## 解答 3：三个百分比式结论审查

原 claim 的 verdict 是 **unsupported as written**。Occupancy 缺 theoretical/achieved identity 与 denominator；stall share 缺 sampling、normalization、issue-gap context 与 competing causes；throughput percentage 缺 resource、ceiling、unit、scope 与 definition。即使这些 fields 齐全，三项仍不能推出 memory bottleneck、occupancy repair 或剩余 speedup。

Reviewed next step 先查询 exact names/definitions/units/availability，确认 selected kernel 是否缺 eligible work，再提出一个 mechanism-specific candidate。例如，只改变一个 declared register/shared-memory or access-layout choice，保持 workload、correctness、binary build coordinates、GPU、tool、filter、replay 与 clocks/cache controls可比；预先声明支持和拒绝规则。结果 slots 保持 empty。

**复核：** 通过。Claim 被收窄为可证伪 experiment contract，而不是伪造结论。

## 有效替代方案

- 可以用 occupancy API、calculator 或 report 建立 theoretical model，只要 exact GPU、binary、launch、resource 与 definition coordinates 齐全。
- 可以先审查 scheduler issue activity，再按 question 选择 sampled stall evidence；也可以在 issue 正常时停止 stall investigation。
- Controlled candidate 可以改变 block size、resource use 或 data layout，但每次只声明一个 primary mechanism，并重新验证 correctness。

## 常见错误

- 把 occupancy 当作 utilization 或 busy percentage。
- 从 theoretical occupancy 伪造 achieved occupancy。
- 忽略 allocation granularity，只按 source variables 计算 registers。
- 把 active warp 当作 eligible warp，把 issued 当作 completed。
- 认为隐藏 latency 等于降低 latency。
- 把最大 stall share 命名为 bottleneck，却未检查 scheduler issue gaps。
- 把离 throughput ceiling 的 percentage 当作可获得 speedup。
- 未查询 exact GPU/tool/report 就复制 metric spelling、unit 或 definition。

复核日期：**2026-09-01**。四个 evidence arrays 保持为空。
