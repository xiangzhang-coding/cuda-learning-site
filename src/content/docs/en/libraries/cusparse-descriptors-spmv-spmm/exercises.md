---
title: 'L13 Exercises: Sparse Descriptors, Format Costs, and Safe Reuse'
description: Derive independent SpMV and SpMM answers, compare sparse storage and amortization, and repair a preprocessing pipeline without inventing GPU evidence.
pairId: l13-exercises
counterpart: /libraries/cusparse-descriptors-spmv-spmm/exercises/
factCheckDate: '2026-09-09'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L13-EXERCISES
prerequisites: [L13]
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
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: l13-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/libraries/cusparse-descriptors-spmv-spmm/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-09' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: L13-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: L13 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:source-count', content: '6' } }
  - { tag: meta, attrs: { name: 'cuda:source-versions', content: '11.8.0,12.9.2,13.3.1' } }
---

<a class="locale-pair" data-locale-counterpart href="/libraries/cusparse-descriptors-spmv-spmm/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L13](/en/libraries/cusparse-descriptors-spmv-spmm/). These are paper Exercises, not Labs; neither a GPU nor CUDA execution is required. All four evidence arrays remain empty. The prerequisite chain is `L13 -> L13-EXERCISES -> L13-SOLUTIONS`.

## Submission requirements

Submit descriptor tables, arithmetic, support checks, and completion dependencies before opening the [separate solutions](/en/libraries/cusparse-descriptors-spmv-spmm/solutions/). Use the exact 12.9.2 archive as the baseline and label 11.8.0 and 13.3.1 differences. FP32 values and 32-bit indices each occupy 4 bytes. All matrices and cost numbers below are original worksheet inputs, not EX20 fixtures or measured results. The browser never executes CUDA.

## Exercise 1: Make the descriptor and the equation agree

**Goal:** Describe one sparse matrix for SpMV and SpMM, then derive independent references that catch empty-row, beta, and dense-layout mistakes.

**Constraints:** Use zero-based CSR `A:3 x 4`, `nnz=4`, row offsets `[0,2,2,4]`, column indices `[0,2,1,3]`, and values `[2,-1,3,1]`. For SpMV, use `X=[1,2,2,-5]` and initial `Y0=[1,-2,4]`. For SpMM, use logical rows `B=[[1,4],[2,1],[2,1],[-5,5]]` and initial `C0=[[1,0],[-2,3],[4,-1]]`. Both operations use `alpha=2`, `beta=-1`, FP32 storage/computation/scalars, and no transpose. B and C are separately allocated, tightly packed row-major matrices. The SpMV candidate is `CUSPARSE_SPMV_CSR_ALG2` with `CUSPARSE_POINTER_MODE_HOST`; do not infer a SpMM algorithm from that enum.

**Expected evidence:** Reconstruct A's logical rows. Record sparse dimensions, offset/index types and base, vector lengths, dense shapes, leading dimensions, and caller-owned arrays. List row-major element offsets for B and C, and the minimum leading dimensions for a column-major alternative. Derive `A*X`, `2*A*X-Y0`, `A*B`, and `2*A*B-C0`. State the vector lengths for a separate transposed-A SpMV and the input-restoration rule for repeated trials.

**Acceptance criteria:** Validate every CSR offset and column, including the empty row; reject duplicate coordinates under this teaching policy rather than assuming automatic coalescing. Descriptor creation does not allocate, upload, convert, or prove valid contents. Host pointer mode concerns alpha/beta, not matrix/vector storage. Leading dimensions are in elements. For a future numerical check, require finite outputs and references and `abs(actual-reference) <= 1e-6+1e-5*abs(reference)` for every logical element, including zero references. Distinguish this tolerance test from the documented non-transposed CSR ALG2 determinism guarantee; neither constitutes an observed GPU result.

<details><summary>Hint 1: Follow each half-open row interval</summary>Row i uses entries from rowOffsets[i] through rowOffsets[i+1]-1. An equal pair of offsets contributes no product, but beta still multiplies the old output. Apply that reasoning to each column of B separately.</details>

<details><summary>Hint 2: Separate logical coordinates from storage</summary>Row-major address offsets are row*ld+column; column-major offsets are column*ld+row. B's first column is X, so it offers a cross-check on the products, but C0 has its own second column and cannot be replaced by Y0.</details>

## Exercise 2: Choose a format with both storage and reuse in view

**Goal:** Compare COO, CSR, and a block representation without treating a smaller allocation or a hypothetical cost model as a measured winner.

**Constraints:** A new `1024 x 1024` FP32 matrix has 4096 unique nonzeros. In the regular case there is exactly one fully occupied `4 x 4` block per block row, hence 256 stored blocks and no internal zero padding. All indices and offsets use 32 bits. Count only representation arrays, excluding vectors, workspace, allocation overhead, and library resources. Compare with an irregular matrix of the same shape and nnz whose block occupancy and row-length distribution are unspecified. Separately, a hypothetical supported prepared path costs 200 microseconds once for conversion plus preprocessing and 30 microseconds per execution; a direct path costs 40 microseconds per execution. Both solve the same problem under identical numerical and timing boundaries. These are supplied model inputs, not cuSPARSE timings or a BSR benchmark.

**Expected evidence:** Derive byte totals for regular COO, CSR, and `4 x 4` BSR, including the correct row-offset count. Explain what cannot be inferred for the irregular case. Solve the strict break-even inequality for positive integer reuse count R, state what happens at equality, and repeat the accounting when every execution changes the sparsity pattern and incurs preparation again. Recommend baseline format candidates and list the support checks still needed for BSR, CSC, SELL, Blocked-ELL, and a separate cuSPARSELt proposal.

**Acceptance criteria:** Distinguish BSR block-column indices from scalar CSR column indices and include the terminal offset. Fewer stored bytes are not physical traffic or speedup evidence. Do not backport Generic BSR SpMV to 12.9.2 or assume that `cusparseCreateCsc` authorizes arbitrary CSC SpMM. Conversion must preserve the mathematical matrix. Neither regular blocks nor a CC 7.5 GPU alone establishes cuSPARSELt eligibility. Label all break-even conclusions as conditional on the supplied costs and the preparation-reuse contract.

<details><summary>Hint 1: Count each kind of index separately</summary>COO has two indices per stored scalar. CSR has one column index per scalar plus rows+1 offsets. BSR has one block-column index per stored dense block plus blockRows+1 offsets; each block still stores all sixteen values.</details>

<details><summary>Hint 2: Write total cost before dividing</summary>Compare one setup payment plus R prepared executions with R direct executions. Equality is not a strict improvement. If indices change each round, move the setup payment inside the repetition before deciding whether reuse can repay it.</details>

## Exercise 3: Repair a two-worker preprocessing proposal

**Goal:** Establish which state is reusable, which workspace is active, and what must finish before reconfiguration or cleanup.

**Constraints:** On 12.9.2, two workers perform compatible FP32, non-transposed CSR ALG2 SpMV with the same immutable indices but separate X/Y arrays and streams. Each worker's stipulated external-buffer requirement is 4096 bytes; the budget for external buffers alone is 6144 bytes. These are hypothetical query results. Preprocessing P0 and then P1 on a single matA has completed sequentially. A proposal calls both buffers active, launches both workers using P1, and frees storage after successful host submission. It also changes a matrix value pointer or a column index between trials without waiting. Compare independent concurrent workers with an explicitly serialized design; no graph is executed.

**Expected evidence:** Identify the active buffer and the status of an otherwise valid P0. Compute concurrent and serialized workspace capacity. Draw initialization, execution, result-copy, completion, reuse, and cleanup dependencies; include failure after partial submission. Classify value/scalar/vector changes versus index/algorithm changes. Make a version table for SpMV and SpMM preprocessing availability and acceleration scope, plus 13.3.1's graph-capture boundary. Audit three claims: mixed-precision SpMV/SpMM is cleared on 12.9; SpMM CSR ALG3 was deterministic throughout 13.0; the 13.3 Update 1 CSC/transposed-CSR fix verifies this non-transposed CSR workload. List records needed for a future run without filling in observations.

**Acceptance criteria:** One matA cannot retain two active preprocessing buffers. A valid inactive SpMV buffer can serve an unaccelerated call, but no buffer may be freed or shared across overlapping uses merely because submission returned. Preserve active contents as well as allocation lifetime. Concurrent independent prepared states need separate descriptors and buffers, and safely managed handle state. A serialized scratch allocation does not automatically preserve two independent prepared states. Check every query, allocation, submission, completion, and cleanup status; a failed completion cannot become a correctness pass. Keep version identities, documented guarantees, and future measurements separate.

<details><summary>Hint 1: Capacity and cached state are different questions</summary>Sum exclusive workspaces for overlapping workers and take the maximum for ordered reuse. Then ask which descriptor each prepared state belongs to. Enough bytes alone do not preserve a buffer's contents or turn the first buffer active again.</details>

<details><summary>Hint 2: Draw the last use, not the last host return</summary>A value-pointer setter does not upload data or wait for earlier readers. Mark completion before rebinding or releasing old storage. SpMV preprocessing first appears in CUDA 12.4; SpMM has an earlier history and different beneficial algorithm numbers.</details>

## Next

Compare the [solutions](/en/libraries/cusparse-descriptors-spmv-spmm/solutions/), then revisit [PB-R4-015](/en/practice/#pb-r4-015), [PB-R4-016](/en/practice/#pb-r4-016), and the canonical Runnable Example [EX20](/en/examples/cusparse-spmv/). Sources: [SRC-CUDA-075](/en/sources-and-versions/#src-cuda-075) and [SRC-CUDA-076](/en/sources-and-versions/#src-cuda-076), checked **2026-09-09**. These original paper Exercises neither add executable SpMM/preprocessing nor upgrade EX20's independent evidence; its runtime remains Pending Hardware Verification.
