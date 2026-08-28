<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/components/`, `src/resource-indexes/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original EX01-EX06 Runnable Example source, build files, host models, and tests under `examples/`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual teaching compositions are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). This includes O04-O08 and their Exercises and solutions; F01-F08 and M01-M08 and their Exercises and solutions; the EX01-EX06 and LAB01-LAB03 publication pages; all 25 Practice Bank entries; all 86 Glossary terms and 36 source/version records; the four OrientationVisual compositions; the Compatibility Explorer composition; F04's static lifecycle table; and all eleven formal Visual Explainers: standalone VIS01-VIS07 plus embedded VIS19-VIS22. The public source contains exactly 93 Publication Pairs and 186 source routes. Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

## Adaptations

No adapted content or assets are included in this release. It contains no copied, traced, or adapted NVIDIA sample, figure, table, diagram, or prose; no copied sample listing, external font, or third-party image; and no private material. EX01-EX06 are original code rather than reconstructions of NVIDIA samples. F01/LAB02 and EX01/LAB01 render only declared ranges from their respective canonical projects; F03/F04 render declared ranges from the EX03 canonical project; F05/LAB03 render declared ranges from the EX04 canonical project; M02 renders from EX05; and M03/M04 render declared ranges from EX06 instead of duplicating source.

All prose, code, teaching tables, and tests added for the published curriculum are original. This includes the complete M01-M08 memory track and paired practice, the issue #15 EX05/EX06 and VIS04-VIS06 work, and the issue #16 M05-M08, PB-R1-017 through PB-R1-020, TERM-077 through TERM-086, SRC-CUDA-020/SRC-CUDA-021, VIS03, and VIS07 work. VIS01-VIS07 use standalone pages; VIS19-VIS22 keep static or textual fallbacks inside their Learning Units instead of adding four duplicate standalone pages. Every formal Visual Explainer is deterministic, browser-only, and grants no CUDA Evidence Status. No owner figure, example, source listing, timing, or runtime result was copied into VIS03 or VIS07. The OrientationVisual views, Compatibility Explorer, and F04 static lifecycle table likewise use original teaching compositions without creating evidence. Component and pure-model implementations under `src/components/` and `src/visuals/`, example software, styles, and tests are original software under Apache-2.0; instructional prose and rendered teaching compositions are original work covered by the page-level CC BY 4.0 declaration. Package-provided interface assets remain under their upstream terms and are recorded in `THIRD_PARTY_NOTICES.md`.

Original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
