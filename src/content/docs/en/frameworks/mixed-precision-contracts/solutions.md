---
title: 'P06 Solutions: Locate Error Before Approving Precision'
description: Work through original and stored-input references, autocast exceptions, and finite versus skipped optimizer updates with explicit evidence limits.
pairId: p06-solutions
counterpart: /frameworks/mixed-precision-contracts/solutions/
factCheckDate: '2026-09-12'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: P06-SOLUTIONS
prerequisites: [P06-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
head:
  - { tag: meta, attrs: { name: 'cuda:pair-id', content: p06-solutions } }
  - { tag: meta, attrs: { name: 'cuda:counterpart', content: '/frameworks/mixed-precision-contracts/solutions/' } }
  - { tag: meta, attrs: { name: 'cuda:fact-check-date', content: '2026-09-12' } }
  - { tag: meta, attrs: { name: 'cuda:license', content: CC-BY-4.0 } }
  - { tag: meta, attrs: { name: 'cuda:provenance', content: original } }
  - { tag: meta, attrs: { name: 'cuda:structure', content: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' } }
  - { tag: meta, attrs: { name: 'cuda:resource-kind', content: solution-set } }
  - { tag: meta, attrs: { name: 'cuda:unit-id', content: P06-SOLUTIONS } }
  - { tag: meta, attrs: { name: 'cuda:prerequisites', content: P06-EXERCISES } }
  - { tag: meta, attrs: { name: 'cuda:hardware-gate', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-compilation', content: none } }
  - { tag: meta, attrs: { name: 'cuda:evidence-runtime', content: none } }
  - { tag: meta, attrs: { name: 'cuda:expected-observations', content: none } }
  - { tag: meta, attrs: { name: 'cuda:recorded-observations', content: none } }
---

<a class="locale-pair" data-locale-counterpart href="/frameworks/mixed-precision-contracts/solutions/" lang="zh-CN">阅读中文对应页</a>

## Review boundary

Attempt [P06 Exercises](/en/frameworks/mixed-precision-contracts/exercises/) first; the direct prerequisite is `[P06-EXERCISES]`. The source contract is PyTorch **2.11.0+cu128**, commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython **3.12.14**, native Linux x86_64. These are original derivations, not execution results. All evidence arrays are empty; **GPU-dependent behavior remains Pending Hardware Verification**.

## Solution 1: Two references, two error locations

S's first operand rounds from `1+2^-12` to 1. Its full-original dot product is `1+2^-12-1/2 = 2049/4096 = 0.500244140625`. Its independently computed stored-input reference is `1/2`; the modeled final cast leaves that value unchanged. This is an input-representation error, not evidence of a bad reduction.

R's operands are exactly representable in FP16. Expanding `(1+2^-10)*(1+2^-10)-1` gives `2^-9+2^-20 = 2049/1048576 = 0.00195407867431640625`. Around that result, the FP16 spacing is `2^-19`. The result is halfway between `1/512` and its next larger neighbor, so ties-to-even chooses `1/512 = 0.001953125`.

| Row | Full-original reference | Stored-input reference | Model output | Output minus full-original | Output minus stored-input |
| --- | --- | --- | --- | --- | --- |
| S | `2049/4096` | `1/2` | `1/2` | `-2^-12` | `0` |
| R | `2049/1048576` | `2049/1048576` | `1/512` | `-2^-20` | `-2^-20` |

Absolute values give maximum errors **`2^-12`** and **`2^-20`** against the respective reference vectors. The full-original vector equals the model vector multiplied by `2049/2048`; the error vector is its negative divided by 2049. Thus `norm(y-r)/norm(r) = 1/2049`, approximately 0.000488043. For a zero reference norm, report 0 only if the error norm is also zero, otherwise infinity; separately reject nonfinite inputs to the comparison.

The mixed tolerance `atol=2^-21`, `rtol=2^-11` admits both rows against both references. Against each full-original component, its relative allowance alone is slightly larger than that row's error. With `rtol=0`, S's `2^-12` and R's `2^-20` both exceed `2^-21`; both full-original checks fail. Against stored inputs, S's zero error passes while R still fails. These policy decisions do not change the arithmetic facts.

If the product in R is rounded early to FP16, it becomes `1+2^-9`; subtracting 1 also yields `1/512`. This fixture therefore cannot identify accumulation precision from its final value. Scaling backward cannot restore S's discarded input fraction. A future reference must be built from preserved originals before narrowing, not by widening the candidate inputs and relabeling them.

## Solution 2: Replace blanket dtype assertions

| Case | Repaired contract |
| --- | --- |
| `mm`, `mse_loss` | Eligible out-of-place matrix multiplication uses the lower-precision policy; eligible loss uses FP32 |
| `addmm_`, `addmm` with `out=` | Bypass autocast; obey native input/output rules rather than the out-of-place autocast expectation |
| `sum` with `dtype=torch.float64` | Explicit dtype wins |
| `mean`, `std` | Unlisted reductions do not gain a blanket FP32 autocast policy |
| Worker thread; disabled region | Establish the needed autocast context in the worker; explicitly widen already-half operands where needed |
| `torch.cuda.is_bf16_supported`, `including_emulation=False` | Native-capability gate only; operation/backend correctness and performance still need observation |
| `fp32_precision`, `allow_tf32` | Use the new family without mixing old controls; output storage does not prove multiplication precision |

The public namespaces are `torch.amp.autocast` with `device_type`, and `torch.amp.GradScaler` with `device`. Keep the FP32 model state for the basic AMP branch and place backward outside forward/loss autocast. A new worker does not inherit an arbitrary caller's thread-local autocast state. Disabling autocast does not convert tensors already created in a lower dtype.

For the stricter FP32 comparison, select the new `"ieee"` policy and retain global/backend/operation settings, including matmul and cuDNN convolution separately. Record reduced-precision FP16/BF16 reductions, full FP16 accumulation, and any relevant split-K policy. A BF16 branch requires its own native-capability and operation check, starts from the same original state, and has its own rounding/acceptance policy. It has no automatic speed or convergence verdict.

Approval needs finite values, errors against both independent references, a declared tolerance, and the branch-specific gradient/update checks. Actual multiply/accumulator fields stay unknown unless supported by appropriate backend and runtime evidence; a dtype table, kernel name, or close answer does not fill them.

## Solution 3: Preserve units until the update boundary

With constant scale 8, the two already-normalized contributions become `8*(3/4)=6` and `8*(-1/4)=-2`. Their accumulated value is 4. Unscaling once gives `4/8=1/2`, so ordinary SGD predicts `p_new=2-(1/4)*(1/2)=15/8=1.875`. No second averaging factor is needed.

| Paper branch | Scaled total | Unscaled gradient | Predicted parameter | Scale conclusion |
| --- | --- | --- | --- | --- |
| Constant scale | `6-2=4` | `4/8=1/2` | `15/8=1.875` | `8` held throughout both contributions |
| Invalid mixed scales | `6-1=5` | `5/4` | `27/16=1.6875` | Changing `8` to `4` corrupts the weighting |
| Separate nonfinite injection | Not a finite sum | Nonfinite detected before update | `2` unchanged | `0.5*0.5=0.25` after backoff |

The invalid proposal doubles the first contribution's effective weight. The correct lifecycle keeps accumulated gradients scaled, unscales once after the final contribution, checks/optionally clips, then steps and updates the scaler. Calling unscale early mixes units; calling it twice is invalid. Changing gradients after a recorded finite check can invalidate that check, so the test injection must precede it.

The nonfinite branch resets the parameter and optimizer/scaler state. It must leave the ordinary optimizer's parameter unchanged and predict next scale 0.25. This deliberately small initial scale demonstrates the lack of a floor of 1. It does not demonstrate underflow detection, an actual model failure, or successful recovery from forward overflow.

For future runtime acceptance, retain finite loss, finite unscaled gradients, and the expected nonzero representable parameter change in the control branch; retain detected nonfinite gradients, unchanged parameters, and backoff in the injected branch. A `step` return value is insufficient because ordinary optimizers may return no value even when they update. Keep state reads and parameter comparisons out of timing. Without the exact Environment Manifest and a qualifying external run, every observed-result field remains unrecorded.

## Valid alternatives and tradeoffs

An exact rational reference is appropriate for this paper fixture; independent host FP64 also represents these particular binary fractions and products exactly. For larger reductions, FP64 is a higher-precision reference, not automatically exact real arithmetic. A deliberately IEEE FP32 branch can be a baseline but must not replace the original-value reference with an already-quantized one.

If no clipping or intermediate inspection is required, letting `step` perform unscale/check at the effective-batch boundary is valid. Explicit unscale is useful for inspecting or clipping in original gradient units. Neither choice permits a scale change mid-batch. Rejecting the selected BF16 branch when native capability is unavailable is a valid outcome; silently substituting emulation does not satisfy a native-path claim.

## Common errors

- Treating a widened FP16 operand as an untouched full-original reference hides quantization.
- Calling the same final R value proof of FP32 accumulation ignores the early-rounding counterexample.
- Assuming all reductions are FP32 confuses a registry with an operation category.
- Combining old and new TF32 controls leaves an unsupported precision configuration.
- Averaging the already-normalized microbatch contributions again changes the intended objective.
- Clamping scale at 1 changes the scaler's documented behavior; a below-one value is not an underflow detector.
- Treating a finite loss, a dtype, or a source review as GPU evidence skips gradient and parameter acceptance.

Return to [P06](/en/frameworks/mixed-precision-contracts/) and [PB-R5-006](/en/practice/#pb-r5-006). Sources: [SRC-CUDA-080](/en/sources-and-versions/#src-cuda-080) and [SRC-CUDA-082](/en/sources-and-versions/#src-cuda-082), reviewed **2026-09-12**. The worksheet proves no actual timing, accelerator path, or training result.
