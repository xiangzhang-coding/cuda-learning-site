---
title: 'M02 Reviewed Solutions: Derive Segments from Address Sets'
description: Segment ledgers, active-mask repairs, and an EX05 prediction/observation schema for the three M02 Exercises.
pairId: m02-solutions
counterpart: /memory/coalescing-transactions/solutions/
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

<a class="locale-pair" data-locale-counterpart href="/memory/coalescing-transactions/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [M02 Exercises](/en/memory/coalescing-transactions/exercises/). They prove only static address coverage. EX05 did not execute, and no profiler or timing evidence was produced.

## Solution 1: Reconstruct the three frozen fixtures

Using relative base `B = 0` loses no generality:

| pattern | word starts | requested bytes | segment set | count |
| --- | --- | --- | --- | ---: |
| aligned contiguous | `0,4,...,124` | continuous `0..127` | `{0,1,2,3}` | 4 |
| one-word offset | `4,8,...,128` | continuous `4..131` | `{0,1,2,3,4}` | 5 |
| stride two | `0,8,...,248` | 32 discrete 4-byte words | `{0,1,2,3,4,5,6,7}` | 8 |

Every case requests 32 words, so requested payload is `32 * 4 = 128` bytes. The stride-two touched span is wider, but `8 / 4` is not a runtime ratio.

## Solution 2: Put the active mask before segment count

- **A:** Word starts `0,4,8,12,16` lie in bytes 0..19, so the set is `{0}`.
- **B:** Lane 7 requests bytes 28..31; lanes 8 and 9 request 32..39, so the set is `{0,1}`.
- **C:** Reverse mapping changes which lane requests each word but still requests starts `0,4,...,124`; the set remains `{0,1,2,3}`.

“A tail warp always has four segments” omits active addresses. “Reverse order is necessarily uncoalesced” mistakes lane order for address-set coverage. If two instructions have the same address set, this segment model gives them the same count.

## Solution 3: Design an EX05 prediction/observation ledger

A minimal schema is:

| field group | required fields | current value |
| --- | --- | --- |
| invariant | logical payload, input seed, output oracle, launch, target | declared before run |
| prediction | mode, active lanes, word width, base alignment, offset, stride, expected segments | aligned 4; offset 5; stride 8 |
| observation | Environment Manifest, profiler/tool version, metric name/definition, raw value, cache policy | unobserved |
| timing | correctness pass, warm-up, event/sync boundary, repetitions, samples | unobserved |
| conclusion | prediction match/mismatch, uncertainty, allowed performance statement | no runtime conclusion |

A profiler metric need not equal the teaching count because it may represent a different layer and include cache/reuse effects. A future run verifies logical results for all modes, interprets the named metric, and only then compares timing. Latency, bandwidth, faster, and speedup claims are currently prohibited.

## Valid alternatives

- List absolute boundaries `[B + 32k, B + 32k + 31]` or relative segment indices, provided the alignment origin is explicit.
- Use interval union or enumerate each word's byte range. Under the frozen natural-alignment contract, each accepted word belongs to one segment; reject a non-naturally-aligned word as outside this single-instruction model.
- Represent the active mask as a 32-bit bitset, lane list, or predicate table; inactive lanes generate zero requests.
- Add profiler metrics to the observation schema, but give each its own definition rather than one vague “transactions” field.

## Common errors

- Dividing 128 requested bytes by 32 and forgetting that a base offset can add a segment.
- Looking only at payload bytes for a stride pattern instead of enumerating addresses.
- Treating inactive lanes as requests or combining multiple instructions into one set.
- Assuming reverse/permuted lane order alone changes segment coverage.
- Reporting 4/5/8 as profiler observations, runtime ratios, or speedups.

Reviewed: **2026-08-27**. These solutions keep compilation and runtime evidence axes empty.
