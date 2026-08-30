---
title: 'A06 Reviewed Solutions: Boundary Policies, 2D Halos, and Reuse Arithmetic'
description: Review the boundary vectors, center/side/corner coverage, uniform-phase repair, reuse budgets, valid alternatives, and common errors for the three A06 exercises.
pairId: a06-solutions
counterpart: /algorithms/stencil-neighborhood-reuse/solutions/
factCheckDate: '2026-08-30'
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
unitId: A06-SOLUTIONS
prerequisites:
  - A06-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a06-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/stencil-neighborhood-reuse/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A06-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:expected-observations', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/algorithms/stencil-neighborhood-reuse/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate review page for the [A06 Exercises](/en/algorithms/stencil-neighborhood-reuse/exercises/). Result vectors, coverage proofs, and request counts are static reasoning. There is no CUDA executable, runtime observation, or measured performance.

## Solution 1: Derive four boundary contracts for one input

The interior neighborhoods are `[2,4,6]` and `[4,6,8]`, so positions 1 and 2 sum to 12 and 18.

- The `valid` output domain contains only positions 1 and 2, producing `[12,18]`.
- `zero` defines out-of-domain values as 0. Position 0 uses `[0,2,4]`, position 3 uses `[6,8,0]`, and output is `[6,12,18,14]`.
- `clamp` maps -1 to 0 and 4 to 3. Edge values are `[2,2,4]` and `[6,8,8]`, producing `[8,12,18,22]`.
- `periodic` wraps -1 to 3 and 4 to 0. Edge values are `[8,2,4]` and `[6,8,2]`, producing `[14,12,18,16]`.

The reasoning maps each requested index before reading or generating a boundary value, so the reference performs no out-of-bounds read. Different vectors express different contract choices; they are not implementation tolerance.

## Solution 2: Cover center, side halos, and corner halos

The output center is `3 x 4`. Radius 1 produces a `(3+2) x (4+2) = 5 x 6` staged rectangle with 30 positions. Its row-major linear assignment is:

| thread | staged linear indices |
| ---: | --- |
| 0 | `0,8,16,24` |
| 1 | `1,9,17,25` |
| 2 | `2,10,18,26` |
| 3 | `3,11,19,27` |
| 4 | `4,12,20,28` |
| 5 | `5,13,21,29` |
| 6 | `6,14,22` |
| 7 | `7,15,23` |

Each `q` maps to `(sy=floor(q/6), sx=q mod 6)`. Corners 0, 5, 24, and 29 are defined by threads 0, 5, 0, and 5. They are independent cells of the staged rectangle and are not counted again in side strips that span only center width or height. The eight progressions partition `0..29` by residue modulo 8, proving complete coverage and one writer per slot. All eight threads join the barrier after their loops even though threads 6 and 7 perform only three loads.

## Solution 3: Repair an early return and calculate reuse budgets

The repaired phase first calculates `output_valid`. Every thread still receives staged loads by linear stride and writes 0 for an out-of-domain coordinate under the `zero` policy. The whole block reaches the barrier. Only an `output_valid` owner then reads a shared neighborhood, computes, and stores. The predicate controls a value action, not the rendezvous.

One-dimensional direct logical requests are `B(2r+1) = 8*5 = 40`; complete staged unique positions are `B+2r = 8+4 = 12`. Two-dimensional direct requests are `8*8*(2*1+1)^2 = 64*9 = 576`; the complete staged rectangle has `(8+2)*(8+2) = 10*10 = 100` positions.

The reasoning can record `40/12` and `576/100` as request-count reuse opportunities. They exclude cache behavior, global transactions, cooperative overhead, the barrier, shared capacity, and architecture. Observed timing, throughput, and speedup therefore remain `unrecorded`.

## Valid alternatives

- Exercise 1 may represent `zero` or `periodic` with an explicitly padded input array if reference mapping and output domain remain unchanged.
- A 2D loader may use a two-dimensional thread assignment instead of a linear stride if center, sides, and corners remain covered with an explicit writer contract.
- A sparse cross stencil may omit unused corners after restating its footprint and coverage proof.
- Loads may be distributed differently among threads if every staged slot is defined before the barrier without a race.
- A direct non-shared baseline is a valid correctness comparison and need not pretend to have shared reuse.

## Common errors

- Mixing clamp, zero, and periodic values in one edge-output contract.
- Using a language's negative remainder without normalizing it into `[0,n)`.
- Loading only top/bottom/left/right strips and omitting the corners of a square stencil.
- Returning before the barrier because a thread has no staged load or legal output.
- Writing `B+r` instead of `B+2r`, or double-counting corners in the staged rectangle.
- Treating a logical request-count ratio as a transaction ratio, timing result, or speedup.
- Making asynchronous copy a requirement of the A06 correctness baseline.

Reviewed on **2026-08-30**. All four evidence arrays remain empty.
