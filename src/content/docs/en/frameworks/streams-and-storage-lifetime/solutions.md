---
title: 'P05 Solutions: Follow Every Allocation Back to Its Origin'
description: Resolve two-way stream lifetimes, write-only recycled storage, aliases, and deallocation-time registration with alternatives and explicit evidence limits.
pairId: p05-solutions
counterpart: /frameworks/streams-and-storage-lifetime/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [contract, solution-1, solution-2, solution-3, continue, sources]
resourceKind: solution-set
unitId: P05-SOLUTIONS
prerequisites: [P05-EXERCISES]
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
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p05-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/streams-and-storage-lifetime/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'contract,solution-1,solution-2,solution-3,continue,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P05-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'P05-EXERCISES' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '4' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: 'torch-2.11.0+cu128,CPython-3.12.14,CUDA-12.8,native' } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/streams-and-storage-lifetime/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review contract

Attempt the [P05 Exercises](/en/frameworks/streams-and-storage-lifetime/exercises/) first. These answers concern torch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64, native allocator. All four evidence arrays are empty. **GPU observations remain Pending Hardware Verification**; the labels below describe a static use graph, not a runtime trace.

## Solution 1: Give x and y separate proofs

| Storage | Readiness proof | Lifetime proof |
| --- | --- | --- |
| x, origin A | A production precedes B consumption through B's correctly placed wait on A | Register B use before release, retain through B completion, or join final B use back to A before release |
| y, origin B | B production precedes A consumption through A's correctly placed wait on B | Register A use before release, retain through A completion, or join final A use back to B before release |

The origin is a property of the allocation history, not the stream current at release or the latest writer. Final release means no remaining owner keeps the backing allocation alive; one deleted variable may leave aliases. The last GPU use can occur after the last Python use because submission and completion differ.

S0 correctly orders both data handoffs and protects x, but omits y's non-origin A use. S1 registers both lifetimes but allows either consumer to read unfinished data. S2 keeps owners only through submission, leaving storage reclaimable while consumers remain in flight. S3 has both independent proofs under the no-mutation assumption. S4 is a valid manual proof if each final non-origin use is included in its origin's return boundary before release. Neither S3 nor S4 is measured runtime evidence.

For the registration repair, B waits after the necessary A production and before its x use, and x is registered on B while alive. A separately waits after B's y production and before its y use, and y is registered on A while alive. These registrations need not make Python wait; allocator reuse is deferred at release.

For the manual repair, preserve both readiness waits. After submitting B's final x use, return that use to origin A before x's storage is released. After submitting A's final y use, return that use to origin B before y's storage is released. Each `wait_stream` captures an already submitted prefix, so later operations are not included automatically. Carefully placed two-way snapshots need not create a cycle; prove the actual graph rather than assuming direction alone guarantees safety.

**Valid alternative:** keep explicit storage owners through checked consumer completion, then release. This may block the CPU more broadly, but is valid for the covered uses. A single-stream design can simplify ownership, at the cost of changing concurrency policy; do not claim it is faster or slower without measurement.

**Common errors:** protecting only the input; returning y's use to A because A is the default stream even though y originated on B; assuming `record_stream` transfers ownership; counting enqueue as completion; adding a return after final release.

## Solution 2: The absence of old values does not remove old accesses

The previous logical tensor may have lost all host references while its queued A accesses remain unfinished. Native stream-associated reuse can hand z that block because new A accesses would follow old A accesses. B has no such order by default. Its write can overlap an older A read or write even though B does not consume z's uninitialized contents.

The required dependency orders the relevant allocation-origin A boundary before B's first write. A correctly positioned B wait on A supplies that ordering. z still originates on A after B writes it, so B's use also needs registration, retention through completion, or a final B-to-A return before release. Readiness and reuse remain separate obligations even for a write-only operation.

The offset view v shares z's backing storage. Deleting z while v remains an owner does not release that storage. A view's offset does not create a new allocation origin or limit the allocator's lifetime accounting to only the visible slice. Audit all aliases and the eventual last owner rather than one local variable's scope.

For the separate mutation case, recording B cannot stop A from explicitly overwriting a still-live allocation while B reads it. That is an application conflict, not allocator reclamation. Order A's conflicting write after B's read, order B's read after the intended A production, or use genuinely distinct storage with its own correct copy and lifetime dependencies.

**Valid alternatives:** allocate z on B and keep its initial work on B to avoid this particular cross-origin handoff, then review any later A consumption separately. Or retain storage and use checked completion at the transition. These change the ownership/synchronization policy and do not establish a performance advantage.

**Common errors:** treating `torch.empty` as fresh physical memory; changing the origin to the last writer; treating a view as an independent allocation; assuming a live reference or registration prevents mutation. No exact pointer, crash, or repeated corruption is promised. A passing result on one run or a different returned address does not establish a safe dependency graph.

## Solution 3: Registration covers the deallocation boundary

| Use | Relative position | Registered B use at F | Manual origin return between U1 and U2 |
| --- | --- | --- | --- |
| U1 | Submitted after R, before F | Covered | Covered |
| U2 | Submitted after R, before F | Covered | Not covered |
| U3 | Attempted after F | Not authorized | Not authorized |

At this native implementation, R records B in an allocation use set, not a fixed event snapshot of work already queued at R. At final storage deallocation F, events are inserted on registered streams; their completion governs reuse. Therefore U1 and U2 can be covered even though both were submitted after R. Nothing grants a right to use a released allocation through a dangling reference after F.

The manual return is different: `origin.wait_stream(B)` uses B's already submitted prefix at its call boundary. A return between U1 and U2 cannot protect U2. Move the final return after all relevant B submissions and before F, or retain the storage until those uses have completed. With several non-origin users, every relevant stream must be covered, not just the last stream whose name appears in the host code.

For a future comparison, first independently validate the intended outputs after checked completion, with declared tolerances/finiteness requirements and both input/result lifetime proofs. Compare the same operation, inputs, shapes/strides/dtypes, and ownership policy except for the deliberate lifetime mechanism. Use P04's clean completed wall boundary or a valid event start/fork/join/end interval. Events require timing enabled and report milliseconds after end completion. Separate workload warmup, repeated unprofiled timing, correctness, and profiling; do not infer unperturbed lifetimes from a profiler that retains tensor references.

The complete P05 manifest remains required: run/source/input/reference/log identities; actual GPU model/stable identity/capability/count/memory and CPU/noise/clocks/power/thermal state; actual native Linux/kernel/glibc/image/container identity; CPython executable/build/compiler/flags and installer; torch wheel/index/hash/commit and all dependency artifacts; driver, build CUDA, packaged and loaded Runtime/cuDNN/CUPTI identities; system Toolkit/compilers or absent/not used; active allocator/configuration, environment and precision flags; every origin/alias/producer/consumer/last-use/release/dependency; timing units/coverage/inclusions/warmup/repetitions/raw distribution and separate profiler settings/artifacts. Leave unobserved values blank.

Use `PYTORCH_ALLOC_CONF=backend:native` before process startup and confirm the active allocator, rather than infer it from build CUDA 12.8. `cudaMallocAsync` is a distinct process-wide backend requiring CUDA 11.4 or newer; native reuse/statistics conclusions do not automatically transfer. CUDA package versions or an installed system Toolkit do not certify the active backend or loaded libraries.

**Valid alternatives:** manually recorded events can express precise return boundaries, and retained ownership through checked completion is simpler when overlap is unimportant. A later return can preserve concurrency but retain memory longer; registration can impose event/polling overhead. These are reasons to measure, not measured winners.

**Common errors:** freezing `record_stream` coverage at R; extending a `wait_stream` snapshot to future U2; treating U3 as protected after release; using pointer equality as an acceptance test; mixing native and async-backend statistics; reporting a proposed Linux/GPU/driver configuration as observed.

## Continue

Return to [P05](/en/frameworks/streams-and-storage-lifetime/) and [PB-R5-005](/en/practice/#pb-r5-005). [P04](/en/frameworks/queued-work-timing/) supplies the independent timing-boundary audit.

## Sources

The exact owner basis is [CUDA semantics](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/docs/source/notes/cuda.rst), [Stream and Event interfaces](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/cuda/streams.py), [Tensor lifetime documentation](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/torch/_tensor_docs.py), and [native allocator source](https://github.com/pytorch/pytorch/blob/70d99e998b4955e0049d13a98d77ae1b14db1f45/c10/cuda/CUDACachingAllocator.cpp). See [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080) and [SRC-CUDA-081](/en/sources-and-versions/#src-cuda-081). Original solutions are CC BY 4.0; no owner implementation or test body was copied. Upstream sources retain their licenses and notices. **Facts checked and sources accessed: 2026-09-12.**
