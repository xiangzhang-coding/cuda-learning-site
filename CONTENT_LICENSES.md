<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/r1-release-manifest.json`, `src/r2-release-manifest.json`, `src/current-publication-manifest.json`, `src/components/`, `src/resource-indexes/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`, including generation and validation of both `release.json` and `publication.json`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original source, build files, host models, artifact-inspection tooling, and tests for the sixteen Runnable Examples EX01-EX16 under `examples/`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments. JSON files use an `SPDX-License-Identifier` member.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual teaching compositions are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). The current rolling scope includes 52 Learning Units, O01-O08/F01-F08/M01-M19/A01-A09/Q01-Q08; 16 Runnable Example publication pages, EX01-EX16; 8 Labs, LAB01-LAB08; all 53 Practice Bank entries; all 159 Glossary terms; all 65 source/version records; and 17 formal Visual Explainers, standalone VIS01-VIS12/VIS14 plus embedded VIS19-VIS22. The five catalog groups total 302 records, and the current public source contains exactly 198 bilingual Publication Pairs and 396 source routes. Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

The current file-level license scope follows the rolling `src/current-publication-manifest.json` and its `/publication.json` output. Issue #25 is an incremental publication, and R3 aggregate review remains pending. R2 is still the latest completed aggregate release review: immutable `src/r2-release-manifest.json` and `/release.json` retain 49 Learning Units, 16 Runnable Examples, 6 Labs, 16 Visual Explainers, 50 Practice Bank entries, 151 Glossary terms, 61 source records, 284 catalog records, 186 Publication Pairs, and 372 source routes. Immutable R1 history remains in `src/r1-release-manifest.json`, and [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) records dynamic R2 acceptance.

## Adaptations

No adapted content or assets are included in the current publication. It contains no copied, traced, or adapted NVIDIA sample, figure, table, diagram, prose, source listing, external font, third-party image, owner asset, or private material. EX01-EX16 are original code rather than reconstructions of NVIDIA samples.

The issue #23 A08-A09, EX15, VIS12, PB-R2-020/021, TERM-147 through TERM-151, and `SRC-CUDA-044/045` additions are original. EX15 is an original Apache-2.0 C++17 project with empty compilation evidence, Pending Hardware Verification runtime, and no recorded observations. VIS12's controls, hierarchy model, and static fallback are an original teaching composition. These additions publish no observed runtime or measured performance result.

The issue #25 Q06-Q08, LAB06/LAB08, VIS14, PB-R3-001 through PB-R3-003, TERM-152 through TERM-159, and `SRC-CUDA-046` through `SRC-CUDA-049` additions are also original. The profiler fixture policy is original Apache-2.0 tooling, while the two sanitized expected-only JSON fixtures are original CC BY 4.0 project-authored plans. They are not `nsys` or `ncu` captures and publish no runtime, timeline, metric, bottleneck, or speedup result. LAB06 and LAB08 have empty compilation and recorded-observation arrays and remain Pending Hardware Verification.

VIS01-VIS12 and VIS14 use standalone pages; VIS19-VIS22 keep static or textual fallbacks inside their Learning Units. Every formal Visual Explainer is deterministic, browser-only, preserves a fallback, and grants no CUDA Evidence Status. Component and pure-model implementations, example software, styles, and tests are original Apache-2.0 software; instructional prose and rendered teaching compositions are CC BY 4.0.

Original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
