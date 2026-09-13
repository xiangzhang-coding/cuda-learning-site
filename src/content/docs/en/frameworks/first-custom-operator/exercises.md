---
title: 'P08 Exercises: Edges, Tails and Streams'
description: Implement the original edge contract and diagnose an invalid tail read and wrong-stream launch.
pairId: p08-exercises
counterpart: /frameworks/first-custom-operator/exercises/
factCheckDate: '2026-09-13'
license: CC-BY-4.0
provenance: original
structure: [contract, implementation, debugging, review]
resourceKind: exercise-set
unitId: P08-EXERCISES
prerequisites: [P08]
relatedUnits: [EX22]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p08-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/first-custom-operator/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-13' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,implementation,debugging,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P08-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P08 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX22 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/first-custom-operator/exercises/" lang="zh-CN">阅读中文对应页</a>

## Exercise contract

Prerequisite: [P08](/en/frameworks/first-custom-operator/). Solve on paper first, then work in a learner-owned copy of [EX22](/en/examples/adjacent-energy/). Native execution uses its selected Linux profile; a written answer needs no GPU. Keep predictions and actual observations separate.

## Exercise 1: Implement one edge per output

**Goal:** Implement CPU and CUDA forward paths for adjacent-difference energy without using the reference expression as the native implementation.

**Constraints:** Accept only P08's input contract. Use fresh output, one output per thread, a shared validation boundary and the input device's current stream. Handle n=1 without launching.

**Expected evidence:** Submit your code diff, a hand-derived output for `[0,0.5,-0.5,1]`, and a table for n=1, 257, 258 showing output count, blocks and inactive threads. Label unexecuted tests as plans.

**Acceptance criteria:** Every valid output is written once; input remains unchanged; an offset-contiguous view works and a stride-two view is rejected. CPU/CUDA validation compares all elements after completion on a prepared host.

<details><summary>Hint 1: Count edges first</summary><p>A vector with n vertices has n-1 adjacent edges. The work count and the largest valid input-read index are different quantities.</p></details>
<details><summary>Hint 2: Guard the pair of reads</summary><p>Allocate n-1 outputs, skip a zero work count, and only after i is proven smaller than the output count read input i and i+1.</p></details>

## Exercise 2: Debug a nearly correct launch

**Goal:** Diagnose a candidate that allocates n outputs, guards with i less than n, reads x[i+1], and always launches on the default stream.

**Constraints:** The producer and consumer use the same non-default current stream. Do not repair the candidate by synchronizing the whole device or by silently copying every input to CPU.

**Expected evidence:** Give the first out-of-bounds input index for n=258, explain why the CPU result cannot certify stream order, and propose a regression for n=1 plus a current-stream producer/operator/consumer chain.

**Acceptance criteria:** Identify both the extent defect and the independent stream-order defect; repair allocation, launch extent, guard and empty-output handling; use a device guard and current stream; explicitly complete the consumer before checking its result.

<details><summary>Hint 1: Two defects can coexist</summary><p>A corrected bound does not order work on another stream. Analyze indexing and producer-consumer ordering as separate claims.</p></details>
<details><summary>Hint 2: Submission order is local</summary><p>The selected stream must carry producer, operator and consumer in order. A launch-error query is not a cross-stream dependency or a device completion wait.</p></details>

## Review your evidence

Read the [separate solutions](/en/frameworks/first-custom-operator/solutions/) after recording your attempt. Then try [PB-R5-008](/en/practice/#pb-r5-008). [SRC-CUDA-084](/en/sources-and-versions/#src-cuda-084) provides exact primary sources and the 2026-09-13 review boundary. No Exercise answer grants CUDA Evidence Status.
