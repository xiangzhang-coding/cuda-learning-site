// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';

const routes = [
  '/',
  '/en/',
  '/start/using-the-learning-site/',
  '/en/start/using-the-learning-site/',
  '/start/evidence-status/',
  '/en/start/evidence-status/',
  '/start/evidence-status/exercises/',
  '/en/start/evidence-status/exercises/',
  '/start/evidence-status/solutions/',
  '/en/start/evidence-status/solutions/',
  '/start/environment-manifest/',
  '/en/start/environment-manifest/',
  '/start/environment-manifest/exercises/',
  '/en/start/environment-manifest/exercises/',
  '/start/environment-manifest/solutions/',
  '/en/start/environment-manifest/solutions/',
  '/examples/vector-addition/',
  '/en/examples/vector-addition/',
  '/visuals/kernel-journey/',
  '/en/visuals/kernel-journey/',
  '/visuals/indexing/',
  '/en/visuals/indexing/',
  '/practice/',
  '/en/practice/',
  '/glossary/',
  '/en/glossary/',
  '/sources-and-versions/',
  '/en/sources-and-versions/',
  '/about/',
  '/en/about/',
];

test('all published routes load without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await page.waitForLoadState('networkidle');
  }

  expect(errors).toEqual([]);
});

test('locale controls keep the learner on the counterpart page', async ({ page }, testInfo) => {
  for (const { zh, en } of [
    { zh: '/start/using-the-learning-site/', en: '/en/start/using-the-learning-site/' },
    { zh: '/start/evidence-status/', en: '/en/start/evidence-status/' },
    { zh: '/start/environment-manifest/', en: '/en/start/environment-manifest/' },
    { zh: '/examples/vector-addition/', en: '/en/examples/vector-addition/' },
    { zh: '/visuals/kernel-journey/', en: '/en/visuals/kernel-journey/' },
    { zh: '/visuals/indexing/', en: '/en/visuals/indexing/' },
    { zh: '/practice/', en: '/en/practice/' },
  ]) {
    await page.goto(zh);
    await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', en);

    if (testInfo.project.name === 'mobile-safari') {
      await page.locator('[data-locale-counterpart]').click();
    } else {
      await page.getByRole('banner').locator('starlight-lang-select select').selectOption(en);
    }
    await expect(page).toHaveURL(new RegExp(`${en}$`));
    await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', zh);
  }
});

test('Chinese and English searches stay in their language index', async ({ page }) => {
  for (const scenario of [
    { route: '/', button: /搜索/, query: '双语发布对', localePrefix: '/' },
    { route: '/', button: /搜索/, query: '环境清单', localePrefix: '/' },
    { route: '/', button: /搜索/, query: '内存事务', localePrefix: '/' },
    { route: '/en/', button: /Search/, query: 'Publication Pair', localePrefix: '/en/' },
    { route: '/en/', button: /Search/, query: 'Evidence Status', localePrefix: '/en/' },
    { route: '/en/', button: /Search/, query: 'row-major data index', localePrefix: '/en/' },
  ]) {
    await page.goto(scenario.route);
    await page.getByRole('button', { name: scenario.button }).first().click();
    const dialog = page.getByRole('dialog', { name: scenario.button });
    const input = dialog.getByRole('textbox', { name: scenario.button });
    await input.fill(scenario.query);
    const resultLinks = dialog.locator('a[href]');
    await expect(resultLinks.first()).toBeVisible();
    const hrefs = await resultLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? ''));
    expect(hrefs.length).toBeGreaterThan(0);
    expect(
      hrefs.every((href) =>
        scenario.localePrefix === '/en/' ? href.startsWith('/en/') : !href.startsWith('/en/'),
      ),
    ).toBe(true);
    await page.keyboard.press('Escape');
  }
});

test('keyboard focus is visible from the first tab stop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  await page.goto('/en/start/using-the-learning-site/');
  await page.keyboard.press(testInfo.project.name === 'webkit' ? 'Alt+Tab' : 'Tab');

  const skipLink = page.locator('.sl-skip-link');
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
  expect(
    await skipLink.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth)),
  ).toBeGreaterThan(0);
});

test('navigation remains usable without horizontal overflow', async ({ page }, testInfo) => {
  for (const route of ['/en/', '/en/start/using-the-learning-site/', '/en/start/evidence-status/', '/en/start/environment-manifest/', '/en/examples/vector-addition/', '/en/visuals/kernel-journey/', '/en/visuals/indexing/', '/en/practice/', '/en/sources-and-versions/']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.goto('/en/start/environment-manifest/');

  if (testInfo.project.name === 'mobile-safari') {
    await page.getByRole('button', { name: 'Menu' }).click();
  }

  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Glossary', exact: true }),
  ).toBeVisible();
});

test('print keeps content dark on a white page', async ({ page }) => {
  for (const theme of THEME_IDS) {
    await page.goto('/en/');
    await page.evaluate(
      ([storageKey, value]) => localStorage.setItem(storageKey, value),
      [THEME_STORAGE_KEY, theme] as const,
    );
    await page.reload();
    await page.emulateMedia({ media: 'print' });

    await expect(page.locator('.locale-pair')).toBeHidden();
    await expect(page.locator('learning-theme-select').first()).toBeHidden();
    expect(await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).toBe(
      'rgb(255, 255, 255)',
    );
    expect(
      await page.locator('.signal-hero > p').last().evaluate((paragraph) => getComputedStyle(paragraph).color),
    ).toBe('rgb(34, 34, 34)');
    expect(await page.locator('.signal-kicker').evaluate((label) => getComputedStyle(label).color)).toBe(
      'rgb(7, 81, 89)',
    );
    expect(
      await page.locator('.signal-action').evaluate((action) => getComputedStyle(action).backgroundColor),
    ).toBe('rgb(7, 81, 89)');
    expect(await page.locator('.route-card span').first().evaluate((label) => getComputedStyle(label).color)).toBe(
      'rgb(122, 47, 28)',
    );
    await page.emulateMedia({ media: 'screen' });
  }
});
