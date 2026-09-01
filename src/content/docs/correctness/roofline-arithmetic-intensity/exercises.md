---
title: 'Q10 练习：构建、放置并审计 Roofline Point'
description: 用三道静态任务冻结 work/traffic boundary、完成 synthetic Roofline calculation，并审查 above-roof point 与 ceiling provenance。
pairId: q10-exercises
counterpart: /en/correctness/roofline-arithmetic-intensity/exercises/
factCheckDate: '2026-09-01'
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
unitId: Q10-EXERCISES
prerequisites:
  - Q10
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q10-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/correctness/roofline-arithmetic-intensity/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q10 }
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

<a class="locale-pair" data-locale-counterpart href="/en/correctness/roofline-arithmetic-intensity/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [Q10](/correctness/roofline-arithmetic-intensity/)。全部 numerical inputs 都是 synthetic，不能改写成 GPU、profiler 或 calibrated observation。

## 作答方法

每一步写单位与 provenance。若 workload、operation convention、byte boundary、time scope 或 ceiling family 不一致，先停止并审计，不要继续画 point。完成后再看[复核解答](/correctness/roofline-arithmetic-intensity/solutions/)。

## 练习 1：冻结 work/traffic contract

**目标：** 为一个抽象 FP32 workload 建立 ledger：`W=9.0e9 FLOP`，declared DRAM-path traffic `T_DRAM=4.5e9 byte`，FMA 计 2 FLOP。推导 `I_DRAM`，并列出若 boundary 改为 L2 时必须重新声明的 fields。

**约束：** Work 与 traffic 必须覆盖同一 kernel/range、input 与 iteration count。区分 compulsory estimate、implementation estimate 与 tool-observed traffic；不填 cache hit、transaction 或 metric value。

**预期证据：** Work convention row、DRAM boundary row、`I_DRAM` 的带单位计算、L2 re-count checklist 与 stop conditions。

**验收标准：** `I_DRAM = 2.0 FLOP/byte`；答案没有把 DRAM intensity 复用于 L2，也没有把 logical bytes 称作 measured bytes。

<details><summary>提示 1</summary>Intensity 的下标提醒 reviewer 哪个 path 的 bytes 在 denominator 中。</details>

<details><summary>提示 2</summary>Boundary 变化时，work 可能保持不变，但 traffic definition 与 value 必须重建。</details>

## 练习 2：计算 roof 与 workload point

**目标：** 使用 `P_compute=15.0e12 FLOP/s`、`B_path=2.5e12 byte/s`、`I_path=2.0 FLOP/byte`、`W=9.0e9 FLOP` 与 `t=2.25e-3 s`，计算 ridge、path roof、overall roof、achieved rate 与 point。

**约束：** 所有输入属于一个 labeled synthetic provenance family；逐步保留 FLOP、byte 与 second；region 只能标为 modeled region，不得写 observed bottleneck 或 predicted speedup。

**预期证据：** 五步 unit calculation、point coordinates、below/on/above-roof check 与 bounded region label。

**验收标准：** `I_ridge=6.0 FLOP/byte`、path roof=`5.0 TFLOP/s`、overall roof=`5.0 TFLOP/s`、`P_achieved=4.0 TFLOP/s`；point 低于 roof 且位于 modeled path-ceiling region。

<details><summary>提示 1</summary>`2.0 FLOP/byte * 2.5e12 byte/s = 5.0e12 FLOP/s`。</details>

<details><summary>提示 2</summary>`I_path < I_ridge` 是 geometry classification，不是 causal measurement。</details>

## 练习 3：审计 above-roof 与 mixed provenance

**目标：** 审查一个 point：x 来自 compulsory DRAM estimate，y 来自另一次 run，compute ceiling 来自 specification，bandwidth ceiling 来自未记录环境的 microbenchmark，且 point 位于 roof 之上。

**约束：** 按 operation count、byte boundary、unit prefix、scope、time、device/run、ceiling provenance 与 exact report definition 建 audit。分别提出 theoretical、calibrated/measured 与 tool-reported model 的合法重建方案；不能混成一个 roof。

**预期证据：** Mismatch table、reject verdict、三份 provenance-specific rebuild packets 与 query-first checklist。

**验收标准：** 原 point 不被解释；above-roof 被视为 inconsistent-input signal；每个 rebuilt point/roof 使用同 workload、boundary、run/device 与 provenance；不移动 ceiling 来适配数据。

<details><summary>提示 1</summary>先证明 x、y 与 roof 描述同一个 workload，再谈 point 的位置。</details>

<details><summary>提示 2</summary>“Specification compute + measured bandwidth”只有明确标成 hybrid 才能讨论，但本题要求三套 provenance 不混用。</details>

## 下一步

查看独立的[复核解答](/correctness/roofline-arithmetic-intensity/solutions/)，再完成[练习题库（Practice Bank）PB-R3-005](/practice/#pb-r3-005)，并回到 [A14](/algorithms/algorithm-choice-arithmetic-intensity/)审查算法选择。
