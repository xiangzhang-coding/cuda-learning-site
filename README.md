<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The current Stable Curriculum contains 39 Learning Units: O01-O08, F01-F08, M01-M19, and the noncontiguous correctness-and-quality track Q01 and Q03-Q05. Exercises and reviewed solutions accompany O02-O08, F01-F08, M01-M19, and every published Q unit. The current public surface also contains eleven Runnable Examples, EX01-EX10 and EX16; six noncontiguous Labs, LAB01-LAB05 and LAB07, with no LAB06 destination; thirteen formal Visual Explainers, comprising standalone VIS01-VIS09 plus embedded VIS19-VIS22; 40 Practice Bank entries; 125 Glossary terms; 50 source/version records; and About. These files form exactly 148 bilingual Publication Pairs and 296 source routes. EX11-EX15 remain absent.

The strict graph extends the reviewed R1 graph with `M09<-[M07,M08]`, `M10<-[M01,M02]`, `M11<-[M07,M08]`, `M12<-[M05,M06]`, `M13<-[M03,M05,M08]`, `M14<-[M07,M08]`, `M15<-[F04,O04]`, `M16<-[M15,F06]`, `M17<-[M16,F06]`, `M18<-[M15,M16]`, `M19<-[O04,M15]`, `EX07<-[M07,M08,M09]`, `EX08<-M10`, `EX09<-M14`, `EX10<-[M15,M16]`, and `VIS09<-[M15,M16,M17]`. F08 remains related to LAB03 but is not a LAB03 prerequisite. The validated current catalog contains 6 Labs, 40 Practice Bank entries, 13 Visual Explainers, 125 Glossary terms, and 50 source/version records, or 234 records total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Publication and release review

R1 remains the latest completed aggregate release review and an immutable historical subset of the growing Learning Site. `src/r1-release-manifest.json` is preserved as the reviewed R1 contract; every static build emits it as `/release.json` with the exact 40-character source commit. The current incremental publication is recorded separately in `src/current-publication-manifest.json` and emitted as `/publication.json` with the same commit. That record describes the exact current artifact surface but is not a completed R2 review. The R2 aggregate review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

R1 declares no Reference Environment or Runtime-Verified subject. EX02 and LAB02 retain the only qualifying Compile-Checked evidence from R1. Ten current Runnable Examples, EX01-EX09 and EX16, and all six current Labs remain Pending Hardware Verification at runtime. EX10 is Runtime-Not-Applicable because its acceptance contract generates and inspects artifacts without executing the final host artifact or any GPU executable. EX07-EX10 have empty compilation evidence and no Compile-Checked claim. The current publication declares no Reference Environment, Runtime-Verified subject, or performance observation. In particular, it publishes no measured overlap, migration, or graph performance, and no timing, speedup, profiler, or runtime result for the new examples. Host-only tests, source review, expected observations, and browser models do not upgrade those evidence axes.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the authoritative R1 dynamic acceptance record. It binds R1 to its accepted `main` commit, successful GitHub checks, Cloudflare version and deployment IDs, verified Preview URL, and production smoke result. The incremental publication record does not rewrite that history.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

Host-only tests are available without CUDA for the ten current Runnable Examples whose runtime remains Pending Hardware Verification:

```sh
make -C examples/ex01-environment-report host-test
make -C examples/ex02-vector-addition host-test
make -C examples/ex03-multidimensional-indexing host-test
make -C examples/ex04-error-handling-lifecycle host-test
make -C examples/ex05-coalesced-strided-access host-test
make -C examples/ex06-shared-memory-tile-bank-padding host-test
make -C examples/ex07-streams-events-overlap host-test
make -C examples/ex08-unified-memory-migration host-test
make -C examples/ex09-graph-capture host-test
make -C examples/ex16-sanitizer-defect-suite host-test
```

EX07's host test checks deterministic chunk coverage and its CPU reference, EX08's checks the declared access sequence and CPU oracle, and EX09's checks the fixed DAG and replay oracle. They execute no CUDA, establish no copy/compute overlap or managed-memory migration, launch no CUDA Graph, and grant no Compile-Checked or runtime Evidence Status. Their project manifests retain empty compilation and recorded-observation arrays plus Pending Hardware Verification runtime.

EX10 is different: its CUDA compile job generates preprocessing output, PTX, cubin, fatbinary, relocatable objects, a device-link object, and a final host-link artifact for inspection only. The final artifact is never executed, so runtime remains Runtime-Not-Applicable. The ordinary EX10 artifact pipeline and its separate CUDA 13.3/GCC 14 C++23 probe are pending committed qualifying records; neither grants Compile-Checked until that retained evidence is reviewed and committed.

The independent `CUDA Compile Evidence` workflow retains qualifying Compile-Checked evidence only for EX02 and LAB02. Other CUDA matrix jobs, including the current EX10 artifact checks and C++23 probe, are build gates whose short-lived artifacts are not qualifying retained evidence. No CUDA binary, Compute Sanitizer tool, or profiler execution is inferred from a successful web, host-only, or compile-gate job.

[Issue #19](https://github.com/xiangzhang-coding/cuda-learning-site/issues/19) refreshed the M09-M14, EX07-EX09, and VIS08 teaching coordinates. The current M15-M19, EX10, and VIS09 refresh used the Context7 `/websites/nvidia_cuda` query on 2026-08-29 only for current interface discovery and cross-checking; exact NVIDIA owner documentation and archives in `SRC-CUDA-031` through `SRC-CUDA-035` govern the facts and version boundaries. The refresh records no measured overlap, migration, graph launch overhead, concurrency, timing, or speedup.

The build is fully static. All thirteen Visual Explainers use deterministic browser-only models, preserve static or textual fallbacks, execute no CUDA, and grant no CUDA Evidence Status. VIS09's host/device branches, target plans, and artifact flow are original teaching composition rather than compiler execution or artifact observation. Theme selection is the only learner preference retained across browser sessions. The website has no server application, account, progress tracking, API, hosted GPU service, or in-browser CUDA execution.

## Deployment

Repository-pinned Wrangler deploys static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Deployment validation requires both the immutable R1 `/release.json` and exact current `/publication.json` to match their source manifests and the same checked-out commit. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation remains disabled, preserving one deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
