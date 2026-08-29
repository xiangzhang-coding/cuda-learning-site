<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cloudflare Deployment

The production Learning Site origin is <https://cuda-learning-site.hmzhangxiang.workers.dev>. R1 remains the latest completed aggregate release review and its reviewed artifact is an immutable historical subset. The current source tree builds 148 Publication Pairs and 296 source routes, recorded by `src/current-publication-manifest.json` without calling that incremental publication a completed R2 review. Production may claim that current surface only after the exact `main` commit passes the acceptance steps below. The R2 aggregate review remains pending in [issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24).

Repository-pinned Wrangler from a clean `main` checkout is the only deployment authority. Cloudflare Workers Builds behavior was reviewed for R1, but account automation remains disabled; enabling it later must replace this flow rather than create a second authority. GitHub Actions produces independent web-quality, CUDA compilation, and remote smoke evidence without deploying the site.

## Static Architecture

`astro.config.mjs` emits static files into `dist/`. `wrangler.jsonc` names that directory as Cloudflare Static Assets and intentionally has no `main`, asset binding, route, service, KV, D1, R2, Durable Object, secret, variable, or runtime handler. No Worker application code or runtime binding is part of this deployment. The site has no API, authentication, database, server rendering, hosted GPU backend, or browser CUDA execution.

`npm run quality:deployment` runs Wrangler's dry-run parser against the built output and must report no bindings. Every build emits two source-bound records:

- `dist/release.json` copies the immutable reviewed R1 contract from `src/r1-release-manifest.json` and adds the checked-out Git commit.
- `dist/publication.json` copies the exact current incremental scope from `src/current-publication-manifest.json` and adds the same commit.

The first record remains the reviewed R1 subset; the second describes the current artifact surface. Neither record upgrades CUDA Evidence Status. Production also carries the project licenses and the Astro, Starlight, and Pagefind notices under `/legal/`.

The current scope is 39 Learning Units through M19, eleven Runnable Examples EX01-EX10/EX16, six Labs, thirteen Visual Explainers, 40 Practice Bank entries, 125 Glossary terms, and 50 source records. The five catalog groups total 234 records; the bilingual pages total 148 Publication Pairs and 296 source routes. EX11-EX15 remain absent, and the Lab scope remains LAB01-LAB05/LAB07 with no LAB06 destination.

## Release Settings

- Source branch: clean, protected `main`
- Working directory: repository root
- Build command: `npm run build:release`
- Production deploy command: `npm run deploy`
- Preview deploy command: `npm run deploy:preview`
- Workers Builds: reviewed, disabled for R1
- Current deployment authority: repository-pinned Wrangler
- Node.js: `24.19.0` from `.node-version`
- npm: `11.17.0` from `packageManager` and the package engine contract

The build command checks source/privacy boundaries, the exact lockfile and licenses, canonical imports, diagnostics, unit tests, static output, Wrangler's assets-only schema, built-output integration tests, and generated artifacts. The pinned Wrangler `4.125.0` is resolved from this repository rather than a mutable global or `latest` tag.

`npm run deploy` invokes `wrangler deploy` for production. `npm run deploy:preview` invokes `wrangler versions upload`, which uploads a version without promoting it and exposes a public Preview URL because `preview_urls` is explicitly enabled. Both commands first reject tracked or untracked source changes, require `dist/release.json` and `dist/publication.json` to match their source manifests exactly, and require both generated records to name the current `HEAD`. Production additionally requires the checked-out branch to be `main`. Internal links stay on the preview host, while canonical, hreflang, sitemap, and publication metadata continue to identify the production `workers.dev` origin.

## Acceptance

Before accepting a production deployment, require successful `web-quality` and `cuda-compile-gate` checks for the same `main` commit. A web check grants no CUDA Evidence Status. Only EX02 and LAB02 retain Compile-Checked evidence. EX01-EX09, EX16, and every current Lab remain Pending Hardware Verification; EX10 is Runtime-Not-Applicable because its acceptance contract executes neither the final host artifact nor a GPU executable. EX10 artifact-pipeline checks and the separate CUDA 13.3/GCC 14 C++23 probe remain pending committed qualifying records and grant no Compile-Checked claim. The current publication declares no Reference Environment, Runtime-Verified subject, or performance observation and records no measured overlap, migration, or graph performance.

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

For a Preview URL, use that public version or branch URL as `RELEASE_BASE_URL` and set `RELEASE_KIND="preview"`. The gate separately checks that `/release.json` remains the R1 contract and `/publication.json` matches the current 148 Publication Pairs and 296 source routes. It also checks both locales, current navigation and search, all current routes and catalog counts, themes and persistence, keyboard flow, reduced motion, mobile reflow, print and no-script Visual Explainer fallbacks including VIS08/VIS09, Runnable Example source/download links including EX07-EX10, retained archive contents for projects already pinned to canonical source commits, EX10's Runtime-Not-Applicable and pending-repin boundary, legal notices, 404 behavior, canonical metadata, and browser/network errors.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the R1 dynamic acceptance record. Record current incremental publication evidence without rewriting that accepted history. Issue #24 tracks the pending R2 aggregate review; a successful incremental deployment or smoke run does not by itself complete R2.

## Rollback

If production smoke or a required GitHub check fails, do not describe the publication as accepted. In Cloudflare, select the last accepted version and roll it back to 100% traffic, or run:

```sh
npx wrangler rollback <accepted-version-id> --message "Restore last accepted static publication"
```

Rollback creates a new deployment. Re-run `npm run test:release-smoke` with the restored version's source commit and record both the failed deployment and rollback deployment in the applicable public issue.
