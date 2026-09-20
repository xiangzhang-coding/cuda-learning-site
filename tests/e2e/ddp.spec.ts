// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures, settlePublicationPage } from '../helpers/browser-contract';

const slug = 'multi-gpu/pytorch-ddp-nccl';
for (const prefix of ['', 'en/']) {
  for (const suffix of ['', '/exercises', '/solutions']) {
    test(`${prefix}G07${suffix} mobile counterpart and printable content`, async ({ page, baseURL }) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${prefix}${slug}${suffix}/`, { waitUntil: 'networkidle' });
      await expect(page.locator('h1')).toContainText('G07');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
      if (suffix === '/exercises') {
        await expect(page.locator('main details')).toHaveCount(6);
        for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
        await expect(page.locator('main details[open]')).toHaveCount(6);
        await expect(page.locator(`main a[href="/${prefix}${slug}/solutions/"]`)).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
      await expect(page.locator('main h1')).toBeVisible();
      await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
      await settlePublicationPage(page);
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(`${baseURL}/${prefix ? '' : 'en/'}${slug}${suffix}/`);
      await settlePublicationPage(page);
      await expect(page.locator('h1')).toContainText('G07');
      expect(failures).toEqual([]);
    });
  }
  test(`${prefix}G07 reaches the practice anchor after document readiness`, async ({ page, baseURL }, info) => {
    if (prefix && info.project.name === 'chromium') {
      // Reproduce the hosted WebKit gap: navigation committed, but the late
      // Practice Bank anchor is still behind a parser-blocking resource.
      await page.route('**/g07-parser-gate.js', async route => {
        await new Promise(resolve => setTimeout(resolve, 6500));
        await route.fulfill({ contentType: 'text/javascript', body: '/* parser gate */' });
      });
      await page.route(`**/${prefix}practice/`, async route => {
        const response = await route.fetch();
        const html = await response.text();
        const anchor = '<span id="pb-r6-008"';
        expect(html).toContain(anchor);
        await route.fulfill({ response, body: html.replace(anchor, `<script src="/g07-parser-gate.js"></script>${anchor}`) });
      });
    }
    await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
    await page.locator(`main a[href="/${prefix}practice/#pb-r6-008"]`).click();
    await page.waitForURL(`${baseURL}/${prefix}practice/#pb-r6-008`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#pb-r6-008')).toHaveCount(1);
    await settlePublicationPage(page);
  });
  test(`${prefix}G07 reaches the source anchor after document readiness`, async ({ page, baseURL }) => {
    // Keep each large-index journey inside its own existing 30-second budget.
    await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
    await page.locator(`main a[href="/${prefix}sources-and-versions/#src-cuda-100"]`).first().click();
    await page.waitForURL(`${baseURL}/${prefix}sources-and-versions/#src-cuda-100`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#src-cuda-100')).toHaveCount(1);
    await settlePublicationPage(page);
  });
  test(`@accessibility ${prefix}G07 lesson, hints and answers`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Serialized Chromium axe gate.');
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 360, height: 800 });
    for (const suffix of ['', '/exercises', '/solutions']) {
      await page.goto(`/${prefix}${slug}${suffix}/`, { waitUntil: 'networkidle' });
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(audit.violations).toEqual([]);
    }
  });
}

test.describe('G07 no-script reading', () => {
  test.use({ javaScriptEnabled: false });
  for (const prefix of ['', 'en/']) {
    test(`${prefix}native hints and separate solution`, async ({ page }) => {
      await page.goto(`/${prefix}${slug}/exercises/`);
      await page.locator('main details summary').first().press('Enter');
      await expect(page.locator('main details').first()).toHaveAttribute('open', '');
      await page.locator(`main a[href="/${prefix}${slug}/solutions/"]`).click();
      await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', 'G07-SOLUTIONS');
      await expect(page.locator('main details')).toHaveCount(0);
    });
  }
});
