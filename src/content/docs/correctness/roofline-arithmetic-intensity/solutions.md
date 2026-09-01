---
title: 'Q10 复核解答：构建、放置并审计 Roofline Point'
description: 复核 work/traffic contract、synthetic Roofline point、above-roof provenance audit、有效替代方案与常见错误。
pairId: q10-solutions
counterpart: /en/correctness/roofline-arithmetic-intensity/solutions/
factCheckDate: '2026-09-01'
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
unitId: Q10-SOLUTIONS
prerequisites:
  - Q10-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q10-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/roofline-arithmetic-intensity/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q10-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/roofline-arithmetic-intensity/solutions/" lang="en">Read the English counterpart</a>

## 复核前

以下是 [Q10 Exercises](/correctness/roofline-arithmetic-intensity/exercises/)的 static reviewed answers。数字只属于题目给定的 synthetic model，不是 GPU observation。

## 解答 1：Work/traffic contract

`I_DRAM = 9.0e9 FLOP / 4.5e9 byte = 2.0 FLOP/byte`。Ledger 同时记录 FP32 workload、FMA=2 FLOP、exact kernel/range、input、iterations 与 DRAM read+write boundary。Compulsory estimate、implementation estimate 与 tool-observed traffic 是三栏，不可互相覆盖。

若 boundary 改为 L2，重新声明 bytes crossing L2 path、read/write direction、cache/transaction semantics、aggregation、tool definition 与同一 workload coordinate。Work count 可以保持，但 `T_L2` 与 `I_L2` 必须重算。

**复核：** 通过。单位闭合，DRAM 与 L2 denominator 没有混用。

## 解答 2：Roof 与 workload point

`I_ridge = 15.0e12 / 2.5e12 = 6.0 FLOP/byte`。Path roof 是 `2.0 * 2.5e12 = 5.0e12 FLOP/s`；overall roof 是 `min(15.0, 5.0) = 5.0 TFLOP/s`。Achieved rate 是 `9.0e9 / 2.25e-3 = 4.0e12 FLOP/s = 4.0 TFLOP/s`。

Point 为 `(2.0 FLOP/byte, 4.0 TFLOP/s)`，低于 `5.0 TFLOP/s` roof。因为 `2.0 < 6.0`，它位于 modeled path-ceiling region；这不是 observed path bottleneck，也不承诺 `1.0 TFLOP/s` gap 可恢复。

**复核：** 通过。Work、traffic、ceilings 与 time 使用同一 synthetic provenance，region language 保持 modeled。

## 解答 3：Above-roof 与 mixed provenance audit

原 point 立即拒绝 interpretation：x/y 来自不同 run，DRAM denominator 是 compulsory estimate，两个 ceilings 来自不同且有一项未记录的 provenance。Above-roof 是 inconsistent-input signal，不是 exceptional hardware evidence。

Theoretical rebuild 使用同一 exact-device specification、operation convention 与 theoretical path definition；calibrated rebuild 使用一个 declared environment/clock/microbenchmark method 的 matched compute/bandwidth calibrations；tool-reported rebuild 使用同一 exact `.ncu-rep`、GPU、tool、kernel occurrence 与 documented model fields。每套都重新计算同 workload point，彼此不混合。

**复核：** 通过。Audit 先修复 coordinates，不移动 roof，也没有把 region 命名为 bottleneck。

## 有效替代方案

- Work 可以用 integer operations 或另一种 FLOP convention，只要 compute ceiling 使用同一 convention。
- Byte boundary 可以是 DRAM、L2 或 host-device path；每个 boundary 各有自己的 traffic 与 intensity。
- 可以并排展示 theoretical、calibrated 与 tool-reported roofs，但必须分别标注 provenance 和 uncertainty。
- Above-roof audit 可以先从 units 开始，也可以先从 workload identity 开始；最终必须覆盖全部 coordinates。

## 常见错误

- 把 FMA operation count、instruction count 与 FLOP count 混用。
- 只写“bytes moved”，不写 memory path 与 read/write scope。
- 用 logical compulsory bytes 冒充 profiler-observed traffic。
- 把 ms 当 s，或混淆 decimal/binary prefixes。
- 把 x、y 与 roof 从不同 kernel/run/device 拼在一起。
- 混用 specification compute、measured bandwidth 与 tool-reported model ceiling。
- 把 modeled region 写成 observed bottleneck 或 optimization winner。
- 为容纳 above-roof point 而提高 ceiling。

复核日期：**2026-09-01**。四个 evidence arrays 保持为空。
