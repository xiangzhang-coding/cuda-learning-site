---
title: 'M10 参考解答：跟踪托管内存访问与迁移'
description: M10 三道练习的 conditional page ledger、phase-oriented ping-pong repair 与 EX08 observation schema。
pairId: m10-solutions
counterpart: /en/memory/unified-memory-page-migration/solutions/
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
unitId: M10-SOLUTIONS
prerequisites:
  - M10-EXERCISES
relatedUnits:
  - M10
  - M09
  - VIS08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m10-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M10,M09,VIS08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/unified-memory-page-migration/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些参考答案使用 conditional system branches 解答 [M10 练习（Exercise）](/memory/unified-memory-page-migration/exercises/)。它们不提供 runtime residence history、page-fault count、migration record 或 performance result。

## 解答 1：构建 conditional per-page ledger

| phase | stable facts | software-coherent full support | hardware-coherent/direct access | limited support |
| --- | --- | --- | --- | --- |
| allocation 后 | pointer/ownership 已建立；residency unknown | access 前不推断 placement | access 前不推断 placement | owner rules 适用；不从 source 声明 residence |
| CPU 初始化 A、B、C | CPU writes 位于 GPU use 前 | first touch 可能建立 host-local backing | CPU 可以通过 coherent mapping access；backing 仍 system-dependent | managed data 从 limited model 的 host-side policy 开始 |
| GPU 读 B/C 并写 C | GPU phase 位于 ordering edge 后 | B/C access 可能 fault 并把 pages 向 GPU 迁移 | 允许 coherent/remote service，不需要 page migration | movement 可以发生在 kernel-launch boundary，而不是逐 touched page |
| CPU 读 C | 必须先满足 GPU completion | C 可能 fault 并向 CPU 迁回 | documented direct host access 可以无 migration 地服务 C | synchronization 可以按 limited model CPU-access policy 返回 managed data |

这张表记录 permissible outcomes，不记录 observations。每个 branch 中 pointer 都保持稳定。只有 Environment Manifest 加 runtime evidence 才能选择一次 execution 中 page C 实际发生了什么。

## 解答 2：修复 CPU-GPU ping-pong design

Original order 在每个 kernel 周围交替 active processor。在 fault-and-migrate system 上，这可能反复移动 pages；在 direct-access system 上，它可能转化为 remote/coherence traffic。Source 本身无法在两种 cost 中选择。

一种 phase-oriented repair 是：CPU 初始化所有 pages，建立 GPU-use edge，在 device side 保留 intermediate data 并连续运行两个 GPU phases，建立 completion，最后在一个 host phase 中完成 required CPU reads/rewrites。只有 algorithm 不依赖被移除的 intermediate host decision 时，这种改写才合法。

第二种 candidate 保留相同 phases，但在每个 phase 前把 range 向 next processor prefetch，并在 relevant stream 中 ordering；还可以记录匹配 expected access pattern 的 advice。On-demand path 继续作为 correctness fallback。Prefetch/advice 可能移动或重塑 cost，但 repaired source 不证明 migration 更少或 time 更好。

## 解答 3：设计 EX08 observation contract

| field group | required fields | current value |
| --- | --- | --- |
| invariant | allocation size、access sequence、input、kernel work、output oracle、launch、Toolkit Lane | run 前声明 |
| system model | Native Linux、kernel、driver、GPU、topology、四项 device attributes | unobserved |
| correctness | 每个 mode 的 API status、completion boundary、CPU comparison | unobserved |
| movement | tool/version、metric definition/layer、raw page-fault/migration log、uncertainty | unobserved |
| timing | correctness pass、warm-up、boundary、repetitions、raw samples | unobserved |
| conclusion | supported model、observed behavior、limits、allowed comparison | no runtime conclusion |

Correctness failure 时停止。若 attributes 不支持 intended interpretation，报告 mode unsupported 或 under-specified。Movement metric 不可用时保持 empty field，不能从 timing 或 VIS08 推导 migration。Reported count 为零只表示 named tool/metric 在该 run 中报告零，不证明 universal no-migration behavior。

## 有效替代方案

- 可以逐 page symbolic tracking，也可以把 access history 相同的 pages grouping，前提是 grouping 不隐藏 different accessor。
- Ownership phases 用 explicit copy 更清楚，或 managed-memory behavior 无法可靠测量时，可以保留 explicit copy。
- 可只用 advice、只用 prefetch，或保留 on-demand baseline，前提是所有 modes 共用同一 correctness contract。
- Exact API semantics 与 observation time 已记录时，可以增加 residency-related query，但不能把 preferred/last-prefetch location 当作完整 residence history。

## 常见错误

- 把一个 virtual pointer 当成一个 physical location 的证明。
- 在每个 system 上为每次 CPU/GPU handoff 都画 migration arrow。
- 未建立 GPU completion 就在 host 读取 managed output。
- 把 M02 的 32-byte transaction segments 改写成 managed-memory page sizes。
- 把 `cudaMemAdvise` 或 `cudaMemPrefetchAsync` 当作 permanent placement guarantee。
- 把 VIS08 colors、source comments、elapsed time 或 missing metric 报告为 migration evidence。

复核日期：**2026-08-29**。Compilation、runtime、expected-observation 与 recorded-observation axes 保持为空。
