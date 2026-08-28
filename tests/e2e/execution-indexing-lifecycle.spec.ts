// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';

const issue15Publications = [
  {
    unitId: 'M01',
    pairId: 'm01',
    resourceKind: 'learning-unit',
    zh: '/memory/address-spaces/',
    en: '/en/memory/address-spaces/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'M02',
    pairId: 'm02',
    resourceKind: 'learning-unit',
    zh: '/memory/coalescing-transactions/',
    en: '/en/memory/coalescing-transactions/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'M03',
    pairId: 'm03',
    resourceKind: 'learning-unit',
    zh: '/memory/shared-memory-tiling/',
    en: '/en/memory/shared-memory-tiling/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'M04',
    pairId: 'm04',
    resourceKind: 'learning-unit',
    zh: '/memory/bank-conflicts-layouts/',
    en: '/en/memory/bank-conflicts-layouts/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'EX05',
    pairId: 'ex05',
    resourceKind: 'runnable-example',
    zh: '/examples/coalesced-strided-access/',
    en: '/en/examples/coalesced-strided-access/',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '3 declared expectations',
  },
  {
    unitId: 'EX06',
    pairId: 'ex06',
    resourceKind: 'runnable-example',
    zh: '/examples/shared-memory-tile-bank-padding/',
    en: '/en/examples/shared-memory-tile-bank-padding/',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '3 declared expectations',
  },
  {
    unitId: 'VIS04',
    pairId: 'vis04',
    resourceKind: 'visual-explainer',
    zh: '/visuals/memory-transactions/',
    en: '/en/visuals/memory-transactions/',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
  },
  {
    unitId: 'VIS05',
    pairId: 'vis05',
    resourceKind: 'visual-explainer',
    zh: '/visuals/shared-memory-banks/',
    en: '/en/visuals/shared-memory-banks/',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
  },
  {
    unitId: 'VIS06',
    pairId: 'vis06',
    resourceKind: 'visual-explainer',
    zh: '/visuals/memory-hierarchy-lifetime/',
    en: '/en/visuals/memory-hierarchy-lifetime/',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
  },
] as const;

test('F03 reuses the deterministic VIS02 interaction and keeps its evidence boundary', async ({ page }) => {
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  await page.goto('/en/foundations/multidimensional-indexing/');

  const visual = page.locator('cuda-indexing-explorer[data-visual-id="VIS02"]');
  await expect(visual).toHaveCount(1);
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await visual.locator('[data-dimension-picker]').selectOption('3');
  await visual.locator('[data-index-field="extent.x"]').fill('9');
  await visual.locator('[data-index-field="extent.y"]').fill('3');
  await visual.locator('[data-index-field="extent.z"]').fill('3');
  await visual.locator('[data-index-field="blockDim.y"]').fill('2');
  await visual.locator('[data-index-field="blockDim.z"]').fill('2');
  await visual.locator('[data-index-field="threadIdx.y"]').fill('1');
  await visual.locator('[data-index-field="threadIdx.z"]').fill('1');

  await expect(visual.locator('[data-global-coordinate]')).toHaveText('(x=9, y=1, z=1)');
  await expect(visual).toHaveAttribute('data-bounds-state', 'out-of-bounds');
  await expect(visual.locator('[data-axis-predicate="x"]')).toHaveText('9 < 9: false');
  await expect(visual.locator('[data-no-evidence]')).toBeVisible();
  expect(failures).toEqual([]);
});

test('recent unit, Exercise, solution, example, and visual pages reflow and switch locale directly', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  const pairs = [
    ['/foundations/execution-hierarchy/', '/en/foundations/execution-hierarchy/'],
    ['/foundations/execution-hierarchy/exercises/', '/en/foundations/execution-hierarchy/exercises/'],
    ['/foundations/execution-hierarchy/solutions/', '/en/foundations/execution-hierarchy/solutions/'],
    ['/foundations/multidimensional-indexing/', '/en/foundations/multidimensional-indexing/'],
    ['/foundations/host-device-lifecycle/', '/en/foundations/host-device-lifecycle/'],
    ['/foundations/asynchronous-errors/', '/en/foundations/asynchronous-errors/'],
    ['/foundations/compute-capability/', '/en/foundations/compute-capability/'],
    ['/foundations/runtime-driver-api/', '/en/foundations/runtime-driver-api/'],
    ['/foundations/launch-geometry/', '/en/foundations/launch-geometry/'],
    ['/examples/multidimensional-indexing/', '/en/examples/multidimensional-indexing/'],
    ['/examples/error-handling-lifecycle/', '/en/examples/error-handling-lifecycle/'],
    ['/labs/break-and-repair-indexing/', '/en/labs/break-and-repair-indexing/'],
    ['/memory/address-spaces/exercises/', '/en/memory/address-spaces/exercises/'],
    ['/memory/address-spaces/solutions/', '/en/memory/address-spaces/solutions/'],
    ...issue15Publications.map((publication) => [publication.zh, publication.en] as const),
  ] as const;

  for (const [chinese, english] of pairs) {
    await page.goto(chinese);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', english);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), chinese).toBe(true);
    await page.goto(english);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', chinese);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), english).toBe(true);
  }

  expect(failures).toEqual([]);
});

test('F03 and issue-15 canonical pages retain static and print teaching content', async ({ browser, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium static-output probe is sufficient.');

  const staticContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:4321',
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto('/en/foundations/multidimensional-indexing/');
  await expect(staticPage.locator('[data-visual-controls]')).toBeHidden();
  await expect(staticPage.locator('[data-static-fallback]')).toBeVisible();
  await expect(staticPage.locator('[data-static-example]')).toHaveCount(3);
  await expect(staticPage.locator('[data-no-evidence]')).toBeVisible();
  expect(await staticPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await staticContext.close();

  await page.goto('/en/foundations/multidimensional-indexing/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-visual-controls]')).toBeHidden();
  await expect(page.locator('[data-static-fallback]')).toBeVisible();
  await expect(page.locator('.canonical-code')).toHaveCount(2);

  await page.goto('/en/foundations/host-device-lifecycle/');
  await expect(page.locator('table caption')).toContainText('lifecycle');
  await expect(page.locator('.canonical-code')).toHaveCount(1);

  await page.goto('/en/examples/multidimensional-indexing/');
  await expect(page.locator('.canonical-code')).toHaveCount(3);

  for (const { route, count } of [
    { route: '/en/memory/coalescing-transactions/', count: 1 },
    { route: '/en/memory/shared-memory-tiling/', count: 1 },
    { route: '/en/memory/bank-conflicts-layouts/', count: 1 },
    { route: '/en/examples/coalesced-strided-access/', count: 2 },
    { route: '/en/examples/shared-memory-tile-bank-padding/', count: 2 },
  ]) {
    await page.goto(route);
    await expect(page.locator('.canonical-code')).toHaveCount(count);
  }
});

test('issue-15 publications expose paired routes, canonical metadata, and honest evidence', async ({ page }) => {
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const publication of issue15Publications) {
    for (const { route, counterpart, lang } of [
      { route: publication.zh, counterpart: publication.en, lang: 'zh-CN' },
      { route: publication.en, counterpart: publication.zh, lang: 'en' },
    ] as const) {
      const response = await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(response?.ok(), route).toBe(true);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('main h1')).toContainText(publication.unitId);
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${canonicalOrigin}${route}`);
      await expect(page.locator('meta[name="cuda:pair-id"]')).toHaveAttribute('content', publication.pairId);
      await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', publication.unitId);
      await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', publication.resourceKind);
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute(
        'content',
        publication.runtimeEvidence,
      );
      if ('expectedObservations' in publication) {
        await expect(page.locator('meta[name="cuda:expected-observations"]')).toHaveAttribute(
          'content',
          publication.expectedObservations,
        );
      }
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
    }
  }

  await page.goto('/en/start/using-the-learning-site/');
  await page.waitForLoadState('networkidle');
  const navigation = page.getByRole('navigation', { name: 'Main' });
  for (const publication of issue15Publications) {
    await expect(navigation.locator(`a[href="${publication.en}"]`), publication.unitId).toHaveCount(1);
  }
  expect(failures).toEqual([]);
});
