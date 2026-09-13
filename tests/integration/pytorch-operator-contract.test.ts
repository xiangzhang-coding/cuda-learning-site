// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';

const root = path.resolve(import.meta.dirname, '../..');
const units = [
  ['P08', 'frameworks/first-custom-operator', ['O04', 'F04', 'Q01', 'P04']],
  ['P09', 'frameworks/operator-registration', ['P08', 'Q01']],
  ['P10', 'frameworks/operator-packaging', ['P08', 'M18']],
] as const;
const pages = [
  ...units.flatMap(([id, slug, prerequisites]) => [
    { id, slug, prerequisites, kind: 'learning-unit' },
    { id: `${id}-EXERCISES`, slug: `${slug}/exercises`, prerequisites: [id], kind: 'exercise-set' },
    { id: `${id}-SOLUTIONS`, slug: `${slug}/solutions`, prerequisites: [`${id}-EXERCISES`], kind: 'solution-set' },
  ]),
  { id: 'EX22', slug: 'examples/adjacent-energy', prerequisites: ['P08', 'P09'], kind: 'runnable-example' },
  { id: 'LAB13', slug: 'labs/build-custom-operator', prerequisites: ['P08', 'P09'], kind: 'lab' },
];
const empty = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };

async function page(locale: string, slug: string) {
  const ext = /\/(exercises|solutions)$/.test(slug) ? 'md' : 'mdx';
  const raw = await readFile(path.join(root, 'src/content/docs', locale, `${slug}.${ext}`), 'utf8');
  const document = parseHTML(await readFile(path.join(root, 'dist', locale, slug, 'index.html'), 'utf8')).document;
  return { raw, metadata: parseFrontmatter(raw).frontmatter, document };
}

describe('issue #44 original custom operator Publication Pairs', () => {
  it.each(pages)('$id preserves exact prerequisites, paired semantics and rendered head metadata', async (item) => {
    const pair = await Promise.all(['', 'en'].map((locale) => page(locale, item.slug)));
    expect(PUBLISHED_DESTINATIONS[item.id].prerequisites).toEqual(item.prerequisites);
    for (const field of ['pairId', 'unitId', 'resourceKind', 'prerequisites', 'relatedUnits', 'structure', 'sources', 'evidence', 'canonicalRanges', 'extensionProfile']) {
      expect(pair[0].metadata[field], `${item.id}: ${field}`).toEqual(pair[1].metadata[field]);
    }
    for (const [index, { raw, metadata: m, document }] of pair.entries()) {
      const prefix = index ? '/en' : '';
      expect(m).toMatchObject({ pairId: item.id.toLowerCase(), unitId: item.id, resourceKind: item.kind,
        prerequisites: item.prerequisites, factCheckDate: '2026-09-13', license: 'CC-BY-4.0', provenance: 'original' });
      const counterpart = `${index ? '' : '/en'}/${item.slug}/`;
      expect(m.counterpart).toBe(counterpart);
      const link = document.querySelector('[data-locale-counterpart]');
      expect(link?.getAttribute('href')).toBe(counterpart);
      expect(link?.getAttribute('lang')).toBe(index ? 'zh-CN' : 'en');
      expect(document.querySelectorAll('main h2').length).toBe(m.structure.length);
      expect(document.querySelector('main canvas, main iframe')).toBeNull();
      for (const entry of m.head) {
        const metas = document.querySelectorAll(`meta[name="${entry.attrs.name}"]`);
        expect(metas).toHaveLength(1);
        expect(metas[0].getAttribute('content')).toBe(String(entry.attrs.content));
      }
      for (const prerequisite of item.prerequisites) {
        const href = PUBLISHED_DESTINATIONS[prerequisite].href[index ? 'en' : 'zh-CN'];
        expect(document.querySelector(`main a[href="${href}"]`), prerequisite).not.toBeNull();
      }
      expect(m.evidence.compilation).toEqual([]);
      expect(m.evidence.recordedObservations).toEqual([]);
      if (item.id.startsWith('P')) expect(m.evidence).toEqual(empty);
      else {
        expect(m.evidence.runtime).toEqual(['Pending Hardware Verification']);
        expect(m.toolkitLanes).toEqual([]);
        expect(m.extensionProfile).toBe('ex22-torch211-cu128-cp312');
        expect(m.minimumComputeCapability).toBe('8.0');
        expect(m.maximumProblemMemoryBytes).toBe(8000000000);
        expect(m.gpuCount).toBe(1);
      }
      if (item.kind === 'learning-unit') {
        const questions = raw.split(/^## (?:Retrieval check|提取式自测)\s*$/m)[1]?.split('\n## ')[0];
        expect(questions?.match(/^\d+\. /gm)).toHaveLength(5);
        for (const suffix of ['exercises', 'solutions']) expect(raw).toContain(`${prefix}/${item.slug}/${suffix}/`);
      }
      if (item.kind === 'exercise-set') {
        expect(document.querySelectorAll('main details')).toHaveLength(4);
        expect(document.querySelectorAll('main details[open]')).toHaveLength(0);
        for (const label of ['Goal|目标', 'Constraints|约束', 'Expected evidence|预期证据', 'Acceptance criteria|验收标准']) {
          expect(raw.match(new RegExp(`\\*\\*(?:${label})[:：]\\*\\*`, 'g'))).toHaveLength(2);
        }
      }
      if (item.kind === 'solution-set') {
        expect(document.querySelectorAll('main details')).toHaveLength(0);
        expect(raw).toMatch(/Valid alternative|有效替代方案/);
        expect(raw).toMatch(/Common errors|常见错误/);
      }
    }
    const technical = pair.map(({ document }) => [...document.querySelectorAll('main table tr')].map((row) =>
      [...row.querySelectorAll('code')].map((node) => node.textContent)));
    expect(technical[0]).toEqual(technical[1]);
    const external = pair.map(({ document }) => [...new Set([...document.querySelectorAll('main a[href^="https:"]')]
      .map((node) => node.getAttribute('href')))].sort());
    expect(external[0]).toEqual(external[1]);
  });

  it('registers three original practice entries and two source ledgers at exact boundaries', async () => {
    for (const [index, [id]] of units.entries()) {
      const practiceId = `PB-R5-${String(index + 8).padStart(3, '0')}`;
      expect(RESOURCE_INDEX_RECORDS.find((record) => record.planningId === practiceId))
        .toMatchObject({ prerequisites: [id], reviewedOn: '2026-09-13' });
      for (const locale of ['', 'en']) {
        const { document } = await page(locale, 'practice');
        expect(document.querySelectorAll(`#${practiceId.toLowerCase()}`)).toHaveLength(1);
      }
    }
    for (const id of ['SRC-CUDA-084', 'SRC-CUDA-085']) {
      expect(RESOURCE_INDEX_RECORDS.find((record) => record.planningId === id))
        .toMatchObject({ reviewedOn: '2026-09-13', sourceAccessDate: '2026-09-13' });
      for (const locale of ['', 'en']) {
        const { document } = await page(locale, 'sources-and-versions');
        expect(document.querySelectorAll(`#${id.toLowerCase()}`)).toHaveLength(1);
      }
    }
  });
});
