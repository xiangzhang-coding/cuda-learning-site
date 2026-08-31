---
title: 'O01: Using the Learning Site'
description: Understand the resource types, the route available today, and the site boundaries.
pairId: o01
counterpart: /start/using-the-learning-site/
factCheckDate: '2026-08-31'
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
      content: '2026-08-31'
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

As of **2026-08-31**, the current rolling Stable Curriculum publication after [issue #25](https://github.com/xiangzhang-coding/cuda-learning-site/issues/25) completely publishes 52 Learning Units in both languages: O01-O08, F01-F08, M01-M19, A01-A09, and Q01-Q08. The complete strict prerequisite graph currently published is:

The completed R2 aggregate review is an immutable snapshot fixed at 186 Publication Pairs and 372 source routes. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) retains its dynamic acceptance record for final CI, Preview, production, and remote smoke. The current incremental publication has advanced to 198 Publication Pairs and 396 source routes without rewriting R2; the R3 aggregate review remains pending.

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
12. The algorithms track extends A01-A07 with [A08: Tiled GEMM](/en/algorithms/tiled-gemm-correctness/) and [A09: Sorting, Selection, and Compaction](/en/algorithms/sorting-selection-compaction/). A08 strictly requires A05, M03, M04, and A02; A09 strictly requires A03 and A04.
13. The correctness-and-quality track contains [Q01: CPU References, Tolerances, and Invariants](/en/correctness/cpu-references-tolerances-invariants/), which requires F04 and O04; [Q02: Floating-point Order, Determinism, and Bitwise Reproducibility](/en/correctness/floating-point-order-reproducibility/) requires Q01 and A02; [Q03: Memcheck and Invalid Memory Access](/en/correctness/memcheck-invalid-memory-access/) requires F05 and Q01; [Q04: Diagnose with Racecheck, Initcheck, and Synccheck](/en/correctness/racecheck-initcheck-synccheck/) requires M05, M06, and Q03; [Q05: Time Asynchronous GPU Work Honestly](/en/correctness/timing-asynchronous-gpu-work/) requires M08 and Q01; [Q06: Use APOD as an Optimization Loop](/en/correctness/apod-optimization-loop/) depends only on Q05; [Q07: Read the Application Timeline First with Nsight Systems](/en/correctness/timeline-first-nsight-systems/) requires M07, M09, and Q05; and [Q08: Ask One Selected Kernel Question with Nsight Compute](/en/correctness/kernel-first-nsight-compute/) requires Q07, M02, and M03.
14. The Runnable Example graph retains `EX15<-A08`, and the current set is EX01-EX16. The current Lab set is LAB01-LAB08: [LAB06: Build an Overlapped Pipeline](/en/labs/build-overlapped-pipeline/) strictly requires M09 and Q07, while [LAB08: Profile the Full Application Before One Kernel](/en/labs/profile-full-application-before-kernel/) strictly requires Q07 and Q08. The visual graph retains `VIS12<-A08` and adds [VIS14: Nsight Systems versus Nsight Compute](/en/visuals/nsight-systems-versus-nsight-compute/)`<-[Q07,Q08]`. Future Q11 and LAB10 are unpublished, with LAB10 waiting for Q11. Q13, L06, and LAB12 are also unpublished, with LAB12 waiting for the Q13 profiling and L06 cuBLAS prerequisites.

Choose the next step by the gap you need to close. Apply the O04 C++17 refresher while reading F01-F08 and any published Runnable Example, but do not add it as a prerequisite. The Linux-record route must combine O02, O03, and O05 before O08. EX01 remains directly available, while LAB01 requires both O03 and O08. The architecture route follows O06 with O07 before carrying those models into Foundations. F05 continues the error lifecycle from F04; F06 joins F02/O03; F07 joins F04/F05; and F08 joins F02/F03/F06. The memory route joins F04/F06 at M01, uses M02-M04 for memory access and layout, then enters M05/M06 for synchronization and warp reasoning, while F05/M01 join at M07 before M08 adds event dependencies and timing.

From that base, the algorithms track joins A05/M03/M04/A02 at A08 and A03/A04 at A09. EX15 and VIS12 both strictly require A08. The correctness route enters Q06 from Q05, joins M07/M09/Q05 at Q07, and then joins Q07/M02/M03 at Q08. LAB06 requires M09/Q07; LAB08 and VIS14 both require Q07/Q08. Future Q11/LAB10 and Q13/L06/LAB12 remain outside the current graph.

O02-O08, F01-F08, M01-M19, and Q01-Q05 all have direct Exercises and separate reviewed solutions. The memory route links in order to [M09 Exercises](/en/memory/pinned-memory-transfer-overlap/exercises/) and [solutions](/en/memory/pinned-memory-transfer-overlap/solutions/), [M10 Exercises](/en/memory/unified-memory-page-migration/exercises/) and [solutions](/en/memory/unified-memory-page-migration/solutions/), [M11 Exercises](/en/memory/stream-ordered-allocation-memory-pools/exercises/) and [solutions](/en/memory/stream-ordered-allocation-memory-pools/solutions/), [M12 Exercises](/en/memory/cooperative-groups/exercises/) and [solutions](/en/memory/cooperative-groups/solutions/), [M13 Exercises](/en/memory/asynchronous-copy-pipelines/exercises/) and [solutions](/en/memory/asynchronous-copy-pipelines/solutions/), and [M14 Exercises](/en/memory/cuda-graphs/exercises/) and [solutions](/en/memory/cuda-graphs/solutions/). The toolchain route links to [M15 Exercises](/en/toolchain/nvcc-compilation-flow/exercises/) and [solutions](/en/toolchain/nvcc-compilation-flow/solutions/), [M16 Exercises](/en/toolchain/ptx-cubin-fatbinary/exercises/) and [solutions](/en/toolchain/ptx-cubin-fatbinary/solutions/), [M17 Exercises](/en/toolchain/compiler-architecture-targets/exercises/) and [solutions](/en/toolchain/compiler-architecture-targets/solutions/), [M18 Exercises](/en/toolchain/separate-compilation-device-linking/exercises/) and [solutions](/en/toolchain/separate-compilation-device-linking/solutions/), and [M19 Exercises](/en/toolchain/cpp-dialect-boundaries/exercises/) and [solutions](/en/toolchain/cpp-dialect-boundaries/solutions/). The correctness route links directly to [Q01 Exercises](/en/correctness/cpu-references-tolerances-invariants/exercises/) and [solutions](/en/correctness/cpu-references-tolerances-invariants/solutions/), [Q02 Exercises](/en/correctness/floating-point-order-reproducibility/exercises/) and [solutions](/en/correctness/floating-point-order-reproducibility/solutions/), [Q03 Exercises](/en/correctness/memcheck-invalid-memory-access/exercises/) and [solutions](/en/correctness/memcheck-invalid-memory-access/solutions/), [Q04 Exercises](/en/correctness/racecheck-initcheck-synccheck/exercises/) and [solutions](/en/correctness/racecheck-initcheck-synccheck/solutions/), and [Q05 Exercises](/en/correctness/timing-asynchronous-gpu-work/exercises/) and [solutions](/en/correctness/timing-asynchronous-gpu-work/solutions/). Earlier units remain directly reachable through the strict graph above.

Q06-Q08 also have direct Exercises and separate reviewed solutions: [Q06 Exercises](/en/correctness/apod-optimization-loop/exercises/) and [solutions](/en/correctness/apod-optimization-loop/solutions/), [Q07 Exercises](/en/correctness/timeline-first-nsight-systems/exercises/) and [solutions](/en/correctness/timeline-first-nsight-systems/solutions/), and [Q08 Exercises](/en/correctness/kernel-first-nsight-compute/exercises/) and [solutions](/en/correctness/kernel-first-nsight-compute/solutions/).

The algorithms route links to Exercises and separate solutions for A01-A09, including [A08 Exercises](/en/algorithms/tiled-gemm-correctness/exercises/) and [solutions](/en/algorithms/tiled-gemm-correctness/solutions/), plus [A09 Exercises](/en/algorithms/sorting-selection-compaction/exercises/) and [solutions](/en/algorithms/sorting-selection-compaction/solutions/).

The [Lab Index](/en/labs/) lists 8 Labs, LAB01-LAB08, including [LAB06](/en/labs/build-overlapped-pipeline/) and [LAB08](/en/labs/profile-full-application-before-kernel/). The [Visual Explainer Index](/en/visuals/) lists 17 explainers: standalone VIS01-VIS12 and VIS14, plus embedded VIS19-VIS22. [VIS12](/en/visuals/gemm-tiling-hierarchy/) depends on A08; [VIS14](/en/visuals/nsight-systems-versus-nsight-compute/) depends on Q07 and Q08. The current catalog has 8 Labs, 53 [Practice Bank](/en/practice/) entries, 17 Visual Explainers, 159 [Glossary](/en/glossary/) terms, and 65 [source records](/en/sources-and-versions/), for 302 records total. Current rolling public content forms 198 Publication Pairs and 396 source routes. These figures are distinct from the immutable R2 186/372 snapshot, and the R3 aggregate review remains pending.

A01-A09, Q01-Q08, and VIS14 have empty compilation and runtime axes. EX15 uses one original C++17 implementation across three Toolkit Lanes, has empty compilation evidence, and remains Pending Hardware Verification. Host-only checks grant no GPU runtime evidence. LAB06 and LAB08 have empty compilation evidence, Pending Hardware Verification runtime, and empty recorded observations. The site ran no EX15, CUB, Thrust, or issue #25 profiler Lab. This increment records no runtime, profiler, timeline, metric, bottleneck, timing, speedup, or production-winner observation.

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

**Fact-check date: 2026-08-31.** This page is not tied to a CUDA Toolkit version and does not grant CUDA evidence. See the [Glossary](/en/glossary/) for vocabulary and [Sources and Version Record](/en/sources-and-versions/) for publishing and CUDA sources reviewed for this release.
