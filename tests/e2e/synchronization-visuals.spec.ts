// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

test('VIS03 supports native keyboard stepping and deterministic reset', async ({ page }) => {
  await page.goto('/en/visuals/warp-divergence/');
  const visual = page.locator('cuda-warp-divergence');
  const preset = visual.locator('[data-warp-preset]');
  const step = visual.locator('[data-warp-step]');
  const reset = visual.locator('[data-warp-reset]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-preset', 'lower-half');
  await expect(visual).toHaveAttribute('data-stage', 'before-branch');
  await expect(visual.locator('[data-static-case="lower-half"] tbody tr')).toHaveCount(32);
  await expect(visual.locator('[data-static-case="uniform-true"] tbody tr')).toHaveCount(32);

  await preset.selectOption('uniform-true');
  await expect(visual).toHaveAttribute('data-preset', 'uniform-true');
  await step.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-stage', 'predicate-evaluated');
  await page.keyboard.press('Space');
  await page.keyboard.press('Space');
  await expect(visual).toHaveAttribute('data-stage', 'false-path');
  await expect(visual.locator('[data-warp-disposition]')).toContainText('Skipped');
  await page.keyboard.press('Space');
  await expect(visual).toHaveAttribute('data-stage', 'logical-join');
  await expect(visual).toHaveAttribute('data-lane-set-meaning', 'source-level-participating-set');
  await expect(visual.locator('[data-warp-lane-set-label]')).toHaveText('Source-level participating set');
  await expect(visual.locator('[data-warp-status]')).toContainText('source-level participating set');
  await expect(visual.locator('[data-warp-status]')).not.toContainText('current active mask');
  await expect(visual.locator('[data-warp-lanes] tr').first()).toContainText('ITS may regroup sub-warps');

  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-preset', 'lower-half');
  await expect(visual).toHaveAttribute('data-stage', 'before-branch');
  await expect(preset).toBeFocused();
});

test('VIS07 resets playback on edits, rejects an invalid edge fail-closed, and does not persist reload state', async ({ page }) => {
  await page.goto('/en/visuals/stream-event-dependencies/');
  const visual = page.locator('cuda-stream-event-dependencies');
  const play = visual.locator('[data-trace-action="play"]');
  const pause = visual.locator('[data-trace-action="pause"]');
  const step = visual.locator('[data-trace-action="step"]');
  const reset = visual.locator('[data-trace-action="reset"]');

  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-operation-count', '4');
  await expect(visual).toHaveAttribute('data-event-count', '1');
  await expect(visual.locator('[data-event-generation-ledger]')).toBeVisible();
  await expect(visual.locator('[data-event-generation-row]')).toHaveCount(2);
  await expect(visual.locator('[data-event-timing-bracket]')).toHaveAttribute('data-timing-status', 'formula-only');
  await expect(visual.locator('[data-event-timing-bracket]')).toHaveAttribute('data-elapsed-milliseconds', 'null');
  await expect(visual.locator('[data-stream-relation-verdict]')).toHaveAttribute(
    'data-stream-relation-verdict',
    'unordered-not-proven-concurrent',
  );

  await play.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-playing', 'true');
  await expect(pause).toBeFocused();
  await page.keyboard.press('Space');
  await expect(visual).toHaveAttribute('data-playing', 'false');
  await expect(play).toBeFocused();
  await step.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-trace-frame', '1');
  await reset.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-trace-frame', '0');
  await expect(play).toBeFocused();

  await visual.locator('[data-event-record]').selectOption('op-02');
  await visual.locator('[data-event-wait]').selectOption('op-02');
  await visual.locator('[data-add-event]').focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-edit-valid', 'false');
  await expect(visual).toHaveAttribute('data-last-edit', 'self-dependency');
  await expect(visual).toHaveAttribute('data-event-count', '1');
  await expect(visual.locator('[data-event-edges] li')).toHaveCount(1);
  await expect(visual.locator('[data-graph-validation]')).toContainText('graph is unchanged');

  await visual.locator('[data-stream-count]').selectOption('3');
  await visual.locator('[data-event-record]').selectOption('op-04');
  await visual.locator('[data-event-wait]').selectOption('op-05');
  await visual.locator('[data-add-event]').click();
  await expect(visual).toHaveAttribute('data-edit-valid', 'true');
  await expect(visual).toHaveAttribute('data-event-count', '2');
  await expect(visual.locator('[data-event-edges] li')).toHaveCount(2);

  await play.focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-playing', 'true');
  await visual.locator('[data-operation-stream]').selectOption('consume-stream');
  await visual.locator('[data-operation-kind]').selectOption('d2h-copy');
  await visual.locator('[data-add-operation]').focus();
  await page.keyboard.press('Enter');
  await expect(visual).toHaveAttribute('data-operation-count', '6');
  await expect(visual).toHaveAttribute('data-playing', 'false');
  await expect(visual).toHaveAttribute('data-trace-frame', '0');

  await page.reload();
  await expect(visual).toHaveAttribute('data-ready', 'true');
  await expect(visual).toHaveAttribute('data-stream-count', '2');
  await expect(visual).toHaveAttribute('data-operation-count', '4');
  await expect(visual).toHaveAttribute('data-event-count', '1');
  await expect(visual).toHaveAttribute('data-trace-frame', '0');
});

test('synchronization visuals reflow on mobile and honor reduced-motion and print fallbacks', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    '/visuals/warp-divergence/',
    '/en/visuals/warp-divergence/',
    '/visuals/stream-event-dependencies/',
    '/en/visuals/stream-event-dependencies/',
  ]) {
    await page.goto(route);
    await expect(page.locator('[data-static-fallback]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.goto('/en/visuals/stream-event-dependencies/');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await page.locator('[data-add-operation]').evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  await expect(page.locator('[data-visual-controls]')).toBeHidden();
  await expect(page.locator('[data-interactive-workbench]')).toBeHidden();
  await expect(page.locator('[data-static-fallback]')).toBeVisible();
  await expect(page.locator('[data-static-trace-frame]')).toHaveCount(6);
  await expect(page.locator('[data-event-generation-ledger]')).toBeVisible();
  await expect(page.locator('[data-event-generation-row]')).toHaveCount(2);
  await expect(page.locator('[data-event-timing-bracket]')).toBeVisible();
  await expect(page.locator('[data-event-timing-bracket-row]')).toHaveCount(2);
});

test('both Publication Pairs retain complete static teaching output without JavaScript', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium no-script context covers the static contract.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const route of [
    '/visuals/warp-divergence/',
    '/en/visuals/warp-divergence/',
    '/visuals/stream-event-dependencies/',
    '/en/visuals/stream-event-dependencies/',
  ]) {
    await page.goto(`http://127.0.0.1:4321${route}`);
    await expect(page.locator('[data-visual-controls]')).toBeHidden();
    await expect(page.locator('[data-interactive-workbench]')).toBeHidden();
    await expect(page.locator('[data-static-fallback]')).toBeVisible();
    await expect(page.locator('[data-no-evidence]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.goto('http://127.0.0.1:4321/en/visuals/warp-divergence/');
  await expect(page.locator('[data-static-case="lower-half"] tbody tr')).toHaveCount(32);
  await expect(page.locator('[data-static-case="uniform-true"] tbody tr')).toHaveCount(32);
  await page.goto('http://127.0.0.1:4321/en/visuals/stream-event-dependencies/');
  await expect(page.locator('[data-static-operation]')).toHaveCount(5);
  await expect(page.locator('[data-static-trace-frame]')).toHaveCount(6);
  await expect(page.locator('[data-event-generation-ledger]')).toBeVisible();
  await expect(page.locator('[data-event-generation-row]')).toHaveCount(2);
  await expect(page.locator('[data-event-timing-bracket]')).toBeVisible();
  await expect(page.locator('[data-event-timing-bracket-row]')).toHaveCount(2);
  await context.close();
});
