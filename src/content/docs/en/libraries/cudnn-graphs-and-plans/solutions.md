---
title: 'L10 Solutions: A Surviving Candidate Is Not an Executed Plan'
description: Review tensor coordinates, independent candidate gates, cache invalidation, and numerical/timing protocols with valid alternatives and precise evidence limits.
pairId: l10-solutions
counterpart: /libraries/cudnn-graphs-and-plans/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L10-SOLUTIONS
prerequisites: [L10-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l10-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cudnn-graphs-and-plans/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-07' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L10-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cudnn-graphs-and-plans/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

Complete the [L10 Exercises](/en/libraries/cudnn-graphs-and-plans/exercises/) first. These answers use backend **9.24.0** and frontend **1.27.0**, commit `f77fbc3d21be3f24cd0286b9b368105f7c518b8a`, as reviewed in [L10](/en/libraries/cudnn-graphs-and-plans/), [SRC-CUDA-071](/en/sources-and-versions/#src-cuda-071), and [SRC-CUDA-072](/en/sources-and-versions/#src-cuda-072). All candidate data are hypothetical. No code was compiled, no owner test or GPU work ran, and all four evidence arrays are empty.

## Solution 1: Trace coordinates and ownership

The graph has three operations: 1x1 cross-correlation produces virtual T; addition of channel bias produces virtual U; ReLU produces observable Y. With no padding and unit stride/dilation, output height/width remain `2,3`, and the three filters give `K=3`. The mathematical intent is `Y[0,k,h,w] = ReLU(sum over c=0,1 of X[0,c,h,w]*W[k,c,0,0] + bias[0,k,0,0])`, with FP16 output storage. There is no old-Y contribution. Intermediate/compute FP32 and I/O FP16 are separate declarations.

The channel-fast element mapping is X offset `12*n+c+6*h+2*w`, W offset `2*k+c` for singleton R/S, bias offset `k`, and Y offset `18*n+k+9*h+3*w`. Therefore `X[0,1,0,2]` is element 5, byte 10; `Y[0,2,1,1]` is element 14, byte 28. Using packed NCHW for X would incorrectly read element 8 in the first check.

For positive strides, the logical storage span is `1 + sum((dimension-1)*stride)` elements. X, W, bias, and Y respectively require 12, 6, 3, and 18 FP16 elements, or **24, 12, 6, and 36 bytes** before any allocator padding/alignment overhead. These are tensor spans, not execution-workspace requirements. Stated dimensions/strides neither allocate storage nor prove an actual address is aligned for an engine.

Assign distinct tensor UIDs and bind the current X/W/bias/Y device buffers at execution. T and U remain internal virtual edges, not application outputs to bind. Keep observable Y nonvirtual. Prove separate input/output allocations, extents, actual address alignment, initialization-before-use, and completion-before-read/reuse/free. The execution workspace is separately queried and owned. Virtual intermediates do not promise a particular kernel count or no temporary storage.

A host reference reads the real FP16 values through an independently derived coordinate mapping, promotes them, accumulates the two products in FP64, adds the appropriate channel bias, and applies ReLU with FP16 output rounding accounted for. Choose finite, bounded, channel-distinct values and predeclare tolerances such as the criterion `abs(actual-reference) <= atol + rtol*abs(reference)`, with justified `atol,rtol` rather than an invented universal guarantee. Report nonfinite results explicitly. This is an accuracy reference, not a demand that FP32 device computation reproduce FP64 arithmetic bitwise.

Correct descriptions still need validation, candidate discovery, policy/support/build checks, legal actual buffers, execution completion, and numerical acceptance. This small shape is deliberately a coordinate exercise, not a claim that a fused engine supports it.

## Solution 2: Keep every gate independent

The constructed list yields these decisions:

| Candidate | Backend + frontend MiB | Decision |
| --- | --- | --- |
| C0 | `2 + 2 = 4` | Reject `NONDETERMINISTIC` even though memory fits |
| C1 | `9 + 2 = 11` | Backend 9 exceeds cap 8; total also exceeds budget |
| C2 | `7 + 2 = 9` | Backend 7 passes cap 8; total 9 exceeds budget 8 |
| C3 | `4 + 2 = 6` | Fits budget and actual allocation; stipulated build failure still rejects this attempt |
| C4 | `5 + 2 = 7` | Fits budget 8, exceeds allocation 6; support/build remain unattempted |

C4 is **not an observed success**, a selected engine, or a measured winner. It requires a permitted actual allocation of at least 7 MiB, successful support/build, a successful checked total-size query for the plan, valid bindings/lifetimes, completion, and independent numerical acceptance. The table's supplied sizes do not grant a real query or built plan. A failed checked query cannot be replaced by assuming zero workspace.

The staged process is `validate -> build_operation_graph -> create_execution_plans -> application filters -> check_support -> build_plans`, checking errors at each stage. Discovery collects configurations; numerical/behavior and backend workspace filters constrain them. At the selected backend pin, `check_support` stops at an acceptable configuration. Its success does not certify the entire list, nor prevent the stipulated C3 build failure. `HEURISTICS_CHOICE` stops at the first successful build; `ALL` continues attempting candidates. Neither measures or numerically validates them, and this implementation rejects multithreaded builds.

If C4 is investigated, establish allocation success and capacity rather than just changing a preference. Preserve memory headroom outside the scratch budget. Do not free or repurpose the old allocation while prior work uses it, and do not let unordered executions share writable scratch. Once a plan exists, check the error-returning total-workspace query, not only the backend cap. Building plans first does not authorize execution with inadequate storage.

For an empty list, do not read entry zero. Record the graph, versions, policies, and stage diagnostics. Try FALLBACK under unchanged semantics/policy, a separately validated decomposition, or report unsupported. FALLBACK promises neither an engine nor good performance. Do not remove bias or relax determinism/precision to manufacture a success. Execution or synchronization failure requires diagnosis and controlled cleanup, not blind continuation through the candidate list in a potentially failed device context.

Only after correctness acceptance would comparable cold/warm measurements be meaningful. A determinism filter is not an FP32-reference test, and `TENSOR_CORE` is not equivalent to `NONDETERMINISTIC`.

## Solution 3: Revalidate the artifact, then measure

The application graph/plan cache stores a built selection and application acceptance conditions. The default backend kernel cache stores compiled CUBINs per device ordinal, shared across handles/plans; its documented default is 100 MB with LRU. An explicit custom kernel cache stores the same kind of compiled-kernel resource under caller ownership but does not automatically inherit that capacity/eviction policy. Disabling the default does not disable an attached custom cache. None of these supplies a current numerical result or measured winner.

A conservative application key/record includes graph semantics and all operation attributes, tensor types/shapes/strides/alignment, numerical and workspace policy, exact frontend/backend/build identities, target hardware and relevant device properties. Keep driver/Toolkit and measurement conditions with the record. The graph hash is a useful component, not this whole record; dynamic graphs intentionally omit dimensions/strides from it.

| Independent change | Safe decision |
| --- | --- |
| Only same-contract input contents/pointers change | Reuse may be possible after checking current extents, alignment, device, aliasing, capacity, and lifetime; bind new pointers and still check execution/output |
| Budget 8 MiB becomes 6 MiB | Recorded total 7 MiB no longer qualifies, even if an old allocation remains large enough |
| Backend/build identity changes | Review the target contract and issues; conservatively rebuild/revalidate rather than infer artifact validity from API compatibility |
| Target hardware changes | Do not blindly restore an old-device plan; matching-hardware serialization rules and fresh target-device heuristics take precedence |
| Dynamic key matches after shape/stride overrides | A key hit is insufficient; establish override support and query total workspace for actual runtime shapes/strides before allocation; record backend 9.23.0 query gate |
| Serialize `NCHW_VECT_C` | Avoid the affected layout's serialization under the 9.24.0 known issue; do not generalize to every layout |

Graph JSON v2 reconstructs structure. Execution UBJSON stores the selected plan plus execution metadata and can omit structure with `serialize_structure=false`. Handle-based restoration reconstructs one plan, so an original nonzero selected index can become zero. It does not restore the original candidate list or turn the old index into a portable engine identity. Schema mismatch can invalidate the artifact, and matching hardware is required. Recheck policy and workspace, rebind buffers, and account for the default `run_warmup=true` behavior in both operational safety and timing.

The proposed manifest should identify Native Linux distribution/version, compiler/C++ dialect, GPU model/compute capability/count/memory, driver, Toolkit, compiled and loaded backend identities, frontend SHA, and component/build details. Backend 9.24.0's CUDA 13.x package lists CUDA 13.0-13.3 with Linux driver at least **580.65.06**; static linking targets 13.3. Frontend C++ configuration specifies CMake at least 3.23 and C++17. These are software compatibility facts, not a completed setup or automatic Toolkit Lane enrollment. Backend package hash, actual allocations, and results remain unestablished.

Specify independent-reference construction, absolute/relative error and finite-value checks, and a separate same-condition repeatability test before timing. Restore identical mutable inputs between trials. The cold record names host graph setup, heuristics, build/runtime compilation, allocation, restore warmup, and first completed work as included or excluded. The warm record names preparation, warmup/repetition policy, execution-stream event interval, and completion checks. Record application-plan, default/custom kernel-cache, and serialized-artifact states independently. Leave elapsed times, errors, and observed outcomes blank until actually measured; the task supplies none.

## Valid alternatives

- With the worksheet's known fixed 2 MiB frontend scratch, an application can use a tighter backend cap of 6 MiB as an early filter for the 8 MiB total budget. It must still check the final total, actual allocation, and all statuses; this is not a general automatic subtraction rule for unknown scratch.
- Decompose convolution, bias, and ReLU only with the same operation order, broadcast axes, types, and intermediate rounding contract, then validate independently. Materializing the internal results in FP16 would change the specified FP32-intermediate problem. Include added allocations/traffic/launches in later end-to-end measurements, without predicting their cost.
- Keep no persistent plan cache and rebuild as needed if that simplifies ownership and invalidation. Or persist only graph structure and replan on the target device. Neither choice has a demonstrated performance advantage in this exercise.

## Common errors

- Reading channel-fast bytes as packed NCHW, broadcasting bias along the wrong axis, or using compute type to justify misdeclared storage.
- Treating a virtual tensor as a no-workspace or single-kernel promise, or confusing a cuDNN operation graph with CUDA Graph replay.
- Treating `create_execution_plans` as completed builds, `check_support` as an all-candidate guarantee, or `ALL` as a benchmark.
- Omitting frontend scratch, confusing budget with allocation, or declaring C4 successful after C3 fails.
- Treating kernel-cache controls as application-plan invalidation or as the eviction policy of an explicit custom cache.
- Restoring serialized plans across unreviewed versions/devices, ignoring restore warmup, or treating a graph key as a complete support/policy identity.
- Equating determinism with accuracy, or presenting inspected owner tests, proposed compatibility, historical fixed issues, or hypothetical candidates as current execution evidence.

Reviewed **2026-09-07**. Continue with [PB-R4-011](/en/practice/#pb-r4-011) and related [L11](/en/libraries/attention-backend-dispatch/) without adding a prerequisite or a runtime claim to L10.
