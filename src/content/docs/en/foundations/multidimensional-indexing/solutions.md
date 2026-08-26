---
title: 'F03 Reviewed Solutions: Diagnose and Repair Multidimensional Indexing Contracts'
description: Separate reviewed solutions, valid alternatives, and common errors for the three F03 Exercises.
pairId: f03-solutions
counterpart: /foundations/multidimensional-indexing/solutions/
factCheckDate: '2026-08-26'
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
unitId: F03-SOLUTIONS
prerequisites:
  - F03-EXERCISES
relatedUnits:
  - F03
  - VIS02
  - EX03
  - F04
exampleIds:
  - EX03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F03,VIS02,EX03,F04' }
  - tag: meta
    attrs: { name: 'cuda:example-ids', content: EX03 }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/multidimensional-indexing/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [F03 Exercises](/en/foundations/multidimensional-indexing/exercises/). Compare per-axis reasoning, access order, and the evidence boundary before comparing final numbers.

## Solution 1: Classify a three-dimensional partial fringe

The grid shape is `(ceil(10 / 4), ceil(7 / 3), ceil(5 / 2)) = (3, 3, 3)`. For `blockIdx = (2, 2, 2)`, the block origin is `(8, 6, 4)`.

| `threadIdx` | global `(gx, gy, gz)` | x bounds | y bounds | z bounds | result |
| --- | --- | --- | --- | --- | --- |
| `(1, 0, 0)` | `(9, 6, 4)` | `9 < 10` | `6 < 7` | `4 < 5` | IN; index `349` |
| `(2, 0, 0)` | `(10, 6, 4)` | false | true | true | OUT; x invalid |
| `(1, 1, 0)` | `(9, 7, 4)` | true | false | true | OUT; y invalid |
| `(1, 0, 1)` | `(9, 6, 5)` | true | true | false | OUT; z invalid |

The sole legal coordinate maps to `((4 * 7) + 6) * 10 + 9 = 349`, the final position among 350 elements. Every other coordinate stops before flattening.

## Solution 2: Repair x/y/z bounds protection

The repaired early-return semantics are: return when `gx >= width OR gy >= height OR gz >= depth`. Each of the three counterexamples from Exercise 1 makes only the first, second, or third invalid predicate true. The original `AND` therefore evaluates to false in all three cases and lets the defective thread continue.

An equivalent positive form encloses flattening and all array accesses only when `gx < width AND gy < height AND gz < depth`. Both forms preserve the same rule: legality is the intersection of all active-axis predicates, and failure on any axis permits no access.

## Solution 3: Repair flattening while preserving an independent reference boundary

The x-fastest row-major contract is `index = ((gz * height) + gy) * width + gx`. Within a `10 x 7 x 5` extent:

| coordinate | expected index | increment meaning |
| --- | ---: | --- |
| `(0, 0, 0)` | 0 | origin |
| `(1, 0, 0)` | 1 | x advances one element |
| `(0, 1, 0)` | 10 | y crosses one row |
| `(0, 0, 1)` | 70 | z crosses one layer |
| `(9, 6, 4)` | 349 | final legal element |

An independent host check can generate coordinates and expected values with nested z/y/x loops, placing them in a host container under the declared application contract. The mapping under test consumes those coordinates separately; it does not generate the expected values. The defective expression `((gx * height) + gy) * depth + gz` then exposes incorrect strides at non-origin coordinates.

This check launches no CUDA. It can establish only that the host reference and mapping acceptance passed, not device results, Runtime-Verified status, or performance.

## Valid alternatives

- Replace Exercise 1's table with three 2D slice diagrams, provided all three axis predicates and the index remain reviewable for each required thread.
- Use an early return or a positive condition enclosing every access. No flattening or array operation may remain outside the condition.
- Express flattening as `gx + width * (gy + height * gz)` or explicit strides, provided x, y, and z increments are `1`, `width`, and `width * height`.
- Implement the host reference with nested loops, a precomputed oracle table, or another clear independent path. It must not share a potentially defective mapping result with the path under test.

## Common errors

- Treating `gridDim` as the logical data extent and ignoring partial regions in final blocks.
- Checking only x or joining the three out-of-bounds predicates with `AND`.
- Flattening, reading, or writing before checking y or z.
- Treating width, height, and depth as interchangeable strides, or assuming CUDA geometry selects row-major layout.
- Making the CPU reference call the same defective helper as the kernel path so both are wrong in the same way and still compare equal.
- Reporting a host-only pass, browser model, or hand-calculated table as GPU runtime or performance evidence.

Reviewed: **2026-08-26**. These solutions execute no CUDA and produce no compilation, runtime, or performance record.
