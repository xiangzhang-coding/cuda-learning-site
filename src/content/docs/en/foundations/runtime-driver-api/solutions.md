---
title: 'F07 Reviewed Solutions: Runtime and Driver API Boundary Contracts'
description: Complete reviewed answers, valid alternatives, and common errors for the three F07 contract Exercises.
pairId: f07-solutions
counterpart: /foundations/runtime-driver-api/solutions/
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
unitId: F07-SOLUTIONS
prerequisites:
  - F07-EXERCISES
relatedUnits:
  - F07
  - EX04
  - VIS21
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
    attrs: { name: 'cuda:pair-id', content: f07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F07,EX04,VIS21' }
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

<a class="locale-pair" data-locale-counterpart href="/foundations/runtime-driver-api/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **reviewed solutions** for the [F07 Exercises](/en/foundations/runtime-driver-api/exercises/). Compare owner, precondition, valid-use, completion, and teardown boundaries before comparing concrete API names. Every answer below is a static contract, not a CUDA run record.

## Solution 1: Role and handle contract

**Scope:** Compare only EX04-style initialization/device, context, module/function, memory, launch, and completion/error roles. This does not cover the complete Runtime/Driver API and claims no one-to-one calls.

| Stage | Runtime owner and coordinates | Driver owner and coordinates | Shared invariant |
| --- | --- | --- | --- |
| Initialization/device | Runtime manages higher-level initialization as needed; the application selects a device ordinal and checks `cuda*` status | The application calls `cuInit(0)`, resolves an ordinal to `CUdevice`, and checks both `CUresult` values | Selecting a device establishes neither launch nor completion |
| Context | The common Runtime path uses a primary context as needed; the application must not treat shared context state as a private local resource | The application retains a primary context or creates/obtains `CUcontext`, then manages host-thread current state | Later objects must be created and used in an applicable context |
| Module/function | Runtime implicitly manages registered device code/modules; the application supplies a kernel symbol | The application loads `CUmodule`, obtains `CUfunction`, and assigns an owner for unload | Function validity cannot outlive its module/context |
| Memory | The application uses `cudaMalloc/cudaMemcpy/cudaFree` and owns pointer, byte count, direction, last use, and release | The application uses `cuMemAlloc/cuMemcpy*/cuMemFree` and owns the same ledger for `CUdeviceptr` | Release every acquired allocation exactly once after last use |
| Launch | The application supplies symbol, execution configuration, and arguments, then checks Runtime submission status | With valid `CUfunction` and context, the application supplies grid/block and a parameter array to `cuLaunchKernel` | Submission does not establish completion |
| Completion/error | The application checks `cudaError_t` and establishes a device/stream/event completion observation | The application checks every `CUresult` and establishes a context/stream/event completion observation | Both paths may expose deferred errors later; success is not correctness |

Both host APIs enter the CUDA driver stack, but the Runtime may compose several management actions behind one higher-level operation. The explicit Driver handle chain changes visible ownership; it does not prove that the Driver path is merely a line-by-line renaming of the Runtime path.

## Solution 2: Context ownership contract for mixed calls

One contract satisfying the task is:

1. A **process owner** records device and context policy before loading plug-ins. Without a policy, every plug-in is forbidden from issuing CUDA calls.
2. **Plug-in A** creates or retains its declared Driver context and owns the `CUcontext`. On failure, it neither loads a module nor calls the Runtime library.
3. **Current-thread rule:** before every Runtime-library crossing, A sets and checks the expected context on the host thread that will make the call. Failure stops the call and returns an error.
4. **Module/function owner:** A obtains `CUmodule` and `CUfunction`. The function is used only while module and context are valid; A unloads after final launch/completion.
5. **Allocation owner:** the component creating an allocation records context, byte count, last use, and release API. Another plug-in does not release it.
6. **Runtime-library precondition:** exact Lane documentation must permit the concrete Runtime call on the current Driver context, with exceptions checked individually. If unresolved, do not mix; use one API boundary instead.
7. **Plug-in B** uses the Runtime primary context assigned by process policy. B assumes no visibility into A's context, module, or allocation.
8. **Reset authority:** neither A nor B may use `cudaDeviceReset` as local cleanup. Only the process owner may tear down/reset after every client is quiescent, resources are released, and policy permits it.
9. **Error observation:** each submitter records its submission status and establishes a completion boundary for its declared context/stream/event scope. Failure blocks result-dependent work and enters owner cleanup.
10. **Version/type rule:** interchange a handle/type only when exact 11.8.0, the v12.9.1 pages at the 12.9.2 archive path, or 13.3.1 documentation permits it; otherwise preserve the boundary or perform the documented cast.
11. **Release order:** wait until last use completes, release allocations, stop using functions, unload modules, and only then release/destroy owned context state.
12. **Violation response:** fail closed on any unmet current-context, owner, version, or quiescence precondition. Preserve diagnostic context and do not continue to launch, reset, or teardown.

| Object/boundary | Owner | Required precondition | Last use and teardown |
| --- | --- | --- | --- |
| A's Driver context | Plug-in A under process policy | Current on the correct host thread | After all A work and context-bound objects complete/release |
| Runtime primary context | Process policy; shared by Runtime clients | Device/context selection follows Lane documentation | Only the process owner resets after all clients are quiescent |
| `CUmodule` / `CUfunction` | Plug-in A | A's context is current; load/get succeeded | Unload module after every function launch completes |
| Allocation | Creating component | Applicable context valid; size/direction checked | Release after the relevant copy/kernel last use completes |
| Completion boundary | Component submitting work | Context/stream/event scope named | Permit dependent results only on success; otherwise clean up |

## Solution 3: Asynchronous error observation contracts for both APIs

### Runtime timeline

```text
establish stale-status policy
→ submit through Runtime launch surface
→ check this submission boundary
  (for example cudaGetLastError under the declared policy)
→ establish the relevant device/stream/event completion boundary
→ only on success perform result-dependent copy-back
→ independently compare with host reference
→ release acquired resources
```

### Driver timeline

```text
validate current context and CUfunction
→ validate configuration and parameter storage
→ call cuLaunchKernel and check CUresult as the submission boundary
→ establish the declared context/stream/event completion boundary
→ only on success perform result-dependent copy-back
→ independently compare with host reference
→ release allocation and unload module
→ tear down owned context state
```

Both timelines attach an attribution caveat to returned statuses. When the exact API reference says that a call may also return an error from an earlier asynchronous launch, record “error observed here; cause may precede this call” instead of forcing the return location to be the cause.

| Original claim | Judgment | Correct contract |
| --- | --- | --- |
| Launch returned success, so work completed | False | Success passes only the checked submission boundary; a later completion observation remains necessary |
| Completion returned success, so the result is correct | False | It establishes completion/error scope; an independent host comparison still determines correctness |
| Driver API is explicit, so its launch is synchronous | False | Explicit handles do not change the host-asynchronous kernel-launch boundary |
| Driver needs only the `CUresult` from `cuLaunchKernel` | False | It must also check a later completion boundary for the declared scope |
| The paper contract makes EX04 Runtime-Verified | False | There is no GPU observation; Exercises and solutions change no evidence axis |

If submission or completion fails, normal flow must not copy or compare a result that was never established as valid. Cleanup releases only acquired resources and keeps module/context state alive until related work no longer uses it.

## Valid alternatives

- Replace Solution 1's matrix with a layered ownership graph if every required handle, owner, valid-use, release, and shared invariant remains reviewable.
- Let the process owner manage one primary context, or let A use a declared Driver-created context. Either approach must satisfy exact-version Runtime interoperation rules, and no plug-in may unilaterally reset shared state.
- Use a context, stream, or event primitive for Solution 3's Driver completion boundary. A valid answer names its scope and preserves submission/completion stages plus independent correctness comparison.

## Common errors

- Treating implicit Runtime context/module management as automatic release of every resource.
- Replacing `cuda` with `cu` while omitting the `CUdevice`, `CUcontext`, `CUmodule`, and `CUfunction` dependency chain.
- Assuming that shared use of the driver stack makes every call one-to-one.
- Calling the Runtime on the wrong host thread without checking which Driver context is current.
- Letting a plug-in clean up with `cudaDeviceReset`, destroying shared primary-context state used by another client.
- Treating launch success as completion, completion success as correctness, or a static contract as Runtime-Verified evidence.

Reviewed: **2026-08-26**. These solutions compile and execute no CUDA, produce no GPU observation, and copy no complete EX04 program.
