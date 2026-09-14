// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

const slugs = ['triton/fused-softmax', 'triton/fused-softmax/exercises',
  'triton/fused-softmax/solutions', 'labs/verify-fused-softmax'];

for (const prefix of ['', 'en/']) {
  test(`${prefix}T03 learner can reach hints, solutions, Lab and counterpart`, async ({ page, baseURL }, info) => {
    const failures = collectBrowserFailures(page, baseURL!);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${prefix}triton/fused-softmax/`, { waitUntil: 'networkidle' });
    await expect(page.locator('main pre')).toContainText('def normalize_rows');
    await page.locator(`main a[href="/${prefix}triton/fused-softmax/exercises/"]`).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main details')).toHaveCount(4);
    for (const hint of await page.locator('main details').all()) {
      await expect(hint).toHaveJSProperty('open', false);
      if (info.project.name === 'mobile-safari') await hint.locator('summary').tap();
      else await hint.locator('summary').press('Enter');
      await expect(hint).toHaveJSProperty('open', true);
    }
    await page.locator(`main a[href="/${prefix}triton/fused-softmax/solutions/"]`).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', 'solution-set');
    await page.locator(`main a[href="/${prefix}labs/verify-fused-softmax/"]`).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'Pending Hardware Verification');
    await expect(page.locator('main')).toContainText('--mode benchmark');
    await page.locator('[data-locale-counterpart]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', 'LAB15');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(failures).toEqual([]);
  });

  test(`@accessibility ${prefix}T03 and LAB15 including expanded hints`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of slugs) {
      await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), slug).toEqual([]);
    }
  });
}
