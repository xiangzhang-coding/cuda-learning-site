// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { INDEX_GROUPS, INDEX_LOCALES, INDEX_ROUTES } from '../../src/resource-indexes/resource-index-model';
import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';
import { collectBrowserFailures } from '../helpers/browser-contract';

const expectedCount = (group: (typeof INDEX_GROUPS)[number]) =>
  RESOURCE_INDEX_RECORDS.filter((record) => record.group === group).length;

const issue15PracticeIds = ['PB-R1-013', 'PB-R1-014', 'PB-R1-015', 'PB-R1-016'] as const;
const issue15GlossaryIds = [
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
] as const;
const issue15SourceIds = ['SRC-CUDA-017', 'SRC-CUDA-018', 'SRC-CUDA-019'] as const;
const issue15VisualIds = ['VIS04', 'VIS05', 'VIS06'] as const;
const terminalResourceIds: Partial<Record<(typeof INDEX_GROUPS)[number], string>> = {
  practice: 'PB-R1-016',
  glossary: 'TERM-076',
  sources: 'SRC-CUDA-019',
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

test('issue-15 records keep exact cards, anchors, counts, and the three-Lab publication boundary', async ({ page }) => {
  const counts = Object.fromEntries(
    INDEX_GROUPS.map((group) => [group, expectedCount(group)]),
  ) as Record<(typeof INDEX_GROUPS)[number], number>;
  expect(counts.labs).toBe(3);
  expect(counts.practice).toBe(21);
  expect(counts.visuals).toBe(9);
  expect(counts.glossary).toBe(76);
  expect(counts.sources).toBe(34);
  expect(Object.values(counts).reduce((total, count) => total + count, 0)).toBe(143);

  const expectedIds = [...issue15VisualIds, ...issue15PracticeIds, ...issue15GlossaryIds, ...issue15SourceIds];
  const records = expectedIds.map((planningId) => {
    const record = RESOURCE_INDEX_RECORDS.find((candidate) => candidate.planningId === planningId);
    expect(record, planningId).toBeDefined();
    return record!;
  });

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
      await expect(index.locator('[data-resource-id="LAB04"], [data-resource-id="LAB05"]')).toHaveCount(0);
      await expect(index.locator('h3 a', { hasText: /^LAB0[45]\b/ })).toHaveCount(0);
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
