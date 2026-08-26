---
title: 'F06 参考解答：建立并审查 compute-capability 功能合同'
description: F06 三道练习的独立复核解答、有效替代方案和常见错误。
pairId: f06-solutions
counterpart: /en/foundations/compute-capability/solutions/
factCheckDate: '2026-08-26'
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
unitId: F06-SOLUTIONS
prerequisites:
  - F06-EXERCISES
relatedUnits:
  - F06
  - F08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f06-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F06,F08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/foundations/compute-capability/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [F06 练习（Exercise）](/foundations/compute-capability/exercises/)的**参考解答**。先比较每个前提的来源和 fail-closed boundary，再比较最终 target name。

## 解答 1：建立三份功能与限制合同

Feature-availability table 是：

| Compute capability | 硬件 `memcpy_async` | Thread Block Cluster | Architecture-specific set | Family-specific set |
| --- | --- | --- | --- | --- |
| 7.5 | 否 | 否 | 否 | 否 |
| 9.0 | 是 | 是 | 是 | 否 |
| 12.0 | 是 | 是 | 是 | 是 |

独立的 numeric-limit table 是：

| Compute capability | Warp 大小 | 每 block 最大 thread 数 | 每 SM 最大 shared memory | 每 block 最大 shared memory |
| --- | ---: | ---: | ---: | ---: |
| 7.5 | 32 | 1024 | 64 KiB | 64 KiB |
| 9.0 | 32 | 1024 | 228 KiB | 227 KiB |
| 12.0 | 32 | 1024 | 100 KiB | 99 KiB |

Capability key 选择这些行，但不能识别产品。最大值不能说明推荐配置或相对性能。这些 lookup 没有执行 compiler 或 GPU，也不添加 Evidence Status。

## 解答 2：修复四份 compiler-target plan

| Plan | Compiler 是否列出两个名称？ | Scope review | Verdict | 最小合格修复 |
| --- | --- | --- | --- | --- |
| A：NVCC 11.8.0，`compute_100` / `sm_100` | 否 | 未进入 | 被 compiler acceptance 阻塞 | 若必须使用 10.0，显式选择并记录支持它的 lane，例如已复核的 12.9.2 或 13.3.1 坐标；NVCC 11.8.0 没有可替代的 10.0 target |
| B：NVCC 12.9，`compute_90a` / `sm_100` | 是 | `a` 只限精确 9.0，因此 `sm_100` 不能实现该 contract | 被 suffix scope 阻塞 | 对 9.0 architecture-specific set 使用 `compute_90a` / `sm_90a`；否则围绕明确足够的 baseline set 重新设计 |
| C：NVCC 13.3，`compute_100f` / `sm_120` | 是 | `100f` 只限 owner 声明的 10.x family，不是 12.x | 被 family scope 阻塞 | 对 12.0 family set 使用 `compute_120f` / `sm_120f`；对 baseline 12.0 使用 `compute_120` / `sm_120` |
| D：NVCC 13.3，`compute_120` / `sm_120` | 是 | Real 12.0 target 实现 baseline 12.0 virtual assumption | 有效 plan | 不修 target name；继续独立的 environment 与 artifact 检查 |

“有效 plan”只表示所选 owner 文档接受名称及其 feature-set relationship。它不表示 command 已编译、artifact 含有预期 code、driver 能加载它或 GPU 已执行它。

## 解答 3：先 fail closed，再只重新打开有依据的 decision

| 阶段 | 已观察事实 | 允许的结论 | 被阻塞的结论 / 下一项事实 | Evidence effect |
| --- | --- | --- | --- | --- |
| 初始 packet | Model Z、24 GB 与 banner field `CUDA Version: 13.3` | 只保留这些 raw inventory statement | Compute capability 未知，应直接查询；installed Toolkit、NVCC、driver release、host compiler、OS 与 artifact 均未知 | 无 |
| Direct hardware query | Selected device 报告 compute capability 10.0 | 应用 F06 的 10.0 feature row 与 limits：两个精选功能可用，两类带后缀集合存在，warp 32，每 block 1024 threads，shared-memory 最大值 228/227 KiB | 不能从 10.0 反推产品；feature presence 不表示 source use 或 target support | 无 |
| Compiler observation | Installed compiler 是 NVCC 11.8.0 | 应用 NVCC 11.8.0 accepted-target list | 该 compiler 坐标不接受 `compute_100`、`compute_100f` 与 `compute_100a`；提出其中任一项前应显式选择并记录支持它的 lane | 无 |
| 剩余 environment | 缺少 driver release、host compiler、OS boundary、artifact、run、correctness 与 measurement | 把每项标为 unresolved | 不作 environment compatibility、runtime、correctness 或 performance verdict | 无 |

Target-plan 结论是：**直接查询到的 10.0 hardware contract 存在，但 requested `compute_100a` plan 被 installed NVCC 11.8.0 阻塞，直到显式选择并观察到支持它的 compiler lane。**

Environment-status 结论是：**indeterminate；硬件与 compiler 事实不能填补缺失的 Toolkit、driver、host compiler、OS、artifact、correctness、execution 或 measurement 坐标。**

## 有效替代方案

- 可以通过 direct Runtime、Driver API、NVML 或文档声明的 `nvidia-smi` query 获取 compute capability，但必须记录 selected device identity 与方法。
- 源码只需要 baseline feature 时，可以使用 baseline target 代替 `a` 或 `f` target。应说明减少后的 feature assumption，不能把改变写成自动 fallback。
- 可以把结果写成彼此独立的 hardware、compiler 与 environment 表，也可以写成一张字段明显分开的 ledger。两种形式都必须显式保留未知字段。
- 对 Plan C，`compute_120` / `sm_120` 与 `compute_120f` / `sm_120f` 都可能成为不同 source requirement 下的有效 target-name repair；由 requirement 决定使用哪一种。

## 常见错误

- 从 product name、memory capacity、architecture nickname 或 `CUDA Version` banner field 推断 compute capability。
- 把 feature row 当成 source 使用该功能，或 selected compiler 能表达该功能的证明。
- 把 shared-memory 最大值或更大的 capability 数字当成性能排名。
- 因为另一个 capability 数字更大，就把 architecture-specific `a` target 与它配对。
- 把 family-specific `f` target 带入另一个 family，或不查 owner table 就假定同 major capability 都是 family-compatible。
- 在确认精确 NVCC release 接受 target name 之前先判断 target compatibility。
- 把 table lookup 或 valid plan 写成 Compile-Checked、Runtime-Verified、environment compatibility 或 measured performance。

复核日期：**2026-08-26**。这些解答不执行 CUDA、不生成 compiler artifact，也不改变任何 Evidence Status。
