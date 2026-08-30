// SPDX-License-Identifier: Apache-2.0
import { expect, test, type Locator } from '@playwright/test';

async function liveLaneSnapshot(visual: Locator) {
  return visual.locator('[data-live-lane]').evaluateAll((lanes) => lanes.map((lane) => [
    lane.getAttribute('data-lane-index'),
    lane.getAttribute('data-lane-state'),
    lane.getAttribute('data-lane-value'),
  ].join(':')));
}

const staticSelectionIds = [
  'adjacent-pairs:5',
  'adjacent-pairs:6',
  'adjacent-pairs:8',
  'stride-halving:5',
  'stride-halving:6',
  'stride-halving:8',
];

test('VIS10 native controls step both variants, repair focus, reset, and avoid autoplay or persistence', async ({ page }) => {
  await page.goto('/en/visuals/reduction-stages/');
  const visual = page.locator('[data-visual-id="VIS10"]');
  const variant = visual.locator('[data-reduction-variant]');
  const elementCount = visual.locator('[data-reduction-element-count]');
  const step = visual.locator('[data-reduction-action="step"]');
  const reset = visual.locator('[data-reduction-action="reset"]');
  const status = visual.locator('[data-reduction-status]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  expect(await variant.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['adjacent-pairs', 'stride-halving']);
  expect(await elementCount.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(['5', '6', '8']);
  await expect(visual.locator('[data-live-lane]')).toHaveCount(8);
  await expect(visual.locator('[data-static-selection]')).toHaveCount(6);
  await expect(visual.locator('[data-static-stage]')).toHaveCount(24);
  await expect(visual.locator('[data-reduction-action="play"], input[type="range"]')).toHaveCount(0);

  const initialVariant = await variant.inputValue();
  const initialElementCount = await elementCount.inputValue();
  expect(['adjacent-pairs', 'stride-halving']).toContain(initialVariant);
  expect(['5', '6', '8']).toContain(initialElementCount);
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await page.waitForTimeout(150);
  await expect(visual).toHaveAttribute('data-step-index', '0');

  const storageBefore = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));

  await elementCount.selectOption('5');
  await variant.selectOption('adjacent-pairs');
  await expect(visual).toHaveAttribute('data-variant', 'adjacent-pairs');
  await expect(visual).toHaveAttribute('data-element-count', '5');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  expect(await liveLaneSnapshot(visual)).toEqual([
    '0:active:3',
    '1:active:1',
    '2:active:4',
    '3:active:1',
    '4:active:5',
    '5:inactive:0',
    '6:inactive:0',
    '7:inactive:0',
  ]);
  await expect(visual.locator('[data-live-lane][data-lane-state="inactive"]')).toHaveCount(3);
  for (const text of await visual.locator('[data-live-lane][data-lane-state="inactive"]').allTextContents()) {
    expect(text).toMatch(/inactive lane/i);
    expect(text).toMatch(/neutral(?: value)?\D*0/i);
  }

  await step.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-step-index', '1');
  expect(await liveLaneSnapshot(visual)).toEqual([
    '0:active:4',
    '1:inactive:0',
    '2:active:5',
    '3:inactive:0',
    '4:active:5',
    '5:inactive:0',
    '6:inactive:0',
    '7:inactive:0',
  ]);

  await variant.selectOption('stride-halving');
  await expect(visual).toHaveAttribute('data-variant', 'stride-halving');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await step.focus();
  await page.keyboard.press('Space');
  await expect(visual).toHaveAttribute('data-step-index', '1');
  expect(await liveLaneSnapshot(visual)).toEqual([
    '0:active:8',
    '1:active:1',
    '2:active:4',
    '3:active:1',
    '4:inactive:0',
    '5:inactive:0',
    '6:inactive:0',
    '7:inactive:0',
  ]);

  await elementCount.selectOption('6');
  await expect(visual).toHaveAttribute('data-element-count', '6');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  for (let index = 1; index <= 3; index += 1) {
    await step.press(index % 2 === 0 ? 'Space' : 'Enter');
    await expect(visual).toHaveAttribute('data-step-index', String(index));
  }
  await expect(visual).toHaveAttribute('data-sequence-complete', 'true');
  expect(await liveLaneSnapshot(visual)).toEqual([
    '0:active:23',
    '1:inactive:0',
    '2:inactive:0',
    '3:inactive:0',
    '4:inactive:0',
    '5:inactive:0',
    '6:inactive:0',
    '7:inactive:0',
  ]);
  await expect(step).toBeDisabled();
  await expect(reset).toBeFocused();
  await expect(status).toContainText('23');

  await reset.press('Enter');
  await expect(visual).toHaveAttribute('data-variant', 'stride-halving');
  await expect(visual).toHaveAttribute('data-element-count', '6');
  await expect(visual).toHaveAttribute('data-step-index', '0');
  await expect(visual).toHaveAttribute('data-sequence-complete', 'false');
  await expect(variant).toBeFocused();

  expect(await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }))).toEqual(storageBefore);

  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(variant).toHaveValue(initialVariant);
  await expect(elementCount).toHaveValue(initialElementCount);
  await expect(visual).toHaveAttribute('data-step-index', '0');
});

test('VIS10 keeps every bilingual reduction stage and inactive-lane explanation without JavaScript at 390px', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const { route, locale } of [
    { route: '/visuals/reduction-stages/', locale: 'zh-CN' },
    { route: '/en/visuals/reduction-stages/', locale: 'en' },
  ]) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('[data-visual-id="VIS10"]');
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-live-workbench]')).toBeHidden();
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    await expect(visual.locator('[data-static-selection]')).toHaveCount(6);
    await expect(visual.locator('[data-static-stage]')).toHaveCount(24);
    await expect(visual.locator('[data-static-lane]')).toHaveCount(192);
    await expect(visual.locator('[data-static-lane][data-lane-state="inactive"]')).toHaveCount(114);
    expect(await visual.locator('[data-static-selection]').evaluateAll((selections) => selections.map((selection) =>
      selection.getAttribute('data-static-selection')))).toEqual(staticSelectionIds);
    expect(await visual.locator('[data-static-selection]').evaluateAll((selections) => selections.map((selection) =>
      selection.getAttribute('data-final-sum')))).toEqual(['14', '23', '31', '14', '23', '31']);

    const inactiveLanes = await visual.locator('[data-static-lane][data-lane-state="inactive"]').evaluateAll((lanes) =>
      lanes.map((lane) => ({
        value: lane.getAttribute('data-lane-value'),
        text: lane.textContent ?? '',
      })));
    expect(inactiveLanes.every(({ value }) => value === '0')).toBe(true);
    for (const { text } of inactiveLanes) {
      expect(text).toMatch(locale === 'en' ? /inactive lane/i : /非活动通道/);
      expect(text).toMatch(locale === 'en' ? /neutral(?: value)?\D*0/i : /中性值\D*0/);
    }
    await expect(visual.locator('[data-conceptual-only]')).toBeVisible();
    await expect(visual.locator('[data-no-evidence]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS10 preserves mobile, reduced-motion, forced-color, print, and evidence boundaries', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ['/visuals/reduction-stages/', '/en/visuals/reduction-stages/']) {
    await page.goto(route);
    await expect(page.locator('[data-visual-id="VIS10"] [data-static-fallback]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/reduction-stages/');
  const visual = page.locator('[data-visual-id="VIS10"]');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
  expect(
    await visual.locator('[data-live-lane]').first().evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);

  await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
  await expect(visual.locator('[data-no-evidence]')).toContainText('Compile-Checked');
  await expect(visual.locator('[data-no-evidence]')).toContainText('Runtime-Verified');
  await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
  await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
  await expect(visual.locator('[data-measured], [data-observed-reduction], [data-timing], [data-throughput]')).toHaveCount(0);

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-selection]')).toHaveCount(6);
  await expect(visual.locator('[data-static-stage]')).toHaveCount(24);
  await expect(visual.locator('[data-static-lane]')).toHaveCount(192);
  await expect(visual.locator('[data-static-lane][data-lane-state="inactive"]')).toHaveCount(114);
  await expect(visual.locator('[data-no-evidence]')).toBeVisible();
});
