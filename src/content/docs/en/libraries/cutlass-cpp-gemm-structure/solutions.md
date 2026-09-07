---
title: 'L09 Solutions: Derive Ownership and Bound the Evidence'
description: Resolve hierarchy counts, padded offsets, two-stage reuse dependencies, and unsupported API, toolchain, and licensing conclusions through original static derivations.
pairId: l09-solutions
counterpart: /libraries/cutlass-cpp-gemm-structure/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L09-SOLUTIONS
prerequisites: [L09-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l09-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cutlass-cpp-gemm-structure/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-07' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L09-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L09-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cutlass-cpp-gemm-structure/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

Complete the [L09 Exercises](/en/libraries/cutlass-cpp-gemm-structure/exercises/) first. This page uses [L09](/en/libraries/cutlass-cpp-gemm-structure/) and [SRC-CUDA-070](/en/sources-and-versions/#src-cuda-070) for original C++17 source reasoning and paper derivations, with no GPU requirement. No upstream sample/code is copied; no CUTLASS instantiation, CUDA compilation, artifact inspection, execution, or timing occurred. All four evidence arrays remain empty; no Evidence Status is granted or inherited.

## Solution 1: Nine output owners, not twenty-seven

| Retained level | Responsibility in this model |
| --- | --- |
| Device | Host-facing typed handle: arguments, eligibility check, workspace, initialization, launch, and status |
| Kernel | Assign the block's output tile and compose the mainloop with its epilogue |
| Threadblock | Traverse K slices and coordinate shared-storage staging and reuse |
| Warp | Organize output subtiles, register fragments, and repeated multiply-accumulate work |
| Instruction | Request a concrete operation through the selected wrapper, not report executed hardware instructions |

The output grid is `ceil(137/64) x ceil(77/32)=3x3`, hence 9 blocks. Each traverses `ceil(35/16)=3` K slices internally, not 27 independent D writers. With no K partition, there are `(64/32)*(32/16)=4` output warp tiles per block. The bottom-right origin is `(128,64)`, leaving `137-128=9` rows and `77-64=13` columns, or `9x13` valid outputs. The final slice has `k=32..34`, only three valid K positions.

One full warp slice has geometric coverage `(32/16)*(16/8)*(16/8)=8` instruction-layer operations. Tail padding does not turn that model into an emitted or executed count. Zero the accumulator once; after s completed slices it contains contributions only from `0 <= k < min(16*s,35)`. After all three slices, the owning block applies `2*acc-0.5*C` once per valid output. Independent slice epilogues either overwrite earlier contributions or, if summed, apply C three times. This contribution invariant does not prescribe floating-point reduction order.

Template support, layout eligibility, instruction lowering, scheduling, and occupancy remain unproved. [VIS12](/en/visuals/gemm-tiling-hierarchy/) remains an unchanged source-level scalar `1x1x1` slot, not FMA, MMA, WMMA, SASS, or measured CUTLASS execution. Its spatial teaching role does not acquire the separate `16x8x8` wrapper geometry.

## Solution 2: Address proofs and two independent permissions

| Global operand | Element offset | Last logical offset | Allocated elements |
| --- | --- | --- | --- |
| A | `i*40+k` | `136*40+34=5474` | `137*40=5480` |
| B | `k*80+j` | `34*80+76=2796` | `35*80=2800` |
| C and D, each | `i*80+j` | `136*80+76=10956` | `137*80=10960` |

All last logical offsets are below their respective capacities; `row*77+column` uses neither A's nor the other matrices' physical stride. At `(m0,n0,k0)=(128,64,32)`, valid A is `9x3`, B is `3x13`, and D is `9x13`. Even an address inside allocated row padding need not contain a logical operand or zero. These global maps reveal neither shared-memory layout nor register-fragment organization, and establish no subview alignment eligibility.

One ideal stage holds `(64*16+16*32)*2=3072` bytes of FP16 A/B payload; two hold `2*3072=6144` bytes. This excludes layout padding, pipeline bookkeeping, and other kernel storage. For every stage, read A only when its row and K coordinate are valid, and B only when its K and column are valid; explicitly zero every other input slot. The final slice has thirteen invalid K positions, not permission to read thirteen more physical elements. Store only valid D coordinates after the single epilogue.

1. Stage 0 generation 0 receives `k=0..15`. Producers finish writes and publish them before consumers read; all consumers must finish their stage-0 reads before that generation is released.
2. Stage 1 generation 0 receives `k=16..31`, with its own write-before-read publication and last-read-before-reuse requirement. A ready stage 1 cannot release stage 0 on behalf of its readers.
3. Stage 0 generation 1 receives `k=32..34` plus explicit zero-fill only after generation 0 is released. Publish the new contents before their consumers read, retain accumulated contributions, and finish consumption before any further reuse.

A conservative paper schedule makes all producer and consumer threads reach a block-scope publication barrier after filling a slot, then a block-scope reuse barrier after consumption, repeating uniformly for each slice. Threads without valid edge data still participate. This satisfies the dependency model without assuming overlap or claiming to reproduce the pinned instruction schedule. Two buffers alone supply no ordering; `can_implement` does not prove extent or lifetimes. No particular shared/register map, use of `cuda::pipeline`, or observed race freedom follows.

## Solution 3: Replace assertions with bounded audit records

All CUTLASS coordinates below refer to C++ v4.7.0, commit `dcf215af68a2d08d305076c152a06f201728cd53`, as recorded in SRC-CUDA-070. The component manifest has its own version identity, not that source SHA.

| Audit | Corrected conclusion and reading coordinate |
| --- | --- |
| API generation | The retained 2.x-style API lives inside 4.7.0. The 3.x path is Device -> Kernel -> Collective -> Tiled MMA/Copy -> Atom; collectives coordinate cooperating threads and dependencies, while atoms describe primitive operations, not single threads. The kernel composes collective mainloop and epilogue; the adapter stays host-facing. See `media/docs/cpp/gemm_api_3x.md:83-195` and `include/cutlass/gemm/device/gemm_universal_adapter.h:123-137`. |
| Build environment | Actual CMake floor is 3.19, not Quickstart's 3.18; select explicit C++17 and intersect CUTLASS, Toolkit, host, and target requirements. A README minimum certifies no configuration cross-product. See `CMakeLists.txt:29-108`; distinguish Toolkit 13.3.1, NVCC 13.3.73, and Runtime 13.3.29 using the `redistrib_13.3.1.json` manifest linked in SRC-CUDA-070. |
| Architecture | `Sm50` is an implementation tag, not permission to generate `sm_50` with CUDA 13. The ordinary SM75 path needs no `a` suffix; `90a` PTX is architecture-specific, not general future fallback. See `CMakeLists.txt:174-208` and the source ledger's M17 target rules; record actual virtual/real compiler targets separately. |
| Evidence | The selected wrapper requests inline PTX, not inspected SASS: `include/cutlass/arch/mma_sm75.h:142-200`. Test guards and waivers matter: `test/unit/gemm/device/testbed.h:256-347` can return true after a shared-memory waiver. At `include/cutlass/gemm/kernel/gemm.h:151-198`, the check concerns layout-dependent tensor-reference alignment, not universal M/N/K divisibility, extent, numerics, native acceleration, or completion. No hypothetical success discharges caller obligations. |
| Licensing | CuTe C++ does not require CuTe Python DSL. Pinned `LICENSE.txt` explicitly excepts `python/CuTeDSL`; `media/docs/pythonDSL/license.rst` is a separate NVIDIA agreement dated May 8, 2025, not BSD. Keep DSL implementation, examples, packages, and artifacts excluded. Any future authorized C++ adaptation must preserve exact per-file notices, conditions, and disclaimer, satisfy binary-notice requirements, and avoid unauthorized endorsement; the site's content license cannot replace those terms. |

The proposed, unverified target is **Native Linux x86-64, Ubuntu 24.04, Toolkit 13.3.1, NVCC 13.3.73, Runtime 13.3.29, GCC 13.3.0, explicit C++17, ordinary `sm_75`**, with CMake meeting the 3.19 floor. GCC 13.3.0 fits the reviewed 13.3 host-policy range, but the live 13.3 guide is not a 13.3.1 archive. Neither that eligibility nor the changelog recommendation establishes a build. Native Linux remains the only Supported Environment; this optional track does not automatically enter the core compile matrix.

1. Future compilation: retain exact source SHA and specialization, OS/compiler/component versions, CMake version, dialect, virtual/real target flags, commands, artifact hashes, diagnostics, and exit status. Account for guards and skipped configurations before claiming Compile-Checked.
2. Future artifact inspection: inspect the identified generated artifacts and retain tool versions and disassembly for instruction claims. Source-visible PTX is not generated PTX/SASS evidence, and inspection alone proves neither execution nor speed.
3. Future runtime: declare a Reference Environment and Environment Manifest including GPU/CC/count and driver, audit test waivers, check completion and errors, and compare actual outputs with independent references under predeclared numerical criteria. Record actual acceptance results; performance needs separate measurements with stated boundaries. Nothing in these Exercises supplies those records.

## Valid alternatives

- Exercise 1: Verify the nine owners by enumerating non-overlapping output rectangles instead of ceiling arithmetic. Split-K would require a new merge and exactly-once-C proof and does not satisfy the stated non-split-K constraint.
- Exercise 2: Explicitly allocate a padded `192x96x48` problem, zero-fill A/B outside the logical region, preserve valid C, define padded C, and copy back only `137x77` outputs. Recompute physical strides/capacities and retain publication/reuse proofs; padding alone is not synchronization.
- Exercise 3: Retain an ordinary non-Tensor-Core FP32 SIMT path with FP32 A/B/C/D, accumulator, and epilogue computation, with explicit tails and scaling. Site hardware support starts at CC 7.5 with bounded problems below 8 GB, not at an older implementation tag. Changing FP16 inputs to FP32 changes the numerical algorithm; it is not a bitwise-equivalent fallback or exact real-arithmetic oracle, and no speed claim follows.

## Common errors

- Multiplying the K-slice count into independent output ownership, resetting accumulation at each slice, or applying C repeatedly.
- Treating allocated padding as initialized operands, global RowMajor as every internal map, readiness as permission to overwrite, or payload size as occupancy.
- Equating API generation with release version, source tags with compiler targets, test returns with execution, or root-license prose with permission to copy the excluded DSL.

Continue with [PB-R4-010](/en/practice/#pb-r4-010) and [SRC-CUDA-070](/en/sources-and-versions/#src-cuda-070). Reviewed **2026-09-07**. These are original derivations only, without compilation, execution, instruction-selection, or performance results.
