// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';

const issue14Publications = [
  {
    unitId: 'F05',
    pairId: 'f05',
    resourceKind: 'learning-unit',
    zh: '/foundations/asynchronous-errors/',
    en: '/en/foundations/asynchronous-errors/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'F06',
    pairId: 'f06',
    resourceKind: 'learning-unit',
    zh: '/foundations/compute-capability/',
    en: '/en/foundations/compute-capability/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'F07',
    pairId: 'f07',
    resourceKind: 'learning-unit',
    zh: '/foundations/runtime-driver-api/',
    en: '/en/foundations/runtime-driver-api/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'F08',
    pairId: 'f08',
    resourceKind: 'learning-unit',
    zh: '/foundations/launch-geometry/',
    en: '/en/foundations/launch-geometry/',
    runtimeEvidence: 'none',
  },
  {
    unitId: 'EX04',
    pairId: 'ex04',
    resourceKind: 'runnable-example',
    zh: '/examples/error-handling-lifecycle/',
    en: '/en/examples/error-handling-lifecycle/',
    runtimeEvidence: 'Pending Hardware Verification',
  },
  {
    unitId: 'LAB03',
    pairId: 'lab03',
    resourceKind: 'lab',
    zh: '/labs/break-and-repair-indexing/',
    en: '/en/labs/break-and-repair-indexing/',
    runtimeEvidence: 'Pending Hardware Verification',
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

test('new unit, Exercise, solution, and EX03 pages reflow and switch locale directly', async ({ page }) => {
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

test('F03 no-script and print output retain static indexing and canonical teaching content', async ({ browser, page }, testInfo) => {
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
});

test('F05-F08, EX04, and LAB03 publish paired routes with canonical metadata and honest evidence', async ({ page }) => {
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const publication of issue14Publications) {
    for (const { route, counterpart, lang } of [
      { route: publication.zh, counterpart: publication.en, lang: 'zh-CN' },
      { route: publication.en, counterpart: publication.zh, lang: 'en' },
    ] as const) {
      const response = await page.goto(route);
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
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
    }
  }

  await page.goto('/en/start/using-the-learning-site/');
  const navigation = page.getByRole('navigation', { name: 'Main' });
  for (const publication of issue14Publications) {
    await expect(navigation.locator(`a[href="${publication.en}"]`), publication.unitId).toHaveCount(1);
  }
  expect(failures).toEqual([]);
});
