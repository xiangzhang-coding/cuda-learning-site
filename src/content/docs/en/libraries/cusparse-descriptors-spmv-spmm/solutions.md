---
title: 'L13 Solutions: Sparse Arithmetic and Preprocessing Ownership'
description: Review exact CSR and dense-layout derivations, conditional format and reuse decisions, and completion-safe workspace designs with release-specific limits.
pairId: l13-solutions
counterpart: /libraries/cusparse-descriptors-spmv-spmm/solutions/
factCheckDate: '2026-09-09'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L13-SOLUTIONS
prerequisites: [L13-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'cuSPARSE archived API reference, CUDA 11.8.0'
    url: 'https://docs.nvidia.com/cuda/archive/11.8.0/cusparse/index.html'
    version: 'Toolkit 11.8.0; cuSPARSE 11.7.5.86'
    platform: 'Historical Generic API and preprocessing contract; no execution'
    accessDate: '2026-09-09'
  - title: 'cuSPARSE archived API reference, CUDA 12.9.2'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cusparse/index.html'
    version: 'Toolkit 12.9.2; cuSPARSE 12.5.10.65'
    platform: 'Baseline descriptors, SpMV, SpMM, ownership and algorithm contract'
    accessDate: '2026-09-09'
  - title: 'cuSPARSE archived API reference, CUDA 13.3.1'
    url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cusparse/index.html'
    version: 'Toolkit 13.3.1; cuSPARSE 12.8.2.51'
    platform: 'Exact archive comparison; not backported to the baseline'
    accessDate: '2026-09-09'
  - title: 'CUDA 11.8.0 release notes'
    url: 'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html'
    version: 'Toolkit 11.8.0'
    platform: 'cuSPARSE history and first-use SM90 PTX overhead'
    accessDate: '2026-09-09'
  - title: 'CUDA 12.9.2 release notes'
    url: 'https://docs.nvidia.com/cuda/archive/12.9.2/cuda-toolkit-release-notes/index.html'
    version: 'Toolkit 12.9.2'
    platform: 'cuSPARSE preprocessing history and scoped known issues'
    accessDate: '2026-09-09'
  - title: 'CUDA 13.3.1 release notes'
    url: 'https://docs.nvidia.com/cuda/archive/13.3.1/cuda-toolkit-release-notes/index.html'
    version: 'Toolkit 13.3 Update 1'
    platform: 'Architecture removals, deprecations and issue history'
    accessDate: '2026-09-09'
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l13-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/libraries/cusparse-descriptors-spmv-spmm/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-09' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L13-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L13-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '6' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '11.8.0,12.9.2,13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/libraries/cusparse-descriptors-spmv-spmm/solutions/" lang="zh-CN">阅读中文对应页</a>

## Reviewed solutions

Attempt the [Exercises](/en/libraries/cusparse-descriptors-spmv-spmm/exercises/) first. These are exact paper derivations, supplied cost assumptions, and documentation-based design reviews, not library queries, execution logs, or benchmarks. All four evidence arrays remain empty. The sole direct prerequisite is `L13-EXERCISES`; [L13](/en/libraries/cusparse-descriptors-spmv-spmm/) provides the underlying contracts.

## Solution 1: An empty row still has an old output

The row intervals are `[0,2)`, `[2,2)`, and `[2,4)`. Thus A's logical rows are `[[2,0,-1,0],[0,0,0,0],[0,3,0,1]]`. There are four offsets for three rows; the first is zero, the last is nnz=4, and none decreases. Every column is in `[0,4)` and each row has sorted, unique columns. The repeated offset describes an empty row, not an invalid matrix or a zero-dimensional matrix.

| Object | Descriptor contract | Caller-owned storage |
| --- | --- | --- |
| A | `cusparseCreateCsr`; `3 x 4`, nnz=4; both offset and column types `CUSPARSE_INDEX_32I`; `CUSPARSE_INDEX_BASE_ZERO`; `CUDA_R_32F` | Four device offsets, four device columns, four device values |
| X | `cusparseCreateDnVec`; length 4; `CUDA_R_32F` | Four device floats |
| Y | `cusparseCreateDnVec`; length 3; `CUDA_R_32F` | Three device floats initialized from Y0 |
| B | `cusparseCreateDnMat`; `4 x 2`; `ld=2`; `CUSPARSE_ORDER_ROW`; `CUDA_R_32F` | Eight device floats |
| C | `cusparseCreateDnMat`; `3 x 2`; `ld=2`; `CUSPARSE_ORDER_ROW`; `CUDA_R_32F` | Six device floats initialized from C0 |

For SpMV, separately set FP32 computation, `CUSPARSE_OPERATION_NON_TRANSPOSE`, `CUSPARSE_SPMV_CSR_ALG2`, host alpha/beta pointers, and the intended handle stream. SpMM needs its own supported algorithm from the 12.9.2 SpMM table, not an SpMV enum. A Generic descriptor describes existing allocations: creation neither uploads values nor converts index widths. `cusparseSpMatSetValues` rebinds a pointer; it does not copy its contents. Destruction releases the descriptor, not those arrays. Check construction status and keep data and objects alive through their last device uses.

| Logical row | B element offsets | C element offsets |
| --- | --- | --- |
| 0 | `0,1` | `0,1` |
| 1 | `2,3` | `2,3` |
| 2 | `4,5` | `4,5` |
| 3 | `6,7` | No such row |

These follow `row*2+column`; B and C need 32 and 24 bytes respectively. The minimum column-major leading dimensions would be 4 for B and 3 for C, not 2. Changing the order enum alone would reinterpret rather than rearrange the arrays. Descriptors retain stored, pre-transpose shapes. For a separate `A^T:4 x 3` SpMV, X must have length 3 and Y length 4; the original vector descriptors do not fit that operation.

The three dot products are `2*1-1*2=0`, an empty sum of zero, and `3*2+1*(-5)=1`. Therefore `A*X=[0,0,1]` and `2*A*X-Y0=[-1,2,-2]`. In particular, the empty row gives `0-(-2)=2`, not zero.

B's first column is X. Its second column gives `2*4-1*1=7`, zero, and `3*1+1*5=8`, so `A*B=[[0,7],[0,0],[1,8]]`. Applying beta to every old C element yields `2*A*B-C0=[[-1,14],[2,-3],[-2,17]]`. The middle row is the negation of C0's middle row. Neither a sparse product alone nor a first-column check verifies the entire update.

Restore Y0 and C0 before each independent trial, with restoration ordered before execution. Otherwise the next call computes `2*A*X-Y1` or `2*A*B-C1`, a different recurrence. A future check must first reject non-finite outputs and references, then apply `abs(actual-reference) <= 1e-6+1e-5*abs(reference)` to every element. Zero references still have the absolute allowance `1e-6`; they must not be skipped or used as divisors.

The documented bitwise determinism of CSR ALG2 is bounded by non-transpose and fixed conditions. It does not promise CPU bitwise equality, transposed-operation determinism, or agreement across GPUs, algorithms, or library versions. The exact worksheet references above are neither an observed deterministic run nor a reason to relax numerical acceptance.

## Solution 2: Count representation bytes, then price the repetitions

For the regular matrix, there are `1024/4=256` block rows and 256 full blocks. Each block has sixteen values, so BSR stores `256*16=4096` values without inner-block padding.

| Representation | Byte derivation | Total bytes |
| --- | --- | --- |
| CSR | `8*4096+4*1025=36868` | 36868 |
| COO | `12*4096=49152` | 49152 |
| BSR, block size 4 | `4096*4+256*4+257*4=18436` | 18436 |

CSR's factor 8 is one 4-byte value plus one 4-byte column index; its 1025 offsets include the terminal offset. COO adds both row and column indices per value. BSR stores only 256 block-column indices and 257 block-row offsets, but does not compress the sixteen values inside a block. These totals exclude all other allocations and are not device-traffic measurements.

The irregular matrix has the same CSR and COO totals, but its BSR total is unknown without the occupied-block count. With K occupied `4 x 4` blocks it would need `16*K*4+K*4+257*4` bytes, including padded zeros. For example, one nonzero in each of 4096 occupied blocks would require 279556 bytes. That is an illustrative alternative distribution, not a claim about the unspecified matrix. Row imbalance and SELL padding also require more than a global nnz count.

CSR is a baseline candidate for ordinary non-transposed SpMV and CSR SpMM. COO remains useful for assembly when normalization and conversion costs are counted. The regular case makes a block-format candidate worth checking, not automatically runnable or faster. Generic BSR SpMV was added in CUDA 13.0 Update 1, so it cannot be selected as a 12.9.2 Generic SpMV path merely because its byte total is attractive. Check the exact operation, format, index types, storage/compute/scalar types, transpose, dense layout, algorithm, and architecture together.

CSC descriptor availability does not authorize arbitrary CSC SpMM. SELL needs a supported operation and a useful within-slice row-length distribution; Blocked-ELL needs the operation's block, type, layout, and architecture restrictions as well as acceptable padding. cuSPARSELt is a separate dependency with its own structured-pattern, shape, alignment, type, device, and software gates, plus checking/compression and workspace lifetimes. General sparsity or dense BSR blocks do not meet those gates automatically. Pruning to force eligibility changes the problem and needs separate acceptance.

The timing worksheet is separate from the storage table. In its hypothetical microsecond units, `T_direct=40*R` and `T_prepared=200+30*R`. Strict improvement requires `200+30*R < 40*R`, hence `R>20`. For integer R, the first qualifying count is 21. At R=20 both cost 800 microseconds; that is a tie, not an improvement. At R=21 the totals are 830 versus 840 microseconds under the model only.

If every execution changes the sparsity pattern and repeats all setup, `T_prepared=(200+30)*R=230*R`, which exceeds `40*R` for every positive R. If only values change, compatible prepared state may survive, subject to the operation's rules and completion ordering; value-upload and output-restoration costs still need consistent accounting. None of the supplied costs establishes actual workspace size, a preprocessing speedup, or a BSR performance result.

## Solution 3: Preserve contents as well as allocation lifetime

After completed preprocessing with P0 followed by P1 on one matA, **P1 alone is active**. P0 may remain a valid allocation, but it is inactive for that descriptor. A compatible SpMV can use it without the preprocessing acceleration; passing P0 does not make both states active or authorize overwriting either buffer while it is in use.

Independent concurrent workspaces need `4096+4096=8192` bytes, exceeding the stipulated 6144-byte budget. Reject that concurrent design. Giving both workers P1 is not a memory-saving repair: their workspace uses overlap. With a revised budget, independent prepared workers should have separate sparse descriptors, workspaces, writable operands, and safely managed handles/streams. They may share immutable indices and other data only while those allocations remain unchanged and alive. Do not race on handle stream/pointer-mode settings or descriptor state.

Explicit serialization needs `max(4096,4096)=4096` bytes and fits the worksheet budget. Here both workers have compatible structure/configuration, so one descriptor and one intact active buffer can serve sequential calls, with permitted operand changes made after prior uses complete. Alternatively, serialize ordinary unprepared calls. Reusing a scratch allocation for a different preparation can destroy its previous prepared contents even after execution has finished; re-establish that state when required rather than claiming two cached states survived. Neither arithmetic result allocates memory or proves a real query will return 4096.

| Proposed change | Reuse decision |
| --- | --- |
| Change alpha/beta, X/Y contents or compatible pointers | Allowed by the compatible SpMV preprocessing contract; preserve shape/type and establish ordering |
| Change matrix values or rebind their pointer | Allowed with compatible storage; upload explicitly, preserve old storage through last use, and avoid concurrent descriptor mutation |
| Change a column index while keeping nnz constant | Changes structure; previous preparation is not reusable merely because capacity still fits |
| Change shape, representation, operation, compute type, or algorithm | Recheck support, query the new configuration, and prepare anew if using acceleration |
| Clear, overwrite, free, or lend the active buffer to unrelated work | Invalidates the retained-state assumption; completion and future prepared consumers both matter |

For a real implementation, check object creation and the exact size query, allocate required device workspace, and set the intended stream and scalar-pointer mode. The ordered data path is `H2D initialization -> optional supported preprocessing -> SpMV -> D2H result copy -> checked completion -> result inspection`. Keep host transfer storage, device operands, workspace, descriptors, and the handle valid through their final uses. In one stream submission order provides device ordering; across streams, record an event after the producer's last relevant use and wait in the consumer stream, or establish a checked host completion boundary. A host API success alone proves none of these completion edges.

Before reconfiguration or cleanup, establish the last-use completion boundary for every affected resource. After partial submission fails, stop new work, retain the first error, attempt to drain already submitted work, and clean up only resources actually acquired. Check completion and cleanup failures without replacing the original failure with success. If completion cannot be established, do not release potentially in-flight host transfer storage under normal-success assumptions or inspect it as a valid result. Descriptor destruction does not itself wait for all device consumers or free caller-owned arrays.

| Exact archive | SpMV preprocessing | SpMM preprocessing and boundary |
| --- | --- | --- |
| 11.8.0 | No `cusparseSpMV_preprocess`; it was introduced in CUDA 12.4 | `cusparseSpMM_preprocess` already exists; acceleration scope is CSR ALG1/ALG3 |
| 12.9.2 | Optional; acceleration scope is CSR ALG1/ALG2; one active buffer per matA | Optional; CSR ALG1/ALG3, not CSR ALG2; retain compatible sparse structure and dense shape/layout |
| 13.3.1 | Retain the operation-specific compatible-state contract; not an 11.8 backport | Guide explicitly limits preprocessing to CSR and places it before graph capture; do not project that wording onto the baseline |

SpMM uses B and C, not X/Y. Its scalar and operand updates follow its own versioned contract; a newer prose typo naming `matX/matY` is not a new API signature. SpMM CSR ALG3 restricts A to non-transpose, excludes conjugate-transpose B, and does not support batching. Its determinism statement also requires the release check below. The graph discussion is a paper boundary, not an implemented or verified capture path.

| Claim under review | Correct scoped conclusion |
| --- | --- |
| Mixed-precision SpMV/SpMM is cleared on 12.9 | Reject: CUSPARSE-2349 records possible incorrect results. The all-FP32 worksheet does not test or clear mixed precision. |
| CSR SpMM ALG3 was deterministic throughout 13.0 | Reject: the defect is recorded in 13.0; CUSPARSE-2612 records the fix in 13.1. The general API guarantee does not erase that interval. |
| The 13.3 Update 1 fix verifies this workload | Reject: 5975307 concerns rare CSC or transposed-CSR SpMV incorrect results, not an observed non-transposed CSR execution here. |

For future evidence, keep the following records unfilled until actually obtained. A zero is a value, not a substitute for an absent measurement.

| Record | Required future fields | Observation now |
| --- | --- | --- |
| Environment Manifest | GPU, CC, memory, GPU count, driver, Toolkit, header version, package identity, loaded library path/hash and API version, OS/compiler | Not recorded |
| Preparation | Matrix and dense layouts, types, algorithm, reuse count, queried bytes, allocation status, conversion/preprocessing boundaries | Not recorded |
| Correctness and completion | Initial outputs, independent reference, finite/tolerance checks, stream dependencies, API and cleanup logs | Not recorded |
| Performance | Host setup, first use, cache/warmup conditions, warmed device-event intervals, repetitions and input-restoration/transfer policy | Not recorded |

An acquisition manifest or header build number does not prove which binary was loaded. `cusparseGetProperty` reports major/minor/patch, not an independently observed fourth package component. Keep first use separate from warmed execution; the 11.8 SM90 PTX JIT note is a reason to record those boundaries, not a measured startup penalty. Static reading needs no GPU. Future baseline runtime requires native Linux and one CC 7.5+ GPU with the problem fitting within 8 GB; that floor does not authorize every format, precision, or structured-sparsity path.

## Valid alternatives

A column-major SpMM design is valid after repacking B as `[1,2,2,-5,4,1,1,5]` with `ld=4` and C0 as `[1,-2,4,0,3,-1]` with `ld=3`, then rechecking algorithm support and workspace. It preserves the logical products but is not an enum-only change. A loop of SpMV over B's columns can be another supported design, provided each column's old C and dependencies are preserved; equivalent mathematics does not prove equal arithmetic order, scratch use, or speed.

The ordinary no-preprocess SpMV path remains valid across the three profiles and is the scope of [EX20](/en/examples/cusparse-spmv/). Independent descriptors with exclusive buffers are another design if the budget is explicitly increased. Serialization is valid within the current budget when last-use and prepared-content requirements hold. Choosing any of these alternatives is not a performance verdict.

## Common errors

- Deleting a repeated CSR offset removes an empty row and changes dimensions; skipping its beta contribution gives the wrong output.
- Declaring a different index type or dense order does not convert the underlying bytes. Constructor success does not validate those bytes.
- Replacing SpMM's B/C rules or algorithms with SpMV's X/Y rules confuses distinct operation contracts.
- Counting scalar CSR indices as BSR block indices, or omitting the terminal offset, invalidates the storage comparison.
- Calling R=20 a strict win, or charging setup only once when indices change every round, misuses the supplied cost model.
- Equating valid allocated scratch with active prepared contents misses state invalidation; freeing it after host return misses asynchronous lifetime.
- Treating a possible beta-zero Compute Sanitizer race false positive as permission to ignore any diagnostic hides real races and memory errors. Match the documented condition and retain independent correctness checks.
- Calling a paper answer Compile-Checked or Runtime-Verified upgrades evidence without a build or run. These pages claim neither.

Return to [L13](/en/libraries/cusparse-descriptors-spmv-spmm/) and [EX20](/en/examples/cusparse-spmv/). Source basis: [SRC-CUDA-075](/en/sources-and-versions/#src-cuda-075) and [SRC-CUDA-076](/en/sources-and-versions/#src-cuda-076), checked **2026-09-09**. Prose, scenarios, and derivations are original; no owner exercise or sample is adapted. EX20's compilation evidence is independent and its runtime remains Pending Hardware Verification.
