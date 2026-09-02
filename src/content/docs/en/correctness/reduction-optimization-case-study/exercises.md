---
title: 'Q12 Exercises: Design and Audit Controlled Reduction Evidence'
description: Three transfer tasks rebuild the EX11 baseline, implement a four-stage reduction runner, and audit profiler and numerical claims.
pairId: q12-exercises
counterpart: /correctness/reduction-optimization-case-study/exercises/
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
unitId: Q12-EXERCISES
prerequisites:
  - Q12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q12-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/reduction-optimization-case-study/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: Q12-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q12 }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/reduction-optimization-case-study/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [Q12: Optimize the Canonical Reduction with Controlled Evidence](/en/correctness/reduction-optimization-case-study/) first. Q12 is a Learning Unit and grants no Evidence Status. Related [EX11](/en/examples/multi-stage-reduction/) remains Pending Hardware Verification, while [VIS10](/en/visuals/reduction-stages/) remains an evidence-neutral browser model.

## Instructions

There are exactly three transfer tasks. Exercises 1 and 3 produce static ledgers and audits. Exercise 2 may implement and build a learner-owned runner, but this page requires no GPU execution and supplies no timing, metric, speedup, or winner. Each task has two hint layers. Do not open the [reviewed solutions](/en/correctness/reduction-optimization-case-study/solutions/) before completing your own acceptance checklist.

## Exercise 1: Reject an invalid EX11 baseline and four-variable hypothesis

**Goal:** Repair a proposal that compares only the final scalar, fixes no EX11 revision, CPU reference, tolerance, stage DAG, or edge fixtures, and changes warp-tail control, barriers, shuffle tree, and loads per thread in one candidate.

**Constraints:** Preserve immutable EX11, its double CPU reference, `absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)`, `4099 -> 9 -> 1`, neutral zero, and uniform barrier participation. Write separate pre-result hypotheses for divergence, synchronization, numerical order, and memory traffic. Disclose coupling that cannot be isolated, and add support, rejection, no-answer, rollback, and competing explanations. Fill no observed value.

**Expected evidence:** A defect list, repaired canonical correctness gate, four-node variant graph, three adjacent hypothesis ledgers, and a held-constant, coupling, and decision matrix.

**Acceptance criteria:** The original baseline and confounded claim are rejected. The repaired design cannot enter measurement before passing the same CPU-reference and tolerance gate. Every edge is falsifiable and permits no answer.

<details><summary>Hint 1</summary>Draw every candidate's operand tree and stage-size DAG before deciding whether two versions really differ by one intervention.</details>

<details><summary>Hint 2</summary>Put what source predicts and what the exact GPU observes in separate columns.</details>

## Exercise 2: Implement the EX11-derived four-stage runner

**Goal:** Derive a learner-owned `q12_reduction_candidates.cu` from immutable [EX11](/en/examples/multi-stage-reduction/) without editing canonical files. Implement `build/q12-reduction-candidates --all-stages --elements ELEMENTS --verify tolerance`, running `canonical-shared-tree`, `warp-tail-control`, `reassociated-warp-order`, and `four-load-staging` in fixed order.

**Constraints:** Include canonical `multi_stage_reduction_reference.hpp` and call `ex11::initialize_input`, `ex11::cpu_reference_sum`, and `ex11::compare_reduction_sum` directly. Every variant uses 256-thread blocks, neutral zero for bounds-invalid loads, and host-driven multi-kernel stages. Warp collectives require an explicit participant mask and synchronization; never rely on implicit lockstep. Before each algorithm, use checked host-to-device copies to fill both stable partial buffers with quiet-NaN sentinels, run all stages, check the launch and `cudaDeviceSynchronize`, read back only the final valid location, and apply the same tolerance. Cover at least `1, 3, 511, 512, 513, 4099, 16777219`; candidates cannot be one another's oracle.

**Expected evidence:** Learner-owned source, a diff proving canonical EX11 files unchanged, three adjacent source diffs, required CLI checklist, expanded C++17 build command, stdout, stderr, and status, source, build, and binary SHA-256, and per-fixture and per-stage CPU reference, actual, absolute error, allowed error, and pass or fail records. GPU records may remain absent but cannot be fabricated.

**Acceptance criteria:** Source defines the four required stages in fixed order. The canonical stage retains the EX11 tree. The warp-tail stage synchronizes explicitly and preserves the complete participant set. The reassociated stage supplies a distinct operand ledger. The four-load stage supplies `16777219 -> 16385 -> 17 -> 1` and a traffic estimate. Every variant qualifies for measurement only after independently passing the same comparator. Finish your implementation before comparing it with the complete reviewed implementation in [Solution 2](/en/correctness/reduction-optimization-case-study/solutions/).

<details><summary>Hint 1</summary>Keep one shared driver, allocation, sentinel, CPU oracle, and comparator. Audit the four kernel bodies and stage-size helper separately.</details>

<details><summary>Hint 2</summary>Draw operand edges for both down-shuffle and XOR butterfly. Equal mathematical terms do not imply an equal floating-point operation sequence.</details>

## Exercise 3: Audit a profiler and CUB claim without a stage contract

**Goal:** Audit a summary with friendly metric labels but no raw samples, query, permission, replay, report and hash, Environment Manifest, or correctness result. It then says the four-load variant “eliminates divergence, reduces synchronization, stays bitwise identical, and is always fastest,” citing an unpinned CUB call as proof.

**Constraints:** Require workload, warm-up, synchronization, statistics, profiler method and permissions, Environment Manifest, correctness result, and bounded interpretation for each of the four stages. Separate source-derived traffic estimates, queried metrics, unprofiled elapsed samples, and numerical acceptance. State that LAB11 and L03 are unpublished; invent no CUB API or result.

**Expected evidence:** A claim-by-claim verdict, missing-coordinate register, exact-GPU query-first repair plan, four unfilled stage records, timing, profiler, and numerical boundaries, and at least four competing explanations.

**Acceptance criteria:** Reject every supplied universal, causal, and bitwise claim. Each repaired claim is narrow enough to receive support, rejection, or no answer. Missing measurements remain explicitly expected and unrecorded; production comparison is deferred rather than filled in.

<details><summary>Hint 1</summary>A profiler report can help explain a mechanism, but it cannot be attached retroactively to a different set of unprofiled samples.</details>

<details><summary>Hint 2</summary>Tolerance acceptance, same-run determinism, cross-run determinism, and bitwise reproducibility are four different questions.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/reduction-optimization-case-study/solutions/), then complete [PB-R3-009](/en/practice/#pb-r3-009) and [PB-R3-010](/en/practice/#pb-r3-010). Every runtime and performance cell remains expected and unrecorded until qualifying Environment Manifest and artifacts exist.
