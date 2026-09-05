---
title: 'L05 Reviewed Solutions: libcu++ Synchronization Contracts'
description: Review complete publication, barrier phase/reuse, and portability/fallback proofs, with valid alternatives and common scope, lifetime, and completion errors.
pairId: l05-solutions
counterpart: /libraries/libcu-plus-plus-synchronization/solutions/
factCheckDate: '2026-09-05'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: L05-SOLUTIONS
prerequisites:
  - L05-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l05-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/libcu-plus-plus-synchronization/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-05' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L05-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/libcu-plus-plus-synchronization/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reference solutions for the [L05 Exercises](/en/libraries/libcu-plus-plus-synchronization/exercises/), under the [L05 v3.4.2 source contract](/en/libraries/libcu-plus-plus-synchronization/). They provide static proofs, not CUDA/C++ implementations, executions, observations, or performance results. All four evidence arrays remain empty and no Evidence Status is assigned. The facts and source review are aligned to **2026-09-05**.

## Solution 1: Two ownership transfers for a reusable payload

**Reviewed solution:** Choose explicit `cuda::thread_scope_block` for both flags because P and C are in one block. Use release publication and acquire observation. One valid representation is an atomic reference to each separately initialized, four-byte-aligned, padding-free 32-bit integer. The original objects outlive all references, every atomic access, and the final acknowledgement. Initialization is visible before references are used; no ordinary access to either flag occurs while those references are in use. Owning `cuda::atomic` objects are another representation, not a change to the proof.

| Object | Accessors and ownership | Scope/order or lifetime requirement |
| --- | --- | --- |
| Non-atomic payload | P writes; C reads only after publication | Valid accessible storage, no overwrite until C's last read is acknowledged |
| Ready generation | P publishes; C observes | Same block scope; release store and acquire load reading that store |
| Acknowledged generation | C publishes; P observes | Same block scope; release store after the last read, acquire before reuse |

For generation 1, P writes the payload, then release-stores ready generation 1. C may consume only when its acquire reads that publication. The payload write is sequenced before P's release, that release synchronizes with C's matching acquire, and the acquire is sequenced before C's payload read. Thus the write happens before the read. An acquire of the initial zero establishes none of this permission.

After its last generation-1 read, C release-stores acknowledgement 1. P must acquire that acknowledgement before writing generation 2. The last read is sequenced before C's release; P's matching acquire is sequenced before the next write. This reverse chain orders consumption before overwrite. P then release-stores ready generation 2, C acquires that specific publication, consumes, and release-stores acknowledgement 2. P observes acknowledgement 2 before ending the exchange or reclaiming the payload.

For exactly these two generations, initialize both counters to zero and use distinct values 1 and 2 without wraparound. Only P writes ready and only C writes acknowledgement. Do not publish generation 2 until acknowledgement 1 is observed, and do not accept value 1 as generation 2. Those restrictions exclude an old numeric value from authorizing the next exchange. A long-running wrapping counter or more producers/consumers needs a new proof; this two-generation answer does not solve those protocols automatically.

| Mutation | Verdict and repair |
| --- | --- |
| Relaxed flag operations in one block | Insufficient. They keep flag accesses atomic but do not supply the payload publication edge. Use the matching release/acquire relationship, or a different documented handoff. |
| Block-scoped sequential consistency across blocks | Insufficient scope. For the stated same-device, same-domain case, use consistent device scope and the publication proof. This still grants no cross-block residency or progress assumption. |
| Device-scoped acquire reads initial zero | No payload permission. Defer consumption until the acquire reads the required generation's release publication. An acquire label alone is not a reads-from relationship. |
| System scope with unknown allocation atomic support | Unresolved, not accepted. Establish allocation/device support and compatible atomic access by every CPU/GPU participant, or replace direct sharing with explicit completed transfers and execution boundaries. |

A release load and an acquire store are invalid memory-order choices. A plain load also cannot use acquire-release; a plain store cannot use consume or acquire-release. The scope defaults to system for both atomic forms in this pin, but this answer deliberately specifies block scope. None of the chains proves a polling loop will terminate. A supported scope, a legal memory order, and a schedulable protocol remain independent requirements.

## Solution 2: Four arrivals now, three in every following phase

**Reviewed solution:** Reserve one barrier and one tile, let one initializer establish expected count four, then have all four threads cross an independent initialization-visibility boundary before using the barrier. Shared declaration is not initialization, and waiting on the uninitialized barrier cannot perform that boundary. Keep the barrier alive through every arrival and wait.

For each ready phase, A finishes writing before arriving. B and C can arrive before their reads but must wait before reading. For each consumed phase, B and C arrive only after their final read; A arrives and waits to regain overwrite permission. Each ordinary arrival contributes one. D contributes once using `arrive_and_drop` during ready-0 and takes no later part.

| Phase | Expected count and contributions | Next expected count | Authorized access and reuse |
| --- | --- | --- | --- |
| ready-0 | 4: A, B, C arrive; D contributes the fourth via drop | 3 | After their waits, B/C may read tile 0. A still cannot overwrite. |
| consumed-0 | 3: A arrives; B/C arrive after their last tile-0 reads | 3 | After A's wait completes, A may overwrite with tile 1. |
| ready-1 | 3: A arrives after writing tile 1; B/C arrive | 3 | After their waits, B/C may read tile 1. No early overwrite. |
| consumed-1 | 3: A arrives; B/C arrive after their last tile-1 reads | 3 | Payload access is finished after the corresponding waits; reclaim the barrier only after all users/waits finish. |

The count becomes three by the drop's future-phase effect. It is not manually reinitialized at the tile boundary. D's drop contributes to the current total of four; skipping D's arrival leaves ready-0 incomplete. D cannot reappear in a phase that expects only A/B/C. The barrier's next expected count remaining three after consumed-1 is harmless if no further phase is entered and destruction waits for all users to finish; no artificial extra arrivals are needed to end a completed protocol.

A counterexample to the flawed reuse rule is enough: all required arrivals complete ready-0; A returns from its wait; B is delayed before reading; A writes tile 1 over the buffer; B then reads. The ready phase authorized B to begin reading tile 0 but never established that B had finished. The consumed phase fixes this by putting B's final read before its arrival and A's overwrite after the corresponding wait. The same reasoning applies to C.

The flawed reset is also unnecessary and unsafe if any participant still uses the existing phase/token. Reinitialization is not the ordinary phase-transition operation; the current barrier already manages future counts. These four phases are a written ordering proof, not an executed schedule. There is no async-copy completion contribution to count in this exercise, because A performs ordinary synchronous writes.

## Solution 3: Separate eligibility, dispatch, and ownership

**Reviewed solution:** Evaluate the compilation coordinate before choosing a copy acceleration path. C++17 uses CCCL's general GCC 7 / Clang 7 lower bounds. C++20 raises those to GCC 10 / Clang 11. The selected 12.9 lane's NVCC limits end at GCC 14 / Clang 19; the selected 13.3 lane's end at GCC 15 / Clang 21. NVCC admitting GCC 6 does not override CCCL's higher minimum.

| Candidate | Verdict under the stated packet |
| --- | --- |
| A: 12.9.2, GCC 6, C++17, SM75 | Reject: below the selected CCCL GCC 7 minimum, even though it is inside NVCC's host range. |
| B: 12.9.2, GCC 9, C++20, SM80 | Reject: C++20 requires GCC 10 or newer. A newer GPU cannot fix the compiler dialect boundary. |
| C: 12.9.2, GCC 10, C++20, SM75 | Meets the stated numeric compiler/dialect/target policy intersection for semantic fallback review. Still check the exact installed toolchain, headers, and OS configuration; this is not a successful build or an accelerated-copy claim. |
| D: 13.3.1, GCC 14, C++20, SM80 | Numeric bounds fit, but the packet is conditional: establish that selected v3.4.2 is not older than the Toolkit's bundled CCCL. Eligible hardware alone supplies neither that check nor execution evidence. |
| E: 13.3.1, GCC 14, C++23, SM90 | Reject from this selected C++17/C++20 contract. EX10's narrow GCC 14 C++23 probe does not establish libcu++ support; SM90 does not authorize TMA APIs here. |
| F: 11.8.0, GCC 11, C++17, SM75 | Reject the selected v3.4.2 combination. An older bundled libcu++ or simpler fallback must undergo a separate source/API review; it does not inherit L05. |

The tag's `13.X` alias selects 13.2, not 13.3; `12.X` selects 12.9. Neither configured owner coverage nor the v3.4.2 release supplies a local test result. Native Linux remains the site environment boundary. CUDA 12.x's latest-patch policy and CUDA 13.x's bundled-version floor must be checked separately from the compiler intervals.

For alignment, a 16-byte-aligned base plus offset 4 has remainder 4 modulo 16. Offset 104 has remainder 8, and byte count 100 has remainder 4. Thus **both copies fail both address and size requirements** for `cuda::aligned_size_t<16>`. Equal source/destination offsets do not help: both actual addresses fail. No automatic padding or address repair is promised by the proof type.

The destination intervals are `[4,104)` and `[104,204)`, which do not overlap and fit in each 208-byte stage buffer. The source is a separate valid allocation. Retain these nongroup copies: P0 and P1 each issue its assigned range exactly once. Do not have all eight threads issue both ranges. If switching to a group overload, declare a valid cooperative-copy group and have all its members invoke with identical arguments; the existing two-producer issue path is not an eight-member group invocation.

Use a suitable ordinary-size `cuda::memcpy_async` overload bound to the pipeline, allowing a supported fallback. Its contract still needs copy completion and lifetime tracking. Alternatively, deliberately use synchronous per-producer copies with explicit all-participant ready and consumed handoffs. For this data, a smaller alignment proof of four would also be arithmetically true, but only after selecting a matching supported overload; it gives no SM75 `cp.async` promise.

Construct the shared-state pipeline collectively over the eight members, using the same state, two stages, and producer count two. All agree on which two members are producers and which six are consumers. Shared state outlives every pipeline object using it. Reconverge the relevant producer warp participants before `producer_commit`; do not turn consumer-only members into required callers of producer operations. Construction participation, role-specific stage participation, and cooperative-copy participation are three different sets to audit.

| Stage instance | Producer and source obligations | Consumer and destination obligations |
| --- | --- | --- |
| Generation 0 in slot 0 | Both producers `producer_acquire`, issue their disjoint copies, then commit; source remains stable until its copy work completes | All six consumers `consumer_wait` before reading the completed payload and `consumer_release` after their own last read |
| Generation 1 in slot 1 | Same protocol, independent destination storage; preserve source validity for all outstanding reads | Consume in pipeline FIFO order; do not release slot 1 merely because slot 0 completed |
| A later generation wrapping to slot 0 | A new acquire must establish that slot 0 is reusable after required consumer releases | No consumer from generation 0 may still read slot 0 when producers overwrite it |
| Shutdown | Stop admitting new work and account for every outstanding copy and producer obligation | Finish authorized reads and required releases; end all pipeline-object use before reclaiming shared state or buffers |

`producer_commit` submits work; it is not a completed-data receipt. `consumer_wait` establishes readiness; it does not mean the consumer has finished its following reads. `consumer_release` transfers ownership only after those reads. `quit` releases pipeline ownership, but does not drain or cancel outstanding work and cannot repair a missing arrival. A participant's quit therefore cannot justify the proposal's immediate free.

SM75 meets the selected GPU floor and the SM70+ barrier/pipeline API floor, but not SM80's eligible global-to-shared `cp.async` path. SM80 still needs address-space and copy preconditions; it does not establish emitted instructions or overlap. SM90's optional TMA path is outside this exercise. A synchronous fallback retains ready/reuse boundaries. GCC-only availability of all barrier-bound copy overloads is not implied by the host/device namespace: the exact tagged definitions have CUDA-compilation guards. No candidate has measured speed, timing, or execution evidence in this packet.

## Valid alternatives

- For one-shot publication, owning scoped atomics avoid borrowing a pre-existing object. They retain initialization, scope, reads-from, lifetime, and payload ownership obligations.
- Ordered kernel phases and explicit completed transfers can replace cross-block or CPU/GPU flag exchange when those execution boundaries meet the application requirement. They avoid inventing an arbitrary grid spin barrier, not the need to order producer and consumer work.
- If D will return, keep a participation plan that includes D's required arrivals rather than treating `arrive_and_drop` as a temporary absence. A distinct barrier or changed group can be introduced only at a separately proven quiescent boundary.
- Ready and consumed handoffs may use two explicitly initialized barriers instead of alternating phases of one, provided each has correct participants, lifetime, and generation accounting. The one-barrier four-phase answer is the smaller protocol for this exercise.
- A synchronous two-producer copy with all required threads crossing ready and consumed block boundaries is a valid simpler design. It must not quietly omit the six consumers or free shared storage early.
- A smaller truthful alignment proof, an ordinary-size copy, or a separately reviewed older-library fallback may be appropriate. None is a shortcut to broader dialect support or measured acceleration.

## Common errors

- Treating host `std`, the incomplete `cuda::std` surface, and `cuda::` extensions as interchangeable namespaces with identical compilation-mode availability.
- Crediting a relaxed flag, an acquire of the initial value, or a standalone fence with a missing payload publication edge.
- Assuming sequential consistency repairs narrow scope, system scope proves allocation atomic support, or either forces producer progress.
- Reusing generation values without an ownership proof, destroying referenced objects too early, or racing ordinary accesses against `atomic_ref` operations.
- Counting drop only against the current expected count, skipping its current arrival, or rejoining without restoring a valid participation protocol.
- Reading after arrival but before wait, or overwriting after a ready wait without a consumed boundary.
- Treating `aligned_size_t` as a rounding request, duplicating nongroup copies across threads, or satisfying an eight-member cooperative copy with only two callers.
- Deleting wait/release for synchronous dispatch, confusing commit with completion, or using `quit` as drain, cancellation, or missing-arrival repair.
- Upgrading upstream tests, a CI alias, EX10, or an architecture name into L05 compilation, execution, instruction-selection, or performance claims.

Reviewed: **2026-09-05**. Return to [PB-R4-005](/en/practice/#pb-r4-005) and [PB-R4-006](/en/practice/#pb-r4-006) for another static audit. All four evidence arrays remain empty.
