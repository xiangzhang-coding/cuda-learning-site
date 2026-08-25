// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const siteOrigin = 'https://cuda-learning-site.hmzhangxiang.workers.dev';

async function readRoute(route: string) {
  const relativePath = route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
  const html = await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8');
  return parseHTML(html).document;
}

type PublicationPair = {
  pairId: string;
  factCheckDate?: string;
  structure: string;
  resourceKind?: string;
  unitId?: string;
  prerequisites?: string;
  relatedUnits?: string;
  exampleIds?: string;
  canonicalExample?: string;
  canonicalRanges?: string;
  hardwareGate?: string;
  evidenceCompilation?: string;
  evidenceRuntime?: string;
  expectedObservations?: string;
  recordedObservations?: string;
  estimatedMinutes?: string;
  difficulty?: string;
  toolkitLanes?: string;
  minimumComputeCapability?: string;
  maximumProblemMemoryBytes?: string;
  gpuCount?: string;
  permissions?: string;
  sourceCount?: string;
  sourceVersions?: string;
  zh: string;
  en: string;
};

const publicationPairs: readonly PublicationPair[] = [
  {
    pairId: 'home',
    factCheckDate: '2026-08-25',
    structure: 'purpose,current-route,boundaries,destinations',
    zh: '/',
    en: '/en/',
  },
  {
    pairId: 'o01',
    factCheckDate: '2026-08-25',
    structure: 'outcome,resource-types,published-route,themes,workflow,boundaries,check',
    resourceKind: 'learning-unit',
    unitId: 'O01',
    prerequisites: 'none',
    relatedUnits: 'O02,O03',
    zh: '/start/using-the-learning-site/',
    en: '/en/start/using-the-learning-site/',
  },
  {
    pairId: 'o02',
    structure: 'outcome,prerequisites,model,statuses,decision,examples,retrieval,practice,sources',
    resourceKind: 'learning-unit',
    unitId: 'O02',
    prerequisites: 'O01',
    relatedUnits: 'O01',
    exampleIds: 'O02-CASE-A,O02-CASE-B,O02-CASE-C,O02-CASE-D,O02-CASE-E,O02-CASE-F',
    sourceCount: '1',
    sourceVersions: '13.3.1',
    zh: '/start/evidence-status/',
    en: '/en/start/evidence-status/',
  },
  {
    pairId: 'o02-exercises',
    structure: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next',
    resourceKind: 'exercise-set',
    unitId: 'O02-EXERCISES',
    prerequisites: 'O02',
    relatedUnits: 'O02',
    zh: '/start/evidence-status/exercises/',
    en: '/en/start/evidence-status/exercises/',
  },
  {
    pairId: 'o02-solutions',
    structure: 'review,solution-1,solution-2,solution-3,common-errors',
    resourceKind: 'solution-set',
    unitId: 'O02-SOLUTIONS',
    prerequisites: 'O02-EXERCISES',
    relatedUnits: 'O02',
    zh: '/start/evidence-status/solutions/',
    en: '/en/start/evidence-status/solutions/',
  },
  {
    pairId: 'o03',
    structure: 'outcome,prerequisites,manifest,relationships,support,tiers,lanes,reference-boundary,retrieval,practice,sources',
    resourceKind: 'learning-unit',
    unitId: 'O03',
    prerequisites: 'O01',
    relatedUnits: 'O02,F01,LAB02',
    exampleIds: 'O03-MANIFEST-TEMPLATE,O03-INCOMPLETE-A',
    sourceCount: '8',
    sourceVersions: '11.8.0,12.9.2,13.3.1',
    zh: '/start/environment-manifest/',
    en: '/en/start/environment-manifest/',
  },
  {
    pairId: 'o03-exercises',
    structure: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next',
    resourceKind: 'exercise-set',
    unitId: 'O03-EXERCISES',
    prerequisites: 'O03',
    relatedUnits: 'O03',
    zh: '/start/environment-manifest/exercises/',
    en: '/en/start/environment-manifest/exercises/',
  },
  {
    pairId: 'o03-solutions',
    structure: 'review,solution-1,solution-2,solution-3,common-errors',
    resourceKind: 'solution-set',
    unitId: 'O03-SOLUTIONS',
    prerequisites: 'O03-EXERCISES',
    relatedUnits: 'O03',
    zh: '/start/environment-manifest/solutions/',
    en: '/en/start/environment-manifest/solutions/',
  },
  {
    pairId: 'f01',
    structure: 'outcome,prerequisites,motivation,prediction,implementation,correctness,measurement,optimization-boundaries,explanation,retrieval,practice,sources',
    resourceKind: 'learning-unit',
    unitId: 'F01',
    prerequisites: 'O03',
    relatedUnits: 'O02,VIS01,VIS02,LAB02',
    exampleIds: 'EX02',
    canonicalExample: 'EX02',
    canonicalRanges: 'kernel,error-checking,cpu-reference',
    hardwareGate: 'None for this Learning Unit; LAB02 requires native Linux and one qualifying CUDA GPU',
    sourceCount: '4',
    sourceVersions: '13.3,13.3.1',
    zh: '/foundations/first-cuda-kernel/',
    en: '/en/foundations/first-cuda-kernel/',
  },
  {
    pairId: 'f01-exercises',
    structure: 'prerequisites,instructions,exercise-1,exercise-2,exercise-3,next',
    resourceKind: 'exercise-set',
    unitId: 'F01-EXERCISES',
    prerequisites: 'F01',
    relatedUnits: 'F01,LAB02',
    exampleIds: 'EX02',
    hardwareGate: 'None; implementation may be prepared without executing CUDA',
    zh: '/foundations/first-cuda-kernel/exercises/',
    en: '/en/foundations/first-cuda-kernel/exercises/',
  },
  {
    pairId: 'f01-solutions',
    structure: 'review,solution-1,solution-2,solution-3,valid-alternatives,common-errors',
    resourceKind: 'solution-set',
    unitId: 'F01-SOLUTIONS',
    prerequisites: 'F01-EXERCISES',
    relatedUnits: 'F01,LAB02',
    exampleIds: 'EX02',
    zh: '/foundations/first-cuda-kernel/solutions/',
    en: '/en/foundations/first-cuda-kernel/solutions/',
  },
  {
    pairId: 'ex02',
    structure: 'purpose,project,correctness,build,compatibility,evidence,expected-observations,sources',
    resourceKind: 'runnable-example',
    unitId: 'EX02',
    prerequisites: 'none',
    relatedUnits: 'O02,O03,F01,LAB02',
    exampleIds: 'EX02',
    canonicalExample: 'EX02',
    canonicalRanges: 'kernel,error-checking,cpu-reference',
    evidenceCompilation: 'Compile-Checked',
    evidenceRuntime: 'Pending Hardware Verification',
    expectedObservations: '2 declared expectations',
    sourceCount: '11',
    sourceVersions: '11.8.0,12.9.2,13.3.1',
    zh: '/examples/vector-addition/',
    en: '/en/examples/vector-addition/',
  },
  {
    pairId: 'labs-index',
    factCheckDate: '2026-08-25',
    structure: 'scope,published-index,sequence,evidence-boundary',
    zh: '/labs/',
    en: '/en/labs/',
  },
  {
    pairId: 'lab02',
    structure: 'contract,prerequisites,prepare,predict,build,run,verify,observations,evidence,cleanup,sources',
    resourceKind: 'lab',
    unitId: 'LAB02',
    prerequisites: 'O03,F01',
    relatedUnits: 'O02,EX02,VIS01,VIS02',
    exampleIds: 'EX02',
    canonicalExample: 'EX02',
    canonicalRanges: 'error-checking,kernel,cpu-reference',
    hardwareGate: 'Native Linux; one CUDA GPU with compute capability 7.5 or newer; workload below 8 GB',
    evidenceCompilation: 'Compile-Checked',
    evidenceRuntime: 'Pending Hardware Verification',
    expectedObservations: '2 declared expectations',
    estimatedMinutes: '45',
    difficulty: 'introductory',
    toolkitLanes: 'cuda-11.8,cuda-12.9,cuda-13.3',
    minimumComputeCapability: '7.5',
    maximumProblemMemoryBytes: '1610612736',
    gpuCount: '1',
    permissions: 'CUDA device; compiler and binary execution; EX02 build-directory write/delete',
    sourceCount: '4',
    sourceVersions: '11.8.0,12.9.2,13.3.1',
    zh: '/labs/vector-addition/',
    en: '/en/labs/vector-addition/',
  },
  {
    pairId: 'visuals-index',
    factCheckDate: '2026-08-25',
    structure: 'scope,published-index,sequence,evidence-boundary',
    zh: '/visuals/',
    en: '/en/visuals/',
  },
  {
    pairId: 'vis01',
    structure: 'purpose,model,controls,scheduling-boundary,static-sequence,evidence-boundary,sources',
    resourceKind: 'visual-explainer',
    unitId: 'VIS01',
    prerequisites: 'none',
    relatedUnits: 'O01,O02,F01',
    hardwareGate: 'None: deterministic browser model; no CUDA-capable system required',
    sourceCount: '9',
    sourceVersions: '13.3,7.2.4,0.41.7,2026-08-21,2026-01-12',
    zh: '/visuals/kernel-journey/',
    en: '/en/visuals/kernel-journey/',
  },
  {
    pairId: 'vis02',
    structure: 'purpose,model,dimensions,equations,bounds,static-examples,evidence-boundary,sources',
    resourceKind: 'visual-explainer',
    unitId: 'VIS02',
    prerequisites: 'none',
    relatedUnits: 'O01,O02,F01',
    hardwareGate: 'None: deterministic browser model; no CUDA-capable system required',
    sourceCount: '7',
    sourceVersions: '13.3,7.2.4,0.41.7,2026-08-21,2026-01-12',
    zh: '/visuals/indexing/',
    en: '/en/visuals/indexing/',
  },
  {
    pairId: 'practice-bank',
    factCheckDate: '2026-08-25',
    structure: 'use,lookup-index,entry-pb-r0-001,entry-pb-r0-002,entry-pb-r0-003,entry-pb-r0-004,entry-pb-r0-005,review',
    resourceKind: 'practice-bank',
    unitId: 'PB-R0',
    prerequisites: 'O02,O03,F01',
    relatedUnits: 'O02,O03,F01',
    zh: '/practice/',
    en: '/en/practice/',
  },
  {
    pairId: 'glossary',
    factCheckDate: '2026-08-25',
    structure: 'use,lookup-index,entries,maintenance',
    zh: '/glossary/',
    en: '/en/glossary/',
  },
  {
    pairId: 'sources-and-versions',
    factCheckDate: '2026-08-25',
    structure: 'scope,lookup-index,verified-interfaces,content-sources,review-record',
    zh: '/sources-and-versions/',
    en: '/en/sources-and-versions/',
  },
  {
    pairId: 'about',
    structure: 'purpose,scope,author,feedback',
    zh: '/about/',
    en: '/en/about/',
  },
];

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

describe('Publication Pairs', () => {
  it.each(
    publicationPairs.flatMap(({ pairId, factCheckDate = '2026-08-24', structure, zh, en, ...contract }) => [
      { route: zh, lang: 'zh-CN', counterpart: en, pairId, factCheckDate, structure, ...contract },
      { route: en, lang: 'en', counterpart: zh, pairId, factCheckDate, structure, ...contract },
    ]),
  )('publishes $route with aligned metadata and a direct counterpart', async ({ route, lang, counterpart, pairId, factCheckDate, structure, resourceKind, unitId, prerequisites, relatedUnits, exampleIds, canonicalExample, canonicalRanges, hardwareGate, evidenceCompilation = 'none', evidenceRuntime = 'none', expectedObservations, recordedObservations = 'none', estimatedMinutes, difficulty, toolkitLanes, minimumComputeCapability, maximumProblemMemoryBytes, gpuCount, permissions, sourceCount, sourceVersions }) => {
    const document = await readRoute(route);

    expect(document.documentElement.lang).toBe(lang);
    expect(document.querySelector(`[data-locale-counterpart][href="${counterpart}"]`)).not.toBeNull();
    expect(metadata(document, 'cuda:pair-id')).toBe(pairId);
    expect(metadata(document, 'cuda:fact-check-date')).toBe(factCheckDate);
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:structure')).toBe(structure);
    if (resourceKind) expect(metadata(document, 'cuda:resource-kind')).toBe(resourceKind);
    if (unitId) expect(metadata(document, 'cuda:unit-id')).toBe(unitId);
    if (prerequisites) expect(metadata(document, 'cuda:prerequisites')).toBe(prerequisites);
    if (relatedUnits) expect(metadata(document, 'cuda:related-units')).toBe(relatedUnits);
    if (exampleIds) expect(metadata(document, 'cuda:example-ids')).toBe(exampleIds);
    if (canonicalExample) expect(metadata(document, 'cuda:canonical-example')).toBe(canonicalExample);
    if (canonicalRanges) expect(metadata(document, 'cuda:canonical-ranges')).toBe(canonicalRanges);
    if (hardwareGate) expect(metadata(document, 'cuda:hardware-gate')).toBe(hardwareGate);
    if (estimatedMinutes) expect(metadata(document, 'cuda:estimated-minutes')).toBe(estimatedMinutes);
    if (difficulty) expect(metadata(document, 'cuda:difficulty')).toBe(difficulty);
    if (toolkitLanes) expect(metadata(document, 'cuda:toolkit-lanes')).toBe(toolkitLanes);
    if (minimumComputeCapability) expect(metadata(document, 'cuda:minimum-compute-capability')).toBe(minimumComputeCapability);
    if (maximumProblemMemoryBytes) expect(metadata(document, 'cuda:maximum-problem-memory-bytes')).toBe(maximumProblemMemoryBytes);
    if (gpuCount) expect(metadata(document, 'cuda:gpu-count')).toBe(gpuCount);
    if (permissions) expect(metadata(document, 'cuda:permissions')).toBe(permissions);
    if (sourceCount) expect(metadata(document, 'cuda:source-count')).toBe(sourceCount);
    if (sourceVersions) expect(metadata(document, 'cuda:source-versions')).toBe(sourceVersions);
    if (resourceKind) {
      expect(metadata(document, 'cuda:evidence-compilation')).toBe(evidenceCompilation);
      expect(metadata(document, 'cuda:evidence-runtime')).toBe(evidenceRuntime);
      if (expectedObservations) expect(metadata(document, 'cuda:expected-observations')).toBe(expectedObservations);
      expect(metadata(document, 'cuda:recorded-observations')).toBe(recordedObservations);
    }
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${siteOrigin}${route}`);

    const alternateLinks = new Map(
      [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((link) => [
        link.getAttribute('hreflang'),
        link.getAttribute('href'),
      ]),
    );
    const pair = publicationPairs.find((candidate) => candidate.pairId === pairId);
    expect(alternateLinks.get('zh-CN')).toBe(`${siteOrigin}${pair?.zh}`);
    expect(alternateLinks.get('en')).toBe(`${siteOrigin}${pair?.en}`);
    expect(alternateLinks.get('x-default')).toBe(`${siteOrigin}${pair?.zh}`);
  });

  it('discovers every source and built page as a complete pair', async () => {
    const sourceFiles = (await readdir(path.join(projectRoot, 'src/content/docs'), { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => /\.(?:md|mdx)$/.test(file));
    const rootFiles = sourceFiles.filter((file) => !file.startsWith('en/'));
    const englishFiles = sourceFiles.filter((file) => file.startsWith('en/')).map((file) => file.slice(3));

    expect(new Set(englishFiles)).toEqual(new Set(rootFiles));

    const sourceRoutes = new Set(
      sourceFiles.map((file) => {
        const stem = file.replace(/\.(?:md|mdx)$/, '').replace(/(?:^|\/)index$/, '');
        return stem ? `/${stem}/` : '/';
      }),
    );
    const builtRoutes = new Set(
      (await readdir(path.join(projectRoot, 'dist'), { recursive: true }))
        .map((file) => file.split(path.sep).join('/'))
        .filter((file) => file.endsWith('.html'))
        .map((file) => {
          const stem = file.replace(/(?:^|\/)index\.html$/, '').replace(/\.html$/, '');
          return stem ? `/${stem}/` : '/';
        }),
    );

    expect(builtRoutes).toEqual(sourceRoutes);
    expect(sourceRoutes.size).toBe(publicationPairs.length * 2);
  });

  it('publishes a closed, acyclic R0 prerequisite graph', async () => {
    const expectedPrerequisites = new Map<string, readonly string[]>([
      ['O01', []],
      ['O02', ['O01']],
      ['O03', ['O01']],
      ['F01', ['O03']],
      ['LAB02', ['O03', 'F01']],
      ['EX02', []],
      ['VIS01', []],
      ['VIS02', []],
    ]);
    const publishedIds = new Set(publicationPairs.flatMap(({ unitId }) => (unitId ? [unitId] : [])));
    const graph = new Map<string, string[]>();

    for (const pair of publicationPairs.filter(({ unitId }) => expectedPrerequisites.has(unitId ?? ''))) {
      const document = await readRoute(pair.zh);
      const rawPrerequisites = metadata(document, 'cuda:prerequisites');
      const prerequisites = !rawPrerequisites || rawPrerequisites === 'none' ? [] : rawPrerequisites.split(',');

      expect(prerequisites, pair.unitId).toEqual(expectedPrerequisites.get(pair.unitId ?? ''));
      for (const prerequisite of prerequisites) expect(publishedIds, prerequisite).toContain(prerequisite);
      graph.set(pair.unitId ?? '', prerequisites);
    }

    const visited = new Set<string>();
    const active = new Set<string>();
    const visit = (unitId: string) => {
      expect(active, `cycle reaches ${unitId}`).not.toContain(unitId);
      if (visited.has(unitId)) return;
      active.add(unitId);
      for (const prerequisite of graph.get(unitId) ?? []) visit(prerequisite);
      active.delete(unitId);
      visited.add(unitId);
    };

    for (const unitId of graph.keys()) visit(unitId);
    expect(visited).toEqual(new Set(expectedPrerequisites.keys()));
  });
});

describe('published navigation', () => {
  it.each([
    {
      route: '/start/using-the-learning-site/',
       expected: ['/start/using-the-learning-site/', '/start/evidence-status/', '/start/environment-manifest/', '/foundations/first-cuda-kernel/', '/examples/vector-addition/', '/labs/', '/labs/vector-addition/', '/visuals/', '/visuals/kernel-journey/', '/visuals/indexing/', '/practice/', '/glossary/', '/sources-and-versions/', '/about/'],
    },
    {
      route: '/en/start/using-the-learning-site/',
       expected: ['/en/start/using-the-learning-site/', '/en/start/evidence-status/', '/en/start/environment-manifest/', '/en/foundations/first-cuda-kernel/', '/en/examples/vector-addition/', '/en/labs/', '/en/labs/vector-addition/', '/en/visuals/', '/en/visuals/kernel-journey/', '/en/visuals/indexing/', '/en/practice/', '/en/glossary/', '/en/sources-and-versions/', '/en/about/'],
    },
  ])('exposes only complete destinations from $route', async ({ route, expected }) => {
    const document = await readRoute(route);
    const hrefs = [...document.querySelectorAll('nav a[href]')].map((link) => link.getAttribute('href'));

    for (const href of expected) expect(hrefs).toContain(href);
  });

  it('contains no empty destinations or broken internal page and fragment links', async () => {
    const publishedRoutes = new Set(publicationPairs.flatMap(({ zh, en }) => [zh, en]));
    const documents = new Map<string, Document>();
    const destinationDocument = async (route: string) => {
      const cached = documents.get(route);
      if (cached) return cached;
      const document = await readRoute(route);
      documents.set(route, document);
      return document;
    };

    for (const route of publishedRoutes) {
      const document = await destinationDocument(route);
      const links = [...document.querySelectorAll('a[href]')].map((link) => link.getAttribute('href') ?? '');

      for (const href of links) {
        expect(href.trim(), `${route} contains an empty link`).not.toBe('');
        expect(href, `${route} contains a placeholder link`).not.toBe('#');
        if (!href.startsWith('/') && !href.startsWith('#')) continue;

        const destination = new URL(href, `${siteOrigin}${route}`);
        expect(publishedRoutes, `${route} links to ${destination.pathname}`).toContain(destination.pathname);
        if (!destination.hash) continue;

        const fragment = decodeURIComponent(destination.hash.slice(1));
        const target = await destinationDocument(destination.pathname);
        expect(target.getElementById(fragment), `${route} links to missing #${fragment} in ${destination.pathname}`).not.toBeNull();
      }
    }
  });

  it('uses valid HTTPS URLs for every external content link', async () => {
    for (const route of publicationPairs.flatMap(({ zh, en }) => [zh, en])) {
      const document = await readRoute(route);
      const externalLinks = [...document.querySelectorAll('a[href]')]
        .map((link) => link.getAttribute('href'))
        .filter((href): href is string => Boolean(href && !href.startsWith('/') && !href.startsWith('#')));

      for (const href of externalLinks) {
        const url = new URL(href);
        expect(url.protocol, href).toBe('https:');
        expect(url.hostname, href).not.toMatch(/^(?:localhost|127\.0\.0\.1)$/);
      }
    }
  });

  it('resolves every built page asset and metadata link', async () => {
    for (const route of publicationPairs.flatMap(({ zh, en }) => [zh, en])) {
      const document = await readRoute(route);
      const assetLinks = [
        ...document.querySelectorAll('script[src], link[href]'),
      ]
        .map((element) => element.getAttribute('src') ?? element.getAttribute('href'))
        .filter((href): href is string => Boolean(href?.startsWith('/')))
        .map((href) => href.split(/[?#]/)[0]);

      for (const href of assetLinks) {
        const target = path.join(projectRoot, 'dist', href.slice(1));
        await expect(readFile(target), `${route} references ${href}`).resolves.toBeInstanceOf(Buffer);
      }
    }
  });
});

describe('O01 content boundary', () => {
  it.each([
    {
      route: '/start/using-the-learning-site/',
      terms: ['学习单元', '可运行示例', '实验', '练习', '练习题库', '可视化讲解', '术语表'],
    },
    {
      route: '/en/start/using-the-learning-site/',
      terms: ['Learning Unit', 'Runnable Example', 'Lab', 'Exercise', 'Practice Bank', 'Visual Explainer', 'Glossary'],
    },
  ])('distinguishes resource types and points to the controlled evidence contract from $route', async ({ route, terms }) => {
    const document = await readRoute(route);
    const text = document.querySelector('main')?.textContent ?? '';

    for (const term of terms) expect(text).toContain(term);
    expect(text).toMatch(/O02/);
    expect(text).toMatch(/does not grant CUDA evidence|不会授予 CUDA 证据状态/);
  });
});

describe('search readiness', () => {
  it('builds independent Chinese and English Pagefind indexes', async () => {
    const entry = JSON.parse(
      await readFile(path.join(projectRoot, 'dist/pagefind/pagefind-entry.json'), 'utf8'),
    ) as { version: string; languages: Record<string, { page_count: number }> };

    expect(entry.version).toBe('1.5.2');
    expect(Object.keys(entry.languages).sort()).toEqual(['en', 'zh-cn']);
    expect(entry.languages.en.page_count).toBe(publicationPairs.length);
    expect(entry.languages['zh-cn'].page_count).toBe(publicationPairs.length);
  });
});
