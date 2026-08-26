// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

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
    ['/examples/multidimensional-indexing/', '/en/examples/multidimensional-indexing/'],
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

test('LAB03 remains absent from the published navigation', async ({ page }) => {
  await page.goto('/en/start/using-the-learning-site/');
  await expect(page.locator('nav a[href*="lab03"]')).toHaveCount(0);
  await expect(page.locator('nav a[href*="break-and-repair"]')).toHaveCount(0);
});
