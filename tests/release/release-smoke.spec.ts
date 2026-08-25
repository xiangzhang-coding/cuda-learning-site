// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures, expectRankedSearchResult } from '../helpers/browser-contract';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const releaseOrigin = new URL(process.env.RELEASE_BASE_URL as string).origin;
const expectedSourceCommit = process.env.RELEASE_SOURCE_COMMIT as string;
const releaseKind = process.env.RELEASE_KIND as 'local' | 'preview' | 'production';
const downloadUrl =
  'https://github.com/xiangzhang-coding/cuda-learning-site/archive/d69f7131acff7f8b1dfcd780b494426b5948735b.zip';

test('serves the exact static release with production canonical metadata and no browser errors', async ({ page, request }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  const releaseResponse = await request.get('/release.json');
  expect(releaseResponse.ok()).toBe(true);
  await expect(releaseResponse.json()).resolves.toMatchObject({
    sourceCommit: expectedSourceCommit,
    artifactType: 'static-assets',
    canonicalOrigin,
  });

  const legalResponse = await request.get('/legal/THIRD_PARTY_NOTICES.md');
  expect(legalResponse.ok()).toBe(true);
  expect(await legalResponse.text()).toContain('`wrangler` | 4.125.0');

  for (const route of [
    '/',
    '/en/',
    '/start/using-the-learning-site/',
    '/en/start/using-the-learning-site/',
    '/start/reference-environment-candidate/',
    '/en/start/reference-environment-candidate/',
    '/examples/environment-report/',
    '/en/examples/environment-report/',
    '/labs/record-cuda-environment/',
    '/en/labs/record-cuda-environment/',
  ]) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${canonicalOrigin}${route}`);
  }

  if (releaseKind === 'production') expect(releaseOrigin).toBe(canonicalOrigin);
  else expect(releaseOrigin).not.toBe(canonicalOrigin);
  expect(failures).toEqual([]);
});

test('supports direct locale navigation, keyboard flow, and relevant bilingual search', async ({ page }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.goto('/en/start/using-the-learning-site/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.sl-skip-link')).toBeFocused();
  const glossaryLink = page.getByRole('link', { name: 'Glossary', exact: true }).first();
  await expect(glossaryLink).toBeVisible();
  await glossaryLink.click();
  await expect(page).toHaveURL(/\/en\/glossary\/$/);
  await page.goto('/en/start/using-the-learning-site/');
  await page.locator('[data-locale-counterpart]').click();
  await expect(page).toHaveURL(/\/start\/using-the-learning-site\/$/);
  await page.waitForLoadState('networkidle');

  await expectRankedSearchResult(page, {
    route: '/',
    button: /搜索/,
    query: '运行并验证向量加法',
    expectedHrefs: ['/labs/vector-addition/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'row-major data index',
    expectedHrefs: ['/en/visuals/indexing/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'SRC-WEB-003 Pagefind 1.5.2',
    expectedHrefs: ['/en/sources-and-versions/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'Reference Environment candidate',
    expectedHrefs: [
      '/en/start/reference-environment-candidate/',
      '/en/start/reference-environment-candidate/exercises/',
      '/en/start/reference-environment-candidate/solutions/',
      '/en/labs/record-cuda-environment/',
    ],
  });

  await page.goto('/en/practice/');
  const index = page.locator('cuda-resource-index');
  await index.locator('[data-resource-query]').fill('manifest');
  await index.locator('[data-resource-filter="type"]').selectOption('correctness-debugging');
  await index.locator('[data-resource-filter="relation"]').selectOption('O03');
  await expect(index.locator('[data-resource-card]:visible')).toHaveCount(1);
  await expect(index.locator('[data-resource-card]:visible')).toHaveAttribute('data-resource-id', 'PB-R0-002');
  expect(failures).toEqual([]);
});

test('persists all three themes and preserves reduced-motion and print fallbacks', async ({ page }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/start/using-the-learning-site/');
  const picker = page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' });

  for (const theme of ['silicon-light', 'profiler-dark', 'blueprint']) {
    await picker.selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-learning-theme', 'blueprint');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.goto('/en/');
  expect(
    await page.locator('.route-card').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);

  await page.goto('/en/visuals/kernel-journey/');
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  await expect(page.locator('[data-visual-controls]')).toBeHidden();
  await expect(page.locator('[data-static-fallback]')).toBeVisible();
  expect(failures).toEqual([]);
});

test('keeps mobile pages and no-script Visual Explainers complete', async ({ browser, page }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    '/labs/record-cuda-environment/',
    '/en/labs/record-cuda-environment/',
    '/labs/vector-addition/',
    '/en/labs/vector-addition/',
    '/start/reference-environment-candidate/',
    '/en/start/reference-environment-candidate/',
  ]) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
  expect(failures).toEqual([]);

  const staticContext = await browser.newContext({
    baseURL: process.env.RELEASE_BASE_URL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await staticContext.newPage();
  for (const route of [
    '/visuals/kernel-journey/',
    '/en/visuals/indexing/',
    '/start/reference-environment-candidate/',
    '/en/start/reference-environment-candidate/',
    '/practice/',
    '/en/glossary/',
  ]) {
    const response = await staticPage.goto(route);
    expect(response?.ok(), route).toBe(true);
    if (route.includes('/visuals/')) {
      await expect(staticPage.locator('[data-visual-controls]')).toBeHidden();
      await expect(staticPage.locator('[data-static-fallback]')).toBeVisible();
      await expect(staticPage.locator('[data-no-evidence]')).toBeVisible();
    } else if (route.includes('reference-environment-candidate')) {
      await expect(staticPage.locator('[data-compatibility-controls]')).toBeHidden();
      await expect(staticPage.locator('[data-static-fallback] tbody tr')).toHaveCount(3);
    } else {
      await expect(staticPage.locator('[data-resource-controls]')).toBeHidden();
      await expect(staticPage.locator('[data-resource-card]').first()).toBeVisible();
    }
    expect(await staticPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
  await staticContext.close();
});

test('serves the immutable EX02 download and returns a real 404 for unknown application paths', async ({ page, request }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.goto('/en/examples/vector-addition/');
  await expect(page.locator(`a[href="${downloadUrl}"]`)).toBeVisible();

  const download = await request.get(downloadUrl);
  expect(download.ok()).toBe(true);
  expect(download.headers()['content-type']).toMatch(/zip|octet-stream/);
  expect((await download.body()).subarray(0, 2).toString('ascii')).toBe('PK');

  const missing = await request.get('/api/r0-smoke-must-not-exist');
  expect(missing.status()).toBe(404);
  expect(failures).toEqual([]);
});
