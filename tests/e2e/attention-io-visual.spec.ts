// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

test('VIS18 native controls update IO state and Reset restores focus and defaults', async ({ page }) => {
  await page.goto('/en/visuals/attention-memory-traffic/');
  const visual = page.locator('cuda-attention-io-explorer[data-visual-id="VIS18"]');
  const sequence = visual.locator('[data-attention-sequence-shape]');
  const tile = visual.locator('[data-attention-tile-shape]');
  const stage = visual.locator('[data-attention-stage-select]');
  const reset = visual.locator('[data-attention-action="reset"]');
  const status = visual.locator('[data-attention-status]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  expect(await sequence.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['8x4', '16x8']);
  expect(await tile.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['4x4', '8x8']);
  expect(await stage.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['score', 'normalize', 'value']);

  const storageBefore = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));
  await sequence.focus();
  await page.keyboard.press('Tab');
  await expect(tile).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(stage).toBeFocused();

  await sequence.selectOption('16x8');
  await tile.selectOption('8x8');
  await stage.selectOption('normalize');
  await expect(visual).toHaveAttribute('data-sequence-shape', '16x8');
  await expect(visual).toHaveAttribute('data-tile-shape', '8x8');
  await expect(visual).toHaveAttribute('data-attention-stage', 'normalize');
  await expect(visual).toHaveAttribute('data-query-tile-count', '2');
  await expect(visual).toHaveAttribute('data-key-tile-count', '2');
  await expect(visual).toHaveAttribute('data-score-tile-count', '4');
  await expect(visual).toHaveAttribute('data-materialized-bytes', '8192');
  await expect(visual).toHaveAttribute('data-tiled-bytes', '3072');
  await expect(visual).toHaveAttribute('data-analysis-difference-bytes', '5120');
  await expect(visual.locator('[data-live-materialized-stage-bytes]')).toHaveText('4096 B');
  await expect(visual.locator('[data-live-tiled-stage-bytes]')).toHaveText('0 B');
  await expect(visual.locator('[data-live-stage="normalize"]')).toHaveAttribute('aria-current', 'step');
  await expect(status).toContainText('Normalize');

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(sequence).toBeFocused();
  await expect(sequence).toHaveValue('8x4');
  await expect(tile).toHaveValue('4x4');
  await expect(stage).toHaveValue('score');
  await expect(visual).toHaveAttribute('data-materialized-bytes', '2048');
  await expect(visual).toHaveAttribute('data-tiled-bytes', '768');
  expect(await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }))).toEqual(storageBefore);

  await sequence.selectOption('16x8');
  await stage.selectOption('value');
  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(sequence).toHaveValue('8x4');
  await expect(stage).toHaveValue('score');
});

test('VIS18 preserves the bilingual static diagram and complete ledgers at 390px without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const route of ['/visuals/attention-memory-traffic/', '/en/visuals/attention-memory-traffic/']) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('cuda-attention-io-explorer[data-visual-id="VIS18"]');
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-live-workbench]')).toBeHidden();
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    await expect(visual.locator('svg[data-static-diagram]')).toBeVisible();
    await expect(visual.locator('[data-diagram-stage]')).toHaveCount(3);
    await expect(visual.locator('[data-static-ledger]')).toHaveCount(4);
    const diagramScroll = visual.locator('.attention-diagram-scroll');
    expect(await diagramScroll.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
    expect(await visual.locator('[data-static-ledger]').evaluateAll((rows) => rows.map((row) => ({
      sequence: row.getAttribute('data-sequence-shape'),
      tile: row.getAttribute('data-tile-shape'),
      materialized: row.getAttribute('data-materialized-bytes'),
      tiled: row.getAttribute('data-tiled-bytes'),
    })))).toEqual([
      { sequence: '8x4', tile: '4x4', materialized: '2048', tiled: '768' },
      { sequence: '8x4', tile: '8x8', materialized: '2048', tiled: '512' },
      { sequence: '16x8', tile: '4x4', materialized: '8192', tiled: '5120' },
      { sequence: '16x8', tile: '8x8', materialized: '8192', tiled: '3072' },
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS18 preserves reduced motion, forced colors, print, and evidence boundaries', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/attention-memory-traffic/');
  const visual = page.locator('cuda-attention-io-explorer[data-visual-id="VIS18"]');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await visual.locator('[data-attention-stage-select]').selectOption('value');
  const selected = visual.locator('[data-live-stage="value"]');
  await expect(selected).toHaveAttribute('aria-current', 'step');
  expect(await selected.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)))
    .toBeLessThanOrEqual(0.00001);
  expect(await selected.evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe('solid');
  const stageColumns = await visual.locator('[data-diagram-stage]').evaluateAll((stages) =>
    stages.map((stage) => Math.round(stage.getBoundingClientRect().x)));
  expect(new Set(stageColumns).size).toBe(3);
  expect(stageColumns).toEqual([...stageColumns].sort((left, right) => left - right));
  await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
  for (const name of [
    'cuda:evidence-compilation',
    'cuda:evidence-runtime',
    'cuda:expected-observations',
    'cuda:recorded-observations',
  ]) await expect(page.locator(`meta[name="${name}"]`)).toHaveAttribute('content', 'none');
  await expect(visual.locator('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-backend]')).toHaveCount(0);

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-ledger]')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
