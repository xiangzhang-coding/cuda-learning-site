---
title: 'Q13 Reviewed Solutions: Controlled GEMM Evidence'
description: Review the EX15 baseline, four-stage GEMM runner, and resource, profiler, architecture, and production-claim audit with alternatives and common errors.
pairId: q13-solutions
counterpart: /correctness/gemm-optimization-case-study/solutions/
factCheckDate: '2026-09-03'
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
unitId: Q13-SOLUTIONS
prerequisites:
  - Q13-EXERCISES
hardwareGate: none
evidence:
  compilation: []
  runtime: []
  expectedObservations: []
  recordedObservations: []
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: q13-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/correctness/gemm-optimization-case-study/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-03' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: Q13-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: Q13-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/correctness/gemm-optimization-case-study/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

These are static reviewed solutions for the [Q13 Exercises](/en/correctness/gemm-optimization-case-study/exercises/). They provide source and method review, not GPU output, timing, metrics, occupancy, traffic, speedup, or a winner. Q13 is a Learning Unit, grants no Evidence Status, and keeps all four evidence arrays empty. EX15 remains Pending Hardware Verification.

## Solution 1: Reject and rebuild the tile graph

Reject the proposal. A memorized 32-by-32 label gives no block legality, ownership, K depth, edge behavior, reuse, compiled resource, workload, precision, or hardware argument. Square aligned beta-zero cases omit partial M/N/K and initial-C behavior. An unpinned source and missing independent oracle make even correctness unauditable; changing five variables makes attribution invalid.

The repaired baseline pins EX15 revision `d03ff3b27294f77b5f5a0a3b594bebf20a89cf70`, its three fixtures, row-major equation, FP32 device accumulation, double CPU accumulation, finite rejection, and absolute-plus-relative comparator. It then forms `canonical-16x16x16 -> k-tile-16x16x8 -> rectangular-32x8x8 -> coarsened-32x16x8`. The first edge isolates K depth while disclosing barrier, storage, cooperative-load ownership, active-instruction, and address-group coupling. The second changes directional reuse and grid/edge shape as a bundle. The third changes output ownership and reuse while disclosing accumulator/register, grid, and dependency coupling. Every edge has support, reject, no-answer, and rollback branches.

**Review:** Pass. Correctness, source arithmetic, compiler resources, GPU observations, and elapsed results occupy separate columns; no tile is preselected.

## Solution 2: Review the runner implementation

After completing your Exercise 2, download the original [reviewed runner](/assets/exercise-solutions/q13-gemm-candidates.cu). Its repository path is `public/assets/exercise-solutions/q13-gemm-candidates.cu` and exact SHA-256 is `00a809be2e2224022f4dce544fd84cba7144a97918a2c0b2a17768054514ecc7`. It is an Apache-2.0 reviewed solution, not a second canonical EX15, not a new Runnable Example, and grants no Evidence Status.

The runner includes canonical `tiled_gemm_reference.hpp` and directly calls `ex15::matrix_counts`, `ex15::make_fixture`, `ex15::gemm_reference`, and `ex15::verify_tolerance`. It recognizes all three canonical shapes through `ex15::kFixtures`, preserving their exact inputs and alpha/beta, while the measurement shape alone uses the reviewed deterministic generator. One C++17 device-body template implements four explicit tile/ownership coordinates behind four uniquely named kernel wrappers, so `--kernel-name-base function` can select one stage without collapsing template specializations. A cooperative linear load loop zero-fills bounds-invalid shared slots, and all 256 threads reach both block barriers. Each stage restores initial C, checks launch and full `cudaDeviceSynchronize`, copies the complete output, and qualifies against the independent double result. Candidates never serve as one another's oracle.

From the repository root, with an existing `build/` directory, the expanded C++17 command is:

```bash
nvcc \
  --std=c++17 \
  --generate-code=arch=compute_75,code=sm_75 \
  --generate-code=arch=compute_75,code=compute_75 \
  --include-path examples/ex15-tiled-gemm/include \
  public/assets/exercise-solutions/q13-gemm-candidates.cu \
  --output-file build/q13-gemm-candidates
```

The pinned `cuda-11.8`, `cuda-12.9`, and `cuda-13.3` gates compile, link, and statically inspect this exact source without execution. A valid learner alternative may organize code differently, but it retains the CLI, stage IDs/order, EX15 oracle/comparator, C restoration, C++17 targets, fixture records, and source/build/binary hashes.

**Review:** Pass. The reviewed source keeps EX15 immutable, makes the tile/ownership coordinates explicit, and emits correctness labels without a performance result.

## Solution 3: Reject resource, architecture, and production claims

Reject all four conclusions. A friendly occupancy label without compiled registers/shared/local memory and exact device limits cannot establish theoretical occupancy. One percentage without an exact metric definition, scope, GPU, version, query, report, or custody cannot establish achieved occupancy. Neither value is a speed score. Missing matched unprofiled samples prevents an elapsed comparison, and missing correctness rejects every candidate before performance interpretation.

The source contains ordinary FP32 multiplication/addition, shared arrays, and block barriers; it has no Tensor Core, WMMA, MMA, or architecture-specific branch. Do not infer emitted instructions from a source-level multiply-accumulate panel. Each repaired stage record repeats `1024x1024x1024`, FP32 inputs/output/device accumulation, double CPU reference, exact compute capability, C restoration, three excluded warm-ups, checked completion, ten retained attempts with median/min/max, query-first profiler method, permission, complete Environment Manifest, EX15 tolerance result, and a named bounded interpretation. Source estimates, compiler resources, theoretical occupancy, achieved occupancy, queried path traffic, and unprofiled elapsed samples remain separate.

L06 and LAB12 are unpublished. The educational kernel omits production-library contracts and cannot replace cuBLAS. No API or comparison is supplied to repair that claim.

**Review:** Pass. Unsupported universal, causal, architecture, and production statements are rejected; missing evidence remains expected and unrecorded rather than zero or guessed.

## Valid alternatives

- Branch all three candidates from one correctness-qualified EX15-shaped baseline if each branch retains an independent diff, ledger, and matched collection record.
- Choose another labeled `TM/TN/TK` coordinate if block legality, ownership, edge behavior, reuse arithmetic, resources, and reject rules are derived rather than memorized.
- Use a different deterministic measurement shape, but treat it as a new comparison and recompute bytes, grid/edge behavior, work convention, and every retained coordinate.
- Use another exact queried section or short metric list if its definition, unit, scope, availability, normalization, filter, and report custody answer the same frozen question.
- Keep one output per thread and vary only an output-tile dimension; the resulting experiment answers a narrower question but still needs compiled-resource and correctness records.

## Common errors

- Writing `32x32` without labeling `TM`, `TN`, `TK`, block dimensions, outputs per thread, or hardware legality.
- Testing only square, tile-aligned, beta-zero matrices and missing partial tiles or stale C input.
- Returning an invalid output owner before a block barrier even though it may still own a valid shared load.
- Calling source shared bytes or accumulator count the final register allocation or occupancy.
- Treating theoretical or achieved occupancy as a target to maximize or proof of speed.
- Calling source-requested tile bytes observed DRAM traffic, or using either without a declared normalization.
- Changing precision, fast-math, target architecture, or compiler flags inside a tile comparison without starting a new edge.
- Inferring Tensor Core or FMA/MMA instructions from source syntax or VIS12.
- Retaining only a ratio or screenshot instead of raw attempts, query output, report, command, status, and hashes.
- Publishing a cuBLAS API/result or LAB12 before L06 exists, or calling the educational kernel a production replacement.

Reviewed on **2026-09-03**. Continue with [PB-R3-011](/en/practice/#pb-r3-011) and [PB-R3-012](/en/practice/#pb-r3-012).
