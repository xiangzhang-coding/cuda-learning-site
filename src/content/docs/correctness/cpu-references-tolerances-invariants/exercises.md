---
title: 'Q01 练习：设计分层正确性判据'
description: 用三道静态任务设计 independent CPU reference、审查 scale-aware tolerance table，并组合 discrete exact checks 与 independent invariants。
pairId: q01-exercises
counterpart: /en/correctness/cpu-references-tolerances-invariants/exercises/
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
unitId: Q01-EXERCISES
prerequisites:
  - Q01
relatedUnits:
  - Q01
  - Q03
  - Q05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q01-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q01 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q01,Q03,Q05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/cpu-references-tolerances-invariants/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

先完成 [Q01：CPU 参考实现、容差与不变量](/correctness/cpu-references-tolerances-invariants/)。这些练习只产出 static oracle specifications 与 hand calculations，不编译或运行 CUDA。

## 作答方法

先写 acceptance rule，再判断 fixture。把 reference comparison、exact comparison 与 invariant checks 分列记录。三题都完成后再打开[参考解答](/correctness/cpu-references-tolerances-invariants/solutions/)。

## 练习 1：独立推导 mixed-output reference

**目标：** 为一项 operation 设计 CPU reference：把每个 finite input `x[i]` 映射为 `score[i] = clamp(alpha * x[i] + beta, 0, 1)`；返回 maximum score 对应的最低 `winner_index`；再返回 score 大于等于 declared threshold 的 `accepted_count`。

**约束：** 从 contract 推导 loops 与 boundary handling，不能翻译 CUDA grid-stride loop。说明 input-domain、empty-input、tie、precision 与 non-finite policies。`score` 使用 approximate comparison，`winner_index`、`accepted_count` 与 output length 必须 exact。不得计时任何 implementation。

**预期证据：** Reference pseudocode、逐 field comparator table、包括 tie/empty input 在内的三个 hand-computable cases，以及 reference 如何避免共享 GPU indexing logic 的说明。

**验收条件：** Reference 对每个 logical element 恰好处理一次；明确 lowest-index tie rule 与 empty result；只对 scores 使用 declared floating comparator；所有 discrete outputs exact check；不依赖 launch geometry。

<details><summary>提示 1</summary>先写 output contract，再选择 host loop shape。</details>

<details><summary>提示 2</summary>Higher-precision intermediate 有助于 comparison，但要记录它不会逐步重现 float rounding。</details>

## 练习 2：审查一项 absolute-plus-relative policy

**目标：** 使用 `abs(g - r) <= atol + rtol * abs(r)`、`atol = 1e-6` 与 `rtol = 1e-5` 判断 `(r, g)` pairs `(0, 4e-7)`、`(2, 2.00003)`、`(1e6, 1000000.4)`，再说明三个结果能够和不能够证明什么。

**约束：** 每个 pair 都展示 `error` 与 `limit`。第四个 conceptual pair `(NaN, NaN)` 必须走单独 declared policy，不能套 finite formula。看到结果后不得修改 tolerance，也不能把这些值称为 universal defaults。

**预期证据：** 四行 decision table、每个 finite row 的 arithmetic、explicit non-finite branch，以及覆盖 near-zero、ordinary-scale 与 large-scale behavior 的简短 critique。

**验收条件：** Near-zero row 主要由 `atol` 决定，large row 主要由 `rtol` 决定，ordinary row 在题设数字下失败，NaN 不会意外 pass，并且结论指出仍需 application requirements 证明 policy 合理。

<details><summary>提示 1</summary>`r` 为零时，relative contribution 也为零。</details>

<details><summary>提示 2</summary>区分“formula 判定 pass”与“thresholds 有科学依据”。</details>

## 练习 3：为 normalized histogram 构建 independent gates

**目标：** 为 normalized histogram 规定 layered oracle。输出包括 integer `counts[B]`、floating `probabilities[B]`、integer `sample_count` 与 integer `max_bin`，其中 `max_bin` 采用 lowest-index tie rule。

**约束：** 使用 independently written CPU reference；所有 discrete fields exact check；probabilities 使用 declared absolute-plus-relative policy；至少给出四项从 problem statement 推导的 invariants。覆盖 empty input 与 bin-boundary values。不得从 candidate output 复制 invariant target。

**预期证据：** 一张说明各 gate 能发现何种 defect 的 gate matrix、adversarial input cases、failure diagnostics，以及 correctness-before-timing final rule。

**验收条件：** Counts exact sum 等于 `sample_count`；counts non-negative；probability bounds/normalization 使用独立且有理由的 policy；`max_bin` 按 tie rule exact；reference agreement 与 invariants 保持 independent；任一 gate 失败时禁止 timing。

<details><summary>提示 1</summary>Total 正确不能证明 sample 进入了正确 bin。</details>

<details><summary>提示 2</summary>逐条询问 invariant 能否发现 CPU/GPU 都拥有、却仍让 arrays 相等的 bug。</details>

## 下一步

完成后查看独立的[参考解答](/correctness/cpu-references-tolerances-invariants/solutions/)，再到[练习题库（Practice Bank）PB-R1-021](/practice/#pb-r1-021)设计另一份 layered oracle。
