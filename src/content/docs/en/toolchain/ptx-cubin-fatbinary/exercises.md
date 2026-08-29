---
title: 'M16 Exercises: Audit PTX, Cubin, SASS, and Fatbinary Artifacts'
description: Use three static tasks to classify standalone and embedded artifacts, build a SASS-plus-PTX fallback tree, and repair a report that inflates image inventory and Lane-specific PTX observations into runtime evidence.
pairId: m16-exercises
counterpart: /toolchain/ptx-cubin-fatbinary/exercises/
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
unitId: M16-EXERCISES
prerequisites:
  - M16
relatedUnits:
  - M16
  - M17
  - M18
  - EX10
  - VIS09
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m16-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M16-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M16 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M16,M17,M18,EX10,VIS09' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/toolchain/ptx-cubin-fatbinary/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [M16: PTX, Cubins, SASS, and Fatbinaries](/en/toolchain/ptx-cubin-fatbinary/) first. These Exercises create only artifact ledgers, a conditional selection tree, and evidence repairs. They compile no artifact, call no driver, execute no kernel, and add no Evidence Status.

## How to answer

For every answer, keep artifact kind, standalone or embedded carrier, virtual or real target, inspection operation, observed fact, and unobserved fact separate. Do not fill in driver behavior from a filename, a larger version number, or a nonempty inventory. Complete all three tasks before consulting the [reviewed solutions](/en/toolchain/ptx-cubin-fatbinary/solutions/).

## Exercise 1: Classify standalone artifacts and embedded images

**Goal:** Audit a build-directory ledger retaining `kernel.ptx`, `kernel.cubin`, `kernel.fatbin`, `kernel.o`, and `app`. Its static notes say only that the PTX text has `.version` and `.target`, the standalone cubin can be disassembled, and inventories for the external fatbinary and `app` each list one cubin image and one PTX image. Classify every item as PTX, cubin, fatbinary container, host carrier, or SASS inspection view.

**Constraints:** Do not classify by suffix alone; name the content or tool evidence required. Distinguish a standalone `.fatbin` from an embedded payload in a host object or executable, and distinguish a cubin binary from its SASS disassembly. Claim no selected, JIT-compiled, or executed image.

**Expected evidence:** An artifact/carrier/image ledger, a `source -> PTX/cubin -> fatbinary -> optional host embedding` relationship diagram, and the input boundary for every inspection operation.

**Acceptance criteria:** PTX is versioned virtual ISA text; a cubin is an architecture-specific binary; SASS is machine instructions inspected from a cubin; a fatbinary is a container for multiple translations; `kernel.o` and `app` are host artifacts that may carry embedded images, not cubin synonyms; every runtime column remains unknown.

<details><summary>Hint 1</summary>Ask “what is this file or container?” before asking “which images are inside it?” Keep those levels separate.</details>

<details><summary>Hint 2</summary>The text output of `cuobjdump --dump-sass` is an inspection result, not a fifth portable input artifact.</details>

## Exercise 2: Build a SASS-plus-PTX fallback tree

**Goal:** A static inventory lists two real-target cubin images and one virtual-target PTX image. Write a decision tree for three launch contexts: the driver finds an applicable binary load image; it finds no binary image but has an acceptable PTX candidate whose assumptions apply; neither candidate class qualifies.

**Constraints:** Do not infer architecture, family, or suffix compatibility from the numeric `XY` value alone. Every branch must list the selected GPU, loaded driver, artifact hash, declared targets, and required observation. Keep “candidate exists” separate from “driver selected it” or “JIT succeeded.”

**Expected evidence:** A three-branch conditional tree, a required-coordinate table for every transition, and the evidence still missing for binary selection, PTX JIT, and a no-candidate result.

**Acceptance criteria:** The applicable-binary branch points to SASS in a cubin but says selected only after a selection-specific observation; the PTX branch becomes a JIT candidate only when no applicable binary image exists and driver/target checks pass, and remains unconfirmed before a JIT-specific observation; the third branch rejects execution inference from a nonempty fatbinary; no branch makes a correctness or performance claim.

<details><summary>Hint 1</summary>Inventory answers “which choices exist”; a driver observation answers “which choice was used.”</details>

<details><summary>Hint 2</summary>Represent the PTX fallback with two transitions: candidate/compatibility review first, observed JIT result second.</details>

## Exercise 3: Repair overclaims from Lane observations and image inventory

**Goal:** Repair this report: it sees selected Toolkit owner pages labeled PTX ISA 7.8, 8.8, and 9.3 and lists cubin/SASS plus PTX in one host binary, then concludes “PTX is universally compatible; the driver certainly selected SASS and did no JIT; the kernel executed correctly; and the binary path is faster on every GPU.”

**Constraints:** Keep Toolkit 11.8.0, 12.9.2, and 13.3.1 with PTX ISA 7.8, 8.8, and 9.3 as three Lane-specific documentation observations. Name the missing evidence for selection, JIT, execution, correctness, and performance separately. Do not let one observation substitute for another.

**Expected evidence:** A `claim -> actual observation -> justified wording -> missing evidence` repair matrix and a corrected release note of at most 150 words.

**Acceptance criteria:** The corrected note claims only the three exact PTX documentation coordinates and the static image inventory; makes no universal compatibility claim; marks selection and JIT unobserved; marks execution, correctness, and performance unestablished; and requires exact source/artifact/toolchain, GPU/driver, selection or JIT observation, completion, oracle, and measurement records before any future upgrades.

<details><summary>Hint 1</summary>A documentation-page heading is a source coordinate, not the emitted `.version` of every artifact and not a driver-acceptance matrix.</details>

<details><summary>Hint 2</summary>Ask six questions in order: contained, selected, JIT-compiled, executed, correct, faster. Each needs its own evidence.</details>

## Next step

After completing the tasks, inspect the separate [reviewed solutions](/en/toolchain/ptx-cubin-fatbinary/solutions/) and then audit [Practice Bank PB-R2-008](/en/practice/#pb-r2-008). Use [TERM-118 PTX](/en/glossary/#term-118), [TERM-119 cubin](/en/glossary/#term-119), [TERM-120 fatbinary](/en/glossary/#term-120), [TERM-121 SASS](/en/glossary/#term-121), and the [TERM-060](/en/glossary/#term-060)/[TERM-061](/en/glossary/#term-061) target pair to keep vocabulary and target scope separate.
