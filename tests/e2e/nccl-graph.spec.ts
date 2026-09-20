// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures, settlePublicationPage } from '../helpers/browser-contract';

const slug = 'multi-gpu/nccl-graph-capture';
for (const prefix of ['', 'en/']) {
  for (const suffix of ['', '/exercises', '/solutions']) {
    test(`${prefix}G08${suffix} mobile reading, keyboard hints and counterpart`, async ({ page, baseURL }) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${prefix}${slug}${suffix}/`, { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('G08');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
      if (suffix === '/exercises') {
        await expect(page.locator('main details')).toHaveCount(4);
        await expect(page.locator('main details[open]')).toHaveCount(0);
        for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
        await expect(page.locator('main details[open]')).toHaveCount(4);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('main h1')).toBeVisible();
      await page.emulateMedia({ media: 'screen' });
      await settlePublicationPage(page);
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(`${baseURL}/${prefix ? '' : 'en/'}${slug}${suffix}/`);
      await settlePublicationPage(page);
      await expect(page.locator('h1')).toContainText('G08');
      expect(failures).toEqual([]);
    });
    test(`@accessibility ${prefix}G08${suffix} open-hint accessibility`, async ({ page }, info) => {
      test.skip(info.project.name !== 'chromium', 'Serialized Chromium axe gate.');
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`/${prefix}${slug}${suffix}/`, { waitUntil: 'networkidle' });
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    });
  }
  for (const destination of ['practice/#pb-r6-010', 'practice/#pb-r6-011', 'sources-and-versions/#src-cuda-101']) {
    test(`${prefix}G08 reaches ${destination}`, async ({ page, baseURL }) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
      await page.locator(`main a[href="/${prefix}${destination}"]`).first().click();
      await page.waitForURL(`${baseURL}/${prefix}${destination}`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator(`#${destination.split('#')[1]}`)).toHaveCount(1);
      await settlePublicationPage(page);
      expect(failures).toEqual([]);
    });
  }
}

test.describe('G08 no-script exercises', () => {
  test.use({ javaScriptEnabled: false });
  for (const prefix of ['', 'en/']) test(`${prefix}native hints and separate answer`, async ({ page }) => {
    await page.goto(`/${prefix}${slug}/exercises/`);
    await page.locator('main details summary').first().press('Enter');
    await expect(page.locator('main details').first()).toHaveAttribute('open', '');
    await page.locator(`main a[href="/${prefix}${slug}/solutions/"]`).click();
    await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', 'G08-SOLUTIONS');
    await expect(page.locator('main details')).toHaveCount(0);
  });
});
