// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function readRoute(route: string) {
  const pathname = new URL(route, 'https://memory-visuals.invalid').pathname;
  const html = await readFile(path.join(projectRoot, 'dist', pathname.slice(1), 'index.html'), 'utf8');
  return parseHTML(html).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

const pairs = [
  {
    id: 'VIS04',
    pairId: 'vis04',
    tag: 'cuda-memory-transactions',
    slug: 'memory-transactions',
    related: 'M02,EX05',
    component: 'MemoryTransactionExplorer.astro',
    staticSelector: '[data-static-fallback] [data-static-case]',
    staticCount: 4,
  },
  {
    id: 'VIS05',
    pairId: 'vis05',
    tag: 'cuda-shared-memory-banks',
    slug: 'shared-memory-banks',
    related: 'M04,EX06',
    component: 'SharedMemoryBankExplorer.astro',
    staticSelector: '[data-static-fallback] [data-static-case]',
    staticCount: 5,
  },
  {
    id: 'VIS06',
    pairId: 'vis06',
    tag: 'cuda-memory-hierarchy-lifetime',
    slug: 'memory-hierarchy-lifetime',
    related: 'M01',
    component: 'MemoryHierarchyLifetime.astro',
    staticSelector: '[data-static-fallback] [data-static-memory-record]',
    staticCount: 6,
  },
] as const;

describe('VIS04-VIS06 memory Visual Explainers', () => {
  it.each(pairs.flatMap((pair) => [
    { ...pair, route: `/visuals/${pair.slug}/`, counterpart: `/en/visuals/${pair.slug}/` },
    { ...pair, route: `/en/visuals/${pair.slug}/`, counterpart: `/visuals/${pair.slug}/` },
  ]))('renders the standalone $id contract at $route', async ({
    id,
    pairId,
    tag,
    route,
    counterpart,
    related,
    staticSelector,
    staticCount,
  }) => {
    const document = await readRoute(route);
    const visual = document.querySelector(`${tag}[data-visual-id="${id}"]`);

    expect(visual).not.toBeNull();
    expect(document.querySelectorAll(`${tag}[data-visual-id="${id}"]`)).toHaveLength(1);
    expect(visual?.querySelector('[data-visual-controls][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-interactive-workbench][hidden]')).not.toBeNull();
    expect(visual?.querySelector('[data-static-fallback]')).not.toBeNull();
    expect(visual?.querySelectorAll(staticSelector)).toHaveLength(staticCount);
    expect(visual?.querySelector('[data-conceptual-only]')?.textContent?.trim().length).toBeGreaterThan(100);
    const evidenceBoundary = visual?.querySelector('[data-no-evidence]')?.textContent ?? '';
    for (const status of ['Compile-Checked', 'Community-Observed', 'Runtime-Verified']) {
      expect(evidenceBoundary).toContain(status);
    }
    expect(visual?.querySelector('canvas, img, iframe, object, embed, form')).toBeNull();
    expect(visual?.querySelector('[role="status"][aria-live="polite"]')).not.toBeNull();
    expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(counterpart);

    expect(metadata(document, 'cuda:pair-id')).toBe(pairId);
    expect(metadata(document, 'cuda:unit-id')).toBe(id);
    expect(metadata(document, 'cuda:resource-kind')).toBe('visual-explainer');
    expect(metadata(document, 'cuda:fact-check-date')).toBe('2026-08-27');
    expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
    expect(metadata(document, 'cuda:related-units')).toBe(related);
    expect(metadata(document, 'cuda:source-count')).toBe('4');
    for (const name of [
      'cuda:evidence-compilation',
      'cuda:evidence-runtime',
      'cuda:expected-observations',
      'cuda:recorded-observations',
    ]) {
      expect(metadata(document, name), `${route}: ${name}`).toBe('none');
    }
  });

  it('renders VIS04 controls and model-derived segment ledgers in both locales', async () => {
    for (const route of ['/visuals/memory-transactions/', '/en/visuals/memory-transactions/']) {
      const document = await readRoute(route);
      const visual = document.querySelector('cuda-memory-transactions');

      expect(visual?.getAttribute('data-segment-groups')).toBe('4');
      expect(visual?.querySelectorAll('[data-memory-field]')).toHaveLength(4);
      expect([...visual!.querySelectorAll('[data-memory-field]')].map((field) => field.getAttribute('data-memory-field'))).toEqual([
        'elementSize',
        'stride',
        'offset',
        'activeLanes',
      ]);
      expect(visual?.querySelector('[data-memory-pattern]')).not.toBeNull();
      const tableWrap = visual?.querySelector('.memory-table-wrap');
      expect(tableWrap?.getAttribute('tabindex')).toBe('0');
      expect(tableWrap?.getAttribute('aria-label')).toBe(
        route.startsWith('/en/')
          ? 'Scrollable lane, address, and segment mapping table'
          : '可横向滚动的 lane、地址与 segment 映射表',
      );
      expect(visual?.querySelectorAll('[data-memory-lanes] tr')).toHaveLength(32);
      expect(visual?.querySelectorAll('[data-memory-segments] li')).toHaveLength(4);
      expect([...visual!.querySelectorAll('[data-static-case]')].map((card) => card.getAttribute('data-static-case'))).toEqual([
        'aligned-contiguous',
        'offset-four',
        'stride-two',
        'partial-warp',
      ]);
      expect(visual?.querySelector('[data-static-case="offset-four"] dd strong')?.textContent).toBe('5');
      expect(visual?.querySelector('[data-static-case="stride-two"] dd strong')?.textContent).toBe('8');
    }
  });

  it('renders VIS05 address-to-bank mappings and broadcast as a separate static class', async () => {
    for (const route of ['/visuals/shared-memory-banks/', '/en/visuals/shared-memory-banks/']) {
      const document = await readRoute(route);
      const visual = document.querySelector('cuda-shared-memory-banks');

      expect(visual?.getAttribute('data-classification')).toBe('conflict-free');
      expect(visual?.getAttribute('data-conflict-degree')).toBe('1');
      const tableWrap = visual?.querySelector('.memory-table-wrap');
      expect(tableWrap?.getAttribute('tabindex')).toBe('0');
      expect(tableWrap?.getAttribute('aria-label')).toBe(
        route.startsWith('/en/')
          ? 'Scrollable lane, word address, and bank mapping table'
          : '可横向滚动的 lane、word address 与 bank 映射表',
      );
      expect([...visual!.querySelectorAll('[data-bank-field]')].map((field) => field.getAttribute('data-bank-field'))).toEqual([
        'bankCount',
        'stride',
        'padding',
      ]);
      expect(visual?.querySelectorAll('[data-bank-mappings] tr')).toHaveLength(32);
      expect(visual?.querySelectorAll('[data-bank-groups] li')).toHaveLength(32);
      expect([...visual!.querySelectorAll('[data-static-case]')].map((card) => card.getAttribute('data-static-case'))).toEqual([
        'stride-one',
        'stride-two',
        'stride-thirty-two',
        'padded-thirty-three',
        'broadcast',
      ]);
      expect(visual?.querySelector('[data-static-case="broadcast"]')?.textContent).toContain('SAME-ADDRESS BROADCAST');
      expect(visual?.textContent).toMatch(/same-address write/i);
    }
  });

  it('renders all six VIS06 records in both the static layers and full table', async () => {
    const expected = ['host', 'global', 'constant', 'shared', 'local', 'register'];
    for (const route of ['/visuals/memory-hierarchy-lifetime/', '/en/visuals/memory-hierarchy-lifetime/']) {
      const document = await readRoute(route);
      const visual = document.querySelector('cuda-memory-hierarchy-lifetime');

      expect(visual?.getAttribute('data-visible-records')).toBe('6');
      expect(visual?.getAttribute('data-operation')).toBe('all');
      expect(visual?.querySelector('[data-scope-filter]')).not.toBeNull();
      expect(visual?.querySelectorAll('[data-operation-filter]')).toHaveLength(1);
      expect([...visual!.querySelectorAll('[data-operation-filter] option')].map((option) => option.getAttribute('value'))).toEqual([
        'all',
        'host-language',
        'runtime-api',
        'symbol-api',
        'kernel-declaration',
        'compiler-placement',
      ]);
      expect([...visual!.querySelectorAll('[data-static-memory-record]')].map((row) => row.getAttribute('data-static-memory-record'))).toEqual(expected);
      expect([...visual!.querySelectorAll('[data-layer-memory]')].map((item) => item.getAttribute('data-layer-memory')).sort()).toEqual([...expected].sort());
      expect(visual?.querySelectorAll('[data-physical-layer]')).toHaveLength(3);
      expect(visual?.textContent).toMatch(/cache.*not|cache.*不是/i);
      expect(visual?.textContent).toMatch(/local.*not.*on-chip|Local.*不.*on-chip/is);
    }
  });

  it('pins source coordinates and ships the required adaptive CSS contracts', async () => {
    for (const pair of pairs) {
      for (const localePrefix of ['', 'en/']) {
        const source = await readFile(
          path.join(projectRoot, 'src/content/docs', localePrefix, 'visuals', `${pair.slug}.mdx`),
          'utf8',
        );
        for (const coordinate of [
          'cuda-programming-guide/02-basics/writing-cuda-kernels.html',
          'cuda-c-best-practices-guide/index.html#memory-optimizations',
          'cuda-runtime-api/group__CUDART__MEMORY.html',
          'cuda/archive/11.8.0/cuda-c-programming-guide/index.html',
        ]) {
          expect(source, `${pair.id}: ${coordinate}`).toContain(coordinate);
        }
        expect(source.match(/accessDate: '2026-08-27'/g)).toHaveLength(4);
      }

      const component = await readFile(path.join(projectRoot, 'src/components', pair.component), 'utf8');
      expect(component).toContain(`data-visual-id="${pair.id}"`);
      expect(component).toContain('data-static-fallback');
      expect(component).toContain('data-conceptual-only');
      expect(component).toContain('data-no-evidence');
      expect(component).toMatch(/controls\.hidden = false/);
    }

    const styles = await readFile(path.join(projectRoot, 'src/styles/visual-explainers.css'), 'utf8');
    expect(styles).toMatch(/@media \(max-width:/);
    expect(styles).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(styles).toMatch(/@media \(forced-colors: active\)/);
    expect(styles).toMatch(/@media print/);
    expect(styles).toMatch(/\.memory-workbench[\s\S]*display: none !important/);
  });
});
