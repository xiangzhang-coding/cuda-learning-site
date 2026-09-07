// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const evidenceNames = ['evidence-compilation', 'evidence-runtime', 'expected-observations', 'recorded-observations'];
const exercisePattern = /^(?:Exercise [123]:|\u7ec3\u4e60(?: [123]|[\u4e00\u4e8c\u4e09])\uff1a)/;
const solutionPattern = /^(?:Solution [123]:|\u89e3\u7b54(?: [123]|[\u4e00\u4e8c\u4e09])\uff1a)/;
const units = [
  {
    id: 'L10', slug: 'libraries/cudnn-graphs-and-plans', prerequisites: ['A07', 'L01', 'Q05'],
    related: 'L11', practice: 'PB-R4-011', sourceCount: '10', sourceVersions: 'backend-9.24.0,frontend-1.27.0',
    structure: 'outcome,prerequisites,history,semantics,lifecycle,heuristics,policy,workspace,candidate-table,caches,serialization,measurement,versions,evidence,retrieval,practice,sources',
    en: {
      exercises: ['Exercise 1: Describe the graph without choosing an engine', 'Exercise 2: Reject candidates without inventing a winner', 'Exercise 3: Design reuse and validation boundaries'],
      solutions: ['Solution 1: Trace coordinates and ownership', 'Solution 2: Keep every gate independent', 'Solution 3: Revalidate the artifact, then measure'],
      alternatives: 'Valid alternatives',
    },
    zh: {
      exercises: [
        '\u7ec3\u4e60 1\uff1a\u5148\u63cf\u8ff0\u56fe\uff0c\u4e0d\u6307\u5b9a\u5f15\u64ce',
        '\u7ec3\u4e60 2\uff1a\u62d2\u7edd\u5019\u9009\uff0c\u4e0d\u865a\u6784\u4f18\u80dc\u8005',
        '\u7ec3\u4e60 3\uff1a\u8bbe\u8ba1\u590d\u7528\u4e0e\u9a8c\u8bc1\u8fb9\u754c',
      ],
      solutions: [
        '\u89e3\u7b54 1\uff1a\u8ffd\u8e2a\u5750\u6807\u4e0e\u6240\u6709\u6743',
        '\u89e3\u7b54 2\uff1a\u8ba9\u6bcf\u9053\u95e8\u69db\u4fdd\u6301\u72ec\u7acb',
        '\u89e3\u7b54 3\uff1a\u91cd\u65b0\u6838\u9a8c\u4ea7\u7269\uff0c\u518d\u505a\u6d4b\u91cf',
      ],
      alternatives: '\u5408\u6cd5\u66ff\u4ee3',
    },
  },
  {
    id: 'L11', slug: 'libraries/attention-backend-dispatch', prerequisites: ['A11', 'L10', 'L08'],
    related: 'VIS18', practice: 'PB-R4-012', sourceCount: '2', sourceVersions: '9.24.0,1.27.0',
    structure: 'outcome,prerequisites,history,contract,descriptors,representations,plans,dispatch,known-issues,visual-explainer,numerical-policy,fallback,evidence,retrieval,practice,sources',
    en: {
      exercises: ['Exercise 1: A descriptor can fit and still be wrong', 'Exercise 2: Classify rejection without changing the reference', 'Exercise 3: Audit a dispatch story against its sources'],
      solutions: ['Solution 1: Correct extent does not prove correct mapping', 'Solution 2: Reject candidates, not the mathematical target', 'Solution 3: A source contract is not an observed dispatcher'],
      alternatives: 'Valid alternatives',
    },
    zh: {
      exercises: [
        '\u7ec3\u4e60\u4e00\uff1a\u6ca1\u6709\u8d8a\u754c\u7684\u63cf\u8ff0\u7b26\u4e5f\u53ef\u80fd\u9519\u8bef',
        '\u7ec3\u4e60\u4e8c\uff1a\u5206\u7c7b\u62d2\u7edd\uff0c\u4f46\u4e0d\u6539\u53d8\u53c2\u8003',
        '\u7ec3\u4e60\u4e09\uff1a\u5bf9\u7167\u6765\u6e90\u5ba1\u8ba1\u5206\u6d3e\u53d9\u8ff0',
      ],
      solutions: [
        '\u89e3\u7b54\u4e00\uff1a\u8303\u56f4\u6b63\u786e\u4e0d\u8bc1\u660e\u6620\u5c04\u6b63\u786e',
        '\u89e3\u7b54\u4e8c\uff1a\u62d2\u7edd\u5019\u9009\uff0c\u4e0d\u6539\u53d8\u6570\u5b66\u76ee\u6807',
        '\u89e3\u7b54\u4e09\uff1a\u6e90\u7801\u5951\u7ea6\u4e0d\u662f\u5df2\u89c2\u5bdf\u7684\u5206\u6d3e\u5668',
      ],
      alternatives: '\u5408\u7406\u66ff\u4ee3\u65b9\u6848',
    },
  },
];
const publications = units.flatMap((unit) => [
  {
    id: unit.id, slug: unit.slug, prerequisites: unit.prerequisites, kind: 'learning-unit',
    structure: unit.structure,
    metadata: { 'related-units': unit.related, 'source-count': unit.sourceCount, 'source-versions': unit.sourceVersions },
  },
  ...['exercises', 'solutions'].map((suffix) => ({
    id: `${unit.id}-${suffix.toUpperCase()}`, slug: `${unit.slug}/${suffix}`,
    prerequisites: [suffix === 'exercises' ? unit.id : `${unit.id}-EXERCISES`],
    kind: suffix === 'exercises' ? 'exercise-set' : 'solution-set',
    structure: suffix === 'exercises' ? 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next'
      : 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors',
    metadata: unit.id === 'L11' ? { 'source-count': unit.sourceCount, 'source-versions': unit.sourceVersions } : {},
  })),
]);

async function expectNeutralEvidence(page: Page) {
  for (const name of evidenceNames) await expect(page.locator(`meta[name="cuda:${name}"]`)).toHaveAttribute('content', 'none');
}

async function expectNarrowTables(page: Page, mobile: boolean) {
  const tables = page.locator('main table');
  expect(await tables.count()).toBeGreaterThan(0);
  for (const table of await tables.all()) {
    await expect(table).toBeVisible();
    await expect(table).toHaveAttribute('tabindex', '0');
    expect(await table.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto');
    if (!mobile) {
      await table.focus();
      await expect(table).toBeFocused();
      if (await table.evaluate((element) => element.scrollWidth > element.clientWidth + 1)) {
        const before = await table.evaluate((element) => element.scrollLeft);
        // WebKit can produce no native scroll when keyup immediately follows keydown.
        await table.press('ArrowRight', { delay: 100 });
        await expect.poll(() => table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(before);
      }
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function expectStaticAttention(visual: Locator) {
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  await expect(visual.locator('[data-static-fallback]')).toBeVisible();
  await expect(visual.locator('svg[data-static-diagram]')).toBeVisible();
  await expect(visual.locator('[data-static-ledger]')).toHaveCount(4);
  const defaultRow = visual.locator('[data-static-ledger="8x4:4x4"]');
  await expect(defaultRow.getByRole('cell').nth(4)).toHaveText('2048');
  await expect(defaultRow.getByRole('cell').nth(5)).toHaveText('768');
  await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
}

for (const publication of publications) {
  test(`${publication.id} preserves neutral metadata, source links, and both direct locale links`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    expect((await page.goto(`/${publication.slug}/`))?.ok()).toBe(true);
    for (const locale of ['', 'en/']) {
      const route = `/${locale}${publication.slug}/`;
      const counterpart = `/${locale ? '' : 'en/'}${publication.slug}/`;
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(`${baseURL}${route}`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'en' : 'zh-CN');
      await expect(page.locator('main h1')).toContainText(publication.id.split('-')[0]);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${canonicalOrigin}${route}`);
      for (const [name, value] of Object.entries({
        'pair-id': publication.id.toLowerCase(), 'unit-id': publication.id, counterpart,
        'resource-kind': publication.kind, prerequisites: publication.prerequisites.join(','), structure: publication.structure,
        'fact-check-date': '2026-09-07', license: 'CC-BY-4.0', provenance: 'original', 'hardware-gate': 'none',
        ...publication.metadata,
      })) await expect(page.locator(`meta[name="cuda:${name}"]`), route).toHaveAttribute('content', value);
      await expectNeutralEvidence(page);
      for (const source of ['src-cuda-071', 'src-cuda-072']) {
        await expect(page.locator(`main a[href="/${locale}sources-and-versions/#${source}"]`).first()).toBeVisible();
      }
      const link = page.locator('[data-locale-counterpart]');
      await expect(link).toHaveAttribute('href', counterpart);
      await expect(link).toHaveAttribute('lang', locale ? 'zh-CN' : 'en');
      await link.click();
      await expect(page).toHaveURL(`${baseURL}${counterpart}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'zh-CN' : 'en');
    }
    expect(failures).toEqual([]);
  });
}

for (const locale of ['', 'en/']) {
  for (const unit of units) {
    test(`${locale || 'zh-CN/'}${unit.id} 360px sidebar, tables, layered hints, solutions, and Practice Bank journey`, async ({ page, baseURL }, testInfo) => {
      const failures = collectBrowserFailures(page, baseURL!);
      const mobile = testInfo.project.name === 'mobile-safari';
      const headings = locale ? unit.en : unit.zh;
      const route = `/${locale}${unit.slug}/`;
      const practiceRoute = `/${locale}practice/#${unit.practice.toLowerCase()}`;
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${locale}libraries/library-primitive-dsl-custom-kernel/`);
      await page.waitForLoadState('networkidle');
      await page.getByRole('button', { name: locale ? 'Menu' : '\u83dc\u5355', exact: true }).click();
      await page.locator(`nav a[href="${route}"]`).click();
      await expect(page).toHaveURL(`${baseURL}${route}`);
      await page.waitForLoadState('networkidle');
      await expectNarrowTables(page, mobile);
      await expect(page.locator(`main a[href="${practiceRoute}"]`).first()).toBeVisible();
      await page.locator(`main a[href="${route}exercises/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${route}exercises/`);
      await page.waitForLoadState('networkidle');
      await expectNarrowTables(page, mobile);
      const exercises = page.getByRole('heading', { level: 2, name: exercisePattern });
      await expect(exercises).toHaveText(headings.exercises);
      await expect(page.getByRole('heading', { level: 2, name: solutionPattern })).toHaveCount(0);
      await expect(page.locator(`main a[href="${practiceRoute}"]`).first()).toBeVisible();
      const hints = page.locator('main details');
      await expect(hints).toHaveCount(6);
      // Associate each pair with its Exercise, not just the total number of disclosures.
      expect(await hints.evaluateAll((elements) => elements.map((element) =>
        Array.from(element.closest('main')!.querySelectorAll('h2'))
          .filter((heading) => heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
          .at(-1)?.textContent,
      ))).toEqual((await exercises.allTextContents()).flatMap((heading) => [heading, heading]));
      await expect(hints.locator('summary')).toHaveText(Array.from({ length: 3 }, () => [
        /^(?:Hint 1:|\u63d0\u793a(?: 1|\u4e00)\uff1a)/, /^(?:Hint 2:|\u63d0\u793a(?: 2|\u4e8c)\uff1a)/,
      ]).flat());
      await expect(page.locator('main details[open]')).toHaveCount(0);
      for (const hint of await hints.all()) {
        const summary = hint.locator('summary');
        if (mobile) await summary.tap();
        else await summary.press('Enter');
        await expect(hint).toHaveJSProperty('open', true);
        await expect(page.locator('main details[open]')).toHaveCount(1);
        expect((await hint.innerText()).replace(await summary.innerText(), '').trim()).not.toBe('');
        if (mobile) await summary.tap();
        else await summary.press('Space');
        await expect(hint).toHaveJSProperty('open', false);
      }
      await page.locator(`main a[href="${route}solutions/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${route}solutions/`);
      await page.waitForLoadState('networkidle');
      await expectNarrowTables(page, mobile);
      await expect(page.getByRole('heading', { level: 2, name: solutionPattern })).toHaveText(headings.solutions);
      await expect(page.getByRole('heading', { level: 2, name: headings.alternatives, exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: locale ? 'Common errors' : '\u5e38\u89c1\u9519\u8bef', exact: true })).toBeVisible();
      await expect(page.locator('main details')).toHaveCount(0);
      await page.locator(`main a[href="${practiceRoute}"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${practiceRoute}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`[id="${unit.practice.toLowerCase()}"]`)).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 2, name: new RegExp(`^${unit.practice}[:\\uff1a]`) })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(failures).toEqual([]);
    });
  }

  test(`${locale || 'zh-CN/'}L11 reaches standalone VIS18, changes three controls, resets, and prints its static ledger`, async ({ page, baseURL }, testInfo) => {
    const failures = collectBrowserFailures(page, baseURL!);
    const mobile = testInfo.project.name === 'mobile-safari';
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/${locale}libraries/attention-backend-dispatch/`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-visual-id="VIS18"]')).toHaveCount(0);
    await page.locator(`main a[href="/${locale}visuals/attention-memory-traffic/"]`).first().click();
    await expect(page).toHaveURL(`${baseURL}/${locale}visuals/attention-memory-traffic/`);
    const visual = page.locator('cuda-attention-io-explorer[data-visual-id="VIS18"]');
    await expect(visual).toHaveAttribute('data-ready', 'true');
    const sequence = visual.locator('[data-attention-sequence-shape]');
    const tile = visual.locator('[data-attention-tile-shape]');
    const stage = visual.locator('[data-attention-stage-select]');
    await expect(visual.getByRole('combobox')).toHaveCount(3);
    if (!mobile) {
      await sequence.focus();
      await page.keyboard.press('Tab');
      await expect(tile).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(stage).toBeFocused();
    }
    await sequence.selectOption('16x8');
    await tile.selectOption('8x8');
    await stage.selectOption('normalize');
    await expect(visual).toHaveAttribute('data-sequence-shape', '16x8');
    await expect(visual).toHaveAttribute('data-tile-shape', '8x8');
    await expect(visual).toHaveAttribute('data-attention-stage', 'normalize');
    await expect(visual.locator('[data-live-materialized-total]')).toHaveText('8192 B');
    await expect(visual.locator('[data-live-materialized-total-elements]')).toHaveText('2048 elements');
    await expect(visual.locator('[data-live-tiled-total]')).toHaveText('3072 B');
    await expect(visual.locator('[data-live-tiled-total-elements]')).toHaveText('768 elements');
    await expect(visual.locator('[data-live-materialized-stage-bytes]')).toHaveText('4096 B');
    await expect(visual.locator('[data-live-tiled-stage-bytes]')).toHaveText('0 B');
    await expect(visual.locator('[data-live-stage="normalize"]')).toHaveAttribute('aria-current', 'step');
    await expect(visual.locator('[data-attention-status]')).toHaveAttribute('aria-live', 'polite');
    const reset = visual.locator('[data-attention-action="reset"]');
    if (mobile) await reset.tap();
    else {
      await reset.press('Enter');
      await expect(sequence).toBeFocused();
    }
    await expect(sequence).toHaveValue('8x4');
    await expect(tile).toHaveValue('4x4');
    await expect(stage).toHaveValue('score');
    await expect(visual.locator('[data-live-materialized-total]')).toHaveText('2048 B');
    await expect(visual.locator('[data-live-materialized-total-elements]')).toHaveText('512 elements');
    await expect(visual.locator('[data-live-tiled-total]')).toHaveText('768 B');
    await expect(visual.locator('[data-live-tiled-total-elements]')).toHaveText('192 elements');
    await expectNeutralEvidence(page);
    await expect(visual.locator('[data-measured], [data-timing], [data-speedup], [data-backend]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    await expectStaticAttention(visual);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.waitForLoadState('networkidle');
    expect(failures).toEqual([]);
  });

  test(`@accessibility ${locale || 'zh-CN/'}L10/L11 units and Exercises with open hints have no tagged axe violations`, async ({ page, baseURL }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
    test.setTimeout(120_000);
    const failures = collectBrowserFailures(page, baseURL!);
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const unit of units) {
      for (const suffix of ['', 'exercises/']) {
        const route = `/${locale}${unit.slug}/${suffix}`;
        expect((await page.goto(route))?.ok()).toBe(true);
        await page.waitForLoadState('networkidle');
        if (suffix) {
          const hints = page.locator('main details');
          await expect(hints).toHaveCount(6);
          await expect(page.locator('main details[open]')).toHaveCount(0);
          for (const hint of await hints.all()) await hint.locator('summary').press('Enter');
          await expect(page.locator('main details[open]')).toHaveCount(6);
        }
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })), route).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
      }
    }
    expect(failures).toEqual([]);
  });
}

test.describe('L11 reuses VIS18 without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const locale of ['', 'en/']) {
    test(`${locale || 'zh-CN/'}the unit link reaches the static attention diagram and ledger`, async ({ page, baseURL }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium', 'Chromium owns the no-script reuse journey.');
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      expect((await page.goto(`/${locale}libraries/attention-backend-dispatch/`))?.ok()).toBe(true);
      await page.locator(`main a[href="/${locale}visuals/attention-memory-traffic/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}/${locale}visuals/attention-memory-traffic/`);
      const visual = page.locator('cuda-attention-io-explorer[data-visual-id="VIS18"]');
      await expect(visual).not.toHaveAttribute('data-ready', 'true');
      await expectStaticAttention(visual);
      await expectNeutralEvidence(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.waitForLoadState('networkidle');
      expect(failures).toEqual([]);
    });
  }
});
