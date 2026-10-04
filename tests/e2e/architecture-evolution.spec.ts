// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const prefix of ['', 'en/']) {
  test(`${prefix}H06 reaches the canonical project and both exact-gated Labs`, async ({ page }) => {
    await page.goto(`/${prefix}architecture/portable-specialization/`);
    await page.locator(`main a[href="/${prefix}examples/feature-gated-copy/"]`).first().click();
    await expect(page.locator('main')).toContainText('100f');
    for (const slug of ['hopper-portable-comparison', 'blackwell-portable-comparison']) {
      await page.goto(`/${prefix}labs/${slug}/`);
      await expect(page.locator('main')).toContainText('recorded_observations: []');
      await expect(page.locator('main')).toContainText('Pending Hardware Verification');
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(new RegExp(`/${prefix ? '' : 'en/'}labs/${slug}/$`));
    }
  });
  for (const route of ['examples/feature-gated-copy', 'labs/hopper-portable-comparison', 'labs/blackwell-portable-comparison']) {
    test(`${prefix}${route} mobile contract @accessibility`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${prefix}${route}/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    });
  }
  test(`${prefix}VIS15 exact intersection, empty state, keyboard reset and mobile layout`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${prefix}visuals/architecture-evolution/`);
    const visual = page.locator('architecture-evolution');
    await expect(visual).toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-results] section')).toHaveCount(12);
    await visual.locator('[data-feature]').selectOption('async-copy');
    await expect(visual.locator('[data-results] section')).toHaveCount(11);
    await visual.locator('[data-capability]').selectOption('8.6');
    await visual.locator('[data-feature]').selectOption('fp64');
    await expect(visual.locator('[data-results] section')).toHaveCount(0);
    await expect(visual.getByRole('status')).toContainText(prefix ? 'No reviewed state' : '没有已核对状态');
    await visual.locator('[data-capability]').selectOption('8.0');
    await expect(visual.locator('[data-results] section')).toHaveCount(1);
    await expect(visual.locator('[data-results]')).toContainText('CC 8.0');
    await visual.locator('[data-capability]').selectOption('8.9');
    await visual.locator('[data-feature]').selectOption('l2-policy');
    await expect(visual.locator('[data-results]')).toContainText('Ada');
    for (const feature of ['clusters', 'dsm', 'tma']) {
      await visual.locator('[data-capability]').selectOption('8.9');
      await visual.locator('[data-feature]').selectOption(feature);
      await expect(visual.locator('[data-results] section')).toHaveCount(0);
      await visual.locator('[data-capability]').selectOption('9.0');
      await expect(visual.locator('[data-results] section')).toHaveCount(1);
      await expect(visual.locator('[data-results]')).toContainText('227 KiB');
    }
    await visual.locator('[data-capability]').selectOption('12.1');
    await visual.locator('[data-feature]').selectOption('fp64');
    await expect(visual.locator('[data-results] section')).toHaveCount(0);
    await visual.locator('[data-feature]').selectOption('family-target');
    await expect(visual.locator('[data-results]')).toContainText('compute_121f');
    await visual.locator('[data-capability]').selectOption('10.7');
    await expect(visual.locator('[data-results]')).toContainText('327 KiB');
    await visual.locator('[data-capability]').selectOption('all');
    await visual.locator('[data-feature]').selectOption('fp4');
    await expect(visual.locator('[data-results] section')).toHaveCount(6);
    await visual.locator('[data-reset]').focus();
    await page.keyboard.press('Enter');
    await expect(visual.locator('[data-capability]')).toBeFocused();
    await expect(visual.locator('[data-results] section')).toHaveCount(12);
    await page.keyboard.press('Tab');
    await expect(visual.locator('[data-feature]')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.reload();
    await expect(page.locator('[data-results] section')).toHaveCount(12);
  });
  test(`${prefix}architecture lessons lead through hints to separate solutions and counterpart`, async ({ page }) => {
    test.setTimeout(90_000);
    for (const slug of ['turing-warp-safety', 'ampere-pipelines-tensor-cores', 'ada-working-sets', 'hopper-clusters-tma', 'blackwell-families', 'portable-specialization']) {
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
    await expect(visual.locator('table tbody tr')).toHaveCount(15);
    await expect(visual.locator('table')).toContainText('CC 8.9');
    await expect(visual.locator('table')).toContainText('CC 9.0');
    await expect(visual.locator('table')).toContainText('CC 12.1');
    await expect(visual.locator('table')).toContainText('227 KiB');
    await context.close();
  });
  test(`${prefix}VIS15 default and empty states @accessibility`, async ({ page }) => {
    await page.goto(`/${prefix}visuals/architecture-evolution/`);
    await expect(page.locator('architecture-evolution')).toHaveAttribute('data-ready', 'true');
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
    await page.locator('[data-capability]').selectOption('8.9');
    await page.locator('[data-feature]').selectOption('tma');
    expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
  });
  for (const slug of ['ada-working-sets', 'hopper-clusters-tma', 'blackwell-families', 'portable-specialization']) {
    test(`${prefix}${slug} complete pair and worksheets @accessibility`, async ({ page }) => {
      test.setTimeout(90_000);
      for (const suffix of ['', 'exercises/', 'solutions/']) {
        await page.goto(`/${prefix}architecture/${slug}/${suffix}`);
        await page.setViewportSize({ width: 390, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
        expect((await new AxeBuilder({ page }).include('main').analyze()).violations).toEqual([]);
      }
    });
  }
  test(`${prefix}VIS15 text zoom, forced colors and print retain complete contracts`, async ({ page }) => {
    await page.goto(`/${prefix}visuals/architecture-evolution/`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.locator('[data-capability]').selectOption('9.0');
    await page.locator('[data-feature]').selectOption('tma');
    await expect(page.locator('[data-results] section')).toHaveCount(1);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('[data-controls]')).toBeHidden();
    await expect(page.locator('architecture-evolution table')).toContainText('Ada');
    await expect(page.locator('architecture-evolution table')).toContainText('Hopper');
  });
}
