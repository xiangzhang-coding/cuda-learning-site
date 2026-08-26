// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY, starlightThemeFor } from '../../src/theme-contract';

function pngDimensions(buffer: Buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

test('@visual selected home layouts produce reviewable screenshots', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Selected visual evidence is owned by pinned Chromium.');

  for (const locale of [
    { name: 'zh', route: '/' },
    { name: 'en', route: '/en/' },
  ]) {
    for (const theme of THEME_IDS) {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(locale.route);
      await page.evaluate(
        ([storageKey, value]) => localStorage.setItem(storageKey, value),
        [THEME_STORAGE_KEY, theme] as const,
      );
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('data-theme', starlightThemeFor(theme));
      await expect(page.locator('.signal-hero')).toBeVisible();
      const desktop = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${locale.name}-${theme}-home-desktop.png`),
      });
      expect(pngDimensions(desktop).width).toBe(1280);
      expect(desktop.byteLength).toBeGreaterThan(50_000);

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(locale.route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const mobile = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${locale.name}-${theme}-home-mobile.png`),
      });
      expect(pngDimensions(mobile).width).toBe(390);
      expect(mobile.byteLength).toBeGreaterThan(25_000);
    }
  }
});

test('@visual selected Visual Explainer states produce reviewable screenshots', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Selected visual evidence is owned by pinned Chromium.');
  test.setTimeout(90_000);

  for (const visual of [
    {
      id: 'vis01',
      routes: { zh: '/visuals/kernel-journey/', en: '/en/visuals/kernel-journey/' },
      prepare: async () => {
        await page.locator('[data-action="scrub"]').fill('5');
        await expect(page.locator('cuda-kernel-journey')).toHaveAttribute('data-current-stage', 'memory-transactions');
      },
    },
    {
      id: 'vis02',
      routes: { zh: '/visuals/indexing/', en: '/en/visuals/indexing/' },
      prepare: async () => {
        await page.locator('[data-dimension-picker]').selectOption('3');
        await page.locator('[data-index-field="extent.x"]').fill('9');
        await expect(page.locator('cuda-indexing-explorer')).toHaveAttribute('data-bounds-state', 'out-of-bounds');
      },
    },
  ]) {
    for (const locale of ['zh', 'en'] as const) {
      for (const theme of THEME_IDS) {
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(visual.routes[locale]);
        await page.evaluate(
          ([storageKey, value]) => localStorage.setItem(storageKey, value),
          [THEME_STORAGE_KEY, theme] as const,
        );
        await page.reload();
        await visual.prepare();
        const desktop = await page.screenshot({
          fullPage: true,
          path: testInfo.outputPath(`${locale}-${theme}-${visual.id}-desktop.png`),
        });
        expect(pngDimensions(desktop).width).toBe(1280);
        expect(desktop.byteLength).toBeGreaterThan(60_000);
      }

      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(visual.routes[locale]);
      await page.evaluate(
        ([storageKey, value]) => localStorage.setItem(storageKey, value),
        [THEME_STORAGE_KEY, 'silicon-light'] as const,
      );
      await page.reload();
      await visual.prepare();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const mobile = await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`${locale}-silicon-light-${visual.id}-mobile.png`),
      });
      expect(pngDimensions(mobile).width).toBe(390);
      expect(mobile.byteLength).toBeGreaterThan(40_000);
    }
  }
});

test('@visual VIS19-VIS22 expose visible selected and fail-closed states in every theme', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Semantic visual coverage is owned by pinned Chromium.');
  await page.setViewportSize({ width: 1280, height: 800 });

  for (const theme of THEME_IDS) {
    await page.goto('/en/foundations/asynchronous-errors/');
    await page.evaluate(
      ([storageKey, value]) => localStorage.setItem(storageKey, value),
      [THEME_STORAGE_KEY, theme] as const,
    );
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
    const timeline = page.locator('cuda-error-timeline[data-visual-id="VIS19"]');
    await timeline.locator('[data-action="select-scenario"]').selectOption('deferred-execution');
    await timeline.locator('[data-action="scrub"]').fill('3');
    const activeEvent = timeline.locator('[data-scenario="deferred-execution"] [aria-current="step"]');
    await expect(activeEvent).toBeVisible();
    expect(await activeEvent.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);

    await page.goto('/en/foundations/compute-capability/');
    const filter = page.locator('cuda-capability-filter[data-visual-id="VIS20"]');
    await filter.locator('[data-capability-input]').fill('8.6');
    await expect(filter.locator('[data-capability-status]')).toBeVisible();
    await expect(filter.locator('[data-capability-details]')).toBeHidden();
    expect(
      await filter.locator('[data-capability-input]').evaluate((element) => Number.parseFloat(getComputedStyle(element).borderWidth)),
    ).toBeGreaterThan(0);

    await page.goto('/en/foundations/runtime-driver-api/');
    const boundary = page.locator('cuda-api-boundary[data-visual-id="VIS21"]');
    const selectedTab = boundary.locator('[data-stage-tab="completion-errors"]');
    await selectedTab.click();
    await expect(selectedTab).toHaveAttribute('aria-selected', 'true');
    await expect(boundary.locator('[data-api-boundary-panel]')).toBeVisible();
    expect(await selectedTab.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderWidth))).toBeGreaterThanOrEqual(2);

    await page.goto('/en/foundations/launch-geometry/');
    const explorer = page.locator('cuda-block-shape-explorer[data-visual-id="VIS22"]');
    await explorer.locator('[data-block-shape-field="blockX"]').fill('1024');
    await explorer.locator('[data-block-shape-field="blockY"]').fill('2');
    await expect(explorer.locator('[data-issue-panel]')).toBeVisible();
    await expect(explorer.locator('[data-geometry]')).toBeHidden();
    await expect(explorer.locator('[data-verdict]')).toBeVisible();
    expect(
      await explorer.locator('[data-live-result]').evaluate((element) => Number.parseFloat(getComputedStyle(element).borderWidth)),
    ).toBeGreaterThanOrEqual(2);
  }
});
