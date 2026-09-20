// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

const slugs = ['multi-gpu/communication-computation-overlap', 'multi-gpu/communication-computation-overlap/exercises', 'multi-gpu/communication-computation-overlap/solutions', 'labs/pipeline-nccl-computation'];
for (const prefix of ['', 'en/']) {
  for (const slug of slugs) {
    test(`${prefix}${slug} locale, mobile and evidence journey`, async ({ page, baseURL }) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText(slug.startsWith('labs') ? 'LAB18' : 'G06');
      if (slug.endsWith('exercises')) {
        const hint = page.locator('main details summary').first();
        await hint.focus(); await page.keyboard.press('Enter');
        await expect(page.locator('main details').first()).toHaveAttribute('open', '');
      }
      if (slug.startsWith('labs')) await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'Pending Hardware Verification');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.locator('[data-locale-counterpart]').click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(`/${prefix ? '' : 'en/'}${slug}/$`));
      expect(failures).toEqual([]);
    });
    test(`@accessibility ${prefix}${slug}`, async ({ page }) => {
      await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    });
  }
  test(`${prefix}G06 no-script exercise and print solution`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`/${prefix}${slugs[1]}/`);
    await expect(page.locator('main details')).toHaveCount(4);
    await page.locator('main a').filter({ hasText: prefix ? 'separate solutions' : '独立解答' }).click();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('main a[href="/assets/exercise-solutions/g06-pipeline.cu"]')).toBeVisible();
    await context.close();
  });
}
