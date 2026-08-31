---
title: 'Q07 练习：建立可审查的 timeline-first 调查'
description: 定义有版本约束的 Nsight Systems collection，解释 symbolic application-timeline evidence，并在不虚构 profiler observation 的前提下准备 exact-kernel handoff。
pairId: q07-exercises
counterpart: /en/correctness/timeline-first-nsight-systems/exercises/
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
unitId: Q07-EXERCISES
prerequisites:
  - Q07
relatedUnits:
  - Q07
  - EX07
  - LAB06
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
    attrs: { name: 'cuda:pair-id', content: q07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q07,EX07,LAB06,LAB08,VIS14' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/timeline-first-nsight-systems/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q07：先用 Nsight Systems 阅读应用时间线](/correctness/timeline-first-nsight-systems/)。这三项都是静态设计与审查任务（static design and review task），不需要 GPU 或 profiler。所有观察槽（observation slot）保持为空，不得虚构 timeline interval、duration、overlap、bottleneck 或 speedup。

## 作答方法

只根据题目给出的符号记录（symbolic record）作答。区分观察（observation）与解释（interpretation），指出缺失证据，并保留 representative-workload、correctness、version、collection-method 与 report-custody gates。独立完成后再查看[参考解答](/correctness/timeline-first-nsight-systems/solutions/)。

## 练习 1：设计 versioned collection 与 custody contract

**目标：** 把“对 app 运行 Nsight Systems 并查看 report”改写成一份 observation 前 collection record，用于一个 representative application interval。

**约束：** 包含 exact workload/input、representativeness rationale、Q05 correctness verdict、warm-up/capture/completion policy、Environment Manifest、trace domains、`nsys --version`/help capture、symbolic `nsys profile` command、CUPTI/dropped-record boundary、`.nsys-rep` name、logs、exit status、hashes 与 observation owner/date。Selected bundled Nsight Systems component coordinates `2022.4.2.1`、`2025.1.3.140`、`2026.1.3.425` 只是 references，既不能替代 observed CLI output，也不能替代单独记录的 Toolkit Lane。不得填写 result。

**预期证据：** 一份 observation fields 仍为空的完整 method template、version-gate decision、ordered artifact inventory，以及 manifest/method 缺失时拒绝 timeline conclusion 的规则。

**验收标准：** Workload 在 collection 前具代表性且已通过 correctness。每个 option 都对照 observed CLI。原始 `.nsys-rep` 保持 primary/immutable；stats 与 exports 被标成 versioned derivations；CUPTI instrumentation 不得描述成 unmodified run。

<details><summary>提示 1</summary>先写清 version、correctness、method 或 custody 未知时，这份 record 必须拒绝哪些 claims。</details>

<details><summary>提示 2</summary>Minimum bundle 需要 command 与两类 program logs、report/hash、manifest/correctness verdict，以及每项 stats/export artifact 的 derivation ledger。</details>

## 练习 2：保守解释 gaps、launches、copies 与 overlap

**目标：** 审查以下 symbolic trace description：phase `steady` 在三个 short launch API calls 前有一个 visible CPU interval；kernel `K0` 稍后在 stream `S0` 开始；`S1` 中一项 HtoD copy 与 `K0` 的部分区间相交；event `ready` 连接 copy pipeline；scheduling detail 与 profiler diagnostics 缺失。

**约束：** 分离 visible observations 与 hypotheses。定义 CPU gap、API duration、API-exit-to-device-start gap、kernel duration、copy interval、stream identity、dependency 与 observed overlap。列出检验 host blocking、launch overhead、queueing、dependency 和 copy-overlap causes 所需的 evidence。不得推断 pinned memory、engine use、causal speedup 或 captured interval 之外的行为。

**预期证据：** 一张 observation/hypothesis table、interval endpoint ledger、missing-trace/dropped-record checks，以及对 HtoD/`K0` intersection 的 bounded statement。

**验收标准：** Blank space 本身不是 diagnosis；“launch overhead”被拆成 named interval；overlap statement 只适用于本次 captured phase/streams；`ready` event 被当作需要检查的 dependency；所有 causal claims 都等待 additional evidence。

<details><summary>提示 1</summary>先描述每个 row 与 timestamp 显示了什么，再给 spaces 分配原因。</details>

<details><summary>提示 2</summary>最强且受支持的 overlap sentence 应命名 phase `steady`、`S1` 中 HtoD、`S0` 中 `K0`、相交 timestamps 与 report identity；此时仍不讨论 cause 或 speedup。</details>

## 练习 3：准备 Systems-to-Compute handoff

**目标：** 把含 repeated `update(float*)` launches 的 representative Systems report 改写成 handoff record，标识 one exact instance 与 one kernel-level question。

**约束：** 把 report hash/application phase 绑定到 process、CUDA context、stream、kernel name、launch occurrence 或 correlation identity，以及 observed start interval。声明一个 question、用于 separate Nsight Compute execution 的 reproducible selection rule，并只提出该 question 所需的 metric sections。保留 Nsight Compute 可能 replay work、不会 profile 字面上同一次 Systems launch 的事实。

**预期证据：** 一张 selected-instance identity card、一个 question、pass/fail handoff gate、最小 proposed section/metric family，以及从 new run 回到 Systems report 的 custody link。

**验收标准：** 答案不能选择“all `update` kernels”、dump metrics，或在 question 仍是 application-wide 时 hand off。先固定 one exact instance 与 one specific question。New collection 必须标为 separate instrumented execution，而不是 `.nsys-rep` 的 continuation。

<details><summary>提示 1</summary>同一个 kernel name 重复出现时，name 本身不是 instance identity。</details>

<details><summary>提示 2</summary>把 question 缩小到足以在运行 Nsight Compute 前排除大部分 metric sections。</details>

## 下一步

查看独立的[参考解答](/correctness/timeline-first-nsight-systems/solutions/)，在[练习题库（Practice Bank）PB-R3-002](/practice/#pb-r3-002)中分类另一份 record，再把相同 gates 带入 [LAB06](/labs/build-overlapped-pipeline/)、[LAB08](/labs/profile-full-application-before-kernel/)与 [VIS14](/visuals/nsight-systems-versus-nsight-compute/)。
