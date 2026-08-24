<!-- SPDX-License-Identifier: Apache-2.0 -->

# Maintenance Source Record

- Review date: 2026-08-24
- Scope: public repository baseline, three-theme visual foundation, web quality CI, O02/O03 evidence/environment contract, and canonical EX02 compile evidence

Context7 was used for current interface discovery. Exact package manifests, tagged owner source, action tags/commits, and versioned owner documentation govern the selected versions when a current Context7 index lags the selected patch.

| Interface | Exact coordinate | Context7 | Owner sources reviewed |
| --- | --- | --- | --- |
| Node.js and npm | Node.js 24.19.0 LTS Krypton; npm 11.17.0 | `/websites/nodejs_latest-v24_x_api` | [Node release index](https://nodejs.org/dist/index.json), [Node 24.19.0 API](https://nodejs.org/dist/v24.19.0/docs/api/), [npm 11 lockfile](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci) |
| Astro and Starlight | Astro 7.2.4; Starlight 0.41.7 | `/withastro/docs`, `/withastro/starlight` | [Astro manifest](https://registry.npmjs.org/astro/7.2.4), [Astro configuration](https://docs.astro.build/en/reference/configuration-reference/), [client scripts](https://docs.astro.build/en/guides/client-side-scripts/), [Starlight manifest](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7), [component overrides](https://starlight.astro.build/guides/overriding-components/), [CSS and styling](https://starlight.astro.build/guides/css-and-tailwind/) |
| Vitest | Vitest and V8 coverage 4.1.11 | `/vitest-dev/vitest` (current exact index available through 4.1.6) | [Vitest manifest](https://registry.npmjs.org/vitest/4.1.11), [coverage manifest](https://registry.npmjs.org/%40vitest%2Fcoverage-v8/4.1.11), [coverage guide](https://vitest.dev/guide/coverage) |
| Playwright | Playwright Test 1.62.1 | `/microsoft/playwright` (current exact index available through 1.61.0) | [package manifest](https://registry.npmjs.org/%40playwright%2Ftest/1.62.1), [browser revisions](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json), [emulation](https://playwright.dev/docs/emulation), [screenshots](https://playwright.dev/docs/screenshots), [test configuration](https://playwright.dev/docs/test-configuration) |
| axe-playwright | 4.13.0; axe-core `~4.13.0` | Playwright accessibility guidance above | [package manifest](https://registry.npmjs.org/%40axe-core%2Fplaywright/4.13.0), [Playwright accessibility testing and its automation disclaimer](https://playwright.dev/docs/accessibility-testing) |
| Browser theme APIs | `localStorage`, Custom Elements, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, print | Playwright Context7 cross-checks emulation; WHATWG/W3C specifications govern browser semantics | [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html), [HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html), [Media Queries 5](https://drafts.csswg.org/mediaqueries-5/), [CSS Color Adjustment](https://drafts.csswg.org/css-color-adjust-1/), [CSS Paged Media](https://www.w3.org/TR/css-page-3/), [MDN web platform references](https://developer.mozilla.org/en-US/docs/Web) |
| GitHub Actions | `ubuntu-24.04`; current reviewed image `20260816.277.1`; least-privilege workflow token; full-SHA action pins | `/websites/github_en_actions`, `/actions/runner-images` | [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Ubuntu 24.04 image release](https://github.com/actions/runner-images/releases/tag/ubuntu24/20260816.277), action tags and commits listed below |
| Docker Engine and Buildx | GitHub runner-provided versions, recorded by every CUDA compile result | Owner references govern this CLI boundary; no Docker behavior is inferred from a Toolkit label | [`docker image pull`](https://docs.docker.com/reference/cli/docker/image/pull/), [`docker image inspect`](https://docs.docker.com/reference/cli/docker/image/inspect/), [`docker buildx imagetools inspect`](https://docs.docker.com/reference/cli/docker/buildx/imagetools/inspect/) |

## CUDA teaching coordinates

These are the source coordinates and declared evidence targets for EX02. Context7 `/websites/nvidia_cuda` was queried on 2026-08-24; exact-version owner documentation governs each Lane. A tag or reviewed source does not grant Compile-Checked without a passing workflow record.

| Interface | Exact coordinate | Owner sources reviewed |
| --- | --- | --- |
| CUDA 11.8 Lane | Toolkit 11.8.0; Ubuntu 22.04 x86-64; curriculum C++17; NVCC 11.8.89; paired Linux driver 520.61.05; 11.x floor 450.80.02 | [archive](https://developer.nvidia.com/cuda-toolkit-archive), [release notes](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html), [Linux guide](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-installation-guide-linux/index.html), [container tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04) |
| CUDA 12.9 Lane | Toolkit 12.9.2; Ubuntu 24.04 x86-64; C++17/C++20; NVCC 12.9.86; paired Linux driver 575.57.08; 12.x floor 525.60.13 | [release notes](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-toolkit-release-notes/index.html), [Linux guide](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-installation-guide-linux/index.html#supported-c-dialects), [NVCC](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std), [container tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04) |
| CUDA 13.3 Lane | Toolkit 13.3.1; Ubuntu 24.04 x86-64; C++17/C++20 plus separate C++23 probe; NVCC 13.3.73; paired Linux driver 610.43.02; 13.x floor R580 | [archive/latest identity](https://developer.nvidia.com/cuda-toolkit-archive), [release notes](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html), [Linux guide](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#supported-c-dialects), [NVCC](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std), [container tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04) |
| Driver compatibility | 11.x floor 450.80.02; 12.x floor 525.60.13; 13.x R580 family; paired-driver values remain separate | [minor version compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html) |
| Compute capability | Programming Guide 13.3.1 feature and limit tables; current GPU-to-capability mapping | [compute capabilities](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html), [CUDA GPUs](https://developer.nvidia.com/cuda-gpus) |
| NVCC phases | Compiler Driver 13.3.1 compile, PTX/CUBIN, link, and run phase boundary | [supported phases](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases) |

CUDA Compile Evidence [run 32720214527](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/32720214527) passed EX02 with C++17 in all three Lanes and with C++20 in the 12.9.2 and 13.3.1 Lanes. The exact 13.3.1 probe resolved the C++23 documentation conflict for this image: GCC 13.3/NVCC 13.3.73 reports `-std=c++23` unsupported with the configured host compiler. That probe grants no EX02 C++23 status. No CUDA binary ran, no Reference Environment is declared, and no runtime or performance evidence was produced.

## Immutable action coordinates

| Action | Release | Commit SHA |
| --- | --- | --- |
| `actions/checkout` | `v7.0.1` | [`3d3c42e5aac5ba805825da76410c181273ba90b1`](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1) |
| `actions/setup-node` | `v7.0.0` | [`820762786026740c76f36085b0efc47a31fe5020`](https://github.com/actions/setup-node/commit/820762786026740c76f36085b0efc47a31fe5020) |
| `actions/upload-artifact` | `v7.0.1` | [`043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`](https://github.com/actions/upload-artifact/commit/043fb46d1a93c77aae656e7c1c64a875d1fc6a0a) |
| `actions/download-artifact` | `v8.0.1` | [`3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c`](https://github.com/actions/download-artifact/commit/3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c) |

The runner label is rolling. Each CI run prints `ImageOS`, `ImageVersion`, `RUNNER_ARCH`, Node, and npm so the actual hosted image remains visible in the run log.
