---
title: 'Q10 Exercises: Build, Place, and Audit a Roofline Point'
description: Freeze a work/traffic boundary, complete a synthetic Roofline calculation, and audit an above-roof point and ceiling provenance in three static tasks.
pairId: q10-exercises
counterpart: /correctness/roofline-arithmetic-intensity/exercises/
factCheckDate: '2026-09-01'
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
unitId: Q10-EXERCISES
prerequisites:
  - Q10
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q10-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/roofline-arithmetic-intensity/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-01' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q10 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/correctness/roofline-arithmetic-intensity/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [Q10](/en/correctness/roofline-arithmetic-intensity/) first. Every numerical input is synthetic and must not be rewritten as a GPU, profiler, or calibrated observation.

## Instructions

Carry units and provenance through each step. If workload, operation convention, byte boundary, time scope, or ceiling family disagrees, stop and audit before plotting a point. Inspect the [reviewed solutions](/en/correctness/roofline-arithmetic-intensity/solutions/) afterward.

## Exercise 1: Freeze a work and traffic contract

**Goal:** Build a ledger for an abstract FP32 workload with `W=9.0e9 FLOP`, declared DRAM-path traffic `T_DRAM=4.5e9 byte`, and FMA counted as 2 FLOP. Derive `I_DRAM` and list every field that must be redeclared if the boundary changes to L2.

**Constraints:** Work and traffic cover the same kernel or range, input, and iteration count. Separate compulsory estimate, implementation estimate, and tool-observed traffic. Fill no cache-hit, transaction, or metric value.

**Expected evidence:** A work-convention row, DRAM-boundary row, unit-complete `I_DRAM` calculation, L2 recount checklist, and stop conditions.

**Acceptance criteria:** `I_DRAM = 2.0 FLOP/byte`. The answer neither reuses DRAM intensity for L2 nor calls logical bytes measured bytes.

<details><summary>Hint 1</summary>The intensity subscript tells a reviewer which path supplies denominator bytes.</details>

<details><summary>Hint 2</summary>Work may stay fixed when the boundary changes, but the traffic definition and value must be rebuilt.</details>

## Exercise 2: Calculate the roof and workload point

**Goal:** Use `P_compute=15.0e12 FLOP/s`, `B_path=2.5e12 byte/s`, `I_path=2.0 FLOP/byte`, `W=9.0e9 FLOP`, and `t=2.25e-3 s` to calculate ridge intensity, path roof, overall roof, achieved rate, and point.

**Constraints:** Every input belongs to one labeled synthetic provenance family. Preserve FLOP, byte, and second through each step. Label only a modeled region, never an observed bottleneck or predicted speedup.

**Expected evidence:** Five unit-complete steps, point coordinates, a below/on/above-roof check, and a bounded region label.

**Acceptance criteria:** `I_ridge=6.0 FLOP/byte`, path roof=`5.0 TFLOP/s`, overall roof=`5.0 TFLOP/s`, and `P_achieved=4.0 TFLOP/s`. The point is below the roof in the modeled path-ceiling region.

<details><summary>Hint 1</summary>`2.0 FLOP/byte * 2.5e12 byte/s = 5.0e12 FLOP/s`.</details>

<details><summary>Hint 2</summary>`I_path < I_ridge` is a geometry classification, not a causal measurement.</details>

## Exercise 3: Audit above-roof and mixed provenance

**Goal:** Audit a point whose x-coordinate uses a compulsory DRAM estimate, y-coordinate comes from another run, compute ceiling comes from a specification, bandwidth ceiling comes from an undocumented microbenchmark environment, and point lies above the roof.

**Constraints:** Audit operation count, byte boundary, unit prefix, scope, time, device and run, ceiling provenance, and exact report definition. Propose separate valid rebuilds for theoretical, calibrated/measured, and tool-reported models. Do not merge them into one roof.

**Expected evidence:** A mismatch table, rejection verdict, three provenance-specific rebuild packets, and a query-first checklist.

**Acceptance criteria:** The original point is not interpreted. Above-roof is treated as an inconsistent-input signal. Every rebuilt point and roof uses one workload, boundary, run/device, and provenance. No ceiling moves to fit the data.

<details><summary>Hint 1</summary>First show that x, y, and roof describe the same workload before discussing point position.</details>

<details><summary>Hint 2</summary>“Specification compute plus measured bandwidth” can be discussed only as an explicit hybrid, but this task requires three unmixed provenance families.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/roofline-arithmetic-intensity/solutions/), complete [Practice Bank PB-R3-005](/en/practice/#pb-r3-005), and return to [A14](/en/algorithms/algorithm-choice-arithmetic-intensity/) to audit an algorithm choice.
