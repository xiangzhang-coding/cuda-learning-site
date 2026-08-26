<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The published Stable Curriculum contains the complete O01-O08 orientation and F01-F08, with paired Exercises and reviewed solutions for O02-O08 and every F01-F08 unit. The current bilingual source baseline also contains Home; the canonical EX01 environment-report, EX02 vector-addition, EX03 multidimensional-indexing, and EX04 error-handling-lifecycle Runnable Examples; LAB01-LAB03; the reused VIS01 Kernel Journey and VIS02 Indexing Visual Explainers; seventeen Practice Bank entries; the expanded Glossary and source/version records; and About. Complete bilingual indexes provide direct lookup while preserving prerequisite links. Silicon Light, Profiler Dark, and Blueprint style this same content without changing its structure or meaning. Navigation exposes no unfinished Learning Unit.

The added strict prerequisite edges are `F05<-F04`, `F06<-[F02,O03]`, `F07<-[F04,F05]`, `F08<-[F02,F03,F06]`, `EX04<-F05`, and `LAB03<-[F03,F05]`. F08 is related to LAB03 but is not a LAB03 prerequisite. The validated catalog summary is 3 Labs, 17 Practice Bank entries, 2 Visual Explainers, 65 Glossary terms, and 31 source/version records, or 118 entries total.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

EX01, EX02, EX03, and EX04 host-only tests are available without CUDA:

```sh
make -C examples/ex01-environment-report host-test
make -C examples/ex02-vector-addition host-test
make -C examples/ex03-multidimensional-indexing host-test
make -C examples/ex04-error-handling-lifecycle host-test
```

EX01 and EX03 retain no Compile-Checked claim, and their runtime remains Pending Hardware Verification. LAB01 likewise retains an empty compilation axis and Pending Hardware Verification runtime. EX04 and LAB03 each declare `compilation: []` and Pending Hardware Verification runtime; a host-only test or local build does not upgrade either status. EX03 and EX04 each use one original shared C++17 source across the 11.8.0, 12.9.2, and 13.3.1 Toolkit Lanes. No EX03 or EX04 CUDA binary has run, and the site publishes no runtime output, timing, or performance number for either subject.

The independent `CUDA Compile Evidence` workflow preprocesses, compiles, links, and inspects EX02 in three digest-pinned NVIDIA development environments on x86-64 CPU runners. The declared C++17 matrix and the applicable C++20 checks remain Compile-Checked for EX02, while LAB02 retains its existing Compile-Checked compilation status. The workflow never executes either CUDA binary, so EX02 and LAB02 runtime remain Pending Hardware Verification.

The build is fully static. F02-F04 reuse VIS01 and VIS02, and those remain the only formal Visual Explainer routes. F05's error timeline, F06's capability filter, F07's API boundary, and F08's block-shape explorer are original embedded teaching surfaces rather than standalone Visual Explainers. Each preserves a static or textual fallback, executes no CUDA, and grants no CUDA Evidence Status. F04's original static lifecycle table is likewise not a Visual Explainer or an evidence source. Theme selection is the only learner preference retained across browser sessions. The website has no server application, account, progress tracking, API, hosted GPU service, or in-browser CUDA execution.

## Deployment

The repository-pinned Wrangler deploys reviewed static output from a clean `main` checkout to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The configuration contains only a Static Assets directory and no Worker application or runtime binding. Separate version uploads provide noncanonical Preview URLs; production and preview acceptance use the remote Playwright smoke gate. Workers Builds behavior is reviewed but its account automation is disabled for R0 to avoid a second deployment authority. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
