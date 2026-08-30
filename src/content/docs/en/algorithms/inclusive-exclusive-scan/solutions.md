---
title: 'A03 Reviewed Solutions: Inclusive/Exclusive Scan and Multi-block Propagation'
description: Review the scan table, ping-pong stage trace, and block-offset propagation for the three A03 exercises.
pairId: a03-solutions
counterpart: /algorithms/inclusive-exclusive-scan/solutions/
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
unitId: A03-SOLUTIONS
prerequisites:
  - A03-EXERCISES
relatedUnits:
  - A03
  - EX12
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: a03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-30' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: A03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: A03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'A03,EX12' }
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

<a class="locale-pair" data-locale-counterpart href="/algorithms/inclusive-exclusive-scan/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

This is the separate review page for the [A03 Exercises](/en/algorithms/inclusive-exclusive-scan/exercises/). Its tables verify scan recurrences and stage contracts; they are not GPU runtime observations.

## Solution 1: Derive both scans from one input

The identity for addition is 0:

| `i` | `x[i]` | inclusive | exclusive |
| ---: | ---: | ---: | ---: |
| 0 | 4 | 4 | 0 |
| 1 | 1 | 5 | 4 |
| 2 | 3 | 8 | 5 |
| 3 | 2 | 10 | 8 |
| 4 | 6 | 16 | 10 |

Every row satisfies `inclusive[i] = exclusive[i] + x[i]`. Except for the first row, `exclusive[i] = exclusive[i-1] + x[i-1]`; identity directly defines the first exclusive value.

## Solution 2: Construct stage snapshots

Use shared buffers `A` and `B`:

| stage | distance | read | write | snapshot after barrier |
| ---: | ---: | --- | --- | --- |
| 0 | 0 | input | A | `[2,5,1,4]` |
| 1 | 1 | A | B | `[2,7,6,5]` |
| 2 | 2 | B | A | `[2,7,8,12]` |

Each lane completes its current write, all four participants reach the barrier, and then read/write roles swap. Ping-pong ownership prevents a stage-1 value from contaminating another lane's stage-0 read. The barrier makes the complete snapshot visible before the next stage.

## Solution 3: Complete multi-block offset propagation

The local inclusive scans are `[3,4,6,10]`, `[5,7,8,11]`, and `[6,13]`, so block sums are `[10,11,13]`. An exclusive scan of those sums produces offsets `[0,10,21]`.

```text
block 0: [3,4,6,10] + 0  -> [3,4,6,10]
block 1: [5,7,8,11] + 10 -> [15,17,18,21]
block 2: [6,13] + 21      -> [27,34]
```

Concatenation gives `[3,4,6,10,15,17,18,21,27,34]`. The third block has logical count 2, so its sum includes only 6 and 7. Each kernel phase completes before the next phase consumes its sums or offsets.

## Valid alternatives

- Shift an inclusive result right and insert identity for exclusive output, or use a direct exclusive tree whose recurrence and order are proven.
- Use two buffers for snapshots, or another structure with a proof that same-stage writes cannot replace values still being read.
- Recursively scan block sums with this algorithm, or use another correct path when their size has a declared bound.
- For a non-addition operation, propagation applies `op(offset, local_prefix)` while preserving operand order.

## Common errors

- Treating inclusive and exclusive as only an array shift without declaring identity.
- Reading and writing one shared array in a stage and assuming one trailing barrier recreates a prior-stage snapshot.
- Letting an edge lane skip a stage barrier.
- Confusing a block sum with a block offset, or including the current block's sum in an exclusive offset.
- Reading the physical last lane without proving identity padding and a full-width scan. Canonical EX12 has that proof; another implementation must read the logical last valid element or prove an equivalent path.
- Inferring unobserved speedup from stage depth, kernel count, or a production primitive.

Reviewed on **2026-08-30**. Compilation and runtime evidence axes remain empty.
