// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { THEME_IDS, THEME_STORAGE_KEY } from '../../src/theme-contract';
import { collectBrowserFailures, expectRankedSearchResult } from '../helpers/browser-contract';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

test('all published routes load without browser errors', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const route of await discoverPublishedRoutes()) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await expect(page.locator('site-search input'), `${route} initializes static search`).toHaveCount(1);
    expect(errors, route).toEqual([]);
  }
});

test('locale controls keep the learner on the counterpart page', async ({ page }, testInfo) => {
  for (const { zh, en } of [
    { zh: '/start/using-the-learning-site/', en: '/en/start/using-the-learning-site/' },
    { zh: '/start/evidence-status/', en: '/en/start/evidence-status/' },
    { zh: '/start/environment-manifest/', en: '/en/start/environment-manifest/' },
    { zh: '/foundations/first-cuda-kernel/', en: '/en/foundations/first-cuda-kernel/' },
    { zh: '/foundations/execution-hierarchy/', en: '/en/foundations/execution-hierarchy/' },
    { zh: '/foundations/multidimensional-indexing/', en: '/en/foundations/multidimensional-indexing/' },
    { zh: '/foundations/host-device-lifecycle/', en: '/en/foundations/host-device-lifecycle/' },
    { zh: '/foundations/asynchronous-errors/', en: '/en/foundations/asynchronous-errors/' },
    { zh: '/foundations/asynchronous-errors/exercises/', en: '/en/foundations/asynchronous-errors/exercises/' },
    { zh: '/foundations/asynchronous-errors/solutions/', en: '/en/foundations/asynchronous-errors/solutions/' },
    { zh: '/foundations/compute-capability/', en: '/en/foundations/compute-capability/' },
    { zh: '/foundations/compute-capability/exercises/', en: '/en/foundations/compute-capability/exercises/' },
    { zh: '/foundations/compute-capability/solutions/', en: '/en/foundations/compute-capability/solutions/' },
    { zh: '/foundations/runtime-driver-api/', en: '/en/foundations/runtime-driver-api/' },
    { zh: '/foundations/runtime-driver-api/exercises/', en: '/en/foundations/runtime-driver-api/exercises/' },
    { zh: '/foundations/runtime-driver-api/solutions/', en: '/en/foundations/runtime-driver-api/solutions/' },
    { zh: '/foundations/launch-geometry/', en: '/en/foundations/launch-geometry/' },
    { zh: '/foundations/launch-geometry/exercises/', en: '/en/foundations/launch-geometry/exercises/' },
    { zh: '/foundations/launch-geometry/solutions/', en: '/en/foundations/launch-geometry/solutions/' },
    { zh: '/examples/vector-addition/', en: '/en/examples/vector-addition/' },
    { zh: '/examples/multidimensional-indexing/', en: '/en/examples/multidimensional-indexing/' },
    { zh: '/examples/error-handling-lifecycle/', en: '/en/examples/error-handling-lifecycle/' },
    { zh: '/labs/', en: '/en/labs/' },
    { zh: '/labs/vector-addition/', en: '/en/labs/vector-addition/' },
    { zh: '/labs/break-and-repair-indexing/', en: '/en/labs/break-and-repair-indexing/' },
    { zh: '/visuals/', en: '/en/visuals/' },
    { zh: '/visuals/kernel-journey/', en: '/en/visuals/kernel-journey/' },
    { zh: '/visuals/indexing/', en: '/en/visuals/indexing/' },
    { zh: '/practice/', en: '/en/practice/' },
    { zh: '/glossary/', en: '/en/glossary/' },
    { zh: '/sources-and-versions/', en: '/en/sources-and-versions/' },
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
  test.setTimeout(60_000);
  for (const scenario of [
    { route: '/', button: /搜索/, query: '双语发布对', localePrefix: '/', expectedHrefs: ['/start/using-the-learning-site/', '/practice/', '/glossary/'] },
    { route: '/', button: /搜索/, query: '环境清单', localePrefix: '/', expectedHrefs: ['/start/environment-manifest/', '/labs/record-cuda-environment/', '/practice/', '/glossary/'] },
    { route: '/', button: /搜索/, query: '内存事务', localePrefix: '/', expectedHrefs: ['/visuals/kernel-journey/'] },
    { route: '/', button: /搜索/, query: '第一个 CUDA kernel', localePrefix: '/', expectedHrefs: ['/foundations/first-cuda-kernel/'] },
    { route: '/', button: /搜索/, query: '理解 CUDA 执行层次', localePrefix: '/', expectedHrefs: ['/foundations/execution-hierarchy/'] },
    { route: '/', button: /搜索/, query: '多维索引 边界 正确性合同', localePrefix: '/', expectedHrefs: ['/foundations/multidimensional-indexing/', '/examples/multidimensional-indexing/'] },
    { route: '/', button: /搜索/, query: '显式 host-device 资源生命周期', localePrefix: '/', expectedHrefs: ['/foundations/host-device-lifecycle/'] },
    { route: '/', button: /搜索/, query: 'CUDA 错误为何常常延后暴露', localePrefix: '/', expectedHrefs: ['/foundations/asynchronous-errors/', '/foundations/asynchronous-errors/exercises/', '/foundations/asynchronous-errors/solutions/'] },
    { route: '/', button: /搜索/, query: 'Launch geometry 是先于速度的正确性与资源决策', localePrefix: '/', expectedHrefs: ['/foundations/launch-geometry/', '/foundations/launch-geometry/exercises/', '/foundations/launch-geometry/solutions/'] },
    { route: '/', button: /搜索/, query: '错误处理生命周期可运行示例', localePrefix: '/', expectedHrefs: ['/examples/error-handling-lifecycle/'] },
    { route: '/', button: /搜索/, query: '运行并验证向量加法', localePrefix: '/', expectedHrefs: ['/labs/vector-addition/'] },
    { route: '/', button: /搜索/, query: '可复现命令记录', localePrefix: '/', expectedHrefs: ['/start/linux-command-line/', '/glossary/'] },
    { route: '/', button: /搜索/, query: '基准环境候选配置', localePrefix: '/', expectedHrefs: ['/start/reference-environment-candidate/', '/labs/record-cuda-environment/'] },
    { route: '/', button: /搜索/, query: 'TERM-034 容差', localePrefix: '/', expectedHrefs: ['/glossary/'] },
    { route: '/en/', button: /Search/, query: 'Publication Pair', localePrefix: '/en/', expectedHrefs: ['/en/start/using-the-learning-site/', '/en/practice/', '/en/glossary/'] },
    { route: '/en/', button: /Search/, query: 'Recording Evidence Honestly', localePrefix: '/en/', expectedHrefs: ['/en/start/evidence-status/'] },
    { route: '/en/', button: /Search/, query: 'row-major data index', localePrefix: '/en/', expectedHrefs: ['/en/visuals/indexing/'] },
    { route: '/en/', button: /Search/, query: 'first CUDA kernel', localePrefix: '/en/', expectedHrefs: ['/en/foundations/first-cuda-kernel/'] },
    { route: '/en/', button: /Search/, query: 'Understanding the CUDA Execution Hierarchy', localePrefix: '/en/', expectedHrefs: ['/en/foundations/execution-hierarchy/'] },
    { route: '/en/', button: /Search/, query: 'multidimensional indexing bounds correctness contract', localePrefix: '/en/', expectedHrefs: ['/en/foundations/multidimensional-indexing/', '/en/examples/multidimensional-indexing/'] },
    { route: '/en/', button: /Search/, query: 'explicit host-device resource lifecycle', localePrefix: '/en/', expectedHrefs: ['/en/foundations/host-device-lifecycle/'] },
    { route: '/en/', button: /Search/, query: 'Compute Capability Is a Feature Contract', localePrefix: '/en/', expectedHrefs: ['/en/foundations/compute-capability/', '/en/foundations/compute-capability/exercises/', '/en/foundations/compute-capability/solutions/'] },
    { route: '/en/', button: /Search/, query: 'Distinguish CUDA Runtime API and Driver API Roles', localePrefix: '/en/', expectedHrefs: ['/en/foundations/runtime-driver-api/', '/en/foundations/runtime-driver-api/exercises/', '/en/foundations/runtime-driver-api/solutions/'] },
    { route: '/en/', button: /Search/, query: 'Break and Repair Indexing', localePrefix: '/en/', expectedHrefs: ['/en/labs/break-and-repair-indexing/'] },
    { route: '/en/', button: /Search/, query: 'Run and Verify Vector Addition', localePrefix: '/en/', expectedHrefs: ['/en/labs/vector-addition/'] },
    { route: '/en/', button: /Search/, query: 'arithmetic intensity occupancy', localePrefix: '/en/', expectedHrefs: ['/en/start/architecture-refresher/', '/en/start/architecture-refresher/exercises/', '/en/start/architecture-refresher/solutions/'] },
    { route: '/en/', button: /Search/, query: 'Environment Report Runnable Example', localePrefix: '/en/', expectedHrefs: ['/en/examples/environment-report/'] },
    { route: '/en/', button: /Search/, query: 'SRC-WEB-003 Pagefind 1.5.2', localePrefix: '/en/', expectedHrefs: ['/en/sources-and-versions/'] },
  ]) {
    await expectRankedSearchResult(page, scenario);
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
  for (const route of [
    '/',
    '/en/',
    '/start/using-the-learning-site/',
    '/en/start/using-the-learning-site/',
    '/start/evidence-status/',
    '/en/start/evidence-status/',
    '/start/environment-manifest/',
    '/en/start/environment-manifest/',
    '/foundations/first-cuda-kernel/',
    '/en/foundations/first-cuda-kernel/',
    '/foundations/first-cuda-kernel/exercises/',
    '/en/foundations/first-cuda-kernel/exercises/',
    '/foundations/first-cuda-kernel/solutions/',
    '/en/foundations/first-cuda-kernel/solutions/',
    '/foundations/execution-hierarchy/',
    '/en/foundations/execution-hierarchy/',
    '/foundations/execution-hierarchy/exercises/',
    '/en/foundations/execution-hierarchy/exercises/',
    '/foundations/execution-hierarchy/solutions/',
    '/en/foundations/execution-hierarchy/solutions/',
    '/foundations/multidimensional-indexing/',
    '/en/foundations/multidimensional-indexing/',
    '/foundations/multidimensional-indexing/exercises/',
    '/en/foundations/multidimensional-indexing/exercises/',
    '/foundations/multidimensional-indexing/solutions/',
    '/en/foundations/multidimensional-indexing/solutions/',
    '/foundations/host-device-lifecycle/',
    '/en/foundations/host-device-lifecycle/',
    '/foundations/host-device-lifecycle/exercises/',
    '/en/foundations/host-device-lifecycle/exercises/',
    '/foundations/host-device-lifecycle/solutions/',
    '/en/foundations/host-device-lifecycle/solutions/',
    '/foundations/asynchronous-errors/',
    '/en/foundations/asynchronous-errors/',
    '/foundations/compute-capability/',
    '/en/foundations/compute-capability/',
    '/foundations/runtime-driver-api/',
    '/en/foundations/runtime-driver-api/',
    '/foundations/launch-geometry/',
    '/en/foundations/launch-geometry/',
    '/examples/vector-addition/',
    '/en/examples/vector-addition/',
    '/examples/multidimensional-indexing/',
    '/en/examples/multidimensional-indexing/',
    '/examples/error-handling-lifecycle/',
    '/en/examples/error-handling-lifecycle/',
    '/labs/',
    '/en/labs/',
    '/labs/vector-addition/',
    '/en/labs/vector-addition/',
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
    '/visuals/',
    '/en/visuals/',
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
  ]) {
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

  for (const route of ['/foundations/first-cuda-kernel/', '/en/foundations/first-cuda-kernel/', '/foundations/first-cuda-kernel/exercises/', '/en/foundations/first-cuda-kernel/exercises/', '/foundations/first-cuda-kernel/solutions/', '/en/foundations/first-cuda-kernel/solutions/', '/foundations/execution-hierarchy/', '/en/foundations/execution-hierarchy/', '/foundations/multidimensional-indexing/', '/en/foundations/multidimensional-indexing/', '/foundations/host-device-lifecycle/', '/en/foundations/host-device-lifecycle/', '/examples/multidimensional-indexing/', '/en/examples/multidimensional-indexing/', '/labs/vector-addition/', '/en/labs/vector-addition/']) {
    await page.goto(route);
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('main')).toBeVisible();
    if (!route.includes('/exercises/') && !route.includes('/solutions/') && !route.includes('/execution-hierarchy/')) {
      await expect(page.locator('.canonical-code').first()).toBeVisible();
    }
    await expect(page.locator('.locale-pair')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    await page.emulateMedia({ media: 'screen' });
  }
});
