---
title: 'Q06 练习：设计一轮可证伪的 APOD'
description: 用三道静态任务限定 recorded baseline、controlled hypothesis/evidence comparison 和 deployment regression gate。
pairId: q06-exercises
counterpart: /en/correctness/apod-optimization-loop/exercises/
factCheckDate: '2026-08-31'
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
unitId: Q06-EXERCISES
prerequisites:
  - Q06
relatedUnits:
  - Q06
  - Q07
  - Q08
  - LAB08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q06 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q06,Q07,Q08,LAB08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/apod-optimization-loop/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q06：把 APOD 作为优化循环](/correctness/apod-optimization-loop/)。三项 tasks 都只产出 review template、symbolic ledger 和 decision rules；不执行代码、不采集 observation，也不允许编造 baseline、profile、time 或 speedup。

## 作答方法

先独立作答，再查看[参考解答](/correctness/apod-optimization-loop/solutions/)。每项空白 evidence field 写 `pending observation` 或 `unknown`，不要用预测填充。所有 proposal 都继承 Q05 的 correctness 与 measurement contract。

## 练习 1：限定 Assess baseline

**目标：** 把“用一个小 sample 跑一下，挑最慢函数开始优化”改写成一份进入 Assess 前的 baseline qualification packet，明确 realistic workload、user-facing metric、correctness gate、Q05 measurement protocol、Environment Manifest 与 hotspot-selection artifact。

**约束：** 区分 baseline plan 与 correctness-qualified recorded baseline；说明 workload 的代表性与 exclusions；命名 metric endpoints 和 completion boundary；要求 actual correctness verdict、raw repeated samples、predeclared statistic/spread 与 artifact custody；不得填写 observation 或 numerical claim。

**预期证据：** 一张空 baseline record、workload rationale、correctness/performance gate checklist、missing-evidence inventory，以及只有在真实 artifact 齐全后才允许进入 Parallelize 的 decision rule。

**验收标准：** Packet 不把 toy input 当作 realistic workload；baseline 缺 verdict、raw artifact 或 manifest 时标为未合格；hotspot 有可追溯 profile pointer 和 selection rule；metric scope 与部署约束明确。

<details><summary>提示 1</summary>先问 baseline 是否真的被观察和记录，再问它是否足以比较。</details>

<details><summary>提示 2</summary>Profiler 排名只定位候选；它不自动解释原因，也不批准改写。</details>

## 练习 2：写一项可证伪的受控变更

**目标：** 从已选定的 hotspot 与 mechanism question 出发，为一次 Parallelize 或 Optimize pass 写 explicit falsifiable hypothesis，并设计 one controlled change 的 before/after protocol。

**约束：** Hypothesis 必须命名 change、predicted direction、causal mechanism 与 falsifier；只允许一个 independent variable；列出 held-constant workload、input、metric、endpoints、build/sampling policy 和 environment coordinates；candidate 必须重新通过 correctness；不填写结果。

**预期证据：** 一行 hypothesis ledger、controlled-change scope、confounder table、before/after artifact schema，以及 keep/revert/inconclusive 的 predeclared decision rule。

**验收标准：** 陈述可以被 correctness failure、missing mechanism evidence 或未满足 decision rule 推翻；辅助编辑没有隐藏第二项 optimization；baseline/candidate evidence 可比较；inconclusive 不会被称为 improvement。

<details><summary>提示 1</summary>“让 kernel 更快”缺少 mechanism 和 falsifier，不是一条完整 hypothesis。</details>

<details><summary>提示 2</summary>如果 endpoints 与 code 同时改变，你已经改变了 metric，而不只是 implementation。</details>

## 练习 3：建立 Deploy 与 regression gate

**目标：** 为一个尚无 observation 的 candidate 写 deployment decision matrix，使它只能在 comparable before/after evidence 通过后进入可回滚 rollout，并能触发下一轮 Assess。

**约束：** 分开 correctness、performance、regression 与 operational gates；包含 representative workload set、non-target paths、interface/resource compatibility、artifact links、observability、fallback、rollback owner 和 post-deploy trigger；状态只允许 reject、rework、inconclusive 或 gate-passed，不能预填通过。

**预期证据：** 一张 symbolic gate matrix、required-artifact inventory、release/rollback checklist，以及把 application symptom 交给 Q07、selected-kernel question 交给 Q08、完整 decision trail 交给 LAB08 的 handoff rule。

**验收标准：** Correctness failure 直接拒绝 candidate；evidence 不可比较时保持 inconclusive；regression 或 operational gate 失败时不部署；只有实际 gate records 完整时才允许 rollout，部署后的变化会重新进入 Assess。

<details><summary>提示 1</summary>Deploy 检查的是 release contract，不是某个孤立 sample 是否看起来最好。</details>

<details><summary>提示 2</summary>Rollback owner 与 evidence pointer 都应在 rollout 前确定，而不是故障后补写。</details>

## 下一步

完成后查看独立的[参考解答](/correctness/apod-optimization-loop/solutions/)，再到[练习题库（Practice Bank）PB-R3-001](/practice/#pb-r3-001)审查另一份 APOD proposal。
