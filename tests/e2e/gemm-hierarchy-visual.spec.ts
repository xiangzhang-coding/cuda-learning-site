// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

const levels = ['matrix', 'tile', 'threadblock', 'warp', 'instruction'];

test('VIS12 native controls update hierarchy state and Reset restores focus and defaults', async ({ page }) => {
  await page.goto('/en/visuals/gemm-tiling-hierarchy/');
  const visual = page.locator('[data-visual-id="VIS12"]');
  const matrix = visual.locator('[data-gemm-matrix-shape]');
  const tile = visual.locator('[data-gemm-tile-shape]');
  const level = visual.locator('[data-gemm-hierarchy-level]');
  const reset = visual.locator('[data-gemm-action="reset"]');
  const status = visual.locator('[data-gemm-status]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  expect(await matrix.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['128x128x32', '256x128x64']);
  expect(await tile.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['64x64x16', '128x64x16']);
  expect(await level.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(levels);

  const storageBefore = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));
  await matrix.focus();
  await page.keyboard.press('Tab');
  await expect(tile).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(level).toBeFocused();

  await matrix.selectOption('256x128x64');
  await tile.selectOption('128x64x16');
  await level.selectOption('instruction');
  await expect(visual).toHaveAttribute('data-matrix-shape', '256x128x64');
  await expect(visual).toHaveAttribute('data-tile-shape', '128x64x16');
  await expect(visual).toHaveAttribute('data-hierarchy-level', 'instruction');
  await expect(visual).toHaveAttribute('data-output-tile-count', '4');
  await expect(visual).toHaveAttribute('data-k-slice-count', '4');
  await expect(visual).toHaveAttribute('data-threadblock-count', '4');
  await expect(visual).toHaveAttribute('data-warps-per-threadblock', '8');
  await expect(visual.locator('[data-live-operation-slots]')).toHaveText('16384');
  await expect(visual.locator('[data-live-level="instruction"]')).toHaveAttribute('aria-current', 'true');
  const instruction = visual.locator('[data-live-hierarchy-panel][data-hierarchy-level="instruction"]');
  await expect(instruction).toBeVisible();
  await expect(instruction).toContainText('Compiler-emitted FMA, MMA, SASS, and execution are all unknown');
  await expect(status).toContainText('Instruction');

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(matrix).toBeFocused();
  await expect(matrix).toHaveValue('128x128x32');
  await expect(tile).toHaveValue('64x64x16');
  await expect(level).toHaveValue('matrix');
  await expect(visual).toHaveAttribute('data-hierarchy-level', 'matrix');
  expect(await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }))).toEqual(storageBefore);

  await matrix.selectOption('256x128x64');
  await level.selectOption('warp');
  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(matrix).toHaveValue('128x128x32');
  await expect(level).toHaveValue('matrix');
});

test('VIS12 preserves all bilingual 390px hierarchy panels without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const route of ['/visuals/gemm-tiling-hierarchy/', '/en/visuals/gemm-tiling-hierarchy/']) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('[data-visual-id="VIS12"]');
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-live-workbench]')).toBeHidden();
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    await expect(visual.locator('[data-static-selection]')).toHaveCount(4);
    await expect(visual.locator('[data-static-hierarchy-panel]')).toHaveCount(20);
    expect(await visual.locator('[data-static-hierarchy-panel]').evaluateAll((panels) =>
      panels.map((panel) => panel.getAttribute('data-hierarchy-level')))).toEqual(
      Array.from({ length: 4 }, () => levels).flat(),
    );
    for (const panel of await visual.locator('[data-static-hierarchy-panel]').allTextContents()) {
      expect(panel.trim().length).toBeGreaterThan(80);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS12 preserves reduced motion, forced colors, print, and evidence boundaries', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/gemm-tiling-hierarchy/');
  const visual = page.locator('[data-visual-id="VIS12"]');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await visual.locator('[data-gemm-hierarchy-level]').selectOption('instruction');
  const selected = visual.locator('[data-live-level="instruction"]');
  await expect(selected).toHaveAttribute('aria-current', 'true');
  expect(await selected.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)))
    .toBeLessThanOrEqual(0.00001);
  expect(await selected.evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe('solid');
  await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
  for (const name of [
    'cuda:evidence-compilation',
    'cuda:evidence-runtime',
    'cuda:expected-observations',
    'cuda:recorded-observations',
  ]) await expect(page.locator(`meta[name="${name}"]`)).toHaveAttribute('content', 'none');
  await expect(visual.locator('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-emitted-instruction]')).toHaveCount(0);

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-selection]')).toHaveCount(4);
  await expect(visual.locator('[data-static-hierarchy-panel]')).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
