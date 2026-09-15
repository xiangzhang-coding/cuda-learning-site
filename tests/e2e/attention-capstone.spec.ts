// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

for (const prefix of ['', 'en/']) {
  const route = `/${prefix}triton/attention-capstone/`;
  test(`${prefix}T08 complete capstone journey and embedded VIS18 keyboard controls`, async ({ page, baseURL }, info) => {
    const failures = collectBrowserFailures(page, baseURL!);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route, { waitUntil: 'networkidle' });
    const visual = page.locator('cuda-attention-io-explorer[data-visual-id="VIS18"]');
    await expect(visual).toHaveAttribute('data-ready', 'true');
    await visual.locator('[data-attention-sequence-shape]').focus();
    await page.keyboard.press('Tab');
    await expect(visual.locator('[data-attention-tile-shape]')).toBeFocused();
    await visual.locator('[data-attention-stage-select]').selectOption('value');
    await expect(visual).toHaveAttribute('data-attention-stage', 'value');
    await visual.locator('[data-attention-action="reset"]').press('Enter');
    await expect(visual.locator('[data-attention-sequence-shape]')).toBeFocused();
    await page.locator(`main a[href="${route}exercises/"]`).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main details')).toHaveCount(4);
    for (const hint of await page.locator('main details').all()) {
      await expect(hint).toHaveJSProperty('open', false);
      if (info.project.name === 'mobile-safari') await hint.locator('summary').tap();
      else await hint.locator('summary').press('Enter');
      await expect(hint).toHaveJSProperty('open', true);
    }
    await page.locator(`main a[href="${route}solutions/"]`).click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-attention-kernel]')).toContainText('def attention_forward');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-locale-counterpart]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', 'T08-SOLUTIONS');
    expect(failures).toEqual([]);
  });

  for (const suffix of ['', 'exercises/', 'solutions/']) {
    test(`@accessibility ${prefix}T08 ${suffix || 'unit'}`, async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${route}${suffix}`, { waitUntil: 'networkidle' });
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) }))).toEqual([]);
    });
  }

  test(`${prefix}T08 no-script VIS18 fallback`, async ({ browser, baseURL }, info) => {
    test.skip(info.project.name !== 'chromium', 'Static fallback is browser-independent HTML.');
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 360, height: 800 } });
    try {
      const page = await context.newPage();
      await page.goto(`${baseURL}${route}`);
      const visual = page.locator('cuda-attention-io-explorer');
      await expect(visual.locator('[data-visual-controls]')).toBeHidden();
      await expect(visual.locator('[data-static-fallback]')).toBeVisible();
      await expect(visual.locator('[data-static-ledger]')).toHaveCount(4);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    } finally { await context.close(); }
  });
}
