---
title: 'M04 参考解答：从 Word Address 证明 Bank Mapping'
description: M04 三道练习的 stride/broadcast tables、32x33 permutation proof 与 evidence-safe padding ledger。
pairId: m04-solutions
counterpart: /en/memory/bank-conflicts-layouts/solutions/
factCheckDate: '2026-08-27'
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
unitId: M04-SOLUTIONS
prerequisites:
  - M04-EXERCISES
relatedUnits:
  - M04
  - EX06
  - VIS05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M04,EX06,VIS05' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/bank-conflicts-layouts/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [M04 练习（Exercise）](/memory/bank-conflicts-layouts/exercises/)的**参考解答**。所有结果都是 selected fixture 的 static predictions；没有执行 EX06 或观察 profiler metric。

## 解答 1：区分三个 stride 与 broadcast

| pattern | requested words | banks | busiest-bank distinct words | result |
| --- | --- | --- | ---: | --- |
| stride 1 | `0,1,...,31` | `0,1,...,31` | 1 | conflict-free |
| stride 2 | `0,2,...,62` | even banks, each repeated twice | 2 | 2-way conflict |
| stride 32 | `0,32,...,992` | bank 0 for all | 32 | 32-way conflict |
| same-address read | word `0` for all | bank 0 for all | 1 distinct word | broadcast, no conflict |

最后两行拥有相同 bank sequence，却有不同 exact-address sets。Conflict 要数 same-bank **distinct words**；broadcast 的 32 requests 指向一个 word。

## 解答 2：证明 32x33 transform

固定 `c=5`：

```text
unpadded word(i) = 32i + 5; bank(i) = 5
padded   word(i) = 33i + 5; bank(i) = (i + 5) mod 32
```

Unpadded lanes 0,1,2,3,31 的 words 是 5,37,69,101,997，bank 都是 5。Padded 对应 words 是 5,38,71,104,1028，banks 是 5,6,7,8,4。

若两个 padded lanes 有相同 bank，则 `(i+5) mod 32 = (j+5) mod 32`，所以 `i-j` 是 32 的倍数。因为 `i,j` 都在 0..31，只能 `i=j`；mapping injective，有限 32-element set 上也因此覆盖全部 32 banks。

Logical shape 仍是 32x32；storage 从 `32*32=1024` words 增加到 `32*33=1056`，额外 `32*4=128` bytes。Load/B1/use/B2 和 output mapping 不因 padding 删除或改变。

## 解答 3：审查“padding 带来 32x speedup”

| gate | established now | future evidence needed |
| --- | --- | --- |
| correctness | variants intend same 32x32 logical tile and M03 phases | host oracle plus successful GPU result check |
| bank model | named column read is expected 32-way vs conflict-free | exact instruction/metric correlation |
| resources | padded tile adds 128 shared bytes | actual kernel resource report and feasibility |
| profiler | none | Environment Manifest, tool/version, metric definition, raw log |
| timing | none | correctness pass, warm-up, sync interval, repetitions, samples |

当前允许写：**“在 selected 32-bank fixture 下，EX06 named column read 的 expected mapping 从 32-way conflict 变成 conflict-free；padded variant 每个 tile 多用 128 bytes shared storage。”** 32x speedup、latency、bandwidth 与 occupancy 都未建立。

## 有效替代方案

- Bank table 可以按 lane 全量列出，也可以用 modular proof 压缩，只要 exact word addresses 仍可恢复。
- Permutation proof 可以证明 injective 或直接列出 32 banks；不能只凭视觉颜色断言。
- Padding 可用 flat array 和 explicit pitch 33 表达；logical extent 与 storage pitch 仍必须分开。
- Future measurement ledger 可以包含多个 metrics，但每个 metric 都要有 definition 和 source/instruction scope。

## 常见错误

- 只按 bank 去重，把 distinct words same bank 误当成一个 request。
- 只看 bank sequence，把 same-address read broadcast 误报为 32-way conflict。
- 把 32x33 storage 当成 logical 33-column matrix，破坏结果语义。
- 忘记 padding 增加 shared footprint 和 resource feasibility requirement。
- 删除 M03 的 barriers，仿佛 layout transform 能建立 synchronization。
- 把 conflict degree 直接改写成 cycle count、occupancy、runtime ratio 或 speedup。

复核日期：**2026-08-27**。Compilation 与 runtime evidence axes 保持为空。
