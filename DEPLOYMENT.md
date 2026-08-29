<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cloudflare Deployment

The production Learning Site is <https://cuda-learning-site.hmzhangxiang.workers.dev>. R1 uses the repository-pinned Wrangler from a clean `main` checkout as its only deployment authority. Cloudflare Workers Builds behavior was reviewed but account automation is disabled for R1; enabling it later must replace this flow rather than create a second deploy authority. GitHub Actions produces independent web-quality, CUDA compilation, and remote smoke evidence without deploying the site. R2 and later curriculum material is outside the R1 release.

## Static Architecture

`astro.config.mjs` emits static files into `dist/`. `wrangler.jsonc` names that directory as Cloudflare Static Assets and intentionally has no `main`, asset binding, route, service, KV, D1, R2, Durable Object, secret, variable, or runtime handler. No Worker application code or runtime binding is part of this deployment. The site has no API, authentication, database, server rendering, hosted GPU backend, or browser CUDA execution.

`npm run quality:deployment` runs Wrangler's dry-run parser against the built output. It must report no bindings. `dist/release.json` copies the reviewed R1 scope, compatibility matrix, evidence inventory, and known limitations from `src/r1-release-manifest.json`, then records the checked-out Git commit. It also accepts `WORKERS_CI_COMMIT_SHA` if Workers Builds replaces the manual authority in a future release. Production carries the project licenses and the Astro, Starlight, and Pagefind notices under `/legal/`.

## Release Settings

- Source branch: clean, protected `main`
- Working directory: repository root
- Build command: `npm run build:release`
- Production deploy command: `npm run deploy`
- Preview deploy command: `npm run deploy:preview`
- Workers Builds: reviewed, disabled for R1
- Node.js: `24.19.0` from `.node-version`
- npm: `11.17.0` from `packageManager` and the package engine contract

The build command checks source/privacy boundaries, the exact lockfile and licenses, canonical imports, diagnostics, unit tests, static output, Wrangler's assets-only schema, built-output integration tests, and generated artifacts. The pinned Wrangler `4.125.0` is resolved from this repository rather than a mutable global or `latest` tag.

`npm run deploy` invokes `wrangler deploy` for production. `npm run deploy:preview` invokes `wrangler versions upload`, which uploads a version without promoting it and exposes a public Preview URL because `preview_urls` is explicitly enabled. Both commands first reject tracked or untracked source changes and a stale or altered `dist/release.json`; production additionally requires the checked-out branch to be `main`. Internal links stay on the preview host, while canonical, hreflang, sitemap, and release metadata continue to identify the production `workers.dev` origin.

## Acceptance

Before accepting a production deployment, require successful `web-quality` and `cuda-compile-gate` checks for the same `main` commit. A web check grants no CUDA Evidence Status. The CUDA matrix grants only the recorded Compile-Checked statuses; every R1 Runnable Example and Lab remains Pending Hardware Verification unless separate qualifying evidence exists.

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

For a Preview URL, use that public version or branch URL as `RELEASE_BASE_URL` and set `RELEASE_KIND="preview"`. The gate checks the R1 release manifest and source identity, both locales, navigation, direct locale switching, relevant bilingual search, all themes and persistence, keyboard flow, reduced motion, mobile reflow, print and no-script Visual Explainer fallbacks, canonical Runnable Example sources and downloads, legal notices, 404 behavior, canonical metadata, and browser/network errors.

After smoke passes, record the Git commit, GitHub check runs, Cloudflare version and deployment IDs, production URL, Preview URL, and smoke result in [issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18). Scan retained smoke reports before publishing them.

## Rollback

If production smoke or a required GitHub check fails, do not describe the release as accepted. In Cloudflare, select the last accepted version and roll it back to 100% traffic, or run:

```sh
npx wrangler rollback <accepted-version-id> --message "Restore last accepted static release"
```

Rollback creates a new deployment. Re-run `npm run test:release-smoke` with the restored version's source commit and record both the failed deployment and rollback deployment in the issue.
