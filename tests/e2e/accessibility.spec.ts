// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const criticalRoutes = [
  '/',
  '/en/',
  '/start/using-the-learning-site/',
  '/en/start/using-the-learning-site/',
  '/sources-and-versions/',
  '/en/sources-and-versions/',
];

test('@accessibility critical bilingual routes have no automated WCAG A/AA violations', async ({ page }) => {
  for (const route of criticalRoutes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    expect(
      results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
      route,
    ).toEqual([]);
  }
});
