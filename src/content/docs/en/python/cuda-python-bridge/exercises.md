---
title: 'P01 Exercises: Audit the Bridge and Its Evidence'
description: Repair a queued-result ownership proposal and evaluate a pinned environment and hypothetical amortization model without claiming a GPU run.
pairId: p01-exercises
counterpart: /python/cuda-python-bridge/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: P01-EXERCISES
prerequisites: [P01]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'CUDA core installation and support boundary'
    url: 'https://nvidia.github.io/cuda-python/cuda-core/1.2.0/install.html'
    version: 'cuda-core 1.2.0'
    platform: 'Static Python bridge and dependency audit, not execution'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p01-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/python/cuda-python-bridge/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P01-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P01 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-core-1.2.0 } }
---

<a class="locale-pair" data-locale-counterpart href="/python/cuda-python-bridge/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [P01](/en/python/cuda-python-bridge/), exactly `[P01]`. These original paper Exercises need no GPU, package installation, or CUDA execution. Their evidence arrays remain empty. The chain is `P01 -> P01-EXERCISES -> P01-SOLUTIONS`.

## Submission requirements

Submit a layer/ownership diagram, independent arithmetic, a profile audit, and a conditional cost derivation before opening the [solutions](/en/python/cuda-python-bridge/solutions/). Values below are worksheet inputs, not measured performance or EX21 output. Use the selected profile only; adding another Toolkit version is not a repair.

## Exercise 1: A returned view is not a completed result

**Goal:** Repair a Python service proposal while preserving the distinction between CPU work, submitted CUDA work, and completed output.

**Constraints:** One request adds five float32 values: `a=[1,-2,0.5,4,0]`, `b=[1,1,-0.5,4,-0.5]`. The proposed function initializes pinned host inputs, computes a Python reference, queues H2D, launches a bounds-checked kernel with block size 256, and queues D2H. It returns only a ctypes view of the pinned output, drops all Buffer/stream/kernel owners, and lets a caller compare immediately. The author calls the Python reference “GPU execution” because the process imported CUDA Python. Treat argument packing and the kernel body as otherwise correct.

**Expected evidence:** Classify each operation by execution location; derive all five output values, grid/tail counts, and separate host/device payload bytes. Draw the minimum lifetime and completion dependencies for both a blocking-return design and an asynchronous-result design. Explain what the latter must own without inventing a new CUDA API.

**Acceptance criteria:** The Python reference remains CPU work. Both designs retain storage and code owners through queued uses, require checked D2H completion before CPU inspection, and fail instead of returning a valid-looking result when completion fails. A view alone is insufficient ownership. Byte totals exclude context/library overhead; paper arithmetic supplies no runtime evidence.

<details><summary>Hint 1: Follow uses after the function returns</summary>H2D still reads host inputs and D2H still writes host output. A local variable disappearing does not cancel those queued uses.</details>

<details><summary>Hint 2: Separate ownership from readiness</summary>A future-like application object could retain resources but must also have a checked completion operation. Retaining storage alone does not make the output ready to read.</details>

## Exercise 2: Audit a profile and a performance claim

**Goal:** Reject unjustified compatibility/evidence claims and solve a clearly hypothetical reuse model.

**Constraints:** A proposal installs ordinary CPython 3.14.7 and bindings 13.4.1, leaves core/pathfinder/NumPy unpinned, and adds `[cu13]` extras. It assumes the system Toolkit 13.3.1 determines every native library loaded, says NumPy can be removed because the example does not import it, and labels a host-test pass Runtime-Verified. Repair it to P01's one native Linux x86-64 profile. Separately, assume a bridge has a one-time setup cost of 1800 time units plus 80 per request, while a matched CPU path costs 170 per request. These are supplied model values, not observations; both paths are assumed to solve the same accepted problem.

**Expected evidence:** An exact interpreter/package/native-component/driver ledger; the boundary of a hashed wheel lock; evidence still missing after host tests and after native compilation/linking; the first integer reuse count giving strict improvement; the result if setup repeats for every request.

For the native ledger, use EX21's five pinned NVIDIA Ubuntu Toolkit deb records, its separate driver-userspace package record, and ownership of the resolved compiler/linker files. Explain why a missing Toolkit `version.json` is not a reason to reject this installation family or create a replacement file. Distinguish installed package versions, API major/minor queries and actual library hashes; no runfile alternative or successful import is supplied by the scenario.

**Acceptance criteria:** Keep core 1.2.0, bindings 13.4.1, pathfinder 1.8.1, NumPy 2.5.3, native NVRTC/nvJitLink 13.3.33, Toolkit 13.3.1, Ubuntu 24.04, and driver target 610.43.02 separate. Require actual loaded-library identities. Distinguish a policy-supported API subset from every binding being compatible. Do not convert the cost inequality or any non-GPU check into a measured speedup or Runtime-Verified status.

<details><summary>Hint 1: A package version is not a loader trace</summary>Wheel pins and hashes identify Python artifacts. They do not freeze the system driver, interpreter build, native library search result, or GPU.</details>

<details><summary>Hint 2: Write both totals</summary>Compare `1800+80*R` with `170*R`; a tie is not a strict improvement. If setup repeats, put it inside the multiplication by R.</details>

## Next

Review the [separate solutions](/en/python/cuda-python-bridge/solutions/) and [PB-R5-001](/en/practice/#pb-r5-001). Source basis: [SRC-CUDA-077](/en/sources-and-versions/#src-cuda-077) and [SRC-CUDA-079](/en/sources-and-versions/#src-cuda-079), checked **2026-09-12**. Original scenarios and hints; no owner exercise is copied. [EX21](/en/examples/cuda-python-launch/) retains independent Pending Hardware Verification runtime.
