---
title: 'M17 练习：设计并审查 compiler target artifact plans'
description: 用三道静态任务设计 all-Lane baseline SASS/PTX plan、修复 qualified suffix 与 Lane matrix，并审查 artifact/deployment compatibility claims。
pairId: m17-exercises
counterpart: /en/toolchain/compiler-architecture-targets/exercises/
factCheckDate: '2026-08-29'
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
unitId: M17-EXERCISES
prerequisites:
  - M17
relatedUnits:
  - M17
  - EX10
  - VIS09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m17-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M17-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M17 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M17,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/compiler-architecture-targets/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M17：选择编译器架构目标](/toolchain/compiler-architecture-targets/)。这些练习只生成 commands、target matrices、artifact ledgers 与 compatibility verdicts；不调用 compiler、inspect binary、选择 runtime image 或运行 CUDA，因此不增加 Evidence Status。

## 作答方法

每道题都先写 source requirement，再写 exact Toolkit Lane、virtual assumptions、real SASS target、same-scope PTX fallback、expected artifact entries 与 unresolved deployment fields。只使用 M17/F06 的六个 selected pairs。完成三份 static audit 后再查看[参考解答](/toolchain/compiler-architecture-targets/solutions/)。

## 练习 1：设计 all-Lane baseline artifact plan

**目标：** 一份 portable source 只使用 baseline 7.5 feature set。Release policy 要求为 named 7.5 target 请求 SASS，并保留同 scope PTX fallback。为 NVCC 11.8.0、12.9.2 archive 与 selected Toolkit 13.3.1 分别写 explicit `--generate-code` plan 和 verification ledger。

**约束：** 三条 Lane 都只能使用 reviewed `compute_75` / `sm_75` pair；每份 plan 必须用一条 real-code clause 和一条 PTX clause，不得用 shorthand。把 requested、successful build、inspected entry、deployment compatibility 与 runtime behavior 分成五列。不得声称三个 builds 已发生。

**预期证据：** 三行 Lane matrix、可逐 token 审查的 command fragment、两个 expected entries，以及从 build 到 artifact inspection 再到 deployment review 的 gate list。

**验收条件：** 每行都包含 `arch=compute_75,code=sm_75` 和 `arch=compute_75,code=compute_75`；virtual assumptions 保持 baseline；计划要求 SASS 加 PTX，而不预测 runtime selection；build/inspection/driver/GPU/correctness/performance 都保持 unresolved；evidence arrays 不变。

<details><summary>提示 1</summary>`code=sm_75` 与 `code=compute_75` 是两个不同 outputs，但它们共享同一个 `arch=compute_75` source contract。</details>

<details><summary>提示 2</summary>Documentation acceptance 只能填 target-name cell；没有 exit status 和 inspected artifact 时，其他 evidence cells 仍为空。</details>

## 练习 2：修复 qualified suffix 与 Lane matrix

**目标：** 五个 source variants 分别需要 exact 9.0、family 10.0、exact 10.0、family 12.0 与 exact 12.0 feature scope。Reviewer 删除所有 suffix，把 variants 按数值排序，并声称同一 plan 可进入三条 Lane。为每个 variant 恢复 virtual/real pair、same-scope PTX fallback 与 eligible reviewed Lane rows。

**约束：** 只能使用 `compute_90a` / `sm_90a`、`compute_100f` / `sm_100f`、`compute_100a` / `sm_100a`、`compute_120f` / `sm_120f` 和 `compute_120a` / `sm_120a`。NVCC 11.8.0 必须 fail closed；12.9.2 与 13.3.1 只表示 owner-row acceptance。不能从 number、feature-set inclusion 或 family label 推导未复核 cross-pair。

**预期证据：** 五行 requirement-to-target table、每行两条 `--generate-code` clauses、three-Lane acceptance matrix，以及对 baseline/`a`/`f` scope 的一句 reviewer conclusion。

**验收条件：** Exact variants 使用 `a`，family variants 使用 `f`；每个 real target 实现 paired virtual assumptions；PTX clause 保留相同 suffix；所有 qualified variants 在 selected 11.8.0 row blocked，只在 selected 12.9.2/13.3.1 rows accepted；没有 broad catalog、runtime 或 performance claim。

<details><summary>提示 1</summary>先按 source requirement 选择 suffix，再查 compiler row；不要先按 capability number 排 target。</details>

<details><summary>提示 2</summary>把每个 real clause 复制一行，再只把 `code=sm_...` 改为同名 `code=compute_...`，可以暴露 accidental scope change。</details>

## 练习 3：审查 artifact 与 deployment compatibility packet

**目标：** 一份 12.9.2 release packet 只有 planned clauses：Plan F 请求 `compute_100f` / `sm_100f` 加 `compute_100f` PTX；Plan A 请求 `compute_120a` / `sm_120a` 加 `compute_120a` PTX。Packet 没有 build log 或 inspection output，却声称：(1) Plan F 覆盖所有 capability number 大于等于 10.0 的 GPU；(2) Plan A 覆盖所有大于等于 12.0 的 GPU；(3) PTX 保证 older same-major driver 的 minor-version compatibility；(4) target names 证明 runtime 选择与 execution success。逐项修复。

**约束：** 生成 requested/build/inspection/scope/deployment/runtime 六阶段 ledger。使用 current feature-set scope、Why CUDA Compatibility、Minor Version Compatibility 与 Forward Compatibility boundaries；不得猜测 actual GPU、driver、package、library、embedded entry 或 selected image。Compilation 与 runtime evidence 保持为空。

**预期证据：** 四条 claim verdict、两份 corrected scope statements、minor/forward compatibility gate、缺失字段清单，以及 permitted final reviewer statement。

**验收条件：** `100f` 只限 current owner table 的 named family，`120a` 只限 exact 12.0；PTX 不消除 suffix scope；older same-major minor path 要求 target architecture/SASS，且 owner material 警告 PTX restriction；cross-major forward path 需要 eligible system 与适用 compatibility package；静态 packet 不报告 runtime selection、execution、correctness 或 speed。

<details><summary>提示 1</summary>把“target scope”与“driver compatibility path”放在不同列；前者通过也不能自动填后者。</details>

<details><summary>提示 2</summary>Minor-version owner page 对 PTX 与 target architecture 有明确 caveat；Forward Compatibility 则是另一条有 system/package gate 的路径。</details>

## 下一步

完成后查看独立的[参考解答](/toolchain/compiler-architecture-targets/solutions/)，再审查[练习题库（Practice Bank）PB-R2-009](/practice/#pb-r2-009)。使用 [TERM-060](/glossary/#term-060) 至 [TERM-063](/glossary/#term-063)标注 target/scope，并使用 [TERM-118](/glossary/#term-118) 至 [TERM-121](/glossary/#term-121)标注 PTX、cubin、fatbinary 与 SASS。对照 [VIS09](/visuals/artifact-pipeline/)与 related [EX10](/examples/ptx-fatbinary-inspection/)时，仍要保持 placeholder、plan 与 observed artifact 三者分离。
