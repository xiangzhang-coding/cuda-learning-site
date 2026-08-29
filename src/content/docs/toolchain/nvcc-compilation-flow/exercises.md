---
title: 'M15 练习：审查 NVCC phases 与 artifact flow'
description: 用三道静态任务把 documented phases 从 internal steps 中分离，重建 host/device artifact trajectory，并修复 whole-program、host-compiler 与 evidence boundary errors。
pairId: m15-exercises
counterpart: /en/toolchain/nvcc-compilation-flow/exercises/
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
unitId: M15-EXERCISES
prerequisites:
  - M15
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
    attrs: { name: 'cuda:pair-id', content: m15-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M15-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M15 }
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

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/nvcc-compilation-flow/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M15：NVCC 主机/设备编译流程](/toolchain/nvcc-compilation-flow/)。这些练习只创建 phase matrix、artifact graph、host-compiler gate 与 evidence audit；不运行 NVCC、不生成 artifact，也不增加 Evidence Status。

## 作答方法

每题都写明 input suffix、requested documented phase、output artifact、host/device ownership、下一条 boundary 和明确不成立的 claim。Stable phase 与 internal step 分开，build、artifact inspection、link、run 和 performance 也分开。完成三题后再查看[参考解答](/toolchain/nvcc-compilation-flow/solutions/)。

## 练习 1：把 stable phases 从 internal transcript 中分离

**目标：** 审查一个 build plan。它先对 `unit.cu` 请求 preprocessed text，再分别请求 PTX、host-linkable object、final executable 和 convenience run；但作者把一次 `nvcc --dryrun` 显示的 temporary filenames、private subcommands 与 internal option order 原样复制进长期 build script。为五个 requested boundaries 设计 documented phase plan，并删除不稳定依赖。

**约束：** 每一行必须写 input suffix、phase option 或 default、primary result 与尚未建立的后续 boundary。必须使用 `--preprocess`、`--ptx`、`--compile`、default/final link 和 `--run` 的 documented distinction；不得保留任何 internal subcommand 或声称它跨 release 稳定。

**预期证据：** 五行 phase ledger、一份 stable/unstable classification，以及只调用 NVCC public phases 的 replacement build plan。

**验收条件：** Input suffix 定义 phase input，option 定义 requested output；`--ptx` 产生 device-only artifact；`--compile` 在 object 处停止；final link 与 `--run` 分开；displayed internal steps 只作为 debugging trace 被拒绝。

<details><summary>提示 1</summary>先从每项 requested output 反推 phase，而不是从 dry-run transcript 的第一条 command 开始。</details>

<details><summary>提示 2</summary>如果一个 name 只描述 temporary file 或 hidden tool invocation，而不在 documented supported phase list 中，它不能成为 build dependency。</details>

## 练习 2：重建 mixed `.cu` 的两条 trajectory

**目标：** 一个 `.cu` file 包含 unannotated `prepare`、`__device__` `transform`、`__global__` `kernel` 与 `__host__ __device__` `clamp`。画出 device preprocessing 到 PTX/cubin/fatbinary 的 path，以及第二次 host preprocessing、synthesized host C++、supported host compiler、host object 与 final link 的 path。

**约束：** 标出每个 entity 需要在哪条 path 合法；区分 ordinary object build 中 embedded fatbinary 与显式 `--fatbin` 的 standalone device-only output；加入 host compiler 的 Toolkit/platform/version support gate；不得把 source split 描述成一次 preprocessing 后的文字切割。

**预期证据：** Two-lane artifact graph、annotation ownership table、host-compiler decision gate，以及 `.ptx`/`.cubin`/`.fatbin`/`.cu.cpp.ii`/`.o`/executable 的 ordered ledger。

**验收条件：** Device path 与 host path 各自 preprocessing；PTX/cubin 被 packaged into fatbinary；synthesized host C++ embed fatbinary 并交给 supported host compiler；host object precedes final link；任何 artifact 都不被当作 execution evidence。

<details><summary>提示 1</summary>`__host__ __device__` 表示两条 path 都必须得到合法 version，而不是在 runtime 中把同一 machine code 移来移去。</details>

<details><summary>提示 2</summary>把 `--cuda` output 放在 host preprocessing/synthesis 与 host object 之间；把 standalone `--fatbin` 放在 device-only stop boundary。</details>

## 练习 3：修复 whole-program 与 evidence claims

**目标：** `producer.cu` 定义一个 `__device__` callee，`consumer.cu` 只声明它并从 kernel 调用。Plan 在 default mode 下分别 `--compile` 两个 files，再声称 final host link 会解析 device reference。它还因为找到了 `.ptx`、`.o` 与 executable 就宣布 Runtime-Verified，并因一个 artifact 更小就宣布更快。诊断并修复 plan 与 claims。

**约束：** 说明 default whole-program mode 的 exact device boundary；给出一个保留 default mode 的 source-layout repair，并指出另一条 repair 必须显式进入 M18 的 relocatable-device-code/device-link contract；分别分类 compilation、runtime 与 performance evidence。不得实际 compile 或 benchmark。

**预期证据：** Cross-file reference fault ledger、两分支 repair decision、host-link/device-link boundary map，以及 rejected/allowed claim table。

**验收条件：** Default mode 不允许 device code 引用 separate file entity，且 device-link step 在该 mode 中无效；final host link 不能替代 device link；co-location/visibility 可保留 default mode，另一路需要 M18；artifact existence 最多支持受限 inspection claim，不支持 runtime correctness 或 speedup。

<details><summary>提示 1</summary>先问 missing symbol 属于 host graph 还是 device graph；host linker 只解决前者，不能补做后者的 compilation contract。</details>

<details><summary>提示 2</summary>“文件存在”“程序执行并通过 oracle”“性能更好”分别需要三类不同记录，不能从第一类直接推出后两类。</details>

## 下一步

完成后查看独立的[参考解答](/toolchain/nvcc-compilation-flow/solutions/)，再审查[练习题库（Practice Bank）PB-R2-007](/practice/#pb-r2-007)。使用 [TERM-115 NVCC](/glossary/#term-115)、[TERM-116 host compiler](/glossary/#term-116)和 [TERM-117 compilation phase](/glossary/#term-117)保持 phase 与 tool roles 清晰。
