<!-- SPDX-License-Identifier: Apache-2.0 -->

# Third-Party Notices

This project installs third-party packages to build and test the Learning Site. The packages remain under their own terms; the project licenses do not relicense them.

| Package | Exact version | Declared license | Owner source | Use in this release |
| --- | --- | --- | --- | --- |
| `astro` | 7.2.8 | MIT | <https://github.com/withastro/astro> | Static site generator; AVIF security patch |
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

## External cuFFT dependency, not bundled

Reviewed 2026-09-08 for issue #39. EX19 is original Apache-2.0 software calling cuFFT through an external CUDA installation; L12 and its related publication prose, Exercises, solutions, PB-R4-013/014, TERM-193/194, and `SRC-CUDA-073/074` are original CC BY 4.0 material. No NVIDIA SDK header, library, implementation, sample, dataset, diagram, or documentation copy is bundled or adapted. The three declared C++17 profiles independently pair Toolkit 11.8.0 / 12.9.2 / 13.3.1 with cuFFT 10.9.0.58 / 11.4.1.4 / 12.3.0.29; they are not installed site dependencies or successful-build claims.

NVIDIA Corporation & affiliates retains upstream rights. The [cuFFT reference-only rights ledger](CONTENT_LICENSES.md#cufft-reference-only-review) links the individually inspected 11.8.0, 12.9.2, and live 13.3 API Notices, archived 12.9.2 CUDA EULA/Toolkit supplement and CUDA FFT Library redistribution entries, and dated live release notes. Project licenses do not replace the terms applicable to a learner's installation. No upstream adaptation requires an added project `NOTICE` entry. Source review and host/build gates grant no CUDA compilation or runtime evidence; EX19 retains empty compilation and recorded observations and Pending Hardware Verification runtime.

## External cuSPARSE dependency, not bundled

Reviewed 2026-09-09 for issue #40. EX20 is original Apache-2.0 software calling an external cuSPARSE installation. L13, its Exercises and solutions, EX20 publication prose, PB-R4-015/016, TERM-195/196, and `SRC-CUDA-075/076` are original CC BY 4.0 teaching material. No NVIDIA SDK header, binary, implementation, sample, figure, or documentation copy is bundled or adapted.

The three C++17 profiles independently pair Toolkit 11.8.0 / 12.9.2 / 13.3.1 with cuSPARSE 11.7.5.86 / 12.5.10.65 / 12.8.2.51. NVIDIA retains its proprietary header and library rights under the [cuSPARSE license](https://developer.download.nvidia.com/compute/cuda/redist/libcusparse/LICENSE.txt). The [reference-only rights ledger](CONTENT_LICENSES.md#cusparse-reference-only-review) records exact archive coordinates and notice boundaries. Project licenses do not replace installation or redistribution terms; no upstream adaptation requires an added project `NOTICE` entry. Build gates grant no retained compilation or runtime evidence. EX20 remains Pending Hardware Verification.

## cuDNN references, not bundled

Reviewed 2026-09-07 for issue #38. cuDNN backend **9.24.0** and frontend **1.27.0**, commit **`f77fbc3d21be3f24cd0286b9b368105f7c518b8a`**, are independent external reading references, not installed dependencies, redistributed binaries, or successful-build claims. L10/L11, PB-R4-011/012, and TERM-191/192 use original prose, scenarios, tables, and solutions; no source, sample, test, diagram, or result is copied or adapted.

The [reference-only rights ledger](CONTENT_LICENSES.md#cudnn-reference-only-review) points to the full 20-file review with exact paths, SPDX licenses and individual copyright years, including MIT CMakeLists.txt and graph_properties.h. NVIDIA CORPORATION & AFFILIATES retains upstream rights. Frontend package metadata says `Apache-2.0 AND MIT`; per-file headers and separate LICENSE.txt, LICENSE-MIT.txt, LICENSING.md, NOTICE, and THIRD_PARTY_LICENSES.txt control reuse. Markdown docs without opening per-file SPDX headers are reference-only, not relicensed here. The [backend SDK EULA](https://docs.nvidia.com/deeplearning/cudnn/backend/v9.24.0/reference/eula.html) also covers documentation and its conditional runtime redistribution; frontend rights do not authorize mirroring backend binaries/manuals/diagrams. No adaptation requires an added project `NOTICE` entry. Source and owner-test inspection grants no compilation, GPU execution, observed engine, numerical, or performance evidence.

## CUTLASS C++ references, not bundled

Reviewed 2026-09-07 for issue #37. L08/L09, PB-R4-009/010, TERM-189/190, and `SRC-CUDA-069/070` use original prose, scenarios, derivations, and worked answers. [CUTLASS v4.7.0](https://github.com/NVIDIA/cutlass/releases/tag/v4.7.0), published 2026-08-13 at `dcf215af68a2d08d305076c152a06f201728cd53`, is a pinned external reading reference, not a new installed or redistributed package. No upstream source, sample, test, benchmark, diagram, or artifact is copied or adapted. Existing EX/Lab evidence remains unchanged.

The [19-file license ledger](CONTENT_LICENSES.md#cutlass-reference-only-review) records exact headers and tests, each with `SPDX-License-Identifier: BSD-3-Clause` and its complete first-30-line notice. Eighteen use copyright years 2017 - 2026; `include/cutlass/gemm/kernel/gemm_universal.hpp` uses 2023 - 2026. All identify NVIDIA CORPORATION & AFFILIATES and retain All rights reserved. Source redistribution must retain notices, conditions, and disclaimer; binary redistribution must reproduce them in accompanying materials; endorsement needs permission. These obligations do not replace project licenses or establish a whole-repository audit.

Pinned [LICENSE.txt](https://github.com/NVIDIA/cutlass/blob/dcf215af68a2d08d305076c152a06f201728cd53/LICENSE.txt) explicitly excepts `python/CuTeDSL`. The [Python DSL agreement](https://github.com/NVIDIA/cutlass/blob/dcf215af68a2d08d305076c152a06f201728cd53/media/docs/pythonDSL/license.rst), dated May 8, 2025, is an NVIDIA Software License Agreement, not BSD, and contains limited grants, redistribution and NVIDIA-GPU-purpose restrictions, and other-license provisions. This publication excludes DSL implementation, examples, packages, and artifacts. CuTe C++ is not CuTe Python DSL.

NVIDIA CUDA documentation remains under its own terms and is linked and independently paraphrased only. No adaptation requires a new project `NOTICE` entry. The support-policy review and proposed toolchain are not CUTLASS build, owner-test execution, GPU, instruction-inspection, or performance evidence.
