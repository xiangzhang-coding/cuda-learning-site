---
title: 'P07 Solutions: Correlated Work and Two Retained Windows'
description: Resolve supplied launch relationships, derive both profiler windows and callback boundaries, and repair missing-trace, measurement, and artifact-custody claims.
pairId: p07-solutions
counterpart: /frameworks/python-to-cuda-profiling/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P07-SOLUTIONS
prerequisites: [P07-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p07-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/python-to-cuda-profiling/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P07-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/python-to-cuda-profiling/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review boundary

Attempt [P07 Exercises](/en/frameworks/python-to-cuda-profiling/exercises/) first; the direct prerequisite is `[P07-EXERCISES]`. These original paper solutions use PyTorch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64 as a source contract. No trace, output, or timing was collected. All evidence arrays remain empty; **GPU-dependent behavior remains Pending Hardware Verification**.

## Solution 1: The launch graph determines attribution

The supplied chains are `F-A -> H-A1 -> C-X -> K-A1`, `F-A -> H-A2 -> C-Y -> K-A2`, and `F-C -> H-C1 -> C-Z -> K-C1`. F-A has **two** kernels on device 0, stream 3; F-B has **zero** by the explicit complete metadata-only stipulation; F-C has **one** on device 0, stream 7. K-U remains **unresolved** because the worksheet supplies no link or device/stream identity for it.

The shared “elementwise” display label cannot join K-A2 to F-C or K-C1 to F-A. K-A1 can execute after the CPU F-A range ends because the host submits work asynchronously. Its explicit launch chain survives that separation. Neither a nearest range nor temporal containment provides a substitute relationship. A phase annotation groups work without renaming kernels or imposing completion.

An actual trace needs occurrence-level CPU identities in their process/thread/window, runtime launch and external correlation relationships, and device/stream identities for linked device activity. A correlation is an association, not a synchronization edge between unrelated streams. Stream 3 and stream 7 sharing device 0 establishes no inter-stream order or observed overlap.

Only this worksheet declares F-B's relation list complete and metadata-only. In an incomplete real capture, no visible kernels could instead reflect a missing CUPTI path, wrong window, unsupported collection, or dropped activity. Inspect completeness before claiming zero work. The table gives no measured duration, device utilization, correctness, accumulator precision, or bottleneck.

## Solution 2: Record six iterations and save two windows

The cycle length is `1+1+3=5`; two cycles require ten iterations. With initial step 0 and one step after each iteration, the actions are:

| Iteration index | Action | Saved workload window | Callback at following boundary |
| --- | --- | --- | --- |
| `0` | `NONE` | None | None |
| `1` | `WARMUP` | None | None |
| `2` | `RECORD` | `W1` | None |
| `3` | `RECORD` | `W1` | None |
| `4` | `RECORD_AND_SAVE` | `W1` | `5` |
| `5` | `NONE` | None | None |
| `6` | `WARMUP` | None | None |
| `7` | `RECORD` | `W2` | None |
| `8` | `RECORD` | `W2` | None |
| `9` | `RECORD_AND_SAVE` | `W2` | `10` |

The active sets are **`[2,3,4]`** and **`[7,8,9]`**, six iterations total. There are **two** predicted callbacks, after the work of iterations 4 and 9, at step numbers **5 and 10**. In the declared ten-iteration session, final context exit after the tenth step does not add a third recording window. These are derived actions, not observed callback logs.

W1 must retain the three workload labels for 2-4, W2 those for 7-9, at two distinct destinations exported inside `on_trace_ready`. Each write needs its own success/error record and artifact identity. Wait and warmup workload labels are not active membership; profiler housekeeping is not an extra application iteration. Workload warmup before the context is separate from the profiler's WARMUP action.

The once-after-context proposal retains only the last cycle, losing W1. The shared-destination proposal risks overwriting W1 with W2 even if two callbacks ran. Default `acc_events=False` leaves summary events cycle-local; `acc_events=True` permits accumulated FunctionEvents but does not recover an unsaved earlier timeline. Callback count is not retained-artifact count.

Omitting a boundary step makes the profiler's logical iteration diverge from the application's, so the index-to-window prediction no longer holds. Omitting all steps leaves the initial NONE action in this schedule rather than recording ten iterations automatically. `prof.step()` signals progression and can trigger collection transitions; it is not a general promise of CUDA completion. Timing still needs P04's explicit boundaries.

## Solution 3: Reject unsupported claims, retain useful diagnostics

| Hypothetical report claim | Disposition | Required repair |
| --- | --- | --- |
| Supported activities and CUDA table time prove JSON kernels | Reject | Inspect actual active-window CPU, runtime, kernel records and usable correlations; investigate possible fallback |
| System Toolkit version identifies loaded CUPTI and driver | Reject | Retain exact selected artifacts and actual loaded library/driver identities |
| Shape-recording reuse delay proves uninstrumented allocator lifetime | Reject | Separate tensor-retaining instrumentation from an unprofiled lifetime experiment |
| Summed kernel durations are application latency | Reject | Measure matched unprofiled wall/device boundaries separately; account for overlap and nested aggregation |
| Nesting Nsight and torch.profiler is automatically valid | Reject | Use separate CUPTI-client sessions and inspect compatibility/subscriber diagnostics |
| Root access and public raw stacks are the default repair | Reject | Diagnose the precise permission boundary; obtain authorization and share only reviewed sanitized derivatives |

The empty-kernel JSON does not prove CUDA work never ran. The pinned profiler supports a fallback with CUDA table timing but no exported CUDA kernel activity; wrong windows, missing/incompatible loaded libraries, and incomplete collection are also possible. Keep the trace claim blocked until a smoke test retains framework/user ranges, runtime launch records, actual kernels, and at least one justified launch chain. A transfer record is required only if transfer work belongs inside the declared capture window.

The Environment Manifest needs GPU model/controlled identity, compute capability, memory/count and selected device/topology; OS/release/kernel/architecture/glibc/CPU and container identity; interpreter version/provenance and build/compiler; exact torch wheel/hash/commit and complete dependencies; driver, build CUDA, system Toolkit/compiler or declared absence, and loaded CUDA Runtime/cuDNN/CUPTI identities after relevant lazy loading. The selection is build CUDA 12.8, Runtime/CUPTI 12.8.90, and cuDNN 9.19.0.56, not evidence these libraries were loaded.

Also retain workload revision, input source/seed, shapes/strides/dtypes, correctness criteria/results, device/stream policy, native allocator configuration and observed backend, precision/determinism flags; profiler/build identity, requested/supported activities, workload warmup, schedule, exact step boundaries, shape/stack/memory flags, callbacks/artifacts, completeness and errors; and separate timing scope, completion, repetitions, raw samples, clocks/power/thermal conditions, and other workloads. Every missing coordinate remains unknown, not copied from a proposed target.

Use three distinct purposes: correctness checks establish accepted results; minimal targeted profiling establishes relationships; matched unprofiled timing establishes a stated duration distribution. Shape capture can retain tensor references and introduce copies, so its allocator behavior is not an unperturbed baseline. Any measured instrumentation overhead must be reported separately, not removed by a guessed constant. A table cannot determine wall time by adding overlapping work.

Record host/container permission policy and any administrator-approved change. Activity tracing is not hardware-counter collection; first inspect the actual failure rather than prescribing blanket privilege escalation or disabling security. Another CUPTI client may violate the selected single-subscriber contract, so isolate torch.profiler from Nsight. An unavailable authorized capture remains blocked.

Keep raw traces/stacks/logs and identifying paths private with controlled access and hashes. Use neutral labels and synthetic inputs; review a sanitized derivative, its hash, redactions, reviewer approval, and retention/deletion policy before sharing. Preserve window and correlation consistency without exposing secrets, source paths, usernames, hostnames, or confidential inputs. If redaction destroys the claimed relationship, reduce the public claim or recollect with non-sensitive data; do not fill gaps with invented identifiers presented as real evidence.

## Valid alternatives and tradeoffs

A CPU-only profile can answer a deliberately CPU-scoped question if clearly labeled, but cannot satisfy the CUDA correlation requirement. A table can rank aggregated operations for follow-up, while a retained timeline is needed for occurrence and temporal claims. A separate authorized Nsight session can answer an appropriate application or kernel question after its own compatibility review; it is not a reason to nest subscribers.

Minimal shape/stack-free collection reduces perturbation and disclosure. A separately labeled shape-enabled run can help distinguish workloads, provided its cost and lifetime effects are acknowledged. If data cannot be shared safely, a reviewed aggregate may support a narrower claim, or the capture can remain private. Neither alternative permits publishing private paths or asserting unobserved kernels.

## Common errors

- Equating display names, CPU containment, or nearest timestamps with a launch relationship misattributes asynchronous work.
- Converting an absent link into zero kernels ignores capture completeness.
- Calling supported activities or a CUDA-time column proof of CUPTI kernel tracing confuses preflight with evidence.
- Saving once after a scheduled run or overwriting one destination loses earlier windows.
- Counting a callback before its final active iteration creates an off-by-one schedule.
- Treating shape capture as passive observation ignores retained tensor references.
- Adding overlap or inclusive parent/child times into latency changes the measurement question.
- Uploading raw stacks or granting blanket root access violates privacy and permission boundaries without diagnosing the missing layer.

Return to [P07](/en/frameworks/python-to-cuda-profiling/) and [PB-R5-007](/en/practice/#pb-r5-007). Sources: [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080) and [SRC-CUDA-083](/en/sources-and-versions/#src-cuda-083), reviewed **2026-09-12**. These answers assert no retained runtime evidence or performance result.
