---
title: 'M17 参考解答：设计并审查 compiler target artifact plans'
description: M17 三道练习的 all-Lane baseline commands、qualified suffix/Lane matrix，以及 artifact 与 deployment compatibility claim repairs。
pairId: m17-solutions
counterpart: /en/toolchain/compiler-architecture-targets/solutions/
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
unitId: M17-SOLUTIONS
prerequisites:
  - M17-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m17-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M17-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M17-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/toolchain/compiler-architecture-targets/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [M17 练习（Exercise）](/toolchain/compiler-architecture-targets/exercises/)作为 static command、artifact 与 compatibility reviews 解答。它们不执行 `nvcc`、不替代 EX10 inspection、不选择 runtime image，也不建立 compilation、runtime 或 performance evidence。

## 解答 1：all-Lane baseline artifact plan

三条 selected Lane 使用同一 source-level target fragment，是因为 F06 的 reviewed rows 分别接受同一个 baseline pair；不是因为一个 Lane 的 success 可以传播到另一个 Lane：

```bash
--generate-code=arch=compute_75,code=sm_75 \
--generate-code=arch=compute_75,code=compute_75
```

| Toolkit Lane coordinate | Virtual assumptions | Requested SASS/cubin entry | Requested PTX entry | Current evidence |
| --- | --- | --- | --- | --- |
| NVCC 11.8.0 | baseline `compute_75` | `sm_75` | `compute_75` | owner-row acceptance only |
| 12.9.2 archive / page label 12.9 | baseline `compute_75` | `sm_75` | `compute_75` | owner-row acceptance only |
| selected Toolkit 13.3.1 / page label 13.3 | baseline `compute_75` | `sm_75` | `compute_75` | owner-row acceptance only |

第一 clause 请求 assembled real code；第二 clause 保留同一 virtual compilation 的 PTX。下一步必须在每条 Lane 独立记录 exact compiler/host compiler、full command、exit status 与 log，再 inspect resulting artifact。当前没有这些 records，因此 artifact entries、driver compatibility、runtime selection、execution、correctness 与 performance 都 unresolved。

## 解答 2：qualified suffix 与 Lane matrix

Source requirement 决定 suffix；compiler row 决定 spelling 是否 accepted：

| Requirement | Virtual / real pair | SASS clause | Same-scope PTX clause | 11.8.0 selected row | 12.9.2 / 13.3.1 selected rows |
| --- | --- | --- | --- | --- | --- |
| Exact 9.0 | `compute_90a` / `sm_90a` | `arch=compute_90a,code=sm_90a` | `arch=compute_90a,code=compute_90a` | blocked | accepted |
| Family 10.0 | `compute_100f` / `sm_100f` | `arch=compute_100f,code=sm_100f` | `arch=compute_100f,code=compute_100f` | blocked | accepted |
| Exact 10.0 | `compute_100a` / `sm_100a` | `arch=compute_100a,code=sm_100a` | `arch=compute_100a,code=compute_100a` | blocked | accepted |
| Family 12.0 | `compute_120f` / `sm_120f` | `arch=compute_120f,code=sm_120f` | `arch=compute_120f,code=compute_120f` | blocked | accepted |
| Exact 12.0 | `compute_120a` / `sm_120a` | `arch=compute_120a,code=sm_120a` | `arch=compute_120a,code=compute_120a` | blocked | accepted |

`a` clauses preserve exact-capability assumptions from source through real code and retained PTX。`f` clauses preserve named-family assumptions through both outputs。11.8.0 is blocked because its selected reviewed row has no qualified pair, not because a GPU query selected the “wrong” hardware。12.9.2/13.3.1 cells still require independent builds before any Compile-Checked claim。

数字排序不能改变结论。Exact 12.0 不是 exact 10.0 或 family 10.0 的 numeric upgrade；family 12.0 也不是所有 later capabilities 的 wildcard。本题数据不授权任何 unlisted target 或 cross-suffix pair。

## 解答 3：artifact 与 deployment compatibility packet

四项原 claim 都被拒绝：

| Claim | Verdict | Corrected boundary |
| --- | --- | --- |
| Plan F covers every capability `>= 10.0` | false | `compute_100f` / `sm_100f` 只表达 current owner table 中 named 10.0 family scope；numeric ordering 不扩大家族 |
| Plan A covers every capability `>= 12.0` | false | `compute_120a` / `sm_120a` 是 exact 12.0 scope；其 PTX 也保持 exact 12.0 assumptions |
| PTX guarantees older-driver minor compatibility | false | Minor Version Compatibility 要求 target architecture/SASS，并警告 PTX application 在 older driver 上有 runtime restriction |
| Target names prove runtime selection and execution | false | Names 只表达 requested plan；即使 inspection 证明 entries present，也不证明 image selection、JIT、load、launch 或 correctness |

Corrected six-stage ledger 是：

1. **Requested：** Plan F 与 Plan A 各有 same-suffix SASS/PTX clauses。
2. **Build：** 缺 exact executable、host compiler、full options、exit status 与 logs，所以 unknown。
3. **Inspection：** 缺 artifact identity 与 inspection output，所以不能说 entries present。
4. **Scope：** F 只限 named family；A 只限 exact architecture；PTX 不扩大任一 scope。
5. **Deployment：** 缺 GPU capability、loaded driver、Runtime/libraries、OS 与 package。Minor path 的 PTX caveat 必须处理；cross-major forward path还需要 eligible system、适用 package、loader 与 feature checks。
6. **Runtime：** 没有 image-selection、JIT、module-load、launch、completion 或 correctness observation。

Permitted final statement 是：“12.9.2 owner row 接受两份 selected target plans；如果 exact build 与 inspection 后续成功，它们预期分别包含 named-family 100f 与 exact-architecture 120a 的 SASS/PTX entries。Deployment 与 runtime behavior 仍 indeterminate。”

## 有效替代方案

- Source 不需要 qualified feature 时，改写 requirement 后重新评审 unsuffixed baseline plan；这不是简单删除 suffix。
- Release policy 不需要 PTX 时，只保留 selected SASS clauses，但要明确缩小 artifact strategy，并单独审查 deployment。
- 需要多个 deployment scopes 时，为每个 source variant/feature contract 建独立 artifact，而不是假设所有 qualified passes 可安全混入同一 source build。
- Compatibility premise 不完整时输出 indeterminate，并请求 Environment Manifest、build record 与 artifact inspection，而不是猜测 runtime path。

## 常见错误

- 用 `-arch` shorthand 隐藏 virtual、real 与 PTX outputs。
- 把 `compute_75` 当成 installed GPU，或把 `sm_75` 当成 artifact 已存在的证明。
- 让 real target 提供比 virtual source assumptions 更窄的 feature set。
- 把 `a`/`f` 当作 numeric version，或认为 PTX 会移除 suffix restriction。
- 把 12.9.2/13.3.1 owner-row acceptance 投射到 11.8.0 或未列 target。
- 把 minor compatibility、forward compatibility 与 ordinary backward compatibility 合并成一句“driver compatible”。
- 从 planned/inspected entries 声称 runtime selection、execution、correctness 或 speed。

复核日期：**2026-08-29**。Hardware gate 为 none；compilation/runtime evidence axes 与 recorded observations 保持为空。
