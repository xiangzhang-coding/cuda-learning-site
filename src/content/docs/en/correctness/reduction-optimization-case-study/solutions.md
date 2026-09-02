---
title: 'Q12 Reviewed Solutions: Controlled Reduction Evidence'
description: Review the EX11 baseline, four-stage runner, and profiler and numerical claim audit, then compare valid alternatives and common errors.
pairId: q12-solutions
counterpart: /correctness/reduction-optimization-case-study/solutions/
factCheckDate: '2026-09-02'
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
unitId: Q12-SOLUTIONS
prerequisites:
  - Q12-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q12-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/reduction-optimization-case-study/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-02' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q12-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q12-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/reduction-optimization-case-study/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are static reviewed solutions for the [Q12 Exercises](/en/correctness/reduction-optimization-case-study/exercises/). They provide source and method review, not GPU output, timing, a metric, speedup, or a winner. All four evidence arrays on Q12 and this page are empty. EX11 remains Pending Hardware Verification.

## Solution 1: Reject and rebuild the baseline and hypothesis graph

Reject the original proposal. A final scalar alone cannot establish each stage's bounds, neutral value, barrier participation, or operation tree. Unpinned source, a missing CPU oracle and tolerance, and four simultaneous changes also invalidate performance attribution.

The repair first freezes EX11 revision `81d43aa7568514e37ef190da59c845b8072b7011`, the double CPU reference, finite comparator, `1/3/511/512/513/4099` edge fixtures, and `4099 -> 9 -> 1` stage DAG. The variant graph then establishes `canonical-shared-tree -> warp-tail-control -> reassociated-warp-order -> four-load-staging`. The first edge discloses the divergence, synchronization, and shared-access bundle. The second changes the warp operand and active-lane schedule while retaining five shuffles and 31 effective additions. The third changes loads per thread while listing local additions and order as coupling. Every edge has its own support, reject, no-answer, and rollback branches.

**Review:** Pass. The correctness gate, source-derived mechanism, and GPU observation remain separate, and no stage contains a prefilled result.

## Solution 2: Review the runner implementation

After completing your own Exercise 2, [download one original reviewed runner](/assets/exercise-solutions/q12-reduction-candidates.cu). Its repository path is `public/assets/exercise-solutions/q12-reduction-candidates.cu`, and its exact SHA-256 is `a7dde4a836c44b296d62a92e7131f43f568857ff8bb910a8edad6d28a821c106`. It is one Apache-2.0 reviewed solution, not a second canonical EX11, not a new Runnable Example, and it grants no Evidence Status.

The runner includes the canonical header and calls `ex11::initialize_input`, `ex11::cpu_reference_sum`, and `ex11::compare_reduction_sum` directly. Its four kernels and stages have a fixed order. Every algorithm reuses one input allocation and two stable partial allocations. Checked copies write quiet-NaN sentinels before the algorithm; the driver then checks launch and complete multi-kernel completion, reads back the final scalar, and applies the same tolerance against the independent CPU result. Candidates never serve as one another's oracle.

From the repository root, with an existing `build/` directory, the expanded C++17 command is:

```bash
nvcc \
  --std=c++17 \
  --generate-code=arch=compute_75,code=sm_75 \
  --generate-code=arch=compute_75,code=compute_75 \
  --include-path examples/ex11-multi-stage-reduction/include \
  public/assets/exercise-solutions/q12-reduction-candidates.cu \
  --output-file build/q12-reduction-candidates
```

The three pinned `cuda-11.8`, `cuda-12.9`, and `cuda-13.3` gates only compile, link, and statically inspect this exact source; they never execute the binary. A learner alternative may use a different internal organization, but it retains the required CLI, four IDs and order, canonical oracle, stage-size and operand ledgers, C++17 build records, and source, build, and binary hashes.

**Review:** Pass. The reviewed source keeps EX11 immutable, handles warp participation and the numerical-order change explicitly, and emits correctness labels without a performance result.

## Solution 3: Reject the profiler, bitwise, and production claim

Reject every universal, causal, bitwise, and fastest claim in the summary. A friendly label has no exact metric name, unit, scope, or availability. Without permission, replay, filtering, and report custody there is no profiler observation. Without matched raw unprofiled attempts there is no elapsed comparison. Tolerance acceptance is not bitwise reproducibility.

The repair gives each of four stage records a fixed workload, three excluded warm-up attempts, checked synchronization, ten retained attempts and a predeclared median plus min/max, an exact-GPU query-first profiler method, a permission gate, a complete Environment Manifest, a same-comparator correctness result, and a bounded interpretation answering only its named mechanism. Every result field stays `expected; unrecorded`. Competing explanations include instruction mix, shared traffic, resource use, cache state, clock or thermal state, replay perturbation, and numerical-order coupling.

LAB11's production CUB comparison continues to wait for the unpublished L03. No current CUB API, determinism scope, build result, or performance result is supplied.

**Review:** Pass. Unsupported claims are downgraded, and missing evidence is not replaced with zero, a guess, or browser state.

## Valid alternatives

- Branch all candidates from one correctness-qualified EX11-shaped baseline if every branch retains an independent diff, hypothesis, and collection record.
- Use another primitive with explicit support across all three Toolkit Lanes for the warp tail, but redeclare the participant mask, operation tree, and source boundary.
- Change the measurement workload as a new comparison; both sides still require identical bytes, stage graph, warm-up, completion, statistics, and correctness cadence.
- Use another exact queried section or short metric list for the same question if its definition, unit, scope, availability, and report custody are retained.

## Common errors

- Checking only the final scalar without retaining the EX11 revision, CPU reference, tolerance, or stage DAG.
- Returning a bounds-invalid thread before a block barrier or relying on implicit warp lockstep.
- Calling the warp-tail bundle one causal change while hiding branch, barrier, shared-access, and instruction changes.
- Claiming bitwise equality, determinism, or cross-GPU reproducibility from a tolerance pass.
- Calling fewer partial elements measured DRAM traffic or speedup.
- Changing warm-up, deleting an outlier, or selecting a statistic after viewing samples.
- Recording denied permission or an unavailable metric as zero, or replacing a report and hash with a screenshot.
- Inferring GPU scheduling, floating-point results, or performance from the VIS10 integer tree.
- Inventing a CUB API or comparison result before L03 and LAB11 publish.

Reviewed: **2026-09-02**. Continue with [PB-R3-009](/en/practice/#pb-r3-009) and [PB-R3-010](/en/practice/#pb-r3-010) for transfer practice.
