---
title: 'L03 练习：选择 CUB Device Primitives'
description: 为一个 aggregate、exclusive offsets 与跨流 inclusive-prefix pipeline 选择 device primitive，并提交 storage、overlap、completion 和 numerical contract。
pairId: l03-exercises
counterpart: /en/libraries/cub-device-primitives/exercises/
factCheckDate: '2026-09-05'
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
unitId: L03-EXERCISES
prerequisites:
  - L03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l03-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/libraries/cub-device-primitives/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L03 }
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

<a class="locale-pair" data-locale-counterpart href="/en/libraries/cub-device-primitives/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [L03](/libraries/cub-device-primitives/)。三项任务都只产出 static primitive-selection packets；不展示、编译或运行 CUDA/C++，四个 evidence arrays 保持为空。

## 作答说明

每题从 L03 教授的三个 entry points 中选择满足需求的最窄 primitive。先写 operation semantics，再写 overlap、temporary storage、stream、completion、lifetime、version 与 numerical acceptance。不要从 API 名称推断 backend 或 performance；打开[独立复核解答](/libraries/cub-device-primitives/solutions/)前完成自己的 packet。

## 练习（Exercise）1：把一个向量压成一个标量

**目标：** 为 `N` 个 FP32 samples 只产生一个总和，选择一个 device-wide primitive，并定义 host 何时可以读取这个 scalar。

**约束：** 使用传统两阶段接口和 named non-default stream。Input 包含 `N` 项，output 只容纳一个值；禁止 input/output overlap。说明 query 与 execute 的一致坐标、scratch lifetime、floating-point acceptance，以及 L03 五个 profile rows 中每个 CUB coordinate 的 reduction determinism contract，不写实现。

**预期证据：** 一页 selection packet，包含 output cardinality、query/allocate/execute ledger、stream dependency graph、overlap verdict、determinism scope 与一条明确的 evidence-boundary statement。

**验收条件：** 所选操作只写一个 aggregate；零初值与全部 `N` 项进入语义；query 不被记作 execution；input、output、scratch 活到 stream completion。五个 reduction profile rows 都保留已记录的 same-GPU run-to-run determinism 与 cross-compute-capability caveat，serial-order equality 另行判断；没有 timing 或 observed output。

<details><summary>提示 1</summary>先问需求是“一个 aggregate”还是“每个位置一个 prefix”，不要先看函数名。</details>

<details><summary>提示 2</summary>确定 output shape 后，再区分稳定的重复运行顺序、serial parenthesization 与跨架构 bit pattern。</details>

## 练习 2：从 counts 生成 exclusive offsets

**目标：** 对 `N` 个 nonnegative counts 生成 `N` 个 offsets，使第一个 output 为零，位置 `i` 只包含 `i` 之前的 counts，并选择对应 primitive。

**约束：** 指定 32-bit 或 64-bit count/offset type 及无溢出前提。选择 exact in-place 或 disjoint out-of-place layout；其他 partial overlap 一律拒绝。传统 query 与 execute 使用相同 `NumItemsT`、current device、operation 与 problem configuration。

**预期证据：** 前三个与最后一个 output 的符号语义、primitive-selection rationale、range diagram、temporary-storage record，以及 integer-overflow acceptance rule。

**验收条件：** 第 `i` 项不进入自己的 output；结果范围恰有 `N` 项；只接受 exact alias 或完全 disjoint ranges；任何 type/device/problem-size 变化触发重新 query；没有把 wider output type 当作自动防溢出证明。正确零 identity 与 no-overflow bound 建立后，integer prefix correctness 仍要求 exact，不因浮点 determinism matrix 而放宽。

<details><summary>提示 1</summary>先分别写出位置 0 和位置 1 的期望值，再推广到任意位置。</details>

<details><summary>提示 2</summary>语义确定后，再检查 alias 形状以及 query 时参与 template instantiation 的 count type。</details>

## 练习 3：给跨流 consumer 生产 inclusive prefixes

**目标：** 为 `N` 个 values 生成包含当前位置的 prefixes；producer 位于 `stream_prefix`，consumer 位于 `stream_consume`，请选择 primitive 并补全依赖。

**约束：** 使用传统 API 以保持 CUB 1.15.1/2.8.2/3.3.4 与 selected 3.4.2 matrix 的共同调用结构。声明 query、scratch allocation、execution、event record/wait、host observation 与 deallocation 的顺序。FP32 输入采用 tolerance，不要求 serial bitwise equality，并区分 CUB 1.15.1 scan 的 same-GPU run-to-run contract 与 2.8.2、3.3.4、selected 3.4.2 记录的 pseudo-associative run-to-run variation。

**预期证据：** Primitive-selection packet、两条 stream timelines、一条 explicit cross-stream edge、resource-lifetime endpoint、inclusive-prefix acceptance rule 与版本理由。

**验收条件：** 每个 output 包含当前位置；consumer 在 event dependency 后运行；host read 和所有相关释放位于 final completion 后；scratch 不被并发复用。Determinism cells 保留 1.15.1 的 reviewed guarantee，以及 2.8.2、3.3.4、selected 3.4.2 的 reviewed variation boundary；packet 不把 environment overload 设为旧 bundle 的前置条件，也不声称 output、overlap 或 speedup 已观察。

<details><summary>提示 1</summary>同一 stream 的 enqueue order 只排序 producer 自己的工作，不会自动排序另一个 stream。</details>

<details><summary>提示 2</summary>补上 cross-stream edge 后，沿 graph 找到 input、output 与 scratch 的最后一个 consumer，再决定释放位置。</details>

## 下一步

查看[独立复核解答](/libraries/cub-device-primitives/solutions/)，再完成 [PB-R4-003](/practice/#pb-r4-003)。Executable work 只链接到已发布的 [EX17 canonical route](/examples/cub-device-reduction-scan/)。
