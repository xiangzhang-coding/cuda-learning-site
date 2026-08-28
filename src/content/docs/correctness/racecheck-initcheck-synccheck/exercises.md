---
title: 'Q04 练习：按 sanitizer 作用域诊断缺陷'
description: 用三道静态任务选择 detector、分类 shared-memory hazards，并审查 clean-report coverage claim。
pairId: q04-exercises
counterpart: /en/correctness/racecheck-initcheck-synccheck/exercises/
factCheckDate: '2026-08-28'
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
unitId: Q04-EXERCISES
prerequisites:
  - Q04
relatedUnits:
  - Q04
  - EX16
  - LAB07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q04,EX16,LAB07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/racecheck-initcheck-synccheck/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q04：用 racecheck、initcheck 与 synccheck 定位缺陷](/correctness/racecheck-initcheck-synccheck/)。三道题只要求 static tool-scope、hazard 与 evidence reasoning，不要求 CUDA-capable system。

## 作答方法

先写 access space、conflicting operations、executed path 与所需 guarantee，再选择 detector。所有 command plan 都使用 memcheck first 和 one scenario per process。独立完成三题后再查看[参考解答](/correctness/racecheck-initcheck-synccheck/solutions/)。

## 练习 1：为四个 scenario 选择 detector

**目标：** 为以下四个 conceptual scenario 建 tool-routing matrix：A，两个 threads 无顺序地写同一 shared slot；B，kernel 读取只初始化了一部分的 device global allocation；C，只有 block 中满足 predicate 的 threads 调用 `__syncthreads()`；D，两个 blocks 无 ordering 地写同一 valid global address。

**约束：** 每项先安排独立 memcheck process；之后只能从 racecheck、default initcheck、shared-enabled initcheck、synccheck 或 “none of these proves the claim” 中选择；不得把 racecheck 扩大成 global-race detector；每个 scenario 与每个 tool invocation 都启动新 process。

**预期证据：** 一张包含 address space、defect class、first command、focused command、expected classification 与 uncovered claim 的四行 matrix，以及完整 process/log ledger。

**验收条件：** A 路由到 racecheck；B 路由到 default global initcheck；C 路由到 synccheck；D 明确保留为这些工具未证明的 global ordering defect；全部路线都先通过 memcheck 且没有复用 defect process。

<details><summary>提示 1</summary>先问 location 是 shared 还是 global，再问 defect 是 invalid access、initialization、hazard 还是 primitive misuse。</details>

<details><summary>提示 2</summary>“这个工具不会检查该 claim”也是必须记录的诊断结果。</details>

## 练习 2：分类 WAW、WAR 与 RAW

**目标：** 分类三条没有 ordering edge 的 same-block shared-memory traces：T1 为 `thread 0 write shared[2]` 后另一个 thread write 同址；T2 为 `thread 0 read shared[3]` 后另一个 thread write 同址；T3 为 `thread 0 write shared[4]` 后另一个 thread read 同址。为每条 trace 设计不依赖 implicit lockstep 的 repair obligation。

**约束：** 分别使用 WAW、WAR 与 RAW；先描述 required ordering 或 ownership，再选择 block barrier、合法 warp synchronization、unique writer 或 atomic protocol；不得机械加入 divergent `__syncthreads()`；不得声称修复 shared hazard 同时证明 global memory 没有 race。

**预期证据：** 一张三行 classification table、每条 trace 的 before/after graph、participant set、repair rationale，以及会交给 synccheck 复核的 primitive condition。

**验收条件：** T1/T2/T3 分别得到 WAW/WAR/RAW；WAW repair 消除 competing writes 或定义 atomic ownership；WAR/RAW repair 建立正确方向的 ordering；所有 barrier 都命名合法 participants 和 convergence precondition。

<details><summary>提示 1</summary>A-after-B 的 acronym 先写 earlier operation，再写 later operation。</details>

<details><summary>提示 2</summary>Racecheck 告诉你 conflicting access pair；algorithm 才决定 unique writer、atomicity 还是 rendezvous。</details>

## 练习 3：缩小一份 clean-report claim

**目标：** 审查这项结论：“一个 input 的四项工具都是 clean，所以所有 paths 没有 race、shared/global memory 都已初始化，而且所有 warp/block synchronization 都正确。”为它写一份 bounded replacement statement 和 next-run matrix。

**约束：** 假设 initcheck 使用 default options，只有一个 branch 被执行，synccheck fixture 含一个可能命名未到达 lane 的 `__syncwarp(mask)`；区分 current shared-memory initcheck extension 与 CUDA 11.8 baseline；不得编造 report count、GPU、tool output 或 correctness verdict。

**预期证据：** 一张 claim-to-gap table，覆盖 executed paths、racecheck address space、initcheck option、synccheck non-arrival limitation、numerical correctness 与 exact versions；另附 defect/corrected separate-process rerun plan。

**验收条件：** Replacement 只声称所记录环境与 executed path 上各工具未报告其 scope 内缺陷；next-run plan 显式选择 `shared` 或 `all` 时才讨论 shared initialization；保留 global-race、unexecuted-path、mask non-arrival 与 CPU-reference gaps。

<details><summary>提示 1</summary>把原句中的每个 “所有” 改成具体 input、path、option、tool version 与 checked scope。</details>

<details><summary>提示 2</summary>Clean dynamic analysis 可以缩小 defect search，却不能证明没有执行到的代码。</details>

## 下一步

完成后查看独立的[参考解答](/correctness/racecheck-initcheck-synccheck/solutions/)，再到[练习题库（Practice Bank）PB-R1-023](/practice/#pb-r1-023)审查另一份过度结论。
