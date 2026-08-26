---
title: 'F05 Reviewed Solutions: Reconstruct Asynchronous Error Boundaries'
description: Separate reviewed solutions, valid alternatives, and common errors for the three F05 Exercises.
pairId: f05-solutions
counterpart: /foundations/asynchronous-errors/solutions/
factCheckDate: '2026-08-26'
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
unitId: F05-SOLUTIONS
prerequisites:
  - F05-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: f05-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F05-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F05-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/foundations/asynchronous-errors/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [F05 Exercises](/en/foundations/asynchronous-errors/exercises/). Compare whether each stage was reached, error origin, host observation, and state transition before comparing API names. The answers do not depend on one fixed error code.

## Solution 1: Infer two error timelines from observation points

A qualifying Trace A timeline is:

| Stage | Work state | Observation channel | Host knowledge | Next action |
| --- | --- | --- | --- | --- |
| Launch submission | Configuration is not accepted on the submission path | Last-error state after the launch expression | No executable launch was established | Query the launch boundary immediately |
| Immediate check | Failure becomes host-visible | `cudaGetLastError` or non-clearing `cudaPeekAtLastError` | The launch boundary failed; this is not a post-execution failure | Stop creating dependent work |
| Device execution | Not reached | No execution return | The kernel body did not execute | Skip dependent output |
| Synchronization | Not the first discovery point | Not used to repair a rejected launch | Waiting cannot create nonexistent work | Enter cleanup |
| Host-visible result | Launch failed | Saved diagnostic result | D2H/comparison has no prerequisite result | Return failure after cleanup |

A qualifying Trace B timeline is:

| Stage | Work state | Observation channel | Host knowledge | Next action |
| --- | --- | --- | --- | --- |
| Launch submission | Launch is accepted | Submission path | Device work can execute later; it has not completed | Check the launch boundary immediately |
| Immediate check | No new configuration failure is observed | Last-error getter | Only the currently visible launch boundary is covered | Reach a deliberate completion boundary |
| Device execution | Submitted work executes and encounters a problem | Device-side origin | The earlier host check could not predict this result | Wait for the relevant work |
| Synchronization | Failure becomes host-visible | Direct return from `cudaDeviceSynchronize` | A preceding requested device task failed | Do not run D2H/comparison |
| Host-visible result | Execution failed | Saved synchronization result | Output was not established as valid | Return failure after cleanup |

Trace A has origin and observation near the submission path, but they remain separate concepts. Trace B clearly separates the origin during device execution from the host observation at synchronization. APIs can also report errors from earlier asynchronous launches, so even adjacent positions need controlled state before attribution improves.

## Solution 2: Audit the strategy that does not isolate stale state

Given the exercise condition that no other new error changes the slot, the original flow has this essential ledger:

| Operation | State before | Observation | State after | Allowed conclusion / forbidden attribution |
| --- | --- | --- | --- | --- |
| First `cudaPeekAtLastError` | Stale error | Reads old state | Stale error remains | “An earlier error is unhandled”; never assign it to a future launch |
| Valid launch A | Stale error | Launch is submitted | A successful operation is not treated as an explicit clear | Do not say the slot was queued by launch |
| Second `cudaPeekAtLastError` | Stale error | Reads the current slot again | Stale error remains | Position alone cannot attribute it to A |
| Valid launch B | Stale error | A second work item is submitted | The getter still has not consumed the slot | The next getter is not guaranteed to belong to B |
| `cudaGetLastError` | Then-current state | Reads and consumes that state | Resets to `cudaSuccess` | “The current slot was consumed”; position alone cannot attribute it to B |
| `cudaDeviceSynchronize` | Last-error slot is clear; A/B may await completion | Returns its synchronization result directly | The direct return needs separate handling | It reports a wait result for preceding tasks; preserve the previous-asynchronous-error caveat |

One reviewable repair is:

1. Call `cudaGetLastError` before the target interval and handle any existing state as a real error. Stop on failure instead of silently clearing and continuing.
2. Immediately retrieve and consume launch A's launch boundary. Enter cleanup if that check fails.
3. If an execution conclusion for A is required, establish and directly check a deliberate synchronization boundary. Stop dependent operations on failure.
4. Before B, confirm and handle current last-error state again so B's interval has an explicit start.
5. Check and consume B's launch boundary immediately after launch B. When an execution conclusion is needed, directly check the synchronization return established for B.
6. Record each result as “observed at this boundary,” not as an unproved unique origin.

Production code may choose a different synchronization granularity for performance and concurrency. This Exercise requires diagnostic isolation; it does not prescribe permanent device-wide synchronization after every launch.

## Solution 3: Design the LAB03 observation and evidence contract

A minimum qualifying observation matrix is:

| Field | Launch-configuration scenario | Deferred-execution scenario |
| --- | --- | --- |
| Preflight | Record whether existing state was handled | Record the same; do not assume clean state |
| Expected origin | Submission/configuration path | Accepted work during device execution |
| Immediate check | Expect a launch-boundary failure without fixing one code | Expect no new configuration failure; this is not execution success |
| Kernel body | Expected not reached | Expected reached and to trigger the controlled failure condition |
| Synchronization direct return | Not the first expected discovery point | Expected to expose deferred failure without fixing one code |
| D2H/comparison | Skip | Skip after synchronization failure |
| Cleanup/process result | Release acquired resources and report failure | Release acquired resources and report failure |

The Environment Manifest records GPU, compute capability, GPU count, driver, Toolkit, compiler, OS, command, source commit, time, and any measurement condition needed for interpretation. The acceptance checklist confirms at least: source matches the declared commit; both scenarios ran separately; each direct return was recorded; origin and observation use separate fields; no dependent output was consumed after failure; cleanup completed; and no error check became a numerical-correctness or performance inference.

The three report templates narrow claims as follows:

| Report type | Required material | Allowed status/claim | Forbidden upgrade |
| --- | --- | --- | --- |
| Not run | Prediction and empty recorded-observation fields | “No runtime observation”; preserve the declared EX04/LAB03 status | Do not infer execution from F05, the browser model, or source review |
| Community-Observed | Complete Environment Manifest, command, log, and acceptance review | Record Community-Observed only for the executable subject actually observed; it can coexist with Pending Hardware Verification | Do not call it Reference Environment Runtime-Verified |
| Runtime-Verified | Maintainer-controlled Reference Environment, complete log, every criterion met | Record Runtime-Verified only for the qualifying EX04/LAB03 subject | Do not copy status to F05 or another subject that did not run |

The exercise provides no actual log, so this solution defines expected observations only, leaves recorded observations empty, and changes no existing EX04 or LAB03 claim. F05 and ErrorTimeline still have no CUDA Evidence Status.

## Valid alternatives

- Draw the five-stage timeline as a sequence diagram if launch submission, immediate check, device execution, synchronization, and host-visible result all retain complete textual equivalents.
- Use `cudaPeekAtLastError` for non-consuming observation, provided the design states who later consumes or deliberately retains state. Stale state cannot drift indefinitely without ownership.
- Synchronize after each launch or after a clearly owned work group. The report must define the wait scope and must not relabel the immediate check as completion.
- Store the LAB03 record as JSON, a Markdown table, or structured logs if the Environment Manifest, expected/recorded observations, criteria, and subject-specific status remain reviewable.

## Common errors

- Assuming that because kernel launches are asynchronous with respect to the host, launch configuration can never report immediately.
- Treating `cudaPeekAtLastError` as a reset, or treating a successful API call as equivalent to an explicit `cudaGetLastError` clear.
- Modeling last-error state as a FIFO per kernel instead of host-thread / Runtime-instance state.
- Claiming the kernel body completed or output is correct because the immediate check reported no failure.
- Calling only `cudaGetLastError` without establishing and checking a synchronization boundary for deferred execution.
- Blaming the API source line that returns an earlier asynchronous error without further isolation.
- Continuing to D2H/comparison after synchronization failure and consuming output not established as valid.
- Recording F05 static content, ErrorTimeline, or its unit test as EX04/LAB03 GPU runtime evidence.

Reviewed: **2026-08-26**. These solutions execute no CUDA, record no error code or performance result, and add no Evidence Status to F05, ErrorTimeline, EX04, or LAB03.
