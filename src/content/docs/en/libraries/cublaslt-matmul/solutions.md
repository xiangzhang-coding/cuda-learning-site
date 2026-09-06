---
title: 'L07 Solutions: Feasible Configurations Are Not Measured Winners'
description: Review descriptor fields, candidate filtering, bias remapping, and cache invalidation with valid alternatives, common errors, and no runtime evidence.
pairId: l07-solutions
counterpart: /libraries/cublaslt-matmul/solutions/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L07-SOLUTIONS
prerequisites: [L07-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l07-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cublaslt-matmul/solutions/' }
  - tag: meta
    attrs: { name: 'cuda:fact-check-date', content: '2026-09-06' }
  - tag: meta
    attrs: { name: 'cuda:license', content: CC-BY-4.0 }
  - tag: meta
    attrs: { name: 'cuda:provenance', content: original }
  - tag: meta
    attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' }
  - tag: meta
    attrs: { name: 'cuda:resource-kind', content: solution-set }
  - tag: meta
    attrs: { name: 'cuda:unit-id', content: L07-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L07-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cublaslt-matmul/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

Complete the [L07 Exercises](/en/libraries/cublaslt-matmul/exercises/) first. Answers use the 12.9.2 contract in [L07](/en/libraries/cublaslt-matmul/) and [SRC-CUDA-068](/en/sources-and-versions/#src-cuda-068). The candidate scenario is hypothetical, not retained heuristic output. There are no code imports, builds, GPU runs, or measured winners; all four evidence arrays are empty.

## Solution 1: Assign fields by responsibility

Create the handle with `cublasLtCreate`. Create the operation with `cublasLtMatmulDescCreate`, selecting FP32 pedantic compute and `CUDA_R_32F` scale type. Operation attributes select T for A, N for B/C, host pointer mode, and default epilogue. Both scaling objects are host `float`, not `double`.

The four FP32 layouts record `A:(2,3,4)`, `B:(2,5,7)`, `C:(3,5,6)`, and `D:(3,5,8)`, with tuples denoting stored rows, stored columns, and leading dimension. Each explicitly selects ROW. `op(A)[1,0] = A[0,1]`, so the stored offset is `0*4+1=1`, not 4; no data movement is needed.

C/D are disjoint with the same type, shape, batch size, and order; different leading dimensions are permitted. In-place use must reuse both the data pointer and layout-descriptor object, not merely equal descriptor fields. C's `TRANSC` stays N. A mathematical transpose of C requires reformulating the problem rather than arbitrarily setting T under this contract.

Create preferences separately, using budgets and alignments justified by actual resources. Set attributes using their documented types/byte sizes and check statuses. Pass the stream to `cublasLtMatmul`; initialization precedes the operation, while result reading and release follow completion. Conservatively retain descriptors until completion, then release them with `cublasLtMatmulPreferenceDestroy`, each `cublasLtMatrixLayoutDestroy`, `cublasLtMatmulDescDestroy`, and `cublasLtDestroy`. Matrices and workspace are released separately. Destroying a layout does not free its matrix.

## Solution 2: Repair query inputs before choosing

Only entries 0, 1, and 2 were hypothetically written; entry 3 is unreadable. Entry 0 failed, so use its state to reject it without consulting algorithm or workspace fields. Entry 1's 2 MiB fits the 4 MiB search budget but exceeds the actual 1 MiB allocation. It cannot run without a larger legal allocation.

Entry 2 fits capacity at 512 KiB, but the query's 256-byte claims for all four matrices were false. Do not directly declare it executable. Set all four minimum-alignment attributes to the guaranteed 64 bytes, set the budget to the currently available 1 MiB, and query again. An application willing to allocate more can select a larger budget after establishing allocation and alignment, not merely by increasing a preference number.

Recheck query status, count, per-entry state, workspace, and algorithm restrictions. Use `AlgoCheck` for reused or modified configurations. It checks descriptor/device compatibility; actual addresses, asynchronous errors, and numerical correctness still need independent validation. Only numerical acceptance permits comparison with consistent warmup, input restoration, repetitions, and device-event intervals. Do not prefill any new candidate IDs or timings in this static task.

For zero candidates, record the configuration and choose a semantically equivalent alternative. Ordinary default-epilogue FP32 can return to L06's traditional library comparison. Falling back from an epilogue extension to plain GEMM requires correct postprocessing. Retain not-supported reasons rather than treating `algo=nullptr` as a guaranteed fix. Stop after device execution or synchronization errors, avoiding stale output and continued selection in a failed context. Release resources after their last use completes or through controlled error cleanup.

## Solution 3: Which dimension receives five biases?

Reject original row-major D with `RELU_BIAS` under 12.9.2. Redefine `D=Y^T`, satisfying `D[j,i] = max((B^T*A^T)[j,i] + bias[j], 0)` elementwise. Both original inputs are untransposed row-major matrices, so their bytes directly represent transposed column-major layouts.

| Lt role | Original pointer | Column-major stored shape | Leading dimension | Operation |
| --- | --- | --- | --- | --- |
| First multiplication input | B | `5 x 2` | 8 | N |
| Second multiplication input | A | `2 x 3` | 4 | N |
| C/D | Y | `5 x 3` | 7 | N for C |

Use the same Y pointer and the same layout descriptor for C/D, explicitly set `beta=0`, and provide valid output storage. Initializing Y can simplify the first validation. Set `alpha=1`. D has five rows, so five packed biases broadcast across its columns and match original Y's five feature columns. Output byte interpretation follows element offset `j+i*7`, identical to original row-major `i*7+j`.

Set the operation to `RELU_BIAS`. The bias attribute setter receives the address of the host pointer variable holding device `bias`, with pointer-sized attribute storage. Keep the device bias vector alive through completion. The CPU reference independently multiplies through original A/B row strides, adds `bias[j]`, and takes the maximum. Choose distinct biases, nonsquare shapes, bounded FP32 data, and numerical acceptance criteria. The description meets the reviewed orientation/layout rules but guarantees no candidate; resource, query, execution, and numerical checks remain.

The reuse key includes device/resource configuration, component version, every storage layout, transpose, type, scale/pointer mode, epilogue/bias attributes, C/D aliasing, workspace/alignment guarantees, and numerical/search policies. Changing only same-contract data contents can reuse configuration after proving current pointer extents, alignment, and lifetimes. Changed leading dimension, smaller workspace, weaker alignment, or a component upgrade invalidates the selection before rechecking/requerying. Do not blindly carry algorithm objects across versions. The internal heuristics cache saves query work; it remembers neither application numerical acceptance nor these invalidation conditions.

## Valid alternatives

- Keep row-major Y, perform legal default-epilogue GEMM, then separately add `bias[j]` and ReLU. Include the added postprocessing in end-to-end cost and correctness checks rather than calling it already fused.
- Use a genuinely column-major output intermediate followed by conversion, proving bias orientation as well. Original Y row bias and column bias are different tasks.
- For a fixed workload with insufficient measured benefit, retain correct traditional GEMM plus postprocessing instead of implementing an application algorithm cache. Simplicity can be appropriate, but this task supplies no timing data for a performance decision.

## Common errors

- Filling A's layout with the shape of `op(A)` and then setting T again.
- Treating a 4 MiB preference as allocated device memory or assuming allocator-base alignment automatically holds for every subview.
- Collapsing query success, per-entry success, `AlgoCheck`, completion, and numerical acceptance into one status.
- Blindly using result zero or treating heuristic order, `wavesCount`, or algorithm IDs as measured rankings.
- Attaching a restricted epilogue directly to row-major D, or flipping only D's order enum without rederiving inputs, output, and bias dimensions.
- Using only `m,n,k` as a cache key or assuming the internal cache makes cross-version algorithm restoration safe.
- Describing fixed, conditional algorithm-66 issues as affecting all versions, or replacing independent validation with "latest."

Reviewed **2026-09-06**. Configuration derivations and hypothetical scenarios supply no runtime or performance evidence.
