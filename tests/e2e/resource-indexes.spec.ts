// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { INDEX_GROUPS, INDEX_LOCALES, INDEX_ROUTES } from '../../src/resource-indexes/resource-index-model';
import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';
import { collectBrowserFailures } from '../helpers/browser-contract';
import { TOOLCHAIN_CATALOG_RELATIONSHIPS } from '../helpers/toolchain-catalog-contract';

const expectedCount = (group: (typeof INDEX_GROUPS)[number]) =>
  RESOURCE_INDEX_RECORDS.filter((record) => record.group === group).length;

const releasePracticeIds = [
  'PB-R1-013', 'PB-R1-014', 'PB-R1-015', 'PB-R1-016',
  'PB-R1-017', 'PB-R1-018', 'PB-R1-019', 'PB-R1-020',
  'PB-R1-021', 'PB-R1-022', 'PB-R1-023', 'PB-R1-024',
] as const;
const issue19PracticeIds = [
  'PB-R2-001', 'PB-R2-002', 'PB-R2-003', 'PB-R2-004', 'PB-R2-005', 'PB-R2-006',
] as const;
const toolchainPracticeIds = [
  'PB-R2-007', 'PB-R2-008', 'PB-R2-009', 'PB-R2-010', 'PB-R2-011',
] as const;
const issue21PracticeIds = [
  'PB-R2-012', 'PB-R2-013', 'PB-R2-014', 'PB-R2-015', 'PB-R2-016',
] as const;
const releaseGlossaryIds = [
  'TERM-066',
  'TERM-067',
  'TERM-068',
  'TERM-069',
  'TERM-070',
  'TERM-071',
  'TERM-072',
  'TERM-073',
  'TERM-074',
  'TERM-075',
  'TERM-076',
  'TERM-077',
  'TERM-078',
  'TERM-079',
  'TERM-080',
  'TERM-081',
  'TERM-082',
  'TERM-083',
  'TERM-084',
  'TERM-085',
  'TERM-086',
  'TERM-087',
  'TERM-088',
  'TERM-089',
  'TERM-090',
  'TERM-091',
  'TERM-092',
  'TERM-093',
  'TERM-094',
  'TERM-095',
] as const;
const issue19GlossaryIds = [
  'TERM-096', 'TERM-097', 'TERM-098', 'TERM-099', 'TERM-100',
  'TERM-101', 'TERM-102', 'TERM-103', 'TERM-104', 'TERM-105',
  'TERM-106', 'TERM-107', 'TERM-108', 'TERM-109', 'TERM-110',
  'TERM-111', 'TERM-112', 'TERM-113', 'TERM-114',
] as const;
const toolchainGlossaryIds = [
  'TERM-115', 'TERM-116', 'TERM-117', 'TERM-118', 'TERM-119', 'TERM-120',
  'TERM-121', 'TERM-122', 'TERM-123', 'TERM-124', 'TERM-125',
] as const;
const issue21GlossaryIds = [
  'TERM-126', 'TERM-127', 'TERM-128', 'TERM-129', 'TERM-130', 'TERM-131', 'TERM-132',
  'TERM-133', 'TERM-134', 'TERM-135', 'TERM-136', 'TERM-137', 'TERM-138', 'TERM-139',
] as const;
const releaseSourceIds = [
  'SRC-CUDA-017', 'SRC-CUDA-018', 'SRC-CUDA-019', 'SRC-CUDA-020', 'SRC-CUDA-021',
  'SRC-CUDA-022', 'SRC-CUDA-023', 'SRC-CUDA-024',
] as const;
const issue19SourceIds = [
  'SRC-CUDA-025', 'SRC-CUDA-026', 'SRC-CUDA-027',
  'SRC-CUDA-028', 'SRC-CUDA-029', 'SRC-CUDA-030',
] as const;
const toolchainSourceIds = [
  'SRC-CUDA-031', 'SRC-CUDA-032', 'SRC-CUDA-033', 'SRC-CUDA-034', 'SRC-CUDA-035',
] as const;
const issue21SourceIds = [
  'SRC-HIST-003', 'SRC-CUDA-036', 'SRC-CUDA-037', 'SRC-CUDA-038', 'SRC-CUDA-039', 'SRC-CUDA-040',
] as const;
const releaseLabIds = ['LAB04', 'LAB05', 'LAB07'] as const;
const releaseVisualIds = ['VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08', 'VIS09'] as const;
const issue17Ids = new Set<string>([
  ...releaseLabIds,
  'PB-R1-021', 'PB-R1-022', 'PB-R1-023', 'PB-R1-024',
  'TERM-087', 'TERM-088', 'TERM-089', 'TERM-090', 'TERM-091',
  'TERM-092', 'TERM-093', 'TERM-094', 'TERM-095',
  'SRC-CUDA-022', 'SRC-CUDA-023', 'SRC-CUDA-024',
]);
const issue19Ids = new Set<string>([
  ...issue19PracticeIds,
  ...issue19GlossaryIds,
  ...issue19SourceIds,
  'VIS08',
]);
const toolchainIds = new Set<string>([
  ...toolchainPracticeIds,
  ...toolchainGlossaryIds,
  ...toolchainSourceIds,
  'VIS09',
]);
const issue21Ids = new Set<string>([
  ...issue21PracticeIds,
  ...issue21GlossaryIds,
  ...issue21SourceIds,
  'VIS10',
]);
const terminalResourceIds: Partial<Record<(typeof INDEX_GROUPS)[number], string>> = {
  labs: 'LAB07',
  practice: 'PB-R2-016',
  visuals: 'VIS10',
  glossary: 'TERM-139',
  sources: 'SRC-CUDA-040',
};

test('both locales combine text, type, and related-resource filters without persistence', async ({ page }) => {
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  await page.goto('/en/practice/');
  const practice = page.locator('cuda-resource-index');
  await expect(practice).toHaveAttribute('data-ready', 'true');
  await practice.locator('[data-resource-query]').fill('manifest');
  await practice.locator('[data-resource-filter="type"]').selectOption('correctness-debugging');
  await practice.locator('[data-resource-filter="relation"]').selectOption('O03');
  await expect(practice.locator('[data-resource-card]:visible')).toHaveCount(1);
  await expect(practice.locator('[data-resource-card]:visible')).toHaveAttribute('data-resource-id', 'PB-R0-002');
  await expect(practice.locator('[data-resource-count]')).toHaveText(
    `Showing 1 of ${expectedCount('practice')} published entries`,
  );

  await practice.locator('[data-resource-query]').fill('no eligible record has this phrase');
  await expect(practice.locator('[data-resource-card]:visible')).toHaveCount(0);
  await expect(practice.locator('[data-resource-empty]')).toBeVisible();
  await practice.getByRole('button', { name: 'Reset filters' }).click();
  await expect(practice.locator('[data-resource-query]')).toBeFocused();
  await expect(practice.locator('[data-resource-card]:visible')).toHaveCount(expectedCount('practice'));

  await page.goto('/glossary/');
  const glossary = page.locator('cuda-resource-index');
  await glossary.locator('[data-resource-query]').fill('运行已验证');
  await glossary.locator('[data-resource-filter="type"]').selectOption('evidence-vocabulary');
  await expect(glossary.locator('[data-resource-card]:visible')).toHaveCount(1);
  await expect(glossary.locator('[data-resource-card]:visible')).toHaveAttribute('data-resource-id', 'TERM-014');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(failures).toEqual([]);
});

test('toolchain catalog cards preserve every detail-declared relationship', async ({ page }) => {
  for (const group of ['practice', 'glossary', 'sources'] as const) {
    await page.goto(INDEX_ROUTES[group].en);
    for (const expected of TOOLCHAIN_CATALOG_RELATIONSHIPS.filter((record) => record.group === group)) {
      const card = page.locator(`[data-resource-id="${expected.planningId}"]`);
      const prerequisites = card.getByText('Prerequisites', { exact: true }).locator('..').locator('dd a');
      const relatedUnits = card.getByText('Related resources', { exact: true }).locator('..').locator('dd a');
      expect(await prerequisites.allTextContents(), expected.planningId).toEqual(expected.prerequisites);
      expect(await relatedUnits.allTextContents(), expected.planningId).toEqual(expected.relatedUnits);
    }
  }
});

test('filter controls and direct resource links support keyboard operation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  await page.goto('/en/glossary/');
  const index = page.locator('cuda-resource-index');
  const query = index.locator('[data-resource-query]');
  await query.focus();
  await page.keyboard.type('TERM-034');
  await expect(index.locator('[data-resource-card]:visible')).toHaveAttribute('data-resource-id', 'TERM-034');
  expect(await query.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);

  await page.keyboard.press('Tab');
  await expect(index.locator('[data-resource-filter="type"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(index.locator('[data-resource-filter="relation"]')).toBeFocused();
  const reset = index.getByRole('button', { name: 'Reset filters' });
  if (testInfo.project.name === 'webkit') await reset.focus();
  else await page.keyboard.press('Tab');
  await expect(reset).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(query).toBeFocused();
  await expect(index.locator('[data-resource-card]:visible')).toHaveCount(expectedCount('glossary'));

  await page.goto('/en/labs/');
  const labCard = page.locator('[data-resource-id="LAB02"]');
  await labCard.getByRole('link', { name: 'O03', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/start\/environment-manifest\/$/);
  await page.goBack();
  await page.locator('[data-resource-id="LAB02"] h3 a').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/en\/labs\/vector-addition\/$/);
});

test('the expanded catalog keeps exact cards, anchors, counts, freshness, and publication boundaries', async ({ page }) => {
  const counts = Object.fromEntries(
    INDEX_GROUPS.map((group) => [group, expectedCount(group)]),
  ) as Record<(typeof INDEX_GROUPS)[number], number>;
  expect(counts.labs).toBe(6);
  expect(counts.practice).toBe(45);
  expect(counts.visuals).toBe(14);
  expect(counts.glossary).toBe(139);
  expect(counts.sources).toBe(56);
  expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(260);

  const expectedIds = [
    ...releaseLabIds,
    ...releaseVisualIds,
    ...releasePracticeIds,
    ...issue19PracticeIds,
    ...toolchainPracticeIds,
    ...issue21PracticeIds,
    ...releaseGlossaryIds,
    ...issue19GlossaryIds,
    ...toolchainGlossaryIds,
    ...issue21GlossaryIds,
    ...releaseSourceIds,
    ...issue19SourceIds,
    ...toolchainSourceIds,
    ...issue21SourceIds,
    'VIS10',
  ];
  const records = expectedIds.map((planningId) => {
    const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
    expect(record, planningId).toBeDefined();
    return record!;
  });
  for (const record of records.filter(({ planningId }) => issue17Ids.has(planningId))) {
    expect(record.reviewedOn, record.planningId).toBe('2026-08-28');
  }
  for (const record of records.filter(({ planningId }) => issue19Ids.has(planningId))) {
    expect(record.reviewedOn, record.planningId).toBe('2026-08-29');
  }
  for (const record of records.filter(({ planningId }) => toolchainIds.has(planningId))) {
    expect(record.reviewedOn, record.planningId).toBe('2026-08-29');
    if (record.group === 'sources') expect(record.sourceAccessDate, record.planningId).toBe('2026-08-29');
  }
  for (const record of records.filter(({ planningId }) => issue21Ids.has(planningId))) {
    expect(record.reviewedOn, record.planningId).toBe('2026-08-30');
    if (record.group === 'sources') expect(record.sourceAccessDate, record.planningId).toBe('2026-08-30');
  }

  for (const group of ['labs', 'practice', 'visuals', 'glossary', 'sources'] as const) {
    const groupRecords = records.filter((record) => record.group === group);
    await page.goto(INDEX_ROUTES[group].en);
    const index = page.locator('cuda-resource-index');
    await expect(index.locator('[data-resource-card]')).toHaveCount(counts[group]);
    await expect(index.locator('[data-resource-count]')).toHaveText(
      `Showing ${counts[group]} of ${counts[group]} published entries`,
    );
    const terminalId = terminalResourceIds[group];
    if (terminalId) {
      await expect(index.locator(`[data-resource-id="${terminalId}"]`)).toHaveCount(1);
    }
    if (group === 'labs') {
      await expect(index.locator('[data-resource-id="LAB06"]')).toHaveCount(0);
      await expect(index.locator('h3 a', { hasText: /^LAB06\b/ })).toHaveCount(0);
    }

    for (const record of groupRecords) {
      const card = index.locator(`[data-resource-id="${record.planningId}"]`);
      await expect(card, record.planningId).toHaveCount(1);
      await expect(card.locator('h3 a')).toHaveAttribute('href', record.href.en);
    }

    for (const record of groupRecords) {
      await page.goto(record.href.en);
      if (group === 'labs') {
        await expect(page.locator('main h1')).toContainText(record.planningId);
      } else if (group === 'visuals') {
        await expect(page.locator(`[data-visual-id="${record.planningId}"]`), record.planningId).toHaveCount(1);
      } else {
        await expect(page.locator(`#${record.planningId.toLowerCase()}`), record.planningId).toHaveCount(1);
      }
    }
  }
});

test('filtering remains deterministic with a growing synthetic card fixture', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/en/glossary/');
  await page.evaluate((total) => {
    const current = document.querySelector('cuda-resource-index');
    if (!current) throw new Error('Resource index custom element is unavailable.');
    const growth = document.createElement('cuda-resource-index');
    growth.dataset.locale = 'en';
    growth.dataset.total = String(total);
    growth.dataset.countTemplate = 'Showing {visible} of {total} published entries';
    growth.innerHTML = `
      <div data-resource-controls hidden>
        <label>Search <input type="search" data-resource-query></label>
        <label>Type <select data-resource-filter="type"><option value="">All</option><option value="even">Even</option><option value="odd">Odd</option></select></label>
        <label>Relation <select data-resource-filter="relation"><option value="">All</option><option value="O03">O03</option></select></label>
        <button type="button" data-action="reset-resource-filters">Reset filters</button>
        <p data-resource-count role="status"></p>
      </div>
      <div class="resource-index-grid" data-resource-list></div>
      <p data-resource-empty hidden>No matches</p>`;
    const list = growth.querySelector('[data-resource-list]');
    for (let index = 0; index < total; index += 1) {
      const card = document.createElement('article');
      card.className = 'resource-index-card';
      card.dataset.resourceCard = '';
      card.dataset.resourceId = `GROW-${String(index).padStart(3, '0')}`;
      card.dataset.resourceType = index % 2 === 0 ? 'even' : 'odd';
      card.dataset.resourceRelations = index % 3 === 0 ? 'O03' : '';
      card.dataset.resourceSearch = `Growth record ${index}`;
      card.innerHTML = `<h3><a href="#growth-${index}">Growth record ${index}</a></h3>`;
      list?.append(card);
    }
    current.replaceWith(growth);
  }, 75);

  const index = page.locator('cuda-resource-index');
  await expect(index).toHaveAttribute('data-ready', 'true');
  await expect(index.locator('[data-resource-card]:visible')).toHaveCount(75);
  await index.locator('[data-resource-query]').fill('Growth record 74');
  await index.locator('[data-resource-filter="type"]').selectOption('even');
  await expect(index.locator('[data-resource-card]:visible')).toHaveAttribute('data-resource-id', 'GROW-074');
  await expect(index.locator('[data-resource-count]')).toHaveText('Showing 1 of 75 published entries');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('theme changes preserve ephemeral filters while reloads reset them', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium state-isolation probe is sufficient.');
  await page.goto('/en/practice/');
  const index = page.locator('cuda-resource-index');
  await index.locator('[data-resource-query]').fill('Complete a manifest');
  await expect(index.locator('[data-resource-card]:visible')).toHaveCount(1);

  for (const theme of THEME_IDS) {
    await page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' }).selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
    await expect(index.locator('[data-resource-card]:visible')).toHaveCount(1);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([THEME_STORAGE_KEY]);
  }

  await page.reload();
  await expect(page.locator('[data-resource-query]')).toHaveValue('');
  await expect(page.locator('[data-resource-card]:visible')).toHaveCount(expectedCount('practice'));
});

test('mobile reflow keeps every index within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const group of INDEX_GROUPS) {
    for (const locale of INDEX_LOCALES) {
      const route = INDEX_ROUTES[group][locale];
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('[data-resource-controls]')).toBeVisible();
      await expect(page.locator('site-search input')).toHaveCount(1);
      await expect(page.locator('[data-resource-card]')).toHaveCount(expectedCount(group));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }

  expect(failures).toEqual([]);
});

test('print restores the complete index after a screen filter', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns print-media emulation.');
  await page.goto('/en/glossary/');
  const index = page.locator('cuda-resource-index');
  await index.locator('[data-resource-query]').fill('TERM-034');
  await expect(index.locator('[data-resource-card]:visible')).toHaveCount(1);

  await page.emulateMedia({ media: 'print' });
  await expect(index.locator('[data-resource-controls]')).toBeHidden();
  expect(
    await index.locator('[data-resource-card]').evaluateAll((cards) =>
      cards.filter((card) => getComputedStyle(card).display !== 'none').length,
    ),
  ).toBe(expectedCount('glossary'));
});

test('no-script output keeps every eligible card and direct link available', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One static Chromium context covers script-independent HTML.');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  for (const group of INDEX_GROUPS) {
    for (const locale of INDEX_LOCALES) {
      const route = INDEX_ROUTES[group][locale];
      await page.goto(`http://127.0.0.1:4321${route}`);
      await expect(page.locator('[data-resource-controls]')).toBeHidden();
      await expect(page.locator('[data-resource-card]')).toHaveCount(expectedCount(group));
      expect(
        await page.locator('[data-resource-card]').evaluateAll((cards) =>
          cards.every((card) => getComputedStyle(card).display !== 'none' && Boolean(card.querySelector('h3 a[href]'))),
        ),
        route,
      ).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }

  await context.close();
});
