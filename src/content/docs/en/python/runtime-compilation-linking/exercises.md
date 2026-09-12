---
title: 'P03 Exercises: Audit Artifacts and Error Surfaces'
description: Repair a GPU-free build plan and design separate NVRTC-status and nvJitLink-exception handling with exact resource ownership.
pairId: p03-exercises
counterpart: /python/runtime-compilation-linking/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, next]
resourceKind: exercise-set
unitId: P03-EXERCISES
prerequisites: [P03]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'Stable NVRTC binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvrtc.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Status-first compiler contract; static review'
    accessDate: '2026-09-12'
  - title: 'Stable nvJitLink binding'
    url: 'https://github.com/NVIDIA/cuda-python/blob/0770ab6ced8931ae8b6c6e5f622f48cb07ea99fa/cuda_bindings/cuda/bindings/nvjitlink.pyx'
    version: 'cuda-bindings 13.4.1'
    platform: 'Exception and writable-output linker contract; static review'
    accessDate: '2026-09-12'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p03-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/python/runtime-compilation-linking/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P03-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P03 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '2' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: cuda-bindings-13.4.1 } }
---

<a class="locale-pair" data-locale-counterpart href="/python/runtime-compilation-linking/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [P03](/en/python/runtime-compilation-linking/), exactly `[P03]`. These original paper Exercises need no GPU or compiler execution and retain four empty evidence arrays. The chain is `P03 -> P03-EXERCISES -> P03-SOLUTIONS`.

## Submission requirements

Submit artifact and error-flow tables before reading the [solutions](/en/python/runtime-compilation-linking/solutions/). Use core 1.2.0, bindings 13.4.1, and native NVRTC/nvJitLink 13.3.33 from the single profile. No supplied log size, status scenario, or artifact description below is an observed run.

## Exercise 1: Keep the no-GPU boundary intact

**Goal:** Repair a build plan while retaining an explicit PTX-to-cubin link stage.

**Constraints:** A build worker has the selected Python packages and native compiler/linker libraries but no GPU. Its proposed plan queries `Device(0).arch`, compiles source with `compute_75`, extracts a cubin directly from that virtual-target compilation, calls `ObjectCode.load()`, and marks EX21 Runtime-Not-Applicable because no kernel was launched. A second proposal compiles directly to cubin with `sm_75`, names that step “explicit nvJitLink,” and caches the result under only the entry-point name.

The native libraries come from the selected NVIDIA Ubuntu deb installation, which has no Toolkit `version.json`. Add a profile-identity stage based on EX21's five Toolkit packages, its independently pinned driver-userspace package, and file ownership rather than fabricating that file or introducing a runfile fallback. The supplied scenario does not establish successful driver userspace loading or imports.

Carry over EX21's cache-disabled configuration as well: default NVRTC caching can invoke `cuInit()` independently of Device construction. State where `CUDA_CACHE_DISABLE=1` is set and which core options disable caching; do not infer no initialization solely from the absence of a GPU launch.

**Expected evidence:** Rewrite the first plan as a stage/inputs/outputs table compatible with `build --arch 75`; identify every rejected step and separate later runtime obligations. Contrast the direct-cubin alternative without mislabelling it. Define minimum identity fields for a hypothetical artifact cache and show why changing source while preserving the function name must invalidate the old entry.

**Acceptance criteria:** The build target is explicit, not device-derived. PTX compilation uses a virtual target and relocatable device code; `Linker(ptx, options=...)` links for the real target and verifies the nvJitLink backend. No lookup, device initialization, launch, or sync is added to the build. Nonempty artifact checks do not prove load or correctness. A cache design grants no unmeasured speedup or blanket cross-device compatibility.

<details><summary>Hint 1: List producers, not filenames</summary>NVRTC produces the selected PTX; explicit Linker produces cubin. A filename extension cannot create a missing production stage.</details>

<details><summary>Hint 2: Ask what must change a key</summary>Consider source bytes, compiler and linker identity, options, target, and backend. Reconstructing ObjectCode from bytes is not loading it.</details>

## Exercise 2: One wrapper cannot unpack both APIs

**Goal:** Specify error handling that preserves the first failure, acquires/destroys resources exactly once, and uses correct output storage.

**Constraints:** A proposed generic wrapper always unpacks `(status, value)`. It calls `nvrtcCreateProgram(source)` with one argument, uses immutable `bytes(size)` for nvJitLink output, and destroys the linker before trying to read an error log. Review three hypothetical cases: A, NVRTC compilation returns `NVRTC_ERROR_COMPILATION` and log-size retrieval also fails; B, nvJitLink create raises before returning a handle; C, create succeeds, complete raises, the error-log size query succeeds with 17 bytes, log retrieval succeeds, and destroy also raises. No exact diagnostic text is supplied.

**Expected evidence:** Correct creation signatures and return shapes for both APIs, success-output paths, a per-case primary/secondary diagnostic ledger, and which cleanup/log calls are legal. Explain successful core compilation logs versus exception-carried diagnostics after failed core compilation.

For the canonical CLI's explicit cleanup, also distinguish Python stderr/FD 2 capture from eventual destructor coverage. A bounded retained diagnostic payload is not a temporary-disk bound or a guarantee to observe output emitted by later GC/shutdown after the verdict.

**Acceptance criteria:** Check every NVRTC status; do not treat nvJitLink values as status tuples. A valid linker uses queried-size `bytearray` output and is destroyed once in a finally path. Case B cannot query logs or destroy an unacquired handle; case C preserves complete failure as primary even when cleanup fails. Missing libraries and Python argument errors remain distinct. Do not invent log contents or import private core error classes.

<details><summary>Hint 1: Enumerate the actual result shapes</summary>NVRTC compile returns a one-item tuple. nvJitLink create returns an integer, complete returns None, and version returns two version numbers without a status.</details>

<details><summary>Hint 2: Read diagnostics while the owner exists</summary>A valid failed linker can still own a log. Allocate the queried writable size, retain the original exception, and treat failures while reporting or cleaning up as secondary.</details>

## Next

Compare the [solutions](/en/python/runtime-compilation-linking/solutions/) and [PB-R5-003](/en/practice/#pb-r5-003). Sources: [SRC-CUDA-077](/en/sources-and-versions/#src-cuda-077), [SRC-CUDA-078](/en/sources-and-versions/#src-cuda-078), and [SRC-CUDA-079](/en/sources-and-versions/#src-cuda-079), checked **2026-09-12**. [EX21](/en/examples/cuda-python-launch/) remains Pending Hardware Verification; these scenarios grant neither compilation nor runtime evidence.
