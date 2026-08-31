---
title: 'Q07 参考解答：建立可审查的 timeline-first 调查'
description: 对三道 Q07 静态练习给出经过复核的 collection、interpretation、custody 与 exact-kernel handoff records。
pairId: q07-solutions
counterpart: /en/correctness/timeline-first-nsight-systems/solutions/
factCheckDate: '2026-08-31'
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
unitId: Q07-SOLUTIONS
prerequisites:
  - Q07-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: q07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-31' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/timeline-first-nsight-systems/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [Q07 练习（Exercises）](/correctness/timeline-first-nsight-systems/exercises/)作为符号证据记录（symbolic evidence record）复核。它们不运行 Nsight Systems 或 Nsight Compute，不填写 observation，也不建立 profiler conclusion。

## 解答 1：设计 versioned collection 与 custody contract

原 instruction 不合格，因为“the app”、tool version、capture scope、correctness state 与 output custody 都未定义。一份通过 review 的 pre-observation record 可以是：

| gate | reviewed symbolic record |
| --- | --- |
| question | 定位 declared representative phase `P` 内的 time；不预设 kernel bottleneck |
| workload | exact executable/arguments、input/shape、source commit、build command、representative-path rationale |
| correctness | Q05 method/criteria、completed baseline/candidate verdict slots、checked CUDA errors |
| run policy | warm-up/exclusion、repetition/order、capture start/stop、completion、process scope、background-load rule |
| environment | full manifest、profiler path、permissions、Toolkit Lane、observed `nsys --version` slot |
| trace | requested CUDA/NVTX/OS runtime/scheduling choices、captured `profile --help`、relative-to-default changes |
| CUPTI boundary | instrumented activity/correlation、diagnostics/dropped-record check、no unprofiled-run equivalence |
| primary artifact | `<report>.nsys-rep`、immutable copy、SHA-256 slot、observer/date、profiler logs/exit status |

三个 bundled component coordinates 都只是 planning references：Toolkit Lane `cuda-11.8` / CUDA Toolkit 11.8.0 对应 `2022.4.2.1`，`cuda-12.9` / CUDA Toolkit 12.9.2 对应 `2025.1.3.140`，`cuda-13.3` / CUDA Toolkit 13.3.1 对应 `2026.1.3.425`。在 actual `nsys --version` 与 help output 附上前，decision gate 仍然 stop。Version unknown 或 options unsupported 时，应在 collection 前修改方法，不能猜测。

每个 derivative 都有 ledger row：source-report hash、exact `nsys stats`/`nsys export` command、observed tool version、stdout/stderr、exit status、output path/hash 与 creation date。Report 保持 primary。Review rule 是：没有 representative workload/correctness verdict，就不 collection；没有 manifest/method/diagnostics/custody，就没有 supported timeline conclusion。

## 解答 2：保守解释 gaps、launches、copies 与 overlap

Symbolic record 只支持以下区分：

| item | supported observation | still only a hypothesis |
| --- | --- | --- |
| CPU interval | 在 phase `steady` 的 launch calls 前可见 | blocking、computation、descheduling、I/O 或 tracing omission |
| API duration | 三个 traced launch calls 各自 entry-to-exit | source-level cause 或 total application launch cost |
| submission gap | API exit 到 correlated `K0` start | queueing、dependency、scheduling、initialization、contention |
| kernel duration | 本 report 中 `S0` 上 `K0` start-to-end | unprofiled duration 或 kernel bottleneck |
| dependency | `ready` 出现在 copy pipeline 中 | 它是否必要，或是否导致 delay |
| overlap | `steady` 中 `S1` HtoD interval 与 `S0` `K0` 相交 | pinned memory、copy-engine cause、speedup 或 repetition-wide overlap |

Scheduling detail 与 profiler diagnostics 缺失，所以 apparent CPU gap 尚未解释，而且必须检查 incomplete tracing。“Launch overhead”必须替换成正在讨论的 exact API duration、submission gap 或 aggregate host launch sequence。

有效 bounded sentence 是：“在 report `<hash pending>` 的 phase `steady` 中，`S1` 的 traced HtoD interval 与 `S0` 的 traced `K0` interval 在 `<timestamps pending>` 相交。”Identity/timestamp slots 为空，说明这仍是 template，不是 recorded observation。要判断 cause，需要 controlled change，以及可比较的 correctness、workload、collection 与 manifest records。

## 解答 3：准备 Systems-to-Compute handoff

一张 reviewed identity card 可以是：

| field | required selection |
| --- | --- |
| Systems source | immutable `.nsys-rep` path/hash |
| application scope | process 与 declared phase/range |
| CUDA scope | context 与 stream |
| kernel identity | full `update(float*)` name 加 launch occurrence 或 correlation identity |
| timeline locator | observed start interval 加用于 disambiguation 的 neighboring event |
| reproducibility | exact workload/input/build/warm-up，加 separate run 的 selection/filter rule |

Handoff question 可以是：“对于代表 phase `P` 的 selected `update(float*)` occurrence，requested memory-workload evidence sections 是否支持其 global-memory access behavior 构成限制的 predeclared hypothesis？”这个 question 足够窄，可以只从 relevant memory-workload section set 开始，但仍受 Q08 availability query 与 replay contract 约束。它没有请求 every metric。

Pass gate 要求所有 identity fields、一次 correct representative Systems run、one kernel-level question、observed `ncu` version/permission plan，并明确承认 Compute report 来自 separate instrumented execution，且可能 replay work。Name-only selection、application-wide question、metric dump，或声称 Compute 延续 literal Systems launch，都会 fail。

## 有效替代方案

- 若明确声明 limitation 且不推断 scheduling cause，可以有意不收集 CPU scheduling traces。
- Capture 可以使用 reviewed duration、hotkey/session boundary 或 NVTX range，只要 installed version 支持，并且 method 保留 representative phase。
- SQLite 之外的 supported export format 也可以接受，但必须记录 schema、command、tool version、source hash 与 omissions。
- Exact-instance identity 可以使用 stable launch occurrence 或 correlation coordinate，只要 repeated names 仍可区分，而且 separate-run selection rule 可复现。

## 常见错误

- 从 Toolkit、driver 或 `nvcc` 推断 `nsys` version，而不是记录 CLI output。
- Profile 一个移除了 representative path 或未通过 correctness 的 convenience input。
- 没有 scheduling、trace-completeness 或 diagnostics evidence 就把 blank space 命名为 CPU bottleneck。
- 不声明 endpoints，就把每个 API-to-kernel interval 都叫 launch overhead。
- 把 copy capability、streams 或 pinned memory 当作 observed overlap 的证据。
- 用 screenshot、stats table 或 detached export 替代 `.nsys-rep`。
- 忽略 CUPTI instrumentation、overhead、buffering 或 dropped-record boundaries。
- 只选择 kernel name，而不是 one exact instance 与 one question。
- 把 separate replaying Nsight Compute run 描述成同一次 Systems launch。

复核日期：**2026-08-31**。Compilation、runtime、expected-observation 与 recorded-observation arrays 保持为空。
