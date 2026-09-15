---
title: 'T07 Exercises: Prove the Schedule and Challenge the Speed Claim'
description: Implement cyclic GEMM tile ownership and a gated nonpersistent comparison.
pairId: t07-exercises
counterpart: /triton/persistent-kernels/exercises/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: T07-EXERCISES
prerequisites: [T07]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton persistent matmul tutorial', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/tutorials/09-persistent-matmul.py', version: '3.7.1', platform: 'CUDA architecture-gated source', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t07-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/persistent-kernels/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T07 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/persistent-kernels/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[T07]**: [persistent kernels](/en/triton/persistent-kernels/). Use a learner copy of [LAB16](/en/labs/autotune-triton-gemm/), retaining its nonpersistent baseline. T07's architecture, shape, dtype, memory and profiler-permission gates apply. Checked 2026-09-15; [SRC-CUDA-091](/en/sources-and-versions/#src-cuda-091).

## Exercise 1: implement persistent ownership

**Goal:** replace the baseline's two-dimensional program-to-tile mapping with a one-dimensional cyclic output-tile loop. Produce a proof and a correctness report before any performance comparison.

**Constraints:** BM=BN=BK=32, four warps, two stages, `num_ctas=1`; FP16 inputs/output, FP32 accumulator; no TMA, FP8, queue, global barrier, split-K or atomics. Positive dimensions only. Actual launch P is the loop stride; reset the accumulator for every output tile. Use T07's five shapes, both P policies and LAB16's independent numerical/guard checks.

**Acceptance:** every tile appears exactly once for P=1, P=T, P=min(T,S) and P=min(T,2S). Show the owner of a tail tile algebraically. Include host-model T=10/P=3 and T=35/P=8 cases. Retain source changes, target/configuration, all correctness results or precise blockers; do not mark host coverage as GPU execution. Extend the learner harness to test the candidate without replacing the baseline or publishing a selected configuration.

<details><summary>Hint 1: use quotient and remainder twice</summary>First determine which program owns t by division by P. Then decode the row and column tile by division by Tn.</details>
<details><summary>Hint 2: follow the state lifetime</summary>One accumulator belongs to one output tile. Its K loop completes before the next tile begins. Masks still guard all three dimensions.</details>

## Exercise 2: audit a persistent performance claim

**Goal:** evaluate a fictional report: “P equals the SM count, so all programs are resident one per SM; 100% occupancy means this kernel is optimal; fewer programs save host launches.” Design the measurements that could actually support a decision.

**Constraints:** invent no replacement timing or occupancy values. Include a single-tile case, a many-tile case, missing counter permissions and a candidate resource failure. Keep exact tile settings equal before exploring other configurations. Use T07's matched warm-up, three rounds, raw samples, separate compilation and profiler protocol.

**Acceptance:** refute each unsupported inference, retain the nonpersistent fallback and list all Environment Manifest coordinates. State when a comparison is meaningless, when it is timing-only, and when it is inconclusive. Explain why a CTA waiting on an unscheduled producer can deadlock. Hardware outcomes stay Pending Hardware Verification without qualifying evidence.

<details><summary>Hint 1: count launches at the host boundary</summary>The baseline already launches the whole output grid once. A smaller grid changes work assignment, not that call count.</details>
<details><summary>Hint 2: separate capacity from scheduling</summary>Use actual register/shared-memory/warp limits for theoretical residency, measured active and eligible warps for execution, and independent uninstrumented timings for the decision.</details>

## Review separately

Attempt both tasks before reading the [solutions](/en/triton/persistent-kernels/solutions/). Then audit [PB-R5-020](/en/practice/#pb-r5-020).
