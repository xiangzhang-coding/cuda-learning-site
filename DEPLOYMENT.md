<!-- SPDX-License-Identifier: Apache-2.0 -->

# Cloudflare Deployment

The production Learning Site origin is <https://cuda-learning-site.hmzhangxiang.workers.dev>. R2 is the latest completed aggregate review. Its immutable snapshot contains 49 Learning Units, 16 Runnable Examples, 6 Labs, 16 Visual Explainers, 50 Practice Bank entries, 151 Glossary terms, 61 source records, 284 catalog records, 186 Publication Pairs, and 372 source routes; `src/r2-release-manifest.json` emits that contract as `/release.json`. The issue #30 rolling surface advances `src/current-publication-manifest.json` and `/publication.json` independently; R3 aggregate review remains pending.

Repository-pinned Wrangler from a clean `main` checkout is the only deployment authority. Cloudflare Workers Builds behavior was reviewed for R2, but account automation remains disabled; enabling it later must replace this flow rather than create a second authority. GitHub Actions produces independent web-quality, CUDA compilation, and remote smoke evidence without deploying the site.

## Static Architecture

`astro.config.mjs` emits static files into `dist/`. `wrangler.jsonc` names that directory as Cloudflare Static Assets and intentionally has no `main`, asset binding, route, service, KV, D1, R2, Durable Object, secret, variable, or runtime handler. No Worker application code or runtime binding is part of this deployment. The site has no API, authentication, database, server rendering, hosted GPU backend, or browser CUDA execution.

`npm run quality:deployment` runs Wrangler's dry-run parser against the built output and must report no bindings. Every build emits two source-bound records:

- `dist/release.json` copies the reviewed R2 contract from `src/r2-release-manifest.json` and adds the checked-out Git commit.
- `dist/publication.json` copies the exact rolling publication scope from `src/current-publication-manifest.json` and adds the same commit.

The first record is the immutable R2 release contract; the second describes the current artifact surface and can advance independently after R2. Neither record upgrades CUDA Evidence Status. Production also carries the project licenses and the Astro, Starlight, and Pagefind notices under `/legal/`.

The current issue #30 scope is 60 Learning Units O01-O08/F01-F08/M01-M19/A01-A11/A14/Q01-Q13, sixteen Runnable Examples EX01-EX16, ten Labs LAB01-LAB10, and nineteen Visual Explainers: standalone VIS01-VIS14/VIS18 plus embedded VIS19-VIS22. It also contains 64 Practice Bank entries, 170 Glossary terms, and 74 source records. The five catalog groups total 337 records; bilingual pages total 226 Publication Pairs and 452 source routes. L03/LAB11 and L06/LAB12 remain absent; LAB12 waits for L06 after Q13 publication.

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

Before accepting production, require successful `web-quality` and `cuda-compile-gate` checks for the same `main` commit. EX02, EX10, and LAB02 retain Compile-Checked evidence. EX11-EX15 retain empty compilation evidence and Pending Hardware Verification where runtime applies. LAB09 and LAB10 have empty compilation and recorded-observation arrays and remain Pending Hardware Verification. A10/A11 and Q11-Q13 are Learning Units with all four evidence arrays empty and grant no Evidence Status. EX10 is Runtime-Not-Applicable. No Reference Environment, Runtime-Verified subject, or performance observation is declared.

The issue #25 profiler fixture policy and both expected-only sanitized JSON fixtures are original project-authored planning artifacts. They are not `nsys` or `ncu` captures and provide no runtime, timeline, metric, bottleneck, or speedup result. Deploying or smoke-testing those static files does not change their evidence boundary.

Issue #26 adds no captured LAB09 evidence. Its compilation and recorded-observation arrays are empty, and its runtime remains Pending Hardware Verification. VIS13 browser values and static chart do not execute CUDA or query a GPU and cannot populate LAB09 evidence, `performanceObservations`, or a Reference Environment.

Issue #27 adds no captured EX14 or LAB10 evidence. Q11 starts from immutable EX14 and reuses VIS11, but its four empty Learning Unit evidence arrays inherit nothing from canonical source or browser arithmetic. It grants no Evidence Status and summarizes the linked EX14/LAB10 subjects, whose compilation and recorded-observation arrays are empty and whose runtime remains Pending Hardware Verification. LAB10's original expected-only JSON fixture and provenance sidecar describe a 4096x4096 `float` workload, a 134,221,952-byte conservative bound, one excluded warm-up, explicit synchronization, and ten-attempt median/min-max reduction. They are not `.ncu-rep` output and provide no timing, metric, speedup, bottleneck, winner, or runtime result.

Issue #28 adds no captured EX11 or Q12 evidence. Q12 starts from immutable EX11 and reuses VIS10; its four empty Learning Unit evidence arrays inherit nothing from source, the browser model, the static runner gate, or the expected-only fixture. EX11 remains Pending Hardware Verification. The Q12 fixture declares a 16,777,219-element workload, three excluded warm-ups, explicit synchronization, ten retained attempts, median/min-max statistics, profiler permissions, an unfilled Environment Manifest, expected correctness, and bounded interpretations. It is not `.ncu-rep` output and provides no numerical result, timing, metric, traffic, speedup, bottleneck, winner, CUB comparison, or runtime result. L03 and LAB11 remain unpublished.

Issue #29 adds no captured EX15 or Q13 evidence. Q13 starts from immutable EX15 and reuses VIS12; its four empty Learning Unit evidence arrays inherit nothing from source, the browser model, the static runner gate, or the expected-only fixture. EX15 remains Pending Hardware Verification. The Q13 fixture declares `1024x1024x1024` FP32 GEMM with double CPU accumulation, nonzero-beta C restoration, minimum compute capability 7.5, three excluded warm-ups, explicit synchronization, ten retained attempts, median/min-max statistics, compiler/resource and profiler custody, an unfilled Environment Manifest, expected correctness, and bounded interpretations. It is not `.ncu-rep` output and provides no matrix output, register count, occupancy, traffic metric, timing, speedup, bottleneck, winner, cuBLAS comparison, Tensor Core result, or runtime result. L06 and LAB12 remain unpublished; the educational kernel is not a production replacement.

Issue #30 adds no CUDA runtime evidence. A10/A11 use finite host arithmetic and static logical traffic ledgers only. VIS18 is a deterministic browser model with a purpose-built static SVG; it does not query a GPU or observe memory transactions. All three subjects have empty evidence arrays and publish no actual traffic, backend, dtype, timing, bandwidth, speedup, or winner.

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

For a Preview URL, set `RELEASE_BASE_URL` and `RELEASE_KIND="preview"`. The gate checks that `/release.json` remains the immutable R2 contract with 186 Publication Pairs, 372 source routes, and 284 catalog records while `/publication.json` matches the current issue #30 surface with 226 Publication Pairs and 452 source routes. It covers both locales, navigation/search, current catalog counts, A10/A11/VIS18 routes and graph edges, empty evidence arrays, legal notices, canonical metadata, and browser/network errors.

[Issue #18](https://github.com/xiangzhang-coding/cuda-learning-site/issues/18) remains the R1 dynamic acceptance record. [Issue #24](https://github.com/xiangzhang-coding/cuda-learning-site/issues/24) records immutable R2 acceptance. [Issue #30](https://github.com/xiangzhang-coding/cuda-learning-site/issues/30) records the current incremental publication; it is not a completed R3 aggregate review. Source files deliberately do not pre-certify dynamic coordinates.

## Rollback

If production smoke or a required GitHub check fails, do not describe the publication as accepted. In Cloudflare, select the last accepted version and roll it back to 100% traffic, or run:

```sh
npx wrangler rollback <accepted-version-id> --message "Restore last accepted static publication"
```

Rollback creates a new deployment. Re-run `npm run test:release-smoke` with the restored version's source commit and record both the failed deployment and rollback deployment in the applicable public issue.
