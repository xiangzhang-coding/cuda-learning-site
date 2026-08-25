---
title: 'O06 Exercises: Classify Performance Language and Intensity Bounds'
description: Use two exercises to classify architecture claims and calculate an intensity bound without presenting it as measurement.
pairId: o06-exercises
counterpart: /start/architecture-refresher/exercises/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - next
resourceKind: exercise-set
unitId: O06-EXERCISES
prerequisites:
  - O06
relatedUnits:
  - O06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o06-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O06 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O06 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/architecture-refresher/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [O06: Architecture Refresher: Rate, Delay, and Data Movement](/en/start/architecture-refresher/) first so latency, throughput, bandwidth, concurrency, and arithmetic-intensity boundaries are available. Both Exercises use hypothetical inputs, require no GPU, and produce no runtime evidence.

## How to answer

Submit complete reasoning before opening hints in order. Every conclusion must state its object, path, time, or unit boundary. Do not rewrite potential behavior as observed behavior. This page contains no answers; open the separate [reviewed solutions](/en/start/architecture-refresher/solutions/) only after finishing.

## Exercise 1: Classify and repair architecture claims

**Goal:** Assign each of the eight claims below to the primary category latency, throughput, bandwidth, or concurrency. Mark it accurate, inaccurate, or partly accurate, then rewrite every incomplete claim.

**Claims to review:**

A. "One request starts at `t0` and finishes at `t1`, so `t1 - t0` describes that request's latency."

B. "A service completes `N` items during interval `delta_t`, so `N / delta_t` is the service's latency."

C. "A `GB/s` unit makes a bandwidth claim complete. Path and direction are unnecessary, and theoretical, effective, and actual bandwidth are interchangeable."

D. "When one warp waits for memory, the scheduler can issue a ready warp. This may hide the wait's effect on aggregate progress, but it does not shorten the waiting memory operation's latency."

E. "Four resident blocks on one SM prove that four kernels are executing concurrently."

F. "Higher occupancy always means higher throughput and a shorter runtime."

G. "Putting two kernels and one copy in two non-default streams guarantees that all three overlap in time."

H. "If the CPU prepares the next input batch while the GPU executes the current kernel, CPU/GPU overlap exists even when the GPU has only one active kernel."

**Constraints:** Select one primary category per claim, though a repair may identify related concepts. A bandwidth repair must state endpoints, direction, byte/time units, and bandwidth type. A concurrency repair must distinguish eligibility, submission, residency, and observed overlap. Add no profiler result.

**Expected evidence:** Eight review records, each containing a primary category, judgment, reason, and precise rewrite.

**Acceptance criteria:** Latency and rate are not conflated; ready-warp reasoning does not claim lower memory latency; the three bandwidth conventions are not interchangeable; resident blocks, occupancy, kernels, streams, copy/compute overlap, and CPU/GPU overlap remain separate; every "did overlap" claim requires a timeline or equivalent observation.

<details><summary>Hint 1</summary>First identify each statement's numerator, denominator, single-event boundary, or simultaneously present work.</details>

<details><summary>Hint 2</summary>Use a fixed bandwidth template: "in this direction, across this endpoint-to-endpoint path, divide this byte convention by this interval, in these units."</details>

<details><summary>Hint 3</summary>For concurrency, ask in order whether work was merely submitted, became eligible to overlap, became resident, or has a time intersection visible in a timeline.</details>

## Exercise 2: Calculate and scope an intensity bound

**Goal:** Calculate an arithmetic-intensity model from explicitly supplied operations and DRAM bytes, then explain the memory-bound upper limit it can support.

**Given model inputs:** One hypothetical steady-state work unit performs `96` arithmetic operations under the prompt's counting convention. Across the declared `device DRAM <-> SM` path, it reads `32 bytes` from DRAM and writes `16 bytes` to DRAM. Let the bandwidth ceiling for that same path be `B_DRAM bytes/s` and the compute ceiling be `P_compute operations/s`. These are stipulated model inputs, not profiler measurements.

**Task:** Find total DRAM traffic, then calculate `I = operations / DRAM bytes`. Derive the memory-side bound `P_memory <= I * B_DRAM` and the complete simplified bound `P <= min(P_compute, I * B_DRAM)`. Finally, state the condition under which the model is memory-bound and list at least four facts that cannot be inferred from the result.

**Constraints:** Run no code. Add no cache, shared-memory, or host/device traffic. Do not change the supplied operation-count convention. Invent no `B_DRAM`, `P_compute`, time, achieved rate, or speedup. State the DRAM path and units in the conclusion.

**Expected evidence:** One unit-carrying calculation, one symbolic upper bound, one scoped memory-bound judgment, and a "not measurement" limitation list.

**Acceptance criteria:** Both read and write bytes enter the denominator; operations/byte is not confused with operations/s; memory-bound is used only when the memory-side ceiling lies below the compute ceiling; Roofline remains an upper bound rather than a prediction; no runtime or performance evidence is claimed.

<details><summary>Hint 1</summary>Add read and write bytes on the same DRAM path before handling the operation count.</details>

<details><summary>Hint 2</summary>After multiplying `operations / bytes` by `bytes / second`, inspect the remaining unit.</details>

<details><summary>Hint 3</summary>Compare the two symbolic ceilings without assigning numbers, then ask whether latency, parallelism, caches, launches, and end-to-end overhead are represented.</details>

## Next step

Finish both Exercises independently, then compare with the [reviewed solutions](/en/start/architecture-refresher/solutions/). [Practice Bank PB-R1-003](/en/practice/#pb-r1-003) places the same classifications in a longer performance-review record.
