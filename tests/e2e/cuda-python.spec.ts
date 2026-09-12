// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEME_IDS } from '../../src/theme-contract';
import { collectBrowserFailures } from '../helpers/browser-contract';

const units = [
  { id: 'P01', slug: 'python/cuda-python-bridge' },
  { id: 'P02', slug: 'python/devices-contexts-launches' },
  { id: 'P03', slug: 'python/runtime-compilation-linking' },
];
const example = 'examples/cuda-python-launch';
const pages = [...units.flatMap(({ id, slug }) => [
  { id, slug }, { id: `${id}-EXERCISES`, slug: `${slug}/exercises` }, { id: `${id}-SOLUTIONS`, slug: `${slug}/solutions` },
]), { id: 'EX21', slug: example }];

for (const { id, slug } of pages) {
  test(`${id} has a direct Publication Pair counterpart and independent evidence`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    await page.goto(`/${slug}/`, { waitUntil: 'networkidle' });
    for (const locale of ['', 'en/']) {
      await expect(page.locator('main h1')).toContainText(id.split('-')[0]);
      await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', id);
      await expect(page.locator('meta[name="cuda:fact-check-date"]')).toHaveAttribute('content', '2026-09-12');
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content',
        id === 'EX21' ? 'Pending Hardware Verification' : 'none');
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      const counterpart = `/${locale ? '' : 'en/'}${slug}/`;
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      await page.locator('[data-locale-counterpart]').click();
      await expect(page).toHaveURL(`${baseURL}${counterpart}`);
      await page.waitForLoadState('networkidle');
    }
    expect(failures).toEqual([]);
  });
}

for (const locale of ['', 'en/']) {
  test(`${locale || 'zh-CN/'}Python bridge follows P01 to P03 and EX21 without downstream placeholders`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    await page.goto(`/${locale}${units[0].slug}/`);
    const group = page.locator('nav details').filter({ has: page.locator('summary', { hasText: locale ? 'Python Bridge' : 'Python 桥接' }) });
    await expect(group).toHaveCount(1);
    for (const { slug } of units) await expect(group.locator(`a[href="/${locale}${slug}/"]`)).toHaveCount(1);
    await expect(page.locator('nav a[href*="/frameworks/"], nav a[href*="/triton/"]')).toHaveCount(0);
    for (const { slug, id } of units.slice(1)) {
      await page.locator(`main a[href="/${locale}${slug}/"]`).first().click();
      await expect(page.locator('main h1')).toContainText(id);
    }
    await page.locator(`main a[href="/${locale}${example}/"]`).first().click();
    await expect(page).toHaveURL(`${baseURL}/${locale}${example}/`);
    await expect(page.locator('main h1')).toContainText('EX21');
    await expect(page.locator('meta[name="cuda:prerequisites"]')).toHaveAttribute('content', 'P02');
    for (const pin of ['3.14.7', '1.2.0', '13.4.1', '1.8.1', '2.5.3', '13.3.1', '13.3.33', '610.43.02']) {
      await expect(page.locator('main')).toContainText(pin);
    }
    for (const command of ['host-test', 'build']) await expect(page.locator('main')).toContainText(command);
    const ranges = (await page.locator('meta[name="cuda:canonical-ranges"]').getAttribute('content'))!.split(',');
    expect(ranges.length).toBeGreaterThanOrEqual(3);
    const imports = page.locator('figure[data-canonical-example="EX21"]');
    await expect(imports).toHaveCount(ranges.length);
    expect(await imports.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-canonical-range')))).toEqual(ranges);
    for (const code of await imports.all()) {
      await expect(code.locator('pre code')).toBeVisible();
      await expect(code.locator('figcaption a')).toBeVisible();
      expect((await code.locator('pre code').innerText()).trim()).not.toBe('');
    }
    expect(failures).toEqual([]);
  });

  for (const { id, slug } of units) {
    test(`${locale || 'zh-CN/'}${id} narrow-screen exercises, keyboard hints, separate solutions and EX21`, async ({ page, baseURL }, info) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const route = `/${locale}${slug}/`;
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
      await expect(page).toHaveURL(new RegExp(`${route}exercises/$`));
      await expect(hints).toHaveCount(4);
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
      await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', 'solution-set');
      await expect(page.locator('main details')).toHaveCount(0);
      await expect(page.locator('main h2').filter({ hasText: /^(?:Solution|解答) \d+[:：]/ })).toHaveCount(2);
      await page.locator(`main a[href="/${locale}${example}/"]`).first().click();
      await expect(page.locator('main h1')).toContainText('EX21');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
      for (const code of await page.locator('figure[data-canonical-example="EX21"]').all()) {
        await expect(code.locator('pre code')).toBeVisible();
        await expect(code.locator('figcaption a')).toBeVisible();
      }
      expect(failures).toEqual([]);
    });
  }

  test(`${locale || 'zh-CN/'}Python bridge keeps content readable in every theme and in print`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the theme/print matrix; every browser owns the mobile journey.');
    test.setTimeout(120_000);
    for (const theme of THEME_IDS) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
      await page.goto(`/${locale}${example}/`);
      await page.getByRole('banner').getByRole('combobox', { name: locale ? 'Select visual theme' : '选择视觉主题' }).selectOption(theme);
      await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
      await page.setViewportSize({ width: 360, height: 800 });
      for (const { id, slug } of pages) {
        await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
        await page.goto(`/${locale}${slug}/`);
        await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
        await expect(page.locator('main h1')).toContainText(id.split('-')[0]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme} ${slug}`).toBe(true);
        await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
        await expect(page.locator('main h1')).toBeVisible();
        for (const element of await page.locator('main table, main pre code, main details summary').all()) {
          await expect(element).toBeVisible();
        }
      }
    }
  });

  test(`@accessibility ${locale || 'zh-CN/'}Python bridge pairs with open hints`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the serialized axe gate.');
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const { id, slug } of pages) {
      await page.goto(`/${locale}${slug}/`);
      await expect(page.locator('main h1')).toContainText(id.split('-')[0]);
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })), slug).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
    }
  });
}

test.describe('CUDA Python without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('bilingual hints, separate solutions, counterpart links and canonical code remain usable', async ({ page, baseURL }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the no-script gate.');
    const failures = collectBrowserFailures(page, baseURL!);
    for (const locale of ['', 'en/']) {
      for (const { slug } of units) {
        await page.goto(`/${locale}${slug}/exercises/`);
        expect(await page.locator('main details').count()).toBeGreaterThanOrEqual(4);
        await expect(page.locator('main details[open]')).toHaveCount(0);
        const hint = page.locator('main details').first();
        await hint.locator('summary').press('Enter');
        await expect(hint).toHaveJSProperty('open', true);
        expect((await hint.innerText()).replace(await hint.locator('summary').innerText(), '').trim()).not.toBe('');
        await page.locator(`main a[href="/${locale}${slug}/solutions/"]`).first().click();
        await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', 'solution-set');
        await expect(page.locator('main details')).toHaveCount(0);
        await page.locator(`main a[href="/${locale}${example}/"]`).first().click();
        const imports = page.locator('figure[data-canonical-example="EX21"]');
        expect(await imports.count()).toBeGreaterThanOrEqual(3);
        for (const code of await imports.all()) await expect(code.locator('pre code')).toBeVisible();
        const counterpart = `/${locale ? '' : 'en/'}${example}/`;
        await page.locator('[data-locale-counterpart]').click();
        await expect(page).toHaveURL(`${baseURL}${counterpart}`);
        await expect(page.locator('main h1')).toContainText('EX21');
      }
    }
    expect(failures).toEqual([]);
  });
});
