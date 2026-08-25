---
title: 'O04 Exercises: Review Lifetime and Host/Device Boundaries'
description: Review one ownership timeline and one host/device build and error design without executing CUDA.
pairId: o04-exercises
counterpart: /start/cpp17-for-cuda/exercises/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - next
resourceKind: exercise-set
unitId: O04-EXERCISES
prerequisites:
  - O04
relatedUnits:
  - O04
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o04-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O04-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O04 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O04 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/cpp17-for-cuda/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [O04: C++17 Refresher for CUDA Learners](/en/start/cpp17-for-cuda/) first. These two Exercises are source and design reviews. They require no GPU, build, sanitizer run, or unpublished implementation.

## How to answer

Produce a reviewable artifact before opening hints in order. Keep pointer value, pointee lifetime, owner, compilation stage, and error channel as separate fields. Full answers live on the separate [reviewed-solutions page](/en/start/cpp17-for-cuda/solutions/).

## Exercise 1: Review a lifetime and ownership timeline

An RAII host object owns an allocation and exposes a raw `float* view`. Host code submits work that may use `view` later, destroys the owner, and only then reaches the planned completion boundary.

**Goal:** Review the sequence and rewrite its lifetime contract so every use of `view` occurs while the allocation is valid.

**Constraints:** Treat `view` as non-owning; do not assume owner destruction changes the copied pointer value or sets it to `nullptr`; do not run code; preserve an explicit completion boundary.

**Expected evidence:** A timeline naming the owner, the non-owning view, the last possible use, the allocation-release event, the invalid interval, and one corrected ownership sequence.

**Acceptance criteria:** Separate pointer value from pointee lifetime; identify the first point at which the view can dangle; keep the RAII owner alive through completion or transfer it to an object that does; carry the required extent; make no runtime or performance claim.

<details><summary>Hint 1</summary>Draw one line for the pointer object and another for the allocation it designates.</details>

<details><summary>Hint 2</summary>Place the last permitted access and the release event on the same timeline before changing any interface.</details>

## Exercise 2: Review host/device build and error boundaries

A header declares `template<class T> __host__ __device__ T convert(T);`. Its generic definition exists only in a `.cpp` file and contains `throw`. A `.cu` translation unit uses `convert<float>` on a device path, while a host wrapper discards a CUDA Runtime return value. The review note says preprocessing passed.

**Goal:** Produce a boundary review that makes the required template specialization available, keeps exceptions on the host, and preserves explicit CUDA error handling.

**Constraints:** Do not compile or execute the scenario; distinguish preprocessing, host compilation, device compilation, optional device linking, and host linking; do not replace a `cudaError_t` result with an unrecorded exception.

**Expected evidence:** A stage table locating each defect, followed by a corrected file-placement, annotation, and host error-policy design.

**Acceptance criteria:** Explain why a declaration alone does not provide an implicit instantiation; account for both targets of `__host__ __device__`; remove exception handling from the device path; check and preserve every required CUDA error code at the host boundary; state that successful build stages would not prove execution.

<details><summary>Hint 1</summary>For each stage, list the exact source or definition visible to that stage.</details>

<details><summary>Hint 2</summary>Review the template body once as host code and once as device code, then review the Runtime call separately.</details>

## Next step

Finish both reviews independently, then compare reasoning with the [reviewed solutions](/en/start/cpp17-for-cuda/solutions/) and continue to [Practice Bank PB-R1-001](/en/practice/#pb-r1-001).
