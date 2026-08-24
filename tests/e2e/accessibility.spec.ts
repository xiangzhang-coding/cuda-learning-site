// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

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
  '/practice/',
  '/en/practice/',
  '/glossary/',
  '/en/glossary/',
  '/sources-and-versions/',
  '/en/sources-and-versions/',
  '/about/',
  '/en/about/',
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
