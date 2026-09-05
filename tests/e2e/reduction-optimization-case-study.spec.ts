// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const routePairs = [
  {
    zh: '/correctness/reduction-optimization-case-study/',
    en: '/en/correctness/reduction-optimization-case-study/',
    unitId: 'Q12',
    relatedSuffixes: [
      'examples/multi-stage-reduction/',
      'visuals/reduction-stages/',
      'libraries/cub-device-primitives/',
      'labs/compare-custom-reduction-with-cub/',
    ],
  },
  {
    zh: '/correctness/reduction-optimization-case-study/exercises/',
    en: '/en/correctness/reduction-optimization-case-study/exercises/',
    unitId: 'Q12-EXERCISES',
    relatedSuffixes: [
      'libraries/cub-device-primitives/',
      'labs/compare-custom-reduction-with-cub/',
    ],
  },
  {
    zh: '/correctness/reduction-optimization-case-study/solutions/',
    en: '/en/correctness/reduction-optimization-case-study/solutions/',
    unitId: 'Q12-SOLUTIONS',
    relatedSuffixes: [
      'libraries/cub-device-primitives/',
      'labs/compare-custom-reduction-with-cub/',
    ],
  },
] as const;

test('Q12 remains evidence-bounded while linking to published L03 and LAB11 follow-ons', async ({ page }) => {
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
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);

      const localePrefix = locale === 'en' ? '/en/' : '/';
      for (const suffix of publication.relatedSuffixes) {
        await expect(page.locator(`main a[href="${localePrefix}${suffix}"]`).first()).toBeVisible();
      }

      if (publication.unitId === 'Q12-EXERCISES') {
        const hints = page.locator('main details');
        await expect(hints).toHaveCount(6);
        const firstHint = hints.first();
        await firstHint.locator('summary').focus();
        await page.keyboard.press('Enter');
        await expect(firstHint).toHaveJSProperty('open', true);
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }

  expect(failures).toEqual([]);
});
