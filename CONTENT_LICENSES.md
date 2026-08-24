<!-- SPDX-License-Identifier: Apache-2.0 -->

# Content and File Licenses

## Apache-2.0

Website source, configuration, styles, test tooling, and scripts are licensed under the [Apache License 2.0](LICENSE).

This scope includes:

- `astro.config.mjs`, `src/content.config.ts`, `src/components/`, `src/styles/`, `src/visuals/`, and `src/theme-contract.ts`
- `scripts/` and `tests/`
- `.github/` repository automation and templates
- root TypeScript, Vitest, Playwright, and package configuration
- original Runnable Example code under `examples/`

Source files in these areas carry `SPDX-License-Identifier: Apache-2.0` where their format supports comments.

## CC BY 4.0

Original instructional prose in `src/content/docs/` and original visual assets are licensed under the [Creative Commons Attribution 4.0 International Public License](LICENSE-CONTENT). Every Markdown or MDX file declares `license: CC-BY-4.0` and `provenance: original` in frontmatter.

Attribution: **CUDA Learning Site, Xiang Zhang, 2026** with a link to the page or repository.

## Adaptations

No adapted content or assets are included in this release. It contains no copied diagram, sample listing, external font, or third-party image. EX02 is original code rather than a reconstruction of an NVIDIA sample. F01 and LAB02 render only declared EX02 marker ranges and link to the pinned canonical project instead of duplicating source. VIS01 and VIS02 use original HTML/CSS visual compositions, model code, worked values, and annotations; no owner figure or table is mirrored or traced. The three CSS textures, theme-control mark, Visual Explainer components, models, and styling are original software under Apache-2.0, while their instructional prose and rendered teaching composition are covered by the page-level CC BY 4.0 declaration. Package-provided interface assets remain under their upstream terms and are recorded in `THIRD_PARTY_NOTICES.md`.

Original, upstream, or adapted files under `src/assets/`, `public/assets/`, `third_party/`, and the root favicon require an adjacent `<filename>.license.json` sidecar:

- Every sidecar records `license`, `provenance`, and `attribution`.
- `provenance: original` visual assets use `CC-BY-4.0`.
- Upstream and adapted assets also record `source`, `release`, `upstreamFile`, and required `notices`.
- Adapted assets additionally record `modifications`.

The file-level license check rejects an asset or orphaned sidecar that does not meet this contract.
