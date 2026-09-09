// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { collectBrowserFailures } from '../helpers/browser-contract';

const unit = 'libraries/cufft-plans-layouts-startup';
const example = 'examples/cufft-batched-transform';
const slugs = [unit, `${unit}/exercises`, `${unit}/solutions`, example];

for (const slug of slugs) {
  test(`${slug} has direct locale navigation and independent evidence`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    await page.goto(`/${slug}/`);
    for (const locale of ['', 'en/']) {
      await expect(page.locator('main h1')).toContainText(slug === example ? 'EX19' : 'L12');
      await expect(page.locator('meta[name="cuda:fact-check-date"]')).toHaveAttribute('content', '2026-09-08');
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content',
        slug === example ? 'Pending Hardware Verification' : 'none');
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      const counterpart = `/${locale ? '' : 'en/'}${slug}/`;
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(`${baseURL}${counterpart}`);
      await page.waitForLoadState('domcontentloaded');
    }
    expect(failures).toEqual([]);
  });
}

for (const locale of ['', 'en/']) {
  test(`${locale || 'zh-CN/'}cuFFT narrow-screen learning, hints, solutions and canonical source journey`, async ({ page, baseURL }, info) => {
    const failures = collectBrowserFailures(page, baseURL!);
    const route = `/${locale}${unit}/`;
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(route);
    const table = page.locator('main table').first();
    await expect(table).toHaveAttribute('tabindex', '0');
    if (info.project.name !== 'mobile-safari') {
      await table.focus();
      await expect(table).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator(`main a[href="${route}exercises/"]`).first().click();
    const hints = page.locator('main details');
    await expect(hints).toHaveCount(6);
    await expect(page.locator('main details[open]')).toHaveCount(0);
    for (const hint of await hints.all()) {
      const summary = hint.locator('summary');
      if (info.project.name === 'mobile-safari') await summary.tap();
      else await summary.press('Enter');
      await expect(hint).toHaveJSProperty('open', true);
      expect((await hint.innerText()).replace(await summary.innerText(), '').trim()).not.toBe('');
      if (info.project.name === 'mobile-safari') await summary.tap();
      else await summary.press('Space');
      await expect(hint).toHaveJSProperty('open', false);
    }
    await page.locator(`main a[href="${route}solutions/"]`).first().click();
    await expect(page.locator('main')).toContainText('36*4=144');
    await expect(page.locator('main')).toContainText('max(4096,6144)=6144');
    await expect(page.locator('main details')).toHaveCount(0);
    await page.locator(`main a[href="/${locale}${example}/"]`).first().click();
    const imports = page.locator('[data-canonical-example="EX19"]');
    await expect(imports).toHaveCount(3);
    await expect(page.locator('main')).toContainText('cufftMakePlanMany');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    for (const code of await imports.all()) await expect(code).toBeVisible();
    expect(failures).toEqual([]);
  });

  test(`@accessibility ${locale || 'zh-CN/'}cuFFT pair surfaces and open hints`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the serialized axe gate.');
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of slugs) {
      await page.goto(`/${locale}${slug}/`);
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })), slug).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
    }
  });
}

test.describe('cuFFT without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('paper hints and canonical code remain readable', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the no-script gate.');
    await page.goto(`/en/${unit}/exercises/`);
    const hint = page.locator('main details').first();
    await hint.locator('summary').press('Enter');
    await expect(hint).toHaveJSProperty('open', true);
    await page.goto(`/en/${example}/`);
    await expect(page.locator('[data-canonical-example="EX19"]')).toHaveCount(3);
    await expect(page.locator('main')).toContainText('cufftSetWorkArea');
  });
});
