<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/r1-release-manifest.json`, `src/current-publication-manifest.json`, `src/components/`, `src/resource-indexes/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`, including generation and validation of both `release.json` and `publication.json`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original source, build files, host models, artifact-inspection tooling, and tests for the eleven Runnable Examples EX01-EX10 and EX16 under `examples/`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments. JSON files use an `SPDX-License-Identifier` member.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual teaching compositions are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). This includes Home and O01-O08, with Exercises and solutions for O02-O08; F01-F08; M01-M19; Q01/Q03-Q05; the publication pages for EX01-EX10 and EX16; the six noncontiguous Labs LAB01-LAB05 and LAB07; all 40 Practice Bank entries; all 125 Glossary terms; all 50 source/version records; the four OrientationVisual compositions; the Compatibility Explorer composition; F04's static lifecycle table; and all thirteen formal Visual Explainers, standalone VIS01-VIS09 plus embedded VIS19-VIS22. The current public source contains exactly 148 bilingual Publication Pairs and 296 source routes. Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

The license scope follows `src/current-publication-manifest.json`. R1 remains the latest completed aggregate release review and its immutable historical scope remains in `src/r1-release-manifest.json`; the R2 aggregate review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

## Adaptations

No adapted content or assets are included in the current publication. It contains no copied, traced, or adapted NVIDIA sample, figure, table, diagram, prose, source listing, external font, or third-party image, and no private material. EX01-EX10 and EX16 are original code rather than reconstructions of NVIDIA samples.

Learning Units and Lab pages render declared ranges from canonical projects rather than duplicating complete implementations. The issue #19 M09-M14, EX07-EX09, VIS08, PB-R2-001 through PB-R2-006, TERM-096 through TERM-114, and SRC-CUDA-025 through SRC-CUDA-030 work is original. The current M15-M19, EX10, VIS09, PB-R2-007 through PB-R2-011, TERM-115 through TERM-125, and SRC-CUDA-031 through SRC-CUDA-035 work is likewise original. EX10's source, build graph, artifact inspection, evidence recorder, six retained evidence records, and GCC 14 C++23 probe are original Apache-2.0 software. Its five ordinary records from run 33271481405 are Compile-Checked; its acceptance boundary executes neither the final host artifact nor a GPU executable, so runtime remains Runtime-Not-Applicable. The separate C++23 probe is a narrow pass only and creates no ordinary C++23, runtime, or performance claim. VIS09's host/device branches, target-plan views, artifact flow, controls, and static fallback are an original teaching composition. These additions contain no copied owner example or figure and publish no measured overlap, migration, graph performance, timing, speedup, or other runtime result.

VIS01-VIS09 use standalone pages; VIS19-VIS22 keep static or textual fallbacks inside their Learning Units instead of adding duplicate standalone pages. Every formal Visual Explainer is deterministic, browser-only, and grants no CUDA Evidence Status. The OrientationVisual views, Compatibility Explorer, and F04 static lifecycle table likewise use original teaching compositions without creating evidence. Component and pure-model implementations under `src/components/` and `src/visuals/`, example software, styles, and tests are original software under Apache-2.0; instructional prose and rendered teaching compositions are original work covered by the page-level CC BY 4.0 declaration. Package-provided interface assets remain under their upstream terms and are recorded in `THIRD_PARTY_NOTICES.md`.

Original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
