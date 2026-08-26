---
title: 'F04 Reviewed Solutions: Review an Explicit Host-Device Lifecycle'
description: Separate reviewed solutions, valid alternatives, and common errors for the three F04 Exercises.
pairId: f04-solutions
counterpart: /foundations/host-device-lifecycle/solutions/
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
unitId: F04-SOLUTIONS
prerequisites:
  - F04-EXERCISES
relatedUnits:
  - F04
  - O04
  - EX03
exampleIds:
  - EX03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f04-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F04-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F04,O04,EX03' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/host-device-lifecycle/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [F04 Exercises](/en/foundations/host-device-lifecycle/exercises/). Compare ownership, state-transition, and last-use reasoning before comparing the final order.

## Solution 1: Reconstruct order and last-use boundaries

The essential rows of a qualifying ledger are:

| Order | Action | Key state transition | Last use / cleanup |
| ---: | --- | --- | --- |
| 1 | Initialize host data | Host inputs/reference become readable | Host input may still be read by comparison |
| 2 | Allocate device buffers | Each successful allocation moves from unacquired to acquired; contents remain uninitialized | Add one release obligation |
| 3 | H2D transfer | Device inputs become usable by this launch | Keep them live until kernel completion |
| 4 | Kernel launch | Device work is submitted | Keep every device buffer live |
| 5 | `cudaGetLastError` | Launch boundary is checked | Completion is not established |
| 6 | `cudaDeviceSynchronize` | Success means device work completed | Device-input last use ends |
| 7 | D2H copy-back | Host output becomes a readable candidate result | Device-output last use ends |
| 8 | Host comparison | Save a pass/fail verdict | This use of host output/reference ends |
| 9 | Release | Acquired device allocations move to released one by one | Return the saved verdict after cleanup |

A C++ host owner manages a host input/container; a device pointer value is a handle stored on the host; a device allocation is a separate CUDA resource; and host output is not this run's GPU result before successful D2H. `cudaMalloc` acquires storage but does not populate its contents.

## Solution 2: Design cleanup that is safe after partial failure

One qualifying plan maintains `unacquired → acquired → released` states:

1. Mark allocation 1 acquired after success, then do the same for allocation 2.
2. When allocation 3 fails, execute no H2D, launch, synchronization, D2H, or comparison; enter cleanup directly.
3. Cleanup inspects state in reverse order, releases only allocations 2 and 1, and marks them released. Allocation 3 remains unacquired.
4. The success path proceeds through H2D, launch, `cudaGetLastError`, `cudaDeviceSynchronize`, D2H, and comparison.
5. Comparison stores the verdict in a host variable instead of returning. Control then reaches the same cleanup, releases all three acquired allocations, and returns the verdict.

If launch checking or synchronization fails, D2H and comparison have not met their preconditions, so skip them and clean up. If D2H fails, likewise do not compare host output. Every path consumes only states already established as valid.

## Solution 3: Repair out-of-bounds evidence claims

| Original claim | Actual evidence | Allowed claim | Forbidden inference |
| --- | --- | --- | --- |
| Host-only tests passed | The declared host reference/comparator/helper passed on the host | That host contract passed | The GPU kernel executed or produced correct results |
| Source compiled | With a qualifying record, only declared build stages succeeded | Compile-Checked may apply to the specific EX03 build subject | Runtime-Verified or any GPU output |
| Static table shows the order | The original HTML teaching composition can be read | It expresses F04's deterministic order model | The listed APIs executed, were timed, or succeeded |

The packet has no actual GPU observation, so EX03 runtime remains **Pending Hardware Verification**. The F04 Learning Unit is not an executable subject; its compilation and runtime evidence axes remain empty. Neither subject's status can be copied to the other.

## Valid alternatives

- Draw the lifecycle ledger as a state machine, provided action order, owner, last use, and cleanup obligation remain reviewable in text.
- Use either one cleanup block or an explicit RAII owner from the O04 refresher. Both must release only acquired allocations and prevent a mismatch return from skipping destruction or error review.
- Represent the verdict as a boolean, enum, or structured comparison report. Save it first, clean up second, and return last.
- Expand the failure table by API or group it into acquisition, launch, completion, copy, and verification stages. Never merge compilation and runtime evidence.

## Common errors

- Assuming `cudaMalloc` zeroes device memory, or that copying a device pointer copies its allocation.
- Failing to initialize host input before H2D, or reversing H2D and D2H directions.
- Calling only `cudaGetLastError` and starting blocking D2H without saying where completion/errors surface. The canonical flow keeps an explicit synchronization as a separate diagnostic boundary, while synchronous D2H also waits for relevant work.
- Comparing host output before D2H, or treating successful copy-back as a correctness verdict.
- Releasing device input before kernel completion, or device output before D2H completion.
- Returning immediately on a comparison mismatch and leaking successfully acquired allocations.
- Recording a host-only test, Compile-Checked, or a static teaching table as a GPU runtime observation.

Reviewed: **2026-08-26**. These solutions execute no CUDA, do not change EX03's Pending Hardware Verification, and add no Evidence Status to the F04 Learning Unit.
