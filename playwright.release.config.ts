// SPDX-License-Identifier: Apache-2.0
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.RELEASE_BASE_URL;
const sourceCommit = process.env.RELEASE_SOURCE_COMMIT;
const releaseKind = process.env.RELEASE_KIND;
const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';

if (!baseURL || !URL.canParse(baseURL)) throw new Error('RELEASE_BASE_URL must be an absolute local, production, or preview URL.');
if (!sourceCommit || !/^[0-9a-f]{40}$/.test(sourceCommit)) {
  throw new Error('RELEASE_SOURCE_COMMIT must be the exact 40-character commit deployed at RELEASE_BASE_URL.');
}
if (!['local', 'preview', 'production'].includes(releaseKind ?? '')) throw new Error('RELEASE_KIND must be local, preview, or production.');

const releaseURL = new URL(baseURL);
if (releaseURL.username || releaseURL.password || releaseURL.search || releaseURL.hash || releaseURL.pathname !== '/') {
  throw new Error('RELEASE_BASE_URL must be a bare origin without credentials, path, query, or fragment.');
}
if (releaseKind === 'production' && releaseURL.origin !== canonicalOrigin) {
  throw new Error(`Production smoke must target ${canonicalOrigin}.`);
}
if (
  releaseKind === 'preview' &&
  (releaseURL.protocol !== 'https:' ||
    !/^[a-z0-9-]+-cuda-learning-site\.hmzhangxiang\.workers\.dev$/.test(releaseURL.hostname))
) {
  throw new Error('Preview smoke must target a public Cloudflare Preview URL for cuda-learning-site.');
}
if (releaseKind === 'local' && !['127.0.0.1', 'localhost'].includes(releaseURL.hostname)) {
  throw new Error('Local smoke is restricted to a loopback origin.');
}

export default defineConfig({
  testDir: './tests/release',
  fullyParallel: false,
  forbidOnly: true,
  maxFailures: 1,
  retries: 0,
  workers: 1,
  reporter: 'list',
  webServer: releaseKind === 'local'
    ? {
        command: 'node scripts/serve-dist.mjs',
        url: baseURL,
        reuseExistingServer: true,
      }
    : undefined,
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'release-chromium', use: { ...devices['Desktop Chrome'] } }],
});
