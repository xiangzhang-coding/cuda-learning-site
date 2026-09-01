---
title: 'A14 练习：从 Traffic Ledger 到可证伪优化'
description: 用三道静态任务核算四类算法、比较 elementwise fusion，并把 arithmetic-intensity candidate 转成可拒绝实验。
pairId: a14-exercises
counterpart: /en/algorithms/algorithm-choice-arithmetic-intensity/exercises/
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
unitId: A14-EXERCISES
prerequisites:
  - A14
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a14-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/en/algorithms/algorithm-choice-arithmetic-intensity/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: A14-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A14 }
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

<a class="locale-pair" data-locale-counterpart href="/en/algorithms/algorithm-choice-arithmetic-intensity/exercises/" lang="en">Read the English counterpart</a>

## 先修条件

只需先完成 [A14](/algorithms/algorithm-choice-arithmetic-intensity/)。题目中的 counts 是 static estimates，不是 profiler values 或 Runtime evidence。

## 作答说明

每张 ledger 先写 operation convention 与 byte boundary，再分 compulsory/implementation traffic。优化答案必须包含 correctness gate、primary mechanism、support rule 与 reject rule。完成后再看[复核解答](/algorithms/algorithm-choice-arithmetic-intensity/solutions/)。

## 练习 1：完成四算法 accounting matrix

**目标：** 对 FP32 vector addition、sum reduction、out-of-place transpose 与 `beta=0` GEMM 填写 `W`、compulsory bytes 与 compulsory intensity。GEMM 采用 FMA=2 FLOP，transpose 排除 index arithmetic。

**约束：** 使用符号 N/M/K；vector addition 读 two inputs/write one output；reduction 写 one scalar；transpose read/write MN elements；GEMM unique A/B read once and C write once。另给每项写一条 implementation traffic 可能增加的原因。

**预期证据：** 四行 formula table、unit checks、boundary label、assumption column 与 implementation caveat。

**验收标准：** 表中出现 `N / 12N`、`(N-1) / (4N+4)`、`0 / 8MN` 与 `2MNK / 4(MK+KN+MN)`；没有把 cache/transaction estimate 写成 compulsory fact。

<details><summary>提示 1</summary>先数 logical elements，再乘 FP32 的 4 byte。</details>

<details><summary>提示 2</summary>Arithmetic intensity 的 numerator 与 denominator 必须覆盖同一 workload。</details>

## 练习 2：比较 materialized 与 fused pipeline

**目标：** 对 `tmp=a+b; z=g(tmp)` 且 `g` 每元素 5 FLOP，推导 unfused/fused work、logical DRAM traffic 与 intensity，并提出 fusion hypothesis。

**约束：** 两版本都执行 `6N FLOP`；unfused 使用 `20N byte`，fused 使用 `12N byte`。列出 cache reuse、register pressure、occupancy 与 launch overhead 作为 competing explanations；不得宣称 fused 更快。

**预期证据：** Baseline/candidate table、`0.3` 与 `0.5 FLOP/byte` calculations、predicted traffic ratio、correctness/timing/traffic experiment packet。

**验收标准：** Mechanism claim 与 performance claim 各有独立 reject rule；experiment 只改变 fusion；actual traffic/time slots 为空。

<details><summary>提示 1</summary>Unfused 的 intermediate 先写一次再读一次，共增加 `8N byte`。</details>

<details><summary>提示 2</summary>Intensity 上升是 prediction；elapsed time 是否下降仍需 measurement。</details>

## 练习 3：从三个 candidates 中选择首个实验

**目标：** 为一个 workload packet 比较 reduction stage fusion、tiled transpose 与 larger GEMM tile。为每项写 predicted traffic boundary、added cost 与 falsifier，然后选择首个实验。

**约束：** 不给 hardware ceiling、timing 或 metric value。Selection 必须依据 workload relevance、estimated byte reduction、correctness risk、resource/synchronization cost 与 observability；不能用 Roofline region 自动选 winner。只选一个 primary mechanism。

**预期证据：** 三候选 decision table、ranking rationale、one-experiment protocol、support/reject thresholds 的定义方式与回滚条件。

**验收标准：** 被选 candidate 有明确 traffic formula 与 same-workload comparison；未选 candidates 有 defer reason；结果可以拒绝 optimization；任何 modeled region 都没有改名为 observed bottleneck。

<details><summary>提示 1</summary>优先选择既能改变 predicted denominator、又能用 exact boundary 测量的 mechanism。</details>

<details><summary>提示 2</summary>若 candidate 同时改变 precision、layout 与 algorithm，就无法归因；缩小实验。</details>

## 下一步

查看独立的[复核解答](/algorithms/algorithm-choice-arithmetic-intensity/solutions/)，再完成[练习题库（Practice Bank）PB-R3-006](/practice/#pb-r3-006)，最后用 [Q10](/correctness/roofline-arithmetic-intensity/)审查 matched roof。
