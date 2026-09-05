---
title: 'L05 Exercises: Audit libcu++ Synchronization Protocols'
description: Prove scoped publication, account for barrier phases and buffer reuse, and select a portable pipeline copy fallback using static reasoning artifacts.
pairId: l05-exercises
counterpart: /libraries/libcu-plus-plus-synchronization/exercises/
factCheckDate: '2026-09-05'
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
unitId: L05-EXERCISES
prerequisites:
  - L05
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l05-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/libcu-plus-plus-synchronization/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L05 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/libcu-plus-plus-synchronization/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L05](/en/libraries/libcu-plus-plus-synchronization/) first. Its prerequisite models remain in force: M05 for scope and progress, M13 for copy/storage ownership, and M19 for dialect boundaries. All tasks use CCCL/libcu++ v3.4.2 and the source review dated **2026-09-05**.

## Instructions

Submit original tables and written proofs, not CUDA/C++ implementations, pseudocode fences, GPU runs, or measured traces. Each expected-evidence item below is a reasoning artifact, not a recorded hardware observation. All four evidence arrays remain empty and no Evidence Status is assigned. Consult the unit's sources when a claim depends on the exact tag; use the [separate reviewed solutions](/en/libraries/libcu-plus-plus-synchronization/solutions/) only after producing your own packet.

## Exercise 1: Publish a payload without inventing a rendezvous

**Goal:** One producer P and one consumer C exchange a non-atomic payload in accessible storage within one block. The flag and acknowledgement are separate ordinary 32-bit integers with no padding bits, initialized before either thread uses them. Their actual addresses are four-byte aligned. Design a one-shot publication proof, then extend it to two generations without overwriting unread data.

**Constraints:** Use explicit scope and legal memory orders. If you choose `cuda::atomic_ref`, include the referenced objects' lifetimes and prohibit competing ordinary accesses while the references are in use. State the exact release store read by each acquire. An initial-value read grants no payload access. Describe only conditional safety and ownership handoff; do not implement polling or assume simultaneous residency of arbitrary blocks. Reject a proposed release load and acquire store rather than treating them as stronger choices.

Review each proposed mutation independently; storage is accessible unless the row explicitly leaves its capabilities unknown:

| Mutation | Proposed justification to audit |
| --- | --- |
| Same block, relaxed publication store and relaxed flag load | Atomicity of the flag should also publish the payload |
| Different blocks on one device in one memory synchronization domain, block-scoped sequentially consistent flag operations | The strongest memory order should compensate for narrow scope |
| Same device and domain, device-scoped release/acquire, consumer reads initial zero | Acquire always authorizes a payload read |
| CPU/GPU participants, system-scoped release/acquire, allocation atomic capabilities unknown | System scope and a shared pointer should be sufficient |

**Expected evidence:** A participant/storage/scope table; a forward reads-from and happens-before chain; a reverse acknowledgement chain for reuse; an object-lifetime/access ledger; and a four-row mutation verdict with repairs or explicit unresolved requirements. Include how generation identity prevents a stale ready value or stale acknowledgement from satisfying the next exchange.

**Acceptance criteria:** The one-shot proof orders P's payload write before C's read only after the matching acquire observation. The two-generation proof additionally orders C's last read before P's next overwrite. Both directions cover all participants at consistent scope. No regular access races with `atomic_ref`, no object dies early, and neither a wider scope nor sequential consistency is credited with progress, rendezvous, or missing allocation support.

<details><summary>Hint 1</summary>Write the payload accesses first. Then identify which atomic write each observer must actually read from; the returned integer alone is not a generation proof.</details>

<details><summary>Hint 2</summary>Ask who owns permission to overwrite after the ready flag is observed. The acknowledgement must transfer that permission back, with its own ordering edge and generation identity.</details>

## Exercise 2: Count phases and preserve a slow consumer's tile

**Goal:** Four threads A, B, C, and D belong to one block and share one barrier and one tile. A produces two successive tiles using ordinary synchronous writes; B and C read each tile. D contributes no tile data and permanently leaves this barrier protocol during the first ready phase. Produce a complete phase ledger that lets the same storage serve both tiles.

**Constraints:** One designated initializer sets the barrier's expected count to four, followed by an independent all-block initialization-visibility boundary. A, B, and C remain participants and each uses `arrive_and_wait` in every ready and consumed phase. Every continuing participant must wait for the current phase to complete before beginning the next phase or making its next arrival. D uses `arrive_and_drop` in the first ready phase and neither reads the tile nor rejoins later. Use the default completion behavior; do not introduce custom completion or asynchronous copies. A writes before its ready arrival; B/C read after their ready waits and finish before their consumed arrivals; A overwrites only after its consumed wait. Do not reinitialize the barrier between tiles.

The flawed proposal says: "D skips its first arrival, A/B/C wait for readiness, and A immediately overwrites after its wait returns. For tile two we reset the count to three." Explain all three errors rather than repairing only the count.

**Expected evidence:** An initialization/lifetime ledger; four phase rows named ready-0, consumed-0, ready-1, and consumed-1; each row's expected count, arriving participants, drop contribution, next count, permitted reads, and earliest permitted overwrite; plus a counterexample schedule in which B is slower than A. Also explain why B cannot skip its consumed wait and call an early arrival "ready-1" while C still reads tile 0: phase names are ledger labels, and arrivals affect the current countdown. These are possible ordering arguments, not observed traces.

**Acceptance criteria:** The first ready phase has four contributions, including D's drop, and subsequent phases expect three. A, B, and C each wait for completion of every ready and consumed phase before making their next arrival. Neither B nor C reads before its ready wait completes. A cannot overwrite until its consumed wait completes after both readers' final reads. No participant supplies an extra current-phase arrival under a next-phase label. D never contributes to the three-participant phases, and the barrier and tile remain alive until their users and waits are finished. The counterexamples explain why readiness alone does not release storage and why waiting only in A is insufficient.

<details><summary>Hint 1</summary>A drop has two effects at different times: one contribution now and a reduction of future expected counts. Do not subtract it from the current round's required total.</details>

<details><summary>Hint 2</summary>First let A return from the ready wait while B has not yet read the tile. Then consider B arriving at consumed-0 twice while C is still reading. Which waits prevent each error, and which countdown receives that second arrival?</details>

## Exercise 3: Choose a portable copy path and keep its ownership protocol

**Goal:** Audit the six proposed compilation/target coordinates below for the selected CCCL v3.4.2 contract, then repair a two-stage partitioned pipeline proposal without promising hardware acceleration or overlap. All rows describe native Linux; no row supplies local compilation or runtime results.

| Candidate | Toolkit | Host compiler | Dialect | GPU target |
| --- | --- | --- | --- | --- |
| A | 12.9.2 | GCC 6 | C++17 | SM75 |
| B | 12.9.2 | GCC 9 | C++20 | SM80 |
| C | 12.9.2 | GCC 10 | C++20 | SM75 |
| D | 13.3.1 | GCC 14 | C++20 | SM80 |
| E | 13.3.1 | GCC 14 | C++23 | SM90 |
| F | 11.8.0 | GCC 11 | C++17 | SM75 |

For D, the packet does **not** establish the Toolkit's bundled CCCL version. For E, the only additional artifact is the narrow EX10 C++23 probe. Use the tagged support policy, not a generic "CUDA 13.X passed CI" assertion. Also state the C++20 GCC/Clang lower bounds and each selected lane's NVCC upper bounds.

The proposed pipeline has eight participating threads in one block, two producers, six consumers, two independent stage buffers, and one shared state. Each stage buffer is at least 208 bytes with a 16-byte-aligned base. A separate global source allocation has the same size and base alignment. Producer P0 copies 100 bytes from source offset 4 to stage offset 4; P1 copies 100 bytes from offset 104 to offset 104. Both ranges are valid, disjoint trivial-byte-copy ranges. All six consumers may read the completed 200-byte payload. The proposal uses **nongroup** copies but asserts `cuda::aligned_size_t<16>` for each, permits divergent producer commits, and frees the shared state immediately after a participant calls `quit`.

**Constraints:** Treat construction as collective over all eight members with the same shared state and a producer count of two. Keep producer/consumer roles explicit. Check address **and** byte-count alignment, choose an ordinary-size or synchronous fallback when appropriate, and preserve acquire, issue, commit, wait, consume, and release ownership edges. Distinguish nongroup issues from an alternative cooperative-copy group; two producers do not satisfy an eight-member group copy. Reconcile relevant warp participation before commit without requiring nonexistent producer roles from consumers.

**Expected evidence:** Six eligibility verdicts with reasons and remaining checks; the compiler-policy intersection; an alignment calculation for both copy ranges; a two-stage ownership ledger showing source, destination, and shared-state lifetimes; and a fallback decision that remains correct on SM75. Include separate statements for API availability, acceleration eligibility, owner-test configuration, and unmeasured performance.

**Acceptance criteria:** Reject unsupported compiler/dialect/Toolkit combinations and keep D conditional on the bundled-version check. Do not infer libcu++ C++23 support from EX10 or actual 13.3 coverage from the tag's 13.X alias. Reject both false 16-byte proofs without adding overlapping copies. Consumers wait before reading and release only after their last read; producers acquire before reuse. Neither synchronous movement nor `quit` removes outstanding-work obligations. SM80 eligibility is not an instruction, timing, or overlap result; optional SM90 TMA remains outside this contract.

<details><summary>Hint 1</summary>Intersect the library minimum, dialect minimum, NVCC maximum, and Toolkit policy before considering the GPU. Separately take each actual address offset and byte count modulo 16.</details>

<details><summary>Hint 2</summary>For each stage, identify the last event allowed to read the source, the last consumer read of the destination, and the last user of shared state. A dispatch that copies synchronously changes none of those ownership questions.</details>

## Next

Review the [separate solutions](/en/libraries/libcu-plus-plus-synchronization/solutions/), then audit [PB-R4-005](/en/practice/#pb-r4-005) and [PB-R4-006](/en/practice/#pb-r4-006). Use [Memory Order, TERM-185](/en/glossary/#term-185) and [Barrier Phase, TERM-186](/en/glossary/#term-186) when naming the proof edges. The source review remains **2026-09-05**, with no hardware observations.
