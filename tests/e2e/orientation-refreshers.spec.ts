// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const newPublicationPairs = [
  ['/start/cpp17-for-cuda/', '/en/start/cpp17-for-cuda/'],
  ['/start/cpp17-for-cuda/exercises/', '/en/start/cpp17-for-cuda/exercises/'],
  ['/start/cpp17-for-cuda/solutions/', '/en/start/cpp17-for-cuda/solutions/'],
  ['/start/linux-command-line/', '/en/start/linux-command-line/'],
  ['/start/linux-command-line/exercises/', '/en/start/linux-command-line/exercises/'],
  ['/start/linux-command-line/solutions/', '/en/start/linux-command-line/solutions/'],
  ['/start/architecture-refresher/', '/en/start/architecture-refresher/'],
  ['/start/architecture-refresher/exercises/', '/en/start/architecture-refresher/exercises/'],
  ['/start/architecture-refresher/solutions/', '/en/start/architecture-refresher/solutions/'],
  ['/start/programmable-gpus/', '/en/start/programmable-gpus/'],
  ['/start/programmable-gpus/exercises/', '/en/start/programmable-gpus/exercises/'],
  ['/start/programmable-gpus/solutions/', '/en/start/programmable-gpus/solutions/'],
  ['/start/reference-environment-candidate/', '/en/start/reference-environment-candidate/'],
  ['/start/reference-environment-candidate/exercises/', '/en/start/reference-environment-candidate/exercises/'],
  ['/start/reference-environment-candidate/solutions/', '/en/start/reference-environment-candidate/solutions/'],
  ['/examples/environment-report/', '/en/examples/environment-report/'],
  ['/labs/record-cuda-environment/', '/en/labs/record-cuda-environment/'],
] as const;

test('O08 compatibility controls stay deterministic and grant no evidence', async ({ page }, testInfo) => {
  const errors = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  await page.goto('/en/start/reference-environment-candidate/');
  const explorer = page.locator('cuda-compatibility-explorer');
  await expect(explorer).toHaveAttribute('data-ready', 'true');
  await expect(explorer).toHaveAttribute('data-assessment', 'indeterminate');

  const lane = explorer.locator('[data-compatibility-lane]');
  const driver = explorer.locator('[data-driver-release]');
  const forward = explorer.locator('[data-forward-package]');
  await lane.selectOption('cuda-13.3');
  await driver.fill('610.43.02');
  await expect(explorer).toHaveAttribute('data-assessment', 'documented-path');
  await expect(explorer.locator('[data-assessment-mechanisms]')).toHaveText('backward');
  await expect(explorer.locator('[data-compatibility-result]')).toContainText('requires a run');
  await expect(explorer.locator('[data-compatibility-result]')).toContainText('changes neither Compile-Checked nor runtime Evidence Status');

  await driver.fill('575.57.08');
  await expect(explorer).toHaveAttribute('data-assessment', 'indeterminate');
  await forward.selectOption('not-used');
  await expect(explorer).toHaveAttribute('data-assessment', 'not-documented');
  await expect(explorer.locator('[data-compatibility-result]')).not.toContainText('compatible');

  if (testInfo.project.name !== 'mobile-safari') {
    await explorer.getByRole('button', { name: 'Reset' }).focus();
    await page.keyboard.press('Enter');
    await expect(driver).toBeFocused();
    await expect(driver).toHaveValue('');
    await expect(explorer).toHaveAttribute('data-assessment', 'indeterminate');
  }

  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(errors).toEqual([]);
});

test('new Publication Pairs expose direct counterparts and reflow on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const [zh, en] of newPublicationPairs) {
    for (const [route, counterpart] of [[zh, en], [en, zh]] as const) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }

  expect(errors).toEqual([]);
});

test('O08 keeps its selected source facts when scripts are disabled', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One static Chromium context covers the no-script contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/en/start/reference-environment-candidate/');

  const explorer = page.locator('cuda-compatibility-explorer');
  await expect(explorer.locator('[data-compatibility-controls]')).toBeHidden();
  await expect(explorer.locator('[data-static-fallback] tbody tr')).toHaveCount(3);
  await expect(explorer.locator('[data-static-fallback]')).toContainText('450.80.02');
  await expect(explorer.locator('[data-static-fallback]')).toContainText('525.60.13');
  await expect(explorer.locator('[data-static-fallback]')).toContainText('R580');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  await context.close();
});

test('new teaching visuals and canonical EX01/LAB01 content remain complete in print', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns print-media emulation.');

  for (const route of [
    '/start/cpp17-for-cuda/',
    '/en/start/cpp17-for-cuda/',
    '/start/linux-command-line/',
    '/en/start/linux-command-line/',
    '/start/architecture-refresher/',
    '/en/start/architecture-refresher/',
    '/start/programmable-gpus/',
    '/en/start/programmable-gpus/',
    '/start/reference-environment-candidate/',
    '/en/start/reference-environment-candidate/',
    '/examples/environment-report/',
    '/en/examples/environment-report/',
    '/labs/record-cuda-environment/',
    '/en/labs/record-cuda-environment/',
  ]) {
    await page.goto(route);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('.locale-pair')).toBeHidden();
    if (route.includes('reference-environment-candidate') && !route.includes('/exercises/') && !route.includes('/solutions/')) {
      await expect(page.locator('[data-compatibility-controls]')).toBeHidden();
      await expect(page.locator('[data-static-fallback]')).toBeVisible();
    }
    if (route.includes('environment-report') || route.includes('record-cuda-environment')) {
      await expect(page.locator('.canonical-code').first()).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    await page.emulateMedia({ media: 'screen' });
  }
});
