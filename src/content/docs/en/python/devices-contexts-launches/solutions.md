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

The worked transfer preserves the same request's C++ responsibilities while changing its host representation:

| C++ responsibility for this request | Python plan and semantic boundary |
| --- | --- |
| `cudaSetDevice(0)` selects/initializes the Runtime primary-context path; an explicit Driver owner instead retains a CUcontext and makes it current | `Device(0)` plus `dev.set_current()` selects core's shared primary context. Inspect `dev.context`, not the None return value; no exclusive reset authority is gained. |
| `cudaStreamCreateWithFlags` with `cudaStreamNonBlocking` creates the request's queue | `dev.create_stream(options=StreamOptions(nonblocking=True))` gives the owned s used throughout. Removing legacy NULL-stream ordering is not proof of overlap. |
| `cudaMalloc` or `cudaMallocAsync` obtains each 3076-byte device array; `cudaMallocHost` obtains each host array | Three `dev.allocate(3076, stream=s)` Buffers and three legacy-pinned 3076-byte Buffers preserve the 9228-byte payload per location. Core's resource choice may be synchronous; ctypes views borrow only host storage. |
| `cudaMemcpyAsync` submits 3076-byte H2D/D2H transfers with explicit endpoints and directions | Use `d_a.copy_from(h_a, stream=s)`, the corresponding b copy, then after the kernel `d_out.copy_to(h_out, stream=s)`. Each pair has equal capacity; stable host contents and owners outlive the transfers. |
| A registered Runtime symbol, or `cuModuleGetFunction` returning CUfunction, supplies the intended kernel | Obtain a Kernel for this hypothetical five-argument signature. Core's ObjectCode owns a CUlibrary through shared references, not a caller-owned legacy CUmodule. The unchanged EX21 kernel has no alpha parameter and cannot simply receive a fifth argument. |
| `kernel<<<4, 256, 0, stream>>>(...)` or `cuLaunchKernel` supplies exact parameter representations | `LaunchConfig(grid=4, block=256)` and `launch` use the three Buffers, `ctypes.c_uint32(769)` and `ctypes.c_float(0.5)`. Both the 769-element guard and correct scalar widths are required. This is a plan, not a new implementation. |
| `cudaStreamSynchronize(stream)` completes the asynchronous D2H before a C++ host comparison | `s.sync()` must succeed before comparing all 769 finite results. A copied pointer or successful launch return is insufficient; any failure prevents a valid-output verdict. |

This is not a textual API rename. C++ fixes scalar representation at its typed call boundary; the Python host states those widths explicitly. Runtime copy calls expose a byte count and direction; these core calls copy equal complete Buffer extents. The mathematical reference, last-use proof and complete comparison survive both changes.

## Solution 2: A failed drain is still a failed operation

`dev.set_current()` returns None in the default primary-context path. Inspect `dev.context` separately. The primary context is shared core-managed state, not owned exclusively by this process's helper. Buffers and the explicit stream are owned resources; host views and exposed handles are borrowed. Kernel/ObjectCode share CUDA library ownership, with Kernel retaining the library.

On normal success the order is `D2H -> s.sync() -> compare -> stop using/drop host views -> buffer.close(stream=s) -> s.sync() -> s.close()`. Keep owners through their last use and the stream through queued frees. Program/Linker may close earlier after independent output bytes exist. ObjectCode/Kernel have no public close; drop references after work completes without promising immediate teardown.

In the hypothetical failure, the D2H exception is the first observed error, possibly caused by the preceding asynchronous launch. Preserve its stage, type/message and traceback; preserve the subsequent sync failure separately. Stop new submission. Attempt cleanup only for resources actually acquired, with their owners retained while draining is attempted. A fatal asynchronous failure may make cleanup fail too. Do not inspect output as valid, declare healthy state, or print success; terminate nonzero with secondary diagnostics retained.

Closing s first removes the intended deallocation stream. Raw address frees risk double-free against core ownership. `ObjectCode.handle` is CUlibrary, so `cuModuleUnload` has the wrong handle kind as well as the wrong ownership. Resetting the primary context may invalidate other users; closing a current Context is rejected. Neither Device nor Kernel nor ObjectCode has the proposed public close step. Cleanup diagnostics may arrive through exceptions, Python warnings or native stderr; a Python catch or warning handler alone is incomplete. EX21's explicit `cleanup_step` redirects Python stderr and FD 2 together, restores both, keeps exceptions/capture failures in `cleanupErrors`, and retains every nonempty captured stderr payload in `cleanupWarnings`. The hypothetical failure trace remains a paper exercise, not an observed cleanup run.

The per-action retained byte payload is at most 16,384 bytes, with one additional byte read for truncation detection; decoded text is capped at 16,384 characters, plus a label/marker. This is not a bound on the temporary file's disk growth or on all messages across all actions. Capture/replay errors fail cleanup too, without replacing the first operation error or skipping an unattempted release. Explicit code-reference drops are captured, but other retained references, later GC, deferred native output and interpreter-shutdown destructors can run outside that scope. They are not covered by a previously issued clean verdict; keep external process stderr as well as JSON. The helper's global-state changes are not safe general-purpose concurrency support.

| C++ owner obligation | What transfers to the repaired core cleanup |
| --- | --- |
| Release its `cudaMalloc` storage with `cudaFree`, or order `cudaFreeAsync` correctly for its stream-ordered allocation | Close owned device Buffers with `buffer.close(stream=s)` after last use; the memory resource controls native release. Never call a second raw free on core-owned addresses. |
| Retain `cudaMallocHost` storage through transfers and CPU reads, then `cudaFreeHost` | Stop using/drop ctypes views before closing pinned Buffers. A view being in scope is not ownership, and a completed kernel is not necessarily a completed D2H. |
| Check stream completion before depending on output, then call `cudaStreamDestroy` when finished | Check `s.sync()`, release Buffers, drain queued frees, then `s.close()`. Destruction itself is not checked completion on either host path. |
| Balance its own `cuDevicePrimaryCtxRetain` with `cuDevicePrimaryCtxRelease`, while managing current-thread binding separately | Core owns its retain. A caller inspecting `dev.context` must not release it on core's behalf. Retain/release and make-current/unbind are different operations; neither authorizes a shared-context reset. |
| If it owns a Driver CUmodule, retain it through users and eventually `cuModuleUnload`; traditional Runtime module management is not that ownership contract | Core Kernel/ObjectCode retain a CUlibrary through shared ownership. Drop references after use without inventing public close or manually unloading a borrowed library handle. |

Both languages must preserve the first observed failure through cleanup. C++ status checks or RAII and Python finally/close syntax are control-flow tools, not proofs of successful release. A failed drain remains a failed operation even if later releases appear to succeed.

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
