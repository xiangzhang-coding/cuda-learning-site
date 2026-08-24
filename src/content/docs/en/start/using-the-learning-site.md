---
title: 'O01: Using the Learning Site'
description: Understand the resource types, the route available today, and the site boundaries.
pairId: o01
counterpart: /start/using-the-learning-site/
factCheckDate: '2026-08-24'
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
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: o01
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'outcome,resource-types,published-route,themes,workflow,boundaries,check'
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

As of **2026-08-24**, the complete prerequisite shape is:

1. [Home](/en/)
2. **O01: Using the Learning Site** (this page)
3. After O01, enter [O02: Recording Evidence Honestly](/en/start/evidence-status/) and [O03: Reading an Environment Manifest](/en/start/environment-manifest/) as separate branches.

O02 and O03 each have Exercises and separate reviewed solutions. The [EX02 vector-addition Runnable Example](/en/examples/vector-addition/) publishes its canonical source, build contract, and independent compilation/runtime evidence boundary. The [Practice Bank](/en/practice/) currently contains two complete entries linked back to O02 and O03. You can also open the [Glossary](/en/glossary/), [Sources and Version Record](/en/sources-and-versions/), and [About](/en/about/) directly. If learning material is absent from navigation, it is not public; an identifier or mention does not imply that a page exists.

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

**Fact-check date: 2026-08-24.** This page is not tied to a CUDA Toolkit version and does not grant CUDA evidence. See the [Glossary](/en/glossary/) for vocabulary and [Sources and Version Record](/en/sources-and-versions/) for publishing and CUDA sources reviewed for this release.
