---
title: 'Q06 参考解答：设计一轮可证伪的 APOD'
description: Q06 练习的 baseline qualification、controlled hypothesis/evidence contract 与 deployment regression gate review。
pairId: q06-solutions
counterpart: /en/correctness/apod-optimization-loop/solutions/
factCheckDate: '2026-08-31'
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
unitId: Q06-SOLUTIONS
prerequisites:
  - Q06-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: q06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q06-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/apod-optimization-loop/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [Q06 练习（Exercises）](/correctness/apod-optimization-loop/exercises/)解成 symbolic review artifacts。它们没有执行 CUDA、观察 baseline/candidate、生成 profiler report 或建立 performance evidence。所有 observation slots 仍为空。

## 解答 1：限定 Assess baseline

原 proposal 有两个断点：small sample 没有代表性论证，而“最慢函数”没有 correctness-qualified baseline、metric scope 或可追溯 artifact。合格 packet 可以使用以下 schema：

| field | observation 前的要求 |
| --- | --- |
| workload | target use case、input/shape/request mix、代表性理由、exclusions |
| correctness | method、criteria、completion/error checks、actual verdict slot、log pointer |
| metric | user-facing name、included work、start/stop endpoints、completion boundary |
| measurement | warm-up、raw repetitions、run-order policy、predeclared statistic/spread、outlier rule |
| environment | source/build、hardware/software、state、permissions、custody manifest |
| hotspot | profile scope、artifact path/hash、selection rule、unanswered mechanism question |

Review rule 是：只要 actual verdict、raw baseline artifact 或完整 manifest 尚未由真实运行填入，packet 就保持 **baseline plan**，不得进入 Parallelize。Toy workload 只有在给出与目标情形的有效代表性理由时才可能合格；“运行方便”不是理由。Profile pointer 定位候选，但不会证明 causal mechanism。

## 解答 2：写一项可证伪的受控变更

一条合格的 symbolic hypothesis 可以是：如果只移除围绕稳定 intermediate 的重复 host/device transfer，同时保持 semantics 与 comparison coordinates 不变，那么 declared end-to-end metric 应向更低方向变化，因为 included data movement 减少；若 correctness 失败、transfer artifact 仍然存在，或预声明 comparison rule 未通过，则 hypothesis 被推翻或保持 inconclusive。

对应 ledger 记录：

| field | symbolic entry |
| --- | --- |
| independent variable | named transfer-elimination change |
| necessary supporting edits | ownership/lifetime edits required by that change only |
| held constant | realistic workload、input、metric/endpoints、build policy、sampling、manifest coordinates |
| required evidence | correctness logs、source diff、commands、before/after raw samples、relevant profile artifact |
| falsifier | wrong result、mechanism unchanged、decision rule not met、or incomparable protocol |
| disposition | empty until observation |

Candidate 先重新通过 correctness，再按 Q05 contract 与相同 baseline 比较。看到结果前固定 keep/revert/inconclusive rule。若同时改变 algorithm 或 timer endpoints，应拆成另一轮；否则无法把结果归因给 transfer change。

## 解答 3：建立 Deploy 与 regression gate

Decision matrix 可以写成：

| condition | disposition |
| --- | --- |
| correctness 或 error check 失败 | reject；不解释 performance |
| workload、metric、protocol 或 manifest 不可比较 | inconclusive；修复 contract 或建立新 baseline |
| performance decision rule 未通过 | revert 或 rework；不进入 rollout |
| representative regression、interface 或 resource check 失败 | rework；不部署 |
| observability、fallback 或 rollback ownership 缺失 | operational gate failed |
| 所有 gate 都有 actual record | gate-passed；允许可回滚 rollout，并链接 evidence |

Release checklist 还保存 candidate commit/package、baseline/candidate artifact pointers、approved criteria、rollout scope、monitor signals、fallback trigger 和 rollback owner。Application-level symptom 交给 Q07；选定 kernel 的具体问题交给 Q08；LAB08 保存完整 Systems-to-Compute trail。部署后 workload、correctness 或 metric signal 变化时重新进入 Assess，不能沿用旧结论。

## 有效替代方案

- Parallelize 可以选择语义匹配的 existing library、compiler expression 或局部 CUDA refactor；都必须保留同一 evidence contract。
- Hypothesis 可以针对 data movement、launch structure、algorithm 或 kernel mechanism，但一轮只隔离一个 independent variable。
- Q05 允许的 blocked 或 interleaved run order 都可使用，只要在 observation 前声明并在 before/after 保持一致。
- Deploy 可以采用不同 rollout 机制，但必须有 observability、fallback、rollback ownership 与实际 gate records。
- 若 deployment workload 合法变化，可以建立新 baseline，而不是强行把不可比较 evidence 合并。

## 常见错误

- 把未运行的 template 称为 recorded baseline。
- 用 toy input profile 代表未说明的生产 workload。
- 把 hotspot ranking 当作 causal explanation。
- 写“使用 GPU 会更快”而没有 mechanism、falsifier 或 metric。
- 一轮同时改变 algorithm、layout、flags 和 endpoints。
- Candidate 没有重新通过 correctness 就比较时间。
- Before/after 使用不同 included work、statistics 或 manifest，却仍计算 ratio。
- 把 inconclusive 描述成 improvement。
- 把 isolated best sample 当作 Deploy gate。
- 没有 rollback owner 或 post-deploy regression trigger。
- 用预测或 fabricated value 填 observation slot。

复核日期：**2026-08-31**。Compilation、runtime、expected-observation 与 recorded-observation evidence axes 保持为空。
