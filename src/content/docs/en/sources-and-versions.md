---
title: Sources and Version Record
description: Publishing interfaces, CUDA version facts, content sources, and review dates for the current public routes and EX02.
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

This record names the exact publishing and theme interfaces behind CUDA Learning Site and the owner sources for O02/O03/EX02 CUDA facts. Tool versions, browser behavior, hardware capability, project support policy, and observed behavior remain separate.

## Scope of this record

This page covers Home, O01, O02, O03, their Exercises and solutions, EX02, the Practice Bank, Glossary, three visual themes, and the static publishing shell. Every link below was reopened on **2026-08-24**. Website builds use Node.js 24.19.0 and npm 11.17.0.

## Verified publishing interfaces

| Interface | Exact version | What was checked | Context7 | Owner sources |
| --- | --- | --- | --- | --- |
| Astro | 7.2.4 | Static-output configuration, processed TypeScript client scripts, and pre-paint `is:inline` scripts | `/withastro/docs` | [npm manifest](https://registry.npmjs.org/astro/7.2.4), [configuration reference](https://docs.astro.build/en/reference/configuration-reference/), [client-side scripts](https://docs.astro.build/en/guides/client-side-scripts/) |
| Starlight | 0.41.7 | Root locale, localized title, explicit sidebar, `Banner`/`ThemeProvider`/`ThemeSelect` component overrides, custom CSS, and cascade layers | `/withastro/starlight` | [npm manifest](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7), [component overrides](https://starlight.astro.build/guides/overriding-components/), [CSS and styling](https://starlight.astro.build/guides/css-and-tailwind/), [internationalization](https://starlight.astro.build/guides/i18n/#use-a-root-locale) |
| Pagefind | 1.5.2 | Language-partitioned indexes selected from `<html lang>` and extended Chinese segmentation | `/websites/pagefind_app` | [npm manifest](https://registry.npmjs.org/pagefind/1.5.2), [multilingual search](https://pagefind.app/docs/multilingual/) |
| Playwright and axe | 1.62.1; `@axe-core/playwright` 4.13.0 | Chromium/Firefox/WebKit projects, Mobile Safari device emulation, media and forced-color emulation, keyboard use, print, screenshots, and automated-accessibility limits | `/microsoft/playwright` (exact index currently through 1.61.0) | [Playwright manifest](https://registry.npmjs.org/%40playwright%2Ftest/1.62.1), [browser revisions](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json), [emulation](https://playwright.dev/docs/emulation), [accessibility testing](https://playwright.dev/docs/accessibility-testing), [axe manifest](https://registry.npmjs.org/%40axe-core%2Fplaywright/4.13.0) |
| Browser APIs and CSS media | Web Storage, Custom Elements, `prefers-reduced-motion`, `prefers-contrast`, `forced-colors`, and print | One theme preference, no-script fallback, reduced motion, increased contrast, system forced colors, and print coverage | Playwright Context7 cross-checks test interfaces; WHATWG/W3C specifications and MDN cover browser semantics | [HTML Web Storage](https://html.spec.whatwg.org/multipage/webstorage.html), [HTML Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html), [Media Queries 5](https://drafts.csswg.org/mediaqueries-5/), [CSS Color Adjustment](https://drafts.csswg.org/css-color-adjust-1/), [CSS Paged Media](https://www.w3.org/TR/css-page-3/), [MDN localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), [MDN media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media) |

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
| Container identities | `11.8.0-devel-ubuntu22.04`, `12.9.2-devel-ubuntu24.04`, `13.3.1-devel-ubuntu24.04`; amd64/arm64 | Tags, manifest digests, and current amd64 child digests; they are EX02 Lane inputs and grant no Compile-Checked status by themselves | [11.8.0 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/11.8.0-devel-ubuntu22.04), [12.9.2 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/12.9.2-devel-ubuntu24.04), [13.3.1 tag](https://hub.docker.com/v2/repositories/nvidia/cuda/tags/13.3.1-devel-ubuntu24.04) |

Toolkit components have been independently versioned since CUDA 11, so Toolkit, NVCC, a component such as cuBLAS, paired driver, and compatibility floor cannot collapse into one “CUDA version.” The Runtime API page under `archive/12.9.2` labels itself v12.9.1. The site preserves that documentation-label discrepancy and uses compilation in the exact 12.9.2 image to check EX02 interfaces without inferring unexecuted runtime behavior. The CUDA 13.3.1 Linux guide lists C++23 while the same-version NVCC `--std` reference still stops at C++20. The discrepancy remains a separate exact-environment probe and is not presented as passing before that probe succeeds.

Native Linux as the only Supported Environment, the two GPU Capability Tier gates, and the Reference Environment declaration criteria are public project policy. NVIDIA sources support underlying version and compute-capability facts but do not make the site's support commitment.

## Content and asset sources

- Home, O01, O02, O03, the EX02 page, Exercises, solutions, Practice Bank entries, term definitions, and all three CSS grid/trace textures and theme-control marks are original project work under **CC BY 4.0** for prose and **Apache-2.0** for code, styles, and tooling.
- This release contains no adapted diagram, copied sample code, external font, or third-party image.
- Language and search interface icons come from the installed Starlight 0.41.7 package and are not copied into project source; the theme-control mark is original project CSS. The upstream Starlight package declares the MIT license.
- Technical links support publishing-interface verification. Public prose summarizes and paraphrases; it does not mirror owner documentation.

## Review record

**Reviewed: 2026-08-24.** npm 11.17.0 resolved the exact Astro 7.2.4, Starlight 0.41.7, Pagefind 1.5.2, Playwright 1.62.1, and axe-playwright 4.13.0 dependency set. Theme components, Web Storage, media queries, device emulation, and automated-accessibility limits were reviewed against the sources above; automated results are not a WCAG conformance claim. Owner sources and container tags for CUDA 11.8.0, 12.9.2, and 13.3.1 were reviewed, but this release ran no CUDA, compiled no Lane, recorded no performance result, and declared no Reference Environment. The C++23 documentation discrepancy remains for a later exact-Lane probe.
