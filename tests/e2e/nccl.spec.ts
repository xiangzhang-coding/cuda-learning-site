// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

for (const prefix of ['', 'en/']) {
  test(`${prefix}NCCL collective controls, locale and evidence journey`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${prefix}visuals/collective-paths/`, { waitUntil: 'networkidle' });
    const model = page.locator('[data-visual-id="VIS16"]');
    await expect(model.locator('[data-hop]')).toContainText('1 → 2');
    await model.locator('[data-next]').focus();
    await page.keyboard.press('Enter');
    await expect(model.locator('[data-hop]')).toContainText('2 → 3');
    await model.locator('[data-collective]').selectOption('all-gather');
    await model.locator('[data-topology]').selectOption('star');
    await model.locator('[data-ranks]').selectOption('8');
    await expect(model.locator('[data-ledger] tr')).toHaveCount(8);
    await expect(model.locator('[data-ledger] tr').last()).toContainText('[1, 2, 3, 4, 5, 6, 7, 8]');
    await model.locator('[data-reset]').click();
    await expect(model.locator('[data-previous]')).toBeDisabled();
    await expect(model.locator('[data-ledger] tr')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('[data-locale-counterpart]').click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-visual-id="VIS16"]')).toBeVisible();
    for (const resource of ['examples/nccl-all-reduce', 'labs/nccl-all-reduce']) {
      await page.goto(`/${prefix}${resource}/`, { waitUntil: 'networkidle' });
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'Pending Hardware Verification');
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    expect(failures).toEqual([]);
  });
  test(`${prefix}VIS16 no-script and print fallback`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`/${prefix}visuals/collective-paths/`);
    await expect(page.locator('collective-explorer pre')).toHaveCount(2);
    await expect(page.locator('[data-ledger] tr')).toHaveCount(4);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('collective-explorer fieldset')).toBeHidden();
    await expect(page.locator('collective-explorer pre').first()).toBeVisible();
    await context.close();
  });
  for (const slug of ['visuals/collective-paths', 'examples/nccl-all-reduce', 'labs/nccl-all-reduce']) {
    test(`@accessibility ${prefix}${slug}`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations).toEqual([]);
    });
  }
}
