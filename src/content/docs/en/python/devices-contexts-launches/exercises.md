---
title: 'P02 Exercises: Prove the ABI and Last Use'
description: Derive launch and scalar contracts for an uneven input, then repair partial-submission cleanup without destroying shared context state.
pairId: p02-exercises
counterpart: /python/devices-contexts-launches/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: P02-EXERCISES
prerequisites: [P02]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Core Buffer ownership and copy implementation'
    url: 'https://github.com/NVIDIA/cuda-python/blob/53b43746e501f1a0b627f951604991636f77cd9c/cuda_core/cuda/core/_memory/_buffer.pyx'
    version: 'cuda-core 1.2.0'
    platform: 'Static buffer, copy, scalar and lifetime review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p02-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/python/devices-contexts-launches/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P02-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P02 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/python/devices-contexts-launches/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [P02](/en/python/devices-contexts-launches/), exactly `[P02]`. These are paper Exercises with no GPU requirement and four empty evidence arrays. Follow `P02 -> P02-EXERCISES -> P02-SOLUTIONS`.

## Submission requirements

Submit parameter/storage ledgers, a geometry proof, and success/failure lifetime diagrams before opening the [solutions](/en/python/devices-contexts-launches/solutions/). Do not execute deliberately invalid accesses. This worksheet proposes a variation, not a second canonical EX21 or a request to change its source.

## Exercise 1: Width is part of the function signature

**Goal:** Specify a safe host contract for a hypothetical `out[i]=a[i]+alpha*b[i]` kernel with parameters `(const float*, const float*, float*, unsigned int n, float alpha)`.

**Constraints:** n=769, block=256, three separately allocated device arrays and three pinned host arrays. Alpha is 0.5. The first five a/b values are `[1,-2,0,8,0.25]` and `[2,4,-4,0,-0.5]`; the remaining inputs are finite binary-exact small values. A proposal allocates 769 bytes per array, passes raw Python `769` and `0.5`, uses grid `n//256`, and calls `d_out.copy_to(stream=s)` before creating a CPU view of the returned Buffer. Require positive counts representable by uint32; do not rely on ctypes conversion wrapping values.

**Expected evidence:** Repair every byte count, pointer/scalar representation, launch dimension, copy destination, and view ownership. Derive the first five outputs, useful/tail threads, and total payload by memory location. Explain the independent handling of n=0, negative n, and n greater than the uint32 range.

**Acceptance criteria:** All intended indices have exactly one writing thread and no tail access. Every transfer uses equally sized Buffers and explicit host destinations. A host view is only made over host-accessible storage whose owner remains alive. Raw Python scalar packing is not accepted as a signature match. Compare every finite result after `s.sync()`; do not treat five matching sample values as a full-run verdict.

<details><summary>Hint 1: Separate elements, bytes, and scalar representation</summary>Float32 storage uses four bytes per element. A Python value's type is not automatically inferred from the CUDA C++ declaration.</details>

<details><summary>Hint 2: Cover the last logical index</summary>Compute the block containing index 768, then count unused threads. A Buffer returned from omitted-destination copy may still use the device resource.</details>

## Exercise 2: Repair cleanup after partial submission

**Goal:** Define ownership-safe success and failure paths without inventing destruction APIs.

**Constraints:** A standalone process selects `dev=Device(0)` and then `ctx=dev.set_current()`. It owns one stream s and six Buffers; host views borrow the pinned Buffers. H2D and launch have been submitted. The D2H call raises; a later attempted sync also raises. Proposed cleanup first closes s, then calls `close()` on Kernel/ObjectCode/Device, unloads `ObjectCode.handle` with `cuModuleUnload`, frees raw Buffer addresses, and resets the primary context. A catch-all then prints success because the CPU reference passed earlier. No actual failure was observed; this is a hypothetical trace.

**Expected evidence:** Classify acquired, borrowed, and shared resources; correct the meaning of ctx; draw the normal completed path and the failed-completion path. Identify the original error and secondary diagnostics to preserve. State which resources have public close operations and when they can be used, and why cleanup cannot establish a valid output after failed completion.

**Acceptance criteria:** Do not close the stream before stream-dependent Buffer release, double-free through raw handles, unload core-owned libraries, or reset shared primary state. Use `sync()`, not `synchronize()`. Preserve failure and exit nonzero; cleanup warnings and failed drains must not be converted into successful verification. Do not assume `del` guarantees immediate native destruction.

<details><summary>Hint 1: Owning a wrapper and borrowing a handle differ</summary>The default `set_current()` returns None. Query `dev.context` to inspect the shared primary context, not to obtain permission to destroy it.</details>

<details><summary>Hint 2: The observing API is not necessarily the cause</summary>A D2H call can report an earlier asynchronous launch error. Keep that first observed failure while attempting later cleanup; the failed sync does not erase it.</details>

## Next

Read the [solutions](/en/python/devices-contexts-launches/solutions/) and [PB-R5-002](/en/practice/#pb-r5-002). [SRC-CUDA-077](/en/sources-and-versions/#src-cuda-077) provides exact scalar, Buffer, context, and library-lifetime references, reviewed **2026-09-12**. Original worksheet inputs and diagnostics scenarios are not owner tests or observed [EX21](/en/examples/cuda-python-launch/) results.
