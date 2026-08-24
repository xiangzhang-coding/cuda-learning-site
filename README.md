<!-- SPDX-License-Identifier: Apache-2.0 -->

# CUDA Learning Site

CUDA Learning Site is a public, bilingual self-study curriculum for CUDA and GPU programming. Chinese pages live at the root and English counterparts under `/en/`.

The current public baseline contains Home; O01, O02, and O03; F01 with paired Exercises and reviewed solutions; the canonical EX02 vector-addition Runnable Example; LAB02; VIS01 Kernel Journey; VIS02 Indexing; five Practice Bank entries; the Glossary; the Sources and Version Record; and About. Silicon Light, Profiler Dark, and Blueprint style this same content without changing its structure or meaning. Navigation exposes no unfinished learning material.

Contributions use [GitHub Issues](https://github.com/xiangzhang-coding/cuda-learning-site/issues) and [Pull Requests](https://github.com/xiangzhang-coding/cuda-learning-site/pulls). Read [CONTRIBUTING.md](CONTRIBUTING.md) before proposing a change.

## Local verification

Use Node.js 24.19.0 and npm 11.17.0.

```sh
npm ci
npx playwright install chromium firefox webkit
npm run build:release
npm run test
```

EX02 host-side verification is available without CUDA:

```sh
make -C examples/ex02-vector-addition host-test
```

The independent `CUDA Compile Evidence` workflow preprocesses, compiles, links, and inspects EX02 in three digest-pinned NVIDIA development environments on x86-64 CPU runners. The declared C++17 matrix and the applicable C++20 checks are Compile-Checked. LAB02 guides learners through an external native Linux run, but the repository workflow never executes the CUDA binary, so EX02 and LAB02 runtime remain Pending Hardware Verification.

The build is fully static. VIS01 and VIS02 are deterministic browser models with complete textual and static fallbacks; their state and timing grant no CUDA Evidence Status. Theme selection is the only learner preference retained across browser sessions. The website has no server application, account, progress tracking, API, hosted GPU service, or in-browser CUDA execution.

## Deployment

Cloudflare Workers Builds deploys the reviewed static output from `main` to <https://cuda-learning-site.hmzhangxiang.workers.dev>. The pinned Wrangler configuration contains only a Static Assets directory and no Worker application or runtime binding. Non-production builds upload versions for noncanonical Preview URLs; production and preview acceptance use the separate remote Playwright smoke gate. See [DEPLOYMENT.md](DEPLOYMENT.md) for exact settings, evidence boundaries, and rollback.

## Licensing

Software and tooling files use Apache-2.0. Original learning content and visuals use CC BY 4.0. See [CONTENT_LICENSES.md](CONTENT_LICENSES.md), [LICENSE](LICENSE), [LICENSE-CONTENT](LICENSE-CONTENT), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for exact scope and upstream notices.
