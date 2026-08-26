---
title: 'F08 Reviewed Solutions: Prove Launch Geometry Feasible First'
description: Complete coverage ledgers, safe-arithmetic implementation, missing resource facts, and legal conclusions for the three F08 contract-style Exercises.
pairId: f08-solutions
counterpart: /foundations/launch-geometry/solutions/
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
unitId: F08-SOLUTIONS
prerequisites:
  - F08-EXERCISES
relatedUnits:
  - F08
  - LAB03
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f08-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F08,LAB03' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/launch-geometry/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [F08 Exercises](/en/foundations/launch-geometry/exercises/). Compare fail-closed order and conclusion boundaries before final numbers. Every calculation is hand or host/browser arithmetic. No CUDA executes, and no occupancy or performance record is produced.

## Solution 1: Issue a 2D launch-feasibility record

All four inputs are positive integers. Block.x satisfies `32 <= 1024`, block.y satisfies `8 <= 1024`, and their checked product satisfies `32 * 8 = 256 <= 1024`, so the device-level block axis and aggregate checks pass.

| check | safe calculation | result |
| --- | --- | ---: |
| grid.x | `1 + floor((1000 - 1) / 32)` | 32 |
| grid.y | `1 + floor((750 - 1) / 8)` | 94 |
| grid limits | `32 <= 2147483647`; `94 <= 65535` | pass |
| grid blocks | `32 * 94` | 3008 |
| coverage | `(32 * 32, 94 * 8)` | `1024 x 752` |
| launched threads | `3008 * 256` | 770048 |
| logical elements | `1000 * 750` | 750000 |
| fringe | `770048 - 750000` | 20048 |

The logical extent remains `1000 x 750`. The condition `gx < 1000 AND gy < 750` rejects coordinates introduced by extra coverage. The kernel must not receive `1024 x 752` as a replacement extent.

The allowed conclusion is: **the device axis, aggregate, and grid limits declared in this record pass, with the safe-integer geometry shown above.** The actual function's `maxThreadsPerBlock`, register demand, static/dynamic shared-memory demand, and real launch/error and result checks remain required. Without those facts, neither complete kernel/device feasibility nor performance is established.

## Solution 2: Implement a fail-closed safe-arithmetic contract

This language-independent pseudocode preserves the required order:

```text
parse_positive_decimal(text, MAX):
  require text matches [1-9][0-9]*
  parse without exceeding MAX
  otherwise return invalid

checked_product(a, b, MAX):
  require 1 <= a <= MAX and 1 <= b <= MAX
  if a > floor(MAX / b): return invalid
  return a * b

ceil_div_positive(n, d, MAX):
  require 1 <= n <= MAX and 1 <= d <= MAX
  return 1 + floor((n - 1) / d)

plan(input, capability, MAX):
  parse width, height, block.x, block.y
  if any parse fails:
    return invalid, geometry null
  check block axes
  checked_product(block.x, block.y)
  if the product fails or exceeds the limit:
    return invalid, geometry null
  checked_product(width, height)
  if the product fails:
    return invalid, geometry null
  calculate grid.x and grid.y with ceil_div_positive
  check grid axes
  checked_product every grid, coverage, and launch value
  if any check fails:
    return invalid, geometry null
  subtract fringe only after launched >= logical is established
  return valid geometry plus unresolved kernel-resource checks
```

`ceil_div_positive(MAX, 2)` never constructs `MAX + 1`, so for positive `MAX` it safely returns `1 + floor((MAX - 1) / 2)`. `checked_product(MAX, 2, MAX)` fails before multiplication because `MAX > floor(MAX / 2)`. Both axis predicates are true for `(1024, 2)`, but aggregate 2048 exceeds 1024. `0` and `"8.5"` fail parsing, so the planner stops before any geometry arithmetic.

`MAX` belongs to the implementation contract. A JavaScript implementation can select `Number.MAX_SAFE_INTEGER`; a C++ host helper should use `std::numeric_limits<T>::max()` for its explicit unsigned type. Neither boundary can stand in for the other.

## Solution 3: Reject a “fastest” claim without resource and measurement evidence

Both blocks contain 256 threads and satisfy the x/y axis limits and aggregate limit of 1024. Their geometry is:

| candidate | block | grid | grid blocks | coverage | launched | logical | fringe |
| --- | --- | --- | ---: | --- | ---: | ---: | ---: |
| A | `(32, 8)` | `(32, 94)` | 3008 | `1024 x 752` | 770048 | 750000 | 20048 |
| B | `(16, 16)` | `(63, 47)` | 2961 | `1008 x 752` | 758016 | 750000 | 8016 |

Both candidates retain the same `gx < 1000 AND gy < 750` bounds contract. B has `12032` fewer fringe threads than A. This is only an integer fact under explicit input and geometry.

The decision ledger remains incomplete:

1. **Correctness:** the table establishes coverage but executes no kernel and verifies no output.
2. **Device:** the given record's axis, aggregate, and grid limits pass.
3. **Kernel resources:** function `maxThreadsPerBlock`, `numRegs`, `sharedSizeBytes`, requested dynamic shared memory, compilation target, and the actual launch result are missing.
4. **Measurement:** Environment Manifest, correct results, warm-up, synchronization boundary, timing method, repetition, and observations are missing.

The narrowest legal rewrite is: **“For logical extent `1000 x 750` and the given device record, B's device-level geometry creates 8016 fringe threads, 12032 fewer than A; kernel feasibility and runtime ranking remain unestablished.”** The table cannot produce an occupancy or fastest verdict.

## Valid alternatives

- Replace Exercise 1's table with an ordered calculation graph, provided input, axis, aggregate, grid, overflow, coverage, and unresolved resource gates remain reviewable.
- Implement `checked_product` with a division guard, language-provided checked arithmetic, or a wider intermediate type, provided representability in the target type is proven and failure never returns a wrapped value.
- Implement ceiling division as `n / d + (n % d != 0)`, retaining the same positive-integer and result-type preconditions.
- Add more candidates to Exercise 3, but apply the same correctness and feasibility contract independently to each. More candidates do not create performance evidence.

## Common errors

- Checking only `maxThreadsPerBlock` and missing block.x/block.y axis limits, or checking only axes and missing the product.
- Using `(n + d - 1) / d` without proving the addition representable, or multiplying before the overflow check.
- Replacing the logical extent with coverage and assigning fringe threads incorrect data ownership.
- Ignoring the function's own thread, register, and static/dynamic shared-memory constraints after device limits pass.
- Preserving an old partial grid or fringe after invalid input so the interface appears to have usable geometry.
- Reporting fewer fringe threads, equal block thread counts, a browser model, or a host-only test as occupancy, GPU execution, or fastest-shape evidence.

Reviewed: **2026-08-26**. These solutions execute no CUDA and change neither LAB03 nor any other resource's Evidence Status.
