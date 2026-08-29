---
title: 'Q01 参考解答：设计分层正确性判据'
description: Q01 练习的 independent mixed-output reference、worked tolerance table 与 histogram gate matrix。
pairId: q01-solutions
counterpart: /en/correctness/cpu-references-tolerances-invariants/solutions/
factCheckDate: '2026-08-28'
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
unitId: Q01-SOLUTIONS
prerequisites:
  - Q01-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: q01-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q01-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/cpu-references-tolerances-invariants/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [Q01 练习（Exercise）](/correctness/cpu-references-tolerances-invariants/exercises/)的参考答案。内容是 static designs 与 hand calculations，不是 compiled/executed CUDA program 的结果。

## 解答 1：独立推导 mixed-output reference

一种可复核 reference 完全不提 blocks 或 threads：

```text
require finite alpha, beta, threshold and finite input elements
scores = empty sequence
for each x in logical input order:
    append clamp(double(alpha) * double(x) + double(beta), 0, 1)

if scores is empty:
    winner_index = no-index
    accepted_count = 0
else:
    winner_index = first index of the largest score
    accepted_count = number of scores >= threshold
```

Contract 必须选择 unambiguous `no-index` representation。Scores 转为 comparison type 后使用 declared floating policy；output length、`winner_index` 与 `accepted_count` exact equality。Hand cases 包括 empty input、分别在两端 clamp 的 values，以及必须选择较低 index 的 equal maxima。Reference 只从 logical sequence 推导 ordered host traversal，因此不会共享 grid-stride bound error。

Double intermediates 提供 higher-precision target，但不声称 float GPU path 会逐 bit 重现 intermediates。Tolerance rationale 必须计入这一区别。

## 解答 2：审查一项 absolute-plus-relative policy

| `r` | `g` | `error` | `limit = 1e-6 + 1e-5 * abs(r)` | decision |
| ---: | ---: | ---: | ---: | --- |
| `0` | `4e-7` | `4e-7` | `1e-6` | pass |
| `2` | `2.00003` | `3e-5` | `2.1e-5` | fail |
| `1e6` | `1000000.4` | `0.4` | `10.000001` | pass |
| `NaN` | `NaN` | not evaluated | not evaluated | 走 declared NaN policy，否则 fail |

第一行展示 absolute floor，第三行展示 scale-aware relative allowance。中间 failure 是这项 policy 的结果，不自动证明 candidate algorithm 错误；thresholds 仍需 error budget 或 domain rationale。类似地，large row pass 不证明 application 能接受 absolute error `0.4`。

## 解答 3：为 normalized histogram 构建 independent gates

| gate | comparator | catches |
| --- | --- | --- |
| CPU `counts` reference | 逐 bin exact | wrong boundary assignment 或 indexing |
| CPU `probabilities` reference | 逐 bin declared abs+rel | numerical/normalization computation errors |
| output shape 与 `sample_count` | exact | missing/extra bins 与 wrong metadata |
| `sum(counts) == sample_count` | exact invariant | dropped/duplicated samples，包括 shared reference defect |
| 每个 `count >= 0` | exact invariant | invalid discrete state |
| 每项 probability 位于 `[0, 1]` | declared bound policy | invalid normalization range |
| non-empty input 的 probability sum 接近 `1` | separately justified tolerance | normalization failure |
| `max_bin` 与 lowest-index tie rule | exact | wrong reduction winner 或 tie handling |

Empty input 定义为 zero counts、zero probabilities、zero `sample_count` 与选定的 exact no-index value；此时不要求 probability sum 为一。Boundary fixtures 应把 samples 放在 bin edge 的正下方、正上方和 edge 本身。Failure diagnostics 记录 gate、bin、candidate、reference、error 与适用时的 limit。全部 gates 采用 conjunction：任一 failure 都阻止 timing。

## 有效替代方案

- Domain 需要时，可以用 exact rational 或 arbitrary-precision reference 替代 double arithmetic。
- 声明并证明合理后，`max(abs(g), abs(r))` 这样的 symmetric relative scale 可以有效，但它不同于 Q01 的 reference-anchored formula。
- Property-based generation 可以增加 cases，前提是每条 invariant/comparator 仍 explicit 且 reproducible。
- 若两种 reference 都不容易 hand verify，可用两个 independently implemented references 增强 confidence。

## 常见错误

- 把 kernel launch-index arithmetic 直接翻译进 CPU reference。
- 对 floats、indices、counts 与 flags 使用同一 tolerance。
- Near zero 只用 relative error，或跨多个 scales 只用 absolute error。
- 没有 external rationale，却在看到 failure 后增大 thresholds。
- 让 NaN 通过 ordinary comparison。
- 把 matching CPU/GPU arrays 或单项 invariant 当作 complete proof。
- Correctness gate 尚未解决就开始 timing。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
