// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const issue14StateScans = [
  {
    theme: 'silicon-light',
    label: 'F05 deferred synchronization state',
    route: '/en/foundations/asynchronous-errors/',
    prepare: async (page: Page) => {
      await page.locator('[data-action="select-scenario"]').selectOption('deferred-execution');
      await page.locator('cuda-error-timeline [data-action="scrub"]').fill('3');
    },
  },
  {
    theme: 'profiler-dark',
    label: 'F06 unknown capability state',
    route: '/en/foundations/compute-capability/',
    prepare: async (page: Page) => page.locator('[data-capability-input]').fill('8.6'),
  },
  {
    theme: 'blueprint',
    label: 'F07 completion and error boundary state',
    route: '/en/foundations/runtime-driver-api/',
    prepare: async (page: Page) => page.locator('[data-stage-tab="completion-errors"]').click(),
  },
  {
    theme: 'blueprint',
    label: 'F08 aggregate block-shape error state',
    route: '/en/foundations/launch-geometry/',
    prepare: async (page: Page) => {
      await page.locator('[data-block-shape-field="blockX"]').fill('1024');
      await page.locator('[data-block-shape-field="blockY"]').fill('2');
    },
  },
] as const;

test('@accessibility axe detects no tagged violations across themes; this is not a conformance claim', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
  test.setTimeout(360_000);

  for (const theme of THEME_IDS) {
    await page.goto('/');
    await page.evaluate(
      ([storageKey, value]) => localStorage.setItem(storageKey, value),
      [THEME_STORAGE_KEY, theme] as const,
    );

    for (const route of await discoverPublishedRoutes()) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
      const results = await new AxeBuilder({ page })
        .withTags(axeTags)
        .analyze();

      expect(
        results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
        `${theme}: ${route}`,
      ).toEqual([]);
    }

    await page.goto('/en/visuals/kernel-journey/');
    await page.locator('[data-action="scrub"]').fill('5');
    let results = await new AxeBuilder({ page })
      .withTags(axeTags)
      .analyze();
    expect(results.violations, `${theme}: VIS01 memory state`).toEqual([]);

    await page.goto('/en/visuals/indexing/');
    await page.locator('[data-dimension-picker]').selectOption('3');
    await page.locator('[data-index-field="extent.x"]').fill('9');
    results = await new AxeBuilder({ page })
      .withTags(axeTags)
      .analyze();
    expect(results.violations, `${theme}: VIS02 out-of-bounds state`).toEqual([]);

  }
});

test('@accessibility issue-14 non-default and error states have no tagged axe violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
  await page.goto('/');

  for (const scenario of issue14StateScans) {
    await page.evaluate(
      ([storageKey, value]) => localStorage.setItem(storageKey, value),
      [THEME_STORAGE_KEY, scenario.theme] as const,
    );
    await page.goto(scenario.route);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', scenario.theme);
    await scenario.prepare(page);
    const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect.soft(
      results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
      `${scenario.theme}: ${scenario.label}`,
    ).toEqual([]);
  }
});
