---
title: 'F05 Exercises: Reconstruct Asynchronous Error Boundaries'
description: Use three deep Exercises to classify immediate and deferred errors, audit last-error state, and design a reviewable runtime record.
pairId: f05-exercises
counterpart: /foundations/asynchronous-errors/exercises/
factCheckDate: '2026-08-26'
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
unitId: F05-EXERCISES
prerequisites:
  - F05
relatedUnits:
  - F05
  - F03
  - EX04
  - LAB03
  - F07
exampleIds:
  - EX04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f05-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F05-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F05 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F05,F03,EX04,LAB03,F07' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX04 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/asynchronous-errors/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F05: CUDA Errors Are Often Asynchronous](/en/foundations/asynchronous-errors/) first. You should distinguish an API direct return, last-error state, launch submission, device execution, and a synchronization boundary. All three Exercises can be completed through static reasoning. Do not fill a runtime observation without a CUDA-capable system and an actual execution record.

## How to answer

Submit your timeline, state ledger, or observation contract before opening the two hint layers in order. When implementation boundaries need review, start from the [canonical EX04 project at the pinned commit](https://github.com/xiangzhang-coding/cuda-learning-site/tree/1bfe7b2d309db6d733471260c888262e59258660/examples/ex04-error-handling-lifecycle). Do not reconstruct a second program from this page. Complete answers live on the separate [reviewed-solutions page](/en/foundations/asynchronous-errors/solutions/).

## Exercise 1: Infer two error timelines from observation points

A review packet supplies two traces without exact error codes. Trace A: preflight last-error state was handled; the launch uses an execution configuration the Runtime does not accept; the check adjacent to the launch fails; no kernel body executes. Trace B: preflight state was handled; the launch is accepted; the immediate check observes no new launch failure; a problem occurs during device execution; explicit synchronization returns failure.

**Goal:** Draw one five-stage timeline for each trace. The fixed stages are launch submission, immediate check, device execution, synchronization, and host-visible result. Mark error origin and host observation separately.

**Constraints:** Do not name or guess exact error codes. Do not turn the immediate check into execution completion. Mark device execution not reached in Trace A, and do not mark launch submission failed in Trace B. Both paths must stop consuming dependent output after failure.

**Expected evidence:** Two five-row tables with at least stage, work state, last-error/direct-return channel, host knowledge, and next action columns, followed by two sentences explaining why observation point and cause location cannot collapse into one concept.

**Acceptance criteria:** Trace A first surfaces at the immediate check and skips device execution. Trace B originates during device execution and surfaces at synchronization. Both tables end in cleanup rather than D2H/comparison. No claim says every CUDA API is asynchronous or promises a fixed error code.

<details><summary>Hint 1</summary>First ask whether each stage was reached; do not begin with an error name. A rejected launch has no kernel body to wait for.</details>

<details><summary>Hint 2</summary>Trace B's immediate check can say only “no new launch-configuration failure was observed at this point,” not “the kernel succeeded.”</details>

## Exercise 2: Audit a retrieval policy that fails to isolate stale state

A review-only flow begins with one unconsumed last error and then performs: `cudaPeekAtLastError`, valid launch A, another `cudaPeekAtLastError`, valid launch B, `cudaGetLastError`, and `cudaDeviceSynchronize`. Its author attributes the second peek's failure to launch A and the get result to launch B.

**Goal:** Reconstruct whether last-error state is retained, can be overwritten by a new error, is consumed, or is independent of a direct return at every step, then rewrite the flow as a boundary policy that reviews launch A and launch B separately.

**Constraints:** Never describe `cudaPeekAtLastError` as clearing state. Do not silently ignore an old error retrieved by `cudaGetLastError`. Check the direct return from every synchronization call that returns `cudaError_t`. Preserve the official caveat that getters and other APIs may report errors from previous asynchronous launches. Do not infer completion from timing or sleep.

**Expected evidence:** A six-step state ledger with operation, state before, observation, state after, allowed attribution, and forbidden attribution columns, plus a repaired sequence grouped by boundaries that explains handling before and after each launch and at each synchronization return.

**Acceptance criteria:** The ledger shows that the first peek retains stale state, so the second peek cannot by itself be attributed to A. The later get consumes the then-current state but cannot be attributed to B from position alone. The repair handles old state, checks each launch adjacently, and adds and directly checks a deliberate synchronization boundary when an execution conclusion is required.

<details><summary>Hint 1</summary>Model last-error state as one slot per host thread / Runtime instance, not a FIFO queue indexed by launch.</details>

<details><summary>Hint 2</summary>A reviewable interval starts with “existing state handled” and ends with “the target work's synchronization return checked.” Do not mix another unmarked launch into that interval.</details>

## Exercise 3: Design an observation and evidence contract for LAB03

Design a record for future LAB03 use that observes the launch-configuration and deferred-execution scenarios from the same EX04 project. You currently have no Reference Environment log and cannot assume two Toolkit Lanes return the same error code or text.

**Goal:** Write a pre-run prediction, runtime record, and post-run decision contract that lets another learner judge error origin, host observation, cleanup, and correctness without over-granting Evidence Status.

**Constraints:** Reserve Environment Manifest fields for at least GPU, compute capability, driver, Toolkit, compiler, OS, command, and source commit. Record preflight, immediate check, synchronization direct return, whether D2H/comparison ran, and process result separately. Require no fixed error code. Invent no output, date, hardware, or performance. Do not list the browser ErrorTimeline as CUDA evidence.

**Expected evidence:** A two-scenario observation matrix, an acceptance checklist, and report templates for “not run,” “Community-Observed,” and “Runtime-Verified.” Every template identifies whether its subject is EX04, LAB03, or F05.

**Acceptance criteria:** The matrix distinguishes origin from observation. The configuration path does not claim that the kernel body executed, and the deferred path does not claim that the immediate check verified execution. Recorded observations remain empty without a real log. Only an actual GPU run in a Reference Environment that meets every acceptance criterion can support Runtime-Verified for the corresponding executable subject. No performance inference appears.

<details><summary>Hint 1</summary>Write expected observations before status. Expected observations define the acceptance contract; recorded observations can come only from a real run.</details>

<details><summary>Hint 2</summary>Evidence Status belongs to a specific subject. F05's static explanation, an EX04 executable run, and LAB03's guided procedure cannot share one status row.</details>

## Next step

Complete all three tasks before comparing them with the [reviewed solutions](/en/foundations/asynchronous-errors/solutions/). Then review a shorter record that deliberately mixes stale state and error attribution in [Practice Bank PB-R1-009](/en/practice/#pb-r1-009).
