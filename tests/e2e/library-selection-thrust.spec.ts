// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const routePairs = [
  {
    zh: '/libraries/library-primitive-dsl-custom-kernel/',
    en: '/en/libraries/library-primitive-dsl-custom-kernel/',
    unitId: 'L01',
    table: true,
  },
  {
    zh: '/libraries/library-primitive-dsl-custom-kernel/exercises/',
    en: '/en/libraries/library-primitive-dsl-custom-kernel/exercises/',
    unitId: 'L01-EXERCISES',
    table: false,
  },
  {
    zh: '/libraries/library-primitive-dsl-custom-kernel/solutions/',
    en: '/en/libraries/library-primitive-dsl-custom-kernel/solutions/',
    unitId: 'L01-SOLUTIONS',
    table: false,
  },
  {
    zh: '/libraries/thrust-algorithm-vocabulary/',
    en: '/en/libraries/thrust-algorithm-vocabulary/',
    unitId: 'L02',
    table: true,
  },
  {
    zh: '/libraries/thrust-algorithm-vocabulary/exercises/',
    en: '/en/libraries/thrust-algorithm-vocabulary/exercises/',
    unitId: 'L02-EXERCISES',
    table: false,
  },
  {
    zh: '/libraries/thrust-algorithm-vocabulary/solutions/',
    en: '/en/libraries/thrust-algorithm-vocabulary/solutions/',
    unitId: 'L02-SOLUTIONS',
    table: false,
  },
] as const;

test('L01-L02 expose bilingual, keyboard-safe, evidence-neutral static contracts', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const publication of routePairs) {
    for (const locale of ['zh', 'en'] as const) {
      const route = publication[locale];
      const counterpart = publication[locale === 'zh' ? 'en' : 'zh'];
      const response = await page.goto(route);
      expect(response?.ok(), route).toBe(true);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('main h1')).toContainText(publication.unitId.split('-')[0]);
      await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', publication.unitId);
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      await expect(page.locator('main pre')).toHaveCount(0);
      if (publication.unitId === 'L02') {
        await expect(page.locator('meta[name="cuda:source-count"]')).toHaveAttribute('content', '21');
      }

      if (publication.table) {
        const table = page.locator('main table').first();
        await expect(table).toHaveAttribute('tabindex', '0');
        if (publication.unitId === 'L01') {
          await expect(table.locator('thead th')).toHaveCount(5);
          await expect(table.locator('tbody tr')).toHaveCount(7);
          const tableText = (await table.innerText()).replace(/\s+/g, ' ');
          for (const candidate of locale === 'en'
            ? ['Production library', 'Reusable primitive', 'DSL', 'Custom kernel']
            : ['生产库', '可复用原语', 'DSL', '自定义内核']) {
            expect(tableText, `${route}: ${candidate}`).toContain(candidate);
          }
          for (const criterion of locale === 'en'
            ? ['Correctness', 'Maintenance', 'Portability', 'Performance evidence', 'Ownership cost']
            : ['正确性', '维护', '可移植性', '性能证据', '所有权成本']) {
            expect(tableText, `${route}: ${criterion}`).toContain(criterion);
          }
        }
        if (testInfo.project.name !== 'mobile-safari') {
          await table.focus();
          await expect(table).toBeFocused();
        }
        await page.emulateMedia({ media: 'print' });
        await expect(table).toBeVisible();
        await page.emulateMedia({ media: 'screen' });
      }

      if (publication.unitId.endsWith('-EXERCISES')) {
        const hints = page.locator('main details');
        await expect(hints).toHaveCount(6);
        if (testInfo.project.name !== 'mobile-safari') {
          const firstHint = hints.first();
          await firstHint.locator('summary').focus();
          await page.keyboard.press('Enter');
          await expect(firstHint).toHaveJSProperty('open', true);
        }
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }

  expect(failures).toEqual([]);
});
