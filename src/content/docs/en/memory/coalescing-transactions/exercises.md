---
title: 'M02 Exercises: Derive Segments from Address Sets'
description: Calculate aligned, offset, strided, and tail-warp segment sets, repair faulty models, and design a prediction/measurement ledger in three tasks.
pairId: m02-exercises
counterpart: /memory/coalescing-transactions/exercises/
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
unitId: M02-EXERCISES
prerequisites:
  - M02
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
    attrs: { name: 'cuda:pair-id', content: m02-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M02-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M02 }
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

<a class="locale-pair" data-locale-counterpart href="/memory/coalescing-transactions/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [M02: Coalescing as Transaction Shaping](/en/memory/coalescing-transactions/) first. These Exercises require only integer address reasoning, pseudocode, or a host/browser helper. No CUDA-capable system is needed, and a static count is not runtime evidence.

## How to answer

For every task, freeze the capability boundary, instruction, active mask, word width, base alignment, offset, and stride before listing requested words, the segment set, and the narrowest conclusion. Then inspect the [reviewed solutions](/en/memory/coalescing-transactions/solutions/).

## Exercise 1: Reconstruct the three frozen fixtures

**Goal:** Let `B mod 32 = 0`, all 32 lanes be active, and each lane read one naturally aligned 4-byte word. Calculate `(offsetBytes, strideWords) = (0,1)`, `(4,1)`, and `(0,2)`.

**Constraints:** List the first and last requested words, every 32-byte segment boundary, and distinct segment indices. Do not provide only answers. Produce no runtime ratio.

**Expected evidence:** A three-row address ledger containing formulas, a requested byte interval or discrete words, segment set, segment count, and requested payload bytes.

**Acceptance criteria:** Aligned contiguous yields `{0,1,2,3}` and 4; one-word offset yields `{0,1,2,3,4}` and 5; stride two yields `{0,1,2,3,4,5,6,7}` and 8. Requested payload is 128 bytes in every case. No conclusion contains speedup.

<details><summary>Hint 1</summary>Use relative segment index `floor((address - B) / 32)`.</details>

<details><summary>Hint 2</summary>The strided case is not one contiguous 128-byte interval; list each word start.</details>

## Exercise 2: Put the active mask before segment count

**Goal:** For an aligned base, stride 1, and 4-byte words, calculate three instructions: A has active lanes 0..4; B has active lanes 7..9; C has lanes 0..31 active but reverses lane addresses to `B + 4*(31-i)`.

**Constraints:** Build a separate set for every instruction. Do not fill inactive lanes. A permutation that changes only lane-to-address mapping must not change the address set. Do not merge the three instructions.

**Expected evidence:** Active-lane -> address -> segment mappings and reviews of “a tail warp always has four segments” and “reverse order is necessarily uncoalesced.”

**Acceptance criteria:** A touches only `{0}`. B touches `{0,1}` because lane 7 requests bytes 28..31 and lanes 8..9 occupy the next segment. C still touches `{0,1,2,3}`. Both absolute claims are rejected.

<details><summary>Hint 1</summary>Segment count depends on the address set, not whether lane numbers appear in increasing address order.</details>

<details><summary>Hint 2</summary>Lane 7's word remains entirely in segment 0; lane 8 enters segment 1.</details>

## Exercise 3: Design an EX05 prediction/observation ledger

**Goal:** Write a future-executable but currently unexecuted verification plan for aligned, offset, and stride modes in EX05 `access-kernel`, preventing segment predictions from being reported as profiler or speed evidence.

**Constraints:** Hold logical payload, input, output verification, launch shape, and compiler target fixed. Separately record expected segments, metric name/definition, cache-state policy, Environment Manifest, warm-up, timing boundary, and repetitions. Current observation fields stay empty.

**Expected evidence:** A prediction/observation schema, three expected rows, and a list of prohibited conclusions.

**Acceptance criteria:** Expected rows are 4/5/8. The schema does not require a profiler transaction counter to equal them exactly. Actual requests, cache reuse, and timing remain unobserved. The plan prohibits latency, bandwidth, faster, or speedup claims from the counts and verifies correctness before timing.

<details><summary>Hint 1</summary>Prediction describes the address model; observation carries tool, metric, and run coordinates.</details>

<details><summary>Hint 2</summary>“Unobserved” is more complete than inserting invented data derived from hand calculation.</details>

## Next step

Inspect the separate [reviewed solutions](/en/memory/coalescing-transactions/solutions/) and then review another overreaching conclusion in [Practice Bank PB-R1-014](/en/practice/#pb-r1-014).
