// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures, expectRankedSearchResult } from '../helpers/browser-contract';

const slug = 'libraries/libcu-plus-plus-synchronization';

test('L05 is discoverable through each locale search index', async ({ page }) => {
  for (const locale of ['', 'en/']) {
    await expectRankedSearchResult(page, {
      route: `/${locale}`,
      button: locale ? /Search/ : /搜索/,
      query: 'L05 libcu++ atomic_ref',
      localePrefix: `/${locale}`,
      expectedHrefs: [`/${locale}${slug}/`],
    });
  }
});

test('L05 pairs preserve locale navigation, keyboard hints, tables, and mobile reflow', async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  for (const suffix of ['', '/exercises', '/solutions']) {
    const route = `/${slug}${suffix}/`;
    for (const locale of ['', 'en/']) {
      const localizedRoute = `/${locale}${slug}${suffix}/`;
      expect((await page.goto(localizedRoute))?.ok()).toBe(true);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main h1')).toContainText('L05');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href', `https://cuda-learning-site.hmzhangxiang.workers.dev${localizedRoute}`,
      );
      for (const key of ['evidence-compilation', 'evidence-runtime', 'expected-observations', 'recorded-observations']) {
        await expect(page.locator(`meta[name="cuda:${key}"]`)).toHaveAttribute('content', 'none');
      }
      await expect(page.locator('main pre, [data-canonical-example]')).toHaveCount(0);

      if (suffix === '/exercises') {
        const hints = page.locator('main details');
        await expect(hints).toHaveCount(6);
        for (const hint of await hints.all()) {
          await expect(hint).toHaveJSProperty('open', false);
          const summary = hint.locator('summary');
          if (testInfo.project.name === 'mobile-safari') {
            await summary.click();
          } else {
            await summary.focus();
            await expect(summary).toBeFocused();
            await page.keyboard.press('Enter');
          }
          await expect(hint).toHaveJSProperty('open', true);
        }
        await expect(page.locator(`main a[href="/${locale}${slug}/solutions/"]`).first()).toBeVisible();
      } else {
        const tables = page.locator('main table');
        expect(await tables.count()).toBeGreaterThan(0);
        for (const table of await tables.all()) {
          await expect(table).toHaveAttribute('tabindex', '0');
        }
        if (testInfo.project.name !== 'mobile-safari') {
          await tables.first().focus();
          await expect(tables.first()).toBeFocused();
        }
        await page.emulateMedia({ media: 'print' });
        for (const table of await tables.all()) await expect(table).toBeVisible();
        await page.emulateMedia({ media: 'screen' });
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), localizedRoute)
        .toBe(true);
      const counterpart = locale ? route : `/en${route}`;
      const link = page.locator('[data-locale-counterpart]');
      await expect(link).toHaveAttribute('href', counterpart);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${counterpart}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'zh-CN' : 'en');
      await page.waitForLoadState('networkidle');
    }
  }
  expect(failures).toEqual([]);
});
