<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The published Stable Curriculum contains the complete O01-O08 orientation, F01-F08 foundation track, and M01-M08 memory track, with paired Exercises and reviewed solutions for O02-O08 and every F01-F08 and M01-M08 Learning Unit. The bilingual source baseline also contains Home; exactly the EX01-EX06 Runnable Examples, with no EX07; exactly LAB01-LAB03; eleven formal Visual Explainers, comprising standalone VIS01-VIS07 plus embedded VIS19-VIS22; 25 Practice Bank entries; 86 Glossary terms; 36 source/version records; and About. These public files form exactly 93 Publication Pairs and 186 source routes. Complete bilingual indexes preserve prerequisite links, and navigation exposes no unfinished Learning Unit.

The strict graph includes `F05<-F04`, `F06<-[F02,O03]`, `F07<-[F04,F05]`, `F08<-[F02,F03,F06]`, `M01<-[F04,F06]`, `M02<-[M01,F03]`, `M03<-[M01,M02]`, `M04<-M03`, `M05<-[F02,M01]`, `M06<-[F02,M05]`, `M07<-[F05,M01]`, `M08<-M07`, `EX04<-F05`, `EX05<-M02`, `EX06<-[M03,M04]`, and `LAB03<-[F03,F05]`. F08 is related to LAB03 but is not a LAB03 prerequisite. The validated catalog contains 3 Labs, 25 Practice Bank entries, 11 Visual Explainers, 86 Glossary terms, and 36 source/version records, or 161 entries total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

EX01-EX06 host-only tests are available without CUDA:

```sh
make -C examples/ex01-environment-report host-test
make -C examples/ex02-vector-addition host-test
make -C examples/ex03-multidimensional-indexing host-test
make -C examples/ex04-error-handling-lifecycle host-test
make -C examples/ex05-coalesced-strided-access host-test
make -C examples/ex06-shared-memory-tile-bank-padding host-test
```

EX01 and EX03 retain no Compile-Checked claim, and their runtime remains Pending Hardware Verification. LAB01 likewise retains an empty compilation axis and Pending Hardware Verification runtime. EX04 and LAB03 each declare `compilation: []` and Pending Hardware Verification runtime; a host-only test or local build does not upgrade either status. EX03-EX06 each use one original C++17 implementation across the 11.8.0, 12.9.2, and 13.3.1 Toolkit Lanes. EX05 and EX06 have empty compilation evidence because no qualifying retained compile records exist, Pending Hardware Verification runtime, empty recorded observations, and expected observations only. No EX03-EX06 CUDA binary has run, and the site publishes no runtime output, timing, speedup, or other performance number for any of them.

The independent `CUDA Compile Evidence` workflow preprocesses, compiles, links, and inspects EX02 in three digest-pinned NVIDIA development environments on x86-64 CPU runners. The declared C++17 matrix and the applicable C++20 checks remain Compile-Checked for EX02, while LAB02 retains its existing Compile-Checked compilation status. Separate EX03-EX06 matrix jobs are build gates whose seven-day artifacts are not qualifying retained Evidence Status records; their compilation arrays remain empty. The workflow executes no CUDA binary, so every affected runtime axis remains Pending Hardware Verification.

The build is fully static. F02-F04 reuse standalone VIS01 and VIS02; M01, M02, M04, M06, and M07/M08 link to standalone VIS06, VIS04, VIS05, VIS03, and VIS07 respectively. VIS19-VIS22 remain complete Visual Explainers embedded in F05-F08, and their cards deep-link to Learning Unit anchors instead of adding four duplicate standalone pages. All eleven Visual Explainers use deterministic browser-only models, preserve a static or textual fallback, execute no CUDA, and grant no CUDA Evidence Status. F04's original static lifecycle table remains neither a Visual Explainer nor an evidence source. Theme selection is the only learner preference retained across browser sessions. The website has no server application, account, progress tracking, API, hosted GPU service, or in-browser CUDA execution.

## Deployment

The repository-pinned Wrangler deploys reviewed static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation is disabled for R0 to avoid a second deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
