---
title: 'F07 Exercises: Write Runtime and Driver API Boundary Contracts'
description: Review API roles, context-interoperation ownership, and asynchronous error observation points through three contract tasks.
pairId: f07-exercises
counterpart: /foundations/runtime-driver-api/exercises/
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
unitId: F07-EXERCISES
prerequisites:
  - F07
relatedUnits:
  - F07
  - EX04
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
    attrs: { name: 'cuda:pair-id', content: f07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F07,EX04' }
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

<a class="locale-pair" data-locale-counterpart href="/foundations/runtime-driver-api/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F07: Distinguish CUDA Runtime API and Driver API Roles](/en/foundations/runtime-driver-api/) first. All three Exercises produce reviewable contracts rather than another complete CUDA program. They require no GPU and create no compilation or runtime evidence.

## How to answer

For each task, write subject, owner, acquisition/precondition, valid-use boundary, completion/error observation, and release/teardown before opening hints. An API name supports only its version-scoped local fact; do not infer performance or one-to-one mapping from a prefix. Solutions are on the separate [reviewed-solutions page](/en/foundations/runtime-driver-api/solutions/).

## Exercise 1: Establish a role and handle contract

A design review supplies two **incomplete role sketches**:

```text
Runtime path:
  select device → allocate/copy → launch symbol
  → check submission → observe completion → release
Driver path:
  initialize → get device → establish current context
  → load module/get function → allocate/copy → launch function
  → observe completion → release/unload/teardown
```

**Goal:** Write a six-stage role contract for initialization/device, context, module/function, memory, launch, and completion/error. For every row, list the Runtime owner, Driver owner, representative `cuda*` / `cu*` calls or handles, and the invariant shared by both paths.

**Constraints:** The Driver column must include `cuInit`, `CUdevice`, `CUcontext`, `CUmodule`, `CUfunction`, `CUdeviceptr`, `cuLaunchKernel`, and `CUresult`. The Runtime column must acknowledge implicit primary-context/module management while retaining allocation, transfer, launch-argument, completion, and release duties. Claim no call-by-call mapping and write no complete program.

**Expected evidence:** A six-row matrix plus one scope statement saying that it covers only an EX04-style lifecycle role comparison, not the complete API surface.

**Acceptance criteria:** Every handle has an acquisition, valid-use, and release or teardown owner; the Runtime is not “everything automatic”; the Driver is not “only different prefixes”; both paths reach the driver stack; no performance conclusion or CUDA execution claim appears.

<details><summary>Hint 1</summary>Separate “who creates this state?” from “who must still check or release this resource?” Implicit context management does not imply implicit buffer ownership.</details>

<details><summary>Hint 2</summary>The Driver dependency chain is initialize → device → context → module → function → launch. A memory resource must also remain valid within its applicable context and last-use boundary.</details>

## Exercise 2: Write a context ownership contract for mixed calls

Assume a host application loads two plug-ins. Plug-in A uses the Driver API to establish a context, load a module, and obtain a function; it then calls a library that internally uses the Runtime API. Plug-in B uses the default Runtime path in the same process. The old design allows either plug-in to call `cudaDeviceReset` after “finishing its own work” and records no current context for the host thread.

**Goal:** Rewrite the design as an interoperability contract with at least eight clauses covering context creator/retainer, current-context thread rule, allocation/module/function owner, library-call precondition, reset/teardown authority, error observation, release order, and exact-version exception review.

**Constraints:** Do not assume that Plug-in A's Runtime library call necessarily uses the intended context. Do not let A or B unilaterally reset a shared primary context. Distinguish a Driver-created context from the Runtime primary context. Treat a data type as interchangeable only when the selected 11.8.0, 12.9.2 archive (page labeled 12.9.1), or 13.3.1 documentation says so. “The APIs interoperate” cannot replace concrete owner clauses.

**Expected evidence:** A numbered contract and an owner table containing at least `context`, `module/function`, `allocation`, `completion boundary`, and `reset/teardown`; every clause includes a violation response.

**Acceptance criteria:** The current context is reviewable before calling the Runtime library; every context-bound object has an owner; reset is not local cleanup; teardown follows last use; version exceptions are reviewed individually; an unmet precondition stops the cross-boundary call instead of guessing.

<details><summary>Hint 1</summary>Treat the host thread as a contract coordinate: which context is current on the thread where the call actually occurs?</details>

<details><summary>Hint 2</summary>A primary context is process-shared state. Centralize reset authority in a process-level owner or forbid plug-ins from resetting it.</details>

## Exercise 3: Preserve asynchronous error boundaries for both APIs

Review a hypothetical diagnostic plan. Its Runtime path records only `cudaGetLastError`; its Driver path records only the `CUresult` returned by `cuLaunchKernel`. The author concludes: “Both launches returned success, so the kernels completed and their results are correct; the Driver path especially needs no later synchronization.”

**Goal:** Write separate Runtime and Driver error-observation contracts containing at least a pre-launch stale-status policy, submission check, completion observation point, returned-status attribution, copy-back/host-verification gate, and cleanup rule.

**Constraints:** Runtime and Driver must each retain a submission boundary and a later completion boundary. Driver completion may use an applicable context, stream, or event primitive, but its scope must be named. Preserve the attribution caveat wherever an API may report a prior asynchronous error. Success cannot become correctness or Runtime-Verified. Invent no log, device output, or timing.

**Expected evidence:** Two parallel timelines and a claim-review table rejecting at least “launch success = completion,” “completion success = correctness,” and “Driver API = synchronous.”

**Acceptance criteria:** Both timelines locate an observation point for deferred execution errors; result-dependent copy/verification begins only after the completion boundary succeeds; independent host comparison produces the correctness verdict; cleanup releases acquired resources; the paper contract changes no evidence axis.

<details><summary>Hint 1</summary>Separate “this submission,” “prior asynchronous work may be reported here,” and “this declared scope has completed” as three status meanings.</details>

<details><summary>Hint 2</summary>Synchronization establishes completion/error observation only for its declared scope; it does not replace an independent host-reference comparison.</details>

## Next step

Finish all three contracts before opening the [reviewed solutions](/en/foundations/runtime-driver-api/solutions/). Continue reviewing cross-API ownership in [Practice Bank PB-R1-011](/en/practice/#pb-r1-011), and use [EX04](/en/examples/error-handling-lifecycle/) only as related Runtime-lifecycle input rather than copying its complete implementation.
