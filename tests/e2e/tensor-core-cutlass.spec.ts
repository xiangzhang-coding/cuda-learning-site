// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const cutlassCommit = 'dcf215af68a2d08d305076c152a06f201728cd53';
const levels = ['matrix', 'tile', 'threadblock', 'warp', 'instruction'];
const evidenceNames = ['evidence-compilation', 'evidence-runtime', 'expected-observations', 'recorded-observations'];
const units = [
  {
    id: 'L08', slug: 'libraries/tensor-core-precision-contracts', prerequisites: ['Q02', 'L06', 'F06'],
    practice: 'PB-R4-009', source: 'SRC-CUDA-069', relatedUnits: ['L09', 'VIS12'],
    sourceCount: '6', sourceVersions: '13.3,12.9.2',
    structure: 'outcome,prerequisites,history,numerical-chain,wmma-contract,architecture,rounding,safety,validation,alternative,evidence,retrieval,practice,sources',
  },
  {
    id: 'L09', slug: 'libraries/cutlass-cpp-gemm-structure', prerequisites: ['A08', 'L06', 'M17'],
    practice: 'PB-R4-010', source: 'SRC-CUDA-070', relatedUnits: ['L08', 'VIS12'],
    sourceCount: '7', sourceVersions: '4.7.0,11.8.0,12.9.2,13.3.1',
    structure: 'outcome,prerequisites,history,hierarchy,layouts,tile-reasoning,pipeline,collectives,toolchain,tests,known-issues,alternative,evidence,retrieval,practice,sources',
  },
];
const publications = units.flatMap((unit) => [
  {
    id: unit.id, slug: unit.slug, prerequisites: unit.prerequisites, kind: 'learning-unit', source: unit.source,
    metadata: {
      structure: unit.structure, 'related-units': unit.relatedUnits.join(','),
      'source-count': unit.sourceCount, 'source-versions': unit.sourceVersions,
    },
  },
  {
    id: `${unit.id}-EXERCISES`, slug: `${unit.slug}/exercises`, prerequisites: [unit.id],
    kind: 'exercise-set', source: unit.source,
    metadata: { structure: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next' },
  },
  {
    id: `${unit.id}-SOLUTIONS`, slug: `${unit.slug}/solutions`, prerequisites: [`${unit.id}-EXERCISES`],
    kind: 'solution-set', source: unit.source,
    metadata: { structure: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors' },
  },
]);

async function expectScalarFallback(visual: Locator) {
  await expect(visual.locator('[data-visual-controls]')).toBeHidden();
  await expect(visual.locator('[data-live-workbench]')).toBeHidden();
  const fallback = visual.locator('[data-static-fallback]');
  await expect(fallback).toBeVisible();
  await expect(fallback.locator('[data-static-selection]')).toHaveCount(4);
  const panels = fallback.locator('[data-static-hierarchy-panel]');
  await expect(panels).toHaveCount(20);
  expect(await panels.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-hierarchy-level'))))
    .toEqual(Array.from({ length: 4 }, () => levels).flat());
  for (const panel of await panels.all()) await expect(panel).toBeVisible();
  const instructions = fallback.locator('[data-static-hierarchy-panel][data-hierarchy-level="instruction"]');
  await expect(instructions).toHaveCount(4);
  for (const instruction of await instructions.all()) {
    for (const axis of ['m', 'n', 'k']) await expect(instruction).toHaveAttribute(`data-shape-${axis}`, '1');
    await expect(instruction).toContainText('source-level operation slot');
    await expect(instruction).toContainText(/Compiler-emitted FMA.*MMA.*SASS.*execution.*unknown/);
  }
}

for (const publication of publications) {
  test(`${publication.id} preserves exact publication metadata through both locale links`, async ({ page, baseURL }) => {
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
        'pair-id': publication.id.toLowerCase(), 'unit-id': publication.id,
        counterpart, 'resource-kind': publication.kind, prerequisites: publication.prerequisites.join(','),
        'fact-check-date': '2026-09-07', license: 'CC-BY-4.0', provenance: 'original', 'hardware-gate': 'none',
        ...Object.fromEntries(evidenceNames.map((name) => [name, 'none'])),
        ...publication.metadata,
      })) {
        await expect(page.locator(`meta[name="cuda:${name}"]`), route).toHaveAttribute('content', value);
      }
      await expect(page.locator(`main a[href="/${locale}sources-and-versions/#${publication.source.toLowerCase()}"]`).first())
        .toBeVisible();
      const link = page.locator('[data-locale-counterpart]');
      await expect(link).toHaveAttribute('href', counterpart);
      await expect(link).toHaveAttribute('lang', locale ? 'zh-CN' : 'en');
      await link.click();
      await expect(page).toHaveURL(`${baseURL}${counterpart}`);
      await expect(page.locator('html')).toHaveAttribute('lang', locale ? 'zh-CN' : 'en');
      await page.waitForLoadState('networkidle');
    }
    expect(failures).toEqual([]);
  });
}

for (const locale of ['', 'en/']) {
  for (const unit of units) {
    test(`${locale || 'zh-CN/'}${unit.id} sidebar reaches three Exercises, layered hints, separate solutions, and its own practice entry`, async ({ page, baseURL }, testInfo) => {
      const failures = collectBrowserFailures(page, baseURL!);
      const route = `/${locale}${unit.slug}/`;
      const practiceRoute = `/${locale}practice/#${unit.practice.toLowerCase()}`;
      await page.goto(`/${locale}libraries/library-primitive-dsl-custom-kernel/`);
      await page.waitForLoadState('networkidle');
      if (testInfo.project.name === 'mobile-safari') {
        await page.getByRole('button', { name: locale ? 'Menu' : '\u83dc\u5355', exact: true }).click();
      }
      await page.locator(`nav a[href="${route}"]`).click();
      await expect(page).toHaveURL(`${baseURL}${route}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('link', { name: unit.practice, exact: true })).toHaveAttribute('href', practiceRoute);
      await page.locator(`main a[href="${route}exercises/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${route}exercises/`);
      await page.waitForLoadState('networkidle');
      const exercises = page.getByRole('heading', { level: 2, name: /^(?:Exercise [123]:|\u7ec3\u4e60[\u4e00\u4e8c\u4e09])/ });
      await expect(exercises).toHaveCount(3);
      await expect(page.getByRole('heading', { level: 2, name: /^(?:Solution [123]:|\u89e3\u7b54[\u4e00\u4e8c\u4e09])/ })).toHaveCount(0);
      await expect(page.getByRole('link', { name: unit.practice, exact: true })).toHaveAttribute('href', practiceRoute);

      const hints = page.locator('main details');
      await expect(hints).toHaveCount(6);
      // Six hints must belong two apiece to the three Exercises, not merely exist somewhere on the page.
      expect(await hints.evaluateAll((elements) => elements.map((element) =>
        Array.from(element.closest('main')!.querySelectorAll('h2'))
          .filter((heading) => heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)
          .at(-1)?.textContent,
      ))).toEqual((await exercises.allTextContents()).flatMap((heading) => [heading, heading]));
      await expect(hints.locator('summary')).toHaveText(Array.from({ length: 3 }, () => [
        /^(?:Hint 1:|\u63d0\u793a\u4e00\uff1a)/, /^(?:Hint 2:|\u63d0\u793a\u4e8c\uff1a)/,
      ]).flat());
      await expect(page.locator('main details[open]')).toHaveCount(0);
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
        await expect(page.locator('main details[open]')).toHaveCount(1);
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
      await expect(page.getByRole('link', { name: unit.practice, exact: true })).toHaveAttribute('href', practiceRoute);
      await page.locator(`main a[href="${route}exercises/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}${route}exercises/`);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main details[open]')).toHaveCount(0);
      await page.getByRole('link', { name: unit.practice, exact: true }).click();
      await expect(page).toHaveURL(`${baseURL}${practiceRoute}`);
      // WebKit can reach networkidle before parsing the Practice Bank's final anchors.
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator(`[id="${unit.practice.toLowerCase()}"]`)).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 2, name: new RegExp(`^${unit.practice}[:\\uff1a]`) })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(failures).toEqual([]);
    });

    test(`${locale || 'zh-CN/'}${unit.id} precision or hierarchy tables fit a narrow viewport and link to unchanged scalar VIS12`, async ({ page, baseURL }, testInfo) => {
      const failures = collectBrowserFailures(page, baseURL!);
      const route = `/${locale}${unit.slug}/`;
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect((await page.goto(route))?.ok()).toBe(true);
      await page.waitForLoadState('networkidle');
      if (unit.id === 'L08') {
        const chain = page.getByRole('table').filter({ has: page.getByRole('columnheader', {
          name: locale ? 'Point on the data path' : '\u6570\u636e\u7ecf\u8fc7\u7684\u4f4d\u7f6e', exact: true,
        }) });
        await expect(chain.locator('tbody tr td:first-child')).toHaveText(locale ? [
          'Original application inputs', 'A/B storage and multiplicands', 'Accumulation', 'Epilogue computation', 'D storage',
        ] : [
          '\u5e94\u7528\u539f\u59cb\u8f93\u5165', 'A/B \u5b58\u50a8\u4e0e\u4e58\u6cd5\u8f93\u5165', '\u7d2f\u52a0', '\u6536\u5c3e\u8ba1\u7b97', 'D \u5b58\u50a8',
        ]);
        const precision = page.getByRole('table').filter({ has: page.getByRole('columnheader', {
          name: locale ? 'Minimum API/PTX target' : 'API/PTX \u6700\u4f4e\u76ee\u6807', exact: true,
        }) });
        await expect(precision.locator('tbody tr')).toHaveCount(5);
        for (const [type, inputs, accumulators, tiles, target] of [
          ['FP16', ['__half'], ['float', '__half'], ['16x16x16', '32x8x16', '8x32x16'], 'sm_70'],
          ['BF16', ['__nv_bfloat16'], ['float'], ['16x16x16', '32x8x16', '8x32x16'], 'sm_80'],
          ['TF32', ['nvcuda::wmma::precision::tf32'], ['float'], ['16x16x8'], 'sm_80'],
          ['FP64', ['double'], ['double'], ['8x8x4'], 'sm_80'],
          ['INT8', ['signed char', 'unsigned char'], ['int'], ['16x16x16', '32x8x16', '8x32x16'], 'sm_72'],
        ] as const) {
          const cells = precision.getByRole('row').filter({ has: page.getByRole('cell', { name: type, exact: true }) }).getByRole('cell');
          await expect(cells).toHaveCount(5);
          await expect(cells.nth(1).locator('code')).toHaveText([...inputs]);
          await expect(cells.nth(2).locator('code')).toHaveText([...accumulators]);
          await expect(cells.nth(3).locator('code')).toHaveText([...tiles]);
          await expect(cells.nth(4)).toHaveText(target);
        }
        const hardware = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: /2026-09-07/ }) });
        await expect(hardware.locator('tbody tr')).toHaveCount(3);
        await expect(hardware.locator('tbody tr').nth(2).locator('td').first().locator('strong'))
          .toHaveText(locale ? '8.0, 9.0, 10.0' : '8.0\u30019.0\u300110.0');
        const spacing = page.getByRole('table').filter({ has: page.getByRole('columnheader', { name: /epsilon/ }) });
        await expect(spacing.locator('tbody tr td:first-child')).toHaveText(['FP16', 'BF16', 'FP32', 'FP64']);
        await expect(spacing.locator('tbody tr td:nth-child(2) code')).toHaveText(['2^-10', '2^-7', '2^-23', '2^-52']);
      } else {
        const hierarchy = page.getByRole('table').filter({ has: page.getByRole('columnheader', {
          name: locale ? 'Level' : '\u5c42\u6b21', exact: true,
        }) });
        await expect(hierarchy.locator('tbody tr td:first-child')).toContainText([/Device/, /Kernel/, /Threadblock/, /Warp/, /Instruction/]);
        const coordinates = [
          'gemm/device/gemm.h#L175-L284', 'gemm/kernel/gemm.h#L203-L351',
          'gemm/threadblock/mma_pipelined.h#L219-L277', 'gemm/warp/mma_tensor_op.h#L167-L206', 'arch/mma_sm75.h#L142-L200',
        ];
        const links = hierarchy.locator('tbody tr td:last-child a');
        await expect(links).toHaveCount(coordinates.length);
        for (const [index, coordinate] of coordinates.entries()) {
          await expect(links.nth(index)).toHaveAttribute('href', `https://github.com/NVIDIA/cutlass/blob/${cutlassCommit}/include/cutlass/${coordinate}`);
        }
        const geometry = page.getByRole('table').filter({ has: page.getByRole('columnheader', {
          name: locale ? 'Derivation' : '\u63a8\u5bfc', exact: true,
        }) });
        await expect(geometry.locator('tbody tr')).toHaveCount(6);
        await expect(geometry.locator('tbody tr td:nth-child(2) code')).toHaveText([
          'ceil(150/64)*ceil(90/64)=3*2=6', 'ceil(40/16)=3', '(64/32)*(64/32)=4',
          '(128,64)', '22x26', 'k=32..39', '(32/16)*(32/8)*(16/8)=16',
        ]);
        const pipeline = page.getByRole('table').filter({ has: page.getByRole('columnheader', {
          name: locale ? 'Slot contents' : '\u69fd\u4f4d\u5185\u5bb9', exact: true,
        }) });
        await expect(pipeline.locator('tbody tr td:nth-child(2) code')).toHaveText(['k=0..15', 'k=16..31', 'k=32..39']);
      }

      const tables = page.locator('main table');
      await expect(tables).toHaveCount(unit.id === 'L08' ? 4 : 6);
      for (const table of await tables.all()) {
        await expect(table).toBeVisible();
        await expect(table).toHaveAttribute('tabindex', '0');
        expect(await table.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto');
        if (testInfo.project.name !== 'mobile-safari') {
          await table.focus();
          await expect(table).toBeFocused();
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
      }
      expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
      expect(await page.locator('html').evaluate((element) => getComputedStyle(element).scrollBehavior)).toBe('auto');

      const visualLink = page.getByRole('link', { name: 'VIS12', exact: true }).first();
      await expect(visualLink).toHaveAttribute('href', `/${locale}visuals/gemm-tiling-hierarchy/`);
      await visualLink.click();
      await expect(page).toHaveURL(`${baseURL}/${locale}visuals/gemm-tiling-hierarchy/`);
      const visual = page.locator('[data-visual-id="VIS12"]');
      await expect(visual).toHaveAttribute('data-ready', 'true');
      const matrix = visual.locator('[data-gemm-matrix-shape]');
      const tile = visual.locator('[data-gemm-tile-shape]');
      const level = visual.locator('[data-gemm-hierarchy-level]');
      await expect(visual.getByRole('combobox')).toHaveCount(3);
      await expect(matrix.locator('option')).toHaveText(['128x128x32', '256x128x64']);
      await expect(tile.locator('option')).toHaveText(['64x64x16', '128x64x16']);
      expect(await level.locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value)))
        .toEqual(levels);
      if (testInfo.project.name !== 'mobile-safari') {
        await matrix.focus();
        await page.keyboard.press('Tab');
        await expect(tile).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(level).toBeFocused();
      }
      await matrix.selectOption('256x128x64');
      await tile.selectOption('128x64x16');
      await level.selectOption('instruction');
      await expect(visual).toHaveAttribute('data-matrix-shape', '256x128x64');
      await expect(visual).toHaveAttribute('data-tile-shape', '128x64x16');
      await expect(visual).toHaveAttribute('data-output-tile-count', '4');
      await expect(visual).toHaveAttribute('data-k-slice-count', '4');
      await expect(visual).toHaveAttribute('data-warps-per-threadblock', '8');
      await expect(visual.locator('[data-live-operation-slots]')).toHaveText('16384');
      const instruction = visual.locator('[data-live-hierarchy-panel][data-hierarchy-level="instruction"]');
      await expect(instruction).toBeVisible();
      for (const axis of ['m', 'n', 'k']) await expect(instruction).toHaveAttribute(`data-shape-${axis}`, '1');
      await expect(instruction.locator('[data-live-owner]')).toHaveText('source-level operation slot');
      await expect(instruction.locator('[data-live-boundary]')).toHaveText(/Compiler-emitted FMA.*MMA.*SASS.*execution.*unknown/);
      await expect(visual.locator('[data-gemm-status]')).toHaveAttribute('aria-live', 'polite');
      await expect(visual.locator('[data-gemm-status]')).toContainText('Instruction');
      const selected = visual.locator('[data-live-level="instruction"]');
      await expect(selected).toHaveAttribute('aria-current', 'true');
      expect(await selected.evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)))
        .toBeLessThanOrEqual(0.00001);
      await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
      for (const name of evidenceNames) await expect(page.locator(`meta[name="cuda:${name}"]`)).toHaveAttribute('content', 'none');
      await expect(page.locator('meta[name="cuda:prerequisites"]')).toHaveAttribute('content', 'A08');
      await expect(visual.locator('[data-measured], [data-timing], [data-throughput], [data-speedup], [data-emitted-instruction]')).toHaveCount(0);
      const reset = visual.locator('[data-gemm-action="reset"]');
      if (testInfo.project.name === 'mobile-safari') {
        await reset.click();
      } else {
        await reset.focus();
        await page.keyboard.press('Enter');
        await expect(matrix).toBeFocused();
      }
      await expect(matrix).toHaveValue('128x128x32');
      await expect(tile).toHaveValue('64x64x16');
      await expect(level).toHaveValue('matrix');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
      await expectScalarFallback(visual);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect(failures).toEqual([]);
    });
  }

  test(`@accessibility ${locale || 'zh-CN/'}L08/L09 tables and opened Exercise hints have no tagged axe violations`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Automated axe coverage is pinned to Chromium.');
    test.setTimeout(120_000);
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
          for (const hint of await hints.all()) {
            await expect(hint).toHaveJSProperty('open', false);
            await hint.locator('summary').focus();
            await page.keyboard.press('Enter');
            await expect(hint).toHaveJSProperty('open', true);
          }
          await expect(page.locator('main details[open]')).toHaveCount(6);
        } else {
          await expect(page.locator('main table')).toHaveCount(unit.id === 'L08' ? 4 : 6);
        }
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(results.violations.map(({ id, impact, nodes }) => ({
          id, impact, targets: nodes.map((node) => node.target),
        })), route).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
      }
    }
  });
}

test.describe('L08/L09 reuse VIS12 without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const locale of ['', 'en/']) {
    test(`${locale || 'zh-CN/'}both unit links reach complete static scalar panels`, async ({ page, baseURL }, testInfo) => {
      test.skip(testInfo.project.name !== 'chromium', 'Chromium owns the no-script fallback check.');
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const unit of units) {
        expect((await page.goto(`/${locale}${unit.slug}/`))?.ok()).toBe(true);
        const visualLink = page.getByRole('link', { name: 'VIS12', exact: true }).first();
        await expect(visualLink).toHaveAttribute('href', `/${locale}visuals/gemm-tiling-hierarchy/`);
        await visualLink.click();
        await expect(page).toHaveURL(`${baseURL}/${locale}visuals/gemm-tiling-hierarchy/`);
        const visual = page.locator('[data-visual-id="VIS12"]');
        await expect(visual).not.toHaveAttribute('data-ready', 'true');
        await expectScalarFallback(visual);
        await expect(visual).toHaveAttribute('data-evidence-status-effect', 'none');
        for (const name of evidenceNames) await expect(page.locator(`meta[name="cuda:${name}"]`)).toHaveAttribute('content', 'none');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      }
      expect(failures).toEqual([]);
    });
  }
});
