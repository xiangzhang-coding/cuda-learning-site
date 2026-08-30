<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The current Stable Curriculum contains 47 Learning Units: O01-O08, F01-F08, M01-M19, A01-A07, and Q01-Q05. Exercises and reviewed solutions accompany O02-O08, F01-F08, M01-M19, A01-A07, and every Q unit. The current public surface also contains fifteen Runnable Examples, EX01-EX14 and EX16; six noncontiguous Labs, LAB01-LAB05 and LAB07; fifteen formal Visual Explainers, comprising standalone VIS01-VIS11 plus embedded VIS19-VIS22; 48 Practice Bank entries; 146 Glossary terms; 59 source/version records; and About. These files form exactly 178 bilingual Publication Pairs and 356 source routes. EX15 remains absent. LAB06, Q11, and LAB10 have no public destinations.

The strict graph adds `A05<-[M02,M03,M04]`, `A06<-[M03,M04,M05]`, `A07<-[A06,M03]`, `EX14<-A05`, and `VIS11<-A05` to the previously reviewed edges. F08 remains related to LAB03 but is not a LAB03 prerequisite. The validated current catalog contains 6 Labs, 48 Practice Bank entries, 15 Visual Explainers, 146 Glossary terms, and 59 source/version records, or 274 records total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Publication and release review

R1 remains the latest completed aggregate release review and an immutable historical subset of the growing Learning Site. `src/r1-release-manifest.json` is preserved as the reviewed R1 contract; every static build emits it as `/release.json` with the exact 40-character source commit. The current incremental publication is recorded separately in `src/current-publication-manifest.json` and emitted as `/publication.json` with the same commit. That record describes the exact current artifact surface but is not a completed R2 review. The R2 aggregate review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

R1 declares no Reference Environment or Runtime-Verified subject. EX02 and LAB02 retain the only qualifying Compile-Checked evidence from R1. The current publication additionally makes EX10 Compile-Checked from retained run 33275734951. Fourteen current Runnable Examples, EX01-EX09, EX11-EX14, and EX16, and all six current Labs remain Pending Hardware Verification at runtime. EX10 is Runtime-Not-Applicable. EX07-EX09 and EX11-EX14 retain empty compilation evidence and no Compile-Checked claim. The current publication declares no Reference Environment, Runtime-Verified subject, or performance observation. It publishes no measured transpose, stencil, convolution, library-comparison, timing, speedup, profiler, or runtime result. Host-only tests, source review, expected observations, static fallbacks, and browser models do not upgrade those evidence axes.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the authoritative R1 dynamic acceptance record. It binds R1 to its accepted `main` commit, successful GitHub checks, Cloudflare version and deployment IDs, verified Preview URL, and production smoke result. The incremental publication record does not rewrite that history.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

Host-only tests are available without CUDA for the fourteen current Runnable Examples whose runtime remains Pending Hardware Verification:

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
make -C examples/ex11-multi-stage-reduction host-test
make -C examples/ex12-inclusive-exclusive-scan host-test
make -C examples/ex13-privatized-histogram host-test
make -C examples/ex14-tiled-transpose host-test
make -C examples/ex16-sanitizer-defect-suite host-test
```

EX07's host test checks deterministic chunk coverage and its CPU reference, EX08's checks the declared access sequence and CPU oracle, and EX09's checks the fixed DAG and replay oracle. EX11 checks its double CPU reference and tolerance contract, EX12 checks exact prefix recurrences and totals, EX13 checks exact bins and the sum-of-bins invariant, and EX14 checks rectangular transpose mapping and dimensions. They execute no CUDA, establish no GPU transpose, shared-memory, bank, or performance observation, and grant no Compile-Checked or runtime Evidence Status. Their project manifests retain empty compilation and recorded-observation arrays plus Pending Hardware Verification runtime.

EX10 is different: its CUDA compile job generates preprocessing output, PTX, cubin, fatbinary, relocatable objects, a device-link object, and a final host-link artifact for inspection only. The final artifact is never executed, so runtime remains Runtime-Not-Applicable. Five ordinary Lane/dialect records from [run 33275734951](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/33275734951) are Compile-Checked at source commit `904c6da03800ed3012baacb861494377c0fa01f2`. The separate CUDA 13.3.1/NVCC 13.3.73/GCC 14.2.0 C++23 probe passed only as a narrow `C++23-Dialect-Probe`; it does not declare ordinary EX10 C++23 support, another compiler or platform, runtime, or performance.

The independent `CUDA Compile Evidence` workflow retains qualifying Compile-Checked evidence for EX02, EX10, and LAB02. Other CUDA matrix jobs remain build gates whose short-lived artifacts are not qualifying retained evidence. The retained EX10 C++23 probe is separate from its five ordinary Compile-Checked records. No CUDA binary, Compute Sanitizer tool, or profiler execution is inferred from a successful web, host-only, or compile-gate job.

[Issue #22](https://github.com/xiangzhang-coding/cuda-learning-site/issues/22) reviewed exact current and archived CUDA owner documentation plus current cuDNN documentation and the cuDNN Frontend v1.27.0 owner release, recorded in `SRC-CUDA-041` through `SRC-CUDA-043`. Context7 output is discovery and cross-checking only, not a source or Evidence Status record. The refresh records no measured transpose, stencil, convolution, library comparison, timing, or speedup.

The build is fully static. All fifteen Visual Explainers use deterministic browser-only models, preserve static or textual fallbacks, execute no CUDA, and grant no CUDA Evidence Status. VIS11's logical/physical transpose layouts and static before/after fallback are deterministic teaching composition rather than bank, runtime, or performance observations. Theme selection is the only learner preference retained across browser sessions. The website has no server application, account, progress tracking, API, hosted GPU service, or in-browser CUDA execution.

## Deployment

Repository-pinned Wrangler deploys static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Deployment validation requires both the immutable R1 `/release.json` and exact current `/publication.json` to match their source manifests and the same checked-out commit. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation remains disabled, preserving one deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
