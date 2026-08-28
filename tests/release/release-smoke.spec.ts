// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import ex05Project from '../../examples/ex05-coalesced-strided-access/project.json' with { type: 'json' };
import ex06Project from '../../examples/ex06-shared-memory-tile-bank-padding/project.json' with { type: 'json' };
import { collectBrowserFailures, expectRankedSearchResult } from '../helpers/browser-contract';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const releaseOrigin = new URL(process.env.RELEASE_BASE_URL as string).origin;
const expectedSourceCommit = process.env.RELEASE_SOURCE_COMMIT as string;
const releaseKind = process.env.RELEASE_KIND as 'local' | 'preview' | 'production';
const downloadUrl =
  'https://github.com/xiangzhang-coding/cuda-learning-site/archive/d69f7131acff7f8b1dfcd780b494426b5948735b.zip';
const ex01DownloadUrl =
  'https://github.com/xiangzhang-coding/cuda-learning-site/archive/23382602978cf99da8e9cbfff275f5f8fb8e0f47.zip';
const ex03DownloadUrl =
  'https://github.com/xiangzhang-coding/cuda-learning-site/archive/09e30fba5bc0e9e8dc9ecf54e17806a041d9aee6.zip';
const ex04SourceCommit = 'aeecf72d81d8777d027e6aa84c8614b51e9b0da2';
const ex04SourceUrl =
  `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${ex04SourceCommit}/examples/ex04-error-handling-lifecycle`;
const ex04DownloadUrl =
  `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${ex04SourceCommit}.zip`;
const issue15Examples = [
  { route: '/en/examples/coalesced-strided-access/', project: ex05Project },
  { route: '/en/examples/shared-memory-tile-bank-padding/', project: ex06Project },
] as const;

test('serves the exact static release with production canonical metadata and no browser errors', async ({ page, request }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  const releaseResponse = await request.get('/release.json');
  expect(releaseResponse.ok()).toBe(true);
  await expect(releaseResponse.json()).resolves.toMatchObject({
    sourceCommit: expectedSourceCommit,
    artifactType: 'static-assets',
    canonicalOrigin,
  });

  const legalResponse = await request.get('/legal/THIRD_PARTY_NOTICES.md');
  expect(legalResponse.ok()).toBe(true);
  expect(await legalResponse.text()).toContain('`wrangler` | 4.125.0');

  for (const route of [
    '/',
    '/en/',
    '/start/using-the-learning-site/',
    '/en/start/using-the-learning-site/',
    '/start/reference-environment-candidate/',
    '/en/start/reference-environment-candidate/',
    '/foundations/execution-hierarchy/',
    '/en/foundations/execution-hierarchy/',
    '/foundations/multidimensional-indexing/',
    '/en/foundations/multidimensional-indexing/',
    '/foundations/host-device-lifecycle/',
    '/en/foundations/host-device-lifecycle/',
    '/foundations/asynchronous-errors/',
    '/en/foundations/asynchronous-errors/',
    '/foundations/compute-capability/',
    '/en/foundations/compute-capability/',
    '/foundations/runtime-driver-api/',
    '/en/foundations/runtime-driver-api/',
    '/foundations/launch-geometry/',
    '/en/foundations/launch-geometry/',
    '/memory/address-spaces/',
    '/en/memory/address-spaces/',
    '/memory/coalescing-transactions/',
    '/en/memory/coalescing-transactions/',
    '/memory/shared-memory-tiling/',
    '/en/memory/shared-memory-tiling/',
    '/memory/bank-conflicts-layouts/',
    '/en/memory/bank-conflicts-layouts/',
    '/memory/synchronization-scopes/',
    '/en/memory/synchronization-scopes/',
    '/memory/warp-divergence-reconvergence/',
    '/en/memory/warp-divergence-reconvergence/',
    '/memory/stream-ordering/',
    '/en/memory/stream-ordering/',
    '/memory/event-dependencies-timing/',
    '/en/memory/event-dependencies-timing/',
    '/examples/environment-report/',
    '/en/examples/environment-report/',
    '/examples/multidimensional-indexing/',
    '/en/examples/multidimensional-indexing/',
    '/examples/error-handling-lifecycle/',
    '/en/examples/error-handling-lifecycle/',
    '/examples/coalesced-strided-access/',
    '/en/examples/coalesced-strided-access/',
    '/examples/shared-memory-tile-bank-padding/',
    '/en/examples/shared-memory-tile-bank-padding/',
    '/labs/record-cuda-environment/',
    '/en/labs/record-cuda-environment/',
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
    '/visuals/memory-transactions/',
    '/en/visuals/memory-transactions/',
    '/visuals/shared-memory-banks/',
    '/en/visuals/shared-memory-banks/',
    '/visuals/memory-hierarchy-lifetime/',
    '/en/visuals/memory-hierarchy-lifetime/',
    '/visuals/warp-divergence/',
    '/en/visuals/warp-divergence/',
    '/visuals/stream-event-dependencies/',
    '/en/visuals/stream-event-dependencies/',
  ]) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${canonicalOrigin}${route}`);
  }

  if (releaseKind === 'production') expect(releaseOrigin).toBe(canonicalOrigin);
  else expect(releaseOrigin).not.toBe(canonicalOrigin);
  expect(failures).toEqual([]);
});

test('supports direct locale navigation, keyboard flow, and relevant bilingual search', async ({ page }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.goto('/en/start/using-the-learning-site/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.sl-skip-link')).toBeFocused();
  const glossaryLink = page.getByRole('link', { name: 'Glossary', exact: true }).first();
  await expect(glossaryLink).toBeVisible();
  await glossaryLink.click();
  await expect(page).toHaveURL(/\/en\/glossary\/$/);
  await page.goto('/en/start/using-the-learning-site/');
  await page.locator('[data-locale-counterpart]').click();
  await expect(page).toHaveURL(/\/start\/using-the-learning-site\/$/);
  await page.waitForLoadState('networkidle');

  await expectRankedSearchResult(page, {
    route: '/',
    button: /搜索/,
    query: '运行并验证向量加法',
    expectedHrefs: ['/labs/vector-addition/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'row-major data index',
    expectedHrefs: ['/en/visuals/indexing/', '/en/foundations/multidimensional-indexing/'],
  });
  await expectRankedSearchResult(page, {
    route: '/',
    button: /搜索/,
    query: '显式 host-device 资源生命周期',
    expectedHrefs: ['/foundations/host-device-lifecycle/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'Understanding the CUDA Execution Hierarchy',
    expectedHrefs: ['/en/foundations/execution-hierarchy/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'SRC-WEB-003 Pagefind 1.5.2',
    expectedHrefs: ['/en/sources-and-versions/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'Reference Environment candidate',
    expectedHrefs: [
      '/en/start/reference-environment-candidate/',
      '/en/start/reference-environment-candidate/exercises/',
      '/en/start/reference-environment-candidate/solutions/',
      '/en/labs/record-cuda-environment/',
    ],
  });
  await expectRankedSearchResult(page, {
    route: '/',
    button: /搜索/,
    query: 'CUDA 错误为何常常延后暴露',
    expectedHrefs: [
      '/foundations/asynchronous-errors/',
      '/foundations/asynchronous-errors/exercises/',
      '/foundations/asynchronous-errors/solutions/',
    ],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'Compute Capability Is a Feature Contract',
    expectedHrefs: [
      '/en/foundations/compute-capability/',
      '/en/foundations/compute-capability/exercises/',
      '/en/foundations/compute-capability/solutions/',
    ],
  });
  await expectRankedSearchResult(page, {
    route: '/',
    button: /搜索/,
    query: '破坏并修复索引',
    expectedHrefs: ['/labs/break-and-repair-indexing/'],
  });
  await expectRankedSearchResult(page, {
    route: '/en/',
    button: /Search/,
    query: 'Error Handling Lifecycle Runnable Example',
    expectedHrefs: ['/en/examples/error-handling-lifecycle/'],
  });
  for (const scenario of [
    {
      query: 'Coalesced and Strided Access Runnable Example',
      expectedHrefs: ['/en/examples/coalesced-strided-access/'],
    },
    {
      query: 'Shared-Memory Tile Bank Padding Runnable Example',
      expectedHrefs: ['/en/examples/shared-memory-tile-bank-padding/'],
    },
    {
      query: 'Memory-request Segment Grouping',
      expectedHrefs: ['/en/visuals/memory-transactions/'],
    },
    {
      query: 'Shared-memory Bank Mapping',
      expectedHrefs: ['/en/visuals/shared-memory-banks/'],
    },
    {
      query: 'Memory Hierarchy Ownership Lifetime',
      expectedHrefs: ['/en/visuals/memory-hierarchy-lifetime/'],
    },
    {
      query: 'Warp Divergence and Logical Join',
      expectedHrefs: ['/en/visuals/warp-divergence/'],
    },
    {
      query: 'Streams replace a global-order mental model',
      expectedHrefs: ['/en/memory/stream-ordering/'],
    },
    {
      query: 'Stream and Event Dependency Traces',
      expectedHrefs: ['/en/visuals/stream-event-dependencies/'],
    },
  ] as const) {
    await expectRankedSearchResult(page, {
      route: '/en/',
      button: /Search/,
      ...scenario,
    });
  }

  await page.goto('/en/practice/');
  const index = page.locator('cuda-resource-index');
  await index.locator('[data-resource-query]').fill('manifest');
  await index.locator('[data-resource-filter="type"]').selectOption('correctness-debugging');
  await index.locator('[data-resource-filter="relation"]').selectOption('O03');
  await expect(index.locator('[data-resource-card]:visible')).toHaveCount(1);
  await expect(index.locator('[data-resource-card]:visible')).toHaveAttribute('data-resource-id', 'PB-R0-002');
  expect(failures).toEqual([]);
});

test('persists all three themes and preserves reduced-motion and print fallbacks', async ({ page }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/en/start/using-the-learning-site/');
  const picker = page.getByRole('banner').getByRole('combobox', { name: 'Select visual theme' });

  for (const theme of ['silicon-light', 'profiler-dark', 'blueprint']) {
    await picker.selectOption(theme);
    await expect(page.locator('html')).toHaveAttribute('data-learning-theme', theme);
  }
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-learning-theme', 'blueprint');
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await page.goto('/en/');
  expect(
    await page.locator('.route-card').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration)),
  ).toBeLessThanOrEqual(0.00001);

  await page.goto('/en/visuals/kernel-journey/');
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
  await expect(page.locator('[data-visual-controls]')).toBeHidden();
  await expect(page.locator('[data-static-fallback]')).toBeVisible();
  for (const { route, controls } of [
    { route: '/en/foundations/asynchronous-errors/', controls: '[data-timeline-controls]' },
    { route: '/en/foundations/launch-geometry/', controls: '[data-block-shape-controls]' },
  ]) {
    await page.goto(route);
    await expect(page.locator(controls)).toBeHidden();
    await expect(page.locator('[data-static-fallback]')).toBeVisible();
  }
  expect(failures).toEqual([]);
});

test('keeps mobile pages and no-script teaching fallbacks complete', async ({ browser, page }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    '/labs/record-cuda-environment/',
    '/en/labs/record-cuda-environment/',
    '/labs/vector-addition/',
    '/en/labs/vector-addition/',
    '/start/reference-environment-candidate/',
    '/en/start/reference-environment-candidate/',
    '/foundations/execution-hierarchy/',
    '/en/foundations/execution-hierarchy/',
    '/foundations/multidimensional-indexing/',
    '/en/foundations/multidimensional-indexing/',
    '/foundations/host-device-lifecycle/',
    '/en/foundations/host-device-lifecycle/',
    '/foundations/asynchronous-errors/',
    '/en/foundations/asynchronous-errors/',
    '/foundations/compute-capability/',
    '/en/foundations/compute-capability/',
    '/foundations/runtime-driver-api/',
    '/en/foundations/runtime-driver-api/',
    '/foundations/launch-geometry/',
    '/en/foundations/launch-geometry/',
    '/memory/synchronization-scopes/',
    '/en/memory/synchronization-scopes/',
    '/memory/warp-divergence-reconvergence/',
    '/en/memory/warp-divergence-reconvergence/',
    '/memory/stream-ordering/',
    '/en/memory/stream-ordering/',
    '/memory/event-dependencies-timing/',
    '/en/memory/event-dependencies-timing/',
    '/examples/multidimensional-indexing/',
    '/en/examples/multidimensional-indexing/',
    '/examples/error-handling-lifecycle/',
    '/en/examples/error-handling-lifecycle/',
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
  ]) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
  expect(failures).toEqual([]);

  const staticContext = await browser.newContext({
    baseURL: process.env.RELEASE_BASE_URL,
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const staticPage = await staticContext.newPage();
  const embeddedFallbacks: Record<string, { controls: string; evidence: string; visualId: string }> = {
    '/en/foundations/asynchronous-errors/': {
      controls: '[data-timeline-controls]',
      evidence: '[data-no-evidence]',
      visualId: 'VIS19',
    },
    '/en/foundations/compute-capability/': {
      controls: '[data-capability-controls]',
      evidence: '[data-no-evidence]',
      visualId: 'VIS20',
    },
    '/en/foundations/runtime-driver-api/': {
      controls: '[data-api-boundary-controls]',
      evidence: '[data-no-evidence]',
      visualId: 'VIS21',
    },
    '/en/foundations/launch-geometry/': {
      controls: '[data-block-shape-controls]',
      evidence: '[data-no-evidence]',
      visualId: 'VIS22',
    },
  };
  for (const route of [
    '/visuals/kernel-journey/',
    '/en/visuals/indexing/',
    '/en/visuals/memory-transactions/',
    '/en/visuals/shared-memory-banks/',
    '/en/visuals/memory-hierarchy-lifetime/',
    '/en/visuals/warp-divergence/',
    '/en/visuals/stream-event-dependencies/',
    '/foundations/multidimensional-indexing/',
    '/en/foundations/multidimensional-indexing/',
    ...Object.keys(embeddedFallbacks),
    '/start/reference-environment-candidate/',
    '/en/start/reference-environment-candidate/',
    '/practice/',
    '/en/glossary/',
  ]) {
    const response = await staticPage.goto(route);
    expect(response?.ok(), route).toBe(true);
    if (route.includes('/visuals/') || route.includes('/foundations/multidimensional-indexing/')) {
      await expect(staticPage.locator('[data-visual-controls]')).toBeHidden();
      await expect(staticPage.locator('[data-static-fallback]')).toBeVisible();
      await expect(staticPage.locator('[data-no-evidence]')).toBeVisible();
    } else if (embeddedFallbacks[route]) {
      const embedded = embeddedFallbacks[route];
      const visual = staticPage.locator(`[data-visual-id="${embedded.visualId}"]`);
      await expect(visual.locator(embedded.controls)).toBeHidden();
      await expect(visual.locator('[data-visual-controls]')).toBeHidden();
      await expect(visual.locator('[data-static-fallback]')).toBeVisible();
      await expect(visual.locator(embedded.evidence)).toBeVisible();
    } else if (route.includes('reference-environment-candidate')) {
      await expect(staticPage.locator('[data-compatibility-controls]')).toBeHidden();
      await expect(staticPage.locator('[data-static-fallback] tbody tr')).toHaveCount(3);
    } else {
      await expect(staticPage.locator('[data-resource-controls]')).toBeHidden();
      await expect(staticPage.locator('[data-resource-card]').first()).toBeVisible();
    }
    expect(await staticPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }
  await staticContext.close();
});

test('serves immutable canonical downloads, preserves evidence boundaries, and returns a real 404', async ({ page, request }) => {
  const failures = collectBrowserFailures(page, releaseOrigin);
  await page.goto('/en/examples/vector-addition/');
  await expect(page.locator(`a[href="${downloadUrl}"]`)).toBeVisible();

  const download = await request.get(downloadUrl);
  expect(download.ok()).toBe(true);
  expect(download.headers()['content-type']).toMatch(/zip|octet-stream/);
  expect((await download.body()).subarray(0, 2).toString('ascii')).toBe('PK');

  await page.goto('/en/examples/environment-report/');
  await expect(page.locator(`a[href="${ex01DownloadUrl}"]`)).toBeVisible();
  const ex01Download = await request.get(ex01DownloadUrl);
  expect(ex01Download.ok()).toBe(true);
  expect(ex01Download.headers()['content-type']).toMatch(/zip|octet-stream/);
  expect((await ex01Download.body()).subarray(0, 2).toString('ascii')).toBe('PK');

  await page.goto('/en/examples/multidimensional-indexing/');
  await expect(page.locator(`a[href="${ex03DownloadUrl}"]`)).toBeVisible();
  const ex03Download = await request.get(ex03DownloadUrl);
  expect(ex03Download.ok()).toBe(true);
  expect(ex03Download.headers()['content-type']).toMatch(/zip|octet-stream/);
  expect((await ex03Download.body()).subarray(0, 2).toString('ascii')).toBe('PK');

  await page.goto('/en/examples/error-handling-lifecycle/');
  await expect(page.locator(`a[href="${ex04SourceUrl}"]`)).toBeVisible();
  await expect(page.locator(`a[href="${ex04DownloadUrl}"]`)).toBeVisible();
  const ex04Download = await request.get(ex04DownloadUrl);
  expect(ex04Download.ok()).toBe(true);
  expect(ex04Download.headers()['content-type']).toMatch(/zip|octet-stream/);
  const ex04Archive = await ex04Download.body();
  expect(ex04Archive.subarray(0, 2).toString('ascii')).toBe('PK');
  expect(
    ex04Archive.includes(Buffer.from('/examples/ex04-error-handling-lifecycle/src/error_handling_lifecycle.cu')),
  ).toBe(true);

  for (const { route, project } of issue15Examples) {
    expect(project.sourceCommit).toMatch(/^[0-9a-f]{40}$/);
    expect(project.sourceUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${project.sourceCommit}/${project.root}`,
    );
    expect(project.downloadUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${project.sourceCommit}.zip`,
    );
    expect(project.evidence.compilation).toEqual([]);
    expect(project.evidence.recordedObservations).toEqual([]);

    await page.goto(route);
    await expect(page.locator(`a[href="${project.sourceUrl}"]`)).toBeVisible();
    await expect(page.locator(`a[href="${project.downloadUrl}"]`)).toBeVisible();
    await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute('content', 'none');
    await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute(
      'content',
      project.evidence.runtime,
    );
    await expect(page.locator('meta[name="cuda:expected-observations"]')).toHaveAttribute(
      'content',
      `${project.evidence.expectedObservations.length} declared expectations`,
    );
    await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
    const canonicalRanges = Object.keys(project.ranges);
    const canonicalCode = page.locator(`[data-canonical-example="${project.id}"]`);
    await expect(canonicalCode).toHaveCount(canonicalRanges.length);
    expect(await canonicalCode.evaluateAll((figures) => figures.map((figure) => figure.getAttribute('data-canonical-range'))))
      .toEqual(canonicalRanges);
  }

  for (const issue15DownloadUrl of new Set(issue15Examples.map(({ project }) => project.downloadUrl))) {
    const response = await request.get(issue15DownloadUrl);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-type']).toMatch(/zip|octet-stream/);
    expect((await response.body()).subarray(0, 2).toString('ascii')).toBe('PK');
  }

  const missing = await request.get('/api/r0-smoke-must-not-exist');
  expect(missing.status()).toBe(404);
  expect(failures).toEqual([]);
});
