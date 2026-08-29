---
title: 'Q03 练习：限定 memcheck 调查结论'
description: 用三道静态任务分类 memcheck finding、设计 three-lane command/path coverage plan，并审查 leak、API-error 与 tool-order boundaries。
pairId: q03-exercises
counterpart: /en/correctness/memcheck-invalid-memory-access/exercises/
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
unitId: Q03-EXERCISES
prerequisites:
  - Q03
relatedUnits:
  - Q03
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
    attrs: { name: 'cuda:pair-id', content: q03-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q03 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q03,Q04,EX16,LAB07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/memcheck-invalid-memory-access/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q03：用 memcheck 定位非法内存访问](/correctness/memcheck-invalid-memory-access/)。这些练习只设计 commands 与 interpretations，不调用 Compute Sanitizer，也不运行 GPU。

## 作答方法

对每项 claim 写清 Toolkit/Compute Sanitizer coordinates、executed scenario、checker boundary 与独立 Q01 result gate。不得虚构 transcript 或 error count。全部完成后再查看[参考解答](/correctness/memcheck-invalid-memory-access/solutions/)。

## 练习 1：读取 log 前先分类六种 observation

**目标：** 分类六种 conceptual situations：在已执行路径中，从 `N`-element allocation 的 index `N` 读取 global memory；通过偏移一 byte 的 address 执行 four-byte store；hardware 报告 exception 却不能唯一定位 thread；同一 out-of-bounds expression 位于 test 未走到的 branch；host 在 CUDA API call 外写越 ordinary host allocation；CUDA API 返回 failure，但 application 忽略 return value。

**约束：** 使用 precise supported access、imprecise hardware report、unexecuted path、outside stated memcheck coverage 与 supplemental API report 等 categories。逐项说明 repair 或 next observation。不得虚构 report text、source line、address 或 thread coordinate。

**预期证据：** 六行 classification table、每个 device-side row 的 precision rationale，以及 failed API call 独立的 application-error-handling action。

**验收条件：** 前两项 executed accesses 分别分类为 precise out-of-bounds/misaligned candidates；hardware exception 保持 imprecise；untaken branch 不能被本次 run 排除；host write 不归给 device memcheck；API reporting 不替代 return-value check。

<details><summary>提示 1</summary>“Precise” 描述可归因的 supported event，不是所有 memory-related failure。</details>

<details><summary>提示 2</summary>Dynamic observation 缺失不能说明从未执行的 branch 正确。</details>

## 练习 2：为三个 lanes 设计一份 command contract

**目标：** 为 CUDA 11.8、CUDA 12.9 与 current lane 写一份使用 Q03 conservative intersection 的 access-check command 和 full-leak command，再为 guarded one-dimensional kernel 设计 path matrix。

**约束：** 显式使用 `--tool memcheck` 与 `--report-api-errors explicit`；只在 leak command 增加 `--leak-check full`。Toolkit、driver 与 `compute-sanitizer --version` 分开记录。覆盖 `N = 0`、`1`、`B - 1`、`B`、`B + 1`、data-dependent branch 两侧与 orderly context teardown。不得使用 current-only compile-time instrumentation，也不得把任何 option default 倒推到历史 lane。

**预期证据：** 两份 command templates、three-lane coordinate table、path/launch matrix、required raw-record fields，以及所有 declared cases 均无 access-error report 后允许使用的 strongest claim exact wording。

**验收条件：** Sanitizer options 位于 executable 前；leak plan 到达 context destruction；每个 edge case 命名 expected executed paths；12.9 archival handoff 被记录而非隐藏；clean-result wording 只覆盖 declared runs 与 documented coverage。

<details><summary>提示 1</summary>Web manual version 与 installed executable version 不是可互换的 coordinate。</details>

<details><summary>提示 2</summary>写 “these paths 未报告 error”，不要写 “program 没有 memory error”。</details>

## 练习 3：修复 lifecycle 与 investigation order

**目标：** 审查这段 conceptual sequence：allocate `A`/`B`；忽略 copy into `A` 的 failure；launch kernel；不验证 output；只 free `A`；context teardown 前停止 observation；先 run racecheck；racecheck quiet 就宣布 scenario correct。

**约束：** 保留 two allocations 与 one kernel，但加入 explicit return checks、launch check、asynchronous completion boundary、Q01 CPU-reference/invariant gate、access memcheck run、贯穿 teardown 的 full leak run，以及 remaining sanitizer order。每个 scenario 使用 fresh process，形成 clean lifecycle boundary。不得预测 actual tool output。

**预期证据：** Defect ledger、corrected control-flow pseudocode、ordered tool plan，以及区分 API handling、numerical correctness、access safety 与 leak ownership 的 pass criteria。

**验收条件：** Failed copy 必须 stop 或进入 declared recovery path；`B` 有 documented release；output correctness 独立检查；memcheck 先于其他 tools；full leak checking 观察 context destruction；任何 quiet report 都不升级为 universal proof。

<details><summary>提示 1</summary>Tool 对 failed API 的 message 晚于 program 已经收到的 return value。</details>

<details><summary>提示 2</summary>分开绘制四个 gates：API/completion、result、access 与 lifetime。</details>

## 下一步

完成后查看独立的[参考解答](/correctness/memcheck-invalid-memory-access/solutions/)，再到[练习题库（Practice Bank）PB-R1-022](/practice/#pb-r1-022)审查另一份 plan，然后继续 Q04。
