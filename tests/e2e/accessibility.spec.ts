// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const representativeThemeRoutes = [
  '/',
  '/en/',
  '/en/practice/',
  '/en/glossary/',
  '/en/sources-and-versions/',
  '/en/labs/break-and-repair-indexing/',
  '/en/foundations/asynchronous-errors/',
  '/en/foundations/compute-capability/',
  '/en/foundations/runtime-driver-api/',
  '/en/foundations/launch-geometry/',
  '/en/memory/synchronization-scopes/',
  '/en/memory/warp-divergence-reconvergence/',
  '/en/memory/stream-ordering/',
  '/en/memory/event-dependencies-timing/',
  '/en/memory/pinned-memory-transfer-overlap/',
  '/en/memory/unified-memory-page-migration/',
  '/en/memory/stream-ordered-allocation-memory-pools/',
  '/en/memory/cooperative-groups/',
  '/en/memory/asynchronous-copy-pipelines/',
  '/en/memory/cuda-graphs/',
  '/en/correctness/timing-asynchronous-gpu-work/',
  '/en/examples/streams-events-overlap/',
  '/en/examples/unified-memory-migration/',
  '/en/examples/graph-capture/',
  '/en/visuals/warp-divergence/',
  '/en/visuals/stream-event-dependencies/',
  '/en/visuals/page-migration/',
  '/en/visuals/artifact-pipeline/',
] as const;

const releaseVisualStateScans = [
  {
    theme: 'silicon-light',
    label: 'VIS04 offset segment state',
    route: '/en/visuals/memory-transactions/',
    prepare: async (page: Page) => page.locator('[data-memory-field="offset"]').fill('4'),
  },
  {
    theme: 'profiler-dark',
    label: 'VIS05 bank-conflict state',
    route: '/en/visuals/shared-memory-banks/',
    prepare: async (page: Page) => page.locator('[data-bank-field="stride"]').fill('32'),
  },
  {
    theme: 'blueprint',
    label: 'VIS06 empty filtered state',
    route: '/en/visuals/memory-hierarchy-lifetime/',
    prepare: async (page: Page) => {
      await page.locator('[data-scope-filter]').selectOption('thread');
      await page.locator('[data-operation-filter]').selectOption('runtime-api');
    },
  },
  {
    theme: 'profiler-dark',
    label: 'VIS03 alternating divergence state',
    route: '/en/visuals/warp-divergence/',
    prepare: async (page: Page) => {
      await page.locator('[data-warp-preset]').selectOption('alternating');
      await page.locator('[data-warp-step]').click();
    },
  },
  {
    theme: 'silicon-light',
    label: 'VIS07 three-stream dependency state',
    route: '/en/visuals/stream-event-dependencies/',
    prepare: async (page: Page) => page.locator('select[data-stream-count]').selectOption('3'),
  },
  {
    theme: 'blueprint',
    label: 'VIS09 exact-target pipeline state',
    route: '/en/visuals/artifact-pipeline/',
    prepare: async (page: Page) => {
      const pipeline = page.locator('cuda-artifact-pipeline[data-visual-id="VIS09"]');
      await pipeline.locator('[data-artifact-lane]').selectOption('12.9.2');
      await pipeline.locator('[data-artifact-target-plan]').selectOption('exact-90a');
      await pipeline.locator('[data-artifact-action="step"]').click();
    },
  },
] as const;

async function setTheme(page: Page, theme: (typeof THEME_IDS)[number]) {
  await page.goto('/');
  await page.evaluate(
    ([storageKey, value]) => localStorage.setItem(storageKey, value),
    [THEME_STORAGE_KEY, theme] as const,
  );
}

async function expectNoAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(
    results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })),
    label,
  ).toEqual([]);
}

test('@accessibility axe detects no tagged violations across every published route; this is not a conformance claim', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
  test.setTimeout(420_000);

  const theme = 'silicon-light';
  await setTheme(page, theme);
  for (const route of await discoverPublishedRoutes()) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
    await expectNoAxeViolations(page, `${theme}: ${route}`);
  }
});

test('@accessibility representative pages and visual states have no tagged violations across themes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
  test.setTimeout(420_000);

  for (const theme of THEME_IDS) {
    await setTheme(page, theme);
    for (const route of representativeThemeRoutes) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
      await expectNoAxeViolations(page, `${theme}: ${route}`);
    }

    await page.goto('/en/visuals/kernel-journey/');
    await page.locator('[data-action="scrub"]').fill('5');
    await expectNoAxeViolations(page, `${theme}: VIS01 memory state`);

    await page.goto('/en/visuals/indexing/');
    await page.locator('[data-dimension-picker]').selectOption('3');
    await page.locator('[data-index-field="extent.x"]').fill('9');
    await expectNoAxeViolations(page, `${theme}: VIS02 out-of-bounds state`);

    await page.goto('/en/visuals/page-migration/');
    const migration = page.locator('cuda-page-migration[data-visual-id="VIS08"]');
    await expect(migration).toHaveAttribute('data-ready', 'true');
    await migration.locator('[data-page-migration-scenario]').selectOption('alternating-hot-page');
    await migration.locator('[data-page-migration-action="step"]').click();
    await expect(migration).toHaveAttribute('data-step-index', '1');
    await expectNoAxeViolations(page, `${theme}: VIS08 alternating migration state`);
  }
});

test('@accessibility release visual non-default and empty states have no tagged axe violations', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
  await page.goto('/');

  for (const scenario of releaseVisualStateScans) {
    await page.evaluate(
      ([storageKey, value]) => localStorage.setItem(storageKey, value),
      [THEME_STORAGE_KEY, scenario.theme] as const,
    );
    await page.goto(scenario.route);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', scenario.theme);
    await scenario.prepare(page);
    await expectNoAxeViolations(page, `${scenario.theme}: ${scenario.label}`);
  }
});
