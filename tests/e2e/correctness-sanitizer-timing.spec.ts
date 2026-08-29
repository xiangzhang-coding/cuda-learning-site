// SPDX-License-Identifier: Apache-2.0
import { expect, test } from '@playwright/test';

import { collectBrowserFailures } from '../helpers/browser-contract';
import { discoverPublishedRoutes } from '../helpers/publication-routes';

const canonicalOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';
const ex16Ranges = [
  'memcheck-defect',
  'memcheck-corrected',
  'racecheck-defect',
  'racecheck-corrected',
  'initcheck-defect',
  'initcheck-corrected',
  'synccheck-defect',
  'synccheck-corrected',
] as const;

type PublicationContract = {
  id: 'Q01' | 'Q03' | 'Q04' | 'Q05' | 'EX16' | 'LAB04' | 'LAB05' | 'LAB07';
  pairId: string;
  route: string;
  resourceKind: 'learning-unit' | 'runnable-example' | 'lab';
  prerequisites: string;
  runtimeEvidence: 'none' | 'Pending Hardware Verification';
  expectedObservations?: string;
  canonicalExample?: 'EX05' | 'EX06' | 'EX16';
  canonicalRanges?: readonly string[];
};

const issue17Publications: readonly PublicationContract[] = [
  {
    id: 'Q01',
    pairId: 'q01',
    route: '/correctness/cpu-references-tolerances-invariants/',
    resourceKind: 'learning-unit',
    prerequisites: 'F04,O04',
    runtimeEvidence: 'none',
  },
  {
    id: 'Q03',
    pairId: 'q03',
    route: '/correctness/memcheck-invalid-memory-access/',
    resourceKind: 'learning-unit',
    prerequisites: 'F05,Q01',
    runtimeEvidence: 'none',
  },
  {
    id: 'Q04',
    pairId: 'q04',
    route: '/correctness/racecheck-initcheck-synccheck/',
    resourceKind: 'learning-unit',
    prerequisites: 'M05,M06,Q03',
    runtimeEvidence: 'none',
  },
  {
    id: 'Q05',
    pairId: 'q05',
    route: '/correctness/timing-asynchronous-gpu-work/',
    resourceKind: 'learning-unit',
    prerequisites: 'M08,Q01',
    runtimeEvidence: 'none',
  },
  {
    id: 'EX16',
    pairId: 'ex16',
    route: '/examples/sanitizer-defect-suite/',
    resourceKind: 'runnable-example',
    prerequisites: 'Q03,Q04',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '4 declared expectations',
    canonicalExample: 'EX16',
    canonicalRanges: ex16Ranges,
  },
  {
    id: 'LAB04',
    pairId: 'lab04',
    route: '/labs/observe-coalescing/',
    resourceKind: 'lab',
    prerequisites: 'M02,Q05',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '3 declared expectations',
    canonicalExample: 'EX05',
    canonicalRanges: ['access-kernel', 'scenario-loop'],
  },
  {
    id: 'LAB05',
    pairId: 'lab05',
    route: '/labs/remove-shared-memory-bank-conflicts/',
    resourceKind: 'lab',
    prerequisites: 'M04,Q05',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '3 declared expectations',
    canonicalExample: 'EX06',
    canonicalRanges: ['shared-layouts', 'tiled-kernels'],
  },
  {
    id: 'LAB07',
    pairId: 'lab07',
    route: '/labs/diagnose-four-sanitizer-failures/',
    resourceKind: 'lab',
    prerequisites: 'Q03,Q04',
    runtimeEvidence: 'Pending Hardware Verification',
    expectedObservations: '4 declared expectations',
    canonicalExample: 'EX16',
    canonicalRanges: ex16Ranges,
  },
] as const;

const correctnessSlugs = [
  'cpu-references-tolerances-invariants',
  'memcheck-invalid-memory-access',
  'racecheck-initcheck-synccheck',
  'timing-asynchronous-gpu-work',
] as const;
const issue19MemorySlugs = [
  'pinned-memory-transfer-overlap',
  'unified-memory-page-migration',
  'stream-ordered-allocation-memory-pools',
  'cooperative-groups',
  'asynchronous-copy-pipelines',
  'cuda-graphs',
] as const;
const issue19MemorySlugSet = new Set<string>(issue19MemorySlugs);
const exampleSlugs = [
  'environment-report',
  'vector-addition',
  'multidimensional-indexing',
  'error-handling-lifecycle',
  'coalesced-strided-access',
  'shared-memory-tile-bank-padding',
  'streams-events-overlap',
  'unified-memory-migration',
  'graph-capture',
  'ptx-fatbinary-inspection',
  'sanitizer-defect-suite',
] as const;
const labSlugs = [
  'record-cuda-environment',
  'vector-addition',
  'break-and-repair-indexing',
  'observe-coalescing',
  'remove-shared-memory-bank-conflicts',
  'diagnose-four-sanitizer-failures',
] as const;

const sortedRoutes = (routes: readonly string[]) =>
  [...routes].sort((left, right) => left.localeCompare(right, 'en'));

test('current publication, Runnable Example, and Lab route scope is exact', async () => {
  const publishedRoutes = await discoverPublishedRoutes();
  expect(publishedRoutes).toHaveLength(296);
  expect(publishedRoutes.length / 2).toBe(148);

  const expectedIssue19MemoryRoutes = issue19MemorySlugs.flatMap((slug) =>
    ['', 'exercises', 'solutions'].flatMap((child) => {
      const route = `/memory/${slug}/${child ? `${child}/` : ''}`;
      return [route, `/en${route}`];
    }),
  );
  const expectedCorrectnessRoutes = correctnessSlugs.flatMap((slug) =>
    ['', 'exercises', 'solutions'].flatMap((child) => {
      const route = `/correctness/${slug}/${child ? `${child}/` : ''}`;
      return [route, `/en${route}`];
    }),
  );
  const expectedExampleRoutes = exampleSlugs.flatMap((slug) => [
    `/examples/${slug}/`,
    `/en/examples/${slug}/`,
  ]);
  const expectedLabRoutes = labSlugs.flatMap((slug) => [
    `/labs/${slug}/`,
    `/en/labs/${slug}/`,
  ]);

  expect(publishedRoutes.filter((route) => {
    const slug = route.match(/^\/(?:en\/)?memory\/([^/]+)\//)?.[1];
    return slug !== undefined && issue19MemorySlugSet.has(slug);
  })).toEqual(sortedRoutes(expectedIssue19MemoryRoutes));
  expect(publishedRoutes.filter((route) => /^\/(?:en\/)?correctness\//.test(route))).toEqual(
    sortedRoutes(expectedCorrectnessRoutes),
  );
  expect(publishedRoutes.filter((route) => /^\/(?:en\/)?examples\/[^/]+\/$/.test(route))).toEqual(
    sortedRoutes(expectedExampleRoutes),
  );
  expect(publishedRoutes.filter((route) => /^\/(?:en\/)?labs\/[^/]+\/$/.test(route))).toEqual(
    sortedRoutes(expectedLabRoutes),
  );
});

test('EX10 is Compile-Checked, Runtime-Not-Applicable, and excluded from pending-hardware evidence', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/examples/ptx-fatbinary-inspection/', '/en/examples/ptx-fatbinary-inspection/']) {
    await page.goto(route);
    await expect(page.locator('meta[name="cuda:evidence-compilation"]')).toHaveAttribute(
      'content',
      'Compile-Checked',
    );
    await expect(page.locator('meta[name="cuda:evidence-runtime"]')).toHaveAttribute(
      'content',
      'Runtime-Not-Applicable',
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
  }

  const response = await request.get('/publication.json');
  expect(response.ok()).toBe(true);
  const publication = await response.json();
  expect(publication.scope.runnableExamples).toContain('EX10');
  expect(publication.evidence.compileChecked).toContain('EX10');
  expect(publication.evidence.noCompileCheckedClaim).not.toContain('EX10');
  expect(publication.evidence.pendingHardwareVerification).not.toContain('EX10');
});

test('issue-17 parent publications expose bilingual mobile head and canonical-code contracts', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const failures = collectBrowserFailures(page, 'http://127.0.0.1:4321');

  for (const publication of issue17Publications) {
    const englishRoute = `/en${publication.route}`;
    for (const { route, counterpart, lang } of [
      { route: publication.route, counterpart: englishRoute, lang: 'zh-CN' },
      { route: englishRoute, counterpart: publication.route, lang: 'en' },
    ] as const) {
      const response = await page.goto(route);
      expect(response?.ok(), route).toBe(true);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      await expect(page.locator('main h1')).toContainText(publication.id);
      await expect(page.locator('[data-locale-counterpart]')).toHaveAttribute('href', counterpart);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${canonicalOrigin}${route}`);

      for (const [name, value] of Object.entries({
        'cuda:pair-id': publication.pairId,
        'cuda:fact-check-date': '2026-08-28',
        'cuda:license': 'CC-BY-4.0',
        'cuda:resource-kind': publication.resourceKind,
        'cuda:unit-id': publication.id,
        'cuda:prerequisites': publication.prerequisites,
        'cuda:evidence-compilation': 'none',
        'cuda:evidence-runtime': publication.runtimeEvidence,
        'cuda:recorded-observations': 'none',
      })) {
        await expect(page.locator(`meta[name="${name}"]`), `${publication.id}: ${name}`).toHaveAttribute(
          'content',
          value,
        );
      }

      if (publication.expectedObservations) {
        await expect(page.locator('meta[name="cuda:expected-observations"]')).toHaveAttribute(
          'content',
          publication.expectedObservations,
        );
      }
      if (publication.canonicalExample && publication.canonicalRanges) {
        await expect(page.locator('meta[name="cuda:canonical-example"]')).toHaveAttribute(
          'content',
          publication.canonicalExample,
        );
        await expect(page.locator('meta[name="cuda:canonical-ranges"]')).toHaveAttribute(
          'content',
          publication.canonicalRanges.join(','),
        );
        await expect(page.locator(`[data-canonical-example="${publication.canonicalExample}"]`)).toHaveCount(
          publication.canonicalRanges.length,
        );
      }

      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), route).toBe(true);
    }
  }

  expect(failures).toEqual([]);
});
