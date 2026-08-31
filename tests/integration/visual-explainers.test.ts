// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const pathname = new URL(route, 'https://visual-contract.invalid').pathname;
  const html = await readFile(path.join(projectRoot, 'dist', pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

const visualPairs = [
  { id: 'VIS01', tag: 'cuda-kernel-journey', zh: '/visuals/kernel-journey/', en: '/en/visuals/kernel-journey/' },
  { id: 'VIS02', tag: 'cuda-indexing-explorer', zh: '/visuals/indexing/', en: '/en/visuals/indexing/' },
  { id: 'VIS03', tag: 'cuda-warp-divergence', zh: '/visuals/warp-divergence/', en: '/en/visuals/warp-divergence/' },
  { id: 'VIS07', tag: 'cuda-stream-event-dependencies', zh: '/visuals/stream-event-dependencies/', en: '/en/visuals/stream-event-dependencies/' },
  { id: 'VIS08', tag: 'cuda-page-migration', zh: '/visuals/page-migration/', en: '/en/visuals/page-migration/' },
  { id: 'VIS09', tag: 'cuda-artifact-pipeline', zh: '/visuals/artifact-pipeline/', en: '/en/visuals/artifact-pipeline/' },
  { id: 'VIS12', tag: 'cuda-gemm-hierarchy-explorer', zh: '/visuals/gemm-tiling-hierarchy/', en: '/en/visuals/gemm-tiling-hierarchy/' },
  { id: 'VIS14', tag: 'cuda-profiler-decision-explorer', zh: '/visuals/nsight-systems-versus-nsight-compute/', en: '/en/visuals/nsight-systems-versus-nsight-compute/' },
] as const;

const embeddedVisuals = [
  {
    id: 'VIS19',
    tag: 'cuda-error-timeline',
    zh: '/foundations/asynchronous-errors/#vis19',
    en: '/en/foundations/asynchronous-errors/#vis19',
  },
  {
    id: 'VIS20',
    tag: 'cuda-capability-filter',
    zh: '/foundations/compute-capability/#vis20',
    en: '/en/foundations/compute-capability/#vis20',
  },
  {
    id: 'VIS21',
    tag: 'cuda-api-boundary',
    zh: '/foundations/runtime-driver-api/#vis21',
    en: '/en/foundations/runtime-driver-api/#vis21',
  },
  {
    id: 'VIS22',
    tag: 'cuda-block-shape-explorer',
    zh: '/foundations/launch-geometry/#vis22',
    en: '/en/foundations/launch-geometry/#vis22',
  },
] as const;

const advancedRepresentations = [
  { unitId: 'M11', kind: 'allocation', slug: 'stream-ordered-allocation-memory-pools' },
  { unitId: 'M12', kind: 'group', slug: 'cooperative-groups' },
  { unitId: 'M13', kind: 'pipeline', slug: 'asynchronous-copy-pipelines' },
  { unitId: 'M14', kind: 'graph', slug: 'cuda-graphs' },
] as const;

describe('built Visual Explainers', () => {
  it.each(visualPairs.flatMap((pair) => [{ ...pair, route: pair.zh }, { ...pair, route: pair.en }]))(
    'renders $id semantic output and a purpose-built fallback at $route',
    async ({ id, tag, route }) => {
      const document = await readRoute(route);
      const visual = document.querySelector(`${tag}[data-visual-id="${id}"]`);

      expect(visual).not.toBeNull();
      expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
      expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
      expect(visual?.querySelector('[data-conceptual-only]')?.textContent?.trim().length).toBeGreaterThan(40);
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Compile-Checked');
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Community-Observed');
      expect(visual?.querySelector('[data-no-evidence]')?.textContent).toContain('Runtime-Verified');
      expect(visual?.querySelectorAll('button, input, select').length).toBeGreaterThan(0);
      expect(visual?.querySelector('form')).toBeNull();
      expect(visual?.querySelector('img, iframe, object, embed')).toBeNull();
      expect(visual?.querySelectorAll('[id]').length).toBe(0);
      if (id === 'VIS02' || id === 'VIS08') {
        expect(visual?.querySelector('[data-interactive-workbench][hidden]')).not.toBeNull();
      }
    },
  );

  it.each(embeddedVisuals.flatMap((visual) => [
    { ...visual, route: visual.zh, indexRoute: '/visuals/' },
    { ...visual, route: visual.en, indexRoute: '/en/visuals/' },
  ]))('renders the formal embedded $id contract and its index deep-link at $route', async ({ id, tag, route, indexRoute }) => {
    const document = await readRoute(route);
    const visual = document.querySelector(`${tag}[data-visual-id="${id}"]`);
    const fragment = new URL(route, 'https://visual-contract.invalid').hash.slice(1);
    const anchor = document.getElementById(fragment);

    expect(visual).not.toBeNull();
    expect(document.querySelectorAll(`${tag}[data-visual-id="${id}"]`)).toHaveLength(1);
    expect(anchor).not.toBeNull();
    expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-static-fallback]')?.textContent?.trim().length).toBeGreaterThan(40);
    expect(visual?.querySelector('[data-conceptual-only]')?.textContent?.trim().length).toBeGreaterThan(40);
    const evidenceBoundary = visual?.querySelector('[data-no-evidence]')?.textContent ?? '';
    for (const status of ['Compile-Checked', 'Community-Observed', 'Runtime-Verified']) {
      expect(evidenceBoundary, `${id}: ${status}`).toContain(status);
    }

    const index = await readRoute(indexRoute);
    const card = index.querySelector(`[data-resource-card][data-resource-id="${id}"]`);
    expect(card).not.toBeNull();
    expect(card?.querySelector('h3 a')?.getAttribute('href')).toBe(route);
  }, 15_000);

  it('keeps VIS19-VIS22 embedded on exactly their bilingual hosts with no standalone duplicates', async () => {
    const ids = new Set(embeddedVisuals.map(({ id }) => id));
    const hosts = new Map(embeddedVisuals.map(({ id }) => [id, [] as string[]]));
    const standaloneUnitIds: string[] = [];
    const htmlFiles = (await readdir(path.join(projectRoot, 'dist'), { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.html'));

    for (const file of htmlFiles) {
      const document = parseHTML(await readFile(path.join(projectRoot, 'dist', file), 'utf8')).document;
      const route = `/${file.replace(/(?:^|\/)index\.html$/, '/').replace(/\.html$/, '/')}`;
      const unitId = document.querySelector('meta[name="cuda:unit-id"]')?.getAttribute('content');
      if (unitId && ids.has(unitId as (typeof embeddedVisuals)[number]['id'])) standaloneUnitIds.push(unitId);
      for (const visual of document.querySelectorAll<HTMLElement>('[data-visual-id]')) {
        const visualId = visual.dataset.visualId;
        const embeddedId = visualId as (typeof embeddedVisuals)[number]['id'];
        if (visualId && ids.has(embeddedId)) hosts.get(embeddedId)?.push(route);
      }
    }

    expect(standaloneUnitIds).toEqual([]);
    for (const visual of embeddedVisuals) {
      const expectedHosts = [visual.zh, visual.en]
        .map((route) => new URL(route, 'https://visual-contract.invalid').pathname)
        .sort();
      expect(hosts.get(visual.id)?.sort(), visual.id).toEqual(expectedHosts);
    }
  }, 15_000);

  it('keeps VIS01 controls, stage order, and facts aligned across locales', async () => {
    const documents = await Promise.all([
      readRoute('/visuals/kernel-journey/'),
      readRoute('/en/visuals/kernel-journey/'),
    ]);
    const expectedStages = [
      'launch',
      'grid-ready',
      'block-scheduled',
      'warps-formed',
      'warp-issued',
      'memory-transactions',
      'block-complete',
      'synchronization-complete',
    ];

    for (const document of documents) {
      const visual = document.querySelector('cuda-kernel-journey');
      expect([...visual!.querySelectorAll('[data-action]')].map((control) => control.getAttribute('data-action'))).toEqual([
        'play',
        'pause',
        'step',
        'reset',
        'scrub',
      ]);
      expect([...visual!.querySelectorAll('[data-stage-id]')].map((stage) => stage.getAttribute('data-stage-id'))).toEqual(
        expectedStages,
      );
      const text = visual?.textContent ?? '';
      expect(text).toMatch(/32/);
      expect(text).toMatch(/4 × 32 B/);
      expect(text).toMatch(/arbitrary order|any order|任意顺序/);
      expect(text).toMatch(/conceptual|概念/);
    }
  });

  it('keeps VIS02 fields, equations, bounds, and static examples aligned across locales', async () => {
    const documents = await Promise.all([readRoute('/visuals/indexing/'), readRoute('/en/visuals/indexing/')]);
    const expectedFields = [
      'gridDim.x', 'gridDim.y', 'gridDim.z',
      'blockDim.x', 'blockDim.y', 'blockDim.z',
      'extent.x', 'extent.y', 'extent.z',
      'blockIdx.x', 'blockIdx.y', 'blockIdx.z',
      'threadIdx.x', 'threadIdx.y', 'threadIdx.z',
    ];
    const expectedEquations = ['global-x', 'global-y', 'global-z', 'local-thread', 'linear-block', 'data-linear'];

    for (const document of documents) {
      const visual = document.querySelector('cuda-indexing-explorer');
      expect([...visual!.querySelectorAll('[data-index-field]')].map((input) => input.getAttribute('data-index-field'))).toEqual(
        expectedFields,
      );
      expect([...visual!.querySelectorAll('[data-equation]')].map((equation) => equation.getAttribute('data-equation'))).toEqual(
        expectedEquations,
      );
      expect([...visual!.querySelectorAll('[data-static-example]')].map((example) => example.getAttribute('data-static-example'))).toEqual([
        '1d',
        '2d',
        '3d',
      ]);
      expect(visual?.querySelectorAll('[data-axis-bound]')).toHaveLength(3);
      expect(visual?.textContent).toContain('IN BOUNDS');
      expect(visual?.textContent).toContain('OUT OF BOUNDS');
      expect(visual?.textContent).not.toMatch(/six CUDA built-ins|六个 CUDA 内建量/);
    }
  });

  it('keeps the VIS08 page, pure model, component, and complete static fallback aligned', async () => {
    const [zhSource, enSource, modelSource, componentSource, ...documents] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/page-migration.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/page-migration.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/page-migration-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/PageMigrationExplorer.astro'), 'utf8'),
      readRoute('/visuals/page-migration/'),
      readRoute('/en/visuals/page-migration/'),
    ]);

    for (const source of [zhSource, enSource]) {
      expect(source).toContain('unitId: VIS08');
      expect(source).toMatch(/prerequisites:\n  - M01\n  - M02\n  - M10/);
      expect(source).toContain("factCheckDate: '2026-08-29'");
    }
    expect(modelSource).toContain("coherence: 'software-coherent'");
    expect(modelSource).toContain('observedPageFaults: false');
    expect(modelSource).toContain('observedMigrations: false');
    expect(modelSource).toContain('measuredLatency: false');
    expect(modelSource).not.toMatch(/Date\.now|Math\.random|localStorage|sessionStorage|indexedDB/);
    expect(componentSource).toContain('data-visual-id="VIS08"');
    expect(componentSource).toContain('data-page-residency-rail');
    expect(componentSource).toContain('data-page-migration-ledger');
    expect(componentSource).toContain('data-static-fallback');

    for (const document of documents) {
      const visual = document.querySelector('cuda-page-migration[data-visual-id="VIS08"]');
      expect(visual?.querySelectorAll('[data-static-scenario]')).toHaveLength(3);
      expect(visual?.querySelectorAll('[data-static-access-row]')).toHaveLength(12);
      expect(visual?.querySelector('[data-static-fallback]')?.textContent).toMatch(/65,?536 B/);
      expect(visual?.querySelector('[data-measured], [data-observed-migration], [data-latency]')).toBeNull();
    }
  });

  it.each(advancedRepresentations.flatMap((representation) => [
    { ...representation, route: `/memory/${representation.slug}/` },
    { ...representation, route: `/en/memory/${representation.slug}/` },
  ]))('renders the ID-free static $kind representation for $unitId at $route', async ({ unitId, kind, route }) => {
    const document = await readRoute(route);
    const representation = document.querySelector(
      `[data-static-fallback][data-representation-kind="${kind}"][data-conceptual-only]`,
    );

    expect(metadata(document, 'cuda:unit-id')).toBe(unitId);
    expect(representation).not.toBeNull();
    expect(representation?.querySelector('[data-representation-reading]')?.textContent?.trim().length).toBeGreaterThan(80);
    expect(representation?.hasAttribute('data-visual-id')).toBe(false);
    expect(representation?.querySelector('[data-visual-id]')).toBeNull();
  });

  it('publishes empty CUDA evidence axes for every standalone conceptual model in this contract', async () => {
    for (const route of visualPairs.flatMap(({ zh, en }) => [zh, en])) {
      const document = await readRoute(route);
      for (const name of [
        'cuda:evidence-compilation',
        'cuda:evidence-runtime',
        'cuda:expected-observations',
        'cuda:recorded-observations',
      ]) {
        expect(document.querySelector(`meta[name="${name}"]`)?.getAttribute('content'), `${route}: ${name}`).toBe('none');
      }
    }
  });
});
