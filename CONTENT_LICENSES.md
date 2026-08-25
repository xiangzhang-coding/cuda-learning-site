<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/components/`, `src/resource-indexes/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original EX01 and EX02 Runnable Example source, build files, models, and tests under `examples/`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual teaching compositions are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). This includes O04-O08 and their Exercises and solutions, the EX01 and LAB01 publication pages, all ten Practice Bank entries, the four new OrientationVisual compositions, and the Compatibility Explorer composition. Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

## Adaptations

No adapted content or assets are included in this release. It contains no adapted diagram, copied sample listing, external font, or third-party image. EX01 and EX02 are original code rather than reconstructions of NVIDIA samples. F01/LAB02 and EX01/LAB01 render only the declared marker ranges from their respective canonical projects instead of duplicating source. VIS01, VIS02, the four OrientationVisual views, and the Compatibility Explorer use original HTML/CSS teaching compositions, components, model code, styles, tests, worked values, and annotations; no owner figure or table is mirrored, traced, or adapted. EX01 source and all new components, models, styles, and tests are original software under Apache-2.0. Their instructional prose and rendered teaching compositions are original work covered by the page-level CC BY 4.0 declaration. Package-provided interface assets remain under their upstream terms and are recorded in `THIRD_PARTY_NOTICES.md`.

Original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
