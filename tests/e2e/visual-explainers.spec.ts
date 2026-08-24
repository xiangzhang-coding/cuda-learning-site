// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';

test('VIS01 controls produce a deterministic trace and cancel stale playback', async ({ page }) => {
  await page.goto('/en/visuals/kernel-journey/');
  const visual = page.locator('cuda-kernel-journey');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-current-stage', 'launch');

  await visual.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(visual).toHaveAttribute('data-current-stage', 'grid-ready');
  await expect(visual.locator('[data-stage-id="grid-ready"]')).toHaveAttribute('aria-current', 'step');

  await visual.locator('[data-action="scrub"]').fill('5');
  await expect(visual).toHaveAttribute('data-current-stage', 'memory-transactions');
  await expect(visual.locator('[data-action="scrub"]')).toHaveAttribute('aria-valuetext', /Addresses become/);

  await visual.getByRole('button', { name: 'Reset', exact: true }).click();
  await visual.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(visual.getByRole('button', { name: 'Pause', exact: true })).toBeFocused();
  await expect(visual).toHaveAttribute('data-current-stage', 'grid-ready', { timeout: 2_500 });
  await visual.getByRole('button', { name: 'Pause', exact: true }).click();
  const pausedStage = await visual.getAttribute('data-current-stage');
  await page.waitForTimeout(1_350);
  await expect(visual).toHaveAttribute('data-current-stage', pausedStage ?? 'grid-ready');

  await visual.locator('[data-action="scrub"]').fill('6');
  await visual.getByRole('button', { name: 'Play', exact: true }).click();
  await expect(visual).toHaveAttribute('data-current-stage', 'synchronization-complete', { timeout: 2_500 });
  await expect(visual).toHaveAttribute('data-playing', 'false');
  await expect(visual.getByRole('button', { name: 'Reset', exact: true })).toBeFocused();

  await visual.getByRole('button', { name: 'Reset', exact: true }).click();
  await visual.getByRole('button', { name: 'Play', exact: true }).click();
  await visual.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.waitForTimeout(1_350);
  await expect(visual).toHaveAttribute('data-current-stage', 'launch');
  await expect(visual).toHaveAttribute('data-playing', 'false');
});

test('VIS02 updates 1D/2D/3D equations, bounds, invalid inputs, and reset state', async ({ page }) => {
  await page.goto('/en/visuals/indexing/');
  const visual = page.locator('cuda-indexing-explorer');
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual.locator('[data-global-coordinate]')).toHaveText('(x=9)');
  await expect(visual).toHaveAttribute('data-bounds-state', 'in-bounds');

  await visual.locator('[data-dimension-picker]').selectOption('3');
  await visual.locator('[data-index-field="blockDim.y"]').fill('2');
  await visual.locator('[data-index-field="blockDim.z"]').fill('2');
  await visual.locator('[data-index-field="extent.y"]').fill('3');
  await visual.locator('[data-index-field="extent.z"]').fill('3');
  await visual.locator('[data-index-field="threadIdx.y"]').fill('1');
  await visual.locator('[data-index-field="threadIdx.z"]').fill('1');

  await expect(visual.locator('[data-global-coordinate]')).toHaveText('(x=9, y=1, z=1)');
  await expect(visual.locator('[data-equation="local-thread"]')).toContainText('= 13');
  await expect(visual.locator('[data-equation="data-linear"]')).toContainText('= 49');
  await expect(visual).toHaveAttribute('data-bounds-state', 'in-bounds');

  await visual.locator('[data-index-field="extent.x"]').fill('9');
  await expect(visual).toHaveAttribute('data-bounds-state', 'out-of-bounds');
  await expect(visual.locator('[data-bounds-copy]')).toContainText('OUT OF BOUNDS');
  await expect(visual.locator('[data-axis-predicate="x"]')).toHaveText('9 < 9: false');

  const lastValidGlobal = await visual.locator('[data-global-coordinate]').textContent();
  await visual.locator('[data-index-field="blockDim.x"]').fill('0');
  await expect(visual.locator('[data-index-field="blockDim.x"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(visual.locator('[data-index-validation]')).toBeVisible();
  await expect(visual.locator('[data-global-coordinate]')).toHaveText(lastValidGlobal ?? '(x=9, y=1, z=1)');

  await visual.getByRole('button', { name: 'Reset indexing configuration' }).click();
  await expect(visual).toHaveAttribute('data-dimensions', '1');
  await expect(visual).toHaveAttribute('data-bounds-state', 'in-bounds');
  await expect(visual.locator('[data-global-coordinate]')).toHaveText('(x=9)');
  await expect(visual.locator('[data-index-validation]')).toBeHidden();

  await visual.locator('[data-thread-x="3"]').click();
  await expect(visual.locator('[data-global-coordinate]')).toHaveText('(x=11)');
  await expect(visual).toHaveAttribute('data-bounds-state', 'out-of-bounds');
  await expect(visual.locator('[data-thread-x="3"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Visual Explainer controls support keyboard operation and visible focus', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  await page.goto('/en/visuals/kernel-journey/');
  const visual = page.locator('cuda-kernel-journey');
  const step = visual.getByRole('button', { name: 'Step', exact: true });
  await step.focus();
  expect(await step.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);
  await step.press('Enter');
  await expect(visual).toHaveAttribute('data-current-stage', 'grid-ready');

  const scrub = visual.locator('[data-action="scrub"]');
  await scrub.focus();
  await scrub.press('ArrowRight');
  await expect(visual).toHaveAttribute('data-current-stage', 'block-scheduled');

  await page.goto('/en/visuals/indexing/');
  const indexing = page.locator('cuda-indexing-explorer');
  const thread = indexing.locator('[data-thread-x="3"]');
  await thread.focus();
  await thread.press('Space');
  await expect(thread).toHaveAttribute('aria-pressed', 'true');
  await expect(indexing.locator('[data-thread-x="3"]')).toBeFocused();
  await expect(indexing.locator('[data-global-coordinate]')).toHaveText('(x=11)');
});

test('theme changes preserve visual state while reloads do not persist it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium state-isolation probe is sufficient.');
  await page.goto('/en/visuals/indexing/');
  const visual = page.locator('cuda-indexing-explorer');
  await visual.locator('[data-thread-x="3"]').click();

  for (const theme of THEME_IDS) {
    await page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' }).selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
    await expect(visual.locator('[data-global-coordinate]')).toHaveText('(x=11)');
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([THEME_STORAGE_KEY]);
  }

  await page.reload();
  await expect(page.locator('cuda-indexing-explorer [data-global-coordinate]')).toHaveText('(x=9)');
});

test('reduced motion, contrast, forced colors, and print retain instructional information', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'more', forcedColors: 'active' });
  await page.goto('/en/visuals/kernel-journey/');
  const journey = page.locator('cuda-kernel-journey');
  await journey.getByRole('button', { name: 'Step', exact: true }).click();
  await expect(journey).toHaveAttribute('data-current-stage', 'grid-ready');
  expect(
    await journey
      .locator('[data-journey-node="grid-ready"]')
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(prefers-contrast: more)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);

  await page.emulateMedia({ media: 'print' });
  await expect(journey.locator('[data-visual-controls]')).toBeHidden();
  await expect(journey.locator('[data-static-fallback]')).toBeVisible();
  await expect(journey.locator('[data-stage-id]')).toHaveCount(8);

  await page.goto('/en/visuals/indexing/');
  const indexing = page.locator('cuda-indexing-explorer');
  await expect(indexing.locator('[data-visual-controls]')).toBeHidden();
  await expect(indexing.locator('[data-static-fallback]')).toBeVisible();
  await expect(indexing.locator('[data-static-example]')).toHaveCount(3);
  await expect(indexing.locator('.index-workbench')).toBeHidden();
});

test('no-script and narrow layouts retain complete static Visual Explainers', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One static Chromium context covers script-independent HTML.');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of [
      '/visuals/kernel-journey/',
      '/en/visuals/kernel-journey/',
      '/visuals/indexing/',
      '/en/visuals/indexing/',
    ]) {
      await page.goto(`http://127.0.0.1:4321${route}`);
      await expect(page.locator('[data-visual-controls]')).toBeHidden();
      await expect(page.locator('[data-interactive-workbench]')).toBeHidden();
      await expect(page.locator('[data-static-fallback]')).toBeVisible();
      await expect(page.locator('[data-no-evidence]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} at ${width}px`).toBe(
        true,
      );
    }
  }

  await context.close();
});

test('Visual Explainers reflow without root overflow', async ({ page }) => {
  for (const width of [640, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/en/visuals/kernel-journey/', '/en/visuals/indexing/']) {
      await page.goto(route);
      await expect(page.locator('[data-visual-controls]')).toBeVisible();
      await expect(page.locator('[data-static-fallback]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${route} at ${width}px`).toBe(
        true,
      );
    }
  }
});
