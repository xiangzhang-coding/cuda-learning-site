---
title: Sources and Version Record
description: Publishing interfaces, CUDA version facts, content sources, and review dates for the current public routes, F01, LAB02, EX02, VIS01, and VIS02.
pairId: sources-and-versions
counterpart: /sources-and-versions/
factCheckDate: '2026-08-24'
license: CC-BY-4.0
provenance: original
structure:
  - scope
  - verified-interfaces
  - content-sources
  - review-record
head:
  - tag: meta
    attrs:
      name: 'cuda:pair-id'
      content: sources-and-versions
  - tag: meta
    attrs:
      name: 'cuda:fact-check-date'
      content: '2026-08-24'
  - tag: meta
    attrs:
      name: 'cuda:license'
      content: CC-BY-4.0
  - tag: meta
    attrs:
      name: 'cuda:structure'
      content: 'scope,verified-interfaces,content-sources,review-record'
---

<a class="locale-pair" data-locale-counterpart href="/sources-and-versions/" lang="zh-CN">阅读中文对应页</a>

This record names the exact publishing, theme, and visual interfaces behind CUDA Learning Site and the owner sources for O02/O03/F01/LAB02/EX02/VIS01/VIS02 CUDA facts. Tool versions, browser behavior, hardware capability, project support policy, and observed behavior remain separate.

## Scope of this record

This page covers Home, O01, O02, O03, F01, their Exercises and solutions, EX02, LAB02, VIS01, VIS02, the Practice Bank, Glossary, three visual themes, and the static publishing shell. Every link below was reopened on **2026-08-24**. Website builds use Node.js 24.19.0 and npm 11.17.0.

## Verified publishing interfaces

| Interface | Exact version | What was checked | Context7 | Owner sources |
| --- | --- | --- | --- | --- |
| Astro | 7.2.4 | Static-output configuration, Astro components in MDX, processed/bundled/deduplicated TypeScript client scripts, light-DOM custom elements, and pre-paint `is:inline` scripts | `/withastro/docs` | [npm manifest](https://registry.npmjs.org/astro/7.2.4), [configuration reference](https://docs.astro.build/en/reference/configuration-reference/), [client scripts and custom elements](https://docs.astro.build/en/guides/client-side-scripts/), [MDX components](https://docs.astro.build/en/guides/integrations-guide/mdx/) |
| Starlight | 0.41.7 | Root locale, localized title, explicit Visual Explainer sidebar, MDX components, custom CSS, `Banner`/`ThemeProvider`/`ThemeSelect` overrides, and cascade layers | `/withastro/starlight` | [npm manifest](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7), [sidebar and localized slugs](https://starlight.astro.build/guides/sidebar/), [components in MDX](https://starlight.astro.build/components/using-components/), [component overrides](https://starlight.astro.build/guides/overriding-components/), [CSS and styling](https://starlight.astro.build/guides/css-and-tailwind/), [internationalization](https://starlight.astro.build/guides/i18n/#use-a-root-locale) |
| Pagefind | 1.5.2 | Language-partitioned indexes selected from `<html lang>`, extended Chinese segmentation, and the static JS/Wasm/index assets required at deployment | `/websites/pagefind_app` | [npm manifest](https://registry.npmjs.org/pagefind/1.5.2), [multilingual search](https://pagefind.app/docs/multilingual/), [static indexing](https://pagefind.app/docs/running-pagefind/) |
| Cloudflare static release | Wrangler 4.125.0; compatibility date 2026-08-24 | Workers Builds from `main`; Static Assets with no Worker script or binding; non-production version uploads and public Preview URLs; the production `workers.dev` route, 404, version, and rollback boundaries | Cloudflare owner documentation | [Wrangler release](https://github.com/cloudflare/workers-sdk/releases/tag/wrangler%404.125.0), [Astro static deployment](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/), [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Static Assets](https://developers.cloudflare.com/workers/static-assets/), [Preview URLs](https://developers.cloudflare.com/workers/versions-and-deployments/preview-urls/), [`workers.dev`](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/), [rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) |
| Playwright and axe | 1.62.1; `@axe-core/playwright` 4.13.0 | Chromium/Firefox/WebKit projects, Mobile Safari device emulation, JavaScript-disabled contexts, reduced motion/contrast/forced colors, keyboard use, native range/number inputs, print, screenshots, and automated-accessibility limits | `/microsoft/playwright` (exact index currently through 1.61.0) | [Playwright manifest](https://registry.npmjs.org/%40playwright%2Ftest/1.62.1), [browser revisions](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json), [emulation](https://playwright.dev/docs/emulation), [browser contexts](https://playwright.dev/docs/api/class-browser#browser-new-context), [accessibility testing](https://playwright.dev/docs/accessibility-testing), [axe manifest](https://registry.npmjs.org/%40axe-core%2Fplaywright/4.13.0) |
| Browser APIs and CSS media | Web Storage, Custom Elements lifecycle, native button/select/range/number controls, `role=status`, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, and print | One theme preference, per-instance deterministic state, timer cleanup, native keyboard semantics, status messages, no-script fallback, reduced motion, increased contrast, system forced colors, and print coverage | Playwright Context7 cross-checks test interfaces; WHATWG/W3C specifications govern browser and accessibility semantics | [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html), [HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html), [HTML input](https://html.spec.whatwg.org/multipage/input.html), [WAI ARIA22](https://www.w3.org/WAI/WCAG22/Techniques/aria/ARIA22), [WAI C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39), [Media Queries 5](https://drafts.csswg.org/mediaqueries-5/), [CSS Color Adjustment](https://drafts.csswg.org/css-color-adjust-1/), [CSS Paged Media](https://www.w3.org/TR/css-page-3/) |
| Docker Engine and Buildx | Provided by the GitHub runner; each CUDA compile record captures the actual versions | Digest pull, image inspection, and multi-platform manifest inspection without inferring them from a Toolkit label | Owner CLI references | [`docker image pull`](https://docs.docker.com/reference/cli/docker/image/pull/), [`docker image inspect`](https://docs.docker.com/reference/cli/docker/image/inspect/), [`docker buildx imagetools inspect`](https://docs.docker.com/reference/cli/docker/buildx/imagetools/inspect/) |

Exact npm manifests govern package versions, engines, dependencies, and package licenses. Current owner documentation governs configuration semantics. Context7 supports interface discovery and cross-checking but does not override the target-version manifests.

### Verified CUDA version facts

The current `/websites/nvidia_cuda` Context7 index supported discovery and cross-checking. Exact-version release notes, installation guides, and registry metadata govern. Every row below was accessed on **2026-08-24**.

| Coordinate | Exact version and platform | What was checked | Owner sources |
| --- | --- | --- | --- |
| CUDA 11.8 Lane sources | Toolkit 11.8.0; Ubuntu 22.04 x86-64 | NVIDIA archive identity; NVCC 11.8.89; paired Linux driver 520.61.05; 11.x minor-compatibility floor 450.80.02; project-selected C++17 | [Toolkit archive](https://developer.nvidia.com/cuda-toolkit-archive), [11.8.0 release notes](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-toolkit-release-notes/index.html), [11.8.0 Linux guide](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-installation-guide-linux/index.html), [compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/minor-version-compatibility.html) |
| CUDA 12.9 Lane sources | Toolkit 12.9.2; Ubuntu 24.04 x86-64 | Update 2 identity; NVCC 12.9.86; paired Linux driver 575.57.08; 12.x floor 525.60.13; C++17/C++20 | [12.9.2 release notes](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-toolkit-release-notes/index.html), [12.9.2 Linux guide](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-installation-guide-linux/index.html#supported-c-dialects), [12.9.2 NVCC](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std) |
| CUDA 13.3 Lane sources | Toolkit 13.3.1; Ubuntu 24.04 x86-64 | Latest production identity; NVCC 13.3.73; paired Linux driver 610.43.02; 13.x floor R580/`>=580`; C++17/C++20 plus a separate C++23 probe | [Toolkit archive](https://developer.nvidia.com/cuda-toolkit-archive), [13.3 release notes](https://docs.nvidia.com/cuda/cuda-toolkit-release-notes/index.html), [13.3 Linux guide](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#supported-c-dialects), [13.3 NVCC `--std`](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#std-c-03-c-11-c-14-c-17-c-20-std) |
| Compilation and running phases | NVCC 13.3.1; Linux/Windows | `--compile`, PTX/CUBIN generation, and `--run` are separate phases; a build does not prove GPU execution | [NVCC supported phases](https://docs.nvidia.com/cuda/cuda-compiler-driver-nvcc/index.html#supported-phases) |
| compute capability | CUDA Programming Guide 13.3.1; CUDA-capable GPUs | Feature and technical-limit tables are organized by compute capability; model mapping is queried separately | [Compute capabilities](https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/compute-capabilities.html), [CUDA GPUs](https://developer.nvidia.com/cuda-gpus) |
| VIS01 execution model | CUDA Programming Guide v13.3; updated 2026-05-27 | Blocks may run in any order, in parallel, or in series; one block executes on one SM; 32-thread warps; x-fastest local IDs; Independent Thread Scheduling boundary; bounded four-transaction 32 B example; asynchronous launch and synchronization boundary | [Programming Model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html), [Writing SIMT Kernels](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html), [Asynchronous Execution](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html), [Advanced Kernel Programming](https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html) |
| VIS02 indexing model | CUDA Programming Guide v13.3; updated 2026-05-27 | 1D/2D/3D grids and blocks; `gridDim`/`blockDim`/`blockIdx`/`threadIdx`; x-fastest thread linearization; the site explicitly declares logical extents and row-major flattening | [Programming Model](https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html), [Writing SIMT Kernels](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html) |
| F01 first-kernel model | CUDA Programming Guide v13.3; CUDA Runtime API 13.3.1 | `__global__`, execution configuration, one-dimensional global index, bounds checks, asynchronous launch, launch errors, completion synchronization, and host/device responsibilities | [Introduction to CUDA C++](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/intro-to-cuda-cpp.html), [Asynchronous Execution](https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html), [Runtime API](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html) |
| LAB02 runtime contract | Runtime API 11.8.0, 12.9.2/archive page label 12.9.1, and 13.3.1; Linux x86-64 | `cudaMalloc`, H2D/D2H copies, `cudaGetLastError`, `cudaDeviceSynchronize`, `cudaFree`, and three C++17 Lanes; no GPU runtime was recorded | [11.8 API](https://docs.nvidia.com/cuda/archive/11.8.0/cuda-runtime-api/index.html), [12.9.2 archive API](https://docs.nvidia.com/cuda/archive/12.9.2/cuda-runtime-api/index.html), [13.3 API](https://docs.nvidia.com/cuda/cuda-runtime-api/index.html) |
| Container identities | `11.8.0-devel-ubuntu22.04`, `12.9.2-devel-ubuntu24.04`, `13.3.1-devel-ubuntu24.04`; amd64/arm64 | Tags, manifest digests, and current amd64 child digests; they are EX02 Lane inputs and grant no Compile-Checked status by themselves | [11.8.0 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04), [12.9.2 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04), [13.3.1 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04) |

Toolkit components have been independently versioned since CUDA 11, so Toolkit, NVCC, a component such as cuBLAS, paired driver, and compatibility floor cannot collapse into one “CUDA version.” The Runtime API page under `archive/12.9.2` labels itself v12.9.1. The site preserves that documentation-label discrepancy and uses compilation in the exact 12.9.2 image to check EX02 interfaces without inferring unexecuted runtime behavior. The CUDA 13.3.1 Linux guide lists C++23 while the same-version NVCC `--std` reference still stops at C++20. The exact-image probe recorded GCC 13.3/NVCC 13.3.73 and observed that this configuration does not support `-std=c++23`, so its result is `unsupported`, not EX02 C++23 Compile-Checked.

Native Linux as the only Supported Environment, the two GPU Capability Tier gates, and the Reference Environment declaration criteria are public project policy. NVIDIA sources support underlying version and compute-capability facts but do not make the site's support commitment.

## Content and asset sources

- Home, O01, O02, O03, F01, LAB02, EX02, VIS01, VIS02, Exercises, solutions, five Practice Bank entries, term definitions, all three CSS grid/trace textures, theme-control marks, and Visual Explainer compositions are original project work under **CC BY 4.0** for prose and teaching compositions and **Apache-2.0** for code, models, styles, and tooling.
- This release contains no adapted diagram, copied sample code, external font, or third-party image. VIS01/VIS02 mirror or trace no owner diagram or table.
- Language and search interface icons come from the installed Starlight 0.41.7 package and are not copied into project source; the theme-control mark is original project CSS. The upstream Starlight package declares the MIT license.
- Technical links support publishing-interface verification. Public prose summarizes and paraphrases; it does not mirror owner documentation.

## Review record

**Reviewed: 2026-08-24.** npm 11.17.0 resolved the exact Astro 7.2.4, Starlight 0.41.7, Pagefind 1.5.2, Wrangler 4.125.0, Playwright 1.62.1, and axe-playwright 4.13.0 dependency set. F01/LAB02 canonical imports, Lab metadata, correctness contract, theme components, Visual Explainers, native controls, media queries, automated-accessibility limits, and the Workers Builds/Static Assets/Preview URL/`workers.dev` interfaces were reviewed against the sources above; automated results are not a WCAG conformance claim. [Run 32720214527](https://github.com/xiangzhang-coding/cuda-learning-site/actions/runs/32720214527) passed five EX02 checks on an x86-64 `ubuntu-24.04` runner and recorded Docker 28.0.4, Buildx 0.36.1, actual image/OS/compiler coordinates, and artifact hashes. The separate C++23 probe recorded `unsupported`. No CUDA binary ran, no performance result was recorded, and no Reference Environment was declared, so EX02/LAB02 runtime remains Pending Hardware Verification; VIS01/VIS02 browser state has no CUDA Evidence Status.
