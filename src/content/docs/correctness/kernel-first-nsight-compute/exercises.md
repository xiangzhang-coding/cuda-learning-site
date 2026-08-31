---
title: 'Q08 练习：设计有边界的 selected-kernel profile'
description: 用三道静态任务建立 Systems-to-Compute handoff、选择最小 queried evidence，并审查 metric interpretation 与 .ncu-rep custody。
pairId: q08-exercises
counterpart: /en/correctness/kernel-first-nsight-compute/exercises/
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
unitId: Q08-EXERCISES
prerequisites:
  - Q08
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
    attrs: { name: 'cuda:pair-id', content: q08-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/kernel-first-nsight-compute/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q08 }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/kernel-first-nsight-compute/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q08：用 Nsight Compute 回答一个选定内核问题](/correctness/kernel-first-nsight-compute/)。以下都是静态证据设计任务（static evidence-design tasks），不需要 GPU，也不会产生 profiler observation。

## 作答方法

从选定内核（selected kernel）与问题出发，逐步收敛到最小充分证据（minimum sufficient evidence）。所有 observation slots 保持 empty 或明确写 unknown。Decision trail、replay boundary 与 custody fields 完整前，不要打开[参考解答（reviewed solutions）](/correctness/kernel-first-nsight-compute/solutions/)。

## 练习 1：写出 Systems-to-Compute handoff

**目标：** 把 representative Nsight Systems selection 转成一个可审查 Nsight Compute target。已给 selection 标出 process `app`、demangled kernel `transform_kernel`、一条 stream、workload `W` 下第四次 matching launch，以及一个 global-memory symptom。写出一个 specific predeclared question，并为 corresponding Compute run 建立 filter ledger。

**约束：** 保留 source `.nsys-rep` identity、process、stream、launch occurrence、workload、input 与 correctness verdict。声明 kernel-name basis、exact/regex match、launch skip/count、target process 与 equivalence rule。明确 Systems/Compute 是 separate executions，filter 寻找的是 corresponding occurrence，而非同一个 physical instance。此题不选择 metric。

**预期证据：** 一张 selected-instance table、一个 falsifiable kernel question、一个 symbolic filter、equivalence/mismatch fields，以及 support/reject/return-to-Systems exit rules。

**验收标准：** 只选一个 kernel occurrence 与一个 question；不把 `--launch-count 1` 单独当作充分 identity；问题能够决定下一题的 section/metric choice；handoff 不声称在原 timeline event 上原地添加 counters。

<details><summary>提示 1</summary>把“第四次 matching launch”同时视作 source coordinate 与 filter problem；只匹配 name 仍可能选错 occurrence。</details>

<details><summary>提示 2</summary>写任何 counter name 前，先写清 answer 会改变哪项 decision。</details>

## 练习 2：查询并最小化 collection

**目标：** 围绕练习 1 的问题，使用 exact tool/GPU coordinates、performance-counter permission、section/metric availability 与一个 minimal collection plan 设计 pre-collection gate。

**约束：** 包含 `ncu --version`、`ncu --list-sections`、`ncu --query-metrics` 的 retained outputs，以及 GPU identity/compute capability、driver/Toolkit、permission result、exact filter 与 replay mode。只选择一个 queried section 或一个 short queried metric list，不做 metric dump。记录每个 chosen name、definition、unit 与 scope。不得虚构 availability result、pass count 或 value。

**预期证据：** 一张带 pass/stop decisions 的 gate table、empty query-result slots、一个 symbolic `ncu` command、minimum evidence-to-question mapping 与 replay/perturbation disclosure。

**验收标准：** Permission denial 会 stop collection，不会变成 zero；selection 来自 exact GPU/tool 的 actual query output；每个 requested item 都映射到 declared question；replay 可能包含 multiple passes、perturbation、serialization 或 different execution；command 会导出 retained `.ncu-rep`。

<details><summary>提示 1</summary>Section 只有在其 rules 回答问题时才方便；方便不等于可以收集全部 sections。</details>

<details><summary>提示 2</summary>减少 requested evidence 可以缩小 replay surface，但不能证明 run 未受扰动。</details>

## 练习 3：审查 interpretation 与 report custody

**目标：** 审查 claim：“memory metric 很高，所以 coalescing 与 shared memory 都不好；这个 `.ncu-rep` 证明修复后会更快。”把它替换成 bounded interpretation template 与完整 report-custody record。

**约束：** 把 M02 expected requested-byte/segment reasoning 与 observed global-memory evidence 分开，也把 M03 expected staging/reuse reasoning 与 observed shared-memory evidence 分开。要求 exact metric names、definitions、units、denominators、scopes、filters、permission、replay、version、workload 与 correctness。记录 source `.nsys-rep`/`.ncu-rep` paths or hashes、commands、stdout/stderr、observer 与 date。不得给 numerical value 或 speedup。

**预期证据：** 一张 claim-audit table、两项 mechanism-specific interpretation rows、missing-evidence inventory、`.ncu-rep` custody ledger 与 next-action verdict。

**验收标准：** 缺 definition、unit、denominator 与 comparison 时拒绝“high”；coalescing/shared-memory claims 保持分离；不把 correlation 写成 causation/speedup；report 被披露为 separate profiled execution，且不覆盖 original artifact 也可复核。

<details><summary>提示 1</summary>追问一个 value 排除了什么；若什么也没排除，它还不能选择 repair。</details>

<details><summary>提示 2</summary>Report filename 不是 custody；补上 command、filter、versions、replay、permissions、hash 与 Systems selection 的关系。</details>

## 下一步

查看独立的[参考解答](/correctness/kernel-first-nsight-compute/solutions/)，再完成[练习题库（Practice Bank）PB-R3-003](/practice/#pb-r3-003)，然后进入 [LAB08](/labs/profile-full-application-before-kernel/)。
