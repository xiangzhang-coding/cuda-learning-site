// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const distRoot = path.join(projectRoot, 'dist');

async function readBuiltRoute(route: string) {
  const pathname = new URL(route, 'https://page-migration.invalid').pathname;
  const html = await readFile(path.join(distRoot, pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function attributeValues(root: ParentNode, selector: string, attribute: string) {
  return [...root.querySelectorAll(selector)].map((element) => element.getAttribute(attribute));
}

async function readBuiltLearningUnits() {
  const files = (await readdir(distRoot, { recursive: true }))
    .map((file) => file.split(path.sep).join('/'))
    .filter((file) => file.endsWith('/index.html'));
  return Promise.all(files.map(async (file) => {
    const html = await readFile(path.join(distRoot, file), 'utf8');
    return { file, document: parseHTML(html).document };
  }));
}

describe('VIS08 page-migration Visual Explainer', () => {
  it('keeps the bilingual source pair, pure model, and adaptive static contracts aligned', async () => {
    const [zh, en, model, copy, component, representation, styles] = await Promise.all([
      readFile(path.join(projectRoot, 'src/content/docs/visuals/page-migration.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/content/docs/en/visuals/page-migration.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/page-migration-model.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/visuals/page-migration-copy.ts'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/PageMigrationExplorer.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/components/AdvancedMemoryRepresentation.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/advanced-memory-visuals.css'), 'utf8'),
    ]);

    expect(zh).toContain("title: '托管内存页面迁移'");
    expect(en).toContain("title: 'Managed-Memory Page Migration'");
    expect(zh).toContain('counterpart: /en/visuals/page-migration/');
    expect(en).toContain('counterpart: /visuals/page-migration/');
    for (const source of [zh, en]) {
      expect(source).toContain('pairId: vis08');
      expect(source).toContain('unitId: VIS08');
      expect(source).toMatch(/prerequisites:\n  - M01\n  - M02\n  - M10\nrelatedUnits:\n  - M10\n  - EX08/);
      expect(source).toContain("factCheckDate: '2026-08-29'");
      expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(source.match(/accessDate: '2026-08-29'/g)).toHaveLength(4);
      expect(source).toContain("content: '13.3,13.3.1,12.9.1,11.8.0'");
      expect(source).toContain('https://docs.nvidia.com/cuda/cuda-programming-guide/04-special-topics/unified-memory.html');
      expect(source).toContain('https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__MEMORY.html');
      expect(source).toContain('https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html#um-unified-memory-programming-hd');
      expect(source).toContain('https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#um-unified-memory-programming-hd');
      expect(source).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?)\b/i);
    }

    expect(model).toContain("coherence: 'software-coherent'");
    expect(model).toContain("pageSizeMeaning: 'declared-teaching-symbol-not-detected-runtime-granularity'");
    expect(model).toContain('observedPageFaults: false');
    expect(model).toContain('observedMigrations: false');
    expect(model).toContain('measuredLatency: false');
    expect(model).not.toMatch(/\bnew Date\b|Date\.now|Math\.random|localStorage|sessionStorage|indexedDB|navigator\.|document\.|window\./);
    expect(copy).toContain("'gpu-linear-sweep'");
    expect(copy).toContain("'alternating-hot-page'");
    expect(copy).toContain("'split-working-set'");
    expect(component).toContain('data-static-fallback');
    expect(component).toContain('data-page-residency-rail');
    expect(component).toContain('data-page-migration-ledger');
    expect(component).toContain('controls.hidden = false');
    expect(component).toContain('workbench.hidden = false');
    expect(component).not.toMatch(/localStorage|sessionStorage|indexedDB|setInterval|setTimeout/);

    expect(representation).toContain("'allocation' | 'group' | 'pipeline' | 'graph'");
    expect(representation).toContain("'zh-CN' | 'en'");
    expect(representation).toContain('data-static-fallback');
    expect(representation).toContain('data-representation-kind');
    expect(representation).toContain('data-conceptual-only');
    expect(representation).not.toContain('data-visual-id');
    expect(representation).not.toContain('<script');
    expect(styles).toMatch(/@media \(max-width:/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(styles).toMatch(/@media \(forced-colors: active\)/);
    expect(styles).toMatch(/@media print/);
    expect(styles).not.toMatch(/@keyframes|animation-name/);
  });

  it.each([
    {
      route: '/visuals/page-migration/',
      counterpart: '/en/visuals/page-migration/',
      title: '托管内存页面迁移',
    },
    {
      route: '/en/visuals/page-migration/',
      counterpart: '/visuals/page-migration/',
      title: 'Managed-Memory Page Migration',
    },
  ])('renders the complete evidence-neutral VIS08 route at $route', async ({ route, counterpart, title }) => {
    const document = await readBuiltRoute(route);
    const visual = document.querySelector('cuda-page-migration[data-visual-id="VIS08"]');
    expect(document.querySelector('main h1')?.textContent?.trim()).toBe(title);
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);
    expect(visual).not.toBeNull();
    expect(visual?.getAttribute('data-assumption-id')).toBe('declared-software-coherent-single-residency');
    expect(visual?.querySelector('[data-conceptual-only]')).not.toBeNull();
    expect(visual?.querySelector('[data-no-evidence]')?.textContent).toMatch(/Compile-Checked/);
    expect(visual?.querySelector('[data-no-evidence]')?.textContent).toMatch(/Community-Observed/);
    expect(visual?.querySelector('[data-no-evidence]')?.textContent).toMatch(/Runtime-Verified/);
    expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-interactive-workbench][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(visual?.querySelector('select[data-page-migration-scenario]')).not.toBeNull();
    expect(visual?.querySelectorAll('button[data-page-migration-action]')).toHaveLength(2);
    expect(visual?.querySelector('[data-page-migration-action="play"], input[type="range"]')).toBeNull();

    expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
    expect(visual?.querySelectorAll('[data-static-scenario]')).toHaveLength(3);
    expect(visual?.querySelectorAll('[data-static-access-row]')).toHaveLength(12);
    expect(visual?.querySelectorAll('[data-static-page]')).toHaveLength(10);
    expect(attributeValues(visual!, '[data-static-scenario]', 'data-static-scenario')).toEqual([
      'gpu-linear-sweep',
      'alternating-hot-page',
      'split-working-set',
    ]);
    expect(attributeValues(visual!, '[data-static-access-row]', 'data-static-access-row')).toEqual([
      'gpu-linear-sweep:access-01',
      'gpu-linear-sweep:access-02',
      'gpu-linear-sweep:access-03',
      'gpu-linear-sweep:access-04',
      'alternating-hot-page:access-01',
      'alternating-hot-page:access-02',
      'alternating-hot-page:access-03',
      'alternating-hot-page:access-04',
      'split-working-set:access-01',
      'split-working-set:access-02',
      'split-working-set:access-03',
      'split-working-set:access-04',
    ]);
    expect(visual?.textContent).toMatch(/65,536 B/);
    expect(visual?.textContent).toMatch(/4 x 65536 B = 262144 B/);
    expect(visual?.textContent).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ns|us|µs|ms|milliseconds?|seconds?)\b/i);
    expect(visual?.querySelector('[data-measured], [data-observed-migration], [data-latency]')).toBeNull();

    expect(metadata(document, 'cuda:pair-id')).toBe('vis08');
    expect(metadata(document, 'cuda:unit-id')).toBe('VIS08');
    expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
    expect(metadata(document, 'cuda:fact-check-date')).toBe('2026-08-29');
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:prerequisites')).toBe('M01,M02,M10');
    expect(metadata(document, 'cuda:related-units')).toBe('M10,EX08');
    expect(metadata(document, 'cuda:source-count')).toBe('4');
    expect(metadata(document, 'cuda:source-versions')).toBe('13.3,13.3.1,12.9.1,11.8.0');
    for (const field of ['compilation', 'runtime', 'expected-observations', 'recorded-observations']) {
      expect(metadata(document, `cuda:evidence-${field}`) ?? metadata(document, `cuda:${field}`)).toBe('none');
    }
  });

  it('keeps locale-independent fallback IDs and ordering aligned', async () => {
    const [zh, en] = await Promise.all([
      readBuiltRoute('/visuals/page-migration/'),
      readBuiltRoute('/en/visuals/page-migration/'),
    ]);
    const selectors = [
      ['[data-static-scenario]', 'data-static-scenario'],
      ['[data-static-page]', 'data-static-page'],
      ['[data-static-access-row]', 'data-static-access-row'],
      ['[data-static-access-row]', 'data-modeled-transition'],
    ] as const;
    for (const [selector, attribute] of selectors) {
      expect(attributeValues(zh, selector, attribute)).toEqual(attributeValues(en, selector, attribute));
    }
  });

  it('renders all four static advanced-memory representations in both built M11-M14 Learning Unit routes', async () => {
    const built = await readBuiltLearningUnits();
    const contracts = [
      {
        unitId: 'M11',
        kind: 'allocation',
        selector: '[data-allocation-step]',
        ids: ['allocate', 'cross-stream-edge', 'uses', 'last-use', 'free'],
        attribute: 'data-allocation-step',
      },
      {
        unitId: 'M12',
        kind: 'group',
        selector: '[data-group-member]',
        ids: ['thread-00', 'thread-01', 'thread-02', 'thread-03', 'thread-04', 'thread-05', 'thread-06', 'thread-07'],
        attribute: 'data-group-member',
      },
      {
        unitId: 'M13',
        kind: 'pipeline',
        selector: '[data-pipeline-path="cc8-plus"] [data-pipeline-step]',
        ids: ['acquire', 'copy', 'commit', 'wait', 'use', 'release'],
        attribute: 'data-pipeline-step',
      },
      {
        unitId: 'M14',
        kind: 'graph',
        selector: '[data-graph-lifecycle-stage]',
        ids: ['capture', 'instantiate', 'replay', 'resource-lifetime'],
        attribute: 'data-graph-lifecycle-stage',
      },
    ] as const;

    for (const contract of contracts) {
      const documents = built.filter(({ document }) => metadata(document, 'cuda:unit-id') === contract.unitId);
      expect(documents, contract.unitId).toHaveLength(2);
      const alignedIds: Array<Array<string | null>> = [];
      for (const { file, document } of documents) {
        const representation = document.querySelector(
          `[data-static-fallback][data-representation-kind="${contract.kind}"][data-conceptual-only]`,
        );
        expect(representation, file).not.toBeNull();
        expect(representation?.hasAttribute('data-visual-id'), file).toBe(false);
        expect(representation?.querySelector('[data-visual-id]'), file).toBeNull();
        expect(representation?.querySelector('[data-representation-reading]')?.textContent?.trim().length, file).toBeGreaterThan(80);
        expect(attributeValues(representation!, contract.selector, contract.attribute), file).toEqual(contract.ids);
        alignedIds.push(attributeValues(representation!, contract.selector, contract.attribute));

        if (contract.kind === 'allocation') {
          expect(
            attributeValues(
              representation!,
              '[data-allocation-pool-row]',
              'data-allocation-pool-row',
            ),
            file,
          ).toEqual(['pool-source', 'logical-free', 'reuse-policy']);
        }
        if (contract.kind === 'group') {
          expect(representation?.querySelectorAll('[data-group-tile]'), file).toHaveLength(2);
          expect(representation?.querySelector('[data-all-participant-collective]'), file).not.toBeNull();
          expect(representation?.querySelector('[data-group-dynamic-membership]'), file).not.toBeNull();
          expect(
            representation?.querySelector(
              '[data-group-grid-gate][data-cooperative-launch-required="true"]',
            ),
            file,
          ).not.toBeNull();
        }
        if (contract.kind === 'pipeline') {
          expect(representation?.querySelector('[data-pipeline-path="portable-baseline"]'), file).not.toBeNull();
          expect(representation?.querySelector('[data-pipeline-path="cc8-plus"][data-minimum-compute-capability="8.0"]'), file).not.toBeNull();
        }
        if (contract.kind === 'graph') {
          expect(representation?.querySelectorAll('[data-graph-node]'), file).toHaveLength(3);
          expect(representation?.querySelectorAll('[data-graph-edge]'), file).toHaveLength(2);
        }
      }
      expect(alignedIds[0], contract.unitId).toEqual(alignedIds[1]);
    }
  }, 15_000);
});
