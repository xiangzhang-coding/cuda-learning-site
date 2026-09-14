// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { THEME_IDS } from '../../src/theme-contract';
import { collectBrowserFailures } from '../helpers/browser-contract';

const units = ['triton/programs-and-block-values', 'triton/masked-vector-addition'];
const routes = [...units.flatMap((slug) => [slug, `${slug}/exercises`, `${slug}/solutions`]),
  'examples/triton-vector-add', 'visuals/simt-triton-mapping'];

for (const prefix of ['', 'en/']) {
  test(`${prefix}Triton complete pairs, hints, canonical code and narrow layout`, async ({ page, baseURL }, info) => {
    test.setTimeout(120_000);
    const failures = collectBrowserFailures(page, baseURL!);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of routes) {
      await page.goto(`/${prefix}${slug}/`, { waitUntil: 'networkidle' });
      await expect(page.locator('meta[name="cuda:fact-check-date"]')).toHaveAttribute('content', '2026-09-14');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', slug.startsWith('examples/') ? 'Pending Hardware Verification' : 'none');
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', `/${prefix ? '' : 'en/'}${slug}/`);
      if (slug.endsWith('/exercises')) {
        await expect(page.locator('main details')).toHaveCount(4);
        for (const hint of await page.locator('main details').all()) {
          if (info.project.name === 'mobile-safari') await hint.locator('summary').tap();
          else await hint.locator('summary').press('Enter');
          await expect(hint).toHaveJSProperty('open', true);
        }
        await page.locator(`main a[href="/${prefix}${slug.replace('/exercises', '/solutions')}/"]`).click();
        await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', 'solution-set');
        await page.waitForLoadState('networkidle');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), slug).toBe(true);
    }
    await page.goto(`/${prefix}examples/triton-vector-add/`, { waitUntil: 'networkidle' });
    await expect(page.locator('figure[data-canonical-example="EX23"]')).toHaveCount(4);
    await page.locator('[data-locale-counterpart]').click();
    await expect(page.locator('main h1')).toContainText('EX23');
    await page.waitForLoadState('networkidle');
    expect(failures).toEqual([]);
  });

  test(`${prefix}VIS17 keyboard mapping preserves program bounds and reset`, async ({ page }, info) => {
    await page.goto(`/${prefix}visuals/simt-triton-mapping/`);
    const visual = page.locator('triton-mapping');
    await expect(visual).toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('tbody tr[data-valid="true"]')).toHaveCount(5);
    await expect(visual.locator('tbody tr[data-valid="false"]')).toHaveCount(11);
    const previous = visual.locator('[data-previous]');
    if (info.project.name === 'mobile-safari') await previous.tap();
    else await previous.press('Enter');
    await expect(visual.locator('caption')).toContainText(prefix ? 'program = 1' : '程序实例 = 1');
    await expect(visual.locator('tbody tr[data-valid="true"]')).toHaveCount(16);
    await visual.locator('[data-size]').selectOption('1003');
    await visual.locator('[data-tile]').selectOption('256');
    await visual.locator('[data-program]').selectOption('3');
    await expect(visual.locator('tbody tr[data-valid="true"]')).toHaveCount(235);
    await expect(visual.locator('tbody tr[data-valid="false"]')).toHaveCount(21);
    await visual.locator('[data-size]').selectOption('1');
    await expect(visual.locator('[data-program]')).toHaveValue('0');
    await expect(visual.locator('[data-next]')).toBeDisabled();
    await visual.locator('[data-reset]').click();
    await expect(visual.locator('caption')).toHaveText(prefix ? 'N = 37, B = 16, program = 2' : 'N = 37, B = 16, 程序实例 = 2');
    await page.reload();
    await expect(visual.locator('caption')).toHaveText(prefix ? 'N = 37, B = 16, program = 2' : 'N = 37, B = 16, 程序实例 = 2');
  });

  test(`@accessibility ${prefix}Triton pairs and VIS17 open-hint states`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Serialized Chromium axe gate.');
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const slug of routes) {
      await page.goto(`/${prefix}${slug}/`);
      for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
      const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })), slug).toEqual([]);
    }
  });

  test(`${prefix}VIS17 themes, reduced motion, forced colors and print`, async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium', 'Chromium owns the presentation matrix.');
    for (const theme of THEME_IDS) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/${prefix}visuals/simt-triton-mapping/`);
      await page.getByRole('banner').getByRole('combobox', { name: prefix ? 'Select visual theme' : '选择视觉主题' }).selectOption(theme);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('triton-mapping table')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(page.locator('triton-mapping tbody tr[data-valid="false"]').first()).toContainText('false');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('triton-mapping .static-map')).toBeVisible();
    await expect(page.locator('triton-mapping fieldset')).toBeHidden();
  });
}

test.describe('VIS17 static fallback', () => {
  test.use({ javaScriptEnabled: false });
  test('both locales keep the initial and static side-by-side mapping', async ({ page }) => {
    for (const prefix of ['', 'en/']) {
      await page.goto(`/${prefix}visuals/simt-triton-mapping/`);
      await expect(page.locator('triton-mapping tbody tr')).toHaveCount(16);
      await expect(page.locator('triton-mapping .static-map section')).toHaveCount(3);
      await expect(page.locator('triton-mapping .static-map')).toContainText('5 true / 11 false');
    }
  });
});
