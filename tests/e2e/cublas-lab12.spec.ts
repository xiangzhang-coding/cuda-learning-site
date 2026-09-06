// SPDX-License-Identifier: Apache-2.0
import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { loadCanonicalExample, readCanonicalRange } from '../../scripts/lib/canonical-examples.mjs';
import { collectBrowserFailures } from '../helpers/browser-contract';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const canonicalRanges = ['cpu-reference', 'gemm-call', 'stream-lifecycle'];
const units = [
  { id: 'L06', slug: 'libraries/cublas-gemm', prerequisites: ['A08', 'Q01'], practice: 'PB-R4-007' },
  { id: 'L07', slug: 'libraries/cublaslt-matmul', prerequisites: ['L06', 'Q05'], practice: 'PB-R4-008' },
];
const subjects = [
  { id: 'EX18', slug: 'examples/cublas-gemm', kind: 'runnable-example', prerequisites: ['L06'] },
  { id: 'LAB12', slug: 'labs/compare-gemm-with-cublas', kind: 'lab', prerequisites: ['Q13', 'L06'] },
];
const publications = [
  ...units.flatMap(({ id, slug, prerequisites }) => [
    { id, slug, prerequisites, kind: 'learning-unit' },
    { id: `${id}-EXERCISES`, slug: `${slug}/exercises`, prerequisites: [id], kind: 'exercise-set' },
    { id: `${id}-SOLUTIONS`, slug: `${slug}/solutions`, prerequisites: [`${id}-EXERCISES`], kind: 'solution-set' },
  ]),
  ...subjects,
];

for (const publication of publications) {
  test(`${publication.id} preserves route metadata when following both locale links`, async ({ page, baseURL }) => {
    const failures = collectBrowserFailures(page, baseURL!);
    const requiresRuntime = publication.kind === 'runnable-example' || publication.kind === 'lab';
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
        'pair-id': publication.id.toLowerCase(),
        'unit-id': publication.id,
        'resource-kind': publication.kind,
        prerequisites: publication.prerequisites.join(','),
        'evidence-compilation': 'none',
        'evidence-runtime': requiresRuntime ? 'Pending Hardware Verification' : 'none',
        'expected-observations': requiresRuntime ? '3 declared expectations' : 'none',
        'recorded-observations': 'none',
      })) {
        await expect(page.locator(`meta[name="cuda:${name}"]`), route).toHaveAttribute('content', value);
      }
      const link = page.locator('[data-locale-counterpart]');
      await expect(link).toHaveAttribute('href', counterpart);
      await link.click();
      await expect(page).toHaveURL(`${baseURL}${counterpart}`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'zh-CN' : 'en');
    }
    expect(failures).toEqual([]);
  });
}

for (const locale of ['', 'en/']) {
  for (const unit of units) {
    test(`${locale || 'zh-CN/'}${unit.id} navigation leads to usable hints and separate solutions`, async ({ page, baseURL }, testInfo) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.goto(`/${locale}libraries/library-primitive-dsl-custom-kernel/`);
      await page.waitForLoadState('networkidle');
      if (testInfo.project.name === 'mobile-safari') {
        await page.getByRole('button', { name: locale ? 'Menu' : '\u83dc\u5355', exact: true }).click();
      }
      const route = `/${locale}${unit.slug}/`;
      await page.locator(`nav a[href="${route}"]`).click();
      await expect(page).toHaveURL(`${baseURL}${route}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator(`main a[href="/${locale}practice/#${unit.practice.toLowerCase()}"]`)).toBeVisible();
      await page.locator(`main a[href="${route}exercises/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${route}exercises/`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { level: 2, name: /^(?:Exercise [123]:|\u7ec3\u4e60[\u4e00\u4e8c\u4e09])/ })).toHaveCount(3);
      await expect(page.getByRole('heading', { level: 2, name: /^(?:Solution [123]:|\u89e3\u7b54[\u4e00\u4e8c\u4e09])/ })).toHaveCount(0);

      const hints = page.locator('main details');
      await expect(hints).toHaveCount(6);
      for (const hint of await hints.all()) {
        const summary = hint.locator('summary');
        await expect(hint).toHaveJSProperty('open', false);
        if (testInfo.project.name === 'mobile-safari') {
          await summary.click();
        } else {
          await summary.focus();
          await expect(summary).toBeFocused();
          await page.keyboard.press('Enter');
        }
        await expect(hint).toHaveJSProperty('open', true);
        expect((await hint.innerText()).replace(await summary.innerText(), '').trim()).not.toBe('');
        if (testInfo.project.name === 'mobile-safari') {
          await summary.click();
        } else {
          await page.keyboard.press('Space');
        }
        await expect(hint).toHaveJSProperty('open', false);
      }
      await page.locator(`main a[href="${route}solutions/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${route}solutions/`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', 'solution-set');
      await expect(page.getByRole('heading', { level: 2, name: /^(?:Solution [123]:|\u89e3\u7b54[\u4e00\u4e8c\u4e09])/ })).toHaveCount(3);
      await expect(page.locator('main details')).toHaveCount(0);
      await page.locator(`main a[href="${route}exercises/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${route}exercises/`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(failures).toEqual([]);
    });
  }

  for (const subject of subjects) {
    test(`${locale || 'zh-CN/'}${subject.id} exposes canonical source without reporting a GPU result`, async ({ page, baseURL }, testInfo) => {
      const failures = collectBrowserFailures(page, baseURL!);
      const example = await loadCanonicalExample(projectRoot, 'EX18');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const route = `/${locale}${subject.slug}/`;
      if (subject.id === 'LAB12') {
        await page.goto(`/${locale}labs/`);
        await page.waitForLoadState('networkidle');
        const card = page.locator('[data-resource-card][data-resource-id="LAB12"]');
        await expect(card.locator('h3 a')).toHaveAttribute('href', route);
        await card.locator('h3 a').click();
      } else {
        expect((await page.goto(route))?.ok()).toBe(true);
      }
      await expect(page).toHaveURL(`${baseURL}${route}`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('meta[name="cuda:canonical-example"]')).toHaveAttribute('content', 'EX18');
      await expect(page.locator('meta[name="cuda:canonical-ranges"]')).toHaveAttribute('content', canonicalRanges.join(','));
      await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'Pending Hardware Verification');
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      await expect(page.locator(`main a[href="${example.sourceUrl}"]`)).toBeVisible();
      await expect(page.locator(`main a[href="${example.downloadUrl}"]`)).toBeVisible();

      const figures = page.locator('[data-canonical-example]');
      await expect(figures).toHaveCount(canonicalRanges.length);
      for (const [index, range] of canonicalRanges.entries()) {
        const excerpt = await readCanonicalRange(projectRoot, 'EX18', range);
        const figure = figures.nth(index);
        await expect(figure).toHaveAttribute('data-canonical-example', 'EX18');
        await expect(figure).toHaveAttribute('data-canonical-range', range);
        await expect(figure).toHaveAttribute('data-canonical-file', excerpt.file);
        await expect(figure).toHaveAttribute('data-canonical-lines', `${excerpt.startLine}-${excerpt.endLine}`);
        expect(await figure.locator('pre code').textContent(), `${route}: ${range}`).toBe(excerpt.code);
        await expect(figure.locator('figcaption a')).toHaveAttribute(
          'href', `${example.sourceUrl.replace('/tree/', '/blob/')}/${excerpt.file}#L${excerpt.startLine}-L${excerpt.endLine}`,
        );
        await expect(figure.locator('pre')).toHaveAttribute('tabindex', '0');
      }
      if (testInfo.project.name !== 'mobile-safari') {
        await figures.first().locator('pre').focus();
        await expect(figures.first().locator('pre')).toBeFocused();
      }

      if (subject.id === 'LAB12') {
        const records = page.getByRole('table').filter({ has: page.getByRole('columnheader', {
          name: locale ? 'Current value' : '\u5f53\u524d\u503c', exact: true,
        }) });
        await expect(records).toBeVisible();
        await expect(records.locator('tbody tr td:last-child')).toHaveText(['[]', '[]', '[]', '[]']);
        const manifest = page.getByRole('table').filter({ has: page.getByRole('columnheader', {
          name: locale ? 'Initial value' : '\u521d\u59cb\u503c', exact: true,
        }) });
        await expect(manifest).toBeVisible();
        const cells = manifest.locator('tbody tr td:last-child');
        expect(await cells.count()).toBeGreaterThan(0);
        for (const cell of await cells.all()) await expect(cell).toHaveText('unfilled');
        await expect(records).toHaveAttribute('tabindex', '0');
        if (testInfo.project.name !== 'mobile-safari') {
          await records.focus();
          await expect(records).toBeFocused();
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);

      if (subject.id === 'LAB12') {
        const visualLink = page.getByRole('link', { name: 'VIS12', exact: true });
        await expect(visualLink).toHaveAttribute('href', `/${locale}visuals/gemm-tiling-hierarchy/`);
        await visualLink.click();
        await expect(page).toHaveURL(`${baseURL}/${locale}visuals/gemm-tiling-hierarchy/`);
        const visual = page.locator('[data-visual-id="VIS12"]');
        await expect(visual).toHaveAttribute('data-ready', 'true');
        await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
        const matrix = visual.locator('[data-gemm-matrix-shape]');
        const tile = visual.locator('[data-gemm-tile-shape]');
        const level = visual.locator('[data-gemm-hierarchy-level]');
        if (testInfo.project.name !== 'mobile-safari') {
          await matrix.focus();
          await page.keyboard.press('Tab');
          await expect(tile).toBeFocused();
          await page.keyboard.press('Tab');
          await expect(level).toBeFocused();
        }
        await level.selectOption('instruction');
        await expect(visual.locator('[data-live-hierarchy-panel][data-hierarchy-level="instruction"]')).toBeVisible();
        await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute('content', 'none');
        await page.emulateMedia({ media: 'print' });
        await expect(visual.locator('[data-static-fallback]')).toBeVisible();
        await expect(visual.locator('[data-live-workbench]')).toBeHidden();
      }
      expect(failures).toEqual([]);
    });
  }

  test(`@accessibility ${locale || 'zh-CN/'}cuBLAS opened hints, canonical source, and VIS12 have no tagged axe violations`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const slugs = [
      ...units.map(({ slug }) => `${slug}/exercises`),
      ...subjects.map(({ slug }) => slug),
      'visuals/gemm-tiling-hierarchy',
    ];
    for (const slug of slugs) {
      const route = `/${locale}${slug}/`;
      expect((await page.goto(route))?.ok()).toBe(true);
      await page.waitForLoadState('networkidle');
      for (const summary of await page.locator('main details > summary').all()) {
        await summary.focus();
        await page.keyboard.press('Enter');
      }
      if (slug.startsWith('visuals/')) {
        const visual = page.locator('[data-visual-id="VIS12"]');
        await expect(visual).toHaveAttribute('data-ready', 'true');
        await visual.locator('[data-gemm-hierarchy-level]').selectOption('instruction');
      }
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map(({ id, impact, nodes }) => ({
        id, impact, targets: nodes.map((node) => node.target),
      })), route).toEqual([]);
    }
  });
}

test.describe('LAB12 to VIS12 without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of ['', 'en/']) {
    test(`${locale || 'zh-CN/'}the Lab link reaches a readable static fallback`, async ({ page, baseURL }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium', 'Chromium owns the no-script fallback check.');
      await page.setViewportSize({ width: 390, height: 844 });
      expect((await page.goto(`/${locale}labs/compare-gemm-with-cublas/`))?.ok()).toBe(true);
      await page.getByRole('link', { name: 'VIS12', exact: true }).click();
      await expect(page).toHaveURL(`${baseURL}/${locale}visuals/gemm-tiling-hierarchy/`);
      const visual = page.locator('[data-visual-id="VIS12"]');
      await expect(visual.locator('[data-visual-controls]')).toBeHidden();
      await expect(visual.locator('[data-live-workbench]')).toBeHidden();
      const fallback = visual.locator('[data-static-fallback]');
      await expect(fallback).toBeVisible();
      await expect(fallback.locator('[data-static-hierarchy-panel]').first()).toBeVisible();
      expect((await fallback.innerText()).trim()).not.toBe('');
      await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
});
