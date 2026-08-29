// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

test('VIS09 native controls support bounded plans, keyboard stepping, reset focus, and reload isolation', async ({ page }) => {
  await page.goto('/en/visuals/artifact-pipeline/');
  const visual = page.locator('cuda-artifact-pipeline[data-visual-id="VIS09"]');
  const lane = visual.locator('[data-artifact-lane]');
  const targetPlan = visual.locator('[data-artifact-target-plan]');
  const step = visual.locator('[data-artifact-action="step"]');
  const reset = visual.locator('[data-artifact-action="reset"]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-toolkit-lane', '11.8.0');
  await expect(visual).toHaveAttribute('data-target-plan', 'baseline-75');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual).toHaveAttribute('data-runtime-image-selection', 'unknown');
  await expect(lane.locator('option')).toHaveCount(3);
  await expect(targetPlan.locator('option')).toHaveCount(1);
  await expect(visual.locator('[data-static-selection]')).toHaveCount(7);
  await expect(visual.locator('[data-static-stage]')).toHaveCount(49);
  await expect(visual.locator('[data-artifact-action="play"], input[type="range"]')).toHaveCount(0);

  const storageBefore = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));

  await lane.selectOption('12.9.2');
  await expect(visual).toHaveAttribute('data-toolkit-lane', '12.9.2');
  await expect(visual).toHaveAttribute('data-target-plan', 'baseline-75');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(targetPlan.locator('option')).toHaveCount(3);
  expect(await targetPlan.locator('option').evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value))).toEqual([
    'baseline-75',
    'exact-90a',
    'family-100f',
  ]);

  await targetPlan.selectOption('exact-90a');
  await expect(visual).toHaveAttribute('data-target-plan', 'exact-90a');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual.locator('[data-manifest-virtual]')).toHaveText('compute_90a');
  await expect(visual.locator('[data-manifest-real]')).toHaveText('sm_90a');

  await step.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-step-index', '1');
  await expect(visual.locator('[data-live-stage="source-split"]')).toHaveAttribute('data-stage-state', 'complete');

  await targetPlan.selectOption('family-100f');
  await expect(visual).toHaveAttribute('data-target-plan', 'family-100f');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual.locator('[data-manifest-virtual]')).toHaveText('compute_100f');
  await expect(visual.locator('[data-manifest-real]')).toHaveText('sm_100f');

  await step.focus();
  for (let index = 1; index <= 7; index += 1) {
    await page.keyboard.press(index % 2 === 0 ? 'Space' : 'Enter');
    await expect(visual).toHaveAttribute('data-step-index', String(index));
  }
  await expect(visual).toHaveAttribute('data-sequence-complete', 'true');
  await expect(visual).toHaveAttribute('data-current-stage', 'complete');
  await expect(step).toBeDisabled();
  await expect(reset).toBeFocused();
  await expect(visual.locator('[data-live-stage][data-stage-state="complete"]')).toHaveCount(7);
  await expect(visual.locator('[data-artifact-status]')).toContainText('runtime image selection remains unknown');

  await reset.press('Enter');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual).toHaveAttribute('data-sequence-complete', 'false');
  await expect(lane).toBeFocused();

  await lane.selectOption('11.8.0');
  await expect(visual).toHaveAttribute('data-target-plan', 'baseline-75');
  await expect(targetPlan.locator('option')).toHaveCount(1);
  await expect(targetPlan).toHaveValue('baseline-75');

  expect(await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }))).toEqual(storageBefore);

  await lane.selectOption('13.3.1');
  await targetPlan.selectOption('exact-90a');
  await step.press('Enter');
  await expect(visual).toHaveAttribute('data-step-index', '1');
  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-toolkit-lane', '11.8.0');
  await expect(visual).toHaveAttribute('data-target-plan', 'baseline-75');
  await expect(visual).toHaveAttribute('data-step-index', '0');
});

test('VIS09 keeps complete bilingual static fallbacks without JavaScript at 390px', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const route of ['/visuals/artifact-pipeline/', '/en/visuals/artifact-pipeline/']) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('cuda-artifact-pipeline[data-visual-id="VIS09"]');
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-live-workbench]')).toBeHidden();
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    await expect(visual.locator('[data-static-selection]')).toHaveCount(7);
    await expect(visual.locator('[data-static-stage]')).toHaveCount(49);
    await expect(visual.locator('[data-static-runtime-selection="unknown"]')).toHaveCount(7);
    await expect(visual.locator('[data-conceptual-only]')).toBeVisible();
    await expect(visual.locator('[data-no-evidence]')).toBeVisible();
    await expect(visual.locator('[id]')).toHaveCount(0);
    await expect(visual.locator('svg, img')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS09 reflows on mobile and preserves reduced-motion, forced-color, print, and evidence boundaries', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ['/visuals/artifact-pipeline/', '/en/visuals/artifact-pipeline/']) {
    await page.goto(route);
    await expect(page.locator('cuda-artifact-pipeline [data-static-fallback]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/artifact-pipeline/');
  const visual = page.locator('cuda-artifact-pipeline[data-visual-id="VIS09"]');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  expect(
    await visual.locator('[data-live-stage]').first().evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);

  await expect(visual).toHaveAttribute('data-runtime-image-selection', 'unknown');
  await expect(visual.locator('[data-runtime-selection="unknown"]')).toContainText('Without a selected GPU');
  await expect(visual.locator('[data-no-evidence]')).toContainText('executes no compiler or CUDA');
  await expect(visual.locator('[data-no-evidence]')).toContainText('grant no Compile-Checked');
  await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
  await expect(visual.locator('[data-measured], [data-observed-artifact], [data-runtime-selected-image]')).toHaveCount(0);

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-selection]')).toHaveCount(7);
  await expect(visual.locator('[data-static-stage]')).toHaveCount(49);
  await expect(visual.locator('[data-no-evidence]')).toBeVisible();
});
