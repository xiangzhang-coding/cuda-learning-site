<!-- SPDX-License-Identifier: Apache-2.0 -->

## Current architecture increment — 2026-09-22

Issue #59 extends `/publication.json` to 383 Publication Pairs / 766 routes,
106 Learning Units, 22 visuals, 105 Exercise/solution sets and 483 catalog
records (117 practice, 207 glossary, 119 sources, 18 Labs, 22 visuals).
`/release.json` continues to identify frozen R6. H01/H02/VIS15 add no GPU
evidence or Reference Environment; architecture execution and performance
remain Pending Hardware Verification. R7 aggregate acceptance is pending.

## R6 release acceptance

Aggregate static review: **2026-09-22**. Schema 7 `src/r6-release-manifest.json`
supplies `/release.json`; `/publication.json` records `releaseReview.latestCompleted: R6`,
`releaseReview.next: R7`, `releaseReview.status: pending`. Both bind the exact
source commit. Current scope: 104 Learning Units, 24 Runnable Examples,
18 Labs, 21 Visual Explainers, 103 Exercise and 103 separate solution sets,
376 Publication Pairs / 752 routes, 478 catalog records including 115 original
Practice Bank entries (13 multi-GPU/NCCL), 207 terms and 117 sources.
All following dated R1-R5 and increment instructions are historical; this section
supersedes their active release selection and inventory.

Retain same-commit Web Quality, CUDA Compile Evidence, PyTorch Operator,
Triton Example and NCCL Example runs and scanned artifacts in
[issue #58](https://github.com/xiangzhang-coding/cuda-learning-site/issues/58).
The complete strict remote harness must pass on Preview before production
promotion, then on production: every one of the 752 routes, direct locale pairs,
search, keyboard, mobile, reduced motion, theme/print, canonical downloads,
Labs, G01-G09, VIS16 and independent evidence boundaries. Keep exact Preview
and production URLs, versions, deployment, source SHA and smoke run results.
Static records do not pre-certify these dynamic results. Use the existing pinned
deploy commands and clean-main guard, comparing built R6/current manifests.

EX24/LAB17/LAB18 select native Linux, at least two CC 7.5+ GPUs, Toolkit 13.3.1,
NVCC 13.3.73, driver 610.43.02 and NCCL 2.31.2-1+cuda13.3. LAB18 separately
requires Nsight Systems 2026.5. DDP uses CPython 3.12.14, torch 2.11.0+cu128,
packaged NCCL 2.28.9 and that wheel's torchrun, one assigned GPU per process,
selected by LOCAL_RANK from the shared visible-device list.
Multi-node launcher/provider/network/hardware remain unselected admission gates.
Record GPU count, visibility, topology, process/rank/stream ownership, complete
Environment Manifest, loaded versions, commands, correctness and measurement
method for every observation. Registration, bootstrap and local topology do
not prove a transport; fallback must be explicitly selected and verified.
No qualifying graph, DDP, transport, recovery, overlap or performance observation
is claimed. All 41 Example/Lab subjects requiring runtime remain Pending Hardware
Verification; EX10 remains Runtime-Not-Applicable. Compile gates do not upgrade
published evidence. No architecture-specific or multi-node execution is implied.

## Issue #54 publication increment — 2026-09-20

Current `/publication.json`: 103 Learning Units, 24 Runnable Examples, 373 Publication Pairs, 746 source routes, 102 Exercise sets, 102 solution sets and 475 catalog records (18 Labs, 113 Practice Bank entries, 21 Visual Explainers, 207 Glossary terms, 116 source records). G08 adds bilingual NCCL capture/registration instruction, two Exercises and separate solutions. All 41 Example/Lab subjects and G08's external scenarios retain Pending Hardware Verification. No capture, registration, synchronization or performance result is deployed. `/release.json` is frozen R5; R6 remains pending. Earlier dated inventories below are historical.

# Cloudflare Deployment

## Current G04/G05 publication — 2026-09-19

Issue #53 adds G04/G05, EX24/LAB17/VIS16 and their closed prerequisite/Exercise/solution paths. `/publication.json` now has 100 Learning Units, 24 examples, 363 Publication Pairs, 726 routes, 99 Exercise and 99 solution pairs, 465 catalog records (17 Labs, 107 practice entries, 21 visuals, 207 terms, 113 sources). `/release.json` stays frozen R5; R6 is pending. Forty subjects remain Pending Hardware Verification. The separate NCCL Example workflow verifies the pinned Toolkit 13.3.1 / NCCL 2.31.2-1+cuda13.3 build without executing a GPU binary. Both EX24/LAB17 have empty published compilation/recorded observations. Earlier dated current-scope sections below are historical.

## Historical G01–G03 publication — 2026-09-19

Current `/publication.json` extends the completed R5 snapshot with G01–G03, PB-R6-001/002/003 and SRC-CUDA-094/095/096: 98 Learning Units, 354 Publication Pairs, 708 source routes, 97 Exercise sets and 97 solution sets; 459 catalog records include 16 Labs, 105 Practice Bank entries, 20 Visual Explainers, 207 Glossary terms and 111 source records. `/release.json` remains the exact R5 snapshot below. Validate all 708 routes against the current source and retain the frozen release comparison separately. R6 review remains pending. This increment changes no infrastructure or independently pinned execution environment and grants no two-GPU/topology runtime evidence. Earlier dated current-scope statements below describe their historical increments.

## R5 release acceptance

R5 is the latest completed aggregate static review, **2026-09-19**. Schema 6 `src/r5-release-manifest.json` supplies `/release.json`; `/publication.json` records `releaseReview.latestCompleted: R5`, `releaseReview.next: R6`, and `releaseReview.status: pending`. Both name the exact deployed Git commit. The frozen R5 inventory is 345 Publication Pairs / 690 routes / 453 catalog records: 95 Learning Units, 23 Runnable Examples, 16 Labs, 20 Visual Explainers, 94 Exercise and 94 solution pairs, 102 Practice Bank entries, 207 terms and 108 sources. R1-R4 and [issue #41](https://github.com/xiangzhang-coding/cuda-learning-site/issues/41) remain historical; the earlier dated instructions below describe that historical rollout and are superseded by this section for release selection.

[Issue #51](https://github.com/xiangzhang-coding/cuda-learning-site/issues/51) must retain same-commit Web Quality, CUDA Compile Evidence, PyTorch Operator and Triton Example runs, scanned artifacts, Preview URL/version and smoke, production URL/version/deployment and smoke. The full remote harness still covers every source route, both locales, search, keyboard, mobile, print/theme, canonical downloads, framework and Triton journeys. No source document pre-certifies these dynamic results. Use the existing pinned deploy commands and clean-main guard below, now comparing both built manifests to R5/current source. Promote only after all required checks and Preview smoke pass.

| Independent environment | Exact boundary |
| --- | --- |
| CUDA Python / EX21 | Ordinary CPython 3.14.7; cuda-core 1.2.0, bindings 13.4.1, pathfinder 1.8.1, NumPy 2.5.3; native Toolkit 13.3.1, NVRTC/nvJitLink 13.3.33, driver target 610.43.02 |
| Eager PyTorch / P04-P07 | CPython 3.12.14, torch 2.11.0+cu128, CUDA metapackage 12.8.1, runtime/CUPTI 12.8.90, cuDNN 9.19.0.56; native allocator; no system nvcc requirement |
| Extension / EX22, LAB13-LAB14 | Same application lock, separately installed Toolkit 12.8.1 / NVCC 12.8.93 / GCC 13.3.0 / C++17 / 8.0+PTX |
| Triton / EX23, LAB15-LAB16, T08 | Ordinary CPython 3.14.7, Triton 3.7.1, torch 2.13.0; full EX23 hash lock with CUDA 13.0.3 package family; driver floor 580.65.06, CC 8.0+, single GPU with at least 8 GB; ptxas 12.8.93, separately gated Blackwell ptxas 13.1.80; no system nvcc invocation |

The compiler-only Triton lock cannot run workloads. Diagnostics add a separately locked NumPy dependency. Actual loaded libraries, driver, hardware, profiler, workload, warm-up, sample reduction and selected backend/configuration require a complete Environment Manifest. Missing/unsupported configurations block the activity or use an explicitly verified baseline; eligibility is not execution and fallback cannot silently become an optimized-backend result. T08 is bounded forward-only attention, not general production attention. No multi-GPU claim is made. Only EX02/EX10/LAB02 retain Compile-Checked evidence; EX10 is Runtime-Not-Applicable, 38 subjects remain Pending Hardware Verification, and no runtime/performance observation is added.

## Historical R4 deployment record

The production Learning Site origin is <https://cuda-learning-site.hmzhangxiang.workers.dev>. R4 is the latest completed aggregate static review, dated **2026-09-10**. Schema 5 `src/r4-release-manifest.json` supplies the frozen `/release.json`. R4 dynamic acceptance is complete in the closed [issue #41](https://github.com/xiangzhang-coding/cuda-learning-site/issues/41) record. That existing acceptance applies to its recorded R4 source and deployment coordinates, not to this expanded current publication. No new deployment or infrastructure inspection is claimed by this scope update.

The frozen R4 inventory remains historical: 75 Learning Units including L01-L13, 20 Runnable Examples, 12 Labs, 19 Visual Explainers, 82 Practice Bank entries, 196 Glossary terms, 92 source records, 401 catalog records, 74 Exercise-set and 74 solution-set Publication Pairs, 277 Publication Pairs, and 554 source routes. Its manifest, source-item dates, and accepted issue #41 record are unchanged.

The current publication, reviewed **2026-09-15** in `src/current-publication-manifest.json`, extends through T08 and LAB16: 95 Learning Units, 23 Runnable Examples, 16 Labs, 20 Visual Explainers, 102 Practice Bank entries, 207 Glossary terms, 108 source records, 453 catalog records, 94 Exercise-set and 94 solution-set Publication Pairs, 345 Publication Pairs, and 690 source routes. `/publication.json` records `releaseReview.latestCompleted: R4`, `releaseReview.next: R5`, and `releaseReview.status: pending`. Static scope expands without new Cloudflare features, APIs or bindings. Independent cuDNN 9.24.0/frontend 1.27.0 remain reference-only for L10/L11. R1-R4 manifests and dynamic acceptance are unchanged history.

Repository-pinned Wrangler from a clean `main` checkout is the only deployment authority. The retained R3 infrastructure record describes Workers Builds account automation as disabled; this document does not claim a new account-state inspection. Enabling it later must replace this flow rather than create a second authority. GitHub Actions can produce independent web-quality, CUDA compilation, and remote smoke records without deploying the site. EX17's declared five-profile CI matrix includes the LAB11 runner's preprocess/compile/link/static-inspection gate; that gate never executes the generated binary, remains non-evidentiary, and grants no Compile-Checked status. Historical R4 check acceptance is recorded in issue #41; runner definitions do not establish execution for a new source commit.

## Static Architecture

`astro.config.mjs` emits static files into `dist/`. `wrangler.jsonc` names that directory as Cloudflare Static Assets and intentionally has no `main`, asset binding, route, service, KV, D1, R2, Durable Object, secret, variable, or runtime handler. No Worker application code or runtime binding is part of this deployment. The site has no API, authentication, database, server rendering, hosted GPU backend, or browser CUDA execution.

`npm run quality:deployment` runs Wrangler's dry-run parser against the built output and must report no bindings. Every build emits two source-bound records:

- `dist/release.json` copies the reviewed schema 5 R4 contract from `src/r4-release-manifest.json` and adds the checked-out Git commit.
- `dist/publication.json` copies the exact rolling publication scope from `src/current-publication-manifest.json` and adds the same commit.

The first record is the immutable R4 release contract; the second describes the current artifact surface and can advance independently after R4. Neither record upgrades CUDA Evidence Status or proves deployment. Release output must carry the project licenses and the Astro, Starlight, and Pagefind notices under `/legal/`.

The historical R3 scope remains 62 Learning Units O01-O08/F01-F08/M01-M19/A01-A14/Q01-Q13, sixteen Runnable Examples EX01-EX16, ten Labs LAB01-LAB10, and nineteen Visual Explainers: standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22. It retains 61 Exercise-set and 61 solution-set Publication Pairs, 66 Practice Bank entries, 176 Glossary terms, 76 source records, 347 catalog records, 232 Publication Pairs, and 464 source routes. The exact ten-entry Nsight report-analysis subset is PB-R3-002 through PB-R3-005 and PB-R3-007 through PB-R3-012. L01-L13, EX17-EX20, and LAB11/LAB12 belong to R4, not to that immutable history.

Alongside those ten entries, R4 qualifies exactly eight library-and-algorithm-choice entries: `PB-R4-001`, `PB-R4-002`, `PB-R4-003`, `PB-R4-004`, `PB-R4-008`, `PB-R4-011`, `PB-R4-012`, and `PB-R4-016`. They remain in historical R4's 82 entries and the current 92 entries, now including PB-R5-001 through PB-R5-010. R4 does not certify framework/Triton completion; current navigation adds complete P08-P10, EX22 and LAB13, without Triton placeholders.

Issue #43's twelve page pairs cover eager PyTorch timing, streams/storage lifetime, AMP numerical contracts and CPU-to-CUDA profiler correlation. All four new units and their Exercises/solutions retain empty evidence arrays. The source-only environment declarations `scripts/pytorch-environment/profile.json`, `requirements.lock` and `check.py` select PyTorch 2.11.0+cu128 at commit `70d99e998b4955e0049d13a98d77ae1b14db1f45`, CPython 3.12.14, CUDA metapackage 12.8.1, runtime/CUPTI 12.8.90, cuDNN 9.19.0.56 and the native allocator. No system Toolkit or nvcc is required; EX21's native profile and existing C++ Toolkit Lane evidence are not inherited. These external dependencies are not deployed website assets. No new Example, Lab, installation, CUDA timing, AMP result, allocator observation or captured trace is recorded. The exact source/binary license ledgers remain link/paraphrase-only, without bundled wheel code or libraries.

## Release Settings

- Source branch: clean, protected `main`
- Working directory: repository root
- Build command: `npm run build:release`
- Production deploy command: `npm run deploy`
- Preview deploy command: `npm run deploy:preview`
- Workers Builds: disabled in the retained infrastructure record; no new account-state claim
- Current deployment authority: repository-pinned Wrangler
- Node.js: `24.19.0` from `.node-version`
- npm: `11.17.0` from `packageManager` and the package engine contract

The build command checks source/privacy boundaries, the exact lockfile and licenses, canonical imports, diagnostics, unit tests, static output, Wrangler's assets-only schema, built-output integration tests, and generated artifacts. The pinned Wrangler `4.125.0` is resolved from this repository rather than a mutable global or `latest` tag.

`npm run deploy` invokes `wrangler deploy` for production. `npm run deploy:preview` invokes `wrangler versions upload`, which uploads a version without promoting it and exposes a public Preview URL because `preview_urls` is explicitly enabled. Both commands first reject tracked or untracked source changes, require `dist/release.json` and `dist/publication.json` to match their source manifests exactly, and require both generated records to name the current `HEAD`. Production additionally requires the checked-out branch to be `main`. Internal links stay on the preview host, while canonical, hreflang, sitemap, and publication metadata continue to identify the production `workers.dev` origin.

## Acceptance

Before accepting the current publication in production, require successful `web-quality` and `cuda-compile-gate` checks for the same current `main` commit; historical issue #41 acceptance does not satisfy this new-commit requirement. EX02, EX10, and LAB02 retain Compile-Checked evidence. EX11-EX21 retain empty compilation evidence and Pending Hardware Verification. LAB09-LAB12 have empty compilation and recorded-observation arrays and remain Pending Hardware Verification. Q06-Q13, A10-A14, L01-L13, and P01-P03 are Learning Units with all four evidence arrays empty and grant no Evidence Status. EX17's five-profile matrix, the LAB11 compile path, EX19/EX20's three-profile C++17 jobs, and EX21's separate Python build job are non-evidentiary build gates, not qualifying compilation evidence. EX10 is Runtime-Not-Applicable. No Reference Environment, Community-Observed subject, Runtime-Verified subject, captured profiler report, or performance observation is declared.

The current tally is 38 Pending Hardware Verification subjects: 22 Runnable Examples (all except EX10) and all 16 Labs. Historical R4 remains 31: 19 applicable examples and 12 Labs. Only EX02, EX10 and LAB02 have qualifying Compile-Checked evidence. EX21-EX23 and LAB13-LAB16 retain empty compilation/recorded observations. Six profiler plans remain expected-only. Source/license review, host tests, build gates and deployment checks never automatically upgrade Evidence Status.

The R3 compatibility record binds current Nsight Systems 2026.4/2026.4.1, Nsight Compute 2026.2.1, and CUPTI 2026.2.1 to exact selected-Lane component versions. Profiler collection requires administrator-approved non-admin performance-counter access where counters apply. A denied or unavailable metric blocks collection and is recorded as a blocker; the Labs prohibit `sudo`, privilege escalation, and policy bypass. Immutable R3 retains five expected-only report plans; rolling issue #34 adds the LAB11 plan as the sixth current fixture. All retain unfilled Environment Manifests and empty recorded observations and are not `.nsys-rep` or `.ncu-rep` captures.

The issue #25 profiler fixture policy and both expected-only sanitized JSON fixtures are original project-authored planning artifacts. They are not `nsys` or `ncu` captures and provide no runtime, timeline, metric, bottleneck, or speedup result. Deploying or smoke-testing those static files does not change their evidence boundary.

Issue #26 adds no captured LAB09 evidence. Its compilation and recorded-observation arrays are empty, and its runtime remains Pending Hardware Verification. VIS13 browser values and static chart do not execute CUDA or query a GPU and cannot populate LAB09 evidence, `performanceObservations`, or a Reference Environment.

Issue #27 adds no captured EX14 or LAB10 evidence. Q11 starts from immutable EX14 and reuses VIS11, but its four empty Learning Unit evidence arrays inherit nothing from canonical source or browser arithmetic. It grants no Evidence Status and summarizes the linked EX14/LAB10 subjects, whose compilation and recorded-observation arrays are empty and whose runtime remains Pending Hardware Verification. LAB10's original expected-only JSON fixture and provenance sidecar describe a 4096x4096 `float` workload, a 134,221,952-byte conservative bound, one excluded warm-up, explicit synchronization, and ten-attempt median/min-max reduction. They are not `.ncu-rep` output and provide no timing, metric, speedup, bottleneck, winner, or runtime result.

Issue #28 adds no captured EX11 or Q12 evidence. Q12 starts from immutable EX11 and reuses VIS10; its four empty Learning Unit evidence arrays inherit nothing from source, the browser model, the static runner gate, or the expected-only fixture. EX11 remains Pending Hardware Verification. The Q12 fixture declares a 16,777,219-element workload, three excluded warm-ups, explicit synchronization, ten retained attempts, median/min-max statistics, profiler permissions, an unfilled Environment Manifest, expected correctness, and bounded interpretations. It is not `.ncu-rep` output and provides no numerical result, timing, metric, traffic, speedup, bottleneck, winner, CUB comparison, or runtime result. L03 and LAB11 remained unpublished in that immutable R3 increment; their rolling publication does not backfill Q12 evidence.

Issue #29 adds no captured EX15 or Q13 evidence. Q13 starts from immutable EX15 and reuses VIS12; its four empty Learning Unit evidence arrays inherit nothing from source, the browser model, the static runner gate, or the expected-only fixture. EX15 remains Pending Hardware Verification. The Q13 fixture declares `1024x1024x1024` FP32 GEMM with double CPU accumulation, nonzero-beta C restoration, minimum compute capability 7.5, three excluded warm-ups, explicit synchronization, ten retained attempts, median/min-max statistics, compiler/resource and profiler custody, an unfilled Environment Manifest, expected correctness, and bounded interpretations. It is not `.ncu-rep` output and provides no matrix output, register count, occupancy, traffic metric, timing, speedup, bottleneck, winner, cuBLAS comparison, Tensor Core result, or runtime result. L06 and LAB12 were unpublished in that immutable R3 increment; their rolling publication does not backfill Q13 evidence. The educational kernel is not a production replacement.

Issue #30 adds no CUDA runtime evidence. A10/A11 use finite host arithmetic and static logical traffic ledgers only. VIS18 is a deterministic browser model with a purpose-built static SVG; it does not query a GPU or observe memory transactions. All three subjects have empty evidence arrays and publish no actual traffic, backend, dtype, timing, bandwidth, speedup, or winner.

Issue #31 adds no CUDA or cuSPARSE evidence. A12/A13 use exact host matrix arithmetic, static storage/contribution ledgers, and one semantic HTML/CSS composition. They allocate no workspace, run no preprocessing, and observe no determinism, structured sparsity, actual traffic, timing, speedup, or winner. L13 and EX20 were unpublished in that immutable R3 increment; their issue #40 publication does not backfill A12/A13 evidence.

Issue #33 adds no CUDA, CCCL, or Thrust evidence. L01/L02 display no source and use original static decision, algorithm, policy, iterator, deprecation, issue, and license tables. CCCL v3.4.2 is an independent component coordinate for Toolkit 12.9.2/13.3.1 evaluation and excludes 11.8; tagged API presence and owner tests do not establish local availability or behavior. All four evidence arrays are empty. Tagged backend files support source-derived stream and allocation facts, but no API call, compile result, runtime output, observed synchronization or allocation path, kernel count, fusion, traffic, timing, advantage, speedup, or winner is published.

Issue #34 adds no CUDA, CUB, or profiler evidence. [L03](/libraries/cub-device-primitives/) and [L04](/libraries/cub-warp-block-primitives/) are evidence-neutral Learning Units; [EX17](/examples/cub-device-reduction-scan/) and [LAB11](/labs/compare-custom-reduction-with-cub/) have empty compilation and recorded-observation arrays, no observed runtime evidence, and remain Pending Hardware Verification. The original Apache-2.0 LAB11 runner is fixed at SHA-256 `755a4c4653399299fba80ca12e5fd40d35f992ff18f36d8bece5602c52b16e0c`, has no upstream adaptation, and does not itself establish an observation. The LAB11 expected-only fixture has no CUB output, temporary-storage value, kernel mapping, metric, traffic, timing, speedup, maintenance score, or winner. Declared bundled/selected component matrix jobs only build and inspect the runner without execution; their definitions are not CI execution records, and historical R4 acceptance remains in issue #41.

The L05 increment adds only evidence-neutral libcu++ teaching, Exercises/solutions, PB-R4-005/006, TERM-185/186, and `SRC-CUDA-065/066`, reviewed 2026-09-05. It preserves exact tagged scope/order, barrier phase, pipeline ownership, alignment and fallback contracts, compatibility/known-issue boundaries, and individual notice review without copying or adapting owner material. It adds no Runnable Example, Lab, Visual Explainer, CUDA execution, local compilation, observed synchronization, overlap, or performance result. R1/R2/R3 manifests and all retained CUDA evidence remain unchanged; deploying L05 cannot upgrade them.

Issue #36 publishes [L06](/libraries/cublas-gemm/), [L07](/libraries/cublaslt-matmul/), [EX18](/examples/cublas-gemm/), and [LAB12](/labs/compare-gemm-with-cublas/) without adding observed CUDA evidence. L06/L07 retain four empty evidence arrays. EX18/LAB12 retain empty compilation and recorded observations and Pending Hardware Verification runtime. LAB12 directly requires Q13 and L06 and compares EX15 with EX18; L07 and VIS12 are related resources, not additional prerequisites. Publishing or deploying these pages neither establishes a measured winner nor implements or validates cuBLASLt selection. No infrastructure setting or historical release-validation record changes with this publication update.

[Issue #37](https://github.com/xiangzhang-coding/cuda-learning-site/issues/37) publishes [L08: Tensor Core Precision and Architecture Contracts](https://cuda-learning-site.hmzhangxiang.workers.dev/en/libraries/tensor-core-precision-contracts/) with exact ordered prerequisites `[Q02,L06,F06]` and [L09: CUTLASS C++ GEMM Structure](https://cuda-learning-site.hmzhangxiang.workers.dev/en/libraries/cutlass-cpp-gemm-structure/) with `[A08,L06,M17]`. It adds [L08 Exercises](https://cuda-learning-site.hmzhangxiang.workers.dev/en/libraries/tensor-core-precision-contracts/exercises/) and [solutions](https://cuda-learning-site.hmzhangxiang.workers.dev/en/libraries/tensor-core-precision-contracts/solutions/), plus [L09 Exercises](https://cuda-learning-site.hmzhangxiang.workers.dev/en/libraries/cutlass-cpp-gemm-structure/exercises/) and [solutions](https://cuda-learning-site.hmzhangxiang.workers.dev/en/libraries/cutlass-cpp-gemm-structure/solutions/). L08 covers precision and architecture contracts; L09 uses pinned CUTLASS C++ v4.7.0 commit `dcf215af68a2d08d305076c152a06f201728cd53` for structural reading, not DSL or executable support. Both units retain four empty evidence arrays and grant no Evidence Status, local compilation, emitted-instruction observation, CUDA runtime result, or performance claim. No Runnable Example, Lab, or Visual Explainer is added; VIS12's unchanged instruction panel remains a source-level scalar operation slot, not a real Tensor Core instruction. Deployment cannot turn these static contracts into CUDA evidence or alter historical release acceptance.

Issue #39 publishes [L12](/libraries/cufft-plans-layouts-startup/) with ordered prerequisites `[Q05,M07]`, its Exercises requiring `[L12]`, its separate solutions requiring `[L12-EXERCISES]`, and [EX19](/examples/cufft-batched-transform/) requiring `[L12]`. L12 remains evidence-neutral; EX19 retains empty compilation and recorded observations and Pending Hardware Verification runtime. The example declares only FP32 C2C, not callbacks, low precision, multi-GPU execution, or timing. The same three pinned Toolkit Lanes use C++17 only for EX19, with bundled cuFFT 10.9.0.58 / 11.4.1.4 / 12.3.0.29 for Toolkit 11.8.0 / 12.9.2 / 13.3.1 respectively. The API teaching baseline is the archived 12.9.2 guide; the current 13.3 reference is dated 2026-09-08 because exact 13.3.1 API and release-note archives were unavailable. None of these external CUDA build coordinates adds a deployment runtime dependency or changes R1/R2/R3 acceptance.

Issue #40 publishes [L13](/libraries/cusparse-descriptors-spmv-spmm/) with ordered prerequisites `[A12,A13,L01]`, its Exercises requiring `[L13]`, its separate solutions requiring `[L13-EXERCISES]`, and [EX20](/examples/cusparse-spmv/) requiring `[L13]`. L13 retains four empty evidence arrays; EX20 retains empty compilation and recorded observations and Pending Hardware Verification runtime. Three C++17 non-executing build gates pin Toolkit/cuSPARSE pairs 11.8.0/11.7.5.86, 12.9.2/12.5.10.65, and 13.3.1/12.8.2.51. The 2026-09-09 `SRC-CUDA-075/076` review records available exact cuSPARSE API and release-note archives, including 13.3.1, without rewriting EX19's older failed-archive record. These are external CUDA build coordinates, not deployment runtime dependencies, retained compile evidence, or a claim that CI ran. No R1/R2/R3 acceptance changes.

[Issue #42](https://github.com/xiangzhang-coding/cuda-learning-site/issues/42) adds the static [P01](/python/cuda-python-bridge/), [P02](/python/devices-contexts-launches/), and [P03](/python/runtime-compilation-linking/) Publication Pairs, their Exercises and separate solutions, and [EX21](/examples/cuda-python-launch/). Their ordered direct prerequisites are `[F04,M07]`, `[P01,F07]`, `[P02,M15,M16]`, and `[P02]` respectively. EX21 selects ordinary GIL CPython 3.14.7, cuda-core 1.2.0, cuda-bindings 13.4.1, cuda-pathfinder 1.8.1, and NumPy 2.5.3 independently from system Toolkit 13.3.1, NVRTC 13.3.33, and nvJitLink 13.3.33. Its native Linux x86-64 profile is separate from the ordinary C++ Toolkit Lane matrix. These are external build/runtime coordinates, not software deployed to Cloudflare.

The `ex21-python-build` CI job runs `scripts/run-ex21-python-check.mjs` as a no-GPU compilation/artifact-inspection gate. Its digest-pinned Ubuntu 24.04 / CUDA 13.3.1 build image provisions the exact interpreter and four hash-locked wheels. It downloads the hash-pinned `cuda-compat-13-3_610.43.02-1ubuntu1_amd64.deb` and uses `dpkg-deb --extract` to obtain the real userspace `libcuda.so.610.43.02`, not a stub. Extraction runs no package installation scripts: no kernel module is installed, no GPU is exposed, and no `cuInit` or kernel launch is permitted. The real userspace library serves the Driver API version query needed by core's PTX path; it does not establish a working GPU or a supported hardware runtime through the compatibility package.

The gate checks setup, host correctness, canonical imports, selected native identities, NVRTC PTX, nvJitLink cubin, `cuobjdump` inspection, a real compiler failure, and refusal to overwrite stale outputs. Only allowlisted, scanned text reports are retained; native libraries, wheels, interpreter installations, and build binaries are not deployment assets. These are required checks, not a claim that the new job has run. Passing the gate would not automatically grant Compile-Checked or Runtime-Verified status; EX21 remains Pending Hardware Verification, and GPU execution still requires its separately declared runtime environment and acceptance criteria.

Run the remote browser gate against the exact deployed source:

```sh
RELEASE_BASE_URL="https://cuda-learning-site.hmzhangxiang.workers.dev" \
RELEASE_SOURCE_COMMIT="<40-character-main-commit>" \
RELEASE_KIND="production" \
npm run test:release-smoke
```

If the maintainer network cannot reach `workers.dev`, dispatch the same gate on an independent GitHub-hosted runner. This workflow is smoke-only and has no Cloudflare credential or deploy command:

```sh
gh workflow run release-smoke.yml --ref main \
  -f base_url="https://cuda-learning-site.hmzhangxiang.workers.dev" \
  -f release_kind="production" \
  -f source_commit="<40-character-main-commit>"
```

For Preview, set `RELEASE_BASE_URL` and `RELEASE_KIND="preview"`. Compare `/release.json` to immutable schema 5 R4 (277 pairs / 554 routes / 401 catalog records) and `/publication.json` to current (345 pairs / 690 routes / 453 catalog records). Both records must name the same deployed source commit. Required coverage includes both locales, all 690 routes, navigation/search, catalog counts, the complete graph through T08/LAB16/EX23/VIS18, the unchanged R3/R4 practice subsets, twenty Python/PyTorch/Triton practice entries, six expected-only profiler plans, evidence, legal notices, canonical metadata and browser/network errors.

EX23's separate Triton Example workflow installs the full hashed Python environment, checks host imports, and compiles an explicit sm_80 target with no GPU execution. It creates no Runtime-Verified claim. The current inventory has 36 Pending Hardware Verification subjects, including EX23; earlier dated totals below are historical.

The current `tests/release/release-smoke.spec.ts` includes the bilingual Python prerequisite journey, closed keyboard-operated hints, separate solutions, mobile routes, EX21 imported ranges and exact rendered code/source pointers. EX19 and EX20 retain their immutable archive byte checks. EX21's registry-pinned archive must additionally match its local source, setup script, `requirements.lock`, `environment-manifest.json`, project manifest, and evidence documentation. A SHA-shaped or moving `main` link is insufficient; the pinned archive must be available and reproduce the delivered contract. These are current-publication acceptance requirements, not a new deployment or smoke result, and they do not reopen the accepted R4 record.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the R1 dynamic acceptance record. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) records immutable R2 acceptance. Issues #25 through #31 retain R3 increment provenance, [issue #32](https://github.com/xiangzhang-coding/cuda-learning-site/issues/32) records final R3 acceptance, [issue #33](https://github.com/xiangzhang-coding/cuda-learning-site/issues/33) owns the L01/L02 rolling-publication record, and [issue #34](https://github.com/xiangzhang-coding/cuda-learning-site/issues/34) owns rolling L03/L04, EX17, and LAB11 publication. Source files deliberately do not pre-certify dynamic coordinates.

The closed issue #41 retains the accepted R4 check runs, deployed versions, Preview and production URLs, source commit, and remote smoke results. The 2026-09-10 aggregate source review remains a distinct static record. Current Python publication acceptance must record its own source-bound results when available; it neither inherits those dynamic results nor completes the pending R5 aggregate review.

## Rollback

If production smoke or a required GitHub check fails, do not describe the publication as accepted. In Cloudflare, select the last accepted version and roll it back to 100% traffic, or run:

```sh
npx wrangler rollback <accepted-version-id> --message "Restore last accepted static publication"
```

Rollback creates a new deployment. Re-run `npm run test:release-smoke` with the restored version's source commit and record both the failed deployment and rollback deployment in the applicable public issue.
