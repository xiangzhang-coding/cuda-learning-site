---
title: 'L11 Exercises: Descriptors, Eligibility, and Dispatch Claims'
description: Derive a second BHSD descriptor, classify bounded candidate failures, and audit routing, numerical, and visual evidence without executing attention.
pairId: l11-exercises
counterpart: /libraries/attention-backend-dispatch/exercises/
factCheckDate: '2026-09-07'
license: CC-BY-4.0
provenance: original
structure: [prerequisites, instructions, exercise-1, exercise-2, exercise-3, next]
resourceKind: exercise-set
unitId: L11-EXERCISES
prerequisites: [L11]
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
    attrs: { name: 'cuda:pair-id', content: l11-exercises }
  - tag: meta
    attrs: { name: 'cuda:counterpart', content: '/libraries/attention-backend-dispatch/exercises/' }
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
    attrs: { name: 'cuda:unit-id', content: L11-EXERCISES }
  - tag: meta
    attrs: { name: 'cuda:prerequisites', content: L11 }
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

<a class="locale-pair" data-locale-counterpart href="/libraries/attention-backend-dispatch/exercises/" lang="zh-CN">阅读中文对应页</a>

## Prerequisites

Complete [L11](/en/libraries/attention-backend-dispatch/) first. Its exact ordered direct prerequisites remain `A11, L10, L08`; this Exercise set directly requires only `[L11]`. Work from descriptors, equations, and pinned source. No GPU, installation, compilation, or complete attention implementation is required.

## Submission requirements

Use backend **9.24.0** and frontend **1.27.0**, SHA **`f77fbc3d21be3f24cd0286b9b368105f7c518b8a`**, reviewed **2026-09-07** in [SRC-CUDA-071](/en/sources-and-versions/#src-cuda-071) and [SRC-CUDA-072](/en/sources-and-versions/#src-cuda-072). Expected evidence means paper derivations and source-reading records, not runtime observations. All four evidence arrays stay empty; no Evidence Status is granted or inherited. Owner materials are linked/paraphrased only, with per-file rights in the shared source record; do not copy code, tests, manuals, or figures. Complete all three tasks before opening the [separate solutions](/en/libraries/attention-backend-dispatch/solutions/).

## Exercise 1: A descriptor can fit and still be wrong

**Goal:** Prove the mapping between logical attention coordinates and real storage before asking about representation or plan eligibility.

**Constraints:** Start from L11's dense forward inference contract, but use `B=1,H=2,S=128,D=128`. All Q/K/V/O are genuinely BF16 in separate contiguous BHSD buffers; compute and intermediate types are FP32, scale is explicitly `1/sqrt(D)`, and `generate_stats=false`. Heads, lengths, and depths are equal; no mask, bias, dropout, paging, ragged offsets, backward, FP8, or shape overrides. A proposed descriptor claims `[32768,128,256,1]` element strides over the unchanged BHSD bytes. No allocation or call has actually occurred.

**Expected evidence:** State each tensor's logical shape, correct element and byte strides, offset formula, last logical offset and byte range, per-tensor element/byte capacity, and the total for all four separate buffers. Give the exact scale expression and a decimal approximation, noting that a stored FP32 scale is rounded. Compare the correct and proposed offsets at `(0,1,0,0)`. Explain why the mathematical `K^T` does not change the frontend K shape and why Stats needs no output allocation here.

**Acceptance criteria:** Prove that an in-bounds last element does not prove correct logical mapping. Distinguish two-byte BF16 storage from four-byte FP32 compute/intermediate types. Do not include invented workspace in the four-buffer capacity, claim alignment from byte arithmetic, or infer a plan, selected engine, or correctness result. A repair must match real storage, not merely change labels.

<details><summary>Hint 1: Derive strides from the innermost dimension</summary>Contiguous BHSD advances one element in depth, one whole depth row in sequence, and one whole sequence in head. Convert element strides to byte strides only after choosing the real stored dtype.</details>

<details><summary>Hint 2: Test a coordinate that separates the two layouts</summary>The final coordinate can have the same offset in two different packed layouts. Moving from head zero to head one at sequence zero reveals whether adjacent heads or adjacent sequence rows are interleaved.</details>

## Exercise 2: Classify rejection without changing the reference

**Goal:** Distinguish lesson scope, frontend feature eligibility, backend-plan policy, and execution evidence, while keeping the original reference intact.

**Constraints:** Treat the following as independent constructed cases, not observations. Start each from L11's `B=1,H=2,S=128,D=64` contract. For memory policy, let `W_backend` be backend-plan workspace, `W_frontend` frontend-node workspace, and `W_cap` the application's total scratch budget; no sizes are measured or supplied.

| Case | Hypothetical condition |
| --- | --- |
| A | The device is SM75 and the general backend support matrix lists it |
| B | Q/K/V/O are changed to FP32 while UNIFIED is explicitly requested |
| C | A required causal mask is added; a proposal drops it to enter the unmasked lesson subset |
| D | `W_backend <= W_cap`, but `W_backend + W_frontend > W_cap` |
| E | A candidate carries `NONDETERMINISTIC` and the application requires repeatability |
| F | A graph validates and a plan builds, with no execution or selected-plan runtime record |

**Expected evidence:** For each case, identify the failing or incomplete layer, state a bounded next action, and say what remains unknown. Include the distinction between UNIFIED FP32 rejection and possible COMPOSITE/AUTO FP32 acceptance, while keeping the latter outside the lesson's low-precision contract. Explain how a stable FP32 reference alternative preserves the original equation, input provenance, scale, requested features, and predeclared acceptance policy. Cite the exact pinned support/test or backend source used for factual gates.

**Acceptance criteria:** No case may silently change storage dtype, remove a required feature, rewrite the reference, loosen tolerances, or grant runtime evidence. An alternative incapable of the full request must report unsupported. Workspace filtering is not final allocation or a total GPU-memory cap. Determinism is not accuracy. Successful graph/plan work does not identify actual framework dispatch or establish that an attention call completed.

<details><summary>Hint 1: Separate library-wide support from this operation</summary>A backend package may support a GPU for other operations. A frontend representation may accept a dtype without finding a supporting engine. Neither statement reaches the execution layer.</details>

<details><summary>Hint 2: Write down what rejection is allowed to change</summary>It may change the eligible candidate set or cause an explicit unsupported result. It must not change the mathematical target. Compare the final total scratch need with the cap separately from Q/K/V/O allocation.</details>

## Exercise 3: Audit a dispatch story against its sources

**Goal:** Repair a source-reading report that confuses algorithms, frontend representations, Python routing, architecture gates, and runtime observations.

**Constraints:** The following claims are fictional and no code was run. Use L11's immutable source coordinates and the unchanged standalone [VIS18](/en/visuals/attention-memory-traffic/), not unpinned framework documentation or a new implementation.

| Claim | Statement to audit |
| --- | --- |
| Algorithm and visual | A FlashAttention paper plus VIS18's lower track proves cuDNN's backend; BF16 permits halving the visual's FP32 byte totals |
| Representation | AUTO benchmarks UNIFIED against COMPOSITE and retries all implementations after any execution error |
| Python routing | Ranked index equals engine identity; strict `select_plan(i)` silently tries another plan after a pinned decline; ordinary C++ planning has identical behavior |
| Hardware | General SM75 cuDNN support enables this SDPA path; the C++ SM100 OSS prefill engine works on every Blackwell GPU, including SM103 |
| Version and issue scope | The matrix labeled 9.18.1 is a complete 9.24 contract; 9.25 preview gates are stable; decode causal unequal-head problems and backward length-one restrictions imply all forward is broken |
| Observation | A successful graph named `flash_attention` establishes the framework's selected backend; a deterministic plan guarantees FP32-reference accuracy |

**Expected evidence:** Supply six repaired claims with pinned reading coordinates. Reconstruct VIS18's unchanged default `N=8,d=4,Br=Bc=4` logical-element and byte totals. Give separate descriptions of ordinary C++ planning, unpinned Python build-decline routing, and optional strict Python selection. Finish with the minimum missing runtime record needed to identify an actual executed plan, without fabricating its contents.

**Acceptance criteria:** Papers support history only, VIS18 stays a four-byte logical ledger, AUTO selects a frontend representation rather than a measured engine, and arbitrary execution failures are not declared build declines. SM100 means exactly SM100 for that particular C++ engine. Keep the precise 9.24 known-issue scopes and exclude 9.25 Developer Preview gates. Leave framework actual API dispatch to a later independently reviewed unit; no framework version, engine identity, traffic, output, timing, or performance claim may be invented.

<details><summary>Hint 1: Attach an authority to each layer</summary>Use graph properties for AUTO, the support surface and dtype tests for eligibility, router and pygraph source for Python policy, and the exact engine header for its architecture gate. A paper cannot answer those release-specific questions.</details>

<details><summary>Hint 2: Follow the evidence that is still absent</summary>A candidate list is not a selected plan, a built plan is not a completed call, and repeatable output is not necessarily accurate output. List the environment, selected-plan identity, completion checks, and reference acceptance that the fictional report never supplied.</details>

## Next

Compare the [separate solutions](/en/libraries/attention-backend-dispatch/solutions/), then complete [PB-R4-012](/en/practice/#pb-r4-012). Sources: [L11](/en/libraries/attention-backend-dispatch/), [SRC-CUDA-071](/en/sources-and-versions/#src-cuda-071), and [SRC-CUDA-072](/en/sources-and-versions/#src-cuda-072), reviewed **2026-09-07**. These scenarios and derivations are original, with no new Lab, Runnable Example, CUDA runtime, or inherited evidence.
