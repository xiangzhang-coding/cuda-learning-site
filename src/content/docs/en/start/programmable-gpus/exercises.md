---
title: 'O07 Exercises: Classify Interfaces and Rewrite the Causal History'
description: Classify fixed, programmed-stage, and general-purpose GPU interfaces, then replace a product timeline with a sourced abstraction-driven account.
pairId: o07-exercises
counterpart: /start/programmable-gpus/exercises/
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
unitId: O07-EXERCISES
prerequisites:
  - O07
relatedUnits:
  - O07
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: o07-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O07-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O07 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: O07 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/start/programmable-gpus/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [O07: Why GPUs Became Programmable](/en/start/programmable-gpus/) first. These Exercises test interface boundaries and historical reasoning, not recall of product names.

## How to answer

Finish a reviewable artifact before opening hints. Use O07's fixed-function, programmed graphics-stage, and general-purpose GPU interface definitions consistently. Do not open the separate [reviewed solutions](/en/start/programmable-gpus/solutions/) until both tasks have a complete draft.

## Exercise 1: Classify interface boundaries

**Goal:** Classify each interface as **fixed-function**, **programmed graphics stage**, or **general-purpose GPU**, then preserve important qualifications instead of forcing every case into a false equivalence.

| Case | Interface presented to the programmer |
| --- | --- |
| A | Select predefined transform, lighting, texture-combine, and fog state; submit no custom instruction sequence |
| B | Upload a per-vertex instruction program; clipping, primitive assembly, and rasterization remain outside it |
| C | Compile a C-like function for a vertex or fragment profile whose inputs and outputs come from a graphics API |
| D | Store nongraphics arrays in textures, invoke a fragment program with a drawing operation, and collect a render target |
| E | Write streams and kernels in an extended C language while a compiler and runtime map them onto graphics hardware |
| F | Launch a kernel over a grid of thread blocks without expressing the work as a drawing operation |

**Constraints:** Classify the exposed interface, not the workload's subject matter or the language's appearance. Use one primary class per case. Cases C, D, and E must also receive a qualifier that names the graphics constraint or abstraction layer that remains. Do not use product age as a reason.

**Expected evidence:** A six-row table with columns for primary class, programmer-controlled operation, retained invocation/input/output constraint, and a one-sentence justification.

**Acceptance criteria:** Every case has one primary class; A and B are distinguished by who defines the operation sequence; a nongraphics workload alone does not turn D into a general-purpose interface; C and E are not classified from C-like syntax alone; F mentions kernels and thread blocks rather than speed.

<details><summary>Hint 1</summary>For each case, ask who defines the operation, what event creates an invocation, where inputs come from, and where outputs are allowed to go.</details>

<details><summary>Hint 2</summary>Separate programming intent from the exposed contract. A system may target general-purpose work while its implementation still passes through graphics mechanisms.</details>

## Exercise 2: Rewrite chronology as causality

**Goal:** Replace this product-timeline explanation with one compact abstraction-driven causal account:

> GPU history is a list of newer products gaining more features. Shaders appeared, then Cg and Brook arrived, and finally CUDA replaced the old approach and made every program faster. The newest product therefore explains why GPUs became programmable.

**Constraints:** Organize the rewrite around pressure, interface response, and retained boundary. Cover independent graphics work and aggregate throughput; fixed-state inflexibility; selected vertex/fragment programmability; graphics-mediated GPGPU; the distinct language/runtime roles of Cg and Brook; and CUDA's heterogeneous kernels, thread blocks, locality, and block independence. Attribute every date or interface-specific fact to O07's owner sources. Make no product-generation ranking, universal speedup, replacement, or “first ever” claim.

**Expected evidence:** One causal paragraph followed by a claim-to-source map. The map must identify at least one source for each major transition and include the Khronos specifications, Cg DOI, BrookGPU page or DOI, CUDA Programming Guide v13.3 introduction, and Nickolls et al. 2008.

**Acceptance criteria:** Each transition answers “what pressure made the previous abstraction insufficient?”; Cg and Brook have different roles; CUDA's shift is about the programming model rather than a product name; block independence is connected to scalability; every historically specific claim has a matching source.

<details><summary>Hint 1</summary>Draft each sentence as “because X exposed limit Y, interface Z made A expressible while retaining boundary B.” Remove the template words afterward.</details>

<details><summary>Hint 2</summary>Use the ARB specifications for explicit stage programs, the Cg and Brook papers for language/runtime claims, and the CUDA guide plus 2008 paper for the general-purpose model and block scalability.</details>

## Next step

Compare both artifacts with the [reviewed solutions](/en/start/programmable-gpus/solutions/), then transfer the causal method to [Practice Bank PB-R1-004](/en/practice/#pb-r1-004).
