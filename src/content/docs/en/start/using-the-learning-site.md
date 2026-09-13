---
title: 'O01: Using the Learning Site'
description: Understand the resource types, the route available today, and the site boundaries.
pairId: o01
counterpart: /start/using-the-learning-site/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure:
  - outcome
  - resource-types
  - published-route
  - themes
  - workflow
  - boundaries
  - check
resourceKind: learning-unit
unitId: O01
prerequisites: []
relatedUnits:
  - O02
  - O03
  - O04
  - O05
  - O06
  - O07
  - O08
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: o01
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-09-12'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'outcome,resource-types,published-route,themes,workflow,boundaries,check'
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: learning-unit }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O01 }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: none }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'O02,O03,O04,O05,O06,O07,O08' }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/using-the-learning-site/" lang="zh-CN">阅读中文对应页</a>

CUDA Learning Site is not a blog ordered by publication time. It places concepts, code, and hands-on work on a prerequisite route, while keeping direct lookup paths for terms and source records you may need later.

## What you should be able to do

- Explain the distinct job of each of the seven learning resource types.
- Follow the complete prerequisite route that is published now without treating navigation as a roadmap.
- Select a visual theme without changing content meaning and explain the no-script fallback.
- Decide when to read, when to practise, and what belongs in the browser versus an external CUDA environment.

## Seven resource types, seven jobs

A **Learning Unit** teaches one topic. It motivates the problem, builds a mental model, states prerequisites, and ends by checking understanding through questions or practice.

A **Runnable Example** is a standalone source project that can be built. A page does not maintain a second handwritten copy of its complete program.

A **Lab** is a guided activity you run in an external CUDA-capable environment. It provides steps, expected observations, and completion criteria; the website does not execute CUDA for you.

An **Exercise** leaves the work to the learner. It states a goal, constraints, and acceptance criteria instead of merely displaying an answer.

The **Practice Bank** collects recurring problems across the curriculum and links every entry back to the Learning Units that teach its prerequisites. It is not a copied question dump.

A **Visual Explainer** uses interaction or animation to expose spatial, temporal, or architectural behavior. It may model a concept in the browser, but it is not a CUDA execution environment.

The **Glossary** keeps the site's Chinese and English technical vocabulary consistent and identifies aliases that create ambiguity. Use the [Glossary](/en/glossary/) whenever a term is unfamiliar.

Every public page also belongs to a **Publication Pair**. Its Chinese and English counterparts share facts, structure, metadata, and source dates while using natural prose in each language.

## The published route

As of **2026-09-12**, the current Stable Curriculum publication covers 82 Learning Units in both languages: O01-O08, F01-F08, M01-M19, A01-A14, Q01-Q13, L01-L13, and P01-P07. The reusable-library path retains [L12: cuFFT Plans, Layouts, and Startup](/en/libraries/cufft-plans-layouts-startup/), [L13: cuSPARSE Descriptors, SpMV, and SpMM](/en/libraries/cusparse-descriptors-spmv-spmm/), and their examples. The Python bridge starts at [P01](/en/python/cuda-python-bridge/) after the existing CUDA lifecycle and stream prerequisites. P04-P07 apply those concepts to eager PyTorch. The complete strict prerequisite graph currently published follows.

R4 remains the latest completed aggregate static review, dated 2026-09-10. Schema 5 `src/r4-release-manifest.json` still supplies the frozen `/release.json`: 75 Learning Units, 277 Publication Pairs, 554 source routes, 74 Exercise sets, 74 separate reviewed-solution sets, and 401 catalog records. R4's historical 82 practice entries, 196 terms, and 92 sources are unchanged. `/publication.json` records the expanded current inventory: 299 Publication Pairs, 598 source routes, 81 Exercise sets, and 81 separate reviewed-solution sets, with R4 latest completed and the next R5 aggregate review pending. R1-R3 remain exact historical snapshots; R3 retains 232 pairs, 464 routes, 347 catalog records, 61 Exercise sets, 61 solution sets, and ten Nsight report-analysis Practice Bank entries.

**R4 aggregate static review date: 2026-09-10.** [Issue #41](https://github.com/xiangzhang-coding/cuda-learning-site/issues/41) and its [aggregate disposition](/en/sources-and-versions/#r4-aggregate-review) remain historical records, not a review of the current [issue #42](https://github.com/xiangzhang-coding/cuda-learning-site/issues/42) Python bridge increment. Publishing these pages does not pre-certify CI, Preview, production, or smoke acceptance, or imply completion of framework or Triton tracks. Technical sources retain their item-level access and review dates.

1. [Home](/en/)
2. **O01: Using the Learning Site** (this page)
3. [O02: Recording Evidence Honestly](/en/start/evidence-status/), [O03: Reading an Environment Manifest](/en/start/environment-manifest/), [O04: C++17 Refresher for CUDA Learners](/en/start/cpp17-for-cuda/), [O05: Reproducible Linux Command-Line Work](/en/start/linux-command-line/), and [O06: Architecture Refresher](/en/start/architecture-refresher/) all depend directly on O01.
4. [O07: Why GPUs Became Programmable](/en/start/programmable-gpus/) depends only on O06.
5. [O08: Preparing a Reference Environment Candidate](/en/start/reference-environment-candidate/) requires O02, O03, and O05 together.
6. The [EX01 Environment Report Runnable Example](/en/examples/environment-report/) has no strict Learning Unit prerequisite. [LAB01: Record and Interpret a CUDA Environment](/en/labs/record-cuda-environment/) requires both O03 and O08 and uses EX01.
7. The kernel route enters [F01: From Prediction to a First CUDA Kernel](/en/foundations/first-cuda-kernel/) after O03. [F02: Understanding the CUDA Execution Hierarchy](/en/foundations/execution-hierarchy/) depends on F01, [F03: Make Multidimensional Indexing and Bounds a Correctness Contract](/en/foundations/multidimensional-indexing/) depends on F02, and [F04: The Explicit Host-Device Resource Lifecycle](/en/foundations/host-device-lifecycle/) also depends on F01.
8. [F05: CUDA Errors Are Often Asynchronous](/en/foundations/asynchronous-errors/) depends only on F04; [F06: Compute Capability Is a Feature Contract](/en/foundations/compute-capability/) requires F02 and O03; [F07: Distinguish CUDA Runtime API and Driver API Roles](/en/foundations/runtime-driver-api/) requires F04 and F05; and [F08: Launch Geometry Is a Correctness and Resource Decision Before Speed](/en/foundations/launch-geometry/) requires F02, F03, and F06.
9. After F01-F08, the memory track enters [M01: Address Spaces, Ownership, Scope, and Lifetime](/en/memory/address-spaces/) from F04 and F06. [M02: Coalescing as Transaction Shaping](/en/memory/coalescing-transactions/) requires M01 and F03; [M03: Shared-memory Tiling](/en/memory/shared-memory-tiling/) requires M01 and M02; [M04: Bank Conflicts and Layout Transforms](/en/memory/bank-conflicts-layouts/) depends only on M03; [M05: Synchronization Scopes and Memory Visibility](/en/memory/synchronization-scopes/) requires F02 and M01; [M06: Divergence, Reconvergence, and Warp-safe Reasoning](/en/memory/warp-divergence-reconvergence/) requires F02 and M05; [M07: Streams Replace a Global-order Mental Model](/en/memory/stream-ordering/) requires F05 and M01; and [M08: Events as Dependencies and Device-time Measurements](/en/memory/event-dependencies-timing/) depends only on M07.
10. The current memory extension contains six complete Learning Units. [M09: Pinned Memory and Transfer Overlap](/en/memory/pinned-memory-transfer-overlap/) requires M07 and M08; [M10: Unified Memory and Page Migration](/en/memory/unified-memory-page-migration/) requires M01 and M02; [M11: Stream-Ordered Allocation and Memory Pools](/en/memory/stream-ordered-allocation-memory-pools/) requires M07 and M08; [M12: Cooperative Groups and Composable Synchronization](/en/memory/cooperative-groups/) requires M05 and M06; [M13: Asynchronous Copy and Staged Pipelines](/en/memory/asynchronous-copy-pipelines/) requires M03, M05, and M08; and [M14: CUDA Graphs and Repeated Launch Structure](/en/memory/cuda-graphs/) requires M07 and M08.
11. The toolchain track starts at [M15: NVCC Host/Device Compilation Flow](/en/toolchain/nvcc-compilation-flow/), which requires F04 and O04. [M16: PTX, cubin, SASS, and fatbinary](/en/toolchain/ptx-cubin-fatbinary/) requires M15 and F06; [M17: Select Compiler Architecture Targets](/en/toolchain/compiler-architecture-targets/) requires M16 and F06; [M18: Separate Compilation and Device Linking](/en/toolchain/separate-compilation-device-linking/) requires M15 and M16; and [M19: CUDA C++17, C++20, and C++23 Dialect Boundaries](/en/toolchain/cpp-dialect-boundaries/) requires O04 and M15.
12. The algorithms track retains A01-A11, adds [A12: Sparse Formats, Storage Ledgers, and SpMV](/en/algorithms/sparse-formats-spmv/)`<-[M01,M02]` and [A13: Sparse Matrix Multiplication, Preprocessing, and Workspace Decisions](/en/algorithms/sparse-matrix-multiplication-preprocessing/)`<-[A12,A08]`, and retains [A14](/en/algorithms/algorithm-choice-arithmetic-intensity/)`<-[A01,A02,A05,A08]`.
13. The correctness-and-quality track retains Q01-Q08 and adds [Q09: Interpret Latency Hiding with Occupancy, Stalls, and Throughput](/en/correctness/occupancy-stalls-throughput/)`<-[Q08,F08]`, [Q10: Build an Auditable Roofline from Arithmetic Intensity](/en/correctness/roofline-arithmetic-intensity/)`<-[Q05,A14]`, [Q11: Optimize the Canonical Transpose with Controlled Evidence](/en/correctness/transpose-optimization-case-study/)`<-[A05,Q06,Q08,Q10]`, [Q12: Optimize the Canonical Reduction with Controlled Evidence](/en/correctness/reduction-optimization-case-study/)`<-[A02,Q02,Q06,Q08]`, and [Q13: Optimize the Canonical GEMM with Controlled Evidence](/en/correctness/gemm-optimization-case-study/)`<-[A08,Q06,Q08,Q10]`. Q13 starts from immutable [EX15](/en/examples/tiled-gemm/) and reuses evidence-neutral [VIS12](/en/visuals/gemm-tiling-hierarchy/).
14. The reusable-library track contains [L01: Choose a Library, Primitive, DSL, or Custom Kernel](/en/libraries/library-primitive-dsl-custom-kernel/)`<-[A02,A03,A08,Q06]`, [L02: Thrust as an Algorithm Vocabulary](/en/libraries/thrust-algorithm-vocabulary/)`<-[A01,A03,A09]`, [L03: Use CUB Device Primitives for Reduction and Scan](/en/libraries/cub-device-primitives/)`<-[A02,A03,M07,L01]`, [L04: Compose Kernels with CUB Warp and Block Primitives](/en/libraries/cub-warp-block-primitives/)`<-[F02,M03,M05,A02,A03,L03]`, [L05: libcu++ Synchronization Abstractions](/en/libraries/libcu-plus-plus-synchronization/)`<-[M05,M13,M19]`, [L06: cuBLAS GEMM](/en/libraries/cublas-gemm/)`<-[A08,Q01]`, and [L07: cuBLASLt Matmul](/en/libraries/cublaslt-matmul/)`<-[L06,Q05]`.
15. The library track continues with [L08: Tensor Core Precision and Architecture Contracts](/en/libraries/tensor-core-precision-contracts/)`<-[Q02,L06,F06]` and [L09: CUTLASS C++ GEMM Structure](/en/libraries/cutlass-cpp-gemm-structure/)`<-[A08,L06,M17]`, each with exactly those ordered direct prerequisites. L08 is not an additional L09 prerequisite.
16. The 21 Runnable Examples are EX01-EX21, ending with [EX21: CUDA Python Explicit Launch](/en/examples/cuda-python-launch/)`<-[P02]`. [EX20: cuSPARSE SpMV](/en/examples/cusparse-spmv/) still requires `[L13]`, [EX19: cuFFT Batched Transform](/en/examples/cufft-batched-transform/) still requires `[L12]`, and [EX18: cuBLAS GEMM](/en/examples/cublas-gemm/) still requires `[L06]`. The Lab set is LAB01-LAB12, ending with [LAB12: Compare an Educational GEMM with cuBLAS](/en/labs/compare-gemm-with-cublas/)`<-[Q13,L06]`. The visual graph retains [VIS18: Attention Memory Traffic](/en/visuals/attention-memory-traffic/)`<-[A11]`. The Python bridge adds no Lab.
17. The library track continues with [L10: cuDNN Graphs and Plans](/en/libraries/cudnn-graphs-and-plans/)`<-[A07,L01,Q05]` and [L11: Attention Backend Dispatch](/en/libraries/attention-backend-dispatch/)`<-[A11,L10,L08]`. These are their complete ordered direct prerequisites; related edges are L11 and VIS18 respectively, not added prerequisites for earlier units.
18. [L12: cuFFT Plans, Layouts, and Startup](/en/libraries/cufft-plans-layouts-startup/) requires exactly `[Q05,M07]` in that order and relates to EX19. [L12 Exercises](/en/libraries/cufft-plans-layouts-startup/exercises/) require `[L12]`, and [separate reviewed solutions](/en/libraries/cufft-plans-layouts-startup/solutions/) require `[L12-EXERCISES]`.
19. [L13: cuSPARSE Descriptors, SpMV, and SpMM](/en/libraries/cusparse-descriptors-spmv-spmm/) requires exactly `[A12,A13,L01]` in that order and relates to EX20. [L13 Exercises](/en/libraries/cusparse-descriptors-spmv-spmm/exercises/) require `[L13]`, and [separate reviewed solutions](/en/libraries/cusparse-descriptors-spmv-spmm/solutions/) require `[L13-EXERCISES]`.
20. In the Python bridge, [P01](/en/python/cuda-python-bridge/) has exactly `[F04,M07]` as ordered direct prerequisites; [P02: Devices, Contexts, and Launches](/en/python/devices-contexts-launches/) requires `[P01,F07]`; [P03: Runtime Compilation and Linking](/en/python/runtime-compilation-linking/) requires `[P02,M15,M16]`. Each has Exercises and separate solutions, all using [EX21](/en/examples/cuda-python-launch/), whose only direct prerequisite is `[P02]`. It independently pins Python, packages, and native Toolkit components, inherits no C++ Toolkit Lane evidence, and publishes no downstream framework or Triton placeholders.

21. [P04: Queued Work and Timing](/en/frameworks/queued-work-timing/) requires `[M07,Q05]`; [P05: Streams and Storage Lifetime](/en/frameworks/streams-and-storage-lifetime/) requires `[P04,M08]`; [P06: Mixed-Precision Contracts](/en/frameworks/mixed-precision-contracts/) requires `[Q02,P04,L08]`; [P07: Python-to-CUDA Profiling](/en/frameworks/python-to-cuda-profiling/) requires `[P04,Q07,Q08]`. Related edges are `[P05,P06,P07]`, `[P04]`, `[P04,P07]`, and `[P05,P06]`. Each Exercise set requires only its unit; separate solutions require only that Exercise set. Issue #43 adds these twelve pairs, not another Runnable Example or Lab.

Choose the next step by the gap you need to close. Apply the O04 C++17 refresher while reading F01-F08 and any published Runnable Example, but do not add it as a prerequisite. The Linux-record route must combine O02, O03, and O05 before O08. EX01 remains directly available, while LAB01 requires both O03 and O08. The architecture route follows O06 with O07 before carrying those models into Foundations. F05 continues the error lifecycle from F04; F06 joins F02/O03; F07 joins F04/F05; and F08 joins F02/F03/F06. The memory route joins F04/F06 at M01, uses M02-M04 for memory access and layout, then enters M05/M06 for synchronization and warp reasoning, while F05/M01 join at M07 before M08 adds event dependencies and timing.

From that base, the algorithms track joins A02/M02/M03 at A10 and A08/A10 at A11; M01/M02 join at A12 and A12/A08 join at A13; A14 continues to join A01/A02/A05/A08. A02/A03/A08/Q06 join at L01, A01/A03/A09 join at L02, A02/A03/M07/L01 join at L03, F02/M03/M05/A02/A03/L03 join at L04, M05/M13/M19 join at L05, A08/Q01 join at L06, L06/Q05 join at L07, Q02/L06/F06 join at L08, A08/L06/M17 join at L09, A07/L01/Q05 join at L10, A11/L10/L08 join at L11, Q05/M07 join at L12, and A12/A13/L01 join at L13. Q12/L03 join at LAB11, with EX17 supplying its canonical CUB implementation; Q13/L06 join at LAB12, with EX15 and EX18 supplying the compared implementations. VIS18 strictly requires A11, and EX20 strictly requires L13.

O02-O08, F01-F08, M01-M19, and Q01-Q05 all have direct Exercises and separate reviewed solutions. The memory route links in order to [M09 Exercises](/en/memory/pinned-memory-transfer-overlap/exercises/) and [solutions](/en/memory/pinned-memory-transfer-overlap/solutions/), [M10 Exercises](/en/memory/unified-memory-page-migration/exercises/) and [solutions](/en/memory/unified-memory-page-migration/solutions/), [M11 Exercises](/en/memory/stream-ordered-allocation-memory-pools/exercises/) and [solutions](/en/memory/stream-ordered-allocation-memory-pools/solutions/), [M12 Exercises](/en/memory/cooperative-groups/exercises/) and [solutions](/en/memory/cooperative-groups/solutions/), [M13 Exercises](/en/memory/asynchronous-copy-pipelines/exercises/) and [solutions](/en/memory/asynchronous-copy-pipelines/solutions/), and [M14 Exercises](/en/memory/cuda-graphs/exercises/) and [solutions](/en/memory/cuda-graphs/solutions/). The toolchain route links to [M15 Exercises](/en/toolchain/nvcc-compilation-flow/exercises/) and [solutions](/en/toolchain/nvcc-compilation-flow/solutions/), [M16 Exercises](/en/toolchain/ptx-cubin-fatbinary/exercises/) and [solutions](/en/toolchain/ptx-cubin-fatbinary/solutions/), [M17 Exercises](/en/toolchain/compiler-architecture-targets/exercises/) and [solutions](/en/toolchain/compiler-architecture-targets/solutions/), [M18 Exercises](/en/toolchain/separate-compilation-device-linking/exercises/) and [solutions](/en/toolchain/separate-compilation-device-linking/solutions/), and [M19 Exercises](/en/toolchain/cpp-dialect-boundaries/exercises/) and [solutions](/en/toolchain/cpp-dialect-boundaries/solutions/). The correctness route links directly to [Q01 Exercises](/en/correctness/cpu-references-tolerances-invariants/exercises/) and [solutions](/en/correctness/cpu-references-tolerances-invariants/solutions/), [Q02 Exercises](/en/correctness/floating-point-order-reproducibility/exercises/) and [solutions](/en/correctness/floating-point-order-reproducibility/solutions/), [Q03 Exercises](/en/correctness/memcheck-invalid-memory-access/exercises/) and [solutions](/en/correctness/memcheck-invalid-memory-access/solutions/), [Q04 Exercises](/en/correctness/racecheck-initcheck-synccheck/exercises/) and [solutions](/en/correctness/racecheck-initcheck-synccheck/solutions/), and [Q05 Exercises](/en/correctness/timing-asynchronous-gpu-work/exercises/) and [solutions](/en/correctness/timing-asynchronous-gpu-work/solutions/). Earlier units remain directly reachable through the strict graph above.

Q06-Q13 have direct Exercises and separate reviewed solutions, including [Q09 Exercises](/en/correctness/occupancy-stalls-throughput/exercises/) and [solutions](/en/correctness/occupancy-stalls-throughput/solutions/), [Q10 Exercises](/en/correctness/roofline-arithmetic-intensity/exercises/) and [solutions](/en/correctness/roofline-arithmetic-intensity/solutions/), [Q11 Exercises](/en/correctness/transpose-optimization-case-study/exercises/) and [solutions](/en/correctness/transpose-optimization-case-study/solutions/), [Q12 Exercises](/en/correctness/reduction-optimization-case-study/exercises/) and [solutions](/en/correctness/reduction-optimization-case-study/solutions/), plus [Q13 Exercises](/en/correctness/gemm-optimization-case-study/exercises/) and [solutions](/en/correctness/gemm-optimization-case-study/solutions/).

The algorithms route links to Exercises and separate solutions for A01-A14, including [A12 Exercises](/en/algorithms/sparse-formats-spmv/exercises/) and [solutions](/en/algorithms/sparse-formats-spmv/solutions/), plus [A13 Exercises](/en/algorithms/sparse-matrix-multiplication-preprocessing/exercises/) and [solutions](/en/algorithms/sparse-matrix-multiplication-preprocessing/solutions/).

The reusable-library route links to [L01 Exercises](/en/libraries/library-primitive-dsl-custom-kernel/exercises/) and [solutions](/en/libraries/library-primitive-dsl-custom-kernel/solutions/), [L02 Exercises](/en/libraries/thrust-algorithm-vocabulary/exercises/) and [solutions](/en/libraries/thrust-algorithm-vocabulary/solutions/), [L03 Exercises](/en/libraries/cub-device-primitives/exercises/) and [solutions](/en/libraries/cub-device-primitives/solutions/), [L04 Exercises](/en/libraries/cub-warp-block-primitives/exercises/) and [solutions](/en/libraries/cub-warp-block-primitives/solutions/), [L05 Exercises](/en/libraries/libcu-plus-plus-synchronization/exercises/) and [solutions](/en/libraries/libcu-plus-plus-synchronization/solutions/), [L06 Exercises](/en/libraries/cublas-gemm/exercises/) and [solutions](/en/libraries/cublas-gemm/solutions/), plus [L07 Exercises](/en/libraries/cublaslt-matmul/exercises/) and [solutions](/en/libraries/cublaslt-matmul/solutions/). This increment adds [L08 Exercises](/en/libraries/tensor-core-precision-contracts/exercises/) and [separate solutions](/en/libraries/tensor-core-precision-contracts/solutions/), plus [L09 Exercises](/en/libraries/cutlass-cpp-gemm-structure/exercises/) and [separate solutions](/en/libraries/cutlass-cpp-gemm-structure/solutions/).

The [Lab Index](/en/labs/) lists 12 Labs, LAB01-LAB12. The [Visual Explainer Index](/en/visuals/) lists 19 explainers: standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22. The current catalog has 89 [Practice Bank](/en/practice/) entries, 204 [Glossary](/en/glossary/) terms, and 99 [source records](/en/sources-and-versions/), for 423 catalog records; content forms 299 Publication Pairs and 598 source routes. PyTorch adds `PB-R5-004/005/006/007` after the Python bridge's `PB-R5-001/002/003`. The ten R3 Nsight report-analysis entries and eight R4 library-and-algorithm-choice entries remain unchanged: `PB-R4-001`, `PB-R4-002`, `PB-R4-003`, `PB-R4-004`, `PB-R4-008`, `PB-R4-011`, `PB-R4-012`, and `PB-R4-016`.

P04-P07 keep all four evidence arrays empty. Their [independent eager environment](/en/sources-and-versions/#src-cuda-080) selects PyTorch 2.11.0+cu128, CPython 3.12.14, CUDA metapackage 12.8.1, runtime/CUPTI 12.8.90, cuDNN 9.19.0.56 and the native allocator. No system Toolkit or nvcc is required, and neither EX21's profile nor existing Toolkit Lane evidence is inherited. Source checks are not GPU measurements. P08, EX22, LAB13 and Triton destinations remain unpublished.

Only EX02, EX10, and LAB02 are Compile-Checked. EX10 is Runtime-Not-Applicable; the other 20 examples and all 12 Labs remain Pending Hardware Verification, 32 subjects total. P01-P03 have all four evidence arrays empty; EX21 has empty compilation evidence and recorded observations and remains Pending Hardware Verification. Python host tests grant no CUDA compilation or runtime evidence. Runtime-Verified, Community-Observed, Reference Environment, and performance-observation counts remain zero. Source review is not GPU evidence.

Q06-Q13, A10-A14, and L01-L13 have all four evidence arrays empty and grant no Evidence Status. EX17/LAB11, EX18/LAB12, EX19, and EX20 have empty compilation evidence and recorded observations and Pending Hardware Verification runtime. LAB12 publishes executable comparison steps, not recorded outputs, times, speedups, or a winner; publishing L07 does not mean EX18/LAB12 implement Lt selection. EX17's five component-matrix rows are a non-evidentiary build gate and do not state that CI ran. All six current profiler fixtures are expected-only plans, not captured reports. The current publication declares no Reference Environment or `performanceObservations`.

L08 separates input conversion, accumulation, output conversion, and WMMA architecture contracts. L09 reads GEMM structure at pinned CUTLASS C++ v4.7.0 commit `dcf215af68a2d08d305076c152a06f201728cd53`, not a promise of DSL or executable support. Neither supplies local compilation, a real-instruction observation, CUDA runtime, or a performance result. VIS12's model and scalar instruction panel remain unchanged and must not be read as a real Tensor Core instruction.

[L10 Exercises](/en/libraries/cudnn-graphs-and-plans/exercises/) and [separate solutions](/en/libraries/cudnn-graphs-and-plans/solutions/), plus [L11 Exercises](/en/libraries/attention-backend-dispatch/exercises/) and [separate solutions](/en/libraries/attention-backend-dispatch/solutions/), extend the graph/plan and dispatch checks. These units independently pin cuDNN backend 9.24.0 and frontend 1.27.0 commit `f77fbc3d21be3f24cd0286b9b368105f7c518b8a` for reference-only reading, without copied owner code/assets or compilation, GPU, actual-engine, dtype, or performance evidence.

L12 uses the archived 12.9.2 cuFFT teaching baseline and a live 13.3 reference accessed 2026-09-08; exact 13.3.1 API and release-note archives were unavailable. EX19 declares C++17 only on the same three pinned Toolkit Lanes with bundled cuFFT 10.9.0.58 / 11.4.1.4 / 12.3.0.29. Its FP32 C2C contract excludes callbacks, low precision, multi-GPU execution, and timing; immutable source and build gates do not establish GPU evidence.

L13 uses the archived 12.9.2 cuSPARSE teaching baseline. The [SRC-CUDA-075/076 review](/en/sources-and-versions/#src-cuda-075) dated 2026-09-09 records available exact archives, including 13.3.1, separately from the historical cuFFT access record above. EX20's three C++17 non-executing build gates pin Toolkit/cuSPARSE pairs 11.8.0/11.7.5.86, 12.9.2/12.5.10.65, and 13.3.1/12.8.2.51; source review and build gates are not GPU evidence.

## Three visual themes, one body of content

The visual-theme control in the header and mobile menu offers three ways to read:

- **Silicon Light** is the default. Bright surfaces and a quiet silicon-dot field support long-form reading.
- **Profiler Dark** uses dark surfaces, timeline ticks, and high-contrast code regions for code and performance-trace reading.
- **Blueprint** uses an engineering-blue field, major and minor grids, and a data-path signal color to emphasize spatial relationships and data flow.

All three themes share one page structure, text, semantic-color meanings, keyboard order, and focus behavior. A theme never hides content or turns a decorative browser graphic into a CUDA observation. Theme selection is the site's only learner preference retained across browser sessions. It writes one value to this origin's `localStorage` and needs no account, tracking profile, application API, database, or server-rendered state.

If scripts are disabled or browser policy blocks persistence, the page remains readable in the static Silicon Light default and exposes a textual fallback. Reduced-motion, increased-contrast and forced-color, narrow-screen reflow, and print rules cover every theme. Automated checks can detect only some accessibility problems and do not prove WCAG conformance; keyboard, screen-reader, and real zoom review remain manual responsibilities.

## A useful study rhythm

1. Read the Learning Unit objectives and prerequisites, then confirm the question it answers.
2. Write down a prediction before seeing the outcome so gaps in your mental model become visible.
3. Treat the standalone project as the source whenever a Runnable Example appears; do not reconstruct a program from page fragments.
4. Prepare an external environment before a Lab and record your work against its acceptance criteria.
5. Use Exercises and the Practice Bank to test transfer. Return to the linked Learning Unit when you find a gap.

## What the site does not do for you

- It does not provide accounts, progress tracking, quiz scores, or personal learning profiles.
- It does not hide the execution environment behind server rendering, an application API, or in-browser CUDA.
- It does not use blank pages, placeholder navigation, or coming-soon links as a substitute for learnable material.
- It does not treat a browser model as a hardware execution result.
- It does not grant CUDA evidence because a page, web CI job, or browser interaction exists; the controlled contract begins at [O02](/en/start/evidence-status/).

## Check before leaving

You are ready to move on when you can answer these five questions:

1. How does a Runnable Example differ from a Lab?
2. Why does a Practice Bank entry link back to prerequisite Learning Units?
3. Why is material absent from navigation not considered published?
4. How does the theme control fall back when scripts or persistence are unavailable?
5. Why does publishing a page not grant CUDA evidence?

**Current publication summary checked: 2026-09-12.** This page is not tied to a CUDA Toolkit version and does not grant CUDA evidence. The R4 aggregate review and individual source dates remain historical. See the [Glossary](/en/glossary/) for vocabulary and [Sources and Version Record](/en/sources-and-versions/) for publishing and CUDA sources.
