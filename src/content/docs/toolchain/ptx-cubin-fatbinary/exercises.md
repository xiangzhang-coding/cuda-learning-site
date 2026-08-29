---
title: 'M16 练习：审查 PTX、cubin、SASS 与 fatbinary artifacts'
description: 用三道静态任务分类 standalone 与 embedded artifacts、构造 SASS-plus-PTX fallback tree，并修复把 image inventory 和 lane-specific PTX observations 夸大为 runtime evidence 的报告。
pairId: m16-exercises
counterpart: /en/toolchain/ptx-cubin-fatbinary/exercises/
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
unitId: M16-EXERCISES
prerequisites:
  - M16
relatedUnits:
  - M16
  - M17
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
    attrs: { name: 'cuda:pair-id', content: m16-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M16-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M16 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M16,M17,M18,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/ptx-cubin-fatbinary/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M16：PTX、cubin、SASS 与 fatbinary](/toolchain/ptx-cubin-fatbinary/)。这些练习只创建 artifact ledger、conditional selection tree 与 evidence repair；不编译 artifact、不调用 driver、不执行 kernel，也不增加 Evidence Status。

## 作答方法

每份答案都要分开记录 artifact kind、standalone/embedded carrier、virtual/real target、inspection operation、已观察事实与尚未观察事实。不得从 filename、较大的版本号或非空 inventory 补写 driver behavior。完成三道题后再查看[参考解答](/toolchain/ptx-cubin-fatbinary/solutions/)。

## 练习 1：分类 standalone artifacts 与 embedded images

**目标：** 审查一份 build directory ledger，其中保留了 `kernel.ptx`、`kernel.cubin`、`kernel.fatbin`、`kernel.o` 与 `app`。静态 notes 只说明：PTX text 有 `.version`/`.target`；standalone cubin 可被 disassemble；external fatbinary 与 `app` 的 inventory 各列出一个 cubin image 和一个 PTX image。为每个 item 分类 PTX、cubin、fatbinary container、host carrier 或 SASS inspection view。

**约束：** 不得只按 suffix 分类；必须说明需要读取的 content/tool evidence。区分 standalone `.fatbin` 与 host object/executable 中 embedded payload，区分 cubin binary 与它的 SASS disassembly。不得声称任何 image 被 selected、JIT-compiled 或 executed。

**预期证据：** 一份 artifact/carrier/image ledger、一张 `source -> PTX/cubin -> fatbinary -> optional host embedding` 关系图，以及每个 inspection operation 的 input boundary。

**验收条件：** PTX 被标为 versioned virtual ISA text；cubin 被标为 architecture-specific binary；SASS 被标为从 cubin 检查的 machine instructions；fatbinary 被标为可承载多个 translations 的 container；`kernel.o`/`app` 被标为可能承载 embedded images 的 host artifacts，而不是 cubin 同义词；所有 runtime columns 保持 unknown。

<details><summary>提示 1</summary>先问“这个文件/container 是什么”，再问“container 里面有哪些 images”；两层不要合并。</details>

<details><summary>提示 2</summary>`cuobjdump --dump-sass` 的 text output 是 inspection result，不是第五种 portable input artifact。</details>

## 练习 2：构造 SASS-plus-PTX fallback tree

**目标：** 一个 static inventory 列出两个 real-target cubin images 和一个 virtual-target PTX image。为三类 launch context 写 decision tree：driver 找到适用 binary load image；找不到 binary image 但有可接受且 assumptions 适用的 PTX candidate；两类 candidate 都不满足。

**约束：** 不得仅按 `XY` 数字大小推导 architecture、family 或 suffix compatibility。每个 branch 必须列出 selected GPU、loaded driver、artifact hash、declared targets 与所需 observation。把 “candidate exists” 与 “driver selected/JIT succeeded” 分成不同状态。

**预期证据：** 一棵三分支 conditional tree、一份每个 transition 的 required-coordinate table，以及 binary selection、PTX JIT 和 no-candidate result 各自仍缺少的 evidence。

**验收条件：** 适用 binary branch 指向 cubin 内 SASS，但只在 selection-specific observation 后才能写 selected；PTX branch 只在没有适用 binary image且 driver/target checks 通过时成为 JIT candidate，并在 JIT-specific observation 前保持未证实；第三分支拒绝从 nonempty fatbinary 推断 execution；三个 branch 都没有 correctness 或 performance claim。

<details><summary>提示 1</summary>Inventory 回答“有哪些 choices”，driver observation 才回答“采用了哪一个 choice”。</details>

<details><summary>提示 2</summary>把 PTX fallback 写成两个 transition：candidate/compatibility review，然后才是 observed JIT result。</details>

## 练习 3：修复 lane observations 与 image inventory 的过度声明

**目标：** 修复下面的 report：它看到 selected Toolkit owner pages 分别标为 PTX ISA 7.8、8.8、9.3，并在一个 host binary 中列出 cubin/SASS 与 PTX，于是断言“PTX universally compatible；driver 一定选择 SASS、没有 JIT；kernel 已正确执行，而且 binary path 在所有 GPU 上更快”。

**约束：** 把 Toolkit 11.8.0、12.9.2、13.3.1 与 PTX ISA 7.8、8.8、9.3 保持为三项 lane-specific documentation observations。为 selection、JIT、execution、correctness 与 performance 分别给出缺失 evidence，不得用一个 observation 代替另一个。

**预期证据：** 一张 `claim -> actual observation -> justified wording -> missing evidence` repair matrix，以及一段不超过 150 words 的 corrected release note。

**验收条件：** Corrected note 只声称三项精确 PTX documentation coordinates 与 static image inventory；不提出 universal compatibility；selection/JIT 标为 unobserved；execution、correctness 与 performance 各自标为 unestablished；若未来升级 claim，则分别要求 exact source/artifact/toolchain、GPU/driver、selection/JIT observation、completion、oracle 与 measurement record。

<details><summary>提示 1</summary>文档页面标题是 source coordinate，不是任意 artifact 的 emitted `.version`，更不是 driver acceptance matrix。</details>

<details><summary>提示 2</summary>按顺序问六次：contained、selected、JIT-compiled、executed、correct、faster；每一问都需要自己的 evidence。</details>

## 下一步

完成后查看独立的[参考解答](/toolchain/ptx-cubin-fatbinary/solutions/)，再审查[练习题库（Practice Bank）PB-R2-008](/practice/#pb-r2-008)。使用 [TERM-118 PTX](/glossary/#term-118)、[TERM-119 cubin](/glossary/#term-119)、[TERM-120 fatbinary](/glossary/#term-120)、[TERM-121 SASS](/glossary/#term-121)以及 [TERM-060](/glossary/#term-060)/[TERM-061](/glossary/#term-061)保持 vocabulary 与 target scope 分离。
