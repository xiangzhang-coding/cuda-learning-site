<!-- SPDX-License-Identifier: Apache-2.0 -->

# Dependency Review

- Review date: 2026-08-24
- Runtime: Node.js 24.19.0, npm 11.17.0
- Lock format: npm lockfile version 3
- Reviewed lock package records: 616, including optional platform packages
- Bundled package records: 0

Every non-root lock entry has an exact version, an npm registry tarball source, package integrity, and a declared license. Local links, mutable Git dependencies, non-registry tarballs, missing integrity, unknown licenses, and unreviewed install scripts fail `npm run quality:dependencies`.

## License expressions

The committed lockfile contains these reviewed SPDX expressions:

- `0BSD`
- `Apache-2.0`
- `Apache-2.0 AND LGPL-3.0-or-later`
- `Apache-2.0 AND LGPL-3.0-or-later AND MIT`
- `BSD-2-Clause`
- `BSD-3-Clause`
- `BlueOak-1.0.0`
- `CC0-1.0`
- `ISC`
- `LGPL-3.0-or-later`
- `MIT`
- `MPL-2.0`
- `Python-2.0`

MPL-2.0 applies to axe-core and Lightning CSS packages. LGPL combinations apply to optional Sharp/libvips platform packages. `argparse` declares Python-2.0. Project licenses do not relicense any of these packages.

## Install scripts

Only these exact lock entries declare install scripts:

- `esbuild@0.28.2`
- `fsevents@2.3.2`
- `vite/node_modules/fsevents@2.3.3`

The committed `.npmrc` and CI commands set `ignore-scripts=true`, so these lifecycle scripts are reviewed but not executed during installation. Any version or install-script set change requires a new source, license, and script review before the lockfile can pass.

## Packaged assets and binaries

- Pagefind 1.5.2 resolves its official optional platform binaries and supplies the extended Chinese segmenter used by the static index.
- Starlight-owned interface icons and Pagefind UI remain inside their MIT-licensed packages; no copy is maintained as a project asset.
- Optional Sharp platform packages retain their Apache/MIT/LGPL combinations and are build dependencies, not project-owned visual assets.
- Playwright browser revisions are downloaded by `playwright install`; they are not committed or included in site artifacts.
- No third-party font, diagram, sample listing, or image is copied into the Orientation source.

Direct dependency roles and owner repositories are listed in `THIRD_PARTY_NOTICES.md`. Exact transitive coordinates remain authoritative in `package-lock.json`.
