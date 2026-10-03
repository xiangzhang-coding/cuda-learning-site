<!-- SPDX-License-Identifier: Apache-2.0 -->

# Dependency Review

## Security disposition — 2026-10-03, issue #60

The existing CI audit began blocking PR #147 on newly reported advisories.
Maintainer-approved remediation retains every direct dependency and install-script
coordinate while pinning four transitive patch upgrades through npm overrides:

| Package | Previous → reviewed | Owner basis | License |
| --- | --- | --- | --- |
| devalue | 5.9.1 → 5.9.4 | [5.9.3 security fixes](https://github.com/sveltejs/devalue/releases/tag/v5.9.3), [5.9.4](https://github.com/sveltejs/devalue/releases/tag/v5.9.4) | MIT |
| fast-uri | 3.1.6 → 3.1.8 | [3.1.8 security release](https://github.com/fastify/fast-uri/releases/tag/v3.1.8) | BSD-3-Clause |
| undici, Miniflare path | 7.29.0 → 7.29.1 | [7.29.1 security fixes](https://github.com/nodejs/undici/releases/tag/v7.29.1) | MIT |
| undici, unifont path | 8.10.0 → 8.10.2 | [8.10.2 security fixes](https://github.com/nodejs/undici/releases/tag/v8.10.2) | MIT |

Current Context7 `/npm/cli` and npm owner documentation were checked for
version-scoped overrides and audit advisory/meta-vulnerability behavior. Exact
registry tarball URLs, versions and SHA-512 integrity values are in the lockfile.
Installation uses `--ignore-scripts`; the inventory remains **665 records**, zero
bundled records, the same license-expression set and the same six install-script
coordinates listed below. No owner code is copied or patched locally.

### One time-limited, reachability-bound audit exception

[GHSA-ch52-4w7c-c8xp](https://github.com/advisories/GHSA-ch52-4w7c-c8xp), high,
affects `http-cache-semantics <=4.2.0`. On 2026-10-03 the registry's latest version
was 4.2.0 and the advisory had **no first patched version**. The package remains
vulnerable; this is not a fix or a zero-vulnerability claim.

The reported exploit needs a shared response cache that accepts a client's
`max-stale` request and can replay another user's cached `Set-Cookie` response.
The only import found in the installed **Astro 7.2.8** distribution is
`dist/assets/build/remote.js`: `loadRemoteImage` / `revalidateRemoteImage` construct
their own requests, use cache policy to derive TTL, and return image bytes with
expiry/ETag/Last-Modified. They do not forward visitor cookies or `max-stale`,
serve visitor requests, or replay cached Set-Cookie headers. The reviewed site
has no remote-image component use, no SSR adapter, `output: 'static'`, and an
assets-only Wrangler configuration with no Worker entry point or bindings.
Astro, its HTTP cache and Node modules are not deployed to handle requests.

`npm run quality:audit` still retrieves the complete live npm JSON audit, keeps
the **high** threshold and fails closed on transport/schema errors. It permits
only this exact advisory for the single root `http-cache-semantics@4.2.0` node
and npm parent meta-vulnerabilities whose **every** advisory path leads to that
exception. New advisories, unrelated high/critical findings, cycles or missing
causes cannot inherit a waiver. Lower severities retain the existing high-level
blocking policy. The waiver is disabled at **2026-10-17 00:00:00 UTC** (exclusive)
and on any reviewed configuration, caller or version change. The CLI exposes
the exception and expiry in its bounded output; raw audit errors are not retained.

The checked SHA-256 boundaries include the whole dependency graph: adding any
consumer or changing any locked package invalidates the exception, even if it
reuses the same root cache package. Audit schema/severity totals, direct-advisory
severity and all graph references/cycles are checked before applying the threshold.
The checked files are:

| Reviewed file | SHA-256 |
| --- | --- |
| `astro.config.mjs` | `1a9ee606c1c6e56987910ef2f5d8cd70c255bfb1b9b87925eb237f6371914551` |
| `wrangler.jsonc` | `e3f1d938b268baf8d79178175289999b7f850ef539251fde95d106b4063a8655` |
| `package-lock.json` | `ad5da3bb6e55d6d1e9fa66ab0a40fcf2c3e28fcff0bba7301303d4cd31fb661a` |
| Installed `astro/dist/assets/build/remote.js` | `f373fa76e3112446db327c79b34e2bbb1ef1dcad41affb60788adf30edc9588e` |

Remove the exception as soon as a reviewed fixed dependency becomes available.
Do not refresh the expiry or hashes mechanically: recheck the advisory, exact
caller and build/deployment reachability. The same gate runs locally through
`build:release` and in Web Quality CI. The regressions cover expiry, changed
scope/version, new findings, malformed/unavailable reports and parent chains.

## Historical inventory — 2026-09-10

- Lockfile inventory rechecked: 2026-09-10; earlier interface and security reviews retain their dates
- Runtime: Node.js 24.19.0, npm 11.17.0
- Lock format: npm lockfile version 3
- Reviewed lock package records: 665, including optional platform packages
- Bundled package records: 0

`npm run quality:dependencies` on 2026-09-10 confirmed 665 package records, zero bundled records, and the license expressions and six install-script entries below. No dependency or lockfile was upgraded in the R4 aggregate review. This structural check is not a new vulnerability audit or deployment acceptance result.

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
- `MIT OR Apache-2.0`
- `MPL-2.0`
- `Python-2.0`

MPL-2.0 applies to axe-core and Lightning CSS packages. `MIT OR Apache-2.0` applies to Wrangler and its Cloudflare asset helpers. LGPL combinations apply to optional Sharp/libvips platform packages. `argparse` declares Python-2.0. Project licenses do not relicense any of these packages.

## Install scripts

Only these exact lock entries declare install scripts:

- `esbuild@0.28.2`
- `fsevents@2.3.2`
- `vite/node_modules/fsevents@2.3.3`
- `workerd@1.20260820.1`
- `wrangler/node_modules/esbuild@0.28.1`
- `wrangler/node_modules/fsevents@2.3.3`

The committed `.npmrc` and documented installation flow set `ignore-scripts=true`; installation commands must preserve that boundary. Running Wrangler to validate or upload assets is a separate action, not an npm install lifecycle script. Any future Workers Builds configuration must preserve the install boundary before replacing repository-pinned Wrangler as the deployment authority. `workerd` and both esbuild records would otherwise select or validate platform binaries; all three fsevents records are optional macOS file watchers. Any version or install-script set change requires a new source, license, and script review before the lockfile can pass.

## Packaged assets and binaries

- Pagefind 1.5.2 resolves its official optional platform binaries and supplies the extended Chinese segmenter used by the static index.
- Starlight-owned interface icons and Pagefind UI remain inside their MIT-licensed packages; no copy is maintained as a project asset.
- Optional Sharp platform packages retain their Apache/MIT/LGPL combinations and are build dependencies, not project-owned visual assets.
- Playwright browser revisions are downloaded by `playwright install`; they are not committed or included in site artifacts.
- Wrangler 4.125.0 and its exact Static Assets tooling are development-only deployment inputs. The built site contains no Wrangler or workerd runtime; Wrangler's dry run must report no bindings.
- No third-party font, diagram, sample listing, or image is copied into the Orientation source.

Direct dependency roles and owner repositories are listed in `THIRD_PARTY_NOTICES.md`. Exact transitive coordinates remain authoritative in `package-lock.json`.
