---
title: 'Q02 练习：审查数值顺序与复现 contract'
description: 用三道静态任务 hand-trace 非结合归约、记录 FMA/compiler environment，并分开设计 tolerance、determinism 与 bitwise reproducibility checks。
pairId: q02-exercises
counterpart: /en/correctness/floating-point-order-reproducibility/exercises/
factCheckDate: '2026-08-30'
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
unitId: Q02-EXERCISES
prerequisites:
  - Q02
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q02 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/floating-point-order-reproducibility/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q02：浮点顺序、确定性与逐位可复现性](/correctness/floating-point-order-reproducibility/)。以下 Exercises 只要求 hand calculations、static ledgers 与 acceptance specifications；它们不编译或运行 CUDA，evidence axes 保持为空。

## 作答方法

先写 operation graph、comparison scope 与 equality predicate，再判断一项 claim 是否成立。三题都完成后再打开独立的[参考解答](/correctness/floating-point-order-reproducibility/solutions/)。

## 练习 1：手算两种 reduction order

**目标：** 在 round-to-nearest binary32 模型下，逐步计算 `a = 1e20f`、`b = -1e20f`、`c = 3.14f` 的 `(a + b) + c` 与 `a + (b + c)`，再把两种括号分别映射到 serial left fold 与三叶 reduction tree。

**约束：** 每次 addition 后都显式写 `rn(...)`；区分 exact real-number intermediate 与 stored binary32 value；不得把差异称为 race、hardware defect 或 tolerance failure；不运行代码。

**预期证据：** 两条带 rounding points 的 calculation trace、一幅标出 operand pairs 的小树、两种 final values，以及哪项 algorithm choice 改变了 reduction order 的说明。

**验收条件：** Trace 显示先合并 `a`/`b` 时保留 rounded `c`，先合并 `b`/`c` 时小量被舍去并最终得到 zero；结论明确 floating-point nonassociativity 允许两项结果都来自合法 operations。

<details><summary>提示 1</summary>比较 `3.14f` 与 magnitude `1e20f` 附近相邻 representable values 的间距。</details>

<details><summary>提示 2</summary>树的叶子相同不表示内部 pairings 相同。</details>

## 练习 2：审查 FMA 与 compiler/environment ledger

**目标：** 为表达式 `y = alpha * x + beta` 后接 EX11 reduction 的三种 build profile 写 review table：A 使用 `--fmad=true` 且不使用 fast math；B 使用 `--fmad=false`；C 使用 `--use_fast_math`。

**约束：** 分别写出 FMA 的一次 rounding 与 separate multiply/add 的两次 rounding；把 `--use_fast_math` 展开为 effective floating-point options；记录 Toolkit/`nvcc`、host compiler、target architecture、GPU/compute capability、driver、OS、library policy、exact inputs、launch geometry 与 reduction tree；不得预测未观察的 bit pattern。

**预期证据：** 三行 semantic-difference table、一份完整 ledger template、需要重新论证 tolerance 的字段，以及能够支持或拒绝 cross-build comparison 的 scope statement。

**验收条件：** A 只说明 contraction 被允许而非保证每个 expression 都 fused；B 不误称为“所有 arithmetic 逐 bit portable”；C 包含 `--ftz=true`、`--prec-div=false`、`--prec-sqrt=false`、`--fmad=true`；ledger 足以区分 build、device 与 reduction-order changes。

<details><summary>提示 1</summary>显式 FMA call 与 compiler 对普通 multiply/add expression 的 contraction 不是同一控制点。</details>

<details><summary>提示 2</summary>“未传 flag”仍要记录 effective default。</details>

## 练习 3：把三种 claim 拆成三个 tests

**目标：** 为 EX11 设计三项独立验收：相对 CPU reference 的 problem-specific abs+rel tolerance、固定 scope 内的 determinism、以及指定两种 environment 间的 bitwise reproducibility。

**约束：** 先声明 exact inputs、non-finite policy、scope 与 equality predicate；tolerance 使用 `abs(g - r) <= atol + rtol * abs(r)`且在观察前给出 rationale；determinism 必须说明固定哪些 order/algorithm conditions；bitwise check 比较 exact representations，不能由 tolerance pass 推导。

**预期证据：** 三行 claim matrix、每行的 setup/comparator/pass statement、一个“只满足其中两项”的反例，以及 failure 时保存的 raw output 与 ledger fields。

**验收条件：** Numerical acceptance、deterministic order/run scope 与 cross-environment exact bits 分列；任一 pass 都不会替另一行背书；尤其 tolerance acceptance 从不命名为 bitwise reproducibility。

<details><summary>提示 1</summary>一个程序可以每次稳定地产生同一错误 value。</details>

<details><summary>提示 2</summary>一个 unordered reduction 的多项结果也可能全落在同一 tolerance band 内。</details>

## 下一步

完成后查看独立的[参考解答](/correctness/floating-point-order-reproducibility/solutions/)，再回到 [EX11 CPU reference](/examples/multi-stage-reduction/)检查 serial order 与 GPU tree 的 contract boundary。
