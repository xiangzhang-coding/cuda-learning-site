---
title: 'Q04 参考解答：按 sanitizer 作用域诊断缺陷'
description: Q04 练习的 detector-routing matrix、WAW/WAR/RAW repairs 与 bounded clean-report statement。
pairId: q04-solutions
counterpart: /en/correctness/racecheck-initcheck-synccheck/solutions/
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
unitId: Q04-SOLUTIONS
prerequisites:
  - Q04-EXERCISES
relatedUnits:
  - Q04
  - EX16
  - LAB07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-28' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'Q04,EX16,LAB07' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/correctness/racecheck-initcheck-synccheck/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这些答案把 [Q04 练习（Exercise）](/correctness/racecheck-initcheck-synccheck/exercises/)解成 static routing 与 evidence contracts。示意 command 没有执行，expected classification 不是 observed tool output。

## 解答 1：为四个 scenario 选择 detector

| scenario | access/defect | memcheck 后的 focused tool | 仍未证明的事项 |
| --- | --- | --- | --- |
| A | valid shared address 上的 unordered writes | racecheck，expected WAW | 其他 paths 与 global races |
| B | valid global address 上的 uninitialized read | default initcheck | shared initialization，除非另行选择 address space |
| C | conditional `__syncthreads()` 造成 block divergence | synccheck | higher-level protocol 与未执行 branch |
| D | valid global address 上的 cross-block conflicting writes | 这些 detector 都不能把它证明为 global race-free | 必须由 memory-model proof、algorithm repair 与适合该 claim 的额外 evidence 处理 |

每行都先在 fresh process 中运行 memcheck。Focused run 也使用另一 fresh process，并保存 scenario ID、source revision、exact command、tool/component versions、input、launch geometry、raw report 与 exit status。A 到 D 不能放进一个长寿命 process 顺序触发。

## 解答 2：分类 WAW、WAR 与 RAW

| trace | classification | required repair |
| --- | --- | --- |
| T1: write then competing write | WAW | 指定 unique writer，或建立适合 algorithm 的 atomic ownership；不能让 final value 依赖 arrival order |
| T2: read then competing write | WAR | 在 consumer read 完成后才允许 location reuse/write；所有 required participants 必须到达 ordering point |
| T3: producer write then consumer read | RAW | 建立 write -> documented synchronization -> read，且 scope/mask 覆盖 producer 与 consumer |

如果 participants 是 whole block，可在所有 threads 都无条件到达时使用 block barrier。若 protocol 确实只在一个 warp 内，可使用满足 mask contract 的 synchronized warp operation。T2/T3 的方向不能互换；T1 也不能靠 barrier 合法化一个本就不应有 multiple writers 的 algorithm。

## 解答 3：缩小一份 clean-report claim

原结论至少有六个 gap：只执行一个 branch；racecheck 不证明 global races；default initcheck 没检查 shared memory；synccheck 不一定发现 mask 命名但未到达的 lane；没有 CPU reference/invariant；tool/driver/compiler versions 未绑定。

合法 replacement 是：

```text
在记录的 tool lane、input、launch 与 executed path 上，
memcheck、racecheck、default-global initcheck 和 synccheck
没有报告各自 supported checked scope 内的 defect。
这不是其他 paths、global races、shared initialization、
完整 synchronization 或 numerical correctness 的证明。
```

Next-run matrix 应分别启动 unexecuted branch 的 defect/corrected processes；先跑 memcheck；current tool 确认支持后，以 `--initcheck-address-space shared` 或 `all` 单独检查 shared case；增加能暴露 mask non-arrival 的 targeted test 与 static participation proof；最后用 Q01 的 CPU reference、tolerance 或 invariant 作独立 correctness verdict。CUDA 11.8 lane 不获得 current shared extension 的推断。

## 有效替代方案

- 对 WAW，若 algorithm 要求 combining update，可以用足够 scope 的 documented atomic protocol，而不是强制 unique writer。
- 对 warp-local WAR/RAW，可以使用传递 register value 的 documented collective，前提是 mask 和 source-lane contracts 完整。
- Tool runs 可以由脚本启动，但每个 child process、command、log 与 exit status 必须保持独立可审查。
- Coverage statement 可以更窄，例如只命名一个 kernel generation 或一个 filtered launch，只要不夸大。

## 常见错误

- 没跑 memcheck 就解释 racecheck、initcheck 或 synccheck output。
- 把 racecheck clean 写成 global-memory race-free。
- 没有 `shared|all` option 却声称 initcheck 检查了 shared memory。
- 把 current shared support 倒推到 CUDA 11.8。
- 用 divergent `__syncthreads()` 修复 hazard。
- 忽略 synccheck 的 mask non-arrival limitation。
- 在同一 defect process 中连续触发多个 scenario。
- 把 zero reports 当作 CPU-reference correctness verdict。

复核日期：**2026-08-28**。Compilation 与 runtime evidence axes 保持为空。
