---
title: 'M15 参考解答：审查 NVCC phases 与 artifact flow'
description: M15 练习的 documented phase replacement、mixed-source host/device trajectory，以及 whole-program、host-link/device-link 与 evidence repairs。
pairId: m15-solutions
counterpart: /en/toolchain/nvcc-compilation-flow/solutions/
factCheckDate: '2026-08-29'
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
unitId: M15-SOLUTIONS
prerequisites:
  - M15-EXERCISES
relatedUnits:
  - M15
  - M16
  - M18
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
    attrs: { name: 'cuda:pair-id', content: m15-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M15-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M15-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M15,M16,M18,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/nvcc-compilation-flow/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [M15 练习（Exercise）](/toolchain/nvcc-compilation-flow/exercises/)作为 static phase/artifact review 解答。它们不替代 canonical EX10 source，不调用 NVCC、不生成或 inspect real artifact、不 link executable，也不建立 compilation、runtime 或 performance evidence。

## 解答 1：把 stable phases 从 internal transcript 中分离

Replacement ledger 只保存 documented phase request：

| request | input | stable selection | primary result | 仍未建立 |
| --- | --- | --- | --- | --- |
| preprocess | `unit.cu` | `--preprocess` / `-E` | preprocessed text | compilation、link、run |
| PTX | `unit.cu` | `--ptx` / `-ptx` | device-only `unit.ptx` | host object、link、run |
| object | `unit.cu` | `--compile` / `-c` | host-linkable `unit.o`/`unit.obj` | final link、run |
| executable | source/object inputs | no phase option, or explicit link selection | executable | execution、correctness、performance |
| convenience run | build inputs plus run request | `--run` / `-run` | execution attempt | passed oracle、coverage、performance conclusion |

Suffix 定义 phase input，phase option 定义 requested output。每次 request 可以使用 explicit output path，让 artifacts 不互相覆盖，但这不改变 phase semantics。

`--dryrun`/verbose transcript 中的 temporary names、internal executables 与 subcommand order 全部归入 **unstable implementation detail**。它们可用于诊断当前 invocation，不能成为长期 build edges。Replacement script 只调用 NVCC documented phases，并检查每个 phase 的 exit status 与 expected output identity；本纸面 plan 本身不声称这些 calls 已成功。

## 解答 2：重建 mixed `.cu` 的两条 trajectory

Annotation ownership 是：`prepare` 只需要 host version；`transform` 只需要 device version；`kernel` definition 进入 device path，而它的 launch expression 在 synthesized host path 被转换；`clamp` 必须分别形成合法的 host 与 device versions。

Device lane 是 `.cu -> device preprocessing -> PTX and/or cubin -> fatbinary image`。在 ordinary object flow 中，该 image 继续交给 host lane embedding。显式 `--ptx`、`--cubin` 或 `--fatbin` 则在对应 device-only artifact 处停止并丢弃 `.cu` host code。

Host lane 是 `.cu -> second preprocessing -> synthesized host C++ with embedded fatbinary -> supported host compiler -> host object -> final host link`。`--cuda` 暴露 `.cu.cpp.ii` boundary；`--compile` 暴露 `.o`/`.obj` boundary。Final link 组合 host objects/libraries 与所需 CUDA runtime libraries。

Host-compiler gate 必须记录 selected Toolkit、platform、compiler executable/version 与 support result。Compiler 出现在 PATH 或 `--allow-unsupported-compiler` 接受 invocation 都不等于 supported。Gate 失败时 plan 应停止或明确披露 unsupported configuration，不能因为 object file 出现就重写 support claim。

整个 graph 只描述 translation ownership 与 artifact boundaries；它没有执行 kernel。

## 解答 3：修复 whole-program 与 evidence claims

Fault 属于 device graph。Default whole-program mode 不允许 device code 引用 separate file entity，并且该 mode 中 device-link steps 没有效果。两个 host-linkable objects 到达 final host linker，不能让 host linker retroactively compile/link 缺失的 cross-file device definition。

**保留 default mode 的 repair：** 让 `consumer.cu` 的 device compilation 在同一 whole-program boundary 内看到 required callee definition，例如把 definition 放在该 translation unit 可见且满足 C++ definition/ODR contract 的 source/header arrangement 中。

**切换 mode 的 repair：** 明确采用 relocatable device code，生成含 relocatable device code 的 objects，执行 documented device link，再执行 final host link。这是 M18 的完整 contract；不能只在原 plan 中随手加入一个 `--device-link` word。

Claim audit：

| observation | bounded conclusion | rejected conclusion |
| --- | --- | --- |
| `.ptx`/`.o`/executable names exist | files can be selected for further identity/type checks | Compile-Checked、Runtime-Verified |
| exact command/log/source/compiler/artifact inspection passes | only the specifically recorded compilation/inspection criteria may qualify | GPU execution、correct output |
| GPU run plus Environment Manifest and oracle passes | only the recorded runtime correctness claim | speedup |
| controlled measurements with declared comparison pass | only the scoped performance result | universal faster claim |

Artifact size alone does not establish instruction quality, runtime selection, elapsed time or speedup。M15 没有上述 observed records，因此所有 evidence arrays 保持为空。

## 有效替代方案

- 只需要 inspect transformed host boundary 时使用 `--cuda`，而不是依赖 internal temporary host source name。
- 只需要 device output 时直接请求 `--ptx`、`--cubin` 或 `--fatbin`，并明确 host code 在该 phase 被丢弃。
- Baseline final link 由 NVCC 驱动，以协调 required CUDA link inputs；仍要把 device link 与 host link 分开记录。
- 小型 whole-program source 可以把 required device definitions 保持在一个 translation-unit boundary；真正需要 cross-file device calls 时再进入 M18。
- Host compiler support 不确定时先验证 selected Toolkit/platform matrix；不要用 bypass flag 伪造 support。

## 常见错误

- 把 `--dryrun` 或 verbose output 当作可复制的 public build recipe。
- 只写 phase option，不记录 input suffix 与 requested output。
- 把 `.ptx`/`.cubin`/`.fatbin` 误当成同时包含 ordinary host program 的 outputs。
- 假设 host/device paths 共用一次 preprocessing，或把 `__host__ __device__` 当作单一 runtime body。
- 把 installed host compiler 当成 supported host compiler。
- 把 host object 当成 executable，或把 final host link 当成 device link。
- 忽略 default whole-program device boundary，然后期待 host linker 修复 cross-file device reference。
- 用 artifact existence/size 宣布 runtime correctness 或 performance。

复核日期：**2026-08-29**。Compilation 与 runtime evidence axes 保持为空。
