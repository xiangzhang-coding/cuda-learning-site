// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import ex05Project from '../../examples/ex05-coalesced-strided-access/project.json' with { type: 'json' };
import ex06Project from '../../examples/ex06-shared-memory-tile-bank-padding/project.json' with { type: 'json' };
import ex07Project from '../../examples/ex07-streams-events-overlap/project.json' with { type: 'json' };
import ex08Project from '../../examples/ex08-unified-memory-migration/project.json' with { type: 'json' };
import ex09Project from '../../examples/ex09-graph-capture/project.json' with { type: 'json' };
import ex10Project from '../../examples/ex10-ptx-fatbinary-inspection/project.json' with { type: 'json' };
import ex16Project from '../../examples/ex16-sanitizer-defect-suite/project.json' with { type: 'json' };
import { collectBrowserFailures, expectRankedSearchResult } from '../helpers/browser-contract';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const releaseOrigin = new URL(process.env.RELEASE_BASE_URL as string).origin;
const expectedSourceCommit = process.env.RELEASE_SOURCE_COMMIT as string;
const releaseKind = process.env.RELEASE_KIND as 'local' | 'preview' | 'production';
const downloadUrl =
  'https://github.com/xiangzhang-coding/cuda-learning-site/archive/d69f7131acff7f8b1dfcd780b494426b5948735b.zip';
const ex01DownloadUrl =
  'https://github.com/xiangzhang-coding/cuda-learning-site/archive/4f8ad5fca74599eccf8429362cd2abd5e84983e2.zip';
const ex03DownloadUrl =
  'https://github.com/xiangzhang-coding/cuda-learning-site/archive/09e30fba5bc0e9e8dc9ecf54e17806a041d9aee6.zip';
const ex04SourceCommit = 'aeecf72d81d8777d027e6aa84c8614b51e9b0da2';
const ex04SourceUrl =
  `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${ex04SourceCommit}/examples/ex04-error-handling-lifecycle`;
const ex04DownloadUrl =
  `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${ex04SourceCommit}.zip`;
const projectExamples = [
  { route: '/en/examples/coalesced-strided-access/', project: ex05Project },
  { route: '/en/examples/shared-memory-tile-bank-padding/', project: ex06Project },
  { route: '/en/examples/streams-events-overlap/', project: ex07Project },
  { route: '/en/examples/unified-memory-migration/', project: ex08Project },
  { route: '/en/examples/graph-capture/', project: ex09Project },
  { route: '/en/examples/ptx-fatbinary-inspection/', project: ex10Project },
  { route: '/en/examples/sanitizer-defect-suite/', project: ex16Project },
] as const;
const currentCatalogCounts = [
  { route: '/en/labs/', count: 6 },
  { route: '/en/practice/', count: 40 },
  { route: '/en/visuals/', count: 13 },
  { route: '/en/glossary/', count: 125 },
  { route: '/en/sources-and-versions/', count: 50 },
] as const;

test('serves the exact current publication while preserving R1 metadata and production canonicals', async ({ page, request }) => {
  test.setTimeout(300_000);
  const failures = collectBrowserFailures(page, releaseOrigin);
  const releaseResponse = await request.get('/release.json');
  expect(releaseResponse.ok()).toBe(true);
  await expect(releaseResponse.json()).resolves.toMatchObject({
    schemaVersion: 2,
    releaseId: 'R1',
    reviewDate: '2026-08-29',
    sourceCommit: expectedSourceCommit,
    artifactType: 'static-assets',
    canonicalOrigin,
    scope: {
      publicationPairs: 109,
      sourceRoutes: 218,
      practiceBankEntries: 29,
      glossaryTerms: 95,
      sourceRecords: 39,
    },
    evidence: {
      compileChecked: ['EX02', 'LAB02'],
      runtimeVerified: [],
      referenceEnvironments: [],
    },
    knownLimitations: expect.arrayContaining(['R2 and later curriculum material is outside this release.']),
  });

  const publicationResponse = await request.get('/publication.json');
  expect(publicationResponse.ok()).toBe(true);
  await expect(publicationResponse.json()).resolves.toMatchObject({
    schemaVersion: 1,
    publicationId: 'current',
    reviewDate: '2026-08-29',
    sourceCommit: expectedSourceCommit,
    artifactType: 'static-assets',
    canonicalOrigin,
    releaseReview: { latestCompleted: 'R1', next: 'R2', status: 'pending' },
    scope: {
      publicationPairs: 148,
      sourceRoutes: 296,
      learningUnits: [
        'O01', 'O02', 'O03', 'O04', 'O05', 'O06', 'O07', 'O08',
        'F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08',
        'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
        'M09', 'M10', 'M11', 'M12', 'M13', 'M14',
        'M15', 'M16', 'M17', 'M18', 'M19',
        'Q01', 'Q03', 'Q04', 'Q05',
      ],
      runnableExamples: [
        'EX01', 'EX02', 'EX03', 'EX04', 'EX05', 'EX06', 'EX07', 'EX08', 'EX09', 'EX10', 'EX16',
      ],
      labs: ['LAB01', 'LAB02', 'LAB03', 'LAB04', 'LAB05', 'LAB07'],
      visualExplainers: [
        'VIS01', 'VIS02', 'VIS03', 'VIS04', 'VIS05', 'VIS06', 'VIS07', 'VIS08',
        'VIS09', 'VIS19', 'VIS20', 'VIS21', 'VIS22',
      ],
      practiceBankEntries: 40,
      glossaryTerms: 125,
      sourceRecords: 50,
    },
    evidence: {
      compileChecked: ['EX02', 'LAB02'],
      noCompileCheckedClaim: expect.arrayContaining(['EX07', 'EX08', 'EX09', 'EX10']),
      pendingHardwareVerification: expect.arrayContaining(['EX07', 'EX08', 'EX09']),
      runtimeNotApplicable: ['EX10'],
      runtimeVerified: [],
      referenceEnvironments: [],
      performanceObservations: [],
    },
    knownLimitations: expect.arrayContaining([
      'LAB06 has no current public destination.',
      'EX10 artifact-pipeline checks and the separate CUDA 13.3/GCC 14 C++23 probe remain pending committed qualifying records and grant no Compile-Checked claim.',
      'This incremental publication record is not a completed R2 aggregate release review.',
    ]),
  });

  const legalResponse = await request.get('/legal/THIRD_PARTY_NOTICES.md');
  expect(legalResponse.ok()).toBe(true);
  expect(await legalResponse.text()).toContain('`wrangler` | 4.125.0');

  const publishedRoutes = await discoverPublishedRoutes();
  expect(publishedRoutes).toHaveLength(296);
  for (const route of publishedRoutes) {
    const response = await page.goto(route);
    expect(response?.ok(), route).toBe(true);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${canonicalOrigin}${route}`);
  }

  await page.goto('/en/about/');
  await expect(page.locator('main')).toContainText(/148 Publication Pairs/);
  await expect(page.locator('main')).toContainText(/296 source routes/);
  const navigation = page.getByRole('navigation', { name: 'Main' });
  expect(
    await navigation.locator('a[href^="/en/examples/"]').evaluateAll((links) =>
      [...new Set(links.map((link) => new URL(link.getAttribute('href') ?? '', location.origin).pathname))].sort(),
    ),
  ).toEqual([
    '/en/examples/coalesced-strided-access/',
    '/en/examples/environment-report/',
    '/en/examples/error-handling-lifecycle/',
    '/en/examples/graph-capture/',
    '/en/examples/multidimensional-indexing/',
    '/en/examples/ptx-fatbinary-inspection/',
    '/en/examples/sanitizer-defect-suite/',
    '/en/examples/shared-memory-tile-bank-padding/',
    '/en/examples/streams-events-overlap/',
    '/en/examples/unified-memory-migration/',
    '/en/examples/vector-addition/',
  ]);

  expect(currentCatalogCounts.reduce((total, { count }) => total + count, 0)).toBe(234);
  for (const { route, count } of currentCatalogCounts) {
    await page.goto(route);
    await expect(page.locator('[data-resource-card]'), route).toHaveCount(count);
  }

  await page.goto('/en/labs/');
  const labCards = page.locator('[data-resource-card]');
  await expect(labCards).toHaveCount(6);
  expect(await labCards.evaluateAll((cards) => cards.map((card) => card.getAttribute('data-resource-id')))).toEqual([
    'LAB01',
    'LAB02',
    'LAB03',
    'LAB04',
    'LAB05',
    'LAB07',
  ]);

  if (releaseKind === 'production') expect(releaseOrigin).toBe(canonicalOrigin);
  else expect(releaseOrigin).not.toBe(canonicalOrigin);
  expect(failures).toEqual([]);
});

test('supports direct locale navigation, keyboard flow, and relevant bilingual search', async ({ page }) => {
  test.setTimeout(150_000);
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
      query: 'Q01 CPU references tolerances invariants',
      expectedHrefs: ['/en/correctness/cpu-references-tolerances-invariants/'],
    },
    {
      query: 'Q03 Memcheck and invalid memory access',
      expectedHrefs: ['/en/correctness/memcheck-invalid-memory-access/'],
    },
    {
      query: 'Q04 Diagnose with racecheck initcheck synccheck',
      expectedHrefs: ['/en/correctness/racecheck-initcheck-synccheck/'],
    },
    {
      query: 'Q05 Time asynchronous GPU work honestly',
      expectedHrefs: ['/en/correctness/timing-asynchronous-gpu-work/'],
    },
    {
      query: 'EX16 Compute Sanitizer Defect Suite Runnable Example',
      expectedHrefs: ['/en/examples/sanitizer-defect-suite/'],
    },
    {
      query: 'LAB04 Observe Coalescing',
      expectedHrefs: ['/en/labs/observe-coalescing/'],
    },
    {
      query: 'LAB05 Remove Shared-Memory Bank Conflicts',
      expectedHrefs: ['/en/labs/remove-shared-memory-bank-conflicts/'],
    },
    {
      query: 'LAB07 Diagnose Four Sanitizer Failures',
      expectedHrefs: ['/en/labs/diagnose-four-sanitizer-failures/'],
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
    {
      query: 'M09 Pinned Memory and Transfer Overlap',
      expectedHrefs: ['/en/memory/pinned-memory-transfer-overlap/'],
    },
    {
      query: 'M10 Unified Memory and Page Migration',
      expectedHrefs: ['/en/memory/unified-memory-page-migration/'],
    },
    {
      query: 'M11 Stream-Ordered Allocation and Memory Pools',
      expectedHrefs: ['/en/memory/stream-ordered-allocation-memory-pools/'],
    },
    {
      query: 'M12 Cooperative Groups and Composable Synchronization',
      expectedHrefs: ['/en/memory/cooperative-groups/'],
    },
    {
      query: 'M13 Asynchronous Copy and Staged Pipelines',
      expectedHrefs: ['/en/memory/asynchronous-copy-pipelines/'],
    },
    {
      query: 'M14 CUDA Graphs and Repeated Launch Structure',
      expectedHrefs: ['/en/memory/cuda-graphs/'],
    },
    {
      query: 'M15 NVCC Host Device Compilation Flow',
      expectedHrefs: ['/en/toolchain/nvcc-compilation-flow/'],
    },
    {
      query: 'M16 PTX cubin SASS fatbinary',
      expectedHrefs: ['/en/toolchain/ptx-cubin-fatbinary/'],
    },
    {
      query: 'M17 Select Compiler Architecture Targets',
      expectedHrefs: ['/en/toolchain/compiler-architecture-targets/'],
    },
    {
      query: 'M18 Separate Compilation and Device Linking',
      expectedHrefs: [
        '/en/toolchain/separate-compilation-device-linking/',
        '/en/toolchain/separate-compilation-device-linking/exercises/',
        '/en/toolchain/separate-compilation-device-linking/solutions/',
      ],
    },
    {
      query: 'M19 CUDA C++17 C++20 C++23 Dialect Boundaries',
      expectedHrefs: ['/en/toolchain/cpp-dialect-boundaries/'],
    },
    {
      query: 'EX07 Streams Events and Overlap Runnable Example',
      expectedHrefs: ['/en/examples/streams-events-overlap/'],
    },
    {
      query: 'EX08 Unified Memory Migration Runnable Example',
      expectedHrefs: ['/en/examples/unified-memory-migration/'],
    },
    {
      query: 'EX09 CUDA Graph Capture Runnable Example',
      expectedHrefs: ['/en/examples/graph-capture/'],
    },
    {
      query: 'EX10 PTX and Fatbinary Inspection Runnable Example',
      expectedHrefs: ['/en/examples/ptx-fatbinary-inspection/'],
    },
    {
      query: 'VIS08 Managed-Memory Page Migration',
      expectedHrefs: ['/en/visuals/page-migration/'],
    },
    {
      query: 'VIS09 NVCC Artifact Pipeline',
      expectedHrefs: ['/en/visuals/artifact-pipeline/'],
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
  await page.goto('/en/visuals/page-migration/');
  await expect(page.locator('[data-visual-controls]')).toBeHidden();
  await expect(page.locator('[data-static-fallback]')).toBeVisible();
  await page.goto('/en/visuals/artifact-pipeline/');
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
  test.setTimeout(90_000);
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
    '/toolchain/nvcc-compilation-flow/',
    '/en/toolchain/nvcc-compilation-flow/',
    '/toolchain/ptx-cubin-fatbinary/',
    '/en/toolchain/ptx-cubin-fatbinary/',
    '/toolchain/compiler-architecture-targets/',
    '/en/toolchain/compiler-architecture-targets/',
    '/toolchain/separate-compilation-device-linking/',
    '/en/toolchain/separate-compilation-device-linking/',
    '/toolchain/cpp-dialect-boundaries/',
    '/en/toolchain/cpp-dialect-boundaries/',
    '/correctness/cpu-references-tolerances-invariants/',
    '/en/correctness/cpu-references-tolerances-invariants/',
    '/correctness/memcheck-invalid-memory-access/',
    '/en/correctness/memcheck-invalid-memory-access/',
    '/correctness/racecheck-initcheck-synccheck/',
    '/en/correctness/racecheck-initcheck-synccheck/',
    '/correctness/timing-asynchronous-gpu-work/',
    '/en/correctness/timing-asynchronous-gpu-work/',
    '/examples/multidimensional-indexing/',
    '/en/examples/multidimensional-indexing/',
    '/examples/error-handling-lifecycle/',
    '/en/examples/error-handling-lifecycle/',
    '/examples/sanitizer-defect-suite/',
    '/en/examples/sanitizer-defect-suite/',
    '/examples/ptx-fatbinary-inspection/',
    '/en/examples/ptx-fatbinary-inspection/',
    '/visuals/artifact-pipeline/',
    '/en/visuals/artifact-pipeline/',
    '/labs/break-and-repair-indexing/',
    '/en/labs/break-and-repair-indexing/',
    '/labs/observe-coalescing/',
    '/en/labs/observe-coalescing/',
    '/labs/remove-shared-memory-bank-conflicts/',
    '/en/labs/remove-shared-memory-bank-conflicts/',
    '/labs/diagnose-four-sanitizer-failures/',
    '/en/labs/diagnose-four-sanitizer-failures/',
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
    '/en/visuals/page-migration/',
    '/en/visuals/artifact-pipeline/',
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
  test.setTimeout(120_000);
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

  for (const { route, project } of projectExamples) {
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
      `${project.evidence.expectedObservations.length} ${project.id === 'EX10' ? 'artifact expectations' : 'declared expectations'}`,
    );
    await expect(page.locator('meta[name="cuda:recorded-observations"]')).toHaveAttribute('content', 'none');
    const canonicalRanges = Object.keys(project.ranges);
    const canonicalCode = page.locator(`[data-canonical-example="${project.id}"]`);
    await expect(canonicalCode).toHaveCount(canonicalRanges.length);
    expect(await canonicalCode.evaluateAll((figures) => figures.map((figure) => figure.getAttribute('data-canonical-range'))))
      .toEqual(canonicalRanges);
  }

  const archives = new Map<string, Buffer>();
  for (const { project } of projectExamples) {
    // EX10 stays link-only until retained evidence repins its canonical archive.
    if (project.id === 'EX10') continue;
    let archive = archives.get(project.downloadUrl);
    if (!archive) {
      const response = await request.get(project.downloadUrl);
      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toMatch(/zip|octet-stream/);
      archive = await response.body();
      expect(archive.subarray(0, 2).toString('ascii')).toBe('PK');
      archives.set(project.downloadUrl, archive);
    }
    for (const relativePath of new Set([
      ...project.build.inputs,
      ...project.build.hostTestInputs,
      ...project.build.contractFiles,
    ])) {
      expect(
        archive.includes(Buffer.from(`/${project.root}/${relativePath}`)),
        `${project.id} archive contains ${relativePath}`,
      ).toBe(true);
    }
  }

  const missing = await request.get('/api/publication-smoke-must-not-exist');
  expect(missing.status()).toBe(404);
  expect(failures).toEqual([]);
});
