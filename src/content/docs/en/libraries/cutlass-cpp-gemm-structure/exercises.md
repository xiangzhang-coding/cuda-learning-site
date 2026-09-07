---
title: 'L09 Exercises: Hierarchy Arithmetic, Stage Ownership, and Source Audits'
description: Derive an uneven GEMM, prove layout and two-stage storage safety, and audit API-generation, toolchain, licensing, and evidence claims without a GPU.
pairId: l09-exercises
counterpart: /libraries/cutlass-cpp-gemm-structure/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L09-EXERCISES
prerequisites: [L09]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l09-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cutlass-cpp-gemm-structure/exercises/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-07' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: exercise-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L09-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L09 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cutlass-cpp-gemm-structure/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L09](/en/libraries/cutlass-cpp-gemm-structure/) first. Its ordered direct prerequisites remain `A08, L06, M17`; this Exercise set directly requires only `[L09]`. Work on paper from a C++17 reading perspective. No GPU, CUTLASS installation, compilation, or complete CUDA implementation is required.

## Submission requirements

Use CUTLASS C++ v4.7.0 at `dcf215af68a2d08d305076c152a06f201728cd53`, reviewed on 2026-09-07 in [SRC-CUDA-070](/en/sources-and-versions/#src-cuda-070). Expected evidence means derivations and source-review records, not runtime observations. All four evidence arrays remain empty; no Evidence Status is granted or inherited. Do not copy upstream samples, tests, or code. Finish before opening the [separate solutions](/en/libraries/cutlass-cpp-gemm-structure/solutions/).

## Exercise 1: Count owners before counting work

**Goal:** Reconstruct the retained Device/Kernel/Threadblock/Warp/Instruction responsibilities and distinguish output ownership from reduction work.

**Constraints:** Original model `D=2*A*B-0.5*C`, with `M=137,N=77,K=35`. A/B are FP16; C/D, accumulation, and epilogue computation are FP32. Propose threadblock tiles `64x32x16`, warp tiles `32x16x16`, and the selected SM75 `16x8x8` instruction-wrapper geometry. Use ordinary non-split-K output tiling with no warp partition along K. This is geometry, not a demonstrated legal template specialization. A review note multiplies all three ceiling counts into independent output blocks and applies the epilogue separately for each K slice.

**Expected evidence:** A five-row responsibility table, output-grid dimensions and block count, K-slice count, output warp tiles per block, bottom-right origin and valid extent, final valid K range, and geometric instruction-layer coverage per warp tile per full K slice. State the accumulator invariant and repair the epilogue ownership. Bound your comparison with [VIS12](/en/visuals/gemm-tiling-hierarchy/).

**Acceptance criteria:** Every valid output has one owning block and receives the complete K reduction before `2*acc-0.5*C` is applied once. Separate geometric operation counts from emitted or executed instructions, scheduling, and occupancy. VIS12 remains an unchanged source-level scalar `1x1x1` slot, not FMA, MMA, WMMA, SASS, or measured CUTLASS execution.

<details><summary>Hint 1: Separate the output plane from the reduction axis</summary>First tile M and N. Then ask how much K work each existing output owner must accumulate, rather than assigning a new output owner to every slice.</details>

<details><summary>Hint 2: Keep the denominator at the same layer</summary>For warp-level instruction geometry, divide each warp extent by the corresponding instruction extent. The K ratio counts reduction work, not additional output warp tiles.</details>

## Exercise 2: Who may read, and who may overwrite?

**Goal:** Prove global addressing and edge extents independently of shared/register layout, then establish two-stage publication and reuse safety.

**Constraints:** Keep Exercise 1's problem. All global matrices use RowMajor, with A stride 40 and B/C/D stride 80 elements; allocations cover complete physical rows, but padding values are unspecified. A candidate uses `row*77+column` for every operand, treats RowMajor as the shared and register map, and exits threads without valid edge outputs. Its two-stage pipeline reuses stage 0 for the third K slice as soon as the first contents were published, without waiting for their last reader. No actual calls or results exist.

**Expected evidence:** Per-operand offset formulas, last logical offsets and allocation capacities; valid A/B/D extents at the bottom-right block's last K slice; ideal FP16 A/B payload bytes for one and two stages, excluding layout padding and other storage. Supply a bounds-aware copy/zero-fill/store plan and a timeline identifying producer writes, publication, all consumers' last reads, and permission to reuse each slot.

**Acceptance criteria:** Prove logical bounds as well as physical extent; allocated row padding is not automatically zero. Distinguish global layout, shared layout, and register-fragment organization without inventing internal maps or alignment guarantees. Publication must precede reads, and all previous readers must finish before overwrite. All required participants remain for synchronization; preserve accumulation across slices. Neither two buffers nor `can_implement` replaces these proofs, and payload bytes do not establish occupancy or overlap.

<details><summary>Hint 1: Name both coordinates for every operand</summary>A is indexed by output row and K; B by K and output column. Use each matrix's physical stride, and compare the last logical element with its own allocation rather than D's allocation.</details>

<details><summary>Hint 2: Give each use of a slot a generation</summary>The first and third slices occupy different generations of stage 0. Readiness of the old generation is not a release by its consumers; draw a last-read edge before the next producer write.</details>

## Exercise 3: Audit a confident but unsupported release note

**Goal:** Separate API generation, toolchain eligibility, licensing, and source claims from compilation, instruction, and runtime evidence.

**Constraints:** Audit these five fictional claims against L09 and the pinned source ledger. Repair the claims without installing CUTLASS, copying code, adding a Python DSL, or granting an Evidence Status.

| Claim | Proposed conclusion to audit |
| --- | --- |
| API generation | Retained 2.x requires a separate 2.x installation; in 3.x, collective means warp, atom means thread, and the device adapter is called by GPU threads |
| Build environment | CMake 3.18 and compiler-default dialect suffice; Toolkit 13.3.1, NVCC, and Runtime all have version 13.3.1; a README minimum certifies every configuration |
| Architecture | A source `Sm50` tag permits CUDA 13 `sm_50` generation; the SM75 path requires an `a` suffix; `90a` PTX is a general future-GPU fallback |
| Evidence | An inline PTX wrapper is inspected SASS; an owner test returning true proves execution; hypothetical `can_implement` success proves extent, divisibility, correctness, and completion |
| Licensing | CuTe C++ requires CuTe Python DSL, so the root BSD license permits copying DSL examples under the site's content license |

**Expected evidence:** Five repaired audit rows with pinned reading coordinates from SRC-CUDA-070; an explicit proposed Native Linux toolchain with separate component versions, dialect, and target; and distinct future compilation, artifact-inspection, and runtime checklists. Preserve an ordinary all-FP32 non-Tensor-Core SIMT alternative without calling it a bitwise-equivalent or exact reference.

**Acceptance criteria:** Distinguish the 4.7.0 release from its retained API generation and the 3.x cooperation hierarchy from a word-for-word rename. Intersect build, Toolkit, host-compiler, and target requirements; do not convert eligibility into a successful build. Inspect test guards and waivers, keep caller obligations after checking functions, and exclude Python DSL material. No source table or proposed configuration establishes native acceleration or speed.

<details><summary>Hint 1: Give each claim an authority and a boundary</summary>Compare build-configuration requirements with prose, and distinguish implementation tags from compiler targets. Record which exact file or component manifest can answer each question.</details>

<details><summary>Hint 2: Follow the missing evidence chain</summary>A declared operation precedes any generated artifact; a generated artifact precedes execution evidence. Check whether a test can be waived before interpreting its return value, and review the license exception before assuming repository-wide terms.</details>

## Next

Compare the [separate solutions](/en/libraries/cutlass-cpp-gemm-structure/solutions/), then complete [PB-R4-010](/en/practice/#pb-r4-010). Sources: [L09](/en/libraries/cutlass-cpp-gemm-structure/) and [SRC-CUDA-070](/en/sources-and-versions/#src-cuda-070), reviewed **2026-09-07**. Scenarios and derivations are original; no upstream sample/code is copied and no Runnable Example or Lab evidence is inherited.
