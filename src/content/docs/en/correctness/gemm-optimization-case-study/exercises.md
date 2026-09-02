---
title: 'Q13 Exercises: Design and Audit Controlled GEMM Evidence'
description: Rebuild the EX15 baseline, implement four controlled GEMM stages, and audit tile, occupancy, profiler, and production claims without memorized winners.
pairId: q13-exercises
counterpart: /correctness/gemm-optimization-case-study/exercises/
factCheckDate: '2026-09-03'
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
unitId: Q13-EXERCISES
prerequisites:
  - Q13
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q13-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/gemm-optimization-case-study/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q13-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q13 }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/gemm-optimization-case-study/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete only [Q13: Optimize the Canonical GEMM with Controlled Evidence](/en/correctness/gemm-optimization-case-study/) first. Q13 is a Learning Unit and grants no Evidence Status. Linked [EX15](/en/examples/tiled-gemm/) remains Pending Hardware Verification, while [VIS12](/en/visuals/gemm-tiling-hierarchy/) remains an evidence-neutral browser model.

## Instructions

There are exactly three transfer tasks. Exercises 1 and 3 produce static ledgers and audits. Exercise 2 may build and run learner-owned CUDA in an external Supported Environment, but this page supplies no GPU output, timing, metric, occupancy, speedup, or winner. Each task has two layered hints. Do not open the [reviewed solutions](/en/correctness/gemm-optimization-case-study/solutions/) until your own acceptance checklist is complete.

## Exercise 1: Reject a memorized tile and rebuild the comparison graph

**Goal:** Repair a proposal that says “use a 32-by-32 tile because it is fastest,” tests only square aligned matrices with beta zero, omits EX15's source revision and CPU oracle, and changes output shape, K depth, outputs per thread, compiler flags, and precision in one candidate.

**Constraints:** Retain immutable EX15, row-major `A[M,K] * B[K,N] -> C[M,N]`, the three canonical edge fixtures, FP32 device accumulation, double CPU accumulation, finite rejection, and `absolute_error <= 1e-4 + 2e-5 * abs(cpu_reference)`. Build the four-stage graph `canonical-16x16x16 -> k-tile-16x16x8 -> rectangular-32x8x8 -> coarsened-32x16x8`. For every edge, label `TM/TN/TK`, ownership, reuse, source shared bytes, accumulator count, coupling, support/reject/no-answer/rollback, and competing explanations. Do not fill an observed value.

**Expected evidence:** Defect list, repaired correctness gate, labeled stage graph, three adjacent source diffs, tile-load and reuse ledger, held-constant/coupling matrix, and pre-result decisions.

**Acceptance criteria:** The memorized winner and confounded comparison are rejected. No stage reaches measurement before passing the same EX15 oracle/tolerance gate. Every hypothesis can fail or remain unanswered, and no tile size is justified by its number alone.

<details><summary>Hint 1</summary>Count full-slice A and B values, completed outputs, K slices, barriers, source shared bytes, and source accumulators before naming a profiler field.</details>

<details><summary>Hint 2</summary>Changing tile shape can alter reuse direction, grid size, edge waste, resources, and instruction structure together; disclose the bundle instead of inventing one cause.</details>

## Exercise 2: Implement an EX15-derived four-stage runner

**Goal:** Derive learner-owned `q13-gemm-candidates.cu` from immutable [EX15](/en/examples/tiled-gemm/) without editing canonical files. Implement `build/q13-gemm-candidates --all-stages --m M --k K --n N --verify tolerance` and run the four required stage IDs in fixed order.

**Constraints:** Include canonical `tiled_gemm_reference.hpp` exactly once and call `ex15::matrix_counts`, `ex15::make_fixture`, `ex15::gemm_reference`, and `ex15::verify_tolerance` directly. Use the exact `ex15::kFixtures` inputs and per-fixture alpha/beta for `2x3x2`, `33x31x35`, and `32x32x32`; only the declared `1024x1024x1024` workload uses the learner-owned deterministic generator with `alpha=0.75` and `beta=0.25`. Use 256 threads in every stage; bounds-invalid shared slots receive zero; all block threads reach both barriers in every K slice. Restore the original C bytes before every stage, check launch and `cudaDeviceSynchronize`, copy the complete C matrix, and let no candidate serve as another candidate's oracle. Expose one unique kernel function per stage so a function-name profiler filter cannot collapse four template specializations. Do not add timing or profiler collection to the correctness runner.

**Expected evidence:** Learner-owned source; proof that EX15 files did not change; three adjacent source diffs; required CLI checklist; expanded C++17 command with `sm_75` and `compute_75`; source/build/binary SHA-256; stdout, stderr, and status; and per-stage EX15 tolerance records for every fixture. GPU records may remain absent, but they cannot be fabricated.

**Acceptance criteria:** The canonical stage preserves EX15's 16-by-16 ownership and p-order. The K-tile stage changes `TK` while disclosing loop, barrier, storage, cooperative-load ownership, active-load-instruction, and address-group effects. The rectangular stage implements 32-by-8 output ownership. The coarsened stage implements two outputs per thread. Four unique kernel functions map unambiguously to the four stage IDs. Every stage independently passes the exact canonical fixtures and comparator before measurement. Complete your own source first, then compare it with the reviewed implementation linked from Solution 2.

<details><summary>Hint 1</summary>One templated kernel can keep the allocator, input generator, CPU oracle, comparator, zero fill, and barriers shared while instantiating four explicit tile/ownership coordinates.</details>

<details><summary>Hint 2</summary>A cooperative linear load loop lets a 256-thread block fill tile arrays whose element counts differ without early return before a barrier.</details>

## Exercise 3: Audit an occupancy, traffic, and production claim

**Goal:** Audit a summary that reports friendly labels and one occupancy percentage without exact compiler resources, GPU, compute capability, metric query, permission, replay, report/hash, Environment Manifest, raw unprofiled samples, or correctness result. It concludes that the coarsened tile is always fastest, a Tensor Core was used, and the educational kernel can replace cuBLAS.

**Constraints:** Require every stage to declare matrix shapes, A/B/C and accumulation types, exact compute capability, workload and bytes, C restoration, warm-up, checked synchronization, retained statistics, profiler method and permissions, complete Environment Manifest, EX15 tolerance result, and bounded interpretation. Separate source requested-byte estimates, queried path traffic, compiler resources, theoretical occupancy, achieved occupancy, and unprofiled elapsed samples. State that L06 and LAB12 are unpublished and do not invent a cuBLAS API, Tensor Core path, or result.

**Expected evidence:** Claim-by-claim verdict, missing-coordinate register, exact-GPU query-first repair plan, four unfilled stage records, source/compiler/profiler/timing boundary table, and at least five competing explanations.

**Acceptance criteria:** Universal, causal, architecture, and production claims are rejected. Every repaired claim is narrow enough to receive support, rejection, or no answer. Missing measurements remain expected and unrecorded; the production comparison is deferred rather than guessed.

<details><summary>Hint 1</summary>Source accumulators and shared arrays are inputs to a resource hypothesis, not the compiler's final register/local-memory allocation.</details>

<details><summary>Hint 2</summary>Even a matched traffic direction and a higher occupancy value do not prove the elapsed difference has one cause or survives another shape, precision, build, or GPU.</details>

## Next

Inspect the separate [reviewed solutions](/en/correctness/gemm-optimization-case-study/solutions/), then complete [PB-R3-011](/en/practice/#pb-r3-011) and [PB-R3-012](/en/practice/#pb-r3-012). Runtime and performance cells remain expected and unrecorded until qualifying Environment Manifests and artifacts exist.
