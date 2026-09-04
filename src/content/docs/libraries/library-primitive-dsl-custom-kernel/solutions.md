---
title: 'L01 复核解答：先写决策包，再考虑自定义内核'
description: 复核 provisional primitive baseline、公平比较协议、lifetime ownership、有效替代方案与常见决策错误。
pairId: l01-solutions
counterpart: /en/libraries/library-primitive-dsl-custom-kernel/solutions/
factCheckDate: '2026-09-04'
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
unitId: L01-SOLUTIONS
prerequisites:
  - L01-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l01-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/library-primitive-dsl-custom-kernel/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/libraries/library-primitive-dsl-custom-kernel/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [L01 练习](/libraries/library-primitive-dsl-custom-kernel/exercises/)的独立参考解答与复核记录。它只评估静态 decision records。没有候选被构建、执行或测量，因此所有 performance cells 都保持 `unrecorded`。

## 解答 1：Provisional baseline

Domain-library row 因未提供 exact domain operation 而延后。CCCL reusable primitives 能精确表达 reduction 与 scan semantics，因此在 pinned 12.9.2/13.3.1 rows 上有资格成为 provisional baseline；这不建立速度或本地可用性。DSL 只有在提供 language、generator、artifact、cache 与 fallback contracts 后才有资格。Custom kernels 因没有 semantic gap 或 correctness-qualified material performance gap 而延后。Owner 必须验证 component integration、outputs、streams、storage 与完整 workload。当 required contract 失败或 controlled evidence 识别出 material gap 时重新评估。CUDA 11.8 需要独立 component coordinate。

## 解答 2：公平比较协议

创建一份 immutable input corpus 与 shape distribution。每个样本只有通过同一 CPU reference 与 tolerance check 后才可接受。记录 Toolkit、CCCL/custom commit、compiler、GPU、clock/power policy、host、stream、allocation/storage policy、command、warmup、repetitions、statistic 与 observation date。选择 steady-state execution 或 complete lifecycle 作为 primary boundary，并对两个候选一致应用；需要时把第二个边界单独报告。根据声明 endpoint 同步或使用 events，避免 incomplete asynchronous work 缩短某一结果。错误输出、environment drift、allocation fallback 或 profiler/clock anomaly 都使比较无效。在合格 run 出现前，没有 winner。

## 解答 3：Ownership 与 portability

DSL ledger 为 problem specification、generator/compiler pin、options、generated-artifact inspection、cache key/invalidation、correctness/performance acceptance、deployment fallback、upgrade、rollback 与 removal 指定 owner。Custom ledger 为 source/review、architecture dispatch、compiler/Toolkit rows、tests、sanitizer/profiler diagnosis、tuning records、fallback、incident response、handoff、upgrade、rollback 与 removal 指定 owner。每个 supported row 都显式列出，缺失行即 unsupported。当 language 无法表达 requirement 或 generation regression 时重新评估 DSL；当 measured advantage 消失或 supported matrix 扩展时重新评估 custom code。

## 有效替代方案

- 如果提供 exact domain operation 与 lifecycle contract，可以 provisional 地选择生产库。
- 如果 constrained family 重复出现，且部署前能验收 generated artifact 与 fallback，可以 provisional 地选择 DSL。
- 两个候选可分别服务不同 workload regions，但 dispatch、validation、measurement 与 ownership 必须显式。
- 当所有选择都无法满足 correctness 或 deployment constraints 时，可以拒绝项目。

## 常见错误

- 按 API 熟悉度或 source-line count 排名。
- 用不同 semantics、inputs、setup 或 completion boundaries 计时。
- 存在 independent override 时仍从 Toolkit label 推断 component version。
- 把 owner CI、documentation 或 profiler hypothesis 当作本地 performance evidence。
- 把 generated code 当作无人拥有，或只核算 custom implementation 第一次开发成本。
- 省略 rollback、unsupported rows 或重新打开决策的 trigger。

复核日期：**2026-09-04**。四个 evidence arrays 仍为空。
