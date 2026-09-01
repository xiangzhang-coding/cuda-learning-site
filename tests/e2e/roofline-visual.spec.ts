// SPDX-License-Identifier: Apache-2.0
import { expect, test, type Locator, type Page } from '@playwright/test';

const defaults = {
  computeCeiling: '12000',
  bandwidthCeiling: '800',
  arithmeticIntensity: '8',
  achievedRate: '5600',
} as const;

async function storageKeys(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).filter((key) => /roofline|vis13/i.test(key)).sort(),
    session: Object.keys(sessionStorage).filter((key) => /roofline|vis13/i.test(key)).sort(),
  }));
}

async function setInput(visual: Locator, input: keyof typeof defaults, value: string) {
  const field = visual.locator(`[data-roofline-input="${input}"]`);
  await field.focus();
  await field.fill(value);
}

async function expectRootModel(
  visual: Locator,
  expected: Readonly<{
    compute: string;
    bandwidth: string;
    intensity: string;
    achieved: string;
    ridge: string;
    roof: string;
    region: string;
    relation: string;
  }>,
) {
  await expect(visual).toHaveAttribute('data-state', 'valid');
  await expect(visual).toHaveAttribute('data-declared-compute-ceiling', expected.compute);
  await expect(visual).toHaveAttribute('data-declared-bandwidth-ceiling', expected.bandwidth);
  await expect(visual).toHaveAttribute('data-arithmetic-intensity', expected.intensity);
  await expect(visual).toHaveAttribute('data-achieved-rate', expected.achieved);
  await expect(visual).toHaveAttribute('data-ridge-intensity', expected.ridge);
  await expect(visual).toHaveAttribute('data-workload-roof', expected.roof);
  await expect(visual).toHaveAttribute('data-model-region', expected.region);
  await expect(visual).toHaveAttribute('data-point-relation', expected.relation);
}

test('VIS13 supports keyboard Apply, fail-closed input, Reset focus, and reload defaults', async ({ page }) => {
  await page.goto('/en/visuals/roofline/');
  const visual = page.locator('cuda-roofline-explorer[data-visual-id="VIS13"]');
  const controls = visual.locator('[data-visual-controls]');
  const workbench = visual.locator('[data-live-workbench]');
  const apply = visual.locator('[data-roofline-action="apply"]');
  const reset = visual.locator('[data-roofline-action="reset"]');
  const status = visual.locator('[data-roofline-status]');
  const firstInput = visual.locator('[data-roofline-input="computeCeiling"]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(controls).toBeVisible();
  await expect(workbench).toBeVisible();
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  expect(await storageKeys(page)).toEqual({ local: [], session: [] });

  await setInput(visual, 'computeCeiling', '1000');
  await setInput(visual, 'bandwidthCeiling', '100');
  await setInput(visual, 'arithmeticIntensity', '5');
  await setInput(visual, 'achievedRate', '400');
  await apply.focus();
  await page.keyboard.press('Enter');
  await expectRootModel(visual, {
    compute: '1000',
    bandwidth: '100',
    intensity: '5',
    achieved: '400',
    ridge: '10',
    roof: '500',
    region: 'bandwidth-side',
    relation: 'below-roof',
  });
  await expect(workbench).toBeVisible();
  await expect(visual.locator('[data-live-region]')).toHaveText('Bandwidth-side model region');
  await expect(visual.locator('[data-live-relation]')).toHaveText('Below declared roof');
  await expect(visual.locator('[data-live-roof-bandwidth]')).toHaveAttribute('x1', /\d/);

  await setInput(visual, 'arithmeticIntensity', '10');
  await setInput(visual, 'achievedRate', '1000');
  await visual.locator('[data-roofline-input="achievedRate"]').press('Enter');
  await expectRootModel(visual, {
    compute: '1000',
    bandwidth: '100',
    intensity: '10',
    achieved: '1000',
    ridge: '10',
    roof: '1000',
    region: 'ridge',
    relation: 'on-roof',
  });
  await expect(visual.locator('[data-live-region]')).toHaveText('Model ridge');
  await expect(visual.locator('[data-live-relation]')).toHaveText('On declared roof');

  await setInput(visual, 'arithmeticIntensity', '20');
  await setInput(visual, 'achievedRate', '1100');
  await apply.focus();
  await page.keyboard.press('Enter');
  await expectRootModel(visual, {
    compute: '1000',
    bandwidth: '100',
    intensity: '20',
    achieved: '1100',
    ridge: '10',
    roof: '1000',
    region: 'compute-side',
    relation: 'above-declared-roof',
  });
  await expect(status).toContainText('audit units, counting rules, path, and provenance');
  await expect(visual.locator('[data-live-workload-marker]')).toHaveAttribute('data-point-relation', 'above-declared-roof');

  await setInput(visual, 'achievedRate', '0');
  await visual.locator('[data-roofline-input="achievedRate"]').press('Enter');
  await expect(visual).toHaveAttribute('data-state', 'invalid');
  await expect(visual.locator('[data-roofline-input="achievedRate"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(workbench).toBeHidden();
  await expect(visual).not.toHaveAttribute('data-workload-roof');
  await expect(visual).not.toHaveAttribute('data-model-region');
  expect(await visual.locator('[data-live-roof-bandwidth]').getAttribute('x1')).toBeNull();
  expect(await visual.locator('[data-live-ridge-marker]').getAttribute('points')).toBeNull();
  expect(await visual.locator('[data-live-workload-point]').getAttribute('cx')).toBeNull();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-workload-point]')).toHaveAttribute('cx', /\d/);
  await expect(status).toContainText('the model result and live chart are hidden');

  await setInput(visual, 'achievedRate', '1000');
  await visual.locator('[data-roofline-input="achievedRate"]').press('Enter');
  await expect(workbench).toBeVisible();
  await expect(visual.locator('[data-roofline-input="achievedRate"]')).toHaveAttribute('aria-invalid', 'false');
  await expect(visual.locator('[data-live-workload-point]')).toHaveAttribute('cx', /\d/);

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(firstInput).toBeFocused();
  for (const [input, value] of Object.entries(defaults)) {
    await expect(visual.locator(`[data-roofline-input="${input}"]`)).toHaveValue(value);
  }
  await expectRootModel(visual, {
    compute: '12000',
    bandwidth: '800',
    intensity: '8',
    achieved: '5600',
    ridge: '15',
    roof: '6400',
    region: 'bandwidth-side',
    relation: 'below-roof',
  });
  await expect(status).toHaveText('Restored the synthetic defaults; focus returned to Declared compute ceiling.');
  expect(await storageKeys(page)).toEqual({ local: [], session: [] });

  await setInput(visual, 'arithmeticIntensity', '20');
  await apply.click();
  await expect(visual).toHaveAttribute('data-arithmetic-intensity', '20');
  expect(await storageKeys(page)).toEqual({ local: [], session: [] });
  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(firstInput).toHaveValue(defaults.computeCeiling);
  await expect(visual.locator('[data-roofline-input="arithmeticIntensity"]')).toHaveValue(defaults.arithmeticIntensity);
  await expect(visual).toHaveAttribute('data-arithmetic-intensity', defaults.arithmeticIntensity);
  expect(await storageKeys(page)).toEqual({ local: [], session: [] });
});

test('VIS13 preserves the bilingual SVG and semantic table at 390px without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const { route, locale, ariaText, pointText } of [
    { route: '/visuals/roofline/', locale: 'zh-CN', ariaText: '声明 Roofline 模型图', pointText: '声明 workload 点' },
    { route: '/en/visuals/roofline/', locale: 'en', ariaText: 'Declared Roofline model chart', pointText: 'Declared workload point' },
  ]) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('cuda-roofline-explorer[data-visual-id="VIS13"]');
    const fallback = visual.locator('[data-static-fallback]');
    const svg = visual.locator('[data-static-svg]');
    const table = visual.locator('[data-static-table]');

    await expect(visual).toHaveAttribute('data-locale', locale);
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-live-workbench]')).toBeHidden();
    await expect(fallback).toBeVisible();
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute('viewBox', '0 0 720 420');
    await expect(svg).toHaveAttribute('role', 'img');
    await expect(svg).toHaveAttribute('aria-label', new RegExp(ariaText));
    await expect(svg.locator('.roofline-direct-labels')).toContainText(pointText);
    await expect(svg.locator('[data-static-roof-bandwidth]')).toHaveCount(1);
    await expect(svg.locator('[data-static-roof-compute]')).toHaveCount(1);
    await expect(svg.locator('[data-static-ridge-marker]')).toHaveCount(1);
    await expect(svg.locator('[data-static-workload-point]')).toHaveCount(1);
    await expect(table).toBeVisible();
    await expect(table.locator('tbody tr')).toHaveCount(8);
    await expect(visual.locator('[id]')).toHaveCount(0);
    await expect(visual.locator('[data-no-evidence]')).toContainText('LAB09');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS13 preserves reduced motion, forced colors, print fallback, and empty evidence metadata', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/roofline/');
  const visual = page.locator('cuda-roofline-explorer[data-visual-id="VIS13"]');
  const liveBoundary = visual.locator('[data-live-roof-compute]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  expect(await liveBoundary.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)))
    .toBeLessThanOrEqual(0.00001);
  expect(await liveBoundary.evaluate((element) => getComputedStyle(element).strokeDasharray)).not.toBe('none');
  expect(await liveBoundary.evaluate((element) => getComputedStyle(element).stroke)).not.toBe('none');
  await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
  for (const name of [
    'cuda:evidence-compilation',
    'cuda:evidence-runtime',
    'cuda:expected-observations',
    'cuda:recorded-observations',
  ]) await expect(page.locator(`meta[name="${name}"]`)).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:source-count"]')).toHaveAttribute('content', '4');
  await expect(page.locator('meta[name="cuda:prerequisites"]')).toHaveAttribute('content', 'Q10');
  await expect(page.locator('meta[name="cuda:related-units"]')).toHaveAttribute('content', 'Q09,A14,LAB09');
  await expect(visual.locator('[data-measured], [data-observed], [data-bottleneck], [data-profiler-report], [data-runtime-evidence], [data-evidence]')).toHaveCount(0);
  await expect(visual.locator('[data-no-evidence]')).toContainText('measured values');
  await expect(visual.locator('[data-no-evidence]')).toContainText('LAB09 Environment Manifest');

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-svg]')).toBeVisible();
  await expect(visual.locator('[data-static-table]')).toBeVisible();
  await expect(visual.locator('[data-static-table] tbody tr')).toHaveCount(8);
  await expect(visual.locator('[data-no-evidence]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
