---
title: 'P02 Solutions: Exact Arguments and Failure-Safe Lifetimes'
description: Derive 769-element launch coverage and binary scalar types, then distinguish normal cleanup from a failed asynchronous completion.
pairId: p02-solutions
counterpart: /python/devices-contexts-launches/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P02-SOLUTIONS
prerequisites: [P02-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Core Buffer ownership and copy implementation'
    url: 'https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/cuda/core/_memory/_buffer.pyx'
    version: 'cuda-core 1.2.0'
    platform: 'Static buffer, copy, scalar and lifetime review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p02-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/python/devices-contexts-launches/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P02-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/python/devices-contexts-launches/solutions/" lang="zh-CN">阅读中文对应页</a>

## Reviewed solutions

The direct prerequisite is [P02-EXERCISES](/en/python/devices-contexts-launches/exercises/). These are original derivations and a hypothetical failure review, with four empty evidence arrays. Do not interpret them as an executed variant of EX21.

## Solution 1: Correct representation and coverage independently

Each array needs `769*4=3076` bytes. Device payload is `3*3076=9228` bytes; pinned host payload is another 9228 host bytes. Allocation and library overhead are additional. The proposed 769-byte allocation is too short even if its logical Python view claims 769 elements.

Pass the three device Buffers as pointers, `ctypes.c_uint32(n)` for the unsigned 32-bit count, and `ctypes.c_float(alpha)` for the 32-bit float. On the selected x86-64 core path, raw Python int packs at pointer width and raw float as double. Even exactly representable 0.5 does not fix a representation-width mismatch. Reject nonpositive and out-of-uint32 counts before conversion; the byte/memory budget and supported launch dimensions impose additional bounds on otherwise representable counts.

The grid is `(769+255)//256=4`, not 3. Blocks 0 through 2 cover indices 0 through 767; block 3 has one useful thread at index 768 and 255 inactive threads. There are 1024 candidate threads, 769 writes, and a pre-access bounds check. n=0 is rejected by this exercise's positive-count contract; a separately documented no-op is possible but never a zero-grid launch. Negative or oversized counts must not be wrapped.

The first five outputs are `[2,0,-2,8,0]`: the last is `0.25+0.5*(-0.5)=0`. They are independent mathematical references, not a full result verdict. Initialize explicit pinned inputs, copy to equal-size device Buffers, launch, then use `d_out.copy_to(h_out, stream=s)` with an explicit pinned destination. Create the ctypes view only over `int(h_out.handle)`, retain h_out, call `s.sync()`, and check every finite output. `copy_to` without a destination can allocate device storage, so no CPU address interpretation is justified.

## Solution 2: A failed drain is still a failed operation

`dev.set_current()` returns None in the default primary-context path. Inspect `dev.context` separately. The primary context is shared core-managed state, not owned exclusively by this process's helper. Buffers and the explicit stream are owned resources; host views and exposed handles are borrowed. Kernel/ObjectCode share CUDA library ownership, with Kernel retaining the library.

On normal success the order is `D2H -> s.sync() -> compare -> stop using/drop host views -> buffer.close(stream=s) -> s.sync() -> s.close()`. Keep owners through their last use and the stream through queued frees. Program/Linker may close earlier after independent output bytes exist. ObjectCode/Kernel have no public close; drop references after work completes without promising immediate teardown.

In the hypothetical failure, the D2H exception is the first observed error, possibly caused by the preceding asynchronous launch. Preserve its stage, type/message and traceback; preserve the subsequent sync failure separately. Stop new submission. Attempt cleanup only for resources actually acquired, with their owners retained while draining is attempted. A fatal asynchronous failure may make cleanup fail too. Do not inspect output as valid, declare healthy state, or print success; terminate nonzero with secondary diagnostics retained.

Closing s first removes the intended deallocation stream. Raw address frees risk double-free against core ownership. `ObjectCode.handle` is CUlibrary, so `cuModuleUnload` has the wrong handle kind as well as the wrong ownership. Resetting the primary context may invalidate other users; closing a current Context is rejected. Neither Device nor Kernel nor ObjectCode has the proposed public close step. Buffer cleanup can warn rather than raise every failure, so retain stderr/warnings and explicit sync errors rather than promising that a catch block sees all release problems.

## Valid alternatives

Changing block size is valid after recomputing ceiling coverage and checking device limits; it is not a performance improvement without measurement. A device-wide `dev.sync()` can establish a broader completion boundary than a stream sync, but may wait for unrelated work and still must be checked. An embeddable library needs caller-context preservation; this standalone solution must not be promoted into a general context-switching contract.

## Common errors

- Confusing element count with byte capacity or a view's declared length with a real allocation.
- Using raw Python scalars because their numerical values are small, while ignoring the ABI width.
- Rounding the grid down and losing the last element; bounding only the store while inputs remain unguarded.
- Inferring host storage from a variable name or omitted-destination copy.
- Releasing a shared context or core-owned library through borrowed handles.
- Treating a CPU reference pass or cleanup attempt as successful GPU completion.

Return to [P02](/en/python/devices-contexts-launches/) and [EX21](/en/examples/cuda-python-launch/). Sources: [SRC-CUDA-077](/en/sources-and-versions/#src-cuda-077), checked **2026-09-12**; EX21 remains Pending Hardware Verification.
