// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

const staticSelectionIds = ['4:0', '4:1', '8:0', '8:1'];

test('VIS11 native selects update mappings; Reset restores defaults, focus, and non-persistence', async ({ page }) => {
  await page.goto('/en/visuals/tiled-transpose/');
  const visual = page.locator('[data-visual-id="VIS11"]');
  const tileSize = visual.locator('[data-transpose-tile-size]');
  const layout = visual.locator('[data-transpose-layout]');
  const padding = visual.locator('[data-transpose-padding]');
  const reset = visual.locator('[data-transpose-action="reset"]');
  const status = visual.locator('[data-transpose-status]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  expect(await tileSize.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['4', '8']);
  expect(await layout.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['input-row-major', 'output-row-major']);
  expect(await padding.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['0', '1']);
  await expect(visual.locator('[data-transpose-action="play"], input[type="range"]')).toHaveCount(0);
  await expect(visual.locator('[data-static-selection]')).toHaveCount(4);

  const storageBefore = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));
  await expect(visual).toHaveAttribute('data-tile-size', '4');
  await expect(visual).toHaveAttribute('data-layout', 'input-row-major');
  await expect(visual).toHaveAttribute('data-padding', '0');
  await expect(visual).toHaveAttribute('data-shared-row-stride', '4');
  await page.waitForTimeout(150);
  await expect(visual).toHaveAttribute('data-tile-size', '4');
  await expect(visual).toHaveAttribute('data-layout', 'input-row-major');
  await expect(visual).toHaveAttribute('data-padding', '0');

  await tileSize.focus();
  await page.keyboard.press('Tab');
  await expect(layout).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(tileSize).toBeFocused();
  await tileSize.selectOption('8');
  await expect(tileSize).toHaveValue('8');
  await expect(visual).toHaveAttribute('data-tile-size', '8');
  await expect(visual).toHaveAttribute('data-logical-cell-count', '64');
  await expect(visual.locator('[data-live-input-grid] [data-live-logical-cell]')).toHaveCount(64);
  await expect(visual.locator('[data-live-output-grid] [data-live-logical-cell]')).toHaveCount(64);

  await layout.selectOption('output-row-major');
  await expect(layout).toHaveValue('output-row-major');
  await expect(visual).toHaveAttribute('data-layout', 'output-row-major');
  await expect(status).toContainText('Output row-major');

  await padding.selectOption('1');
  await expect(padding).toHaveValue('1');
  await expect(visual).toHaveAttribute('data-padding', '1');
  await expect(visual).toHaveAttribute('data-shared-row-stride', '9');
  await expect(visual.locator('[data-live-physical-rows] > .transpose-physical-row')).toHaveCount(8);
  await expect(visual.locator('[data-live-physical-slot]')).toHaveCount(72);
  await expect(visual.locator('[data-live-physical-slot][data-slot-kind="padding"]')).toHaveCount(8);

  const mappedInput = visual.locator('[data-live-logical-cell][data-perspective="input"][data-input-index="51"]');
  await expect(mappedInput).toHaveAttribute('data-input-row', '6');
  await expect(mappedInput).toHaveAttribute('data-input-col', '3');
  await expect(mappedInput).toHaveAttribute('data-output-row', '3');
  await expect(mappedInput).toHaveAttribute('data-output-col', '6');
  await expect(mappedInput).toHaveAttribute('data-output-index', '30');
  await expect(mappedInput).toContainText('input (6,3)');
  await expect(mappedInput).toContainText('output (3,6)');
  const mappedPhysical = visual.locator('[data-live-physical-slot][data-input-row="6"][data-input-col="3"]');
  await expect(mappedPhysical).toHaveAttribute('data-physical-row', '3');
  await expect(mappedPhysical).toHaveAttribute('data-physical-col', '6');
  await expect(mappedPhysical).toHaveAttribute('data-physical-slot-index', '33');
  for (const text of await visual.locator('[data-live-physical-slot][data-slot-kind="padding"]').allTextContents()) {
    expect(text).toMatch(/padding slot, no logical value/i);
  }

  await layout.selectOption('input-row-major');
  await expect(visual).toHaveAttribute('data-layout', 'input-row-major');
  await expect(visual.locator('[data-live-physical-slot][data-input-row="6"][data-input-col="3"]')).toHaveAttribute(
    'data-physical-slot-index',
    '57',
  );

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(tileSize).toBeFocused();
  await expect(tileSize).toHaveValue('4');
  await expect(layout).toHaveValue('input-row-major');
  await expect(padding).toHaveValue('0');
  await expect(visual).toHaveAttribute('data-tile-size', '4');
  await expect(visual).toHaveAttribute('data-layout', 'input-row-major');
  await expect(visual).toHaveAttribute('data-padding', '0');
  await expect(visual).toHaveAttribute('data-shared-row-stride', '4');
  await expect(status).toContainText('focus returned to Square tile size');

  expect(await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }))).toEqual(storageBefore);

  await tileSize.selectOption('8');
  await layout.selectOption('output-row-major');
  await padding.selectOption('1');
  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(tileSize).toHaveValue('4');
  await expect(layout).toHaveValue('input-row-major');
  await expect(padding).toHaveValue('0');
});

test('VIS11 preserves the complete bilingual 390px fallback without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const { route, locale } of [
    { route: '/visuals/tiled-transpose/', locale: 'zh-CN' },
    { route: '/en/visuals/tiled-transpose/', locale: 'en' },
  ]) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('[data-visual-id="VIS11"]');
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-live-workbench]')).toBeHidden();
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    await expect(visual.locator('[data-static-selection]')).toHaveCount(4);
    await expect(visual.locator('[data-static-input-cell]')).toHaveCount(160);
    await expect(visual.locator('[data-static-output-cell]')).toHaveCount(160);
    await expect(visual.locator('[data-static-physical-layout]')).toHaveCount(8);
    await expect(visual.locator('[data-static-physical-row]')).toHaveCount(48);
    await expect(visual.locator('[data-static-physical-slot]')).toHaveCount(344);
    await expect(visual.locator('[data-static-physical-slot][data-slot-kind="padding"]')).toHaveCount(24);
    expect(await visual.locator('[data-static-selection]').evaluateAll((selections) => selections.map((selection) =>
      selection.getAttribute('data-static-selection')))).toEqual(staticSelectionIds);

    const paddingSlots = await visual.locator('[data-static-physical-slot][data-slot-kind="padding"]').allTextContents();
    for (const text of paddingSlots) {
      expect(text).toMatch(/padding/i);
      expect(text).toMatch(locale === 'en' ? /no logical value/i : /无逻辑值/);
    }
    await expect(visual.locator('[data-conceptual-only]')).toBeVisible();
    await expect(visual.locator('[data-no-evidence]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS11 preserves mobile, reduced-motion, forced-color, print, and evidence boundaries', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ['/visuals/tiled-transpose/', '/en/visuals/tiled-transpose/']) {
    await page.goto(route);
    const visual = page.locator('[data-visual-id="VIS11"]');
    await expect(visual).toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/tiled-transpose/');
  const visual = page.locator('[data-visual-id="VIS11"]');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  expect(await visual.locator('[data-live-logical-cell]').first().evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThanOrEqual(0.00001);

  await visual.locator('[data-transpose-padding]').selectOption('1');
  const paddingSlot = visual.locator('[data-live-physical-slot][data-slot-kind="padding"]').first();
  await expect(paddingSlot).toBeVisible();
  expect(await paddingSlot.evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe('dashed');
  await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
  await expect(visual.locator('[data-no-evidence]')).toContainText('no execution or speed evidence');
  await expect(visual.locator('[data-no-evidence]')).toContainText('Runtime-Verified');
  await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:expected-observations"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
  await expect(visual.locator('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-observed-bank-conflict]')).toHaveCount(0);

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-selection]')).toHaveCount(4);
  await expect(visual.locator('[data-static-input-cell]')).toHaveCount(160);
  await expect(visual.locator('[data-static-output-cell]')).toHaveCount(160);
  await expect(visual.locator('[data-static-physical-slot]')).toHaveCount(344);
  await expect(visual.locator('[data-static-physical-slot][data-slot-kind="padding"]')).toHaveCount(24);
  await expect(visual.locator('[data-no-evidence]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
