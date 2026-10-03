---
title: 'H03 Exercises: Budget Reuse and Audit Cache Evidence'
description: Calculate a bounded working set and repair a confounded cache comparison.
pairId: h03-exercises
counterpart: /architecture/ada-working-sets/exercises/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, budget, measurement, review]
resourceKind: exercise-set
unitId: H03-EXERCISES
prerequisites: [H03]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ada cache contracts', url: 'https://docs.nvidia.com/cuda/ada-tuning-guide/index.html#memory-system', version: '13.4', platform: 'Paper exercise', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,budget,measurement,review' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: H03 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/ada-working-sets/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and deliverables

Exact prerequisite: [H03](/en/architecture/ada-working-sets/). Submit a byte ledger and a measurement protocol. These original paper Exercises require no GPU; architecture behavior remains **Pending Hardware Verification**. Reviewed **2026-09-22**, [SRC-CUDA-105](/en/sources-and-versions/#src-cuda-105).

## Exercise 1: allocation is not residency

**Goal:** analyze H03's 4/32/128 MiB input cases with equally sized outputs on a hypothetical CC 8.9 GPU reporting 64 MiB L2, 8 GB device memory and 512 MiB free after context setup. A proposed optimization gives a 32 MiB input a persisting window; the device allows a 16 MiB set-aside and 64 MiB maximum window.

**Constraints:** retain exact int32 copy semantics, ordinary-copy default policy as baseline and `compute_89` / `sm_89`. Use binary MiB and keep a 256 MiB non-payload reserve. Do not infer actual hits or timing from capacity. No cluster/TMA is required.

**Acceptance:** tabulate allocation and requested bytes for each case; calculate whether payload plus reserve fits. Distinguish “input alone fits” from simultaneous input/output residency. Explain what ratio 1 and ratio 0.5 request for the 32 MiB window, which competing traffic is missing from the simple ledger, and how to restore default policy after completed work. Include MIG/MPS failure actions and CPU bitwise validation.

<details><summary>Hint 1</summary>Count both arrays, but do not turn their total into a hardware cache-residency theorem.</details>
<details><summary>Hint 2</summary>The window and set-aside have different limits. A fraction receiving the persisting property is not a measured fraction of cache hits.</details>

## Exercise 2: repair the causal claim

**Goal:** review this synthetic proposal: “Device A was timed on repeated warmed data with no profiler. Device B was measured during default kernel replay with cache flushing, while driving a display. B reports fewer L2 hits, therefore A's product generation is faster.” No qualifying runtime reports are supplied.

**Constraints:** use the same ordinary-copy workload and one CC 8.9 device for the first repaired comparison. Keep 4/32/128 MiB sizes and an equal documented repetition count, check all outputs, and separate default-policy versus optional-policy trials. No invented numbers or GPU execution.

**Acceptance:** identify at least four uncontrolled factors; specify cold/first-pass versus repeated-pass protocols, event boundaries, correctness, trial distribution and independent counter collection. State the counter-permission failure outcome, required Environment Manifest fields, and the precise maximum conclusion the available evidence allows. Explain why even a properly measured cross-device difference would not isolate L2 capacity alone.

<details><summary>Hint 1</summary>Timing and counters currently describe different executions and different cache histories.</details>
<details><summary>Hint 2</summary>Record replay/cache policy, display/concurrent work, clocks/power/thermals, software, and complete timing boundaries. A denied counter is unknown, not zero.</details>

## Review separately

Read [worked solutions](/en/architecture/ada-working-sets/solutions/) after both attempts, then [PB-R7-003](/en/practice/#pb-r7-003). Original CC BY 4.0; owner sources retain their notices. No compilation or runtime evidence is granted.
