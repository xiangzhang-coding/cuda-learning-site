---
title: 'O01: Using the Learning Site'
description: Understand the resource types, the route available today, and the site boundaries.
pairId: o01
counterpart: /start/using-the-learning-site/
factCheckDate: '2026-08-26'
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
      content: '2026-08-26'
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

As of **2026-08-26**, the completely published strict prerequisite graph is:

1. [Home](/en/)
2. **O01: Using the Learning Site** (this page)
3. [O02: Recording Evidence Honestly](/en/start/evidence-status/), [O03: Reading an Environment Manifest](/en/start/environment-manifest/), [O04: C++17 Refresher for CUDA Learners](/en/start/cpp17-for-cuda/), [O05: Reproducible Linux Command-Line Work](/en/start/linux-command-line/), and [O06: Architecture Refresher](/en/start/architecture-refresher/) all depend directly on O01.
4. [O07: Why GPUs Became Programmable](/en/start/programmable-gpus/) depends only on O06.
5. [O08: Preparing a Reference Environment Candidate](/en/start/reference-environment-candidate/) requires O02, O03, and O05 together.
6. The [EX01 Environment Report Runnable Example](/en/examples/environment-report/) has no strict Learning Unit prerequisite. [LAB01: Record and Interpret a CUDA Environment](/en/labs/record-cuda-environment/) requires both O03 and O08 and uses EX01.
7. The kernel route enters [F01: From Prediction to a First CUDA Kernel](/en/foundations/first-cuda-kernel/) after O03. [F02: Understanding the CUDA Execution Hierarchy](/en/foundations/execution-hierarchy/) depends on F01, [F03: Make Multidimensional Indexing and Bounds a Correctness Contract](/en/foundations/multidimensional-indexing/) depends on F02, and [F04: The Explicit Host-Device Resource Lifecycle](/en/foundations/host-device-lifecycle/) also depends on F01.
8. [F05: CUDA Errors Are Often Asynchronous](/en/foundations/asynchronous-errors/) depends only on F04; [F06: Compute Capability Is a Feature Contract](/en/foundations/compute-capability/) requires F02 and O03; [F07: Distinguish CUDA Runtime API and Driver API Roles](/en/foundations/runtime-driver-api/) requires F04 and F05; and [F08: Launch Geometry Is a Correctness and Resource Decision Before Speed](/en/foundations/launch-geometry/) requires F02, F03, and F06.
9. The [EX03 Multidimensional Indexing Runnable Example](/en/examples/multidimensional-indexing/) depends on F03 and supplies canonical source to F03/F04; the [EX04 Error Handling Lifecycle Runnable Example](/en/examples/error-handling-lifecycle/) depends only on F05. [LAB02](/en/labs/vector-addition/) requires O03 and F01 and uses canonical [EX02](/en/examples/vector-addition/); [LAB03: Break and Repair Indexing](/en/labs/break-and-repair-indexing/) requires F03 and F05 and uses EX04. F08 is related to LAB03 but is not a LAB03 prerequisite.

Choose the next step by the gap you need to close. Apply the O04 C++17 refresher while reading F01-F08 and EX02-EX04, but do not add it as a prerequisite. The Linux-record route must combine O02, O03, and O05 before O08. EX01 remains directly available, while LAB01 requires both O03 and O08. The architecture route follows O06 with O07 before carrying those models into Foundations. F05 continues the error lifecycle from F04; F06 joins F02/O03; F07 joins F04/F05; and F08 joins F02/F03/F06. These recommendations add no prerequisite edge beyond the graph above.

O02-O08 and F01-F08 all have direct Exercises and separate reviewed solutions. The foundation route links directly to [F01 Exercises](/en/foundations/first-cuda-kernel/exercises/) and [solutions](/en/foundations/first-cuda-kernel/solutions/), [F02 Exercises](/en/foundations/execution-hierarchy/exercises/) and [solutions](/en/foundations/execution-hierarchy/solutions/), [F03 Exercises](/en/foundations/multidimensional-indexing/exercises/) and [solutions](/en/foundations/multidimensional-indexing/solutions/), [F04 Exercises](/en/foundations/host-device-lifecycle/exercises/) and [solutions](/en/foundations/host-device-lifecycle/solutions/), [F05 Exercises](/en/foundations/asynchronous-errors/exercises/) and [solutions](/en/foundations/asynchronous-errors/solutions/), [F06 Exercises](/en/foundations/compute-capability/exercises/) and [solutions](/en/foundations/compute-capability/solutions/), [F07 Exercises](/en/foundations/runtime-driver-api/exercises/) and [solutions](/en/foundations/runtime-driver-api/solutions/), and [F08 Exercises](/en/foundations/launch-geometry/exercises/) and [solutions](/en/foundations/launch-geometry/solutions/).

The [Lab Index](/en/labs/) directly lists [LAB01](/en/labs/record-cuda-environment/), [LAB02](/en/labs/vector-addition/), and [LAB03](/en/labs/break-and-repair-indexing/) in the current order; navigation exposes no unfinished Learning Unit. The [Visual Explainer Index](/en/visuals/) lists six formal explainers: standalone VIS01 Kernel Journey and VIS02 Indexing, plus [VIS19 Error-Surfacing Timeline](/en/foundations/asynchronous-errors/#vis19), [VIS20 Compute-Capability Contract Filter](/en/foundations/compute-capability/#vis20), [VIS21 Runtime/Driver API Boundary](/en/foundations/runtime-driver-api/#vis21), and [VIS22 Block-Shape Constraint Explorer](/en/foundations/launch-geometry/#vis22), embedded in F05-F08 respectively. Index cards link directly to the four page anchors, and navigation creates no four duplicate standalone pages. All six provide static or textual fallbacks, execute no CUDA, and create no evidence. F04's original static lifecycle table remains neither a Visual Explainer nor an evidence source. The [Practice Bank](/en/practice/) now contains seventeen complete entries linked back to O02-O08 and F01-F08. You can also open the expanded [Glossary](/en/glossary/), [Sources and Version Record](/en/sources-and-versions/), and [About](/en/about/) directly. If learning material is absent from navigation, it is not public; an identifier or mention does not imply that a page exists.

EX01 retains its existing status: no Compile-Checked claim and Pending Hardware Verification runtime. EX03 also retains its existing status: one original C++17 source across Toolkit Lanes 11.8.0, 12.9.2, and 13.3.1, empty compilation evidence, and Pending Hardware Verification runtime. EX04 and LAB03 likewise each have empty compilation evidence and Pending Hardware Verification runtime. Host-only checks compile or execute no CUDA. The site ran no EX03 or EX04 CUDA binary and records no actual output, error code, timing, or performance number for either subject.

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

**Fact-check date: 2026-08-26.** This page is not tied to a CUDA Toolkit version and does not grant CUDA evidence. See the [Glossary](/en/glossary/) for vocabulary and [Sources and Version Record](/en/sources-and-versions/) for publishing and CUDA sources reviewed for this release.
