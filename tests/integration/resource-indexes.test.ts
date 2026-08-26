// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import {
  INDEX_GROUPS,
  INDEX_LOCALES,
  INDEX_ROUTES,
  projectResourceIndex,
} from '../../src/resource-indexes/resource-index-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const asOf = new Date('2026-08-26T12:00:00Z');

async function readRoute(route: string) {
  const relativePath = route === '/' ? 'index.html' : `${route.slice(1)}index.html`;
  return parseHTML(await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8')).document;
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

describe('published resource indexes', () => {
  it.each(INDEX_GROUPS.flatMap((group) => INDEX_LOCALES.map((locale) => ({ group, locale }))))(
    'renders every eligible $group record in $locale from the validated catalog',
    async ({ group, locale }) => {
      const document = await readRoute(INDEX_ROUTES[group][locale]);
      const expected = projectResourceIndex(RESOURCE_INDEX_RECORDS, group, locale, { asOf });
      const cards = [...document.querySelectorAll<HTMLElement>('[data-resource-card]')];

      expect(cards.map((card) => card.dataset.resourceId)).toEqual(expected.map(({ planningId }) => planningId));
      expect(document.querySelector('[data-resource-controls]')?.hasAttribute('hidden')).toBe(true);
      expect(cards.every((card) => !card.hasAttribute('hidden'))).toBe(true);
      expect(document.querySelector('[data-resource-empty]')?.hasAttribute('hidden')).toBe(true);

      for (const [index, item] of expected.entries()) {
        const card = cards[index];
        expect(card.querySelector('h3 a')?.getAttribute('href'), item.planningId).toBe(item.href);
        expect(card.querySelector('h3 a')?.textContent, item.planningId).toBe(item.title);
        expect(card.dataset.resourceType, item.planningId).toBe(item.resourceType);
        expect(card.dataset.resourceCounterpart, item.planningId).toBe(item.counterpart);
        expect(card.textContent, item.planningId).toContain(item.hardwareGate);
        expect(card.textContent, item.planningId).toContain(item.versionGate);
        expect(card.textContent, item.planningId).toContain(item.reviewedOn);
        for (const relation of [...item.prerequisites, ...item.relatedUnits]) {
          expect(card.querySelector(`a[href="${relation.href}"]`), `${item.planningId} -> ${relation.id}`).not.toBeNull();
        }
      }
    },
  );

  it('publishes no planned placeholder and keeps exact eligible populations', async () => {
    const counts = Object.fromEntries(
      INDEX_GROUPS.map((group) => [group, RESOURCE_INDEX_RECORDS.filter((record) => record.group === group).length]),
    );
    expect(counts).toEqual({ labs: 2, practice: 13, visuals: 2, glossary: 55, sources: 29 });
    expect(counts.glossary).toBeGreaterThanOrEqual(30);

    const indexedText = (
      await Promise.all(INDEX_GROUPS.map(async (group) => (await readRoute(INDEX_ROUTES[group].en)).querySelector('main')?.textContent ?? ''))
    ).join(' ');
    for (const absentId of ['LAB99', 'VIS99', 'PB-R0-999', 'TERM-999']) expect(indexedText).not.toContain(absentId);
    expect(indexedText).not.toMatch(/coming soon|即将推出/i);
  });

  it('indexes every built Lab and Visual Explainer subject discovered from production output', async () => {
    const discovered = { labs: new Set<string>(), visuals: new Set<string>() };
    const htmlFiles = (await readdir(path.join(projectRoot, 'dist'), { recursive: true }))
      .map((file) => file.split(path.sep).join('/'))
      .filter((file) => file.endsWith('.html'));

    for (const file of htmlFiles) {
      const document = parseHTML(await readFile(path.join(projectRoot, 'dist', file), 'utf8')).document;
      if (document.documentElement.lang !== 'zh-CN') continue;
      const resourceKind = metadata(document, 'cuda:resource-kind');
      const unitId = metadata(document, 'cuda:unit-id');
      if (resourceKind === 'lab' && unitId) discovered.labs.add(unitId);
      if (resourceKind === 'visual-explainer' && unitId) discovered.visuals.add(unitId);
    }

    for (const group of ['labs', 'visuals'] as const) {
      const indexed = RESOURCE_INDEX_RECORDS
        .filter((record) => record.group === group)
        .map(({ planningId }) => planningId)
        .sort();
      expect([...discovered[group]].sort()).toEqual(indexed);
    }
  });

  it('projects every Lab title and Evidence Status exactly and grants Visual Explainers no CUDA status', async () => {
    for (const locale of INDEX_LOCALES) {
      const labIndex = await readRoute(INDEX_ROUTES.labs[locale]);
      for (const item of projectResourceIndex(RESOURCE_INDEX_RECORDS, 'labs', locale, { asOf })) {
        const labCard = labIndex.querySelector(`[data-resource-id="${item.planningId}"]`);
        const lab = await readRoute(item.href);
        expect(labCard?.querySelector('h3 a')?.textContent, item.planningId).toBe(lab.querySelector('main h1')?.textContent);
        expect(labCard?.querySelector('[data-evidence-compilation]')?.getAttribute('data-evidence-compilation')).toBe(
          metadata(lab, 'cuda:evidence-compilation'),
        );
        expect(labCard?.querySelector('[data-evidence-runtime]')?.getAttribute('data-evidence-runtime')).toBe(
          metadata(lab, 'cuda:evidence-runtime'),
        );
      }
    }

    for (const route of ['/visuals/', '/en/visuals/']) {
      const document = await readRoute(route);
      expect(document.querySelectorAll('[data-resource-evidence]')).toHaveLength(0);
      expect(document.querySelectorAll('[data-resource-card] [data-no-evidence]')).toHaveLength(2);
      for (const card of document.querySelectorAll('[data-resource-card]')) {
        expect(card.textContent).not.toMatch(/Compile-Checked|Community-Observed|Runtime-Verified/);
        const href = card.querySelector('h3 a')?.getAttribute('href');
        expect(href).toBeTruthy();
        const visual = await readRoute(href ?? '');
        expect(card.querySelector('h3 a')?.textContent).toBe(visual.querySelector('main h1')?.textContent);
      }
    }
  });

  it.each([
    { group: 'practice', route: '/practice/', selector: '.resource-target[id^="pb-r"]' },
    { group: 'practice', route: '/en/practice/', selector: '.resource-target[id^="pb-r"]' },
    { group: 'glossary', route: '/glossary/', selector: '.resource-target[id^="term-"]' },
    { group: 'glossary', route: '/en/glossary/', selector: '.resource-target[id^="term-"]' },
    { group: 'sources', route: '/sources-and-versions/', selector: '.resource-target[id^="src-"]' },
    { group: 'sources', route: '/en/sources-and-versions/', selector: '.resource-target[id^="src-"]' },
  ] as const)('rejects orphaned $group detail anchors', async ({ group, route, selector }) => {
    const document = await readRoute(route);
    const detailIds = [...document.querySelectorAll(selector)].map(({ id }) => id.toUpperCase());
    const catalogIds = RESOURCE_INDEX_RECORDS
      .filter((record) => record.group === group)
      .map(({ planningId }) => planningId);
    expect(detailIds).toEqual(catalogIds);
  });

  it('ships an ephemeral static-first filter with no account or progress transport', async () => {
    for (const group of INDEX_GROUPS) {
      const route = INDEX_ROUTES[group].en;
      const relativePath = `${route.slice(1)}index.html`;
      const html = await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8');
      const document = parseHTML(html).document;
      const resourceScript = [...document.querySelectorAll('script')].find((script) =>
        script.textContent?.includes('cuda-resource-index'),
      )?.textContent ?? '';
      expect(html, route).toContain('customElements.define');
      expect(html, route).toContain('cuda-resource-index');
      expect(resourceScript, route).not.toBe('');
      expect(resourceScript, route).not.toMatch(/localStorage|sessionStorage|document\.cookie|indexedDB\.open|\bfetch\s*\(/);
      expect(html, route).not.toContain('<form');
    }
  });
});
