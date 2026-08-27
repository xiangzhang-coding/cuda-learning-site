---
title: 'M04 Reviewed Solutions: Prove Bank Mapping from Word Addresses'
description: Stride/broadcast tables, a 32x33 permutation proof, and an evidence-safe padding ledger for the three M04 Exercises.
pairId: m04-solutions
counterpart: /memory/bank-conflicts-layouts/solutions/
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

<a class="locale-pair" data-locale-counterpart href="/memory/bank-conflicts-layouts/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [M04 Exercises](/en/memory/bank-conflicts-layouts/exercises/). Every result is a static prediction under the selected fixture. EX06 did not execute, and no profiler metric was observed.

## Solution 1: Distinguish three strides and broadcast

| pattern | requested words | banks | busiest-bank distinct words | result |
| --- | --- | --- | ---: | --- |
| stride 1 | `0,1,...,31` | `0,1,...,31` | 1 | conflict-free |
| stride 2 | `0,2,...,62` | even banks, each repeated twice | 2 | 2-way conflict |
| stride 32 | `0,32,...,992` | bank 0 for all | 32 | 32-way conflict |
| same-address read | word `0` for all | bank 0 for all | 1 distinct word | broadcast, no conflict |

The final two rows have the same bank sequence but different exact-address sets. A conflict counts same-bank **distinct words**; all broadcast requests name one word.

## Solution 2: Prove the 32x33 transform

For fixed `c=5`:

```text
unpadded word(i) = 32i + 5; bank(i) = 5
padded   word(i) = 33i + 5; bank(i) = (i + 5) mod 32
```

Unpadded lanes 0,1,2,3,31 request words 5,37,69,101,997, all in bank 5. Padded words are 5,38,71,104,1028, mapped to banks 5,6,7,8,4.

If two padded lanes have equal banks, `(i+5) mod 32 = (j+5) mod 32`, so `i-j` is a multiple of 32. Because both are in 0..31, `i=j`; the mapping is injective and therefore covers all 32 banks on this finite 32-element set.

Logical shape remains 32x32. Storage grows from `32*32=1024` to `32*33=1056` words, adding `32*4=128` bytes. Load/B1/use/B2 and output mapping are neither removed nor semantically changed by padding.

## Solution 3: Review “padding gives a 32x speedup”

| gate | established now | future evidence needed |
| --- | --- | --- |
| correctness | variants intend the same 32x32 logical tile and M03 phases | host oracle plus successful GPU result check |
| bank model | named column read is expected 32-way vs conflict-free | exact instruction/metric correlation |
| resources | padded tile adds 128 shared bytes | actual kernel resource report and feasibility |
| profiler | none | Environment Manifest, tool/version, metric definition, raw log |
| timing | none | correctness pass, warm-up, sync interval, repetitions, samples |

The current allowed statement is: **“Under the selected 32-bank fixture, the EX06 named column read's expected mapping changes from a 32-way conflict to conflict-free; the padded variant uses 128 additional bytes of shared storage per tile.”** A 32x speedup, latency, bandwidth, and occupancy remain unestablished.

## Valid alternatives

- List the entire bank table by lane or compress it with a modular proof, provided exact word addresses remain recoverable.
- Prove permutation through injectivity or list all 32 banks; visual colors alone are insufficient.
- Express padding with a flat array and explicit pitch 33; logical extent and storage pitch remain separate.
- Add metrics to the future measurement ledger, giving every metric its own definition and source/instruction scope.

## Common errors

- Deduplicating only by bank and treating distinct words in one bank as one request.
- Looking only at bank sequence and labeling same-address read broadcast as a 32-way conflict.
- Treating 32x33 storage as a logical 33-column matrix and changing result semantics.
- Forgetting that padding raises shared footprint and resource-feasibility requirements.
- Removing M03 barriers as though a layout transform established synchronization.
- Rewriting conflict degree directly as cycles, occupancy, a runtime ratio, or speedup.

Reviewed: **2026-08-27**. Compilation and runtime evidence axes remain empty.
