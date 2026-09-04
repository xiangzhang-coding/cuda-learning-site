---
title: 'L01 练习：先写决策包，再考虑自定义内核'
description: 比较四种实现层级、设计公平证据计划，并核算 portability 与整个生命周期的 ownership。
pairId: l01-exercises
counterpart: /en/libraries/library-primitive-dsl-custom-kernel/exercises/
factCheckDate: '2026-09-04'
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
unitId: L01-EXERCISES
prerequisites:
  - L01
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l01-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/library-primitive-dsl-custom-kernel/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-04' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L01 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/library-primitive-dsl-custom-kernel/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需完成 [L01](/libraries/library-primitive-dsl-custom-kernel/)。这些练习只产出 decision 与 measurement records，不编译或执行 CUDA、CCCL、DSL、production library 或 custom kernel。

## 作答说明

比较前先冻结语义。所有缺失事实标为 `unrecorded`，区分 owner facts 与 site evidence，并在打开[复核解答](/libraries/library-primitive-dsl-custom-kernel/solutions/)前独立作答。

## 练习 1：选择 provisional baseline

**目标：** 在 domain library、CCCL reusable primitives、graph DSL 与 custom kernels 四个候选中，为 Toolkit 12.9.2/13.3.1 上的 FP32 row reduction 加 exclusive scan 选择 provisional implementation level。

**约束：** 操作已有 CPU references 与 tolerances，但没有 measured performance。独立固定 CCCL v3.4.2；11.8 不在该 pin 内。比较正确性匹配、维护、可移植性、性能证据与所有权成本。不得把未测量候选称为最快。

**预期证据：** 四行 eligibility table、一个 provisional choice、另外三个选择的拒绝/延后理由、owner 与 revisit trigger。

**验收条件：** Reusable primitives 因能表达两个操作而成为合理 provisional baseline；明确结论不是速度结果；custom code 需要 unmet contract 或 correctness-qualified material gap；11.8 保持独立决策。

<details><summary>提示 1</summary>把“能表达所需语义”与“已测量所需 workload”分开。</details>

<details><summary>提示 2</summary>Provisional baseline 用于减少 unsupported assumptions，不会永久排除其他层级。</details>

## 练习 2：设计公平的 library-versus-custom 测量

**目标：** 写出以后可比较 selected primitive composition 与 custom kernels 的测量协议。

**约束：** 固定 operation semantics、inputs、shape distribution、FP32 tolerance、layout、warmup、stream、completion boundary 与 reported statistic。声明 setup、allocation、temporary storage、launch 与 transfer cost 是否进入每个测量边界。计时前必须通过 correctness gate 并记录 Environment Manifest。

**预期证据：** Controlled-variable table、correctness gate、lifecycle boundary、warmup/repetition/statistic rule、invalid-run rule，且不预选 winner。

**验收条件：** 两个候选使用相同输入和验收标准；asynchronous completion 位于声明的 measurement boundary 内；setup cost 对称处理；correctness failure 使 performance comparison 无效；输出只是计划，不是 Runtime-Verified evidence。

<details><summary>提示 1</summary>如果一个候选包含 temporary-storage setup，而另一个排除 allocation，两个区间回答的不是同一问题。</details>

<details><summary>提示 2</summary>从 Q06 顺序开始：评估 correctness-qualified baseline，只改变一个决策，测量，并保留 rollback。</details>

## 练习 3：审查 lifetime ownership 与 portability

**目标：** 比较 DSL-generated path 与 custom architecture-dispatched kernel 三年的 ownership ledger。

**约束：** 覆盖 Toolkit/component/compiler/dialect/OS rows、generated artifacts、cache invalidation、fallback、correctness/performance regression、incident response、handoff 与 removal。Unknown row 保持 unsupported。不得把 generated code 当作无人拥有。

**预期证据：** 两份 ownership ledgers、support matrix、具名 maintainers、upgrade/rollback procedures，以及每个候选两个 revisit triggers。

**验收条件：** DSL ledger 拥有 specification、generator pin、artifact acceptance、cache 与 fallback；custom ledger 拥有 source、dispatch、build/test matrix、debugging 与 tuning；两者都包含 exit cost，并拒绝把“works on CUDA”当作 version coordinate。

<details><summary>提示 1</summary>询问 compiler upgrade 改变 generated/custom behavior 后由谁响应。</details>

<details><summary>提示 2</summary>Portability 是一组已测试矩阵行，不能从一个成功环境推断。</details>

## 下一步

打开[复核解答](/libraries/library-primitive-dsl-custom-kernel/solutions/)，然后完成 [PB-R4-001](/practice/#pb-r4-001)并继续 [L02](/libraries/thrust-algorithm-vocabulary/)。
