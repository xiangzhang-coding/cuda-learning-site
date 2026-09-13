---
title: 'P04 Exercises: Audit Both Ends of the Interval'
description: Classify timing claims, repair a two-branch event boundary, and specify a complete measurement report without code or invented observations.
pairId: p04-exercises
counterpart: /frameworks/queued-work-timing/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, exercise-1, exercise-2, exercise-3, continue, sources]
resourceKind: exercise-set
unitId: P04-EXERCISES
prerequisites: [P04]
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
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p04-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/queued-work-timing/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,exercise-1,exercise-2,exercise-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P04-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P04 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '3' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/queued-work-timing/exercises/" lang="zh-CN">阅读中文对应页</a>

## Exercise contract

Complete [P04](/en/frameworks/queued-work-timing/) first; it is the only direct prerequisite. Use torch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64, and the native allocator. Submit written boundary diagrams, decisions, and report fields, not an implementation. No GPU is needed, all four evidence arrays are empty, and **GPU observations remain Pending Hardware Verification**. Do not invent durations or run unsafe variants to obtain a failure.

## Exercise 1: Name the quantity before comparing it

**Goal:** Review T0-T2 from P04 and distinguish an honest host observation from a completed wall or event measurement.

**Constraints:** The workload is a fixed small eager CUDA tensor operation on one GPU. T0 times only the host interval around submission. T1 finishes the selected device's earlier work before host start and waits for its declared work before host stop. T2 records start/work/end on the same explicit stream and waits for end. Assume correctness and storage lifetimes are separately satisfied; do not infer performance from that assumption. Separately consider T2 with default events, an unrecorded start, and no end completion check.

**Expected evidence:** A three-row claim table; the included/excluded costs for T1; a rejection reason for each altered T2; and an explanation of why neither a universal host/event ordering nor a speedup threshold follows.

**Acceptance criteria:** T0 is host elapsed time with possible incidental blocking, not completed GPU latency. T1 is valid only for its declared selected-device region, not all GPUs or pure kernel execution. T2 requires recorded, timing-enabled endpoints and ending completion, and reports milliseconds. Default timing is disabled. A query result alone cannot establish that an endpoint was recorded. Correct boundaries do not supply a measured duration.

<details><summary>Hint 1: Ask which processor reached the boundary</summary>A Python return tells you the host advanced. Which additional fact tells you the declared device work finished?</details>

<details><summary>Hint 2: Separate event validity from event coverage</summary>An event can be unsuitable for elapsed time even when no work remains. Check timing enablement, recording, stream position, and completion independently.</details>

## Exercise 2: Repair a fork and join on paper

**Goal:** Prove that a two-branch workload is fully enclosed by an event interval.

**Constraints:** C is a coordinator stream; A and B are worker streams on the same device. Both events are timing-enabled and recorded on C. T3 sends the start dependency to A and B but joins only A before end. T4 joins A and B before end but gives only A the start dependency. In both cases the host later synchronizes the whole device. No durations, branch overlap, or relative scheduling are supplied. Dependencies expressed with `wait_stream` cover only work submitted by their call boundary.

**Expected evidence:** Two distinct missing-edge explanations, a corrected T5 dependency diagram with two start edges and two completion edges, a location for the host completion check, and a statement of the claims the repaired diagram still cannot make.

**Acceptance criteria:** T3 does not enclose B's finish; T4 does not enclose B's beginning. A late device synchronize repairs neither recorded timestamp. Put each start dependency before that branch's measured work and each return dependency after its final included submission, before C's end. Wait for end before reading milliseconds. Do not replace the graph with “both markers are on the default stream,” sum overlapping branch durations, or claim the correct graph guarantees overlap.

<details><summary>Hint 1: Test the two ends separately</summary>Could B do some work before start? Could B still have work after end? A complete answer rules out both possibilities by dependencies, not scheduling guesses.</details>

<details><summary>Hint 2: A later wait does not edit a marker</summary>Distinguish the time the end marker is reached from the time the CPU learns that the device has finished everything.</details>

## Exercise 3: Design a reviewable measurement report

**Goal:** Specify a future comparison between completed wall time and a correctly scoped event interval without confusing setup, verification, and profiling.

**Constraints:** Use the selected environment, a fixed operation/shape/dtype, one device, and the same accepted outputs. Choose and justify which allocations, transfers, initialization, and host work are inside each region. No installation or execution is part of this Exercise. Use the full Environment Manifest field groups in P04, not only the package name. All observations are unobserved.

**Expected evidence:** A correctness-reference and tolerance plan; separate cold-start, workload-warmup, timing, and profiling records; a complete blank manifest; a repetition/distribution policy; and explicit rejection conditions for invalid results, failed completion, wrong allocator/build, or insufficient timing resolution.

**Acceptance criteria:** State warmup and repetition counts as a proposed policy, retain raw samples in the eventual report, and distinguish batch amortization from isolated latency. Keep `.item()`, output printing, and verification transfers outside timing unless explicitly included. Record launch-blocking and profiler state. Include hardware identity/capability/count/memory, CPU and OS/kernel/glibc, interpreter provenance/compiler/flags, wheel/commit/hash/dependencies, installed driver, packaged and loaded component identities, system Toolkit/compiler presence or absence, ownership/stream policy, measurement boundaries, and noise conditions. Leave results unfilled; never convert a software target into an observed Reference Environment.

<details><summary>Hint 1: Look for work accidentally charged to a neighbor</summary>Initialization or a delayed host read can move costs between requests. What would a reviewer need to know to compare the same work in both variants?</details>

<details><summary>Hint 2: Package identity is not process identity</summary>A wheel describes a build. Which fields identify the driver, loaded libraries, actual device, allocator, and conditions of the particular run?</details>

## Continue

Compare your work with the [numbered solutions](/en/frameworks/queued-work-timing/solutions/), then revisit [PB-R5-004](/en/practice/#pb-r5-004). [P05](/en/frameworks/streams-and-storage-lifetime/) examines the storage obligations assumed in Exercise 1.

## Sources

The exact owner basis is [CUDA semantics](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst), [Stream and Event interfaces](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py), and [selected-device synchronization](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/__init__.py). See [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080) for environment artifacts and [SRC-CUDA-081](/en/sources-and-versions/#src-cuda-081) for timing/stream review. These are original CC BY 4.0 Exercises, not copied owner tests; upstream sources retain their licenses and notices. **Facts checked and sources accessed: 2026-09-12.**
