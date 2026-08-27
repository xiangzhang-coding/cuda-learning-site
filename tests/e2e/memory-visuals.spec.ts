// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

test('VIS04 groups bounded lane ranges, crossing elements, invalid input, and reset deterministically', async ({ page }) => {
  await page.goto('/en/visuals/memory-transactions/');
  const visual = page.locator('cuda-memory-transactions');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-segment-groups', '4');
  await expect(visual.locator('[data-memory-lanes] tr')).toHaveCount(32);

  await visual.locator('[data-memory-field="offset"]').fill('4');
  await expect(visual).toHaveAttribute('data-segment-groups', '5');
  await expect(visual.locator('[data-memory-lanes] tr[data-lane="31"]')).toContainText('[128–131]');

  await visual.locator('[data-memory-pattern]').selectOption('strided');
  await visual.locator('[data-memory-field="stride"]').fill('2');
  await visual.locator('[data-memory-field="offset"]').fill('0');
  await expect(visual).toHaveAttribute('data-segment-groups', '8');
  await expect(visual.locator('[data-covered-bytes]')).toHaveText('256');

  await visual.getByRole('button', { name: 'Reset address grouping' }).click();
  await visual.locator('[data-memory-field="elementSize"]').selectOption('8');
  await visual.locator('[data-memory-field="offset"]').fill('28');
  await visual.locator('[data-memory-field="activeLanes"]').fill('2');
  await expect(visual).toHaveAttribute('data-segment-groups', '2');
  await expect(visual.locator('[data-memory-lanes] tr[data-lane="0"]')).toContainText('[0–31], [32–63]');

  await visual.locator('[data-memory-field="activeLanes"]').fill('33');
  await expect(visual).toHaveAttribute('data-valid', 'false');
  await expect(visual.locator('[data-interactive-workbench]')).toBeHidden();
  await expect(visual.locator('[data-memory-validation]')).toBeVisible();
  await expect(visual.locator('[data-memory-field="activeLanes"]')).toHaveAttribute('aria-invalid', 'true');

  await visual.getByRole('button', { name: 'Reset address grouping' }).click();
  await expect(visual).toHaveAttribute('data-valid', 'true');
  await expect(visual).toHaveAttribute('data-segment-groups', '4');
  await expect(visual.locator('[data-memory-pattern]')).toBeFocused();
});

test('VIS05 maps required stride and padding cases and keeps broadcast separate', async ({ page }) => {
  await page.goto('/en/visuals/shared-memory-banks/');
  const visual = page.locator('cuda-shared-memory-banks');
  const stride = visual.locator('[data-bank-field="stride"]');
  const padding = visual.locator('[data-bank-field="padding"]');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-classification', 'conflict-free');
  await expect(visual).toHaveAttribute('data-conflict-degree', '1');

  await stride.fill('2');
  await expect(visual).toHaveAttribute('data-classification', 'bank-conflict');
  await expect(visual).toHaveAttribute('data-conflict-degree', '2');

  await stride.fill('32');
  await expect(visual).toHaveAttribute('data-conflict-degree', '32');
  await expect(visual.locator('[data-bank-groups] li')).toHaveCount(1);

  await padding.fill('1');
  await expect(visual).toHaveAttribute('data-classification', 'conflict-free');
  await expect(visual).toHaveAttribute('data-conflict-degree', '1');
  await expect(visual.locator('[data-bank-groups] li')).toHaveCount(32);

  await stride.fill('0');
  await padding.fill('0');
  await expect(visual).toHaveAttribute('data-classification', 'same-address-broadcast');
  await expect(visual).toHaveAttribute('data-conflict-degree', '1');
  await expect(visual.locator('[data-bank-verdict]')).toHaveText('SAME-ADDRESS BROADCAST');

  await visual.locator('[data-bank-field="bankCount"]').fill('0');
  await expect(visual).toHaveAttribute('data-valid', 'false');
  await expect(visual.locator('[data-interactive-workbench]')).toBeHidden();
  await expect(visual.locator('[data-bank-validation]')).toBeVisible();

  await visual.getByRole('button', { name: 'Reset bank mapping' }).click();
  await expect(visual).toHaveAttribute('data-classification', 'conflict-free');
  await expect(visual).toHaveAttribute('data-conflict-degree', '1');
  await expect(visual.locator('[data-bank-field="bankCount"]')).toBeFocused();
});

test('VIS06 intersects scope and lifecycle filters and restores the six-record catalog', async ({ page }) => {
  await page.goto('/en/visuals/memory-hierarchy-lifetime/');
  const visual = page.locator('cuda-memory-hierarchy-lifetime');
  const scope = visual.locator('[data-scope-filter]');
  const lifecycle = visual.locator('[data-lifecycle-filter]');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-visible-records', '6');

  await scope.selectOption('thread');
  await expect(visual).toHaveAttribute('data-visible-records', '2');
  await expect(visual.locator('[data-hierarchy-records] tr')).toHaveCount(2);
  await expect(visual.locator('[data-hierarchy-records]')).toContainText('Local memory');
  await expect(visual.locator('[data-hierarchy-records]')).toContainText('Register storage');

  await lifecycle.selectOption('explicit-release');
  await expect(visual).toHaveAttribute('data-visible-records', '0');
  await expect(visual.locator('[data-hierarchy-empty]')).toBeVisible();
  await expect(visual.locator('[data-hierarchy-table-wrap]')).toBeHidden();

  await visual.getByRole('button', { name: 'Reset to all six records' }).click();
  await expect(visual).toHaveAttribute('data-visible-records', '6');
  await expect(visual.locator('[data-hierarchy-records] tr')).toHaveCount(6);
  await expect(scope).toBeFocused();
  await expect(visual.locator('[data-static-memory-record]')).toHaveCount(6);

  await scope.selectOption('grid');
  await expect(visual.locator('[data-hierarchy-records] tr')).toHaveCount(2);
  await expect(visual.locator('[data-hierarchy-records]')).toContainText('Global memory');
  await expect(visual.locator('[data-hierarchy-records]')).toContainText('Constant memory');
});

test('memory visuals retain complete static output without scripts, on narrow screens, and in print', async ({ browser, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium context covers no-script and media fallbacks.');
  const routes = [
    '/visuals/memory-transactions/',
    '/en/visuals/memory-transactions/',
    '/visuals/shared-memory-banks/',
    '/en/visuals/shared-memory-banks/',
    '/visuals/memory-hierarchy-lifetime/',
    '/en/visuals/memory-hierarchy-lifetime/',
  ];
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const staticPage = await context.newPage();
  for (const route of routes) {
    await staticPage.goto(`http://127.0.0.1:4321${route}`);
    await expect(staticPage.locator('[data-visual-controls]')).toBeHidden();
    await expect(staticPage.locator('[data-interactive-workbench]')).toBeHidden();
    await expect(staticPage.locator('[data-static-fallback]')).toBeVisible();
    await expect(staticPage.locator('[data-no-evidence]')).toBeVisible();
    expect(await staticPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
  await context.close();

  await page.goto('/en/visuals/memory-hierarchy-lifetime/');
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  expect(
    await page.locator('[data-reset-memory-hierarchy]').evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('[data-visual-controls]')).toBeHidden();
  await expect(page.locator('[data-interactive-workbench]')).toBeHidden();
  await expect(page.locator('[data-static-fallback]')).toBeVisible();
  await expect(page.locator('[data-static-memory-record]')).toHaveCount(6);
});
