// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures, expectRankedSearchResult } from '../helpers/browser-contract';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const sourceCommit = 'f018a694ec4f57a40e1374352e320ddd9c9511e0';

const routePairs = [
  {
    route: '/libraries/cub-device-primitives/',
    pairId: 'l03',
    unitId: 'L03',
    resourceKind: 'learning-unit',
    prerequisites: 'A02,A03,M07,L01',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
    tables: true,
  },
  {
    route: '/libraries/cub-device-primitives/exercises/',
    pairId: 'l03-exercises',
    unitId: 'L03-EXERCISES',
    resourceKind: 'exercise-set',
    prerequisites: 'L03',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
    tables: false,
    hints: true,
  },
  {
    route: '/libraries/cub-device-primitives/solutions/',
    pairId: 'l03-solutions',
    unitId: 'L03-SOLUTIONS',
    resourceKind: 'solution-set',
    prerequisites: 'L03-EXERCISES',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
    tables: false,
  },
  {
    route: '/libraries/cub-warp-block-primitives/',
    pairId: 'l04',
    unitId: 'L04',
    resourceKind: 'learning-unit',
    prerequisites: 'F02,M03,M05,A02,A03,L03',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
    tables: true,
  },
  {
    route: '/libraries/cub-warp-block-primitives/exercises/',
    pairId: 'l04-exercises',
    unitId: 'L04-EXERCISES',
    resourceKind: 'exercise-set',
    prerequisites: 'L04',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
    tables: false,
    hints: true,
  },
  {
    route: '/libraries/cub-warp-block-primitives/solutions/',
    pairId: 'l04-solutions',
    unitId: 'L04-SOLUTIONS',
    resourceKind: 'solution-set',
    prerequisites: 'L04-EXERCISES',
    runtimeEvidence: 'none',
    expectedObservations: 'none',
    tables: false,
  },
  {
    route: '/examples/cub-device-reduction-scan/',
    pairId: 'ex17',
    unitId: 'EX17',
    resourceKind: 'runnable-example',
    prerequisites: 'L03',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '3 declared expectations',
    tables: true,
    canonicalRanges: ['cpu-reference', 'device-reduce', 'device-scan'],
  },
  {
    route: '/labs/compare-custom-reduction-with-cub/',
    pairId: 'lab11',
    unitId: 'LAB11',
    resourceKind: 'lab',
    prerequisites: 'Q12,L03',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '10 declared expectations',
    tables: true,
    canonicalRanges: ['cpu-reference', 'device-reduce'],
  },
] as const;

const searchScenarios = [
  { route: '/', button: /搜索/, query: 'L03 DeviceReduce DeviceScan temporary storage', localePrefix: '/', expectedHrefs: ['/libraries/cub-device-primitives/'] },
  { route: '/', button: /搜索/, query: 'L04 WarpReduce BlockScan TempStorage', localePrefix: '/', expectedHrefs: ['/libraries/cub-warp-block-primitives/'] },
  { route: '/', button: /搜索/, query: 'EX17 CUB Device Reduction Scan', localePrefix: '/', expectedHrefs: ['/examples/cub-device-reduction-scan/'] },
  { route: '/', button: /搜索/, query: 'LAB11 自定义归约 CUB maintenance', localePrefix: '/', expectedHrefs: ['/labs/compare-custom-reduction-with-cub/'] },
  { route: '/en/', button: /Search/, query: 'L03 DeviceReduce DeviceScan temporary storage', localePrefix: '/en/', expectedHrefs: ['/en/libraries/cub-device-primitives/'] },
  { route: '/en/', button: /Search/, query: 'L04 WarpReduce BlockScan TempStorage', localePrefix: '/en/', expectedHrefs: ['/en/libraries/cub-warp-block-primitives/'] },
  { route: '/en/', button: /Search/, query: 'EX17 CUB Device Reduction Scan', localePrefix: '/en/', expectedHrefs: ['/en/examples/cub-device-reduction-scan/'] },
  { route: '/en/', button: /Search/, query: 'LAB11 custom reduction CUB maintenance', localePrefix: '/en/', expectedHrefs: ['/en/labs/compare-custom-reduction-with-cub/'] },
] as const;

test('issue #34 resources stay discoverable in each locale search index', async ({ page }) => {
  test.setTimeout(90_000);
  for (const scenario of searchScenarios) {
    await expectRankedSearchResult(page, scenario);
  }
});

test('issue #34 exposes 16 bilingual, canonical, accessible, unfilled routes', async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const publication of routePairs) {
    const englishRoute = `/en${publication.route}`;
    for (const { route, counterpart, lang } of [
      { route: publication.route, counterpart: englishRoute, lang: 'zh-CN' },
      { route: englishRoute, counterpart: publication.route, lang: 'en' },
    ] as const) {
      const response = await page.goto(route);
      expect(response?.ok(), route).toBe(true);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('main h1')).toContainText(publication.unitId.split('-')[0]);
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        `${canonicalOrigin}${route}`,
      );

      for (const [name, value] of Object.entries({
        'cuda:pair-id': publication.pairId,
        'cuda:fact-check-date': '2026-09-05',
        'cuda:license': 'CC-BY-4.0',
        'cuda:provenance': 'original',
        'cuda:resource-kind': publication.resourceKind,
        'cuda:unit-id': publication.unitId,
        'cuda:prerequisites': publication.prerequisites,
        'cuda:evidence-compilation': 'none',
        'cuda:evidence-runtime': publication.runtimeEvidence,
        'cuda:expected-observations': publication.expectedObservations,
        'cuda:recorded-observations': 'none',
      })) {
        await expect(page.locator(`meta[name="${name}"]`), `${route}: ${name}`)
          .toHaveAttribute('content', value);
      }

      const canonicalFigures = page.locator('[data-canonical-example="EX17"]');
      if ('canonicalRanges' in publication) {
        await expect(page.locator('meta[name="cuda:canonical-example"]'))
          .toHaveAttribute('content', 'EX17');
        await expect(page.locator('meta[name="cuda:canonical-ranges"]'))
          .toHaveAttribute('content', publication.canonicalRanges.join(','));
        await expect(canonicalFigures).toHaveCount(publication.canonicalRanges.length);
        expect(await canonicalFigures.evaluateAll((figures) => figures.map(
          (figure) => figure.getAttribute('data-canonical-range'),
        ))).toEqual(publication.canonicalRanges);
        for (let index = 0; index < publication.canonicalRanges.length; index += 1) {
          const figure = canonicalFigures.nth(index);
          await expect(figure).toHaveAttribute('data-canonical-lines', /^\d+-\d+$/);
          await expect(figure.locator('figcaption a')).toHaveAttribute('href', new RegExp(sourceCommit));
          await expect(figure.locator('pre')).toHaveAttribute('tabindex', '0');
        }
      } else {
        await expect(page.locator('meta[name="cuda:canonical-example"]')).toHaveCount(0);
        await expect(canonicalFigures).toHaveCount(0);
      }

      const tables = page.locator('main table');
      if (publication.tables) {
        const tableCount = await tables.count();
        expect(tableCount, `${route}: tables`).toBeGreaterThan(0);
        expect(await tables.evaluateAll((elements) => elements.map(
          (element) => element.getAttribute('tabindex'),
        ))).toEqual(Array(tableCount).fill('0'));
        if (testInfo.project.name !== 'mobile-safari') {
          await tables.first().focus();
          await expect(tables.first()).toBeFocused();
        }
        await page.emulateMedia({ media: 'print' });
        for (let index = 0; index < tableCount; index += 1) {
          await expect(tables.nth(index), `${route}: print table ${index + 1}`).toBeVisible();
        }
        await page.emulateMedia({ media: 'screen' });
      } else {
        await expect(tables).toHaveCount(0);
      }

      if ('hints' in publication) {
        const hints = page.locator('main details');
        await expect(hints).toHaveCount(6);
        if (testInfo.project.name !== 'mobile-safari') {
          const firstHint = hints.first();
          const summary = firstHint.locator('summary');
          await expect(firstHint).toHaveJSProperty('open', false);
          await summary.focus();
          await expect(summary).toBeFocused();
          await page.keyboard.press('Enter');
          await expect(firstHint).toHaveJSProperty('open', true);
          await page.keyboard.press('Space');
          await expect(firstHint).toHaveJSProperty('open', false);
        }
      }

      if (publication.unitId === 'LAB11') {
        const resultHeading = page.getByRole('heading', {
          level: 2,
          name: /Expected observations, not recorded results|预期观察，不是 recorded results/,
        });
        await expect(resultHeading).toBeVisible();
        const resultContract = await resultHeading.evaluate((heading) => {
          const tableValues: string[] = [];
          const tableTabindexes: Array<string | null> = [];
          let text = '';
          let sibling = heading.parentElement?.nextElementSibling ?? null;
          while (sibling && !sibling.querySelector(':scope > h2')) {
            text += sibling.textContent ?? '';
            if (sibling.matches('table')) {
              tableTabindexes.push(sibling.getAttribute('tabindex'));
              tableValues.push(...[...sibling.querySelectorAll('code')].map(
                (element) => element.textContent?.trim() ?? '',
              ));
            }
            sibling = sibling.nextElementSibling;
          }
          return {
            rowMarkers: text.match(/each of five/g)?.length ?? 0,
            tableTabindexes,
            tableValues,
          };
        });
        expect(resultContract.tableTabindexes, route).toEqual(['0', '0', '0', '0']);
        expect(resultContract.rowMarkers, route).toBe(7);
        expect(resultContract.tableValues.length, route).toBeGreaterThanOrEqual(30);
        expect(resultContract.tableValues.filter((value) => value === 'unfilled'), route).toHaveLength(38);
        expect(resultContract.tableValues.filter((value) => value !== 'unfilled'), route).toEqual(['T']);
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route)
        .toBe(true);
    }
  }

  expect(failures).toEqual([]);
});
