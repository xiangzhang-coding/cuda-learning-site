// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const slugs = ['cuda-tile-cpp', 'cutile-python-tile-ir', 'developer-preview', 'nccl-device-fabric', 'cccl-experimental-python', 'cutlass-python-dsls'];

for (const prefix of ['', 'en/']) {
  test(`${prefix}Watch reaches all six version-gated entries and direct counterparts`, async ({ page }) => {
    for (const slug of slugs) {
      await page.goto(`/${prefix}watch/`);
      await page.locator(`main a[href="/${prefix}watch/${slug}/"]`).click();
      await expect(page.locator('main')).toContainText('2026-10-04');
      await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', 'emerging-feature-watch');
      await page.locator('[data-locale-counterpart]').focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/${prefix ? '' : 'en/'}watch/${slug}/$`));
    }
  });
  for (const slug of ['', ...slugs]) {
    test(`${prefix}watch/${slug} mobile reading @accessibility`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${prefix}watch/${slug ? `${slug}/` : ''}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    });
  }
}
