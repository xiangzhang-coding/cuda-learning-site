// SPDX-License-Identifier: Apache-2.0
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { THEME_IDS } from '../../src/theme-contract';
import { collectBrowserFailures } from '../helpers/browser-contract';

const units = [
  { id: 'P04', slug: 'frameworks/queued-work-timing', prerequisites: 'M07,Q05', practice: 'pb-r5-004', source: '081' },
  { id: 'P05', slug: 'frameworks/streams-and-storage-lifetime', prerequisites: 'P04,M08', practice: 'pb-r5-005', source: '081' },
  { id: 'P06', slug: 'frameworks/mixed-precision-contracts', prerequisites: 'Q02,P04,L08', practice: 'pb-r5-006', source: '082' },
  { id: 'P07', slug: 'frameworks/python-to-cuda-profiling', prerequisites: 'P04,Q07,Q08', practice: 'pb-r5-007', source: '083' },
];
const publications = units.flatMap((unit) => [
  { id: unit.id, slug: unit.slug, prerequisites: unit.prerequisites },
  { id: `${unit.id}-EXERCISES`, slug: `${unit.slug}/exercises`, prerequisites: unit.id },
  { id: `${unit.id}-SOLUTIONS`, slug: `${unit.slug}/solutions`, prerequisites: `${unit.id}-EXERCISES` },
]);
const exerciseHeadings = /^(?:Exercise|练习) [1-3][:：]/;
const solutionHeadings = /^(?:Solution|解答) [1-3][:：]/;

async function expectPublication(page: Page, id: string, prerequisites: string) {
  await expect(page.locator('main h1')).toContainText(id.split('-')[0]);
  await expect(page.locator('meta[name="cuda:unit-id"]')).toHaveAttribute('content', id);
  await expect(page.locator('meta[name="cuda:prerequisites"]')).toHaveAttribute('content', prerequisites);
  await expect(page.locator('meta[name="cuda:fact-check-date"]')).toHaveAttribute('content', '2026-09-12');
  for (const name of ['evidence-compilation', 'evidence-runtime', 'expected-observations', 'recorded-observations']) {
    await expect(page.locator(`meta[name="cuda:${name}"]`)).toHaveAttribute('content', 'none');
  }
  await expect(page.locator('main pre, main [data-canonical-example], main canvas, main iframe, main astro-island')).toHaveCount(0);
}

for (const locale of ['', 'en/']) {
  const label = locale || 'zh-CN/';

  for (const unit of units) {
    test(`${label}${unit.id} navigation reaches its unit and exact source/practice anchors`, async ({ page, baseURL }, info) => {
      test.skip(info.project.name === 'mobile-safari', 'The narrow-screen journey owns mobile navigation.');
      test.setTimeout(30_000);
      const failures = collectBrowserFailures(page, baseURL!);
      async function expectLoadedPage() {
        // A real result proves the focus-triggered search worker is ready before navigating away.
        await page.waitForLoadState('domcontentloaded');
        const name = locale ? 'Search' : '搜索';
        await page.getByRole('banner').getByRole('button', { name, exact: true }).click();
        const dialog = page.getByRole('dialog', { name, exact: true });
        const input = dialog.getByRole('textbox', { name, exact: true });
        await expect(input).toBeVisible();
        await expect(input).toBeEditable();
        await input.fill(unit.id);
        await expect(dialog.locator(`a[href="/${locale}${unit.slug}/"]`).first()).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
      }
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/${locale}${units[0].slug}/`, { waitUntil: 'domcontentloaded' });
      await expectLoadedPage();
      const group = page.locator('nav details').filter({ has: page.locator('summary', { hasText: locale ? 'PyTorch CUDA Semantics' : 'PyTorch CUDA 语义' }) });
      await expect(group).toHaveCount(1);
      expect(await group.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href'))))
        .toEqual(units.map(({ slug }) => `/${locale}${slug}/`));
      if (!(await group.evaluate((element) => element.hasAttribute('open')))) await group.locator('summary').click();
      await group.locator(`a[href="/${locale}${unit.slug}/"]`).click();
      await expect(page).toHaveURL(`${baseURL}/${locale}${unit.slug}/`);
      await expectLoadedPage();
      await expectPublication(page, unit.id, unit.prerequisites);
      await page.locator(`main a[href="/${locale}practice/#${unit.practice}"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}/${locale}practice/#${unit.practice}`);
      await expectLoadedPage();
      await expect(page.locator(`main #${unit.practice}`)).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 2, name: new RegExp(`^${unit.practice.toUpperCase()}[:：]`) })).toBeVisible();
      await page.locator(`main a[href="/${locale}${unit.slug}/"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}/${locale}${unit.slug}/`);
      await expectLoadedPage();
      await page.locator(`main a[href="/${locale}sources-and-versions/#src-cuda-${unit.source}"]`).first().click();
      await expect(page).toHaveURL(`${baseURL}/${locale}sources-and-versions/#src-cuda-${unit.source}`);
      await expectLoadedPage();
      await expect(page.locator(`main #src-cuda-${unit.source}`)).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 2, name: new RegExp(`^SRC-CUDA-${unit.source}[:：]`) })).toBeVisible();
      if (unit.id === 'P07') {
        await page.goto(`/${locale}${unit.slug}/`, { waitUntil: 'domcontentloaded' });
        await expectLoadedPage();
        await page.locator(`main a[href="/${locale}sources-and-versions/#src-cuda-080"]`).first().click();
        await expect(page).toHaveURL(`${baseURL}/${locale}sources-and-versions/#src-cuda-080`);
        await expectLoadedPage();
        await expect(page.locator('main #src-cuda-080')).toHaveCount(1);
        const artifact = 'https://download.pytorch.org/whl/cu128/torch-2.11.0%2Bcu128-cp312-cp312-manylinux_2_28_x86_64.whl';
        await expect(page.locator(`main a[href="${artifact}"]`)).toBeVisible();
        await expect(page.locator('main a[href="https://github.com/xiangzhang-coding/cuda-learning-site/blob/main/scripts/pytorch-environment/profile.json"]')).toBeVisible();
      }
      expect(failures).toEqual([]);
    });

    test(`${label}${unit.id} mobile worksheet, counterpart round trips, keyboard hints and separate printable solutions`, async ({ page, baseURL }, info) => {
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const route = `/${locale}${unit.slug}/`;
      await page.goto(route, { waitUntil: 'networkidle' });
      for (const suffix of ['', 'exercises/', 'solutions/']) {
        if (suffix) await page.locator(`main a[href="${route}${suffix}"]`).first().click();
        const id = unit.id + (suffix ? `-${suffix.replace('/', '').toUpperCase()}` : '');
        const prerequisites = suffix === 'exercises/' ? unit.id : suffix === 'solutions/' ? `${unit.id}-EXERCISES` : unit.prerequisites;
        await expectPublication(page, id, prerequisites);
        const counterpart = `/${locale ? '' : 'en/'}${unit.slug}/${suffix}`;
        await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
        await page.locator('[data-locale-counterpart]').click();
        await expect(page).toHaveURL(`${baseURL}${counterpart}`);
        await expectPublication(page, id, prerequisites);
        await page.locator('[data-locale-counterpart]').click();
        await expect(page).toHaveURL(`${baseURL}${route}${suffix}`);
        if (!suffix) {
          const table = page.locator('main table').first();
          await expect(table).toBeVisible();
          await expect(table).toHaveAttribute('tabindex', '0');
          expect(await table.evaluate((element) => getComputedStyle(element).overflowX)).toBe('auto');
          if (info.project.name !== 'mobile-safari') {
            await table.focus();
            await expect(table).toBeFocused();
          }
        } else if (suffix === 'exercises/') {
          await expect(page.locator('main h2').filter({ hasText: exerciseHeadings })).toHaveCount(3);
          const hints = page.locator('main details');
          await expect(hints).toHaveCount(6);
          await expect(page.locator('main details[open]')).toHaveCount(0);
          for (const hint of await hints.all()) {
            const summary = hint.locator('summary');
            if (info.project.name === 'mobile-safari') await summary.tap();
            else await summary.press('Enter');
            await expect(hint).toHaveJSProperty('open', true);
            expect((await hint.innerText()).replace(await summary.innerText(), '').trim().length).toBeGreaterThan(20);
            if (info.project.name === 'mobile-safari') await summary.tap();
            else await summary.press('Space');
            await expect(hint).toHaveJSProperty('open', false);
          }
        } else {
          await expect(page.locator('meta[name="cuda:resource-kind"]')).toHaveAttribute('content', 'solution-set');
          await expect(page.locator('main h2').filter({ hasText: solutionHeadings })).toHaveCount(3);
          await expect(page.locator('main details')).toHaveCount(0);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id}: no horizontal page overflow`).toBe(true);
        await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
        await expect(page.locator('main h1')).toBeVisible();
        for (const element of await page.locator('main table, main details summary').all()) await expect(element).toBeVisible();
        await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
      }
      await page.locator(`main a[href="${route}"]`).first().click();
      await expectPublication(page, unit.id, unit.prerequisites);
      expect(failures).toEqual([]);
    });

    test(`@accessibility ${label}${unit.id} lesson, open exercise hints and separate solutions`, async ({ page, baseURL }, info) => {
      test.skip(info.project.name !== 'chromium', 'Chromium owns the serialized axe gate.');
      test.setTimeout(90_000);
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 360, height: 800 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      for (const publication of publications.filter(({ id }) => id.startsWith(unit.id))) {
        await page.goto(`/${locale}${publication.slug}/`, { waitUntil: 'networkidle' });
        await expectPublication(page, publication.id, publication.prerequisites);
        for (const summary of await page.locator('main details summary').all()) await summary.press('Enter');
        if (publication.id.endsWith('-EXERCISES')) await expect(page.locator('main details[open]')).toHaveCount(6);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
        expect(results.violations.map(({ id, impact, nodes }) => ({ id, impact, targets: nodes.map((node) => node.target) })), publication.slug).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), publication.slug).toBe(true);
      }
      expect(failures).toEqual([]);
    });
  }

  for (const theme of THEME_IDS) {
    test(`${label}PyTorch ${theme} persists across worksheets and narrow-screen practice`, async ({ page, baseURL }, info) => {
      test.skip(info.project.name !== 'chromium', 'Chromium owns the bounded theme matrix.');
      test.setTimeout(60_000);
      const failures = collectBrowserFailures(page, baseURL!);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(`/${locale}${units[0].slug}/`, { waitUntil: 'networkidle' });
      await page.getByRole('banner').getByRole('combobox', { name: locale ? 'Select visual theme' : '选择视觉主题' }).selectOption(theme);
      await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
      await page.setViewportSize({ width: 360, height: 800 });
      // Every worksheet in every theme; companion journeys and axe cover all remaining exercise/solution routes.
      const routes = [...units.map(({ slug }) => slug), `${units[1].slug}/exercises`, `${units[2].slug}/solutions`];
      for (const slug of routes) {
        await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
        await page.goto(`/${locale}${slug}/`, { waitUntil: 'networkidle' });
        await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
        await expect(page.locator('main h1')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}: ${slug}`).toBe(true);
        await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
        for (const element of await page.locator('main h1, main table, main details summary').all()) await expect(element).toBeVisible();
      }
      expect(failures).toEqual([]);
    });
  }
}

test.describe('PyTorch semantics without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  for (const locale of ['', 'en/']) {
    for (const unit of units) {
      test(`${locale || 'zh-CN/'}${unit.id} retains worksheets, native hints, solutions and counterpart navigation`, async ({ page, baseURL }, info) => {
        test.skip(info.project.name !== 'chromium', 'Chromium owns the no-script gate.');
        const failures = collectBrowserFailures(page, baseURL!);
        await page.setViewportSize({ width: 360, height: 800 });
        const route = `/${locale}${unit.slug}/`;
        await page.goto(route);
        await expectPublication(page, unit.id, unit.prerequisites);
        await expect(page.locator('main table').first()).toBeVisible();
        await page.locator(`main a[href="${route}exercises/"]`).first().click();
        await expectPublication(page, `${unit.id}-EXERCISES`, unit.id);
        await expect(page.locator('main details')).toHaveCount(6);
        await expect(page.locator('main details[open]')).toHaveCount(0);
        for (const hint of await page.locator('main details').all()) {
          await hint.locator('summary').press('Enter');
          await expect(hint).toHaveJSProperty('open', true);
          expect((await hint.innerText()).replace(await hint.locator('summary').innerText(), '').trim().length).toBeGreaterThan(20);
        }
        await page.locator(`main a[href="${route}solutions/"]`).first().click();
        await expectPublication(page, `${unit.id}-SOLUTIONS`, `${unit.id}-EXERCISES`);
        await expect(page.locator('main details')).toHaveCount(0);
        await expect(page.locator('main h2').filter({ hasText: solutionHeadings })).toHaveCount(3);
        await page.locator('[data-locale-counterpart]').click();
        await expect(page).toHaveURL(`${baseURL}/${locale ? '' : 'en/'}${unit.slug}/solutions/`);
        await expectPublication(page, `${unit.id}-SOLUTIONS`, `${unit.id}-EXERCISES`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(failures).toEqual([]);
      });
    }
  }
});
