---
title: 'O01: Using the Learning Site'
description: Understand the resource types, the route available today, and the site boundaries.
pairId: o01
counterpart: /start/using-the-learning-site/
factCheckDate: '2026-08-29'
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
      content: '2026-08-29'
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

As of **2026-08-29**, the Stable Curriculum completely publishes 39 Learning Units in both languages: O01-O08, F01-F08, M01-M19, and Q01/Q03-Q05. The complete strict prerequisite graph currently published is:

R1 remains the latest completed aggregate release review. The M09-M14, EX07-EX09, and VIS08 material scoped by [Issue #19](https://github.com/xiangzhang-coding/cuda-learning-site/issues/19) remains in the current publication, and the current incremental manifest now adds M15-M19, EX10, VIS09, and their supporting learning material. This does not complete R2; the aggregate R2 release review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

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
12. The correctness-and-quality track uses noncontiguous IDs. [Q01: CPU References, Tolerances, and Invariants](/en/correctness/cpu-references-tolerances-invariants/) requires F04 and O04; [Q03: Memcheck and Invalid Memory Access](/en/correctness/memcheck-invalid-memory-access/) requires F05 and Q01; [Q04: Diagnose with Racecheck, Initcheck, and Synccheck](/en/correctness/racecheck-initcheck-synccheck/) requires M05, M06, and Q03; and [Q05: Time Asynchronous GPU Work Honestly](/en/correctness/timing-asynchronous-gpu-work/) requires M08 and Q01. Q02 has no public page or navigation placeholder.
13. The [EX03 Multidimensional Indexing Runnable Example](/en/examples/multidimensional-indexing/) depends on F03 and supplies canonical source to F03/F04; the [EX04 Error Handling Lifecycle Runnable Example](/en/examples/error-handling-lifecycle/) depends only on F05; the [EX05 Coalesced and Strided Access Runnable Example](/en/examples/coalesced-strided-access/) depends only on M02; the [EX06 Shared-Memory Tile Bank Padding Runnable Example](/en/examples/shared-memory-tile-bank-padding/) requires M03 and M04; the [EX07 Streams, Events, and Overlap Runnable Example](/en/examples/streams-events-overlap/) requires M07, M08, and M09; the [EX08 Unified Memory Migration Runnable Example](/en/examples/unified-memory-migration/) depends only on M10; the [EX09 CUDA Graph Capture Runnable Example](/en/examples/graph-capture/) depends only on M14; the [EX10 PTX and Fatbinary Inspection Runnable Example](/en/examples/ptx-fatbinary-inspection/) requires M15 and M16; and the [EX16 Compute Sanitizer Defect Suite](/en/examples/sanitizer-defect-suite/) requires Q03 and Q04. The eleven noncontiguous Runnable Examples are exactly EX01-EX10 and EX16; EX11-EX15 have no public destinations. [LAB02](/en/labs/vector-addition/) requires O03 and F01 and uses canonical [EX02](/en/examples/vector-addition/); [LAB03: Break and Repair Indexing](/en/labs/break-and-repair-indexing/) requires F03 and F05 and uses EX04; [LAB04: Observe Coalescing](/en/labs/observe-coalescing/) requires M02 and Q05 and uses EX05; [LAB05: Remove Shared-Memory Bank Conflicts](/en/labs/remove-shared-memory-bank-conflicts/) requires M04 and Q05 and uses EX06; and [LAB07: Diagnose Four Sanitizer Failures](/en/labs/diagnose-four-sanitizer-failures/) requires Q03 and Q04 and uses EX16. The six noncontiguous Labs are exactly LAB01-LAB05 and LAB07. LAB06 remains absent because its required timeline-profiler prerequisite is not public. F08 is related to LAB03 but is not a LAB03 prerequisite.

Choose the next step by the gap you need to close. Apply the O04 C++17 refresher while reading F01-F08 and any published Runnable Example, but do not add it as a prerequisite. The Linux-record route must combine O02, O03, and O05 before O08. EX01 remains directly available, while LAB01 requires both O03 and O08. The architecture route follows O06 with O07 before carrying those models into Foundations. F05 continues the error lifecycle from F04; F06 joins F02/O03; F07 joins F04/F05; and F08 joins F02/F03/F06. The memory route joins F04/F06 at M01, uses M02-M04 for memory access and layout, then enters M05/M06 for synchronization and warp reasoning, while F05/M01 join at M07 before M08 adds event dependencies and timing.

From that base, M07/M08 feed M09, M11, and M14; M01/M02 feed M10; M05/M06 feed M12; and M03/M05/M08 feed M13. EX07 takes its explicit-copy pipeline contract from M07/M08/M09, EX08 takes its managed-memory contract from M10, and EX09 takes its graph-lifecycle contract from M14. The toolchain track joins F04/O04 at M15, then joins M15/F06 at M16, M16/F06 at M17, M15/M16 at M18, and O04/M15 at M19. EX10 strictly requires M15/M16, and VIS09 strictly requires M15/M16/M17. The correctness route joins F04/O04 at Q01, then branches to Q03 from F05/Q01, Q04 from M05/M06/Q03, and Q05 from M08/Q01. Q05 supplies the measurement contract for LAB04/LAB05, while Q03/Q04 lead to EX16/LAB07. These recommendations add no prerequisite edge beyond the graph above.

O02-O08, F01-F08, M01-M19, and Q01/Q03-Q05 all have direct Exercises and separate reviewed solutions. The memory route links in order to [M09 Exercises](/en/memory/pinned-memory-transfer-overlap/exercises/) and [solutions](/en/memory/pinned-memory-transfer-overlap/solutions/), [M10 Exercises](/en/memory/unified-memory-page-migration/exercises/) and [solutions](/en/memory/unified-memory-page-migration/solutions/), [M11 Exercises](/en/memory/stream-ordered-allocation-memory-pools/exercises/) and [solutions](/en/memory/stream-ordered-allocation-memory-pools/solutions/), [M12 Exercises](/en/memory/cooperative-groups/exercises/) and [solutions](/en/memory/cooperative-groups/solutions/), [M13 Exercises](/en/memory/asynchronous-copy-pipelines/exercises/) and [solutions](/en/memory/asynchronous-copy-pipelines/solutions/), and [M14 Exercises](/en/memory/cuda-graphs/exercises/) and [solutions](/en/memory/cuda-graphs/solutions/). The toolchain route links to [M15 Exercises](/en/toolchain/nvcc-compilation-flow/exercises/) and [solutions](/en/toolchain/nvcc-compilation-flow/solutions/), [M16 Exercises](/en/toolchain/ptx-cubin-fatbinary/exercises/) and [solutions](/en/toolchain/ptx-cubin-fatbinary/solutions/), [M17 Exercises](/en/toolchain/compiler-architecture-targets/exercises/) and [solutions](/en/toolchain/compiler-architecture-targets/solutions/), [M18 Exercises](/en/toolchain/separate-compilation-device-linking/exercises/) and [solutions](/en/toolchain/separate-compilation-device-linking/solutions/), and [M19 Exercises](/en/toolchain/cpp-dialect-boundaries/exercises/) and [solutions](/en/toolchain/cpp-dialect-boundaries/solutions/). The correctness route links directly to [Q01 Exercises](/en/correctness/cpu-references-tolerances-invariants/exercises/) and [solutions](/en/correctness/cpu-references-tolerances-invariants/solutions/), [Q03 Exercises](/en/correctness/memcheck-invalid-memory-access/exercises/) and [solutions](/en/correctness/memcheck-invalid-memory-access/solutions/), [Q04 Exercises](/en/correctness/racecheck-initcheck-synccheck/exercises/) and [solutions](/en/correctness/racecheck-initcheck-synccheck/solutions/), and [Q05 Exercises](/en/correctness/timing-asynchronous-gpu-work/exercises/) and [solutions](/en/correctness/timing-asynchronous-gpu-work/solutions/). Earlier units remain directly reachable through the strict graph above.

The [Lab Index](/en/labs/) directly lists [LAB01](/en/labs/record-cuda-environment/), [LAB02](/en/labs/vector-addition/), [LAB03](/en/labs/break-and-repair-indexing/), [LAB04](/en/labs/observe-coalescing/), [LAB05](/en/labs/remove-shared-memory-bank-conflicts/), and [LAB07](/en/labs/diagnose-four-sanitizer-failures/) in the current order. These are exactly the six complete public Labs. LAB06 does not appear in navigation because its required timeline-profiler prerequisite is not public. The [Visual Explainer Index](/en/visuals/) lists thirteen formal explainers: nine standalone pages, [VIS01](/en/visuals/kernel-journey/), [VIS02](/en/visuals/indexing/), [VIS03](/en/visuals/warp-divergence/), [VIS04](/en/visuals/memory-transactions/), [VIS05](/en/visuals/shared-memory-banks/), [VIS06](/en/visuals/memory-hierarchy-lifetime/), [VIS07](/en/visuals/stream-event-dependencies/), [VIS08](/en/visuals/page-migration/), and [VIS09](/en/visuals/artifact-pipeline/), plus embedded VIS19-VIS22. VIS08 requires M01, M02, and M10; VIS09 requires M15, M16, and M17. All thirteen are deterministic browser-only models with static or textual fallbacks; they execute no CUDA and have no CUDA Evidence Status. The current catalog has 6 Labs, 40 [Practice Bank](/en/practice/) entries, 13 Visual Explainers, 125 [Glossary](/en/glossary/) terms, and 50 [Sources and Version Record](/en/sources-and-versions/) entries, for 234 records total. Public content forms 148 Publication Pairs and 296 source routes. You can also open [About](/en/about/) directly.

M09-M19 and Q01/Q03-Q05 have empty compilation and runtime axes; static Learning Units, Exercises, and Context7 cross-checks grant no CUDA Evidence Status. EX01 retains its existing status: no Compile-Checked claim and Pending Hardware Verification runtime. EX03-EX09 each use one original C++17 implementation across Toolkit Lanes 11.8.0, 12.9.2, and 13.3.1; EX16 is one original Apache-2.0 C++17 project that builds eight isolated binaries across the same Lanes. EX05-EX09, EX16, LAB04, LAB05, and LAB07 have empty compilation evidence, Pending Hardware Verification runtime, empty recorded observations, and expected observations only. EX10 retains five ordinary Compile-Checked records from run 33275734951. It generates and inspects build artifacts but executes neither the final host artifact nor a GPU executable, so runtime is Runtime-Not-Applicable. Its separate CUDA 13.3.1/NVCC 13.3.73/GCC 14.2.0 C++23 probe is a narrow pass and declares no ordinary C++23 support, other compiler or platform, runtime, or performance. Host-only checks compile or execute no CUDA and cannot establish GPU correctness, overlap, migration, graph replay, or sanitizer behavior. The site ran no EX03-EX10/EX16 CUDA binary, Compute Sanitizer tool, or profiler and records no actual output, sanitizer report, timing, speedup, or other performance number for them.

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

**Fact-check date: 2026-08-29.** This page is not tied to a CUDA Toolkit version and does not grant CUDA evidence. See the [Glossary](/en/glossary/) for vocabulary and [Sources and Version Record](/en/sources-and-versions/) for publishing and CUDA sources reviewed for this release.
