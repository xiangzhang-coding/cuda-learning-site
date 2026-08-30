<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/r1-release-manifest.json`, `src/current-publication-manifest.json`, `src/components/`, `src/resource-indexes/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`, including generation and validation of both `release.json` and `publication.json`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original source, build files, host models, artifact-inspection tooling, and tests for the fifteen Runnable Examples EX01-EX14 and EX16 under `examples/`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments. JSON files use an `SPDX-License-Identifier` member.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual teaching compositions are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). This includes Home and O01-O08, with Exercises and solutions for O02-O08; F01-F08; M01-M19; A01-A07; Q01-Q05; the publication pages for EX01-EX14 and EX16; the six noncontiguous Labs LAB01-LAB05 and LAB07; all 48 Practice Bank entries; all 146 Glossary terms; all 59 source/version records; the four OrientationVisual compositions; the Compatibility Explorer composition; F04's static lifecycle table; and all fifteen formal Visual Explainers, standalone VIS01-VIS11 plus embedded VIS19-VIS22. The current public source contains exactly 178 bilingual Publication Pairs and 356 source routes. Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

The license scope follows `src/current-publication-manifest.json`. R1 remains the latest completed aggregate release review and its immutable historical scope remains in `src/r1-release-manifest.json`; the R2 aggregate review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

## Adaptations

No adapted content or assets are included in the current publication. It contains no copied, traced, or adapted NVIDIA sample, figure, table, diagram, prose, source listing, external font, third-party image, or owner asset, and no private material. EX01-EX14 and EX16 are original code rather than reconstructions of NVIDIA samples.

Learning Units and Lab pages render declared ranges from canonical projects rather than duplicating complete implementations. The issue #22 A05-A07, EX14, VIS11, PB-R2-017 through PB-R2-019, TERM-140 through TERM-146, and `SRC-CUDA-041` through `SRC-CUDA-043` additions are original. Their source review used current and archived CUDA owner documentation plus current cuDNN owner documentation and the cuDNN Frontend v1.27.0 owner release; no private material or copied owner example, source listing, figure, table, diagram, prose, or asset was used. EX14 is an original Apache-2.0 C++17 project with empty compilation evidence, Pending Hardware Verification runtime, and empty recorded observations. VIS11's controls, logical/physical tile model, and purpose-built static fallback are an original teaching composition with no CUDA Evidence Status. These additions publish no observed runtime or measured transpose, stencil, convolution, library comparison, timing, speedup, or other performance result.

VIS01-VIS11 use standalone pages; VIS19-VIS22 keep static or textual fallbacks inside their Learning Units instead of adding duplicate standalone pages. Every formal Visual Explainer is deterministic, browser-only, preserves a static or textual fallback, and grants no CUDA Evidence Status. The OrientationVisual views, Compatibility Explorer, and F04 static lifecycle table likewise use original teaching compositions without creating evidence. Component and pure-model implementations under `src/components/` and `src/visuals/`, example software, styles, and tests are original software under Apache-2.0; instructional prose and rendered teaching compositions are original work covered by the page-level CC BY 4.0 declaration. Package-provided interface assets remain under their upstream terms and are recorded in `THIRD_PARTY_NOTICES.md`.

Original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
