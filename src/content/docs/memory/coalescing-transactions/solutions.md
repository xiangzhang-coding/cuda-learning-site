---
title: 'M02 参考解答：从地址集合推导 Segment'
description: M02 三道练习的 segment ledgers、active-mask 修复和 EX05 prediction/observation schema。
pairId: m02-solutions
counterpart: /en/memory/coalescing-transactions/solutions/
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
unitId: M02-SOLUTIONS
prerequisites:
  - M02-EXERCISES
relatedUnits:
  - M02
  - EX05
  - VIS04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m02-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M02-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M02,EX05,VIS04' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/en/memory/coalescing-transactions/solutions/" lang="en">Read the English counterpart</a>

## 复核前

这是 [M02 练习（Exercise）](/memory/coalescing-transactions/exercises/)的**参考解答**。答案只证明 static address coverage；没有执行 EX05 或产生 profiler/timing evidence。

## 解答 1：重建三个 frozen fixtures

对 `B = 0` 使用 relative addresses 不损失一般性：

| pattern | word starts | requested bytes | segment set | count |
| --- | --- | --- | --- | ---: |
| aligned contiguous | `0,4,...,124` | continuous `0..127` | `{0,1,2,3}` | 4 |
| one-word offset | `4,8,...,128` | continuous `4..131` | `{0,1,2,3,4}` | 5 |
| stride two | `0,8,...,248` | 32 discrete 4-byte words | `{0,1,2,3,4,5,6,7}` | 8 |

每个 case 有 32 words，所以 requested payload 都是 `32 * 4 = 128` bytes。Stride-two touched span 较宽，但不能把 `8 / 4` 写成 runtime ratio。

## 解答 2：让 active mask 先于 segment count

- **A:** Word starts `0,4,8,12,16`，全部位于 bytes 0..19，所以 set 是 `{0}`。
- **B:** Lane 7 请求 bytes 28..31；lanes 8 与 9 请求 32..39，所以 set 是 `{0,1}`。
- **C:** Reverse mapping 改变哪个 lane 请求哪个 word，却仍请求 starts `0,4,...,124`，所以 set 仍是 `{0,1,2,3}`。

“Tail warp 总是四个 segments”遗漏 active addresses；“reverse order 一定不 coalesced”把 lane order 错当成 address-set coverage。两条 instruction 若 address sets 相同，在这个 segment model 中 count 相同。

## 解答 3：设计 EX05 prediction/observation ledger

一份最小 schema 是：

| field group | required fields | current value |
| --- | --- | --- |
| invariant | logical payload, input seed, output oracle, launch, target | declared before run |
| prediction | mode, active lanes, word width, base alignment, offset, stride, expected segments | aligned 4; offset 5; stride 8 |
| observation | Environment Manifest, profiler/tool version, metric name/definition, raw value, cache policy | unobserved |
| timing | correctness pass, warm-up, event/sync boundary, repetitions, samples | unobserved |
| conclusion | prediction match/mismatch, uncertainty, allowed performance statement | no runtime conclusion |

Profiler metric 不必与 teaching count 一一相等；它可能位于不同层并受 cache/reuse 影响。未来 run 应先验证三个 mode 的 logical result，再解释 named metric，最后才允许比较 timing。当前禁止 latency、bandwidth、faster 与 speedup claim。

## 有效替代方案

- Segment set 可以列 absolute boundaries `[B + 32k, B + 32k + 31]`，也可以列 relative indices，只要 alignment origin 明确。
- 可以用 interval union 或枚举每个 word byte range；在 frozen natural-alignment contract 下，每个 accepted word 只属于一个 segment，未自然对齐的 word 应判为超出 single-instruction model。
- Active mask 可用 32-bit bitset、lane list 或 predicate 表示；inactive lane 必须生成零 requests。
- Observation schema 可以增加多个 profiler metrics，但每个都要有自己的定义，不能共享一个模糊的 “transactions”。

## 常见错误

- 把 128 requested bytes 除以 32 后忘记 base offset 可增加 segment。
- 对 stride pattern 只看 payload bytes，不枚举实际地址。
- 把 inactive lanes 当作 requests，或把多条 instructions 合并成一个 set。
- 认为 reverse/permuted lane order 本身必然改变 segment set。
- 把 4/5/8 直接写成 profiler observations、runtime ratio 或 speedup。

复核日期：**2026-08-27**。这些解答保持 compilation 与 runtime evidence axes 为空。
