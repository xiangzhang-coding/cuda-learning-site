// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const routePairs = [
  {
    zh: '/correctness/transpose-optimization-case-study/',
    en: '/en/correctness/transpose-optimization-case-study/',
    unitId: 'Q11',
    runtimeEvidence: 'none',
    relatedSuffixes: ['examples/tiled-transpose/', 'visuals/tiled-transpose/'],
  },
  {
    zh: '/correctness/transpose-optimization-case-study/exercises/',
    en: '/en/correctness/transpose-optimization-case-study/exercises/',
    unitId: 'Q11-EXERCISES',
    runtimeEvidence: 'none',
    relatedSuffixes: [],
  },
  {
    zh: '/correctness/transpose-optimization-case-study/solutions/',
    en: '/en/correctness/transpose-optimization-case-study/solutions/',
    unitId: 'Q11-SOLUTIONS',
    runtimeEvidence: 'none',
    relatedSuffixes: [],
  },
  {
    zh: '/labs/optimize-canonical-transpose/',
    en: '/en/labs/optimize-canonical-transpose/',
    unitId: 'LAB10',
    runtimeEvidence: 'Pending Hardware Verification',
    relatedSuffixes: ['examples/tiled-transpose/', 'visuals/tiled-transpose/'],
  },
] as const;

test('Q11 and LAB10 expose bilingual evidence-bounded browser contracts', async ({ page }) => {
  test.setTimeout(120_000);
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
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute(
        'content',
        publication.runtimeEvidence,
      );
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      const localeLink = page.locator('[data-locale-counterpart]');
      await expect(localeLink).toHaveAttribute('href', counterpart);

      const localePrefix = locale === 'en' ? '/en/' : '/';
      for (const suffix of publication.relatedSuffixes) {
        await expect(page.locator(`main a[href="${localePrefix}${suffix}"]`).first(), `${route} -> ${suffix}`)
          .toBeVisible();
      }

      if (publication.unitId === 'Q11-EXERCISES') {
        const hints = page.locator('main details');
        await expect(hints).toHaveCount(6);
        const firstHint = hints.first();
        const summary = firstHint.locator('summary');
        await expect(firstHint).toHaveJSProperty('open', false);
        await summary.focus();
        await expect(summary).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(firstHint).toHaveJSProperty('open', true);
        await page.keyboard.press('Space');
        await expect(firstHint).toHaveJSProperty('open', false);
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }

  expect(failures).toEqual([]);
});
