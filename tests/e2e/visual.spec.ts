// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

function pngDimensions(buffer: Buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('@visual selected home layouts produce reviewable screenshots', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Selected visual evidence is owned by pinned Chromium.');

  for (const locale of [
    { name: 'zh', route: '/' },
    { name: 'en', route: '/en/' },
  ]) {
    for (const colorScheme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(locale.route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
      await expect(page.locator('.signal-hero')).toBeVisible();
      const desktop = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${locale.name}-${colorScheme}-home-desktop.png`),
      });
      expect(pngDimensions(desktop).width).toBe(1280);
      expect(desktop.byteLength).toBeGreaterThan(50_000);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(locale.route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const mobile = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${locale.name}-${colorScheme}-home-mobile.png`),
      });
      expect(pngDimensions(mobile).width).toBe(390);
      expect(mobile.byteLength).toBeGreaterThan(25_000);
    }
  }
});
