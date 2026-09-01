// SPDX-License-Identifier: Apache-2.0
import { expect, test, type Page } from '@playwright/test';

import {
  DEFAULT_THEME,
  THEME_IDS,
  THEME_STORAGE_KEY,
  starlightThemeFor,
  type LearningTheme,
} from '../../src/theme-contract';

const issue20Routes = [
  '/en/toolchain/nvcc-compilation-flow/',
  '/en/toolchain/ptx-cubin-fatbinary/',
  '/en/toolchain/compiler-architecture-targets/',
  '/en/toolchain/separate-compilation-device-linking/',
  '/en/toolchain/cpp-dialect-boundaries/',
  '/en/examples/ptx-fatbinary-inspection/',
  '/en/visuals/artifact-pipeline/',
] as const;

const issue25Routes = [
  '/en/correctness/apod-optimization-loop/',
  '/en/correctness/timeline-first-nsight-systems/',
  '/en/correctness/kernel-first-nsight-compute/',
  '/en/labs/build-overlapped-pipeline/',
  '/en/labs/profile-full-application-before-kernel/',
  '/en/visuals/nsight-systems-versus-nsight-compute/',
] as const;

const issue26Routes = [
  '/en/algorithms/algorithm-choice-arithmetic-intensity/',
  '/en/correctness/occupancy-stalls-throughput/',
  '/en/correctness/roofline-arithmetic-intensity/',
  '/en/labs/build-original-roofline/',
  '/en/visuals/roofline/',
] as const;

const themeReflowRoutes = [
  '/en/start/using-the-learning-site/',
  '/en/memory/pinned-memory-transfer-overlap/',
  '/en/memory/unified-memory-page-migration/',
  '/en/memory/stream-ordered-allocation-memory-pools/',
  '/en/memory/cooperative-groups/',
  '/en/memory/asynchronous-copy-pipelines/',
  '/en/memory/cuda-graphs/',
  '/en/examples/streams-events-overlap/',
  '/en/examples/unified-memory-migration/',
  '/en/examples/graph-capture/',
  '/en/visuals/page-migration/',
  ...issue20Routes,
  ...issue25Routes,
  ...issue26Routes,
] as const;

async function persistTheme(page: Page, theme: LearningTheme) {
  await page.goto('/en/');
  await page.evaluate(
    ([storageKey, value]) => localStorage.setItem(storageKey, value),
    [THEME_STORAGE_KEY, theme] as const,
  );
  await page.reload();
}

test('theme choice preserves content and is the only local preference', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'The mobile menu contract exercises its theme control separately.');
  await page.goto('/en/start/using-the-learning-site/');
  const picker = page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' });
  const originalContent = await page.locator('main').innerText();
  const originalHeadings = await page.locator('main :is(h1, h2, h3)').allTextContents();

  await expect(page.locator('html')).toHaveAttribute('data-learning-theme', DEFAULT_THEME);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  for (const theme of THEME_IDS) {
    await picker.selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme', starlightThemeFor(theme));
    expect(await page.locator('main').innerText()).toBe(originalContent);
    expect(await page.locator('main :is(h1, h2, h3)').allTextContents()).toEqual(originalHeadings);
    expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([THEME_STORAGE_KEY]);
    expect(await page.evaluate((key) => localStorage.getItem(key), THEME_STORAGE_KEY)).toBe(theme);
  }

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-learning-theme', 'blueprint');
  await expect(page.getByRole('banner').getByRole('combobox', { name: '选择视觉主题' })).toHaveValue('blueprint');
});

test('theme control supports keyboard selection with a visible focus indicator', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile-safari', 'Mobile emulation has no hardware keyboard.');
  await page.goto('/en/');
  const picker = page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' });
  const languagePicker = page.getByRole('banner').getByRole('combobox', { name: 'Select language' });

  for (const { key, theme } of [
    { key: 'p', theme: 'profiler-dark' },
    { key: 'b', theme: 'blueprint' },
    { key: 's', theme: 'silicon-light' },
  ] as const) {
    await page.reload();
    await picker.focus();
    expect(await picker.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThan(0);
    await picker.press(key);

    await expect(picker).toHaveValue(theme);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
    expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), THEME_STORAGE_KEY)).toBe(theme);
    await page.keyboard.press('Tab');
    await expect(languagePicker).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(picker).toBeFocused();
  }
});

test('all themes reflow recent publication pages at the CSS viewport equivalent of 200% zoom', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The pinned Chromium project owns the 200% reflow probe.');
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 640, height: 720 });

  for (const theme of THEME_IDS) {
    await persistTheme(page, theme);
    for (const route of themeReflowRoutes) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
        `${theme}: ${route}`,
      ).toBe(true);
      await expect(page.getByRole('main')).toBeVisible();
    }
  }
});

test('issue-20 pages reflow on mobile and retain teaching content in print', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of issue20Routes) {
    await page.goto(route);
    await expect(page.getByRole('main')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      `${route}: mobile`,
    ).toBe(true);

    if (testInfo.project.name !== 'chromium') continue;
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('.locale-pair')).toBeHidden();
    if (route.endsWith('/visuals/artifact-pipeline/')) {
      await expect(page.locator('[data-static-fallback]')).toBeVisible();
    } else {
      await expect(page.locator('main :is(.canonical-code, table)').first()).toBeVisible();
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      `${route}: print`,
    ).toBe(true);
    await page.emulateMedia({ media: 'screen' });
  }
});

test('current incremental pages reflow on mobile and retain teaching content in print', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of [...issue25Routes, ...issue26Routes]) {
    await page.goto(route);
    await expect(page.getByRole('main')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      `${route}: mobile`,
    ).toBe(true);

    if (testInfo.project.name !== 'chromium') continue;
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.locator('.locale-pair')).toBeHidden();
    if (route.endsWith('/visuals/nsight-systems-versus-nsight-compute/') || route.endsWith('/visuals/roofline/')) {
      await expect(page.locator('[data-static-fallback]')).toBeVisible();
    } else {
      await expect(page.locator('main :is(.canonical-code, table)').first()).toBeVisible();
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      `${route}: print`,
    ).toBe(true);
    await page.emulateMedia({ media: 'screen' });
  }
});

test('reduced motion, increased contrast, and forced colors override every theme', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Chromium owns forced-color and contrast media emulation.');
  await page.emulateMedia({ reducedMotion: 'reduce', contrast: 'more', forcedColors: 'active' });

  for (const theme of THEME_IDS) {
    await persistTheme(page, theme);
    const picker = page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' });
    await picker.focus();

    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    expect(await page.evaluate(() => matchMedia('(prefers-contrast: more)').matches)).toBe(true);
    expect(await page.evaluate(() => matchMedia('(forced-colors: active)').matches)).toBe(true);
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundImage)).toBe('none');
    await expect(picker).toHaveCSS('outline-width', '4px');
    expect(
      await page
        .locator('.route-card')
        .first()
        .evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
    ).toBeLessThanOrEqual(0.00001);
  }
});

test('Mobile Safari exposes every theme without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-safari', 'This contract targets the Mobile Safari emulation project.');

  for (const theme of THEME_IDS) {
    await persistTheme(page, theme);
    await page.goto('/en/start/using-the-learning-site/');
    await page.getByRole('button', { name: 'Menu' }).click();
    const mobilePicker = page.locator('.mobile-preferences').getByRole('combobox', { name: 'Select visual theme' });
    await expect(mobilePicker).toBeVisible();
    await expect(mobilePicker).toHaveValue(theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), theme).toBe(true);
  }
});

test('a no-script browser receives the textual Silicon Light fallback', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One static Chromium probe is sufficient for script-independent HTML.');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('http://127.0.0.1:4321/en/');
    await expect(page.locator('html')).not.toHaveAttribute('data-learning-theme', /.+/);
    await expect(page.locator('[data-static-theme-fallback]')).toBeVisible();
    await expect(page.locator('[data-theme-picker]').first()).toBeHidden();
    await expect(page.getByRole('main')).toBeVisible();
    expect(await page.locator('body').evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(
      'rgb(241, 245, 241)',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px`).toBe(true);
  }

  await context.close();
});

test('blocked site storage exposes the static fallback instead of a non-persistent control', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium policy probe covers the storage exception path.');
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new DOMException('Storage blocked for test', 'SecurityError');
      },
    });
  });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:4321/en/');
  await expect(page.locator('html')).not.toHaveAttribute('data-learning-theme', /.+/);
  await expect(page.locator('[data-static-theme-fallback]')).toBeVisible();
  await expect(page.locator('[data-theme-picker]').first()).toBeHidden();

  await context.close();
});

test('a failed preference write restores the default without dropping keyboard focus', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'One Chromium quota probe covers the late storage failure path.');
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const values = new Map<string, string>();
    const storage = {
      getItem(key: string) {
        return values.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        if (key === 'starlight-theme') throw new DOMException('Quota exhausted for test', 'QuotaExceededError');
        values.set(key, value);
      },
      removeItem(key: string) {
        values.delete(key);
      },
    };
    Object.defineProperty(window, 'localStorage', { configurable: true, get: () => storage });
  });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:4321/en/');
  const picker = page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' });
  await picker.focus();
  await picker.press('p');

  await expect(picker).toBeFocused();
  await expect(picker).toHaveValue('silicon-light');
  await expect(page.locator('html')).toHaveAttribute('data-learning-theme', 'silicon-light');
  await expect(page.locator('[data-static-theme-fallback]')).toBeVisible();

  await context.close();
});
