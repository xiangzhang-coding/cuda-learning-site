---
title: 'L08 Solutions: Prove Precision and Safety Contracts Stage by Stage'
description: Derive two conversions, repair WMMA type and architecture judgments, and prove storage and synchronization for full-warp tail tiles.
pairId: l08-solutions
counterpart: /libraries/tensor-core-precision-contracts/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L08-SOLUTIONS
prerequisites: [L08-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l08-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/tensor-core-precision-contracts/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L08-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L08-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/tensor-core-precision-contracts/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

Complete the [L08 Exercises](/en/libraries/tensor-core-precision-contracts/exercises/) first. This page uses [L08](/en/libraries/tensor-core-precision-contracts/) and [SRC-CUDA-069](/en/sources-and-versions/#src-cuda-069) for C++17 reading and original static derivations, with no GPU requirement. No code is copied, and no CUDA compilation, instruction inspection, execution, or timing occurred. All four evidence arrays remain empty; no Evidence Status is granted or inherited.

## Solution 1: Two references with the same output conversion

At 2, FP16 upward spacing is `2^-9`. The value `2+2^-10` lies halfway between 2 and `2+2^-9`. The retained significand of 2 is even, so round-to-nearest-even selects 2. All remaining A/B values are exactly representable, leaving `a=[2,2],b=[1,-1]` after conversion. The original dot product is `2^-10`, while the algebraic converted-input dot product is zero. Even exact accumulation cannot restore the input difference.

| Original inputs | Stored inputs | Actual multiplicands | Accumulator | Epilogue | D storage |
| --- | --- | --- | --- | --- | --- |
| Specified FP32 A/B/C | FP16 A/B; C remains FP32 | Rounded half values; FP16 WMMA multiplication is at least single precision | FP32 Accumulator Type | FP32 `alpha=1/4,beta=1` and C | Explicit round-to-nearest conversion to FP16, ties to even |

Include scaling and C in each reference: `U_original=(1/4)*2^-10+1+2^-11=1+3*2^-12`, while `U_stored=(1/4)*0+1+2^-11=1+2^-11`. These finite binary fractions and reference intermediates are exactly representable in FP32/FP64; a general double reference is still not exact real arithmetic. Derive both references independently from their respective inputs rather than reusing the reviewed implementation's indexing or reduction order.

At 1, FP16 upward spacing is `2^-10`. The original reference is three quarters through the interval, giving `R_original=1+2^-10`. The converted-input reference is exactly halfway, selecting the even endpoint `R_stored=1`. The pre-store difference is `U_stored-U_original=-2^-12`; the post-store difference is `R_stored-R_original=-2^-10`. Output conversion displacements are `R_original-U_original=2^-12` and `R_stored-U_stored=-2^-11`. These distinct error stages cannot all be attributed to the accumulator.

The ideal converted-input answer differs from the original-problem stored reference by `2^-10 > 2^-11`, failing the specified acceptance criterion. It can exactly satisfy the converted-input reference while still failing the original application. There is no actual `got` here. An actual result's difference from `R_stored` would still require examining multiplication, accumulation, epilogue, and conversion. Reject non-finite values separately; other ranges, K values, or cancellation patterns need their own tolerances.

A legal design computes the dot product with a zero-initialized float fragment, uses `store_matrix_sync` to write valid float staging storage with appropriate alignment, stride, and capacity, then performs the FP32 epilogue and explicit half conversion at logical coordinates. A float fragment cannot store directly through `__half*`, and general `alpha,beta` processing is not automatic in `mma_sync`. This design promises neither actual WMMA reduction order nor bitwise agreement with a scalar loop.

## Solution 2: Repair proposals at the correct contract layer

This is the C++ WMMA warp-tile contract, not every underlying MMA instruction shape. Historical minimum targets are not records of current compilation success.

| Path | A/B fragment element types | C/D fragment element types | All WMMA tiles | API/PTX minimum target |
| --- | --- | --- | --- | --- |
| FP16 | Both `__half` | `float` or `__half` | `16x16x16`, `32x8x16`, `8x32x16` | `sm_70` |
| BF16 | Both `__nv_bfloat16` | `float` | `16x16x16`, `32x8x16`, `8x32x16` | `sm_80` |
| TF32 | Both `nvcuda::wmma::precision::tf32` | `float` | `16x16x8` | `sm_80` |
| FP64 | Both `double` | `double` | `8x8x4` | `sm_80` |
| INT8 | Both `signed char`, or both `unsigned char` | `int` | `16x16x16`, `32x8x16`, `8x32x16` | `sm_72` |

1. BF16 on CC 8.0 does not legalize half accumulator fragments. Use float accumulation and separately declare output conversion if narrow storage is required.
2. The TF32 proposal has independent target, input-preparation, fragment-type, and shape errors. Choose a listed CC 8.0-or-newer target with the required capability and checked current-toolchain acceptance. Convert float inputs with `__float_to_tf32`, using TF32 fragments, float accumulation, and `16x16x8`. Conversion arguments, results, and storage remain float; this implies neither ordinary FP32 multiplicands nor a universal 19-bit packed C++ type or an unstated rounding mode.
3. Double types and `8x8x4` match the listed interface contract, but `8.6 >= 8.0` does not prove native FP64 Tensor Core acceleration. The table reviewed on 2026-09-07 lists only **CC 8.0, 9.0, 10.0**, not 8.6, 8.7, 8.9, 10.3, 11.0, or 12.x. Reject the native-capability claim without guessing compiler lowering or asserting that the interface must fail compilation.
4. INT8 inputs need matching explicit signedness; do not guess with plain `char`. The historical interface floor `sm_72` is below the site's CC 7.5 baseline and is not a CUDA 13 code-generation target. A future implementation selects a valid target separately and first proves with wider integers that 32-bit accumulation cannot overflow. Final INT8 storage requires separate scale, zero-point, rounding, and clamping contracts; an int fragment is not an INT8 array.

The native-type table lists FP16/INT8 at CC 7.5 and every later listed row, and BF16/TF32 from CC 8.0. It promises nothing about every future CC. Future compilation must record exact toolchain and target; artifact inspection answers which instructions were generated; execution and an independent reference address actual output and acceptance; performance requires separate measurement. None occurred here. Native Linux remains the only Supported Environment.

## Solution 3: Prove complete storage before collective access

All three original starts have element offset `16*24+16=400`. A/B have byte offset `400*2=800`; D has `400*4=1600`. Each has residue zero modulo 32. Half stride 24 is a multiple of 8; float stride 24 is a multiple of 4. Valid starts and strides still do not make the tails safe for complete `16x16` accesses: A has only `3x7` valid inputs, B `7x5`, and D `3x5` outputs.

The alternative half staging pointer advances `8*2=16` bytes, leaving residue 16 modulo 32. A legal `ldm=24` cannot repair that start. Float output `ldm=18` is not a multiple of 4 and is illegal even with an aligned base. `ldm` always counts elements. The 32-byte starting requirement and 16-byte stride granularity are separate checks; half/float rules are not a universal rule for every type.

One complete design provides separate 32-byte-aligned `16x16` half stages for A/B and a similarly aligned `16x16` float output stage, all with `ldm=16`. Each stage's maximum element offset is `15*16+15=255`, requiring 512 bytes per half stage and 1024 bytes for float. In the last step, read only original A rows 16 through 18 and K positions 16 through 22, and original B K positions 16 through 22 and columns 16 through 20. Zero-fill all other input slots. Finally copy only D rows 16 through 18 and columns 16 through 20, using ordinary memory coordinates rather than guesses about `fragment.x[i]`.

1. The consumer warp zeroes its accumulator once before the first K step and retains it across steps. The producer copies valid coordinates and defines every padding slot. All threads remain available for subsequent block barriers.
2. Both warps reach a block-scope publication barrier. The complete consumer warp then performs matching collective loads and multiply-accumulate operations. Boundary predicates select copied data, not participating consumer lanes.
3. After the consumer finishes this step's reads and multiply-accumulate, both warps cross a reuse barrier before the producer overwrites the same input stages. Repeat across K steps without resetting the accumulator at the tail.
4. The complete consumer warp finally stores its float fragment into the full output stage. After a publication barrier, both warps cooperate to copy valid outputs, then cross a last-read barrier before output-stage reuse. Every barrier is reached uniformly by the entire block.

These phases establish static publication-before-read and read-before-reuse relationships. WMMA synchronizes only its participating warp; it cannot independently publish another warp's writes or prove host-read readiness. Future execution still requires completion/error checks and independent numerical acceptance. A paper design is not observed memory safety.

## Valid alternatives

- Exercise 1: Compare against an ordinary non-Tensor-Core FP32 SIMT path retaining original inputs and the specified FP16 output conversion. This is a different numerical algorithm, not an exact real-arithmetic oracle or bitwise-equivalent fallback. Merely widening accumulation cannot repair input loss.
- Exercise 2: If native FP64 is required, select only devices with listed capability and usable toolchain targets; otherwise explicitly drop the native-acceleration requirement and define a separate double-precision implementation. Offer no unmeasured speed judgment.
- Exercise 3: Explicitly pad the entire problem to `32x32x32`, zero-fill inputs, preserve valid-region results, and copy only `19x21` outputs. Alternatively, assign edges to another boundary-safe implementation and revalidate its numerical contract. Both need independent capacity, ownership, and synchronization proofs.

## Common errors

- Treating agreement with `R_stored` as original-problem acceptance, comparing `U_original` with `R_stored`, or relaxing the given threshold to hide conversion loss.
- Equating float storage with FP32 multiplicands, treating historical `sm_72` as a CUDA 13 target, or turning the `sm_80` floor into an increasing native-FP64 whitelist.
- Loading a tail solely because its start is aligned, exiting some lanes early, replacing cross-warp barriers with WMMA, or substituting fragment indices for logical coordinates.

Continue with [PB-R4-009](/en/practice/#pb-r4-009) and [SRC-CUDA-069](/en/sources-and-versions/#src-cuda-069). Reviewed **2026-09-07**. These are original derivations only, without compilation, execution, instruction-selection, or performance results.
