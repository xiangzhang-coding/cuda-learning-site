---
title: Glossary
description: The initial canonical bilingual vocabulary for CUDA Learning Site.
pairId: glossary
counterpart: /glossary/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - use
  - entries
  - maintenance
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: glossary
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
      content: 'use,entries,maintenance'
---

<a class="locale-pair" data-locale-counterpart href="/glossary/" lang="zh-CN">阅读中文对应页</a>

This Glossary records the canonical vocabulary used by CUDA Learning Site. Each entry pairs the English term used in source material and tools with the preferred Chinese term used here.

## How to use it

“Avoid” identifies wording that would blur a teaching contract or resource type. It is not a ban on ordinary language. Each entry also names related Learning Units and any version boundary.

## Initial entries

### Learning Site · 学习站

- **Definition:** The complete public learning resource, including the Stable Curriculum, Runnable Examples, Labs, and Exercises.
- **Avoid:** Blog, documentation site.
- **Related unit:** O01.
- **Version note:** Not tied to a Toolkit version.

### Stable Curriculum · 稳定课程

- **Definition:** The prerequisite-bearing curriculum built on non-preview interfaces and durable concepts. Stability describes the teaching dependency contract, not a hardware-observation claim for every hands-on activity.
- **Avoid:** Main curriculum, latest-feature catalog.
- **Related unit:** O01.
- **Version note:** Maintained continuously rather than copied per Toolkit.

### Learning Unit · 学习单元

- **Definition:** A sequenced part of the curriculum that motivates one topic, develops its mental model and relevant historical context, and ends by checking understanding through practice.
- **Avoid:** Article, post.
- **Related unit:** O01.
- **Version note:** The resource type is version-independent.

### Publication Pair · 双语发布对

- **Definition:** The Chinese and English counterparts of one public page, sharing facts, structure, code, visuals, metadata, and source dates.
- **Avoid:** Translation fallback, optional translation.
- **Related unit:** O01.
- **Version note:** Applies to every release.

### Runnable Example · 可运行示例

- **Definition:** A standalone source project demonstrating one focused idea and serving as the canonical executable source for Learning Units.
- **Avoid:** Snippet, pseudocode, Lab.
- **Related unit:** O01.
- **Version note:** Each project declares its own compatibility.

### Lab · 实验

- **Definition:** A guided activity that learners run in an external CUDA-capable environment, with expected observations and acceptance criteria.
- **Avoid:** Demo, browser playground.
- **Related unit:** O01.
- **Version note:** Each Lab declares its environment requirements.

### Exercise · 练习

- **Definition:** A learner-completed task that states its goal, constraints, and acceptance criteria rather than only presenting an answer.
- **Avoid:** Example, Lab.
- **Related unit:** O01.
- **Version note:** The resource type is version-independent.

### Practice Bank · 练习题库

- **Definition:** A curated collection of original problems across the curriculum, with every entry linked to the Learning Units that teach its prerequisites.
- **Avoid:** FAQ, copied question dump.
- **Related unit:** O01.
- **Version note:** Individual entries declare version boundaries when needed.

### Visual Explainer · 可视化讲解

- **Definition:** An interactive or animated representation that exposes spatial, temporal, or architectural behavior. It may model CUDA concepts in the browser but never executes CUDA.
- **Avoid:** Decoration, CUDA demo.
- **Related unit:** O01.
- **Version note:** Conceptual models must be separated from hardware-specific behavior.

### Glossary · 术语表

- **Definition:** A learner-facing bilingual index of canonical terms used throughout the curriculum.
- **Avoid:** Dictionary, keyword list.
- **Related unit:** O01.
- **Version note:** Entries are reviewed with the curriculum but do not imply interface compatibility.

## Maintenance rule

These entries share O01's fact-check date of **2026-08-24**. A new entry must include the canonical English, preferred Chinese, definition, aliases to avoid, related units, and a version note when needed. Its [Chinese counterpart](/glossary/) must be complete at the same time.
