// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

test('A12 and A13 render the same bilingual sparse fixture and empty evidence metadata', async ({ page }) => {
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');
  for (const { route, view } of [
    { route: '/algorithms/sparse-formats-spmv/', view: 'formats' },
    { route: '/en/algorithms/sparse-formats-spmv/', view: 'formats' },
    { route: '/algorithms/sparse-matrix-multiplication-preprocessing/', view: 'spmm' },
    { route: '/en/algorithms/sparse-matrix-multiplication-preprocessing/', view: 'spmm' },
  ]) {
    await page.goto(route);
    const fixture = page.locator(`[data-sparse-fixture="a12-a13-4x5"][data-view="${view}"]`);
    await expect(fixture).toBeVisible();
    await expect(fixture.locator('figcaption')).toBeVisible();
    await expect(fixture.locator('table[data-matrix="A"]')).toHaveCount(1);
    await expect(fixture.locator('table[data-matrix="A"] caption')).toContainText('4 x 5');
    await expect(fixture.locator('table[data-matrix="A"] td.is-nonzero')).toHaveCount(6);
    if (view === 'formats') {
      await expect(fixture.locator('[data-array="coo-row-indices"]')).toHaveText('[0, 0, 2, 2, 3, 3]');
      await expect(fixture.locator('[data-array="csr-row-offsets"]')).toHaveText('[0, 2, 2, 4, 6]');
      await expect(fixture.locator('[data-result="spmv"]')).toContainText('[1, 0, 19, 33]');
      await expect(fixture.locator('[data-storage]')).toHaveCount(3);
    } else {
      await expect(fixture.locator('table[data-matrix="B"]')).toHaveCount(1);
      await expect(fixture.locator('table[data-matrix="C"]')).toHaveCount(1);
      await expect(fixture.locator('[data-result="spmm"]')).toContainText('[[1, 8], [0, 0], [3, 14], [19, 3]]');
      await expect(fixture.locator('.sparse-pipeline li')).toHaveCount(5);
    }
    for (const name of [
      'cuda:evidence-compilation',
      'cuda:evidence-runtime',
      'cuda:expected-observations',
      'cuda:recorded-observations',
    ]) await expect(page.locator(`meta[name="${name}"]`)).toHaveAttribute('content', 'none');
    expect(failures, route).toEqual([]);
  }
});

test('the sparse fixture preserves keyboard focus, mobile reflow, forced colors, and print', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns media-feature emulation.');
  await page.setViewportSize({ width: 390, height: 844 });
  for (const { route, view } of [
    { route: '/algorithms/sparse-formats-spmv/', view: 'formats' },
    { route: '/en/algorithms/sparse-formats-spmv/', view: 'formats' },
    { route: '/algorithms/sparse-matrix-multiplication-preprocessing/', view: 'spmm' },
    { route: '/en/algorithms/sparse-matrix-multiplication-preprocessing/', view: 'spmm' },
  ]) {
    await page.emulateMedia({ media: 'screen', forcedColors: 'active' });
    await page.goto(route);
    const fixture = page.locator(`[data-sparse-fixture="a12-a13-4x5"][data-view="${view}"]`);
    const matrixRegion = fixture.locator('.sparse-table-scroll').first();
    await matrixRegion.focus();
    await expect(matrixRegion).toBeFocused();
    expect(await matrixRegion.evaluate((element) => getComputedStyle(element).outlineStyle), route).toBe('solid');
    expect(await fixture.locator('td.is-nonzero').first().evaluate((element) => getComputedStyle(element).borderTopStyle), route).toBe('solid');

    if (view === 'formats') {
      const layoutColumns = await fixture.locator('.sparse-matrix-layout > *').evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().x)));
      expect(new Set(layoutColumns).size, route).toBe(1);
      await expect(fixture.locator('[data-array="csr-row-offsets"]')).toBeVisible();
    } else {
      const pipelineColumns = await fixture.locator('.sparse-pipeline li').evaluateAll((items) =>
        items.map((item) => Math.round(item.getBoundingClientRect().x)));
      expect(new Set(pipelineColumns).size, route).toBe(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);

    await page.emulateMedia({ media: 'print', forcedColors: 'none' });
    expect(await fixture.evaluate((element) => getComputedStyle(element).breakInside), route).toBe('avoid');
    await expect(fixture.locator('table[data-matrix="A"]')).toBeVisible();
    await expect(fixture.locator(view === 'formats' ? '[data-result="spmv"]' : '[data-result="spmm"]')).toBeVisible();
  }
});
