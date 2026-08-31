<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cloudflare Deployment

The production Learning Site origin is <https://cuda-learning-site.hmzhangxiang.workers.dev>. R2 is the latest completed aggregate review. Its 186 Publication Pairs and 372 source routes are recorded by `src/r2-release-manifest.json`; `src/current-publication-manifest.json` matches that surface at the release boundary and records R3 as pending. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) remains the dynamic R2 acceptance record. R3 and later material is outside this release.

Repository-pinned Wrangler from a clean `main` checkout is the only deployment authority. Cloudflare Workers Builds behavior was reviewed for R2, but account automation remains disabled; enabling it later must replace this flow rather than create a second authority. GitHub Actions produces independent web-quality, CUDA compilation, and remote smoke evidence without deploying the site.

## Static Architecture

`astro.config.mjs` emits static files into `dist/`. `wrangler.jsonc` names that directory as Cloudflare Static Assets and intentionally has no `main`, asset binding, route, service, KV, D1, R2, Durable Object, secret, variable, or runtime handler. No Worker application code or runtime binding is part of this deployment. The site has no API, authentication, database, server rendering, hosted GPU backend, or browser CUDA execution.

`npm run quality:deployment` runs Wrangler's dry-run parser against the built output and must report no bindings. Every build emits two source-bound records:

- `dist/release.json` copies the reviewed R2 contract from `src/r2-release-manifest.json` and adds the checked-out Git commit.
- `dist/publication.json` copies the exact rolling publication scope from `src/current-publication-manifest.json` and adds the same commit.

The first record is the immutable R2 release contract; the second describes the current artifact surface and can advance independently after R2. Neither record upgrades CUDA Evidence Status. Production also carries the project licenses and the Astro, Starlight, and Pagefind notices under `/legal/`.

The current scope is 49 Learning Units O01-O08/F01-F08/M01-M19/A01-A09/Q01-Q05, sixteen Runnable Examples EX01-EX16, six Labs, sixteen Visual Explainers, 50 Practice Bank entries, 151 Glossary terms, and 61 source records. The five catalog groups total 284 records; bilingual pages total 186 Publication Pairs and 372 source routes. LAB12 remains absent until Q13 and L06 are published.

## Release Settings

- Source branch: clean, protected `main`
- Working directory: repository root
- Build command: `npm run build:release`
- Production deploy command: `npm run deploy`
- Preview deploy command: `npm run deploy:preview`
- Workers Builds: reviewed, disabled for R2
- Current deployment authority: repository-pinned Wrangler
- Node.js: `24.19.0` from `.node-version`
- npm: `11.17.0` from `packageManager` and the package engine contract

The build command checks source/privacy boundaries, the exact lockfile and licenses, canonical imports, diagnostics, unit tests, static output, Wrangler's assets-only schema, built-output integration tests, and generated artifacts. The pinned Wrangler `4.125.0` is resolved from this repository rather than a mutable global or `latest` tag.

`npm run deploy` invokes `wrangler deploy` for production. `npm run deploy:preview` invokes `wrangler versions upload`, which uploads a version without promoting it and exposes a public Preview URL because `preview_urls` is explicitly enabled. Both commands first reject tracked or untracked source changes, require `dist/release.json` and `dist/publication.json` to match their source manifests exactly, and require both generated records to name the current `HEAD`. Production additionally requires the checked-out branch to be `main`. Internal links stay on the preview host, while canonical, hreflang, sitemap, and publication metadata continue to identify the production `workers.dev` origin.

## Acceptance

Before accepting production, require successful `web-quality` and `cuda-compile-gate` checks for the same `main` commit. EX02, EX10, and LAB02 retain Compile-Checked evidence. EX01-EX09, EX11-EX16, and every current Lab remain Pending Hardware Verification; EX11-EX15 have empty compilation evidence and no Compile-Checked claim. EX10 is Runtime-Not-Applicable. No Reference Environment, Runtime-Verified subject, or performance observation is declared.

Run the remote browser gate against the exact deployed source:

```sh
RELEASE_BASE_URL="https://cuda-learning-site.hmzhangxiang.workers.dev" \
RELEASE_SOURCE_COMMIT="<40-character-main-commit>" \
RELEASE_KIND="production" \
npm run test:release-smoke
```

If the maintainer network cannot reach `workers.dev`, dispatch the same gate on an independent GitHub-hosted runner. This workflow is smoke-only and has no Cloudflare credential or deploy command:

```sh
gh workflow run release-smoke.yml --ref main \
  -f base_url="https://cuda-learning-site.hmzhangxiang.workers.dev" \
  -f release_kind="production" \
  -f source_commit="<40-character-main-commit>"
```

For a Preview URL, set `RELEASE_BASE_URL` and `RELEASE_KIND="preview"`. The gate checks that `/release.json` is the R2 contract and `/publication.json` matches 186 Publication Pairs and 372 source routes. It covers both locales, navigation/search, catalog counts, VIS08-VIS12 accessibility and fallbacks, EX07-EX15 source/download links, complete downloaded-archive leak scans, EX11-EX15 evidence boundaries, legal notices, canonical metadata, and browser/network errors.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the R1 dynamic acceptance record. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) records the final protected-`main` checks, exact Preview and production identities, artifact hashes, and both remote smoke results for R2. Source files deliberately do not pre-certify those dynamic coordinates. R3 and later work requires its own review.

## Rollback

If production smoke or a required GitHub check fails, do not describe the publication as accepted. In Cloudflare, select the last accepted version and roll it back to 100% traffic, or run:

```sh
npx wrangler rollback <accepted-version-id> --message "Restore last accepted static publication"
```

Rollback creates a new deployment. Re-run `npm run test:release-smoke` with the restored version's source commit and record both the failed deployment and rollback deployment in the applicable public issue.
