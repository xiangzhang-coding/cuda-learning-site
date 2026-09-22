// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const prefix of ['', 'en/']) {
  test(`${prefix}VIS15 exact intersection, empty state, keyboard reset and mobile layout`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${prefix}visuals/architecture-evolution/`);
    const visual = page.locator('architecture-evolution');
    await expect(visual).toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-results] section')).toHaveCount(4);
    await visual.locator('[data-feature]').selectOption('async-copy');
    await expect(visual.locator('[data-results] section')).toHaveCount(3);
    await visual.locator('[data-capability]').selectOption('8.6');
    await visual.locator('[data-feature]').selectOption('fp64');
    await expect(visual.locator('[data-results] section')).toHaveCount(0);
    await expect(visual.getByRole('status')).toContainText(prefix ? 'No reviewed state' : '没有已核对状态');
    await visual.locator('[data-capability]').selectOption('8.0');
    await expect(visual.locator('[data-results] section')).toHaveCount(1);
    await expect(visual.locator('[data-results]')).toContainText('CC 8.0');
    await visual.locator('[data-reset]').focus();
    await page.keyboard.press('Enter');
    await expect(visual.locator('[data-capability]')).toBeFocused();
    await expect(visual.locator('[data-results] section')).toHaveCount(4);
    await page.keyboard.press('Tab');
    await expect(visual.locator('[data-feature]')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.reload();
    await expect(page.locator('[data-results] section')).toHaveCount(4);
  });
  test(`${prefix}architecture lessons lead through hints to separate solutions and counterpart`, async ({ page }) => {
    for (const slug of ['turing-warp-safety', 'ampere-pipelines-tensor-cores']) {
      await page.goto(`/${prefix}architecture/${slug}/`);
      await page.locator(`main a[href="/${prefix}architecture/${slug}/exercises/"]`).click();
      await expect(page.locator('main details[open]')).toHaveCount(0);
      await page.locator('main summary').first().focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('main details[open]')).toHaveCount(1);
      await page.locator(`main a[href="/${prefix}architecture/${slug}/solutions/"]`).click();
      await expect(page.locator('main')).toContainText('Pending Hardware Verification');
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(new RegExp(`/${prefix ? '' : 'en/'}architecture/${slug}/solutions/$`));
    }
  });
  test(`${prefix}VIS15 complete comparison without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`/${prefix}visuals/architecture-evolution/`);
    const visual = page.locator('architecture-evolution');
    await expect(visual.locator('[data-controls]')).toBeHidden();
    await expect(visual.locator('table tbody tr')).toHaveCount(9);
    await expect(visual.locator('table')).toContainText('CC 8.7');
    await expect(visual.locator('table')).toContainText('163 KiB');
    await context.close();
  });
  test(`${prefix}VIS15 default and empty states @accessibility`, async ({ page }) => {
    await page.goto(`/${prefix}visuals/architecture-evolution/`);
    await expect(page.locator('architecture-evolution')).toHaveAttribute('data-ready', 'true');
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    await page.locator('[data-capability]').selectOption('7.5');
    await page.locator('[data-feature]').selectOption('tf32');
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  });
}
