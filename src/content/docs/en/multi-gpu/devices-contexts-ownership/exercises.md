---
title: 'G01 Exercises: Prove Resource Ownership'
description: Repair a multi-thread ownership trace and implement independently checked two-device work.
pairId: g01-exercises
counterpart: /multi-gpu/devices-contexts-ownership/exercises/
factCheckDate: '2026-09-19'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: G01-EXERCISES
prerequisites: [G01]
relatedUnits: []
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'CUDA Runtime context management', url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-runtime-api/driver-vs-runtime-api.html', version: '13.3.1', platform: 'native Linux', accessDate: '2026-09-19' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: g01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/multi-gpu/devices-contexts-ownership/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-19' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: G01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: G01 } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: none } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/multi-gpu/devices-contexts-ownership/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites and instructions

Exact prerequisite **[G01]**: [devices and ownership](/en/multi-gpu/devices-contexts-ownership/). Reviewed 2026-09-19; [SRC-CUDA-094](/en/sources-and-versions/#src-cuda-094). Paper work needs no hardware. Execution requires the complete G01 native Linux/two-GPU gate and Environment Manifest, including each exact CC, memory, driver, Toolkit, process model, peer compatibility, topology source and permissions. Missing hardware means Pending Hardware Verification.

## Exercise 1: repair a synthetic ownership trace

**Goal:** annotate and repair this proposed trace without running invalid operations: the coordinator selects B, creates stream sB, starts a fresh worker, and asks it to launch into sB without selecting a device. The coordinator joins the worker and frees the result while the worker only submitted asynchronous work. A plugin then resets B to clean up its own allocation.

**Constraints:** one process, ordinary primary contexts, two host threads and two distinct devices; no explicit Driver context. Draw a row for each allocation/stream/event with its owner, selected device, final consumer and release boundary. Also explain what changes if the worker becomes a separate process. Do not infer identity from ordinal zero.

**Acceptance:** the repair explicitly selects B in the worker, separates host join from device completion, prevents premature release and replaces reset with owned-resource cleanup. The process variant rejects raw pointer/stream sharing. Explain why host-side repair grants neither compilation nor runtime evidence.

<details><summary>Hint 1: selection has a scope</summary>The coordinator's device selection is not a process-wide assignment. Identify which thread makes each call.</details>
<details><summary>Hint 2: two kinds of completion</summary>A worker can return after enqueueing work. Add the GPU completion boundary before the final resource user releases ownership.</details>

## Exercise 2: implement two independent device owners

**Goal:** implement G01's 257-element `uint32_t` formula first with one submitting thread, then with two workers. The CPU oracle is `1000*d+i` for each selected local ordinal d.

**Constraints:** enumerate and validate both devices before allocations. Use distinct buffers/streams, explicit device selection, ceiling grid size and bounds checks. Keep every allocation alive until all users finish. Record all errors, selected mappings and per-device completion. Peer access is not required; still record queried compatibility or explicitly unknown, never assumed. Use the exact G01 external profile.

**Acceptance:** exact-compare all 257 elements per GPU in both variants; reject fewer than two devices and unsupported target/driver/memory configurations. Retain source, build command, full manifest and actual results separately from expected criteria. If blocked, submit the ownership ledger, implementation and blocker without a fabricated pass. Neither browser tests nor source review upgrade Pending Hardware Verification.

<details><summary>Hint 1: make assignment observable</summary>Include the assigned ordinal in the expected value so silently using the same device cannot be hidden by identical data; also retain identity mappings.</details>
<details><summary>Hint 2: release in reverse dependency order</summary>Wait for the final GPU use, validate the result, then destroy the owning device's resources. A successful launch check alone is insufficient.</details>

## Review separately

Attempt both tasks before the [solutions](/en/multi-gpu/devices-contexts-ownership/solutions/). Then audit [PB-R6-001](/en/practice/#pb-r6-001).
