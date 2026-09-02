---
title: 'Q11 Reviewed Solutions: Controlled Transpose Evidence'
description: Reviewed repairs for an EX14 baseline, the LAB10 four-stage runner handoff, and a bank-layout profiler-claim audit, with alternatives and common errors.
pairId: q11-solutions
counterpart: /correctness/transpose-optimization-case-study/solutions/
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
unitId: Q11-SOLUTIONS
prerequisites:
  - Q11-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q11-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/transpose-optimization-case-study/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: Q11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q11-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/transpose-optimization-case-study/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are reviewed static solutions for the [Q11 Exercises](/en/correctness/transpose-optimization-case-study/exercises/). They repair implementation and experiment contracts and evidence claims; they do not supply CUDA output, profiler values, timing, a tile winner, or a speedup. Q11 is a Learning Unit and grants no Evidence Status; the linked [EX14](/en/examples/tiled-transpose/) and [LAB10](/en/labs/optimize-canonical-transpose/) are both currently Pending Hardware Verification with empty recorded observations. All four evidence arrays on this Solution page are also empty.

## Solution 1: Reject and rebuild the EX14 baseline

Reject the supplied baseline. It is not tied to the immutable EX14 revision, omits two rectangular/partial-tile fixtures, does not verify output shape, and has neither complete exact comparison nor a recorded build/run identity. A square-only output cannot qualify the edge and leading-dimension contract.

The repaired acceptance gate names the immutable source revision and requires `5x7`, `33x35`, and `64x32`; output shape `columns x rows`; exact equality at every element; and `output[col * rows + row] = input[row * columns + col]`. A measurement-baseline packet additionally needs source/patch and binary hashes, build command and result, Environment Manifest, launch arguments, complete correctness log, observer, and observation date. Until those fields exist, it remains a plan.

A valid pre-result ledger row names padding stride as the one primary variable, predicts only a changed shared-address/bank-index mapping, freezes logical coordinates and all comparison fields, and declares support, reject, no-answer, rollback, and at least one competing explanation such as changed shared footprint. “Padding should improve performance” is rejected because it has no testable evidence scope or failure branch.

**Review:** Passes. Correctness precedes measurement, the acceptance and recorded baselines stay distinct, and the ledger does not contain a hidden result.

## Solution 2: Review the learner-owned runner and hand it to LAB10

After completing your own Exercise 2 attempt, you may [download one complete original reviewed runner](/assets/exercise-solutions/q11-lab10-transpose-candidates.cu). Its repository path is `public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu`, and its exact SHA-256 is `920a4ca6f44586a3882e31756fca3e28feb655282327721e3fb3a308bac3f251`. This Apache-2.0 file is one reviewed solution, not a second canonical EX14, not a new Runnable Example, and not a change to immutable [EX14](/en/examples/tiled-transpose/) files or canonical ranges. A learner-authored alternative remains valid only when it satisfies the same interface, four-stage, independent EX14 oracle, adjacent-stage diff, and source/build/binary hash contract.

This qualifying handoff derives from immutable EX14 and defines four independently reviewable kernels/stages in fixed order: frozen direct `baseline-direct`; `coalescing-direction`, which changes only thread-to-coordinate direction; `shared-memory-tiling`, which uses an unpadded `32x32` shared tile; and `padded-bank-layout`, which changes only the physical shared stride to `32x33`. Three adjacent-stage source comparisons prove that the runner changes one primary variable at a time while every canonical file remains unchanged.

The driver implements the exact interface `build/lab10-transpose-candidates --all-stages --rows ROWS --columns COLUMNS --verify exact` and continues to use the independent EX14 CPU oracle rather than checking candidates against one another. It uses finite, non-NaN deterministic input and oracle values. Each correctness, warm-up, and profiled process creates one stable device output allocation and keeps the same allocation and address across all four stages. Immediately before every stage launch for `5x7`, `33x35`, `64x32`, and `4096x4096`, the driver fills the complete output with a quiet-NaN sentinel through a checked host-to-device copy and checks the CUDA status. It then launches, checks `cudaDeviceSynchronize`, performs a checked device-to-host copy of the complete output, and requires the complete transposed shape, `output[col * rows + row] = input[row * columns + col]`, exact oracle equality at every element, and that no sentinel remains. The sentinel fill and readback stay outside selected kernel metrics; the identical procedure and allocation/address are held constants.

From the repository root, with the `build/` directory already present, the exact C++17 NVCC compile/link command is:

```bash
nvcc \
  --std=c++17 \
  --generate-code=arch=compute_75,code=sm_75 \
  --generate-code=arch=compute_75,code=compute_75 \
  --include-path examples/ex14-tiled-transpose/include \
  public/assets/exercise-solutions/q11-lab10-transpose-candidates.cu \
  --output-file build/lab10-transpose-candidates
```

The source/build packet preserves that expanded command, its log/status artifact, resulting `build/lab10-transpose-candidates`, and SHA-256 hashes for the source, three adjacent comparisons or learner-alternative diffs, build records, and binary. Its per-stage audit must also prove the stable allocation/address, every prelaunch full-output sentinel-copy status, checked synchronization, complete-output readback, exact comparison, and no-sentinel-remains result. The site applies only a compile/link and static artifact-inspection gate to this reviewed asset in the three pinned `cuda-11.8`, `cuda-12.9`, and `cuda-13.3` Toolkit Lanes. That gate never executes the binary, creates no runtime observation, and grants no Evidence Status to Q11, this Solution page, LAB10, EX14, or the asset. The Lab execution phase still owns timing, profiler queries and reports, the Environment Manifest, and runtime custody.

**Review:** Passes. The reviewed asset's exact path and hash, required CLI, stages, oracle, fixtures, stable allocation, quiet-NaN stage independence, fill/copy CUDA statuses, synchronization, complete readback, build, and hash contracts are reviewable without a prefilled result or a path for a sequential stage to false-pass. Carry that asset or a learner-alternative packet satisfying the same contract into the guided follow-on [LAB10: Optimize the Canonical Transpose](/en/labs/optimize-canonical-transpose/) for its GPU-correctness and profiler workflow.

## Solution 3: Reject and narrow the bank-layout claim

Reject the supplied claim. A screenshot and friendly label do not identify the exact metric, unit, denominator, scope, exact GPU, tool version, kernel occurrence, filter, replay, permission, workload, or report artifact. The packet also fails to prove that `T` versus `T+1` is the only physical change. VIS11 arithmetic cannot fill any missing observation.

The repaired plan first exact-passes EX14, hashes `T2` and `P3`, and freezes logical tile shape, global mapping, launch, workload, compiler, and timing. It retains `ncu --version`, `ncu --list-sections`, `ncu --query-metrics`, permission outcome, exact metric definition, full commands, separate `.ncu-rep` hashes, filter and replay records, and matched unprofiled raw timing. The narrow claim may concern only the named shared-access mechanism on those reports.

Competing explanations include changed shared-memory footprint and residency, a different generated access instruction, cache or clock drift, replay perturbation, run-order effects, and ordinary sample variation. A conflict-related field can support the access hypothesis but cannot by itself attribute elapsed-time change. Q10 traffic or Roofline geometry likewise cannot supply causality.

**Review:** Passes. The original causal claim is rejected, the repair is query-first and reviewable, and unresolved alternatives remain visible.

## Valid alternatives

- The learner-owned directory and build system may differ, but canonical EX14 cannot be edited; the required source filename, binary path, CLI, four stage IDs, and hash custody stay fixed.
- Coalescing evidence may come from another currently queried section or exact metric list when its documented definition answers the same lane/address question.
- Another logical extent may begin a separate APOD pass, but the LAB10 handoff still fixes unpadded `32x32` tiling and the `32x33` padded layout.
- Another physical stride or element width belongs to a separate experiment and cannot replace the required `shared-memory-tiling -> padded-bank-layout` adjacent diff.
- Run ordering may be blocked or interleaved if it is declared before results and applied symmetrically.

## Common errors

- Calling source inspection, a host test, or one correct square output a recorded GPU baseline.
- Timing a candidate before all three EX14 fixtures and output-shape checks pass.
- Editing canonical EX14 files or letting candidate output replace the independent CPU oracle.
- Rewriting the required CLI, stage IDs, `32x32` and `32x33` layouts, or fixed stage order.
- Changing lane mapping, shared staging, padding, tile extent, block geometry, and workload together.
- Failing to call and check `cudaDeviceSynchronize` after every stage or omitting source, diff, build, or binary hashes.
- Treating adjacent-address arithmetic as an observed transaction count.
- Selecting metric names from another GPU or tool version instead of querying the exact environment.
- Bypassing a permission denial or writing an unavailable field as zero.
- Comparing profiler-replayed duration directly with an unprofiled timing sample.
- Calling a conflict field, traffic change, Roofline region, or VIS11 browser state causal proof.
- Keeping only a ratio while discarding raw samples, filters, commands, reports, or competing explanations.

Reviewed: **2026-09-02**. These Solution pages have empty evidence arrays; Q11 itself grants no Evidence Status and inherits none from EX14 or LAB10. Continue with the published [PB-R3-007](/en/practice/#pb-r3-007) and [PB-R3-008](/en/practice/#pb-r3-008), then hand the runner to guided [LAB10](/en/labs/optimize-canonical-transpose/).
