// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

for (const prefix of ['', 'en/']) {
  for (const [id, slug] of [['G01', 'devices-contexts-ownership'], ['G02', 'peer-access-copies'], ['G03', 'topology-paths'], ['G04', 'nccl-communicators-collectives'], ['G05', 'nccl-stream-dependencies']]) {
    test(`${prefix}${id}: ownership, peer and topology learner journey`, async ({ page, baseURL }, info) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${prefix}multi-gpu/${slug}/`, { waitUntil: 'networkidle' });
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
      await page.locator(`main a[href="/${prefix}multi-gpu/${slug}/exercises/"]`).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main details')).toHaveCount(4);
      for (const hint of await page.locator('main details').all()) {
        await expect(hint).toHaveJSProperty('open', false);
        if (info.project.name === 'mobile-safari') await hint.locator('summary').tap();
        else await hint.locator('summary').press('Enter');
        await expect(hint).toHaveJSProperty('open', true);
      }
      await page.locator(`main a[href="/${prefix}multi-gpu/${slug}/solutions/"]`).click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', `${id}-SOLUTIONS`);
      await page.locator('[data-locale-counterpart]').click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', `${id}-SOLUTIONS`);
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('main h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(failures).toEqual([]);
    });
    test(`@accessibility ${prefix}${id}: readable unit, hints and solutions`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: 360, height: 800 });
      for (const suffix of ['', '/exercises', '/solutions']) {
        await page.goto(`/${prefix}multi-gpu/${slug}${suffix}/`, { waitUntil: 'networkidle' });
        for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
      }
    });
  }
}
