---
title: 'M01 Reviewed Solutions: Issue Memory-Object Responsibility Contracts'
description: Owner/scope/lifetime ledgers, release repairs, and reviewable placement rewrites for the three M01 Exercises.
pairId: m01-solutions
counterpart: /memory/address-spaces/solutions/
factCheckDate: '2026-08-27'
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
unitId: M01-SOLUTIONS
prerequisites:
  - M01-EXERCISES
relatedUnits:
  - M01
  - VIS06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m01-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M01-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M01,VIS06' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/address-spaces/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [M01 Exercises](/en/memory/address-spaces/exercises/). Compare responsibility boundaries before terminology. Every result is a static review; no CUDA build or run occurred.

## Solution 1: Complete a six-object ledger

| object | creator / owner | sharing scope | lifetime / release | physical / unresolved fact |
| --- | --- | --- | --- | --- |
| `std::vector<float>` | host-language object | host scope | C++ object lifetime; destructor manages it | host memory; device access is unestablished |
| `cudaMalloc` buffer | host Runtime call | device threads with a valid pointer can share it | `cudaFree` after the last use completes | global/device memory; cache behavior unmeasured |
| `__constant__` coefficients | module/context symbol | grid-readable; host updates through symbol APIs | module/context managed, not `cudaFree` | device constant space; exact cache behavior unmeasured |
| `__shared__` tile | each block's declaration/launch storage | owning block | ends automatically at block completion | shared resource; capacity depends on device/kernel |
| local array | compiler-managed for one thread | owning thread | ends automatically with thread invocation | physical device memory; placement is compiler-decided |
| scalar accumulator | source value assigned by compiler | owning thread | ends automatically with thread invocation | may use a register or spill to local |

The key distinction is between the local array's **scope** and **location**. Physical device memory does not make it a globally shared object. The accumulator has only source semantics until a compiler artifact establishes placement.

## Solution 2: Repair a broken release plan

The four defects are independent: launch return does not prove the global buffer's last use complete; the host does not own per-block shared allocations; a thread does not call a Runtime free on compiler-managed local storage; and a constant symbol is neither created nor released on each block's lifetime.

The repaired order is:

1. The host creates and initializes `d_data` and records the allocation owner.
2. Launch the kernel and check launch state under F04.
3. After the last device user of `d_data`, establish completion proof through the required synchronization boundary and successful status.
4. Complete result transfer and verification if needed.
5. The host calls matching `cudaFree` exactly once for `d_data`.
6. Shared/local storage ends with block/thread completion; the constant symbol remains until module/context teardown.

This plan establishes release responsibility. Because it was not executed, it proves no call succeeded.

## Solution 3: Rewrite placement claims as reviewable contracts

1. **Register:** A scalar is a thread-private source value. The compiler may place it in a register or spill it to local because of target, liveness, and pressure. Inspect a compiler artifact/resource report; measure separately if cost is the question.
2. **Local:** Local is a thread-private address space physically in device memory. It is not a “per-thread cache,” and its name creates no fastest verdict. Inspect compiler placement and the actual access pattern.
3. **Shared/L1:** Shared scope remains a block and lifetime remains block/kernel execution. Capacity and shared/L1 configuration come from the selected device and kernel. Queries still do not replace correctness and measurement.

Each rewrite separates stable semantics, an environment fact, and a performance question, so no table becomes runtime evidence.

## Valid alternatives

- Split owner from allocator and scope from accessibility into additional ledger columns, provided they are not collapsed into one vague “where.”
- Express `cudaFree` responsibility through an RAII wrapper, provided the wrapper is destroyed only after last-use completion.
- Verify placement with compiler diagnostics, a resource report, or binary inspection; each method records the exact Toolkit, target, and kernel.
- Refine constant lifetime into a module/context ledger, provided no per-block `cudaFree` is invented.

## Common errors

- Treating local's thread-private scope as proof of on-chip physical placement.
- Treating per-block shared instances as one allocation shared by every block.
- Releasing a global allocation before asynchronous device use completes.
- Calling a nonexistent matching `cudaFree` for shared, local, register, or a constant symbol.
- Claiming register placement, fixed latency, or a fastest space from a source scalar, address-space name, or static table.

Reviewed: **2026-08-27**. These solutions change no resource's Evidence Status.
