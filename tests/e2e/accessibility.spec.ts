// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';

const criticalRoutes = [
  '/',
  '/en/',
  '/start/using-the-learning-site/',
  '/en/start/using-the-learning-site/',
  '/start/evidence-status/',
  '/en/start/evidence-status/',
  '/start/evidence-status/exercises/',
  '/en/start/evidence-status/exercises/',
  '/start/evidence-status/solutions/',
  '/en/start/evidence-status/solutions/',
  '/start/environment-manifest/',
  '/en/start/environment-manifest/',
  '/start/environment-manifest/exercises/',
  '/en/start/environment-manifest/exercises/',
  '/start/environment-manifest/solutions/',
  '/en/start/environment-manifest/solutions/',
  '/foundations/first-cuda-kernel/',
  '/en/foundations/first-cuda-kernel/',
  '/foundations/first-cuda-kernel/exercises/',
  '/en/foundations/first-cuda-kernel/exercises/',
  '/foundations/first-cuda-kernel/solutions/',
  '/en/foundations/first-cuda-kernel/solutions/',
  '/examples/vector-addition/',
  '/en/examples/vector-addition/',
  '/labs/vector-addition/',
  '/en/labs/vector-addition/',
  '/visuals/kernel-journey/',
  '/en/visuals/kernel-journey/',
  '/visuals/indexing/',
  '/en/visuals/indexing/',
  '/practice/',
  '/en/practice/',
  '/glossary/',
  '/en/glossary/',
  '/sources-and-versions/',
  '/en/sources-and-versions/',
  '/about/',
  '/en/about/',
];

test('@accessibility axe detects no tagged violations across themes; this is not a conformance claim', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
  test.setTimeout(180_000);

  for (const theme of THEME_IDS) {
    await page.goto('/');
    await page.evaluate(
      ([storageKey, value]) => localStorage.setItem(storageKey, value),
      [THEME_STORAGE_KEY, theme] as const,
    );

    for (const route of criticalRoutes) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();

      expect(
        results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
        `${theme}: ${route}`,
      ).toEqual([]);
    }

    await page.goto('/en/visuals/kernel-journey/');
    await page.locator('[data-action="scrub"]').fill('5');
    let results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, `${theme}: VIS01 memory state`).toEqual([]);

    await page.goto('/en/visuals/indexing/');
    await page.locator('[data-dimension-picker]').selectOption('3');
    await page.locator('[data-index-field="extent.x"]').fill('9');
    results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, `${theme}: VIS02 out-of-bounds state`).toEqual([]);
  }
});
