---
title: 'L06 Solutions: Layout, Types, and Completion Boundaries'
description: Review transpose tables, swapped row-major operands, and asynchronous ownership, including valid alternatives and common errors without a second CUDA implementation.
pairId: l06-solutions
counterpart: /libraries/cublas-gemm/solutions/
factCheckDate: '2026-09-06'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L06-SOLUTIONS
prerequisites: [L06-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l06-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/cublas-gemm/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L06-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L06-EXERCISES }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/cublas-gemm/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

Complete the [L06 Exercises](/en/libraries/cublas-gemm/exercises/) first. Values below are shape/address derivations, not GPU output. They use the 12.9.2 contract in [L06](/en/libraries/cublas-gemm/) and [SRC-CUDA-067](/en/sources-and-versions/#src-cuda-067). There are no code imports, builds, or runs; all four evidence arrays are empty.

## Solution 1: Shapes before addresses

Every combination retains `m=4,n=3,k=5` and requires `ldc >= 4`.

| Flags | A storage | B storage | Minimum `lda` | Minimum `ldb` |
| --- | --- | --- | --- | --- |
| N,N | `4 x 5` | `5 x 3` | 4 | 5 |
| N,T | `4 x 5` | `3 x 5` | 4 | 3 |
| N,C | `4 x 5` | `3 x 5` | 4 | 3 |
| T,N | `5 x 4` | `5 x 3` | 5 | 5 |
| T,T | `5 x 4` | `3 x 5` | 5 | 3 |
| T,C | `5 x 4` | `3 x 5` | 5 | 3 |
| C,N | `5 x 4` | `5 x 3` | 5 | 5 |
| C,T | `5 x 4` | `3 x 5` | 5 | 3 |
| C,C | `5 x 4` | `3 x 5` | 5 | 3 |

The detailed T,C strides `7,5,6` are legal. Complete storage covers `7*4=28`, `5*5=25`, and `6*3=18` elements. Last logical offsets are `4+3*7=25`, `2+4*5=22`, and `3+2*6=15`. Allocation count is not necessarily the last logical offset plus one because physical columns can include trailing padding.

C on real B is equivalent to T; complex B additionally conjugates each accessed value. One-based position 3 maps to `(3-1)*2=4`, not element index 3. GEMM always interprets the valid starting pointer with the zero-based address formula. Moving a submatrix's start does not change the parent matrix's physical column spacing.

## Solution 2: Transpose the problem, not the bytes

Ordinary transposition gives `C_out^T = 1.25*B^T*A^T - 0.5*C_in^T`. Interpret B's row-major bytes as column-major `5 x 2`, A as column-major `2 x 3`, and C as column-major `5 x 3`. The call plan uses B first and A second, `m'=5,n'=3,k'=2`, both flags N, and `lda'=8,ldb'=4,ldc'=7`.

For example, original coordinate `(i,j)=(1,4)` has double-precision reference `1.25*(double(A[4])*double(B[4]) + double(A[5])*double(B[12])) - 0.5*double(C_in[11])`. These indices come from the original row strides 4, 8, and 7, not by reversing the swapped call. The reference corresponds to result offset 11, also column-major `C^T` offset `4+1*7`.

Compute every logical output independently, check finite inputs/outputs, then apply `abs(got-ref) <= 1e-4 + 2e-5*abs(ref)` to the bounded FP32 data adopted for this exercise. Preserve original C and use identical inputs for each validation. Padding can provide write-overrun sentinels but participates in neither multiplication nor error statistics. Future larger data ranges need a fresh numerical justification; relaxing the threshold does not repair layout.

This generalization remains a paper task. EX18's fixed contract gains no runtime coverage for padding, nonzero beta, or every transpose combination from this answer.

## Solution 3: Manage state separately from data

Set S on h before W, avoiding `cublasSetStream` resetting user workspace. The host-scalar solution explicitly selects host pointer mode with `float` objects; input scalar objects may expire after GEMM returns. The device solution allocates device `float` objects, orders value production before GEMM, and keeps them alive and unchanged through GEMM completion. The supported mixed-precision combination with FP16 A/B and FP32 C/compute still uses `float` scalars.

In S, submit input copies, necessary C initialization, and GEMM, then record event E. T waits on E before consuming C. Inputs, W, and device scalars remain alive through their last use; C survives T's consumer, and host reading additionally follows the relevant result-copy completion. A conservative solution waits for the final consumer and result copy before releasing everything. Host buffers used for asynchronous copying also survive copy completion.

Check every library call's `cublasStatus_t` and CUDA status for copies, events, synchronization, and cleanup. A setup failure prevents submission; an execution or synchronization failure prevents stale-result reads. Handle creation, configuration, allocation, and destruction belong to separate host or end-to-end costs, not an interval advertised as GEMM-only. The 12.9 guide documents implicit synchronization during handle destruction, but that grants neither early-result access nor a clear timing methodology.

## Valid alternatives

- If Exercise 2's no-data-transposition constraint is removed, explicitly packing column-major inputs is valid, but adds conversion correctness, memory, and timing obligations; it is not a zero-copy solution.
- Move Exercise 3's consumer into S to rely on stream order, or retain the event edge if T remains. Device-wide synchronization can establish a correct but broader completion boundary; it cannot repair scalar types or reset workspace configuration.
- When user-owned workspace is unnecessary, select the cuBLAS default pool. W's settings and capacity then no longer describe execution conditions. Restate the resource contract after changing it.

## Common errors

- Letting `lda` change automatically with logical transposition or expressing it in bytes.
- Swapping row-major A/B without swapping `m/n`, or additionally setting both flags to T.
- Generating the reference and library arguments with the same incorrect layout mapping, producing false agreement.
- Testing only square matrices, zero inputs, or `beta=0`, then claiming arbitrary layout and accumulation correctness.
- Reading device pointer mode as "matrices are on the device" and overlooking its scalar-location requirement.
- Treating API return, handle destruction, or web checks as completed numerical validation.

Reviewed **2026-09-06**. All answers are static reasoning and grant no Evidence Status.
