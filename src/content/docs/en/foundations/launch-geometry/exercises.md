---
title: 'F08 Exercises: Prove Launch Geometry Feasible First'
description: Use three contract-style tasks to check 2D coverage, axis and aggregate limits, safe arithmetic, missing kernel resources, and the measurement boundary.
pairId: f08-exercises
counterpart: /foundations/launch-geometry/exercises/
factCheckDate: '2026-08-26'
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
unitId: F08-EXERCISES
prerequisites:
  - F08
relatedUnits:
  - F08
  - LAB03
  - VIS22
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: f08-exercises }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-26' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: F08-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: F08 }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'F08,LAB03,VIS22' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/foundations/launch-geometry/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisite

Complete [F08: Launch Geometry Is a Correctness and Resource Decision Before Speed](/en/foundations/launch-geometry/) first. All three Exercises require only static reasoning or a host/browser helper. Without a real CUDA build, launch, result verification, and Environment Manifest, record no GPU runtime or performance conclusion.

## How to answer

Submit every task as a contract: inputs and selected capability record, preconditions, checks in order, derived values that exist only on success, facts still missing, and the narrowest conclusion allowed. Work independently before opening hints and the [reviewed solutions](/en/foundations/launch-geometry/solutions/). This unit has no canonical example from which to reverse-engineer an answer.

## Exercise 1: Issue a 2D launch-feasibility record

**Goal:** For logical extent `1000 x 750`, `block = (32, 8)`, and the selected CC 7.5 record below, decide whether device-level launch geometry passes and calculate the complete coverage ledger.

```text
maxThreadsDim.x = 1024
maxThreadsDim.y = 1024
maxThreadsPerBlock = 1024
maxGridSize.x = 2147483647
maxGridSize.y = 65535
```

**Constraints:** Check that all four inputs are positive first. Check block.x, block.y, and the checked product separately. Use `1 + floor((n - 1) / d)`. Check before every multiplication. Do not replace logical `width` or `height` with rounded coverage. Preserve the kernel condition `gx < width AND gy < height`.

**Expected evidence:** An ordered table covering input validity, axis limits, aggregate limit, grid shape, grid limits, coverage, block/grid products, launched threads, logical elements, fringe threads, and kernel resources still requiring review.

**Acceptance criteria:** Derive block threads `256`, grid `(32, 94)`, grid blocks `3008`, coverage `1024 x 752`, launched threads `770048`, logical elements `750000`, and fringe `20048`. State only that these device limits pass. Preserve function-specific maximum threads, registers, static/dynamic shared memory, and actual launch checks as open requirements.

<details><summary>Hint 1</summary>`ceil_div(1000, 32) = 32` and `ceil_div(750, 8) = 94`. Coverage is not a new logical extent.</details>

<details><summary>Hint 2</summary>Calculate `3008 * 256` and `1000 * 750` before subtracting. Do not replace the integer thread ledger with a floating-point percentage.</details>

## Exercise 2: Implement a fail-closed safe-arithmetic contract

**Goal:** For an arbitrary selected unsigned-integer limit `MAX`, write pseudocode or a host-only helper for `parse_positive_decimal`, `checked_product(a, b, MAX)`, and `ceil_div_positive(n, d)`. Invalid input must return no grid, launch, or fringe value.

**Constraints:** Parsing rejects empty values, spaces, signs, `0`, decimals, exponents, and values above `MAX`. Multiplication uses a division-based guard before `a * b`. Ceiling division must not calculate `n + d - 1` first. Any failure invalidates the whole result rather than preserving partial geometry calculated earlier.

**Expected evidence:** The three helpers, a planner that calls them in order, and at least these tests: `ceil_div_positive(MAX, 2)` succeeds; `checked_product(MAX, 2, MAX)` fails; `block = (1024, 2)` passes axis limits and then fails the aggregate; `width = 0` and `block.y = "8.5"` fail before arithmetic.

**Acceptance criteria:** Ceiling division is equivalent to `1 + floor((n - 1) / d)`. The product guard fails when `a > MAX / b`. All four counterexamples receive the correct state. Every invalid result has absent/null geometry. JavaScript `MAX_SAFE_INTEGER` is not mixed with a CUDA host type's limit.

<details><summary>Hint 1</summary>The positive-integer precondition makes `n - 1` safe. This is precisely why parsing and validation occur first.</details>

<details><summary>Hint 2</summary>The planner can return a discriminated result: `{ valid: false, issues, geometry: null }` or `{ valid: true, geometry }`.</details>

## Exercise 3: Reject a “fastest” claim without resource and measurement evidence

**Goal:** Compare the geometry contracts for `block A = (32, 8)` and `block B = (16, 16)` on the same logical extent `1000 x 750`, then review the claim “B has less fringe, so B is fastest.”

**Constraints:** Use Exercise 1's device record for both candidates. Calculate grid, coverage, launched threads, and fringe separately. Preserve identical per-axis bounds and logical elements. List the `cudaFuncAttributes.maxThreadsPerBlock`, `numRegs`, `sharedSizeBytes`, requested dynamic shared memory, and actual launch/result facts absent from the device record. Produce no occupancy, latency, or speedup number.

**Expected evidence:** An A/B geometry table, a decision ledger ordered by correctness/device/kernel/measurement, and the narrowest legal rewrite of the original claim.

**Acceptance criteria:** A yields grid `(32, 94)`, launch `770048`, and fringe `20048`. B yields grid `(63, 47)`, coverage `1008 x 752`, launch `758016`, and fringe `8016`. Both pass device-level axis and aggregate checks. Conclude only that B creates fewer fringe threads for this logical extent; kernel feasibility and every speed ranking remain unestablished.

<details><summary>Hint 1</summary>`ceil_div(1000, 16) = 63`, `ceil_div(750, 16) = 47`, and both blocks contain 256 threads.</details>

<details><summary>Hint 2</summary>Fewer launched threads are a geometric difference to explain, not a timing result. List what is missing before deciding whether a ranking is possible.</details>

## Next step

After completing all three contracts, inspect the separate [reviewed solutions](/en/foundations/launch-geometry/solutions/), then review another record that confuses legality with speed in [Practice Bank PB-R1-012](/en/practice/#pb-r1-012). [LAB03: Break and Repair Indexing](/en/labs/break-and-repair-indexing/) is related practice, but these hand calculations and host-only helpers provide no LAB03 CUDA runtime evidence.
