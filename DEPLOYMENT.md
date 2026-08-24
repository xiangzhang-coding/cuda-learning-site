<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cloudflare Deployment

The production Learning Site is <https://cuda-learning-site.hmzhangxiang.workers.dev>. Cloudflare Workers Builds is the only deployment authority. GitHub Actions produces the independent web-quality and CUDA compilation evidence; it does not deploy a second copy of the site.

## Static Architecture

`astro.config.mjs` emits static files into `dist/`. `wrangler.jsonc` names that directory as Cloudflare Static Assets and intentionally has no `main`, asset binding, route, service, KV, D1, R2, Durable Object, secret, variable, or runtime handler. No Worker application code or runtime binding is part of this deployment. The site has no API, authentication, database, server rendering, hosted GPU backend, or browser CUDA execution.

`npm run quality:deployment` runs Wrangler's dry-run parser against the built output. It must report no bindings. `dist/release.json` records `WORKERS_CI_COMMIT_SHA` in Workers Builds and falls back to the checked-out Git commit elsewhere. Production also carries the project licenses and the Astro, Starlight, and Pagefind notices under `/legal/`.

## Workers Builds Settings

- Production branch: `main`
- Root directory: `/`
- Build command: `npm run build:release`
- Production deploy command: `npm run deploy`
- Preview deploy command: `npm run deploy:preview`
- Non-production branch builds: enabled for explicit release-preview branches
- Node.js: `24.19.0` from `.node-version`
- npm: `11.17.0` from `packageManager` and the package engine contract

The build command checks source/privacy boundaries, the exact lockfile and licenses, canonical imports, diagnostics, unit tests, static output, Wrangler's assets-only schema, built-output integration tests, and generated artifacts. The pinned Wrangler `4.125.0` is resolved from this repository rather than a mutable global or `latest` tag.

Workers Builds production deploys use `wrangler deploy`. Non-production builds use `wrangler versions upload`, which uploads a version without promoting it and exposes a public Preview URL because `preview_urls` is explicitly enabled. Internal links stay on the preview host, while canonical, hreflang, sitemap, and release metadata continue to identify the production `workers.dev` origin.

## Acceptance

Before accepting a production deployment, require successful `web-quality` and `cuda-compile-gate` checks for the same `main` commit. A web check grants no CUDA Evidence Status. The CUDA matrix grants only the recorded Compile-Checked statuses; EX02 and LAB02 runtime remain Pending Hardware Verification unless separate qualifying evidence exists.

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

For a Preview URL, use that public version or branch URL as `RELEASE_BASE_URL` and set `RELEASE_KIND="preview"`. The gate checks source identity, both locales, navigation, direct locale switching, relevant bilingual search, all themes and persistence, keyboard flow, reduced motion, mobile reflow, print and no-script Visual Explainer fallbacks, the immutable EX02 download, legal notices, 404 behavior, canonical metadata, and browser/network errors.

After smoke passes, record the Git commit, GitHub check runs, Cloudflare build UUID, version ID, deployment ID, production URL, Preview URL, and smoke result in the release issue. Scan retained smoke reports before publishing them.

## Rollback

If production smoke or a required GitHub check fails, do not describe the release as accepted. In Cloudflare, select the last accepted version and roll it back to 100% traffic, or run:

```sh
npx wrangler rollback <accepted-version-id> --message "Restore last accepted static release"
```

Rollback creates a new deployment. Re-run `npm run test:release-smoke` with the restored version's source commit and record both the failed deployment and rollback deployment in the issue.
