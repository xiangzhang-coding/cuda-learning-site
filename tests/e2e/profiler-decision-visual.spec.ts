// SPDX-License-Identifier: Apache-2.0
import { expect, test, type Locator, type Page } from '@playwright/test';

const decisions = [
  {
    symptomId: 'whole-workload-slow',
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'form-timeline-hypothesis',
    toolLabel: 'Nsight Systems',
  },
  {
    symptomId: 'cpu-or-launch-gaps',
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'form-timeline-hypothesis',
    toolLabel: 'Nsight Systems',
  },
  {
    symptomId: 'copy-overlap-unclear',
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'form-timeline-hypothesis',
    toolLabel: 'Nsight Systems',
  },
  {
    symptomId: 'kernel-not-selected',
    recommendedTool: 'nsight-systems',
    analysisScope: 'application-timeline',
    artifactKind: 'nsys-rep',
    decisionGate: 'timeline-first',
    nextGate: 'select-kernel-and-question',
    toolLabel: 'Nsight Systems',
  },
  {
    symptomId: 'selected-kernel-memory-question',
    recommendedTool: 'nsight-compute',
    analysisScope: 'selected-kernel',
    artifactKind: 'ncu-rep',
    decisionGate: 'kernel-and-question-selected',
    nextGate: 'test-kernel-hypothesis',
    toolLabel: 'Nsight Compute',
  },
  {
    symptomId: 'selected-kernel-execution-question',
    recommendedTool: 'nsight-compute',
    analysisScope: 'selected-kernel',
    artifactKind: 'ncu-rep',
    decisionGate: 'kernel-and-question-selected',
    nextGate: 'test-kernel-hypothesis',
    toolLabel: 'Nsight Compute',
  },
] as const;

type Decision = (typeof decisions)[number];

async function rootDataAttributes(visual: Locator) {
  return visual.evaluate((element) => Object.fromEntries(
    [...element.attributes]
      .filter(({ name }) => name.startsWith('data-'))
      .map(({ name, value }) => [name, value]),
  ));
}

function expectedRootDataAttributes(decision: Decision) {
  return {
    'data-visual-id': 'VIS14',
    'data-locale': 'en',
    'data-symptom-id': decision.symptomId,
    'data-recommended-tool': decision.recommendedTool,
    'data-analysis-scope': decision.analysisScope,
    'data-artifact-kind': decision.artifactKind,
    'data-decision-gate': decision.decisionGate,
    'data-next-gate': decision.nextGate,
    'data-evidence-status-effect': 'none',
    'data-ready': 'true',
  };
}

async function storageKeys(page: Page) {
  return page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).sort(),
  }));
}

test('VIS14 native select preserves all six mappings, card state, Reset focus, and non-persistence', async ({ page }) => {
  await page.goto('/en/visuals/nsight-systems-versus-nsight-compute/');
  const visual = page.locator('cuda-profiler-decision-explorer[data-visual-id="VIS14"]');
  const symptom = visual.locator('select[data-profiler-symptom]');
  const reset = visual.locator('[data-profiler-action="reset"]');
  const status = visual.locator('[data-profiler-status]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual.locator('[data-visual-controls]')).toBeVisible();
  await expect(visual.locator('[data-live-workbench]')).toBeVisible();
  await expect(status).toHaveAttribute('role', 'status');
  await expect(status).toHaveAttribute('aria-live', 'polite');
  expect(await symptom.locator('option').evaluateAll((options) => options.map((option) =>
    (option as HTMLOptionElement).value))).toEqual(decisions.map(({ symptomId }) => symptomId));
  expect(await storageKeys(page)).toEqual({ local: [], session: [] });

  for (const decision of decisions) {
    await symptom.selectOption(decision.symptomId);
    expect(await rootDataAttributes(visual)).toEqual(expectedRootDataAttributes(decision));
    await expect(visual.locator('[data-live-tool]')).toHaveText(decision.toolLabel);

    const recommendedCard = visual.locator(`[data-tool-card="${decision.recommendedTool}"]`);
    await expect(visual.locator('[data-tool-card][aria-current="true"]')).toHaveCount(1);
    await expect(recommendedCard).toHaveAttribute('aria-current', 'true');
    await expect(recommendedCard.locator('h4')).toHaveText(decision.toolLabel);
    await expect(recommendedCard.locator('[data-recommendation-marker]')).toHaveText('Recommended next evidence');
    await expect(recommendedCard.locator('[data-recommendation-marker]')).toBeVisible();
    expect(await recommendedCard.evaluate((element) => ({
      style: getComputedStyle(element).borderTopStyle,
      width: Number.parseFloat(getComputedStyle(element).borderTopWidth),
    }))).toEqual({ style: 'solid', width: 3 });
  }

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(symptom).toBeFocused();
  await expect(symptom).toHaveValue(decisions[0].symptomId);
  expect(await rootDataAttributes(visual)).toEqual(expectedRootDataAttributes(decisions[0]));
  await expect(status).toHaveText('Decision path reset; focus returned to Observable symptom.');
  expect(await storageKeys(page)).toEqual({ local: [], session: [] });

  await symptom.selectOption('selected-kernel-memory-question');
  expect(await storageKeys(page)).toEqual({ local: [], session: [] });
  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(symptom).toHaveValue(decisions[0].symptomId);
  expect(await rootDataAttributes(visual)).toEqual(expectedRootDataAttributes(decisions[0]));
});

test('VIS14 keeps the complete bilingual six-leaf fallback at 390px without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const { route, locale } of [
    { route: '/visuals/nsight-systems-versus-nsight-compute/', locale: 'zh-CN' },
    { route: '/en/visuals/nsight-systems-versus-nsight-compute/', locale: 'en' },
  ]) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    const visual = page.locator('cuda-profiler-decision-explorer[data-visual-id="VIS14"]');
    const leaves = visual.locator('[data-static-decision-leaf]');

    await expect(visual).toHaveAttribute('data-locale', locale);
    await expect(visual).not.toHaveAttribute('data-ready', 'true');
    await expect(visual.locator('[data-visual-controls]')).toBeHidden();
    await expect(visual.locator('[data-live-workbench]')).toBeHidden();
    await expect(visual.locator('[data-static-fallback]')).toBeVisible();
    await expect(leaves).toHaveCount(6);
    await expect(visual.locator('[data-static-decision-leaf][data-recommended-tool="nsight-systems"]')).toHaveCount(4);
    await expect(visual.locator('[data-static-decision-leaf][data-recommended-tool="nsight-compute"]')).toHaveCount(2);
    expect(await leaves.evaluateAll((elements) => elements.map((leaf) => ({
      symptomId: leaf.getAttribute('data-symptom-id'),
      recommendedTool: leaf.getAttribute('data-recommended-tool'),
      analysisScope: leaf.getAttribute('data-analysis-scope'),
      artifactKind: leaf.getAttribute('data-artifact-kind'),
      decisionGate: leaf.getAttribute('data-decision-gate'),
      nextGate: leaf.getAttribute('data-next-gate'),
    })))).toEqual(decisions.map((decision) => ({
      symptomId: decision.symptomId,
      recommendedTool: decision.recommendedTool,
      analysisScope: decision.analysisScope,
      artifactKind: decision.artifactKind,
      decisionGate: decision.decisionGate,
      nextGate: decision.nextGate,
    })));
    for (const text of await leaves.allTextContents()) expect(text.trim().length).toBeGreaterThan(40);
    await expect(visual.locator('[data-conceptual-only]')).toBeVisible();
    await expect(visual.locator('[data-no-evidence]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await context.close();
});

test('VIS14 preserves reduced motion, forced colors, print, and empty evidence metadata', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await page.goto('/en/visuals/nsight-systems-versus-nsight-compute/');
  const visual = page.locator('cuda-profiler-decision-explorer[data-visual-id="VIS14"]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await visual.locator('[data-profiler-symptom]').selectOption('selected-kernel-execution-question');
  const selected = visual.locator('[data-tool-card="nsight-compute"]');
  await expect(selected).toHaveAttribute('aria-current', 'true');
  expect(await selected.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)))
    .toBeLessThanOrEqual(0.00001);
  expect(await selected.evaluate((element) => getComputedStyle(element).borderTopStyle)).toBe('solid');
  expect(await selected.evaluate((element) => Number.parseFloat(getComputedStyle(element).borderTopWidth)))
    .toBeGreaterThanOrEqual(3);
  await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
  for (const name of [
    'cuda:evidence-compilation',
    'cuda:evidence-runtime',
    'cuda:expected-observations',
    'cuda:recorded-observations',
  ]) await expect(page.locator(`meta[name="${name}"]`)).toHaveAttribute('content', 'none');
  await expect(visual.locator('[data-measured], [data-profiler-report], [data-timing], [data-throughput], [data-speedup], [data-bottleneck]')).toHaveCount(0);
  await expect(visual.locator('[data-no-evidence]')).toContainText('Compile-Checked');
  await expect(visual.locator('[data-no-evidence]')).toContainText('Runtime-Verified');

  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce', forcedColors: 'active' });
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('[data-static-decision-leaf]')).toHaveCount(6);
  await expect(visual.locator('[data-no-evidence]')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
