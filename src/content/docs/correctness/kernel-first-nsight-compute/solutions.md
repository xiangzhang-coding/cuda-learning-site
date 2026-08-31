---
title: 'Q08 参考解答：设计有边界的 selected-kernel profile'
description: Q08 练习的 reviewed handoff、minimal collection、metric interpretation、replay 与 .ncu-rep custody answers。
pairId: q08-solutions
counterpart: /en/correctness/kernel-first-nsight-compute/solutions/
factCheckDate: '2026-08-31'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - common-errors
resourceKind: solution-set
unitId: Q08-SOLUTIONS
prerequisites:
  - Q08-EXERCISES
relatedUnits:
  - Q08
  - Q06
  - EX07
  - LAB08
  - VIS14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q08-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/kernel-first-nsight-compute/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q08,Q06,EX07,LAB08,VIS14' }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/kernel-first-nsight-compute/solutions/" lang="en">Read the English counterpart</a>

## 复核前

以下答案把 [Q08 练习（Exercises）](/correctness/kernel-first-nsight-compute/exercises/)作为静态证据合同（static evidence contracts）复核。它们不执行 Nsight Compute，不断言 availability，不填写 metric，也不创建 report。

## 解答 1：写出 Systems-to-Compute handoff

一份完整 handoff 可以写成：

| field | reviewed answer |
| --- | --- |
| source selection | retained `.nsys-rep` path/hash；process `app`；demangled `transform_kernel`；recorded stream；第四次 matching launch；workload `W`；exact input；passing correctness record |
| question | “对 workload `W` 下 corresponding fourth `transform_kernel` launch，其 observed global-memory behavior 是否与 M02 request-shape hypothesis 一致，该结果会保留还是拒绝 proposed layout investigation？” |
| filter plan | demangled name basis；anchored exact-name regex；跳过 predeclared number of matching launches；收集 one matching launch；保留 process/workload filters |
| equivalence | application revision、workload、input、launch order、stream topology 与 correctness 必须一致；profiler/tool instrumentation 明确不同 |
| exit | 只支持或拒绝 request-shape hypothesis；occurrence matching 或 representative behavior 分叉时返回 Systems |

Filter 在一次 new run 中选择对应 occurrence（corresponding occurrence），不可能识别 Systems report 里已经完成的 physical launch。Collection 前要验证 actual matching order，不能假定 name 加 `--launch-count 1` 已是 exact identity。

**复核：** 通过。One occurrence、one question、one decision 与 separate-run boundary 都已明确，而且没有在 question 前选择 metric。

## 解答 2：查询并最小化 collection

Gate 在解释任何 report 前设置 stop conditions：

| gate | retained field | decision |
| --- | --- | --- |
| tool/target | exact `ncu --version`、GPU identity/CC、driver、Toolkit、application revision | coordinate 缺失或 mismatch 时 stop |
| permission | performance-counter probe result 与 full error/context | denial 时 stop；绝不记录为 zero |
| availability | 该 GPU/tool 的 complete `--list-sections` 与 `--query-metrics` outputs | 只选择 returned names |
| selection | name basis、anchored regex、skip/count、process、workload、matching occurrence | corresponding launch ambiguous 时 stop |
| replay | exact replay mode 与 reported pass/matching facts | 披露 perturbation、serialization、re-execution 或 application relaunch |
| output | immutable `.ncu-rep` path 与 stdout/stderr | collection incomplete 时 stop interpretation |

一个 symbolic plan 只选择 documented rules 能回答 global-memory question 的 single queried section。若每项 metric 都直接映射问题，也可以使用 short queried metric list。两种方案都保留 exact names、definitions、units、scopes 与 query output，不请求 unrelated sections。

Collection command 组合练习 1 filter、一个 chosen `--section` 或 explicit `--metrics` list、`--export`、fixed application 与 fixed workload arguments。减少 requested items 可能减少 collection passes，但 record 仍应说明 replay 会 perturb/serialize execution，而 application replay 是 another execution。

**复核：** 只有 target environment 填入每个 query slot 后才通过。Static template 本身不授予 permission、availability 或 expected observation。

## 解答 3：审查 interpretation 与 report custody

原 claim 未通过四项检查：“memory metric”没有 exact identity；“high”没有 unit、denominator、definition、baseline 或 scope；coalescing 与 shared memory 是不同 mechanisms；counter correlation 不能承诺 repair 更快。

有边界的替换版本是：

| question | expected model | observed evidence contract | permitted interpretation |
| --- | --- | --- | --- |
| coalescing | M02 active lanes、requested bytes、width、alignment 与 expected segment set | selected occurrence 的 exact queried global-memory names、units、definitions、scope、filter 与 replay | 只判断是否与 request-shape hypothesis 一致；不自动得到 bottleneck/speedup |
| shared memory | M03 staged values、participants、barriers、traffic 与 reuse expectation | separate queried shared-memory names、units、definitions、scope、filter 与 replay | 只有 documented metric 能检验 question 时，才写 bounded traffic/conflict/stall observation |

保管记录（custody ledger）保留 both report hashes、selected-instance ledger、application/source revision、exact commands、GPU/software versions、permission、replay、filter/matched occurrence、workload/input、correctness verdict、query outputs、metric definitions/units、stdout/stderr、observer、date、immutable `.ncu-rep`，以及 sanitized-derivative mapping。Original reports 不被覆盖。

Next-action verdict 是 **unsupported as written**。真实 collection 后，evidence 最多支持或拒绝一个 narrow mechanism hypothesis；因果 performance claim 仍需要 separate correct reports 构成的 controlled baseline/candidate experiment。

**复核：** 通过。Expected models、observed evidence、interpretation、causality 与 custody 保持分离。

## 常见错误

- Representative Systems timeline 尚未选择 exact kernel occurrence 就启动 Nsight Compute。
- Question 之前先选择 metrics。
- 把 kernel-name match 或 `--launch-count 1` 当作完整 identity。
- 把 permission denial 或 unavailable metrics 写成 zero。
- 把收集全部 sections 当作 metric dump。
- 隐藏 replay、profiler perturbation、serialization 或 application relaunch。
- 比较 unit、definition、suffix、scope、GPU 或 tool version 不同的 names。
- 缺 denominator/competing explanation 时把 large value 称作 bottleneck。
- 声称 `.nsys-rep` 与 `.ncu-rep` 包含同一个 physical launch。
- 只保留 filename，不保留 command、filter、version、permission、replay、hash 与 report custody。

复核日期：**2026-08-31**。Compilation 与 runtime evidence axes 保持为空。
