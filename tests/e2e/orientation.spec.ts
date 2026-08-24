// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/en/',
  '/start/using-the-learning-site/',
  '/en/start/using-the-learning-site/',
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
  await page.goto('/start/using-the-learning-site/');
  await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute(
    'href',
    '/en/start/using-the-learning-site/',
  );

  if (testInfo.project.name === 'mobile-safari') {
    await page.locator('[data-locale-counterpart]').click();
  } else {
    await page
      .getByRole('banner')
      .locator('starlight-lang-select select')
      .selectOption('/en/start/using-the-learning-site/');
  }
  await expect(page).toHaveURL(/\/en\/start\/using-the-learning-site\/$/);
  await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute(
    'href',
    '/start/using-the-learning-site/',
  );
});

test('Chinese and English searches stay in their language index', async ({ page }) => {
  for (const scenario of [
    { route: '/', button: /搜索/, query: '双语发布对', localePrefix: '/' },
    { route: '/en/', button: /Search/, query: 'Publication Pair', localePrefix: '/en/' },
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
  for (const route of ['/en/', '/en/start/using-the-learning-site/', '/en/sources-and-versions/']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  await page.goto('/en/start/using-the-learning-site/');

  if (testInfo.project.name === 'mobile-safari') {
    await page.getByRole('button', { name: 'Menu' }).click();
  }

  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Glossary', exact: true }),
  ).toBeVisible();
});

test('print keeps content dark on a white page', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ media: 'print', colorScheme });
    await page.goto('/en/');

    await expect(page.locator('.locale-pair')).toBeHidden();
    expect(await page.locator('body').evaluate((body) => getComputedStyle(body).backgroundColor)).toBe(
      'rgb(255, 255, 255)',
    );
    expect(
      await page.locator('.signal-hero > p').last().evaluate((paragraph) => getComputedStyle(paragraph).color),
    ).toBe('rgb(17, 17, 17)');
    expect(await page.locator('.signal-kicker').evaluate((label) => getComputedStyle(label).color)).toBe(
      'rgb(13, 61, 69)',
    );
    expect(
      await page.locator('.signal-action').evaluate((action) => getComputedStyle(action).backgroundColor),
    ).toBe('rgb(13, 61, 69)');
    expect(await page.locator('.route-card span').first().evaluate((label) => getComputedStyle(label).color)).toBe(
      'rgb(138, 58, 34)',
    );
  }
});
