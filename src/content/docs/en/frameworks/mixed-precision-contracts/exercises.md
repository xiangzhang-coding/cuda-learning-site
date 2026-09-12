---
title: 'P06 Exercises: References, Dispatch Exceptions, and Scale Lifetime'
description: Derive two numerical error budgets, repair an autocast review, and audit a two-microbatch optimizer boundary on paper.
pairId: p06-exercises
counterpart: /frameworks/mixed-precision-contracts/exercises/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: P06-EXERCISES
prerequisites: [P06]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p06-exercises } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/mixed-precision-contracts/exercises/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: exercise-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P06 } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/mixed-precision-contracts/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [P06](/en/frameworks/mixed-precision-contracts/), the sole direct prerequisite `[P06]`. These original static Exercises need no GPU, installation, or implementation. All four evidence arrays remain empty. **GPU-dependent behavior remains Pending Hardware Verification.**

## Submission requirements

Use PyTorch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64 as the source contract, not a locally verified environment. Submit calculations, decision tables, and future acceptance requirements. Do not supply invented dtype logs, traces, timings, or code. Attempt all three before opening the [solutions](/en/frameworks/mixed-precision-contracts/solutions/).

## Exercise 1: Separate quantization from later error

**Goal:** Construct two independent references and show which information each can test.

**Constraints:** Use P06's two-term dot products: S has `a=[1+2^-12,1]`, `b=[1,-1/2]`; R has `a=[1+2^-10,1]`, `b=[1+2^-10,-1]`. Round inputs and final outputs to FP16 using nearest, ties-to-even. In the stipulated model only, multiplication and accumulation between those casts are exact. Also examine a second R path that rounds the product before subtracting 1. Neither path is a measured GPU implementation.

**Expected evidence:** Original and stored operands; full-original and stored-input references; model outputs; rowwise signed differences and absolute errors; maximum absolute errors for the two-row vector; Euclidean relative error against the full-original vector; and acceptance decisions for `atol=2^-21`, first with `rtol=2^-11`, then with `rtol=0`.

**Acceptance criteria:** Compute the full-original reference before narrowing, independently of the candidate. The stored-input reference must not be mislabeled as full-original. Explain why two internal paths can yield R's same output and why changing GradScaler cannot repair S. State a zero-reference convention and reject nonfinite values. A tolerance pass must not imply bitwise reproducibility, native acceleration, or an accumulator width.

<details><summary>Hint 1: Put every rounding point on paper</summary>Near 1 the FP16 spacing is two to the power minus ten. Expand the product in R before subtracting 1, then compare its distance to adjacent representable outputs.</details>

<details><summary>Hint 2: Keep the reference denominator fixed</summary>For each reference, subtract that reference from the model output. The full-original vector is a common scalar multiple of the model vector, which simplifies its norm-relative error.</details>

## Exercise 2: Repair an autocast review

**Goal:** Replace a dtype-only approval with operation-specific dispatch, precision, and capability checks.

**Constraints:** A proposal starts with FP32 parameters and inputs, enables CUDA FP16 autocast only in the caller thread, and assigns these conclusions. Assume valid shapes and non-overlapping outputs; do not use argument errors to evade the precision question.

| Proposed case | Proposed conclusion to audit |
| --- | --- |
| Out-of-place `mm` followed by `mse_loss` | Both must produce FP16 |
| In-place `addmm_` and `addmm` with `out=` | Both gain the same autocast policy as out-of-place calls |
| `sum` with `dtype=torch.float64` | The surrounding context overrides the dtype |
| Unlisted `mean`, `std` | All reductions are automatically FP32 |
| Worker thread; later disabled-autocast region | Caller state is inherited; existing half tensors widen automatically |
| `torch.cuda.is_bf16_supported` with `including_emulation=True` | A true result proves native BF16 Tensor Core speed |
| FP32 output; new `fp32_precision` plus old `allow_tf32` | The output proves IEEE multiplication and mixing controls is safe |

**Expected evidence:** Correct every row, name the public autocast and scaler namespaces and their differing device argument names, and design a separate stricter FP32 branch plus a capability-gated BF16 branch. Record input/multiply/accumulation/output/scaling as distinct fields, including unknown internals.

**Acceptance criteria:** Distinguish eligibility from native promotion and legality; neither a context nor output buffer determines all internal precision. Enable a needed context in each worker thread and explicitly widen operands for a sensitive region. Use one precision-control family, record reduction/full-accumulation flags, and do not equate capability or output dtype with observed backend behavior. Finish with finite/error and parameter-update criteria, not a speed prediction.

<details><summary>Hint 1: Eligibility comes before dtype prediction</summary>Ask whether this exact overload participates in autocast. An explicit dtype, an output buffer, and in-place mutation are three different reasons to reject the blanket claim.</details>

<details><summary>Hint 2: A capability question is narrower than a benchmark</summary>The BF16 query may allow emulation. Even a native-capability result says nothing about this operation's selected algorithm, numerical acceptance, or elapsed time.</details>

## Exercise 3: Keep one scale across two microbatches

**Goal:** Audit gradient accumulation through a finite update and a separately controlled nonfinite case.

**Constraints:** This is scalar paper arithmetic. Begin with FP32 parameter `p=2`, ordinary SGD with `lr=1/4`, no momentum, weight decay, or clipping. Two equal-sized microbatch loss contributions have already been normalized for the effective-batch average; their unscaled gradient contributions are `g1=3/4` and `g2=-1/4`. The finite branch has constant scale `s=8`. An invalid proposal instead scales the first contribution by 8, changes scale to 4 before the second, and divides the accumulated total by 4. Separately reset all state to `p=2`, stipulate `init_scale=0.5`, default `backoff_factor=0.5`, and a nonfinite gradient detected before unscale completes. No runtime behavior is supplied.

**Expected evidence:** A ledger for scaled contributions, accumulated gradient, unscaled gradient, predicted parameter, and scale-lifetime boundary. Compute the invalid proposal's gradient and parameter. For the nonfinite case, predict update-skipping and next scale. Specify future finite-loss, gradient, parameter-delta, and scale checks, with new identical state per branch and inspection excluded from timing.

**Acceptance criteria:** Unscale only after both contributions and only once per optimizer per step. Do not divide the already-normalized contributions by two again. The nonfinite case tests overflow/backoff below 1, not underflow detection or a naturally observed model failure. A finite loss alone is insufficient; require a nonzero representable finite update in the control case and unchanged parameters in the skipped case. No unchecked mutation may invalidate the check after unscale.

<details><summary>Hint 1: The accumulated buffer has units</summary>With a constant scale, both contributions share the same units and one division removes the factor. If the factors differ, dividing the sum by the later factor cannot undo the first contribution's weighting.</details>

<details><summary>Hint 2: Separate step from update</summary>Skipping the optimizer preserves its parameters for that step. The scaler still adjusts its scale at the effective-batch boundary; multiplication by the backoff factor has no floor of one.</details>

## Next

Compare the [separate solutions](/en/frameworks/mixed-precision-contracts/solutions/) and [PB-R5-006](/en/practice/#pb-r5-006). Source basis: [P06](/en/frameworks/mixed-precision-contracts/), [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080), and [SRC-CUDA-082](/en/sources-and-versions/#src-cuda-082), reviewed **2026-09-12**. Original paper evidence is not a GPU observation.
