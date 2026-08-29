---
title: 'M10 练习：跟踪托管内存访问与迁移'
description: 用三道深入静态任务构建 conditional page ledger、修复 ping-pong access pattern，并设计 EX08 migration-evidence plan。
pairId: m10-exercises
counterpart: /en/memory/unified-memory-page-migration/exercises/
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
unitId: M10-EXERCISES
prerequisites:
  - M10
relatedUnits:
  - M10
  - M09
  - VIS08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m10-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M10 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M10,M09,VIS08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/unified-memory-page-migration/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [M10：统一内存与页面迁移](/memory/unified-memory-page-migration/)。这些练习使用 symbolic pages 与 conditional system models；它们不查询 residency、不执行 EX08，也不观察 migration。

## 作答方法

每次 access 都写 accessor、touched pages、synchronization edge、known state 与 permitted system behaviors。只有 evidence 建立后才把 event 标为 migration；否则使用 “candidate” 或 “unknown”。独立完成后再查看[参考解答](/memory/unified-memory-page-migration/solutions/)。

## 练习 1：构建 conditional per-page ledger

**目标：** 跟踪 managed pages A、B、C 的 sequence：CPU 初始化三页；在 ordering boundary 后，GPU 读取 B/C 并写 C；GPU completion 后，CPU 读取 C。

**约束：** Residency 从 unknown 开始。分别为 software-coherent full support、hardware-coherent/documented direct access 与 limited support 建立 branches。每个 branch 都保留同一个 virtual pointer 与 correctness edges。不得虚构 page size、fault count、migration count 或 duration。

**预期证据：** 每个 access phase 一行，包含 touched pages、prior known facts、possible service mechanism、possible next state，以及把 possibility 变成 observation 所需的 additional runtime artifact。

**验收条件：** Accessibility 绝不作为 locality proof；software branch 可以把 cross-processor access 标为 migration candidate；hardware/direct branch 允许 no-migration service；limited branch 使用自己的 coarser execution boundary；final CPU read 位于 GPU completion 之后。

<details><summary>提示 1</summary>把 “same address” 放在 accessibility column，不要放在 residency column。</details>

<details><summary>提示 2</summary>按 applicable coherency model 分 branch，不要强迫所有 system 经过同一 arrow。</details>

## 练习 2：修复 CPU-GPU ping-pong design

**目标：** 审查一个 loop：CPU 写 managed page，一个 kernel 更新它，CPU 立即读取并改写，second kernel 再消费它；该 pattern 在多页上重复。

**约束：** 在保持 algorithm result 的前提下，提出 phase-oriented access order 与一项 optional prefetch/advice strategy。解释 possible page-level movement cost，但不得把 M02 32-byte segments 改写成 page sizes。Hint 只能作为 non-binding performance guidance，并保留 valid on-demand path。

**预期证据：** Original access sequence、locality-pressure diagnosis、两份 repaired schedules、explicit synchronization edges，以及仍需 runtime evidence 的 claim list。

**验收条件：** Diagnosis 把 alternating processor access 识别为 possible migration/remote-access pressure；algorithm 允许时 repair 会 grouping ownership phases；prefetch 位于 consumer 前并有 order；advice 不成为 correctness premise；任何 variant 都不被称为 faster。

<details><summary>提示 1</summary>先问每次 CPU touch 是否都必须发生在两个 kernels 之间。</details>

<details><summary>提示 2</summary>把 potential fault 提前会改变 scheduling，但不证明 movement 消失。</details>

## 练习 3：设计 EX08 observation contract

**目标：** 规定未来如何比较 EX08 on-demand、advised 与 prefetched modes，并分开 correctness、applicable system model、page-fault/migration evidence 与 performance evidence。

**约束：** 固定 allocation size、access sequence、kernel work、output oracle、launch 与 selected Toolkit Lane。记录四项 relevant device attributes、Native Linux/kernel/driver details、topology、exact tool/metric definitions、raw logs、warm-up、timing boundary 与 repetitions。VIS08 与 source comments 不提供 observation。

**预期证据：** Preregistered schema、三条 observation fields 为空的 mode rows、stop conditions，以及 unsupported metrics、no migration observed、migration observed、inconclusive data 的 allowed conclusions。

**验收条件：** Profiling/timing 前先检查 correctness；system model 由 recorded attributes 选择；metric 缺失时不能用 inference 补齐；fault、movement、residency 与 elapsed time 分字段；当前任何 row 都不包含 fabricated data。

<details><summary>提示 1</summary>同一 physical event 在不同 tool 中可能呈现不同，因此必须命名 metric 及其 layer。</details>

<details><summary>提示 2</summary>“没有 migration evidence”不等于“page 从未移动”。</details>

## 下一步

完成后查看独立的[参考解答](/memory/unified-memory-page-migration/solutions/)，复核[练习题库（Practice Bank）PB-R2-002](/practice/#pb-r2-002)，并把 conditional ledger 与 [VIS08](/visuals/page-migration/)对照。练习集复核日期：**2026-08-29**。
