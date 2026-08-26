<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/components/`, `src/resource-indexes/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original EX01, EX02, and EX03 Runnable Example source, build files, models, and tests under `examples/`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual teaching compositions are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). This includes O04-O08 and their Exercises and solutions; F01-F04 and their Exercises and solutions; the EX01-EX03 and LAB01/LAB02 publication pages; all thirteen Practice Bank entries; the expanded Glossary and source/version records; the four OrientationVisual compositions; the Compatibility Explorer composition; and F04's static lifecycle table. Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

## Adaptations

No adapted content or assets are included in this release. It contains no adapted NVIDIA sample, figure, table, or diagram; no copied sample listing, external font, or third-party image; and no private material. EX01-EX03 are original code rather than reconstructions of NVIDIA samples. F01/LAB02 and EX01/LAB01 render only declared ranges from their respective canonical projects, while F03/F04 render declared ranges from the shared EX03 canonical project instead of duplicating source.

All prose, code, the F04 lifecycle table, and tests added for F02-F04, EX03, the three new Practice Bank entries, the expanded Glossary, and the expanded source records are original. VIS01 and VIS02 are reused original Visual Explainers; F04's original static lifecycle table is not a new Visual Explainer and grants no CUDA evidence. The OrientationVisual views and Compatibility Explorer likewise use original teaching compositions. New source, components, models, styles, and tests are original software under Apache-2.0; instructional prose and rendered teaching compositions are original work covered by the page-level CC BY 4.0 declaration. Package-provided interface assets remain under their upstream terms and are recorded in `THIRD_PARTY_NOTICES.md`.

Original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
