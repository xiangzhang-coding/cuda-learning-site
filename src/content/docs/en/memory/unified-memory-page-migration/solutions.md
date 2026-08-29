---
title: 'M10 Reviewed Solutions: Trace Managed-Memory Access and Migration'
description: A conditional page ledger, phase-oriented ping-pong repair, and EX08 observation schema for the three M10 Exercises.
pairId: m10-solutions
counterpart: /memory/unified-memory-page-migration/solutions/
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
unitId: M10-SOLUTIONS
prerequisites:
  - M10-EXERCISES
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
    attrs: { name: 'cuda:pair-id', content: m10-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-29' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M10-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M10-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/memory/unified-memory-page-migration/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These reviewed answers solve the [M10 Exercises](/en/memory/unified-memory-page-migration/exercises/) with conditional system branches. They provide no runtime residence history, page-fault count, migration record, or performance result.

## Solution 1: Build a conditional per-page ledger

| phase | stable facts | software-coherent full support | hardware-coherent or direct access | limited support |
| --- | --- | --- | --- | --- |
| after allocation | pointer and ownership are established; residency is unknown | no placement is inferred before access | no placement is inferred before access | owner rules apply; no source-only residence claim |
| CPU initializes A, B, C | CPU writes are ordered before GPU use | first touch may establish host-local backing | CPU may access through the coherent mapping; backing remains system-dependent | managed data begins under the limited model's host-side policy |
| GPU reads B/C and writes C | GPU phase follows the ordering edge | B/C accesses may fault and migrate pages toward the GPU | coherent or remote service without page migration is permitted | movement may occur at the kernel-launch boundary rather than per touched page |
| CPU reads C | GPU completion is required first | C may fault and migrate back toward the CPU | documented direct host access can service C without migration | synchronization may return managed data under the limited model's CPU-access policy |

The table records permissible outcomes, not observations. The pointer remains stable in every branch. Only an Environment Manifest plus runtime evidence can select what happened to page C in one execution.

## Solution 2: Repair a CPU-GPU ping-pong design

The original order alternates the active processor around each kernel. On a fault-and-migrate system, that can repeatedly move pages; on a direct-access system, it can instead generate remote/coherence traffic. The source alone cannot choose between those costs.

One phase-oriented repair is: initialize all pages on the CPU, establish the GPU-use edge, run both GPU phases while keeping intermediate data on the device side, establish completion, and then perform the required CPU reads and rewrites in one host phase. This is legal only when the algorithm does not require the removed intermediate host decision.

A second candidate keeps the same phases but prefetches the range toward the next processor before each phase, ordered in the relevant stream, and optionally records advice matching the expected access pattern. The on-demand path remains the correctness fallback. Prefetch/advice may move or reshape cost, but the repaired source proves neither fewer migrations nor better time.

## Solution 3: Design an EX08 observation contract

| field group | required fields | current value |
| --- | --- | --- |
| invariant | allocation size, access sequence, input, kernel work, output oracle, launch, Toolkit Lane | declared before run |
| system model | Native Linux, kernel, driver, GPU, topology, four device attributes | unobserved |
| correctness | API status, completion boundary, CPU comparison for each mode | unobserved |
| movement | tool/version, metric definition and layer, raw page-fault or migration log, uncertainty | unobserved |
| timing | correctness pass, warm-up, boundary, repetitions, raw samples | unobserved |
| conclusion | supported model, observed behavior, limits, allowed comparison | no runtime conclusion |

Stop on correctness failure. If attributes do not support the intended interpretation, report that the mode is unsupported or under-specified. If the movement metric is unavailable, retain an empty field rather than deriving migration from time or VIS08. A zero reported count means only that the named tool and metric reported zero under that run; it does not prove universal no-migration behavior.

## Valid alternatives

- Track each page symbolically or group pages with identical access histories, provided the grouping never hides a different accessor.
- Keep explicit copies when ownership phases are clearer or when managed-memory behavior cannot be measured reliably.
- Use advice without prefetch, prefetch without advice, or an on-demand baseline, provided all modes share the same correctness contract.
- Add a residency-related query when its exact API semantics and observation time are recorded, without treating preferred or last-prefetch location as full residence history.

## Common errors

- Treating one virtual pointer as proof of one physical location.
- Drawing a migration arrow for every CPU/GPU handoff on every system.
- Reading managed output on the host before establishing GPU completion.
- Converting M02's 32-byte transaction segments into managed-memory page sizes.
- Treating `cudaMemAdvise` or `cudaMemPrefetchAsync` as permanent placement guarantees.
- Reporting VIS08 colors, source comments, elapsed time, or a missing metric as migration evidence.

Reviewed: **2026-08-29**. Compilation, runtime, expected-observation, and recorded-observation axes remain empty.
