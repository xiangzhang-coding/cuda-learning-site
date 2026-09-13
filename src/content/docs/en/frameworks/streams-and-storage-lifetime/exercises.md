---
title: 'P05 Exercises: Trace Readiness and Reuse Independently'
description: Audit both directions of a stream handoff, explain recycled write-only storage, and compare deallocation-time registration with manual lifetime control.
pairId: p05-exercises
counterpart: /frameworks/streams-and-storage-lifetime/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, exercise-1, exercise-2, exercise-3, continue, sources]
resourceKind: exercise-set
unitId: P05-EXERCISES
prerequisites: [P05]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Pinned PyTorch CUDA semantics'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Native allocator selection and write-only cross-stream hazards'
    accessDate: '2026-09-12'
  - title: 'Pinned PyTorch Stream and Event interfaces'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Call-time wait_stream boundary'
    accessDate: '2026-09-12'
  - title: 'Pinned Tensor record_stream contract'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/_tensor_docs.py'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Deallocation-time lifetime boundary and manual origin-stream return'
    accessDate: '2026-09-12'
  - title: 'Pinned native CUDA caching allocator'
    url: 'https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/c10/cuda/CUDACachingAllocator.cpp'
    version: 'PyTorch 2.11.0; 70d99e998b4955e0049d13a98d77ae1b14db1f45'
    platform: 'Ordinary eager allocations; stream registration and events at free'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p05-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/streams-and-storage-lifetime/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,exercise-1,exercise-2,exercise-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P05-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P05 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '4' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/streams-and-storage-lifetime/exercises/" lang="zh-CN">阅读中文对应页</a>

## Exercise contract

Complete [P05](/en/frameworks/streams-and-storage-lifetime/) first; it is the only direct prerequisite. These are static written Exercises for torch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64, native allocator. Ordinary eager allocations only; no external storage or graph pools. No GPU is needed, all four evidence arrays are empty, and **GPU observations remain Pending Hardware Verification**. Do not submit code, invented traces, or deliberate race executions.

## Exercise 1: Audit the input and the returned result

**Goal:** Repair a two-way handoff without confusing data readiness and allocator lifetime.

**Constraints:** x is allocated/produced on A and consumed on B. A distinct y is allocated/produced on B and consumed on A. Each final reference can disappear after its consumer is enqueued but before completion. There are no explicit conflicting mutations. Review S0-S4 from P05: input-only registration with both waits; both registrations without waits; both waits with retention only through submission; both waits plus both registrations; both waits plus correctly placed manual return dependencies.

**Expected evidence:** An origin/producer/consumer/final-use/release ledger for x and y, separate readiness and reuse edges, decisions for all five cases, and two complete repairs using registration and manual returns respectively.

**Acceptance criteria:** x needs B's use protected relative to origin A; y independently needs A's use protected relative to origin B. S0-S2 are incomplete; S3 and S4 are valid for the stated graph, not runtime-verified. Explain call-time wait direction and coverage, final storage release rather than one variable deletion, and why keeping a name only until enqueue is insufficient. A manual return must cover all relevant non-origin uses before release; no universal CPU wait is required.

<details><summary>Hint 1: Start from the allocation, not the current stream</summary>Where was y allocated? Does x's registration say anything about that distinct allocation?</details>

<details><summary>Hint 2: Draw two kinds of arrows</summary>One arrow makes values ready for a consumer. Another keeps future reuse accesses behind the last consumer use. Which API or retained owner supplies each?</details>

## Exercise 2: Explain a write-only recycled allocation

**Goal:** Refute the claim that a new uninitialized tensor cannot have a cross-stream storage hazard.

**Constraints:** z is an A-origin `torch.empty` allocation. Its block may previously have belonged to another logical tensor with A work still queued. B overwrites z without reading its old values. Later, an offset view v shares z's storage; deleting the name z leaves v alive. No pointer value or corruption output is supplied, and no race may be executed to “prove” the answer.

**Expected evidence:** A possible conflicting-access graph, the missing origin dependency, a lifetime policy for B use, and an explanation of how the remaining view affects final release. Separately evaluate an explicit A overwrite of still-live z while B reads it, even if B has been recorded.

**Acceptance criteria:** Write-only B access still needs ordering behind the allocation-origin A boundary because physical memory can be recycled. B's write does not change origin A. Registration covers storage lifetime, including shared backing storage, not explicit concurrent mutation. Deleting z is not final storage release while v still owns it. Never demand exact pointer reuse, a repeatable wrong result, or a crash; a numerically correct run alone does not prove the graph safe.

<details><summary>Hint 1: A new logical tensor can use old physical bytes</summary>The previous tensor's Python lifetime can end before its queued A accesses complete. What orders B's new writes behind those accesses?</details>

<details><summary>Hint 2: Reclamation and mutation are different threats</summary>A remaining view can prevent reclamation, but can it stop another stream from explicitly overwriting those same bytes?</details>

## Exercise 3: Identify the actual lifetime boundary

**Goal:** Distinguish registration time, stream-wait time, and storage deallocation, then design a fair future comparison of lifetime policies.

**Constraints:** R registers live x on B. U1 and U2 are B uses queued after R and before final storage release F. An attempted U3 occurs after F. A separate manual return wait on origin A is placed between U1 and U2 submissions. Use the native backend and no graph capture. Treat these labels as ordering facts, not execution timestamps. No measurement has occurred.

**Expected evidence:** A covered/not-covered classification for U1-U3 under registration; the work covered by the manual return; a corrected return or retention alternative; and a future correctness/timing protocol with the full P05 Environment Manifest fields.

**Acceptance criteria:** Registered-stream work queued by F includes U1 and U2; U3 is not authorized after release. The between-uses `wait_stream` snapshot includes U1 but not U2, so it is an insufficient manual lifetime proof. Move the final return after all relevant submissions and before release, or retain through checked completion. Compare policies only after proving correctness and both input/result lifetimes. Separate warmup, timing, and profiling; record actual backend, ownership graph, release boundaries, complete software/hardware identities, and measurement conditions. Do not infer native behavior from CUDA 12.8 or carry reuse/statistics claims to `cudaMallocAsync`.

<details><summary>Hint 1: Locate event insertion</summary>At this native implementation, does registration immediately freeze a completion event, or does deallocation insert events on the registered streams?</details>

<details><summary>Hint 2: A fair comparison keeps the same work</summary>Moving a return boundary changes overlap opportunities and retention. Profiling may retain objects too. Which differences must the measurement record expose?</details>

## Continue

Review the [numbered solutions](/en/frameworks/streams-and-storage-lifetime/solutions/) and [PB-R5-005](/en/practice/#pb-r5-005). Use [P04](/en/frameworks/queued-work-timing/) to check both sides of any future multi-stream timing interval.

## Sources

Use exact-commit [CUDA semantics](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst), [Stream and Event interfaces](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py), [Tensor lifetime documentation](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/_tensor_docs.py), and [native allocator source](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/c10/cuda/CUDACachingAllocator.cpp). [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080) covers environment artifacts; [SRC-CUDA-081](/en/sources-and-versions/#src-cuda-081) covers semantics. Original CC BY 4.0 Exercises; no copied upstream tests or implementations. Upstream sources retain their licenses and notices. **Facts checked and sources accessed: 2026-09-12.**
