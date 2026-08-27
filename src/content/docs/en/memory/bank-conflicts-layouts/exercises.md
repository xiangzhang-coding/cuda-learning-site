---
title: 'M04 Exercises: Prove Bank Mapping from Word Addresses'
description: Derive stride/broadcast bank tables, prove 32x33 padding, and build a layout-decision ledger that invents no speedup in three tasks.
pairId: m04-exercises
counterpart: /memory/bank-conflicts-layouts/exercises/
factCheckDate: '2026-08-27'
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
unitId: M04-EXERCISES
prerequisites:
  - M04
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
    attrs: { name: 'cuda:pair-id', content: m04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M04 }
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

<a class="locale-pair" data-locale-counterpart href="/memory/bank-conflicts-layouts/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [M04: Bank Conflicts and Layout Transforms](/en/memory/bank-conflicts-layouts/) first. The Exercises use the selected 32-bank, 32-bit-word fixture and require only static tables plus integer proofs. No CUDA-capable system is needed.

## How to answer

List exact word addresses first, then apply `bank = word_index mod 32`. Deduplicate same-address reads as broadcast before counting distinct words per bank. Then inspect the [reviewed solutions](/en/memory/bank-conflicts-layouts/solutions/).

## Exercise 1: Distinguish three strides and broadcast

**Goal:** Have 32 active lanes separately read `word(i)=i`, `2i`, `32i`, and `0`, building a lane/word/bank table for each independent instruction.

**Constraints:** Record the distinct-word set for every busiest bank. Do not classify the same-address read from bank sequence alone. Do not rewrite N-way as cycles or a runtime ratio.

**Expected evidence:** Four tables or one grouped table containing mappings, unique banks, maximum distinct words per bank, classification, and the narrowest conclusion.

**Acceptance criteria:** Stride one is conflict-free. Stride two uses 16 banks and is 2-way. Stride 32 maps 32 distinct words to bank 0 and is 32-way. Same-address reads of word 0 are broadcast and not a bank conflict.

<details><summary>Hint 1</summary>Deduplicate by exact word address before grouping by bank.</details>

<details><summary>Hint 2</summary>`32i mod 32 = 0`, but the words `32i` are distinct; every broadcast word address is exactly 0.</details>

## Exercise 2: Prove the 32x33 transform

**Goal:** For fixed column `c = 5`, list lanes 0..31 word/bank mappings for `float tile[32][32]` and `float tile[32][33]`, then prove the padded mapping is a permutation.

**Constraints:** Logical shape remains 32x32. The 33rd column is not logical data. Calculate storage words and extra bytes. Preserve M03's B1/B2 contract.

**Expected evidence:** Two formulas, mappings for at least the first four and final lanes, a permutation proof, a footprint ledger, and an unchanged-correctness statement.

**Acceptance criteria:** Every unpadded bank is 5 and the access is 32-way. Padded banks are `(i+5) mod 32` and cover every bank once. Storage grows from 1024 to 1056 words, adding 128 bytes. Logical indices/results and barriers remain unchanged.

<details><summary>Hint 1</summary>If `(i+5) mod 32 = (j+5) mod 32` and both indices are in 0..31, then `i=j`.</details>

<details><summary>Hint 2</summary>Padding changes storage stride; it is not a 33rd matrix column.</details>

## Exercise 3: Review “padding gives a 32x speedup”

**Goal:** Rewrite the claim as an EX06 `shared-layouts` decision ledger with separate correctness, expected bank model, resource footprint, future profiler observation, and timing records.

**Constraints:** Unpadded and padded variants have identical input, logical output, launch, and M03 phase contract. Current observation/timing fields remain empty. Do not infer 32x, any latency, or any occupancy number from 32-way -> conflict-free.

**Expected evidence:** A five-stage ledger, the narrowest allowed conclusion, exact coordinates required from a future run, and prohibited conclusions.

**Acceptance criteria:** State only that the named column instruction's expected mapping changes under the selected fixture. Record the +128-byte shared footprint. Require an exact Environment Manifest, tool/metric definition, correctness pass, warm-up, synchronization/timing boundary, and repetitions. Speedup remains unestablished.

<details><summary>Hint 1</summary>Conflict degree is not a decomposition of total kernel time.</details>

<details><summary>Hint 2</summary>A profiler may see other shared instructions; bind the metric to a source range.</details>

## Next step

Inspect the separate [reviewed solutions](/en/memory/bank-conflicts-layouts/solutions/) and then review a broadcast/padding claim in [Practice Bank PB-R1-016](/en/practice/#pb-r1-016).
