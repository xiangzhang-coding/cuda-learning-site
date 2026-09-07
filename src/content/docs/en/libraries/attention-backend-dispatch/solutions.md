---
title: 'L11 Solutions: Preserve the Contract Across Candidate Failures'
description: Resolve BHSD byte arithmetic, bounded rejection cases, source-tag routing distinctions, and unsupported evidence claims without a cuDNN execution result.
pairId: l11-solutions
counterpart: /libraries/attention-backend-dispatch/solutions/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [review, solution-1, solution-2, solution-3, valid-alternatives, common-errors]
resourceKind: solution-set
unitId: L11-SOLUTIONS
prerequisites: [L11-EXERCISES]
hardwareGate: none
evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] }
sources:
  - title: 'SRC-CUDA-071: cuDNN backend release notes'
    url: 'https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/release-notes.html#cudnn-9-24-0'
    version: 'Backend 9.24.0'
    platform: 'Native Linux policy; versioned support and known issues, not runtime evidence'
    accessDate: '2026-09-07'
  - title: 'SRC-CUDA-072: cuDNN frontend release and immutable source'
    url: 'https://github.com/NVIDIA/cudnn-frontend/releases/tag/v1.27.0'
    version: 'Frontend 1.27.0; f77fbc3d21be3f24cd0286b9b368105f7c518b8a'
    platform: 'Pinned SDPA descriptors, representation gates, plans, and Python routing; source inspection only'
    accessDate: '2026-09-07'
head:
  - tag: meta
    attrs: { name: 'cuda:pair-id', content: l11-solutions }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/attention-backend-dispatch/solutions/' }
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
    attrs: { name: 'cuda:unit-id', content: L11-SOLUTIONS }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L11-EXERCISES }
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
  - tag: meta
    attrs: { name: 'cuda:source-count', content: '2' }
  - tag: meta
    attrs: { name: 'cuda:source-versions', content: '9.24.0,1.27.0' }
---

<a class="locale-pair" data-locale-counterpart href="/libraries/attention-backend-dispatch/solutions/" lang="zh-CN">阅读中文对应页</a>

## Before review

Complete the [L11 Exercises](/en/libraries/attention-backend-dispatch/exercises/) first. These are original derivations using [L11](/en/libraries/attention-backend-dispatch/), backend **9.24.0**, and frontend **1.27.0** at **`f77fbc3d21be3f24cd0286b9b368105f7c518b8a`**. [SRC-CUDA-071](/en/sources-and-versions/#src-cuda-071) and [SRC-CUDA-072](/en/sources-and-versions/#src-cuda-072) record the **2026-09-07** review and per-file rights. Owner material is linked/paraphrased, not copied or adapted. No installation, compilation, owner-test run, CUDA execution, or timing occurred. All four evidence arrays are empty; no Evidence Status is granted or inherited.

## Solution 1: Correct extent does not prove correct mapping

For `B=1,H=2,S=128,D=128`, all Q/K/V/O shapes are `[1,2,128,128]`. Starting from depth stride one gives `[H*S*D,S*D,D,1] = [32768,16384,128,1]` element strides. The general offset is `b*32768 + h*16384 + s*128 + d`.

| Quantity | Derived result |
| --- | --- |
| Byte strides for genuine BF16 | `[65536,32768,256,2]` |
| Elements per tensor | `1*2*128*128=32768` |
| Capacity per tensor | `32768*2=65536 B` |
| Four separate tensor capacities | `4*65536=262144 B`, excluding workspace and other allocations |
| Last logical offset | `(0,1,127,127)` gives `16384+16256+127=32767` |
| Last element byte range | `65534..65535`, within each tensor's own 65536-byte allocation |
| Scale | `1/sqrt(128)=1/(8*sqrt(2))`, approximately `0.08838834764831845` before FP32 storage rounding |
| Correct `(0,1,0,0)` offset | `16384` elements, or `32768` bytes |
| Proposed `(0,1,0,0)` offset | `128` elements, or `256` bytes |

The proposed `[32768,128,256,1]` strides describe a different packed BSHD layout when viewed with logical BHSD dimensions. Their final coordinate also reaches `128+127*256+127=32767`. Passing the same last-offset extent check therefore does not make the two mappings equal. For unchanged BHSD bytes, restore `[32768,16384,128,1]`; merely claiming that the buffer has been repacked does not move its values.

The frontend K descriptor remains `[B,H,S,D]`; `K^T` describes the score contraction, not an external transpose of this descriptor. With `generate_stats=false`, no Stats output is requested, so no Stats output allocation/binding belongs in the answer. That does not mean the implementation needs no internal row statistics or scratch. FP32 compute/intermediate types do not turn BF16 tensor allocations into four-byte storage. The [pinned forward source](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/samples/cpp/sdpa/fp16_fwd.cpp#L32-L104) supplies the descriptor convention; our values are not copied sample output.

Compare L11's D=64 model: element strides `[16384,8192,64,1]`, 16384 elements and 32768 B per tensor, 131072 B total, last offset 16383, and scale exactly `0.125`. Doubling D doubles these tensor capacities, not an unknown plan workspace. Neither model establishes actual pointer alignment, support/build success, engine selection, or numerical results.

## Solution 2: Reject candidates, not the mathematical target

| Case | Correct classification and action | What remains unknown |
| --- | --- | --- |
| A: SM75 | Reject this SDPA path at its pre-SM80 gate. The backend's general SM75 support applies more broadly than SDPA | Whether a separately chosen reference/application alternative has an eligible environment and implementation; no local run exists |
| B: FP32 plus UNIFIED | Explicit UNIFIED rejects FLOAT Q/K/V/O. COMPOSITE/AUTO may allow FP32, but this is outside L11's accepted FP16/BF16 contract and requires a separate review | Whether a supporting engine and policy-eligible built plan exist; no silent downcast is allowed |
| C: required causal mask | The request is outside the unmasked lesson subset. Reject the proposal that removes the mask; preserve the full request in a separately capable reference, or report unsupported | Support for that exact masked request; neither deleting the mask nor broadening the lesson is a demonstrated solution |
| D: total scratch exceeds cap | The backend-only cap check is insufficient. Reject under this total budget, even though `W_backend <= W_cap` | Whether another eligible candidate fits; no workspace size, allocation, or execution is supplied |
| E: repeatability policy | Filter the candidate carrying `NONDETERMINISTIC`, then check remaining candidates against all policies | Whether any acceptable candidate remains, and whether its actual output would meet independent accuracy criteria |
| F: graph and plan construction | At most, those hypothetical stages would be established if actually recorded. Do not report an executed backend or framework choice | Actual plan used for a completed call, output acceptance, and the complete runtime record |

Cases A and B follow [`sdpa_support_surface.h:347-369,435-481`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/node/sdpa_support_surface.h#L347-L369) and [`test_sdpa_fp32_rejected.py:87-143`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/test/python/test_sdpa_fp32_rejected.py#L87-L143). The owner tests can skip unsupported engines and were not run here. C is first a lesson-scope rejection, not a claim that all causal attention is unsupported. D follows the [final workspace sum](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/graph_interface.h#L1129-L1135). E follows the [backend numerical notes](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/api/cudnn-graph-library.html#cudnnbackendnumericalnote-t), not an assumption that Tensor Core use means nondeterminism.

For D, `W_total = W_backend + W_frontend` must fit the total scratch policy and the supplied workspace allocation. Q/K/V/O and other live allocations are separate, so even a fitting scratch total is not proof all device memory needs fit. A checked size query, successful allocation, correct binding, and lifetime through completion are distinct caller obligations. Do not invent a numerical workspace size from either the descriptor count or VIS18.

An ordinary stable FP32 decomposition remains a semantic/reference alternative for requests it actually implements. Freeze its equation, input provenance, scale, features, output comparison policy, and fixture-specific tolerances before comparing candidates. For a low-precision-input candidate, a reference using those same represented inputs promoted to FP32 isolates a different question from a full-precision-original-input reference. Keep both roles explicit and preserve originals; neither is exact real arithmetic. An alternative that lacks the required mask in C must report unsupported, not silently substitute unmasked attention. None of these paper alternatives is a supplied runnable fallback.

Repeatability and accuracy are independent. Filtering `NONDETERMINISTIC` neither supplies a reference comparison nor guarantees cross-version, cross-plan, or cross-architecture bitwise identity. Conversely, a numerically acceptable result would not by itself establish a repeatability requirement. Candidate failure cannot justify loosening the oracle or tolerances.

## Solution 3: A source contract is not an observed dispatcher

All frontend coordinates below use **1.27.0**, SHA **`f77fbc3d21be3f24cd0286b9b368105f7c518b8a`**; backend issue statements use **9.24.0**, not the preview page or historical release sections.

| Claim | Repaired statement and source coordinate |
| --- | --- |
| Algorithm and visual | A11's FlashAttention references support IO-aware algorithm history, not cuDNN eligibility or selection. [VIS18](/en/visuals/attention-memory-traffic/) is an unchanged FP32, four-byte logical-element model. Its tracks are not UNIFIED/COMPOSITE or backend traces; BF16 in a separate candidate does not authorize halving its totals |
| Representation | AUTO checks UNIFIED feature support, then COMPOSITE, in [`graph_properties.h:2298-2312`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/graph_properties.h#L2298-L2312). This selects a frontend representation before backend planning, not a benchmark or universal runtime recovery mechanism |
| Python routing | [`router.py:41-77`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/python/cudnn/engines/router.py#L41-L77) mixes and ranks proposals/entries; index and `engine_id` differ. `_pygraph.py:1117-1139,1346-1403` distinguishes optional strict selection from an unpinned build walk. This is not ordinary C++ backend planning |
| Hardware | The SDPA support surface rejects pre-SM80 despite the broader backend SM75 matrix. The C++ [`sm100_sdpa_prefill_engine.h:36-41`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/include/cudnn_frontend/experimental/sm100_sdpa_prefill_engine.h#L36-L41) requires exactly SM100, not SM103 or every Blackwell GPU. That restriction does not reject every other cuDNN path on SM103 |
| Version and issue scope | `Attention.md:16` still labels its matrix 9.18.1. Use precise source/test gates and current [9.24.0 notes](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/release-notes.html#cudnn-9-24-0): decode plus causal mask plus unequal Q versus K/V heads may mismatch or produce NaNs; backward KV length one is unsupported. These are not all-forward failures. Mixed length-form and Hopper ordered-dQ backward gates at 9.25 remain outside this contract; that release page explicitly says Developer Preview |
| Observation | A graph's name, successful validation, and a built plan do not identify what actually executed. [Determinism guidance](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/developer/misc.html#reproducibility-determinism) supplies no reference-accuracy or cross-architecture equality guarantee. Framework actual API dispatch remains for a later independently reviewed unit; no exact framework behavior is established |

VIS18's default `N=8,d=4,Br=Bc=4` has `Tr=ceil(8/4)=2`. Materialization counts `4Nd+6N^2 = 4*8*4+6*8*8 = 512` elements, or **2048 B**. The query-outer tiled model counts `2Nd+2TrNd = 2*8*4+2*2*8*4 = 192` elements, or **768 B**. The difference is **1280 B**. Its zero normalization-transfer count is not zero arithmetic. None of these numbers is cuDNN traffic, tensor capacity, workspace, measured bandwidth, or an observed backend outcome; a fused representation does not prove this residency or loop order.

Keep the three planning descriptions separate:

1. **Ordinary C++ backend path:** validate, lower the operation graph, discover candidate configurations with `create_execution_plans`, apply workspace/numerical filters, check support, and build plans. Heuristics are recommendations, not measurements; a successfully built candidate still needs correct binding, allocation, execution, and acceptance.
2. **Unpinned Python build routing:** the [pinned build walk](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/python/cudnn/_pygraph.py#L1346-L1403) may try later ranked candidates on `NotImplementedError` / `cudnnGraphNotSupportedError`. Other exceptions are not silently swallowed as routine declines. Compiled Python-plan workspace is checked when known. This is not recovery from arbitrary execution errors.
3. **Optional strict Python selection:** [`select_plan(i)`](https://github.com/NVIDIA/cudnn-frontend/blob/f77fbc3d21be3f24cd0286b9b368105f7c518b8a/python/cudnn/_pygraph.py#L1117-L1139) fixes a list position; if that candidate declines, it raises rather than falling through. The position is not engine identity, and its strictness supplies neither support nor numerical or performance evidence.

The owner workaround for the bounded decode issue is no causal mask plus actual lengths through a padding mask for that affected case. It is not permission to erase the required mask in Exercise 2. The equal-head, nondecode, unmasked forward lesson excludes that combination and backward length-one requests, without claiming that its own subset is bug-free. Historical 9.10.0/9.10.1 and specific 9.14.0 guards are not newly assigned 9.24 defects.

A missing runtime record would need all of the following, with actual values rather than the fictional report's conclusions:

- A declared Reference Environment and Environment Manifest with GPU, architecture, count, OS, driver, Toolkit/component identities, backend package/build identity, and the pinned frontend source.
- Exact request and storage records: Q/K/V/O shape/stride/dtype and real allocations, scale, stats, features, input provenance, workspace and numerical policy, and the actual selected plan/engine identity rather than only ranked position or graph name.
- Checked binding and workspace requirements, actual launch and completion/error records, and storage lifetimes sufficient for that execution. A built graph supplies no completion record.
- Independent reference methodology, predeclared fixture-specific tolerances and non-finite policy, actual outputs/comparisons, and recorded acceptance. This list contains no results and makes no performance claim.

## Valid alternatives

- Exercise 1: Derive strides by enumerating nested BHSD coordinates instead of using products. An explicit BSHD repack can be reviewed as a different candidate, but must actually change the data mapping, preserve logical values, and recheck layout/alignment/plan requirements. Changing only descriptors fails the unchanged-buffer constraint.
- Exercise 2: Decline the whole request rather than supply a semantic compromise. A separately capable stable FP32 reference is also valid when its full semantics, input-conversion policy, and output boundary are explicit; it is not a bitwise-equivalent or automatically available runtime fallback.
- Exercise 3: Use a five-layer evidence ledger instead of the claim table, provided every claim is repaired and ordinary C++, unpinned Python routing, and optional strict selection remain distinct. Leaving strict selection unused is valid; its existence does not require adding executable Python or pinning a framework API.

## Common errors

- Using four bytes for BF16 allocation because computation is FP32, treating element strides as byte strides, or proving only the last offset while missing the head/sequence mapping.
- Turning UNIFIED's FP32 rejection into universal cuDNN FP32 rejection, treating SM80 as a guarantee for all future architectures, or expanding one exact-SM100 engine to all Blackwell GPUs.
- Equating AUTO representation choice with backend selection, ranked position with engine identity, or build declines with arbitrary runtime failure recovery.
- Deleting a required mask, rewriting reference inputs, or loosening tolerances after rejection; treating determinism as accuracy or graph construction as an executed call.
- Relabeling VIS18's four-byte ledger as cuDNN traffic, copying owner material under the site's license, or presenting source/test inspection as runtime evidence.

Continue with [PB-R4-012](/en/practice/#pb-r4-012), [SRC-CUDA-071](/en/sources-and-versions/#src-cuda-071), and [SRC-CUDA-072](/en/sources-and-versions/#src-cuda-072). Reviewed **2026-09-07**. Native Linux remains the only Supported Environment; these paper solutions add no Lab, Runnable Example, CUDA runtime, or selected-backend result.
