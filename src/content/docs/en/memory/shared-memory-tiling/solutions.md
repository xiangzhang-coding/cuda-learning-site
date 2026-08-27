---
title: 'M03 Reviewed Solutions: Prove Shared-Tile Phase Correctness'
description: Edge-tile traces, two-barrier repairs, and neutral/reuse proof obligations for the three M03 Exercises.
pairId: m03-solutions
counterpart: /memory/shared-memory-tiling/solutions/
factCheckDate: '2026-08-27'
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
unitId: M03-SOLUTIONS
prerequisites:
  - M03-EXERCISES
relatedUnits:
  - M03
  - EX06
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: m03-solutions }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-08-27' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: M03-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: M03-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:related-units', content: 'M03,EX06' }
  - tag: meta
    attrs: { name: 'cuda:hardware-gate', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-compilation', content: none }
  - tag: meta
    attrs: { name: 'cuda:evidence-runtime', content: none }
  - tag: meta
    attrs: { name: 'cuda:recorded-observations', content: none }
---

<a class="locale-pair" data-locale-counterpart href="/memory/shared-memory-tiling/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are the **Reviewed solutions** for the [M03 Exercises](/en/memory/shared-memory-tiling/exercises/). The traces prove a pseudocode contract, not an observed GPU scheduler or barrier behavior.

## Solution 1: Trace an edge tile

| iteration | lanes 0..4 | lanes 5..7 | B1 participants | tile after B1 | B2 participants |
| --- | --- | --- | ---: | --- | ---: |
| `base = 0` | write `x0..x4` | write `x5..x7` | 8 | `[x0,x1,x2,x3,x4,x5,x6,x7]` | 8 |
| `base = 8` | write `x8..x12` | write `0,0,0` | 8 | `[x8,x9,x10,x11,x12,0,0,0]` | 8 |

On the second iteration, lanes 5..7 have false `load_valid` and true participation. They perform no out-of-bounds input read, complete their L write, reach B1, conditionally use/commit under the output contract, and reach B2. Only after B2 may any lane begin another L.

## Solution 2: Repair early return and missing B2

```cpp
for (int base = 0; base < n; base += blockDim.x) {
  const int input_index = base + threadIdx.x;
  tile[threadIdx.x] = input_index < n ? input[input_index] : neutral;
  __syncthreads();

  if (output_index < n) {
    consume(tile);
  }

  __syncthreads();
}
```

- Conditional value selection removes out-of-bounds reads while retaining all participants.
- Every slot receives a defined value before B1, eliminating uninitialized edge slots.
- B1 prevents use from preceding peers' loads.
- The output guard controls work/commit only; it does not hide a barrier.
- B2 prevents a fast lane's next load from overwriting a value a slower lane still reads.
- Uniform `base` progression gives the whole block one barrier sequence.

## Solution 3: Write proof obligations for neutral and reuse

**Sum contract:** The domain is nonnegative 32-bit values, combine is addition, and neutral `0` satisfies `x + 0 = x`. Each valid output reads the concrete tile slots in its declared window. Invalid output does not commit but still reaches B2.

**Max contract:** The domain is signed 32-bit values, combine is max, and neutral `INT32_MIN` satisfies `max(x, INT32_MIN) = x`. If the legal domain or accumulator representation excludes that identity contract, validity handling must be redesigned rather than silently substituted.

Counterexample: legal values `[-7,-3]` with neutral 0 produce 0 instead of correct maximum -3. A concrete reuse map can be `slot j -> outputs whose declared window includes base+j`; it must enumerate the window rule rather than merely saying “the tile is reused.”

## Valid alternatives

- Represent edge validity with a parallel validity array instead of neutral, provided every reader checks it and barriers remain uniform.
- Double buffering can change the overwrite proof, but it requires explicit ownership and reuse boundaries for each buffer and is not the minimal answer.
- A one-iteration kernel with no overwrite can omit B2 if its control flow proves that the storage is never reused.
- A `cooperative_groups::thread_block` barrier can express block synchronization, but the full M03 semantic proof remains required and no narrower scope may be guessed.

## Common errors

- Treating `load_valid = false` as permission to skip a barrier.
- Writing tile slots only for valid lanes, leaving edge slots undefined.
- Placing B1 inside an input/output predicate or returning through the barrier sequence.
- Assuming B1 also prevents next-iteration overwrite and omitting B2.
- Filling 0 for max, min, or product without proving identity.
- Claiming transaction reduction or speedup from pseudocode, a shared-reuse count, or a host trace.

Reviewed: **2026-08-27**. Compilation and runtime evidence axes remain empty.
