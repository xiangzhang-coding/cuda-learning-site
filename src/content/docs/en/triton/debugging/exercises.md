---
title: 'T06 Exercises: Debug the Contract Before Trusting a Tool'
description: Repair a bounded tail defect and design a defensible diagnostic record.
pairId: t06-exercises
counterpart: /triton/debugging/exercises/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T06-EXERCISES
prerequisites: [T06]
relatedUnits: [EX23]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton debugging guide', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/docs/programming-guide/chapter-3/debugging.rst', version: '3.7.1', platform: 'Interpreter and CUDA', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/debugging/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T06 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: EX23 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/debugging/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[T06]**: [debugging](/en/triton/debugging/). Use its pinned external Linux setup for execution. Paper diagnosis needs no GPU. Reviewed 2026-09-15; [SRC-CUDA-090](/en/sources-and-versions/#src-cuda-090). Do not treat an expected outcome as an observed one.

## Exercise 1: repair a logical tail

**Goal:** on a learner copy of `scripts/triton-diagnostics/kernel.py`, repair the broken mask without removing the guard or changing the logical length. Explain why an in-bounds allocation access can still be a bug.

**Constraints:** N=17, BLOCK=32, FP32, 18 allocated elements, guard −999. Keep the independent host oracle, separate processes and full version gate. Do not introduce an actual invalid CPU pointer. Before execution, predict clean/tail/print/assert outcomes and distinguish GPU assertions from interpreter checks.

**Acceptance:** retain the original failure and repaired result, check all 17 values and the guard, then extend your copy to lengths 1, 31, 32 and 33 with a rounded-up grid and N+1 storage. The exact-multiple case must not hide the nonmultiple defect. GPU execution requires the T06 gate and manifest; without it submit host/interpreter progress and an explicit runtime blocker. Explain why interpreter success and a zero-error memcheck summary do not confer Runtime-Verified status.

<details><summary>Hint 1: there are two lengths</summary>The allocation contains 18 elements; the computation owns only 17. Which comparison admits the guard?</details>
<details><summary>Hint 2: audit both memory operations</summary>Use the same logical validity predicate for load and store, with a defined masked load value. A store-only mask can hide the extra read; a load-only mask can still overwrite the guard.</details>

## Exercise 2: select a tool and preserve a report

**Goal:** write a decision table for a wrong reduction identity, invalid device access, shared-memory hazard, uninitialized global read and synchronization misuse. Implement a counts-only derivative test using synthetic input; do not paste a real log into a test.

**Constraints:** memcheck precedes narrower GPU checks. Record unsupported interpreter operations separately. Include tool startup failure, nonzero application exit with zero tool errors, absent summary and multiple summaries. Never export free-form paths, addresses, hostnames or credentials.

**Acceptance:** explain each tool's coverage and exclusions, show that missing/ambiguous summaries remain unknown, and preserve private-original versus public-derivative hashes and review responsibility in the report design. A counts-only summary cannot establish the executed kernel or the cause. All GPU observations remain Pending Hardware Verification without a qualifying manifest.

<details><summary>Hint 1: a detector is not an oracle</summary>Wrong finite arithmetic can pass every memory checker. Racecheck concerns shared memory, not every global ownership error.</details>
<details><summary>Hint 2: export a small schema</summary>Construct output from validated enums, bounded numbers and fixed labels. Do not try to remove a few known secrets and then publish the remaining raw text.</details>

## Review separately

Attempt both tasks before opening the [solutions](/en/triton/debugging/solutions/). Then review [PB-R5-019](/en/practice/#pb-r5-019).
