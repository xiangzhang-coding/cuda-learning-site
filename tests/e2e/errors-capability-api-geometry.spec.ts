// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const embeddedModels = [
  {
    id: 'VIS19 error timeline',
    visualId: 'VIS19',
    routes: {
      zh: '/foundations/asynchronous-errors/',
      en: '/en/foundations/asynchronous-errors/',
    },
    component: 'cuda-error-timeline',
    readyAttribute: 'data-enhanced',
    controls: '[data-timeline-controls]',
    fallbackItems: '[data-static-fallback] [data-scenario]',
    fallbackCount: 2,
    evidence: '[data-no-evidence]',
    printHidden: '[data-live-status]',
  },
  {
    id: 'VIS20 capability filter',
    visualId: 'VIS20',
    routes: {
      zh: '/foundations/compute-capability/',
      en: '/en/foundations/compute-capability/',
    },
    component: 'cuda-capability-filter',
    readyAttribute: 'data-ready',
    controls: '[data-capability-controls]',
    fallbackItems: '[data-static-fallback] tbody tr',
    fallbackCount: 5,
    evidence: '[data-no-evidence]',
    printHidden: '[data-capability-result]',
  },
  {
    id: 'VIS21 API boundary',
    visualId: 'VIS21',
    routes: {
      zh: '/foundations/runtime-driver-api/',
      en: '/en/foundations/runtime-driver-api/',
    },
    component: 'cuda-api-boundary',
    readyAttribute: 'data-ready',
    controls: '[data-api-boundary-controls]',
    fallbackItems: '[data-static-fallback] tbody tr',
    fallbackCount: 6,
    evidence: '[data-no-evidence]',
    printHidden: '[data-api-boundary-panel]',
  },
  {
    id: 'VIS22 block-shape explorer',
    visualId: 'VIS22',
    routes: {
      zh: '/foundations/launch-geometry/',
      en: '/en/foundations/launch-geometry/',
    },
    component: 'cuda-block-shape-explorer',
    readyAttribute: 'data-ready',
    controls: '[data-block-shape-controls]',
    fallbackItems: '[data-static-fallback] article',
    fallbackCount: 3,
    evidence: '[data-no-evidence]',
    printHidden: '[data-live-result]',
  },
] as const;

test('VIS19-VIS22 keep complete static text and reveal controls after enhancement', async ({ page }) => {
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const model of embeddedModels) {
    for (const route of [model.routes.zh, model.routes.en]) {
      const response = await page.goto(route);
      expect(response?.ok(), route).toBe(true);
      const component = page.locator(`${model.component}[data-visual-id="${model.visualId}"]`);
      await expect(component, `${model.id}: ${route}`).toHaveAttribute(model.readyAttribute, 'true');
      await expect(page.locator(`#${model.visualId.toLowerCase()}`)).toHaveCount(1);
      await expect(component.locator(model.controls)).toBeVisible();
      await expect(component.locator('[data-visual-controls]')).toBeVisible();
      await expect(component.locator('[data-static-fallback]')).toBeVisible();
      await expect(component.locator(model.fallbackItems)).toHaveCount(model.fallbackCount);
      await expect(component.locator(model.evidence)).toBeVisible();
      await expect(component.locator(model.evidence)).toContainText(/(?:no|none|不|无).*Evidence Status/i);
      for (const status of ['Compile-Checked', 'Community-Observed', 'Runtime-Verified']) {
        await expect(component.locator(model.evidence), `${model.id}: ${status}`).toContainText(status);
      }
    }
  }

  expect(failures).toEqual([]);
});

test('error timeline supports keyboard play, pause, step, reset, and scrub without persisting state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  await page.goto('/en/foundations/asynchronous-errors/');
  const timeline = page.locator('cuda-error-timeline');

  const step = timeline.getByRole('button', { name: 'Step', exact: true });
  await step.focus();
  await step.press('Enter');
  await expect(timeline).toHaveAttribute('data-stage', 'immediate-check');

  const reset = timeline.getByRole('button', { name: 'Reset', exact: true });
  await reset.focus();
  await reset.press('Enter');
  await expect(timeline).toHaveAttribute('data-stage', 'launch-submission');

  const scrub = timeline.locator('[data-action="scrub"]');
  await scrub.focus();
  await scrub.press('ArrowRight');
  await expect(scrub).toHaveValue('1');
  await expect(timeline).toHaveAttribute('data-stage', 'immediate-check');

  const play = timeline.getByRole('button', { name: 'Play', exact: true });
  await play.focus();
  await play.press('Enter');
  await expect(timeline).toHaveAttribute('data-playing', 'true');
  const pause = timeline.getByRole('button', { name: 'Pause', exact: true });
  await expect(pause).toBeFocused();
  await pause.press('Enter');
  await expect(timeline).toHaveAttribute('data-playing', 'false');
  await expect(play).toBeFocused();

  await timeline.locator('[data-action="select-scenario"]').selectOption('deferred-execution');
  await step.focus();
  await step.press('Enter');
  await expect(timeline).toHaveAttribute('data-scenario', 'deferred-execution');
  await expect(timeline).toHaveAttribute('data-stage', 'immediate-check');

  await page.reload();
  await expect(page.locator('cuda-error-timeline')).toHaveAttribute('data-scenario', 'launch-configuration');
  await expect(page.locator('cuda-error-timeline')).toHaveAttribute('data-stage', 'launch-submission');
  await expect(page.locator('cuda-error-timeline')).toHaveAttribute('data-playing', 'false');
  expect(failures).toEqual([]);
});

test('API-boundary tabs implement arrows, Home, and End with roving focus and reset on reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  await page.goto('/en/foundations/runtime-driver-api/');
  const boundary = page.locator('cuda-api-boundary');
  const first = boundary.locator('[data-stage-tab="initialize-device"]');

  await first.focus();
  await first.press('ArrowRight');
  const context = boundary.locator('[data-stage-tab="context"]');
  await expect(context).toBeFocused();
  await expect(context).toHaveAttribute('aria-selected', 'true');

  await context.press('End');
  const last = boundary.locator('[data-stage-tab="completion-errors"]');
  await expect(last).toBeFocused();
  await expect(boundary).toHaveAttribute('data-current-stage', 'completion-errors');

  await last.press('Home');
  await expect(first).toBeFocused();
  await expect(boundary).toHaveAttribute('data-current-stage', 'initialize-device');

  await first.press('ArrowLeft');
  await expect(last).toBeFocused();
  await expect(boundary.locator('[data-api-boundary-panel]')).toHaveAttribute('aria-labelledby', await last.getAttribute('id') ?? '');

  await page.reload();
  await expect(page.locator('cuda-api-boundary')).toHaveAttribute('data-current-stage', 'initialize-device');
  await expect(page.locator('[data-stage-tab="initialize-device"]')).toHaveAttribute('aria-selected', 'true');
  expect(failures).toEqual([]);
});

test('capability filter fails closed for keyboard input, resets focus, and does not persist', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  await page.goto('/en/foundations/compute-capability/');
  const filter = page.locator('cuda-capability-filter');
  const input = filter.locator('[data-capability-input]');

  await input.focus();
  await input.selectText();
  await page.keyboard.type('8.6');
  await expect(filter).toHaveAttribute('data-state', 'unknown');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await expect(filter.locator('[data-capability-details]')).toBeHidden();
  await expect(filter.locator('[data-capability-status]')).toContainText('Unknown or malformed');

  const reset = filter.locator('[data-capability-reset]');
  await reset.focus();
  await reset.press('Enter');
  await expect(input).toBeFocused();
  await expect(input).toHaveValue('7.5');
  await expect(input).toHaveAttribute('aria-invalid', 'false');
  await expect(filter).toHaveAttribute('data-state', 'known');
  await expect(filter.locator('[data-capability-details]')).toBeVisible();

  await input.fill('12.0');
  await expect(filter.locator('[data-capability-status]')).toContainText('12.0');
  await page.reload();
  await expect(page.locator('[data-capability-input]')).toHaveValue('7.5');
  await expect(page.locator('cuda-capability-filter')).toHaveAttribute('data-state', 'known');
  expect(failures).toEqual([]);
});

test('block-shape explorer rejects an aggregate overflow, exposes no partial geometry, and resets by keyboard', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  await page.goto('/en/foundations/launch-geometry/');
  const explorer = page.locator('cuda-block-shape-explorer');
  const blockX = explorer.locator('[data-block-shape-field="blockX"]');
  const blockY = explorer.locator('[data-block-shape-field="blockY"]');

  await blockX.focus();
  await blockX.selectText();
  await page.keyboard.type('1024');
  await blockY.focus();
  await blockY.selectText();
  await page.keyboard.type('2');

  await expect(explorer).toHaveAttribute('data-state', 'invalid');
  await expect(explorer.locator('[data-verdict]')).toHaveText('STOP');
  await expect(explorer.locator('[data-issues] li')).toHaveCount(1);
  await expect(explorer.locator('[data-issues] li')).toContainText('exceeds maxThreadsPerBlock');
  await expect(blockX).toHaveAttribute('aria-invalid', 'true');
  await expect(blockY).toHaveAttribute('aria-invalid', 'true');
  await expect(explorer.locator('[data-geometry]')).toBeHidden();
  await expect(explorer.locator('[data-grid]')).toBeHidden();

  const reset = explorer.locator('[data-reset-block-shape]');
  await reset.focus();
  await reset.press('Enter');
  await expect(explorer).toHaveAttribute('data-state', 'valid');
  await expect(explorer.locator('[data-block-shape-field="logicalWidth"]')).toBeFocused();
  await expect(blockX).toHaveValue('16');
  await expect(blockY).toHaveValue('8');
  await expect(explorer.locator('[data-grid]')).toHaveText('5 x 6 = 30');

  await explorer.locator('[data-block-shape-field="logicalWidth"]').fill('66');
  await page.reload();
  await expect(page.locator('[data-block-shape-field="logicalWidth"]')).toHaveValue('65');
  await expect(page.locator('cuda-block-shape-explorer')).toHaveAttribute('data-state', 'valid');
  expect(failures).toEqual([]);
});

test('embedded models reflow on mobile without horizontal page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const model of embeddedModels) {
    await page.goto(model.routes.en);
    await page.waitForLoadState('networkidle');
    const component = page.locator(`${model.component}[data-visual-id="${model.visualId}"]`);
    await expect(component.locator(model.controls)).toBeVisible();
    await expect(component.locator('[data-static-fallback]')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      model.id,
    ).toBe(true);
  }

  expect(failures).toEqual([]);
});

test('reduced motion and forced colors keep every model operable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'more', forcedColors: 'active' });
  const reducedDuration = (selector: string) =>
    page.locator(selector).evaluate((element) =>
      Math.max(...getComputedStyle(element).transitionDuration.split(',').map((value) => Number.parseFloat(value))),
    );

  await page.goto('/en/foundations/asynchronous-errors/');
  const step = page.getByRole('button', { name: 'Step', exact: true });
  await step.focus();
  await step.press('Enter');
  await expect(page.locator('cuda-error-timeline')).toHaveAttribute('data-stage', 'immediate-check');
  expect(await reducedDuration('[data-action="step"]')).toBeLessThanOrEqual(0.00001);

  await page.goto('/en/foundations/compute-capability/');
  await page.locator('[data-capability-input]').fill('8.6');
  await expect(page.locator('cuda-capability-filter')).toHaveAttribute('data-state', 'unknown');
  await page.locator('[data-capability-reset]').focus();
  await page.locator('[data-capability-reset]').press('Enter');
  await expect(page.locator('cuda-capability-filter')).toHaveAttribute('data-state', 'known');
  expect(await reducedDuration('[data-capability-reset]')).toBeLessThanOrEqual(0.00001);

  await page.goto('/en/foundations/runtime-driver-api/');
  const launch = page.locator('[data-stage-tab="launch"]');
  await launch.focus();
  await launch.press('Enter');
  await expect(page.locator('cuda-api-boundary')).toHaveAttribute('data-current-stage', 'launch');
  expect(await reducedDuration('[data-stage-tab="launch"]')).toBeLessThanOrEqual(0.00001);

  await page.goto('/en/foundations/launch-geometry/');
  await page.locator('[data-block-shape-field="blockX"]').fill('1024');
  await page.locator('[data-block-shape-field="blockY"]').fill('2');
  await expect(page.locator('cuda-block-shape-explorer')).toHaveAttribute('data-state', 'invalid');
  await page.locator('[data-reset-block-shape]').focus();
  await page.locator('[data-reset-block-shape]').press('Enter');
  await expect(page.locator('cuda-block-shape-explorer')).toHaveAttribute('data-state', 'valid');
  expect(await reducedDuration('[data-reset-block-shape]')).toBeLessThanOrEqual(0.00001);

  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(prefers-contrast: more)').matches)).toBe(true);
  expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
});

test('no-script and print output retain every complete static fallback', async ({ browser, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium static-output probe is sufficient.');
  const context = await browser.newContext({
    baseURL: 'http://127.0.0.1:4321',
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await context.newPage();

  for (const model of embeddedModels) {
    for (const route of [model.routes.zh, model.routes.en]) {
      const response = await staticPage.goto(route);
      expect(response?.ok(), route).toBe(true);
      const component = staticPage.locator(`${model.component}[data-visual-id="${model.visualId}"]`);
      await expect(component.locator(model.controls)).toBeHidden();
      await expect(component.locator('[data-visual-controls]')).toBeHidden();
      await expect(component.locator('[data-static-fallback]')).toBeVisible();
      await expect(component.locator(model.fallbackItems)).toHaveCount(model.fallbackCount);
      await expect(component.locator(model.evidence)).toBeVisible();
      expect(await staticPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }
  await context.close();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ media: 'print' });
  for (const model of embeddedModels) {
    await page.goto(model.routes.en);
    const component = page.locator(`${model.component}[data-visual-id="${model.visualId}"]`);
    await expect(component.locator(model.controls)).toBeHidden();
    await expect(component.locator(model.printHidden)).toBeHidden();
    await expect(component.locator('[data-static-fallback]')).toBeVisible();
    await expect(component.locator(model.fallbackItems)).toHaveCount(model.fallbackCount);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), model.id).toBe(true);
  }
  await page.emulateMedia({ media: 'screen' });
});
