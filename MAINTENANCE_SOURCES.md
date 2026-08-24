<!-- SPDX-License-Identifier: Apache-2.0 -->

# Maintenance Source Record

- Review date: 2026-08-24
- Scope: public repository baseline and web quality CI

Context7 was used for current interface discovery. Exact package manifests, tagged owner source, action tags/commits, and versioned owner documentation govern the selected versions when a current Context7 index lags the selected patch.

| Interface | Exact coordinate | Context7 | Owner sources reviewed |
| --- | --- | --- | --- |
| Node.js and npm | Node.js 24.19.0 LTS Krypton; npm 11.17.0 | `/websites/nodejs_latest-v24_x_api` | [Node release index](https://nodejs.org/dist/index.json), [Node 24.19.0 API](https://nodejs.org/dist/v24.19.0/docs/api/), [npm 11 lockfile](https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json), [npm ci](https://docs.npmjs.com/cli/v11/commands/npm-ci) |
| Astro and Starlight | Astro 7.2.4; Starlight 0.41.7 | `/withastro/docs`, `/withastro/starlight` | [Astro manifest](https://registry.npmjs.org/astro/7.2.4), [Astro configuration](https://docs.astro.build/en/reference/configuration-reference/), [Starlight manifest](https://registry.npmjs.org/%40astrojs%2Fstarlight/0.41.7), [Starlight configuration](https://starlight.astro.build/reference/configuration/) |
| Vitest | Vitest and V8 coverage 4.1.11 | `/vitest-dev/vitest` (current exact index available through 4.1.6) | [Vitest manifest](https://registry.npmjs.org/vitest/4.1.11), [coverage manifest](https://registry.npmjs.org/%40vitest%2Fcoverage-v8/4.1.11), [coverage guide](https://vitest.dev/guide/coverage) |
| Playwright | Playwright Test 1.62.1 | `/microsoft/playwright` (current exact index available through 1.61.0) | [package manifest](https://registry.npmjs.org/%40playwright%2Ftest/1.62.1), [browser revisions](https://github.com/microsoft/playwright/blob/v1.62.1/packages/playwright-core/browsers.json), [CI guide](https://playwright.dev/docs/ci), [test configuration](https://playwright.dev/docs/test-configuration) |
| axe-playwright | 4.13.0; axe-core `~4.13.0` | Playwright accessibility guidance above | [package manifest](https://registry.npmjs.org/%40axe-core%2Fplaywright/4.13.0), [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing) |
| GitHub Actions | `ubuntu-24.04`; current reviewed image `20260816.277.1`; least-privilege workflow token; full-SHA action pins | `/websites/github_en_actions`, `/actions/runner-images` | [workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax), [Ubuntu 24.04 image release](https://github.com/actions/runner-images/releases/tag/ubuntu24/20260816.277), action tags and commits listed below |

## Immutable action coordinates

| Action | Release | Commit SHA |
| --- | --- | --- |
| `actions/checkout` | `v7.0.1` | [`3d3c42e5aac5ba805825da76410c181273ba90b1`](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1) |
| `actions/setup-node` | `v7.0.0` | [`820762786026740c76f36085b0efc47a31fe5020`](https://github.com/actions/setup-node/commit/820762786026740c76f36085b0efc47a31fe5020) |
| `actions/upload-artifact` | `v7.0.1` | [`043fb46d1a93c77aae656e7c1c64a875d1fc6a0a`](https://github.com/actions/upload-artifact/commit/043fb46d1a93c77aae656e7c1c64a875d1fc6a0a) |
| `actions/download-artifact` | `v8.0.1` | [`3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c`](https://github.com/actions/download-artifact/commit/3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c) |

The runner label is rolling. Each CI run prints `ImageOS`, `ImageVersion`, `RUNNER_ARCH`, Node, and npm so the actual hosted image remains visible in the run log.
