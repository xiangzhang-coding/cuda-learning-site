---
title: 'O07 Reviewed Solutions: Interface Boundaries and Causal History'
description: Reviewed classifications, causal rewriting, valid alternatives, and common errors for the two O07 Exercises.
pairId: o07-solutions
counterpart: /start/programmable-gpus/solutions/
factCheckDate: '2026-08-26'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: O07-SOLUTIONS
prerequisites:
  - O07-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: o07-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: O07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: O07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/start/programmable-gpus/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [O07 Exercises](/en/start/programmable-gpus/exercises/). Compare the controlling interface and retained boundary before comparing labels or prose. A different wording is valid only when it preserves those distinctions and attributes historical facts to the same owner sources.

## Solution 1: Classify interface boundaries

| Case | Primary class | Programmer controls | Retained constraint and reasoning |
| --- | --- | --- | --- |
| A | Fixed-function | Values and choices for predefined operations | The system owns the operation sequence, so configuration is not stage programming |
| B | Programmed graphics stage | An explicit per-vertex instruction sequence | Graphics invocation and the stages before and after the vertex program still define its role |
| C | Programmed graphics stage | C-like source for a selected vertex or fragment profile | Syntax is high level, but the profile and graphics API still define stage inputs and outputs |
| D | Programmed graphics stage | A fragment calculation used for a nongraphics result | The workload is general-purpose in intent, but drawing creates invocations and a render target constrains output |
| E | General-purpose GPU | Streams and kernels exposed by a language, compiler, and runtime | The surface targets general-purpose stream computation, while its implementation remains graphics-mediated |
| F | General-purpose GPU | A kernel, grid, thread blocks, data, and declared coordination | Work is expressed without drawing semantics; the CUDA runtime and memory/synchronization model retain constraints |

The decisive test is the exposed contract. Case D demonstrates why workload intent is insufficient: nongraphics arithmetic can still use a programmed graphics-stage interface. Case E demonstrates the opposite nuance: Brook presents a general-purpose language/runtime abstraction even though that abstraction maps onto graphics hardware. C-like syntax alone settles neither case C nor case E.

## Solution 2: Rewrite chronology as causality

Graphics processing exposed large sets of similarly processed vertices and fragments, so aggregate throughput mattered more than minimizing one serial item's latency; the [programmable vertex-engine paper](https://research.nvidia.com/publication/2001-08_user-programmable-vertex-engine) also shows how independent vertex work could remain inside a parallel graphics pipeline. Fixed state then became an expression bottleneck because applications could choose predefined operations but not define their sequence. The [ARB_vertex_program](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_vertex_program.txt) and [ARB_fragment_program](https://registry.khronos.org/OpenGL/extensions/ARB/ARB_fragment_program.txt) specifications answered that pressure with explicit programs for selected stages while retaining graphics invocation, inputs, outputs, and surrounding stages. [Cg](https://doi.org/10.1145/882262.882362) raised authoring from target instructions to a C-like language and compiler, but still targeted graphics profiles. GPGPU work then repurposed textures, fragment invocations, and render targets for nongraphics calculations, making graphics encoding itself the next obstacle. [BrookGPU](https://graphics.stanford.edu/projects/brookgpu/) and its [paper](https://doi.org/10.1145/1015706.1015800) exposed streams and kernels through a compiler/runtime while retaining a graphics-mediated implementation. CUDA changed the primary abstraction to heterogeneous host/device programs, kernels, grids, thread blocks, and explicit locality, as summarized by the [CUDA Programming Guide v13.3](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/introduction.html). The [2008 CUDA paper](https://doi.org/10.1145/1365490.1365500) explains why independent blocks permit scheduling across different core counts, making block independence a scalability rule rather than a universal speed guarantee.

This rewrite passes because every transition names a pressure, the new expressive surface, and a retained boundary. It assigns Cg to graphics-language authoring, Brook to a general-purpose stream abstraction over graphics mechanisms, and CUDA to a primary heterogeneous programming model. Dates and interface facts point to owner sources, while the causal organization is original.

## Valid alternatives

- “Stage-programmable graphics interface” is equivalent to “programmed graphics stage” when the explanation retains graphics invocation and I/O boundaries.
- Case E may be labeled “general-purpose language/runtime over a graphics-backed implementation.” It should not be reduced to a fragment program or described as free of graphics constraints.
- A causal account may begin with fixed-state inflexibility before discussing throughput, provided it later explains why independent work made the GPU substrate attractive.
- Source attribution may use footnotes, parenthetical citations, or a claim-to-source table. The claim and owner source must remain easy to match.
- The final paragraph may discuss CUDA before Brook for comparison, but its causal links must not imply that date order alone caused the interface change.

## Common errors

- Classifying from C-like syntax instead of invocation, inputs, outputs, and retained constraints.
- Calling case D a general-purpose interface merely because its data is nongraphics.
- Treating Cg and Brook as interchangeable or claiming either removed every graphics-era restriction.
- Describing CUDA as only a later product feature and omitting heterogeneous kernels, locality, or block independence.
- Claiming universal speedups, a complete replacement of CPUs or graphics APIs, or an unsupported “first ever” milestone.
- Copying a source's chronology without attributing interface-specific facts or building an original causal explanation.

Reviewed: **2026-08-26**. These solutions review concepts and source use; they report no benchmark or product ranking.
