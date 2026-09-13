---
title: 'P04 Solutions: Completion Is Necessary, Coverage Is Separate'
description: Work through submission versus completion, both sides of a multi-stream interval, and an evidence-limited report with valid alternatives and common errors.
pairId: p04-solutions
counterpart: /frameworks/queued-work-timing/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, solution-1, solution-2, solution-3, continue, sources]
resourceKind: solution-set
unitId: P04-SOLUTIONS
prerequisites: [P04-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Pinned PyTorch CUDA semantics'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Native Linux CUDA; asynchronous execution and streams'
    accessDate: '2026-09-12'
  - title: 'Pinned PyTorch Stream and Event interfaces'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Event timing, completion, and call-time stream dependencies'
    accessDate: '2026-09-12'
  - title: 'Pinned PyTorch device synchronization'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/__init__.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Selected-device synchronization scope'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p04-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/queued-work-timing/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,solution-1,solution-2,solution-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P04-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P04-EXERCISES' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '3' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/queued-work-timing/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review contract

Attempt the [P04 Exercises](/en/frameworks/queued-work-timing/exercises/) first. The answers use torch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64, native allocator. All four evidence arrays are empty. **Pending Hardware Verification** applies to GPU observations; these answers establish static reasoning, not measured results.

## Solution 1: Keep the clock's question intact

| Case | Supported claim | Unsupported upgrade |
| --- | --- | --- |
| T0 | Host interval around submission, including any blocking that actually occurred | Completed device latency, pure enqueue cost, pure kernel time, or guaranteed lower value than event time |
| T1 | Completed wall time for the declared selected-device region | All-GPU completion or an interval containing only device execution |
| T2 | Completed device event interval around all declared work on S | Sum of isolated kernel times, proof of speedup, or coverage of unrelated side streams |

For T1, prior selected-device completion belongs before host start. Otherwise old backlog can be charged to this operation. Final selected-device completion belongs before host stop. Otherwise work can escape the interval. The final synchronization's host overhead is inside the wall measurement. State whether allocations, transfers, library initialization, and input preparation are also inside. Device synchronization covers all streams on that device, so unrelated in-process work can contaminate the region; other devices are not covered.

For T2, both events require `enable_timing=True`, recording on S around the declared work, and host knowledge that end completed before reading `start.elapsed_time(end)`. The unit is milliseconds. Default timing-disabled events are invalid for elapsed time. An unrecorded start is invalid even if querying an event reports readiness. Without an end completion check, do not assume the elapsed-time read establishes the required wait.

**Valid alternative:** retain T0 as a separately labeled host-submission observation if that is the question. Or wait on a correctly positioned ending event to establish a declared workload's completion for a narrower wall boundary, while explicitly controlling prior work. This differs from T1's device-wide protocol and must be labeled accordingly.

**Common errors:** calling T0 “kernel time”; assuming the host clock must always be smaller; dividing milliseconds as though they were seconds; treating `query` as proof of recording; requiring every tiny event measurement to exceed an arbitrary positive threshold. Finite nonnegative samples are necessary, but resolution and correct coverage still need review.

## Solution 2: Prove both directions of coverage

T3 supplies the two start edges but omits B's completion edge. Therefore B may still execute after C reaches end. T4 supplies both completion edges but omits the start edge to B. Therefore B may execute part or all of its work before C reaches start. These counterexamples need no assumed duration or scheduling policy.

The corrected T5 contains the following relations, with markers and dependency boundaries positioned by submission order:

1. C's start precedes A's first included work through a start dependency.
2. C's start precedes B's first included work through a separate start dependency.
3. A's final included work precedes C's end through a completion join.
4. B's final included work precedes C's end through a separate completion join.
5. Host elapsed-time inspection follows successful end completion.

If a `wait_stream` call expresses an edge, its producer snapshot must contain the relevant marker or final work. A join called before B submits its last included operation does not cover that operation. Likewise, placing B's start wait after B's work is already submitted cannot order that earlier work.

The late device synchronize in T3/T4 says all selected-device work eventually finished. It does not rewrite an already reached start or end marker. The repaired diagram supplies no durations, so neither branch sums nor a speedup can be derived. Even a correct event interval can include gaps, host-fed delays, and device interference, and does not promise actual overlap.

**Valid alternatives:** use explicitly recorded completion events instead of stream snapshots, or choose a completed device-wide wall interval when the application question includes the whole device region. Keep the two-branch coverage proof. Serializing all work on one stream can produce a valid different experiment, but cannot be presented as measuring the original concurrency policy.

**Common errors:** treating default-stream markers as universal fences; checking only the join; trying to repair coverage by waiting longer after end; summing overlapping event durations as end-to-end latency.

## Solution 3: Leave observations blank, not requirements vague

A reviewable proposed policy might use 8 workload warmup repetitions and 30 unprofiled measured repetitions, with those numbers clearly labeled as choices rather than a guarantee of steady state. Keep shape, dtype, input construction, precision settings, and accepted outputs fixed. Change the policy if later raw data show drift; retain the reason and all samples instead of silently discarding inconvenient values. Report a distribution such as median and range alongside the raw series, not a fabricated result.

Construct an independent reference for the chosen operation and specify finite-value checks and justified mixed absolute/relative tolerances before collecting data. Validate after checked completion outside timing. Keep verification transfers, `.item()`, and printing outside the region. If the real application question includes a transfer, include that declared transfer consistently instead of claiming every transfer must be excluded.

Use separate records for cold initialization, workload warmup, completed wall trials, correctly bracketed event trials, and profiling. State allocations and host preparation as included or excluded in each. A grouped trial divided by its group size is amortized per-operation time, not isolated latency. Profiling configuration and `CUDA_LAUNCH_BLOCKING` are explicit fields; a debug or instrumented run is not the uninstrumented baseline.

The manifest must include every P04 field group, with the following distinctions preserved:

| Record | Required distinction |
| --- | --- |
| Hardware and host | Actual GPU identity/capability/count/memory, CPU, clocks/power/thermal/noise conditions; actual Linux/architecture/kernel/glibc and OS/container provenance, not proposed values |
| Interpreter and packages | CPython executable/build/compiler/flags and installer; torch wheel/index/hash/commit and complete dependency artifacts, not only a version string |
| Driver and libraries | Installed driver, build CUDA 12.8, packaged Runtime/CUPTI 12.8.90 and cuDNN 9.19.0.56, actual loaded paths after operations; system Toolkit/compilers recorded as present or absent/not used |
| Work and ownership | Source revision, seed, shapes/strides/dtypes, allocator and environment variables, device/stream/dependency graph, correctness/reference policy and diagnostic stages |
| Measurement | Clock/unit, both boundaries, inclusion policy, warmup/repetitions/batch policy, raw samples/distribution/noise policy, separate profiler configuration and artifacts |

An incorrect result, failed completion, wrong build/backend, or invalid marker means the trial cannot support the intended claim. Insufficient resolution means the chosen measurement cannot usefully distinguish the workload, not that CUDA took no time. Leave measured errors, timings, loaded-library observations, and GPU identities unfilled until execution. The proposed Ubuntu 24.04, one-GPU capability-at-least-8.0/8-GB target with a maintained compatible driver conservatively at least 570.124.06 is not an observed Reference Environment.

**Valid alternatives:** different justified repetition counts, robust summaries, or a separately labeled cold-start study are acceptable. A dependency-scoped wall interval is acceptable if its completion and exclusion proof matches the question. No choice establishes a performance winner in advance.

**Common errors:** copying target versions into observation fields; reporting a scalar “CUDA version” instead of separate driver/build/package/loaded identities; using a profiler run to prove unperturbed timing; recording only the fastest sample; labeling a blocked or skipped CUDA run as success.

## Continue

Return to [P04](/en/frameworks/queued-work-timing/) and [PB-R5-004](/en/practice/#pb-r5-004), then apply the interval proof while reading [P05](/en/frameworks/streams-and-storage-lifetime/).

## Sources

These solutions use exact-commit [CUDA semantics](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst), [Stream and Event interfaces](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py), and [selected-device synchronization](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/__init__.py). Environment and semantic records are [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080) and [SRC-CUDA-081](/en/sources-and-versions/#src-cuda-081). Original reasoning is CC BY 4.0; upstream sources retain their licenses/notices and were not copied into an implementation. **Facts checked and sources accessed: 2026-09-12.**
