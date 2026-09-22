---
title: 'H02: Ampere Pipelines and Tensor Core Contracts'
description: Compare an explicitly synchronized baseline with gated asynchronous copies, split barriers and numerical paths.
pairId: h02
counterpart: /architecture/ampere-pipelines-tensor-cores/
factCheckDate: '2026-09-22'
license: CC-BY-4.0
provenance: original
structure: [outcome, prerequisites, baseline, history, pipeline, barriers, tensor, gates, tuning, evidence, retrieval, practice, sources]
resourceKind: learning-unit
unitId: H02
prerequisites: [H01, M13, L08]
relatedUnits: [VIS15]
hardwareGate: none
estimatedMinutes: 45
difficulty: advanced
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Ampere Tuning Guide', url: 'https://docs.nvidia.com/cuda/ampere-tuning-guide/index.html', version: '13.4', platform: 'Source review; CC 8.x', accessDate: '2026-09-22' }
  - { title: 'Asynchronous Data Copies', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-ldgsts', version: '13.4.2', platform: 'Source review; global to shared', accessDate: '2026-09-22' }
  - { title: 'Asynchronous Barriers', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-barriers.html', version: '13.4.2', platform: 'Source review; phases and participation', accessDate: '2026-09-22' }
  - { title: 'CUDA Compute Capabilities', url: 'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html', version: '13.4.2', platform: 'Source review; native Tensor Core types', accessDate: '2026-09-22' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: h02 } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-22' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'outcome,prerequisites,baseline,history,pipeline,barriers,tensor,gates,tuning,evidence,retrieval,practice,sources' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: learning-unit } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: H02 } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: 'H01,M13,L08' } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/architecture/ampere-pipelines-tensor-cores/" lang="zh-CN">阅读中文对应页</a>

## Learning outcome

Allow 45 minutes to construct a two-buffer ownership ledger, distinguish arrival from completion, and select a Tensor Core path using types and an exact CC. The deliverable is a design and correctness review, not a benchmark.

## Prerequisites

Exact ordered edges: **[H01, M13, L08]**. [H01](/en/architecture/turing-warp-safety/) supplies explicit warp participation; [M13](/en/memory/asynchronous-copy-pipelines/) supplies producer/consumer stages; [L08](/en/libraries/tensor-core-precision-contracts/) supplies input, accumulation and output contracts. VIS15 is related, not a prerequisite.

## Portable baselines come first

For a bounded single-GPU workload, use ordinary global loads, register values and shared stores, then a block publication barrier, computation, and a block reuse barrier. No thread exits early from these collective phases. Use 256 FP32 elements per tile, two shared buffers of 1024 B each, and three input tiles: 3072 B input plus 3072 B output. Add implementation synchronization storage to the 2048 B shared-buffer budget; do not confuse shared memory with device memory.

The site's baseline is CC 7.5+, one native-Linux GPU and problem memory below 8 GB. Read-only copy/reordering must preserve FP32 values exactly; this copy comparison performs no arithmetic. The matrix baseline is a separate ordinary FP32 SIMT GEMM with explicit bounds and CPU references. It does not require Tensor Cores. Replacing BF16/TF32 multiplication with FP32 changes numerical semantics and must be explicitly accepted and revalidated.

## What Ampere changes

Ampere covers **8.x**, but a name does not identify an exact contract. In this unit and [VIS15](/en/visuals/architecture-evolution/), the complete reviewed rows are CC **8.0, 8.6 and 8.7**. Hardware global-to-shared asynchronous copy and shared-memory split arrive/wait acceleration start at CC 8.0. These allow overlap and can avoid the intermediate data registers of an ordinary load/store copy. They do not guarantee actual overlap or faster execution.

Keep that in-kernel copy distinct from host `cudaMemcpyAsync`, Unified Memory migration and a later architecture's bulk transfer mechanism. Here the subject is non-bulk `cp.async` / LDGSTS, not TMA.

## Follow a buffer through a pipeline

The original ordering ledger below uses M13's stage model. S0 and S1 are storage slots, not clock intervals:

| Phase | Producer obligation | Consumer obligation |
| --- | --- | --- |
| Prologue | Acquire S0/S1, submit tiles 0/1, commit each stage | Do not read either slot yet |
| Consume tile 0 | No overwrite of S0 | Wait for tile 0 completion, publish to all readers, read S0, release after all readers finish |
| Refill | Acquire the released S0, submit tile 2, commit | Tile 1 may be consumed from S1 after its own wait |
| Drain | Submit no out-of-range tile 3 | Wait/read/release tile 2; finish all outstanding work |

For a thread-scope pipeline, `consumer_wait()` waits for the relevant work of that thread, not automatically all other threads' copies. When other threads read those destinations, add `__syncthreads()` after copy completion and before reads; add another before any thread reuses the slot. In a block-scope pipeline, explicitly declare producer/consumer membership and acquire/commit/wait/release obligations instead of mixing scopes. This unit's paper solution uses the conservative thread-scope-plus-block-barrier form.

`cuda::memcpy_async` overloads have different synchronization objects; select and record the actual overload and header, such as `<cuda/pipeline>` or `<cuda/barrier>`. Hardware non-bulk copies use **4, 8 or 16 B** chunks with matching alignment, global source, shared destination, valid byte ranges and trivially copyable element types. An `aligned_size_t<16>` promise requires aligned source and destination and a size divisible by 16; it does not repair a pointer advanced by one FP32 element. A high-level call can lower to a synchronous path when hardware conditions are unmet. Use an explicit ordinary-copy fallback for this comparison and inspect generated instructions before claiming the accelerated path.

Predicated tail loads must not drop the required participants at commit, wait or reuse boundaries. Ampere pipeline batch sequencing is warp-entangled: divergent commits can create extra batches and excess waiting. Reconverge the intended participants before commit and arrive-on operations, using H01's valid mask; do not substitute an opportunistic active mask. A diagram cannot determine instruction selection or stall duration.

## Split arrival is not permission to read

A `cuda::barrier<cuda::thread_scope_block>` in shared memory must be initialized by one thread with the intended arrival count, and initialization must be published before participation. `arrive()` contributes to a phase and returns a token; `wait(token)` waits for that phase's completion. Work between the two must be independent of the data whose readiness the barrier represents.

When copies are bound through the appropriate `cuda::memcpy_async` barrier overload, completion includes both the participating arrivals and bound copies. Merely placing an unrelated copy near `arrive()` does not bind it. Tokens belong to a phase; use them in the current or immediately following phase, not after arbitrary reuse. Early exit requires the correct `arrive_and_drop` protocol, or, for this introductory fixture, keep all participants live. Publication and safe buffer reuse remain distinct phases. API availability below CC 8.0 is not hardware split-barrier acceleration; the portable baseline remains ordinary barriers.

## Preserve the Tensor Core numerical contract

Start from L08's FP32 SIMT baseline, then choose a specific WMMA operation. The following are **C++ WMMA tile shapes**, not the instruction-size table from a tuning guide:

| Path | Inputs / accumulator / output in this comparison | WMMA M×N×K | Native capability within reviewed rows |
| --- | --- | --- | --- |
| FP16 | `__half` / `float` / FP32 | 16×16×16 | 7.5, 8.0, 8.6, 8.7 |
| BF16 | `__nv_bfloat16` / `float` / FP32 | 16×16×16 | 8.0, 8.6, 8.7 |
| TF32 | `precision::tf32` / `float` / FP32; storage stays `float` | 16×16×8 | 8.0, 8.6, 8.7 |
| FP64 | `double` / `double` / FP64 | 8×8×4 | **8.0 only** |

BF16 and TF32 WMMA require an `sm_80`-or-later API target; this does not mean every greater CC has native FP64 Tensor Cores. CC 8.6 and 8.7 do not. Ordinary FP64 arithmetic is a separate capability. TF32 inputs need the documented conversion; `float` storage and FP32 accumulation do not make the multiplication ordinary FP32. Do not silently select a reduced-precision path because its CC gate passes.

Use a full warp with matching collective parameters, valid complete tiles, required pointer alignment and leading dimensions. FP16 WMMA requires a 32-byte-aligned load pointer and half `ldm` divisible by 8. Zero-pad tails before collective loads and predicate only the later bounded copies. Never let an individual lane return before WMMA. Compare against both the original-input and converted-input CPU references from L08, with justified tolerances and non-finite handling. Copy eligibility, numerical acceptance and warp safety are separate gates.

## Select targets, resources and fallbacks together

Use H01's proposed CUDA 13.3.1 / NVCC 13.3.73 / GCC 13.3.0 / C++17 / Ubuntu 24.04 x86-64 / driver 610.43.02 coordinate for future 7.5, 8.0 and 8.6 comparisons. The Modern Single-GPU Capability Tier requires CC 8.0+ and at least 8 GB. A CC 8.7 hardware row is not admission of an x86-64 environment: select its native-Linux platform, driver, host compiler and Toolkit compatibility independently before any run.

| Path | Virtual / real target | Additional gate | Declared fallback |
| --- | --- | --- | --- |
| Ordinary copy / FP32 SIMT | `compute_75` / `sm_75` for Turing; matching target for each device | Valid ranges, barriers, allocation budget | Baseline itself |
| Ampere copy / split barrier | `compute_80` / `sm_80`, `compute_86` / `sm_86`, or `compute_87` / `sm_87` | Exact device; global/shared direction, alignment, phase and participant proof | Ordinary copy + explicit publication/reuse barriers |
| BF16 / TF32 WMMA | Corresponding reviewed 8.x target | Opt-in numerical contract, full warp, valid shape/layout/storage | Explicitly accepted and revalidated FP32 SIMT |
| Native FP64 Tensor Core | `compute_80` / `sm_80`, CC 8.0 in these rows | FP64 shape and full-warp contract | Ordinary FP64 SIMT, with independent numerical validation |

A fatbinary can retain a baseline image and specialized images. Guard source feature branches during each compilation pass and check the selected runtime device before dispatch. An `sm_75`-only cubin is not an Ampere image; an `sm_80` image cannot run on CC 7.5. PTX fallback additionally needs compatible driver JIT support and cannot make hardware features appear. Query the compiler's target lists and inspect the actual artifact; no command is reported as executed here.

## Tune the declared workload

CC 8.0/8.6/8.7 per-block shared-memory maxima are **163/99/163 KiB**; allocations above 48 KiB require dynamic shared memory and opt-in. Do not assign CC 8.0's capacity to every Ampere device. Extra stages consume shared memory and may reduce residency; tiny copies may not amortize pipeline overhead. Hold dtype, shape, numerical acceptance and timing boundaries fixed, then inspect generated instructions and measure correct baseline and specialized paths separately. Peak specifications and a larger CC are not speedups.

## Evidence boundary

All four metadata arrays remain empty. External pipeline, barrier, Tensor Core and performance behavior is **Pending Hardware Verification**. There is no build, GPU run, sanitizer result, generated-code inspection or measured overlap in this unit. A qualifying run needs its own Environment Manifest and Reference Environment, exact target and source, error-checked completion, correctness comparison and preserved reports. VIS15 filters reviewed facts only and grants no Evidence Status. The browser executes no CUDA.

## Retrieval check

1. Why does waiting for one thread's copies not publish all other threads' data?
2. Which ordering edge prevents a producer overwriting a still-read slot?
3. Why can independent work occur between arrive and wait, but not consumption of the pending tile?
4. What must be true before asserting 16-byte alignment?
5. Why does CC 8.6 fail the native FP64 Tensor Core gate yet pass the TF32 gate?
6. Which numerical assumptions change when falling back from TF32 to FP32 SIMT?
7. What must be separately reviewed before executing on a CC 8.7 platform?

## Practice

Complete [H02 Exercises](/en/architecture/ampere-pipelines-tensor-cores/exercises/), then the [separate solutions](/en/architecture/ampere-pipelines-tensor-cores/solutions/) and [PB-R7-002](/en/practice/#pb-r7-002). Use [VIS15](/en/visuals/architecture-evolution/) to find the empty intersection of CC 8.6 and native FP64 Tensor Cores, then explain the fallback in words.

## Sources and licensing

Checked **2026-09-22**; [SRC-CUDA-104](/en/sources-and-versions/#src-cuda-104) records [Ampere tuning](https://docs.nvidia.com/cuda/ampere-tuning-guide/index.html), [non-bulk copies](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-copies.html#using-ldgsts), [barrier phases](https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/async-barriers.html), [WMMA](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cpp-language-extensions.html#warp-matrix-functions) and [native capabilities](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html). Current Context7 guided discovery; owner documentation settles contracts. Original explanation, ledger and Exercises use CC BY 4.0; no NVIDIA sample or illustration is reproduced. Live guide 13.4.2, tuning guide 13.4 and release notes 13.4 Update 1 are dated reviews, not a change to the pinned Toolkit Lanes or local evidence.
