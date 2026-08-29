<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The published Stable Curriculum contains the complete O01-O08 orientation, F01-F08 foundation track, M01-M08 memory track, and the noncontiguous correctness-and-quality track Q01 and Q03-Q05, with paired Exercises and reviewed solutions for O02-O08, F01-F08, M01-M08, and every published Q unit. The bilingual source baseline also contains Home; exactly seven noncontiguous Runnable Examples, EX01-EX06 and EX16, with no EX07-EX15 destinations; exactly six noncontiguous Labs, LAB01-LAB05 and LAB07, with no LAB06 destination; eleven formal Visual Explainers, comprising standalone VIS01-VIS07 plus embedded VIS19-VIS22; 29 Practice Bank entries; 95 Glossary terms; 39 source/version records; and About. These public files form exactly 109 Publication Pairs and 218 source routes. Complete bilingual indexes preserve prerequisite links, and navigation exposes no unfinished Learning Unit or placeholder ID.

The strict graph includes `F05<-F04`, `F06<-[F02,O03]`, `F07<-[F04,F05]`, `F08<-[F02,F03,F06]`, `M01<-[F04,F06]`, `M02<-[M01,F03]`, `M03<-[M01,M02]`, `M04<-M03`, `M05<-[F02,M01]`, `M06<-[F02,M05]`, `M07<-[F05,M01]`, `M08<-M07`, `Q01<-[F04,O04]`, `Q03<-[F05,Q01]`, `Q04<-[M05,M06,Q03]`, `Q05<-[M08,Q01]`, `EX04<-F05`, `EX05<-M02`, `EX06<-[M03,M04]`, `EX16<-[Q03,Q04]`, `LAB03<-[F03,F05]`, `LAB04<-[M02,Q05]`, `LAB05<-[M04,Q05]`, and `LAB07<-[Q03,Q04]`. F08 is related to LAB03 but is not a LAB03 prerequisite. The validated catalog contains 6 Labs, 29 Practice Bank entries, 11 Visual Explainers, 95 Glossary terms, and 39 source/version records, or 180 records total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## R1 release review

R1 is the reviewed bilingual release of O01-O08, F01-F08, M01-M08, Q01, and Q03-Q05 plus the eligible resources listed above. `src/r1-release-manifest.json` is the source release contract; every static build copies it into `/release.json` and adds the exact 40-character source commit. The manifest records the reviewed scope, the native-Linux Toolkit Lane matrix, GPU Capability Tier gates, the evidence inventory, and known limitations. Build and smoke tests reject a release whose generated record drifts from that contract.

R1 does not declare a Reference Environment or a Runtime-Verified subject. EX02 and LAB02 retain the only qualifying Compile-Checked evidence; every Runnable Example and Lab remains Pending Hardware Verification at runtime, while the other CUDA compile jobs are build gates rather than retained evidence. No sanitizer, profiler, timing, overlap, speedup, or other performance observation is published. The exact accepted `main` commit, GitHub checks, Cloudflare version and deployment IDs, Preview URL, and production smoke results are recorded in [issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18). R2 and later curriculum material is outside this release.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

Host-only tests for the seven noncontiguous Runnable Examples EX01-EX06 and EX16 are available without CUDA:

```sh
make -C examples/ex01-environment-report host-test
make -C examples/ex02-vector-addition host-test
make -C examples/ex03-multidimensional-indexing host-test
make -C examples/ex04-error-handling-lifecycle host-test
make -C examples/ex05-coalesced-strided-access host-test
make -C examples/ex06-shared-memory-tile-bank-padding host-test
make -C examples/ex16-sanitizer-defect-suite host-test
```

Q01 and Q03-Q05 have empty compilation and runtime axes: static teaching pages, Exercises, and host reasoning grant no CUDA Evidence Status. EX01 and EX03 retain no Compile-Checked claim, and their runtime remains Pending Hardware Verification. LAB01 likewise retains an empty compilation axis and Pending Hardware Verification runtime. EX04 and LAB03 each declare `compilation: []` and Pending Hardware Verification runtime; a host-only test or local build does not upgrade either status. EX03-EX06 each use one original C++17 implementation across the 11.8.0, 12.9.2, and 13.3.1 Toolkit Lanes; EX16 is one original Apache-2.0 C++17 project with eight isolated binaries across those Lanes. EX05, EX06, EX16, LAB04, LAB05, and LAB07 have empty compilation evidence because no qualifying retained compile records exist; their runtime remains Pending Hardware Verification, recorded observations are empty, and only expected observations are published. No EX03-EX06 or EX16 CUDA binary, Compute Sanitizer tool, or profiler ran for these records, and the site publishes no sanitizer transcript, runtime output, timing, speedup, or other performance number for them.

The independent `CUDA Compile Evidence` workflow preprocesses, compiles, links, and inspects EX02 in three digest-pinned NVIDIA development environments on x86-64 CPU runners. The declared C++17 matrix and the applicable C++20 checks remain Compile-Checked for EX02, while LAB02 retains its existing Compile-Checked compilation status. Separate EX03-EX06 and EX16 matrix jobs are build gates whose seven-day artifacts are not qualifying retained Evidence Status records; their compilation arrays remain empty. The workflow executes no CUDA binary or Compute Sanitizer tool, so every affected runtime axis remains Pending Hardware Verification.

Issue #17 discovery was cross-checked through current Context7 NVIDIA CUDA indexes where applicable, but Context7 is not a factual source or Evidence Status record. Exact NVIDIA owner coordinates govern the release: current v13.3/v13.3.1 verification, Runtime error/event, lazy-loading, compiler, Compute Sanitizer 2026.2.1, and Nsight Compute 2026.2.1 documentation; CUDA 11.8.0 archives; Toolkit 12.9.1 owner documentation for the 12.9.2 patch lane; Toolkit 11.8.0, 12.9 Update 1, 12.2 lazy-loading, and 13.3 Update 1 release notes; and lane-specific Nsight Compute 2022.3.0, 2025.2.1, and 2026.2.1 coordinates. See `SRC-CUDA-015` and `SRC-CUDA-022` through `SRC-CUDA-024` in the bilingual source record.

The build is fully static. F02-F04 reuse standalone VIS01 and VIS02; M01, M02, M04, M06, and M07/M08 link to standalone VIS06, VIS04, VIS05, VIS03, and VIS07 respectively. VIS19-VIS22 remain complete Visual Explainers embedded in F05-F08, and their cards deep-link to Learning Unit anchors instead of adding four duplicate standalone pages. All eleven Visual Explainers use deterministic browser-only models, preserve a static or textual fallback, execute no CUDA, and grant no CUDA Evidence Status. F04's original static lifecycle table remains neither a Visual Explainer nor an evidence source. Theme selection is the only learner preference retained across browser sessions. The website has no server application, account, progress tracking, API, hosted GPU service, or in-browser CUDA execution.

## Deployment

The repository-pinned Wrangler deploys reviewed static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation is disabled for R1 to avoid a second deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
