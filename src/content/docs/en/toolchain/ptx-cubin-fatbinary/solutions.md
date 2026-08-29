---
title: 'M16 Reviewed Solutions: Audit PTX, Cubin, SASS, and Fatbinary Artifacts'
description: Standalone and embedded artifact ledgers, a conditional SASS-plus-PTX selection tree, and repairs for Lane-specific PTX and static-inventory overclaims in the M16 Exercises.
pairId: m16-solutions
counterpart: /toolchain/ptx-cubin-fatbinary/solutions/
factCheckDate: '2026-08-29'
license: CC-BY-4.0
provenance: original
structure:
  - review
  - solution-1
  - solution-2
  - solution-3
  - valid-alternatives
  - common-errors
resourceKind: solution-set
unitId: M16-SOLUTIONS
prerequisites:
  - M16-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m16-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M16-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M16-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/toolchain/ptx-cubin-fatbinary/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These answers solve the [M16 Exercises](/en/toolchain/ptx-cubin-fatbinary/exercises/) as static artifact and evidence reviews. They do not replace the canonical EX10 project, generate PTX, cubin, or fatbinary artifacts, call a driver or JIT compiler, execute a kernel, or establish correctness or performance evidence.

## Solution 1: Classify standalone artifacts and embedded images

Separate the carrier first, then classify images inside that carrier:

| Item | Artifact or carrier classification | Static check | Established | Still unknown |
| --- | --- | --- | --- | --- |
| `kernel.ptx` | Standalone PTX text | Read `.version`, `.target`, and module text | The file's declared PTX language and target coordinates | Driver acceptance, JIT, execution |
| `kernel.cubin` | Standalone architecture-specific CUDA ELF binary | Identify ELF/cubin with a binary utility and disassemble if needed | Target, sections, and instructions of the inspected cubin | Selection, load, execution |
| `kernel.fatbin` | Standalone external fatbinary container | Run an ELF/PTX inventory with `cuobjdump` | Cubin/PTX images listed in that container | Which image runtime uses |
| `kernel.o` | Host object that may embed a fatbinary payload | Inventory the host object | Embedded images actually listed by the tool | Host-link result or driver behavior |
| `app` | Host executable that may embed a fatbinary payload | Inventory the executable | Embedded images actually listed by the tool | Launch, selection, JIT, completion |
| SASS output | Retained disassembly view of cubin machine instructions | `cuobjdump --dump-sass` or `nvdisasm` for a standalone cubin | Instructions rendered from the inspected binary | Whether instructions loaded or executed |

The relationship is `source -> PTX and/or cubin -> fatbinary -> standalone .fatbin or embedded host payload`. PTX and cubin can also be standalone phase outputs; the relationship does not require every intermediate file to materialize. `cuobjdump` can inspect standalone cubins, external fatbinaries, and supported host binaries. The input boundary for `nvdisasm` is a standalone cubin. Every runtime field must remain unknown.

## Solution 2: Build a SASS-plus-PTX fallback tree

Fix the coordinates before taking any branch: artifact hash; every image kind and declared virtual or real target; selected GPU identity and capability; loaded driver; selected observation mechanism for selection or JIT. Then proceed conditionally:

| Branch | Static premise | Next transition | Justified conclusion |
| --- | --- | --- | --- |
| Applicable binary candidate | Inventory contains a cubin, and an independent target review makes it a binary-load candidate for the current GPU/driver | Collect a selection-specific observation | Before observation, say candidate only; afterward, name the selected cubin/SASS branch |
| PTX fallback candidate | No applicable binary image exists; inventory contains PTX; driver acceptance and virtual-target assumptions pass separately | Collect a JIT-specific success or failure observation | Before observation, say JIT candidate only; afterward, report only the observed JIT result |
| No candidate | No applicable binary image exists, or PTX is absent, rejected, or has inapplicable assumptions | Retain an unsupported record or the load/launch error | A nonempty container does not establish an executable path |

Binary selection or successful JIT is still not kernel execution. Execution additionally needs launch and completion evidence, correctness needs an oracle, and performance needs correctness-qualified measurement. The decision tree therefore leaves all three columns unestablished.

## Solution 3: Repair overclaims from Lane observations and image inventory

| Original claim | Actual observation | Justified wording | Evidence still required to upgrade it |
| --- | --- | --- | --- |
| PTX is universally compatible | Three owner coordinates are headed PTX ISA 7.8, 8.8, and 9.3 | The selected Toolkit 11.8.0, 12.9.2, and 13.3.1 Lanes were reviewed against their corresponding archived/current documentation headings | Actual emitted `.version`/`.target`, driver acceptance, and target-feature review |
| The driver selected SASS | Static inventory contains a cubin whose disassembly renders SASS | The artifact contains an inspected cubin/SASS candidate | Selection-specific observation on the selected GPU/driver/artifact |
| No JIT occurred | Static inventory also contains PTX | A PTX fallback is present; JIT is unobserved | JIT-specific observation bound to the same coordinates |
| The kernel executed | No launch record exists | Execution is unestablished | Launch result, asynchronous error check, completion, and Environment Manifest |
| The result is correct | No output or oracle exists | Correctness is unestablished | Inputs, reference or invariant, comparison, and pass/fail result |
| The binary path is faster everywhere | No qualifying runs or samples exist | No performance claim | Defined comparison, correctness-qualified runs, raw samples, statistics, and scope |

A qualifying corrected note is:

> The 2026-08-29 source review observed PTX ISA 7.8, 8.8, and 9.3 headings at the selected Toolkit 11.8.0, 12.9.2, and 13.3.1 documentation coordinates respectively. These are Lane-specific observations, not a universal compatibility claim. A static binary-utility inventory lists cubin and PTX images in the named host artifact and can render SASS from the inspected cubin. That inventory observes neither driver selection nor JIT and executes no kernel. Execution, correctness, and performance are therefore unestablished, and the unit evidence arrays remain empty.

## Valid alternatives

- A normalized ledger is acceptable, as are separate carrier and image tables, provided the embedded relationship is retained.
- Choose a selection-observation mechanism from the real driver/tool contract; the answer need not invent a universal selector.
- If no JIT observation is available, indeterminate is more accurate than inference from a cache, startup delay, or PTX presence.
- Complete disassembly may be retained as artifact evidence, but its summary must identify the exact input hash and tool version and must not upgrade to execution evidence.

## Common errors

- Treating a `.ptx` suffix as sufficient version and target evidence.
- Treating a cubin and its SASS disassembly as two independent portable artifacts.
- Collapsing a standalone `.fatbin`, an embedded fatbinary payload, and the whole host executable into one type.
- Claiming driver selection after seeing a real-target image, or claiming JIT after seeing PTX.
- Rewriting the PTX ISA 7.8, 8.8, and 9.3 documentation observations as universal driver compatibility.
- Inferring execution, correctness, or speedup from a nonempty inventory.
- Omitting the exact source commit, artifact hash, tool version, GPU/driver, or completion, oracle, and measurement boundaries.

Reviewed: **2026-08-29**. The hardware gate is none; compilation and runtime evidence axes remain empty.
