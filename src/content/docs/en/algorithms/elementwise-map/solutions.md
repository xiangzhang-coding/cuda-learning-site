---
title: 'A01 Reviewed Solutions: Map Ownership and Data Movement'
description: Owner table, symbolic movement ledger, grid-stride proof, valid alternatives, and common errors for the three A01 Exercises.
pairId: a01-solutions
counterpart: /algorithms/elementwise-map/solutions/
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
unitId: A01-SOLUTIONS
prerequisites:
  - A01-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a01-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/algorithms/elementwise-map/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: A01-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A01-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/elementwise-map/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the separate reviewed answers to the [A01 Exercises](/en/algorithms/elementwise-map/exercises/). The tables and proofs review a static elementwise-map contract. They are not a CUDA execution trace and grant no compilation, runtime, or performance Evidence Status.

## Solution 1: Build an owner table for a rounded-up grid

| block | local thread | global index | `i < 10` | action |
| ---: | ---: | ---: | --- | --- |
| 0 | 0 | 0 | true | write `output[0]` |
| 0 | 1 | 1 | true | write `output[1]` |
| 0 | 2 | 2 | true | write `output[2]` |
| 0 | 3 | 3 | true | write `output[3]` |
| 1 | 0 | 4 | true | write `output[4]` |
| 1 | 1 | 5 | true | write `output[5]` |
| 1 | 2 | 6 | true | write `output[6]` |
| 1 | 3 | 7 | true | write `output[7]` |
| 2 | 0 | 8 | true | write `output[8]` |
| 2 | 1 | 9 | true | write `output[9]` |
| 2 | 2 | 10 | false | skip load/store |
| 2 | 3 | 11 | false | skip load/store |

For valid index `i`, the write set is the singleton `{output[i]}`. The mapping `4 * blockIdx.x + threadIdx.x` is unique over these launch ranges, so the ten valid sets cover the output and are pairwise disjoint. Indices 10 and 11 still denote launched threads, but the guard gives each an empty write set.

## Solution 2: Separate arithmetic from memory movement

| scenario A phase | symbolic amount | meaning |
| --- | --- | --- |
| H2D `left` | `n * sizeof(float)` bytes | host input to device allocation |
| H2D `right` | `n * sizeof(float)` bytes | second host input to device allocation |
| kernel loads | `2 * n` float values requested | two inputs per valid element |
| kernel stores | `n` float values requested | one output per valid element |
| D2H `output` | `n * sizeof(float)` bytes | host obtains the result |

| scenario B phase | symbolic amount | meaning |
| --- | --- | --- |
| H2D | none for this invocation | inputs already reside on device |
| kernel loads | `2 * n` float values requested | unchanged map contract |
| kernel stores | `n` float values requested | output remains on device |
| D2H | none at this boundary | a downstream device kernel consumes output |

Both scenarios perform one addition for every valid `i`. Bytes describe explicit copies; value requests describe kernel semantics. Actual memory transactions, cache behavior, and performance require execution and measurement and cannot be read from these tables.

## Solution 3: Prove ownership for a grid-stride map

```text
t = blockIdx.x * blockDim.x + threadIdx.x
i = t
while i < 17:
  value = input[i]
  output[i] = 2 * value + 1
  i = i + 6
```

The index sequences are:

| thread | indices |
| ---: | --- |
| 0 | `0, 6, 12` |
| 1 | `1, 7, 13` |
| 2 | `2, 8, 14` |
| 3 | `3, 9, 15` |
| 4 | `4, 10, 16` |
| 5 | `5, 11` |

Every `i` has the unique form `i = 6q + r` with `r` in `0..5`, so thread `r` is its sole owner. The union of all sequences covers `0..16`.

With exact in-place aliasing, an iteration first reads `input[i]` into thread-local `value` and then replaces that same location. No other thread reads `i`, so the proof does not depend on execution order. Partial overlap or a cross-index transform does not satisfy this proof and needs a separate alias contract. A future GPU run must still check launch errors, completion, and an output oracle; this proof observes none of them.

## Valid alternatives

- Exercise 1 may use one table sorted by global index or three block-specific tables, provided all 12 threads appear.
- The movement ledger may have symbolic elements and bytes in separate columns, but requested values must not be called transaction counts.
- Exercise 3 may use the set `{t + 6k | k >= 0, t + 6k < 17}` instead of enumerating first, followed by the same remainder proof.
- A pointwise in-place map may stage the value in a register or use a separate output; both variants must declare their alias policy.

## Common errors

- Removing indices 10 and 11 from the launch table instead of recording bounds-invalid threads.
- Proving coverage but not proving that two threads cannot write one output.
- Combining H2D/D2H copies and kernel global loads/stores into one vague “memory cost.”
- Inferring actual transactions, bandwidth, or speedup from symbolic bytes.
- Using `blockDim.x`, rather than the total launched-thread count, as a grid-stride loop's stride.
- Assuming every overlap is safe in place and missing a cross-index read-after-write hazard.

Reviewed **2026-08-30**. All four evidence arrays and their corresponding head metadata remain empty.
