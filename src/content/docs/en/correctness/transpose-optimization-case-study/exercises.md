---
title: 'Q11 Exercises: Repair and Design Controlled Transpose Evidence'
description: Three transfer tasks repair an EX14 baseline, implement the four-stage runner consumed by LAB10, and audit a bank-layout profiler claim.
pairId: q11-exercises
counterpart: /correctness/transpose-optimization-case-study/exercises/
factCheckDate: '2026-09-02'
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
unitId: Q11-EXERCISES
prerequisites:
  - Q11
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q11-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/transpose-optimization-case-study/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-02' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q11 }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/transpose-optimization-case-study/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [Q11: Optimize the Canonical Transpose with Controlled Evidence](/en/correctness/transpose-optimization-case-study/) first. Q11 is a Learning Unit and grants no Evidence Status; the linked [EX14](/en/examples/tiled-transpose/) and [LAB10](/en/labs/optimize-canonical-transpose/) are both currently Pending Hardware Verification with empty recorded observations.

## Instructions

These are exactly three transfer tasks. Exercises 1 and 3 produce reviewable ledgers; Exercise 2 produces a learner-owned source and C++17 build handoff that may be implemented and built, but this static Exercise page supplies and requires no GPU result. Do not invent output, choose a tile winner, or treat a proposed profiler field as observed. Each task has two layered hints; stop before the [reviewed solutions](/en/correctness/transpose-optimization-case-study/solutions/) until your acceptance checklist is complete.

## Exercise 1: Repair an invalid EX14 baseline and hypothesis ledger

**Goal:** Repair a proposal that calls an unpinned square-only run an “EX14 baseline,” skips `5x7` and `33x35`, checks neither output shape nor every element, and states only “padding should improve performance” as its hypothesis ledger.

**Constraints:** Keep the immutable EX14 oracle, all three fixtures, `output[col * rows + row] = input[row * columns + col]`, exact equality, source/build identities, and the distinction between acceptance baseline and recorded measurement baseline. Add one primary variable, one mechanism, invariants, competing explanations, support/reject/no-answer rules, and rollback. Supply no result.

**Expected evidence:** A defect list, repaired correctness gate, baseline-qualification packet, and one complete pre-result hypothesis-ledger row.

**Acceptance criteria:** The original baseline is rejected. The repaired plan cannot time or profile a candidate until all EX14 checks pass, and its hypothesis can be falsified without assuming padding wins.

<details><summary>Hint 1</summary>A source revision and a correct square output do not establish the rectangular output-shape and edge contracts.</details>

<details><summary>Hint 2</summary>Write the reject and no-answer branches before writing the evidence field.</details>

## Exercise 2: Implement the LAB10 coalescing-to-tiling four-stage runner

**Goal:** Derive a learner-owned `lab10_transpose_candidates.cu` from immutable [EX14](/en/examples/tiled-transpose/) without editing any canonical file. Adjacent stages change one primary variable at a time. Implement the required CLI `build/lab10-transpose-candidates --all-stages --rows ROWS --columns COLUMNS --verify exact` and provide four separate kernels/stages in fixed order: frozen direct `baseline-direct`; `coalescing-direction`, which changes only thread-to-coordinate direction; `shared-memory-tiling`, which uses an unpadded `32x32` shared tile; and `padded-bank-layout`, which changes only the physical shared stride to `32x33`. The shared driver must create one stable device output allocation per process and reuse the same allocation and address across all four stages while keeping each stage's correctness independent of its predecessor.

**Constraints:** Preserve the independent EX14 CPU oracle, out-of-place mapping, and finite, non-NaN deterministic input and oracle values; candidates cannot serve as each other's oracle. Immediately before every stage launch in every correctness, warm-up, and profiled process, fill the complete output with a quiet-NaN sentinel through a checked host-to-device copy and check the fill/copy CUDA status. Then launch, check `cudaDeviceSynchronize`, perform a checked device-to-host copy of the complete output, and require the correct output shape, `output[col * rows + row] = input[row * columns + col]`, exact oracle equality at every element, and that no sentinel remains. Apply this procedure independently to all four stages for `5x7`, `33x35`, `64x32`, and `4096x4096`. The stable allocation and address and the identical sentinel procedure are held constants, and the fill and copy remain outside selected kernel metrics. Use C++17. Implementation and building are permitted, but this static Exercise page supplies and requires no GPU execution, timing, profiler value, or winner.

**Expected evidence:** The learner-owned source artifact; a record proving canonical files are unchanged; three reviewed adjacent-stage diffs; a checklist for the required CLI and stage order; C++17 build instructions, expanded build command, log/status artifact, and resulting `build/lab10-transpose-candidates`; SHA-256 hashes for the source, each adjacent diff, build records, and binary; and an audit of the oracle, four fixtures, stable allocation and address, per-stage sentinel fill/copy statuses, synchronization, complete-output readback, exact comparison, and no-sentinel-remains result. Do not submit site-filled GPU output.

**Acceptance criteria:** The handoff proves EX14 remains immutable, the source defines all four required kernels/stages, the C++17 build produces the required binary, and the CLI expresses all four exact checks. Each process allocates output once and preserves its address; every fixture and stage performs a checked full-output quiet-NaN fill before launch, checked synchronization and full readback after launch, and passes shape and every-element exact-oracle checks with no sentinel remaining. Each of the three adjacent diffs contains only its declared variable change. This source/build/hash packet can enter the guided [LAB10](/en/labs/optimize-canonical-transpose/) directly. A missing GPU result does not fail this static Exercise or populate any Evidence Status axis. Finish your own attempt and checklist before comparing it with the complete reviewed implementation in [Solution 2 on the separate solutions page](/en/correctness/transpose-optimization-case-study/solutions/).

<details><summary>Hint 1</summary>Keep CLI parsing, allocation, the independent CPU oracle, and exact comparison in a shared driver contract while leaving the four kernel bodies independently reviewable.</details>

<details><summary>Hint 2</summary>Hash the learner source and three adjacent diffs first, then retain the C++17 build records and binary hash; leave GPU execution and profiler custody to LAB10.</details>

## Exercise 3: Audit a bank-layout profiler claim with competing explanations

**Goal:** Audit the claim “`T+1` removed bank conflicts and made transpose faster” when its packet contains only a screenshot, a friendly metric label, no exact GPU query output, no permission or replay record, no raw timing samples, and no proof that logical tile shape and launch stayed fixed.

**Constraints:** Separate VIS11 arithmetic, static bank-index reasoning, queried metric definition, `.ncu-rep` custody, and unprofiled timing. Check physical stride, access width, source instruction, workload, correctness, exact GPU/tool, metric unit/scope, filter, replay, and permission. Name at least three competing explanations without assigning values.

**Expected evidence:** A claim-by-claim verdict, missing-coordinate register, exact-GPU query-first repair plan, matched report/timing custody plan, and a competing-explanation matrix.

**Acceptance criteria:** The supplied claim is not accepted as evidence. The repaired claim is narrow enough to be supported, rejected, or left unanswered; it does not turn a conflict-related field, Roofline region, or VIS11 state into causal proof.

<details><summary>Hint 1</summary>First ask whether `T` and `T+1` are the only physical change; a changed shared footprint can affect another mechanism.</details>

<details><summary>Hint 2</summary>A profiler report and an unprofiled timing run are separate observations even when their workloads are matched.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/transpose-optimization-case-study/solutions/), then use the published [PB-R3-007](/en/practice/#pb-r3-007) and [PB-R3-008](/en/practice/#pb-r3-008). Carry the Exercise 2 runner into the guided follow-on [LAB10: Optimize the Canonical Transpose](/en/labs/optimize-canonical-transpose/); static Exercise content does not populate the Lab record.
