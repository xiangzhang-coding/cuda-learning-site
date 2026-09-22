// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import current from '../../src/current-publication-manifest.json';
import r6 from '../../src/r6-release-manifest.json';

const ids = ['H01', 'H01-EXERCISES', 'H01-SOLUTIONS', 'H02', 'H02-EXERCISES', 'H02-SOLUTIONS', 'VIS15'];
const empty = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };
describe('issue #59 complete architecture publication', () => {
  it.each(ids)('%s has aligned source, structure, prerequisites, locale and evidence contracts', async id => {
    const destination = PUBLISHED_DESTINATIONS[id];
    const pair = await Promise.all((['zh-CN', 'en'] as const).map(async locale => {
      const route = destination.href[locale];
      const raw = await readFile(`src/content/docs${route.slice(0, -1)}.${id === 'VIS15' ? 'mdx' : 'md'}`, 'utf8');
      const { frontmatter: data } = parseFrontmatter(raw);
      const document = parseHTML(await readFile(`dist${route}index.html`, 'utf8')).document;
      expect(data).toMatchObject({ unitId: id, prerequisites: destination.prerequisites, evidence: empty,
        factCheckDate: '2026-09-22', license: 'CC-BY-4.0', provenance: 'original', hardwareGate: 'none' });
      expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(data.counterpart);
      expect(document.querySelectorAll('main h2')).toHaveLength(data.structure.length);
      for (const edge of data.prerequisites) expect(document.querySelector(`main a[href="${PUBLISHED_DESTINATIONS[edge].href[locale]}"]`)).not.toBeNull();
      for (const { attrs } of data.head) expect(document.querySelector(`meta[name="${attrs.name}"]`)?.getAttribute('content')).toBe(attrs.content);
      expect(document.querySelectorAll('main details')).toHaveLength(id.endsWith('EXERCISES') ? 4 : 0);
      expect(document.querySelectorAll('main details[open]')).toHaveLength(0);
      expect(raw).toContain('Pending Hardware Verification');
      return { data, document };
    }));
    for (const key of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence']) expect(pair[0].data[key]).toEqual(pair[1].data[key]);
    const code = (document: Document) => [...document.querySelectorAll('main pre')].map(node => node.textContent);
    expect(code(pair[0].document)).toEqual(code(pair[1].document));
  });
  it('publishes only complete Turing/Ampere states and the owner-reviewed static matrix', async () => {
    for (const prefix of ['', 'en/']) {
      const document = parseHTML(await readFile(`dist/${prefix}visuals/architecture-evolution/index.html`, 'utf8')).document;
      const visual = document.querySelector('[data-visual-id="VIS15"]')!;
      const rows = [...visual.querySelectorAll('tbody tr')];
      const cells = (i: number) => [...rows[i].querySelectorAll('td')].map(node => node.textContent?.trim());
      expect(cells(1)).toEqual(['64 KiB', '163 KiB', '99 KiB', '163 KiB']);
      expect(cells(8)).toEqual(prefix ? ['Not available', 'Available', 'Not available', 'Not available'] : ['不具备', '具备', '不具备', '不具备']);
      expect(visual.querySelectorAll('[data-capability] option')).toHaveLength(5);
      expect(visual.querySelector('[data-controls]')?.hasAttribute('hidden')).toBe(true);
      expect(visual.querySelector('.comparison')?.getAttribute('tabindex')).toBe('0');
      expect(visual.textContent).not.toMatch(/Hopper|Ada|Blackwell|Coming soon/);
    }
  });
  it('keeps exact new prerequisites and current counts separate from frozen R6 and GPU evidence', () => {
    expect(PUBLISHED_DESTINATIONS.H01.prerequisites).toEqual(['F06', 'M06']);
    expect(PUBLISHED_DESTINATIONS.H02.prerequisites).toEqual(['H01', 'M13', 'L08']);
    expect(current.scope).toMatchObject({ publicationPairs: 383, sourceRoutes: 766, exerciseSetPublicationPairs: 105,
      solutionSetPublicationPairs: 105, practiceBankEntries: 117, sourceRecords: 119 });
    expect(current.scope.learningUnits).toHaveLength(106);
    expect(current.scope.visualExplainers).toHaveLength(22);
    expect(RESOURCE_INDEX_RECORDS).toHaveLength(483);
    expect(r6.scope.publicationPairs).toBe(376);
    expect(current.evidence.pendingHardwareVerification).toEqual(r6.evidence.pendingHardwareVerification);
    expect(current.evidence.runtimeVerified).toEqual([]);
    for (const id of ['PB-R7-001', 'PB-R7-002', 'SRC-CUDA-103', 'SRC-CUDA-104']) {
      expect(RESOURCE_INDEX_RECORDS.filter(record => record.planningId === id)).toHaveLength(1);
    }
  });
});
