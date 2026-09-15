---
title: 'T07 Solutions: Separate Ownership, Residency and Performance'
description: Prove cyclic coverage and review the limits of persistent scheduling claims.
pairId: t07-solutions
counterpart: /triton/persistent-kernels/solutions/
factCheckDate: '2026-09-15'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, solution-1, solution-2, practice-review, next]
resourceKind: solution-set
unitId: T07-SOLUTIONS
prerequisites: [T07-EXERCISES]
relatedUnits: [LAB16]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - { title: 'Triton persistent matmul tutorial', url: 'https://github.com/triton-lang/triton/blob/v3.7.1/python/tutorials/09-persistent-matmul.py', version: '3.7.1', platform: 'CUDA architecture-gated source', accessDate: '2026-09-15' }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: t07-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/triton/persistent-kernels/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-15' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,solution-1,solution-2,practice-review,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: T07-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: T07-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:related-units', content: LAB16 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '1' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '3.7.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/triton/persistent-kernels/solutions/" lang="zh-CN">阅读中文对应页</a>

## Read after attempting

Exact prerequisite **[T07-EXERCISES]**: [attempts](/en/triton/persistent-kernels/exercises/). These are original reviewed deductions, not observed performance. Checked 2026-09-15; [SRC-CUDA-091](/en/sources-and-versions/#src-cuda-091).

## Solution 1: map work without duplicating state

Use one-dimensional grid `(P,)`. Start t at `tl.program_id(0)`, loop while t is below T and increment by `tl.num_programs(0)`. Decode t into row and column tiles; run the existing masked K reduction with a fresh FP32 accumulator, then store FP16 under the output mask. The nonpersistent kernel remains unchanged in the learner comparison. The proof is `t=qP+r`: existence gives coverage and unique remainder gives a unique writer. P=1 serializes tile ownership; P=T gives one tile per program.

For synthetic T=35/P=8, programs 0, 1 and 2 receive five tiles, the others four. Tile 34 belongs to program 2 at its fifth iteration. For T=10/P=3, program 0 receives four tiles and the others three. These are counts, not times. If grid P=3 but step=8, tiles 3–7 are omitted; if grid P=8 but step=3, multiple programs can reach the same tile. The actual grid and stride must agree.

Use T07's five shapes and the fixed configuration, compare every element to the FP64 oracle under the FP16 tolerance and verify guards/unchanged inputs. Check at least two successive output tiles per program to expose a missing accumulator reset. Existing host model tests establish the ownership arithmetic only; compilation must target the actual GPU, and external execution must retain a complete manifest. Do not invent a selected P or resource count.

## Solution 2: a fair comparison can reject persistence

P equal to SM count specifies how many programs launch, not physical placement or simultaneous residency. Both variants launch once. A theoretical 100% occupancy number describes capacity under specific resources, not latency, useful work or optimality. A waiting CTA can occupy resources needed by a producer that has not been scheduled; a global spin barrier has no residency guarantee here.

First retain correctness and per-target resource/compilation records. Measure fixed, matched tiles with 20 warm-up calls and three alternating-order rounds, preserving all raw samples. Keep the 25/100 ms benchmark budgets and cache policy equal. A single-tile case is correctness-only for the multi-tile scheduling hypothesis. A resource failure means that candidate did not qualify; it does not justify a speed ratio. Missing counter permissions permit only a scoped uninstrumented timing comparison, not an occupancy explanation.

To explain a mechanism, retain actual-target occupancy/launch and minimal scheduler/stall reports with queried metrics, units, kernel/launch selection, replay and permission records; use separate uninstrumented time samples. The manifest binds source/locks, shapes/dtypes/strides/tolerances, candidate/grid, GPU/CC/SMs/count/memory, driver/Toolkit/compiler/tool versions, OS, clocks/power/load, synchronization/cache policy, observer/date and report custody. A slower or inconclusive result is valid. Without qualifying Reference Environment evidence, keep Pending Hardware Verification.

## Practice Bank review

**PB-R5-020:** with synthetic T=35 and P=8, eight program IDs do not identify eight SMs. Equal tile counts would not prove equal durations, and these counts are not even equal. Keep program count, resident CTA capacity and achieved occupancy distinct. Test a matched nonpersistent fallback and an alternative P, retain numerical checks and resource records, then evaluate measured time. A denied counter query is an explicit mechanism-evidence gap, never zero stalls or 100% occupancy.

## Return to the baseline

Return to [T07](/en/triton/persistent-kernels/) and [LAB16](/en/labs/autotune-triton-gemm/). Preserve negative results as carefully as positive ones.
