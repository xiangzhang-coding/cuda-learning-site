<!-- SPDX-License-Identifier: Apache-2.0 -->

# Third-Party Notices

This project installs third-party packages to build and test the Learning Site. The packages remain under their own terms; the project licenses do not relicense them.

| Package | Exact version | Declared license | Owner source | Use in this release |
| --- | --- | --- | --- | --- |
| `astro` | 7.2.4 | MIT | <https://github.com/withastro/astro> | Static site generator |
| `@astrojs/starlight` | 0.41.7 | MIT | <https://github.com/withastro/starlight> | Documentation layout, localization, navigation, UI icons, and search integration |
| `pagefind` | 1.5.2 | MIT | <https://github.com/Pagefind/pagefind> | Static multilingual search index |
| `@astrojs/mdx` | 7.0.7 | MIT | <https://github.com/withastro/astro> | Home-page composition |
| `@astrojs/markdown-remark` | 7.2.4 | MIT | <https://github.com/withastro/astro> | Markdown processing |
| `@astrojs/check` | 0.9.10 | MIT | <https://github.com/withastro/language-tools> | Source diagnostics |
| `typescript` | 6.0.3 | Apache-2.0 | <https://github.com/microsoft/TypeScript> | Type checking |
| `vitest` | 4.1.11 | MIT | <https://github.com/vitest-dev/vitest> | Integration tests |
| `@vitest/coverage-v8` | 4.1.11 | MIT | <https://github.com/vitest-dev/vitest> | V8 coverage |
| `linkedom` | 0.18.13 | ISC | <https://github.com/WebReflection/linkedom> | Built-HTML parsing in tests |
| `@playwright/test` | 1.62.1 | Apache-2.0 | <https://github.com/microsoft/playwright> | Browser tests |
| `@axe-core/playwright` | 4.13.0 | MPL-2.0 | <https://github.com/dequelabs/axe-core-npm> | Automated accessibility checks |
| `@types/node` | 24.13.3 | MIT | <https://github.com/DefinitelyTyped/DefinitelyTyped> | Node.js type declarations |
| `wrangler` | 4.125.0 | MIT OR Apache-2.0 | <https://github.com/cloudflare/workers-sdk/tree/wrangler%404.125.0/packages/wrangler> | Assets-only deployment validation and upload |

The production output carries this notice plus the complete project license texts and the exact Astro, Starlight, and Pagefind license notices for interfaces bundled into the static site. No upstream source file, documentation passage, diagram, or sample code is copied or adapted into project-owned content in this release. Exact transitive versions, sources, integrity values, declared licenses, install scripts, and bundled flags are reviewed from the committed npm lockfile by the repository quality checks.

## External cuBLAS dependency, not bundled

Reviewed 2026-09-06. EX18 and the LAB12 measurement helper are original Apache-2.0 code that calls NVIDIA cuBLAS through an external CUDA installation. L06/L07 and the related learning material are original CC BY 4.0 prose and derivations, not adaptations of NVIDIA samples. No cuBLAS binary, library source, SDK header, NVIDIA sample, or documentation copy is distributed in the website, project source, or learning assets.

The independently recorded components are cuBLAS 11.11.3.6 with Toolkit 11.8.0, 12.9.2.10 with Toolkit 12.9.2, and 13.6.0.2 with Toolkit 13.3.1. EX18 declares those three build profiles; LAB12 uses only the last measurement profile. These coordinates are not a new npm dependency, redistributed library, or successful-build claim.

NVIDIA Corporation & Affiliates retains the upstream rights. The [12.9.2 CUDA EULA and Toolkit supplement](https://docs.nvidia.com/cuda/archive/12.9.2/eula/index.html), including its associated-documentation and redistribution conditions, and API Notices for [11.8.0](https://docs.nvidia.com/cuda/archive/11.8.0/cublas/index.html#notices), [12.9.2](https://docs.nvidia.com/cuda/archive/12.9.2/cublas/index.html#notices), and the [current guide](https://docs.nvidia.com/cuda/cublas/index.html#notices) remain separate from project licenses. No project license replaces the terms applicable to a learner's installation. The [reference-only rights ledger](CONTENT_LICENSES.md#cublas-reference-only-review) records exact document coordinates and the explicitly dated current-document fallback for unavailable 13.3.1 archives. There is no upstream code adaptation requiring an added project `NOTICE` entry.
