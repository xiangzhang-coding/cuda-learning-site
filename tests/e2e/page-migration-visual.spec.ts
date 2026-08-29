// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

test('VIS08 native controls support keyboard stepping, reset focus, reload isolation, and no visual storage', async ({ page }) => {
  await page.goto('/en/visuals/page-migration/');
  const visual = page.locator('cuda-page-migration[data-visual-id="VIS08"]');
  const scenario = visual.locator('[data-page-migration-scenario]');
  const step = visual.locator('[data-page-migration-action="step"]');
  const reset = visual.locator('[data-page-migration-action="reset"]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-scenario-id', 'gpu-linear-sweep');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual).toHaveAttribute('data-transition-count', '0');
  await expect(visual).toHaveAttribute('data-symbolic-bytes', '0');
  await expect(visual.locator('[data-static-scenario]')).toHaveCount(3);
  await expect(visual.locator('[data-static-access-row]')).toHaveCount(12);
  await expect(visual.locator('[data-page-migration-action="play"], input[type="range"]')).toHaveCount(0);

  const storageBefore = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));

  await scenario.selectOption('alternating-hot-page');
  await expect(visual).toHaveAttribute('data-scenario-id', 'alternating-hot-page');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await page.waitForTimeout(150);
  await expect(visual).toHaveAttribute('data-step-index', '0');

  await step.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-step-index', '1');
  await expect(visual).toHaveAttribute('data-transition-count', '1');
  await expect(visual).toHaveAttribute('data-symbolic-bytes', '65536');
  await expect(visual.locator('[data-page-migration-ledger] [data-access-row]')).toHaveCount(1);
  await expect(visual.locator('[data-page-residency-rail] [data-page-id="page-00"]')).toHaveAttribute('data-residency', 'gpu');

  await page.keyboard.press('Space');
  await expect(visual).toHaveAttribute('data-step-index', '2');
  await expect(visual).toHaveAttribute('data-transition-count', '2');
  await expect(visual.locator('[data-page-residency-rail] [data-page-id="page-00"]')).toHaveAttribute('data-residency', 'cpu');
  await expect(visual.locator('[data-page-migration-status]')).toContainText('Step 2/4');

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual).toHaveAttribute('data-transition-count', '0');
  await expect(visual).toHaveAttribute('data-symbolic-bytes', '0');
  await expect(scenario).toBeFocused();

  expect(await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }))).toEqual(storageBefore);

  await scenario.selectOption('split-working-set');
  await step.press('Enter');
  await expect(visual).toHaveAttribute('data-scenario-id', 'split-working-set');
  await expect(visual).toHaveAttribute('data-step-index', '1');
  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-scenario-id', 'gpu-linear-sweep');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual).toHaveAttribute('data-transition-count', '0');
  await expect(visual).toHaveAttribute('data-symbolic-bytes', '0');
});

test('VIS08 keeps complete bilingual static fallbacks without JavaScript at 390px', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const route of ['/visuals/page-migration/', '/en/visuals/page-migration/']) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('cuda-page-migration[data-visual-id="VIS08"]');
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-interactive-workbench]')).toBeHidden();
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    await expect(visual.locator('[data-static-scenario]')).toHaveCount(3);
    await expect(visual.locator('[data-static-access-row]')).toHaveCount(12);
    await expect(visual.locator('[data-static-page]')).toHaveCount(10);
    await expect(visual.locator('[data-conceptual-only]')).toBeVisible();
    await expect(visual.locator('[data-no-evidence]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS08 reflows on mobile and preserves reduced-motion, forced-color, print, and visual boundaries', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ['/visuals/page-migration/', '/en/visuals/page-migration/']) {
    await page.goto(route);
    await expect(page.locator('cuda-page-migration [data-static-fallback]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/page-migration/');
  const visual = page.locator('cuda-page-migration[data-visual-id="VIS08"]');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-interactive-workbench]')).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  expect(
    await visual.locator('[data-page-residency-rail] li').first().evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);

  await expect(visual).toHaveAttribute('data-assumption-id', 'declared-software-coherent-single-residency');
  await expect(visual.locator('[data-conceptual-only]')).toContainText('software-coherent teaching assumption');
  await expect(visual.locator('[data-no-evidence]')).toContainText('observes no page fault');
  await expect(visual.locator('[data-no-evidence]')).toContainText('grant no Compile-Checked');
  await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
  expect(await visual.innerText()).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?)\b/i);
  await expect(visual.locator('[data-measured], [data-observed-migration], [data-latency]')).toHaveCount(0);

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-interactive-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-scenario]')).toHaveCount(3);
  await expect(visual.locator('[data-static-access-row]')).toHaveCount(12);
  await expect(visual.locator('[data-no-evidence]')).toBeVisible();
});
