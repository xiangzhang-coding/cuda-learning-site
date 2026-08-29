---
title: 'M10 Exercises: Trace Managed-Memory Access and Migration'
description: Build a conditional page ledger, repair a ping-pong access pattern, and design an EX08 migration-evidence plan in three deeper static tasks.
pairId: m10-exercises
counterpart: /memory/unified-memory-page-migration/exercises/
factCheckDate: '2026-08-29'
license: CC-BY-4.0
provenance: original
structure:
  - prerequisites
  - instructions
  - exercise-1
  - exercise-2
  - exercise-3
  - next
resourceKind: exercise-set
unitId: M10-EXERCISES
prerequisites:
  - M10
relatedUnits:
  - M10
  - M09
  - VIS08
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m10-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M10-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M10 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M10,M09,VIS08' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/unified-memory-page-migration/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M10: Unified Memory and Page Migration](/en/memory/unified-memory-page-migration/) first. These Exercises use symbolic pages and conditional system models. They do not query residency, execute EX08, or observe migration.

## Instructions

For every access, write the accessor, touched pages, synchronization edge, known state, and permitted system behaviors. Mark an event as migration only when evidence establishes it; otherwise use “candidate” or “unknown.” Work before consulting the [reviewed solutions](/en/memory/unified-memory-page-migration/solutions/).

## Exercise 1: Build a conditional per-page ledger

**Goal:** Trace this sequence for managed pages A, B, and C: the CPU initializes all three; after an ordering boundary, the GPU reads B and C and writes C; after GPU completion, the CPU reads C.

**Constraints:** Start residency as unknown. Produce separate branches for software-coherent full support, hardware-coherent or documented direct access, and limited support. Preserve the same virtual pointer and correctness edges in every branch. Invent no page size, fault count, migration count, or duration.

**Expected evidence:** A row per access phase containing touched pages, prior known facts, possible service mechanism, possible next state, and the additional runtime artifact needed to turn a possibility into an observation.

**Acceptance criteria:** Accessibility is never used as proof of locality; the software branch may label cross-processor accesses as migration candidates; the hardware/direct branch permits no-migration service; the limited branch uses its coarser execution boundary; and the final CPU read follows GPU completion.

<details><summary>Hint 1</summary>Keep “same address” in the accessibility column, not the residency column.</details>

<details><summary>Hint 2</summary>Write one branch per applicable coherency model instead of forcing all systems through one arrow.</details>

## Exercise 2: Repair a CPU-GPU ping-pong design

**Goal:** Review a loop in which the CPU writes a managed page, one kernel updates it, the CPU immediately reads and rewrites it, and a second kernel consumes it, repeated over many pages.

**Constraints:** Preserve the algorithm's results while proposing a phase-oriented access order and one optional prefetch/advice strategy. Explain possible page-level movement cost without converting M02's 32-byte segments into page sizes. Treat hints as non-binding performance guidance and keep a valid on-demand path.

**Expected evidence:** An original access sequence, a locality-pressure diagnosis, two repaired schedules, explicit synchronization edges, and a list of claims that still require runtime evidence.

**Acceptance criteria:** The diagnosis identifies alternating processor access as possible migration or remote-access pressure; the repair groups ownership phases where the algorithm permits; prefetch is ordered before its consumer; advice does not become a correctness premise; and no variant is called faster.

<details><summary>Hint 1</summary>Ask whether every CPU touch must occur between the two kernels.</details>

<details><summary>Hint 2</summary>Moving a potential fault earlier changes scheduling; it does not prove the movement disappeared.</details>

## Exercise 3: Design an EX08 observation contract

**Goal:** Specify a future comparison of EX08 on-demand, advised, and prefetched modes that can distinguish correctness, applicable system model, page-fault or migration evidence, and performance evidence.

**Constraints:** Hold allocation size, access sequence, kernel work, output oracle, launch, and selected Toolkit Lane fixed. Record the four relevant device attributes, native-Linux/kernel/driver details, topology, exact tool and metric definitions, raw logs, warm-up, timing boundary, and repetitions. VIS08 and source comments provide no observation.

**Expected evidence:** A preregistered schema, three mode rows with empty observation fields, stop conditions, and allowed conclusions for unsupported metrics, no migration observed, migration observed, and inconclusive data.

**Acceptance criteria:** Correctness is checked before profiling or timing; the system model is selected from recorded attributes; a missing metric is not replaced by inference; fault, movement, residency, and elapsed time remain separate fields; and no current row contains fabricated data.

<details><summary>Hint 1</summary>The same physical event can appear differently in tools, so name the metric and its layer.</details>

<details><summary>Hint 2</summary>“No evidence of migration” is not the same statement as “the page never moved.”</details>

## Next

Inspect the separate [reviewed solutions](/en/memory/unified-memory-page-migration/solutions/), review [Practice Bank PB-R2-002](/en/practice/#pb-r2-002), and compare the conditional ledger with [VIS08](/en/visuals/page-migration/). Exercise set reviewed: **2026-08-29**.
