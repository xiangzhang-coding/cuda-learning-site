// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import current from '../../src/current-publication-manifest.json';

const empty = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };
const slug = 'multi-gpu/multi-node-transport-failures';
const page = async (prefix: string, suffix = '') => parseHTML(await readFile(`dist/${prefix}${slug}${suffix}/index.html`, 'utf8')).document;

describe('issue #57 multi-node publication and redacted diagnostic contract', () => {
  it.each(['G09', 'G09-EXERCISES', 'G09-SOLUTIONS'])('%s preserves pair, prerequisite and evidence contracts', async id => {
    const destination = PUBLISHED_DESTINATIONS[id];
    const pair = await Promise.all((['zh-CN', 'en'] as const).map(async locale => {
      const route = destination.href[locale];
      const raw = await readFile(`src/content/docs${route.slice(0, -1)}.md`, 'utf8');
      const { frontmatter: data } = parseFrontmatter(raw);
      const document = parseHTML(await readFile(`dist${route}index.html`, 'utf8')).document;
      expect(data).toMatchObject({ unitId: id, prerequisites: destination.prerequisites, evidence: empty,
        factCheckDate: '2026-09-21', license: 'CC-BY-4.0', provenance: 'original', hardwareGate: 'none' });
      expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(data.counterpart);
      expect(document.querySelectorAll('main h2')).toHaveLength(data.structure.length);
      for (const edge of data.prerequisites) expect(document.querySelector(`main a[href="${PUBLISHED_DESTINATIONS[edge].href[locale]}"]`)).not.toBeNull();
      for (const { attrs } of data.head) {
        expect(document.querySelectorAll(`meta[name="${attrs.name}"]`)).toHaveLength(1);
        expect(document.querySelector(`meta[name="${attrs.name}"]`)?.getAttribute('content')).toBe(attrs.content);
      }
      expect(document.querySelectorAll('main details')).toHaveLength(id.endsWith('EXERCISES') ? 4 : 0);
      expect(document.querySelectorAll('main details[open]')).toHaveLength(0);
      expect(raw).toContain('Pending Hardware Verification');
      expect(raw).toContain('src-cuda-102');
      return { data, document };
    }));
    for (const key of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence']) expect(pair[0].data[key]).toEqual(pair[1].data[key]);
    const code = (document: Document) => [...document.querySelectorAll('main pre')].map(node => node.textContent);
    expect(code(pair[0].document)).toEqual(code(pair[1].document));
  });

  it('keeps fixture identities in a closed public alias vocabulary and labels both fixtures synthetic', async () => {
    const identities: Record<string, string[]> = {
      node: ['node-a', 'node-b'], process: ['process-a', 'process-b'],
      interface: ['mgmt0', 'data0', 'data1'], hca: ['mlx5_0'], rank: ['0', '1'],
    };
    for (const prefix of ['', 'en/']) {
      const document = await page(prefix, '/exercises');
      const fixtures = [...document.querySelectorAll('[data-diagnostic-fixture]')];
      expect(fixtures.map(node => node.getAttribute('data-diagnostic-fixture'))).toEqual(['F1', 'F2']);
      for (const fixture of fixtures) {
        expect(fixture.getAttribute('data-provenance')).toBe('synthetic');
        expect(fixture.getAttribute('data-evidence')).toBe('none');
        const text = [...fixture.querySelectorAll('pre .ec-line')].map(line => line.textContent).join('\n');
        expect(text).toContain('provenance=synthetic evidence=none');
        expect(text).toContain('recorded_result=none');
        // The public fixture grammar admits only symbolic key/value tokens:
        // no address, hostname suffix, credential encoding, path or free-form log payload.
        for (const token of text.trim().split(/\s+/)) {
          expect(token).toMatch(/^[a-z_]+=[a-zA-Z0-9_-]+$/);
          const [key, value] = token.split('=');
          expect(['fixture', 'provenance', 'evidence', 'node', 'process', 'rank', 'local_rank', 'gpu_visible',
            'interface', 'state', 'peer_route', 'hca', 'port', 'link_layer', 'provider', 'launcher',
            'selected_transport', 'recorded_result', 'seq', 'phase', 'op', 'count', 'dtype',
            'collective_submit', 'clocks', 'termination', 'recovery']).toContain(key);
          if (identities[key]) expect(identities[key]).toContain(value);
        }
      }
      const failure = fixtures[1].textContent!;
      expect(failure).toContain('collective_submit=missing');
      expect(failure).toContain('selected_transport=unknown clocks=uncorrelated termination=unconfirmed');
      expect(failure).toContain('recovery=unattempted');
    }
  });

  it('checks the worked oracle independently rather than accepting printed result labels', async () => {
    for (const prefix of ['', 'en/']) {
      const document = await page(prefix, '/solutions');
      const rows = [...document.querySelectorAll('main table tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => Number(cell.textContent)));
      expect(rows).toEqual([0, 16, 256].map(i => {
        const inputs = [0, 1].map(r => 3 * (r + 1) + (i % 17) - 8);
        return [i, ...inputs, inputs.reduce((sum, value) => sum + value, 0)];
      }));
    }
  });

  it('publishes G09 resources without admitting a fictitious Lab or runtime result', () => {
    expect(PUBLISHED_DESTINATIONS.G09.prerequisites).toEqual(['G03', 'G04', 'Q07']);
    for (const id of ['PB-R6-012', 'PB-R6-013', 'SRC-CUDA-102']) {
      const records = RESOURCE_INDEX_RECORDS.filter(record => record.planningId === id);
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ relatedUnits: ['G09'], reviewedOn: '2026-09-21' });
      expect(records[0].evidence).toBeUndefined();
      if (id.startsWith('PB-')) expect(records[0].prerequisites).toEqual(['G09']);
    }
    expect(current.scope.learningUnits).toContain('G09');
    expect(current.evidence.runtimeVerified).toEqual([]);
    expect(current.evidence.pendingHardwareVerification).toHaveLength(41);
    expect(PUBLISHED_DESTINATIONS).not.toHaveProperty('LAB19');
  });

  it('aligns immutable owner references, hashes and separate source licenses', async () => {
    const sections = await Promise.all(['', 'en/'].map(async prefix =>
      (await readFile(`src/content/docs/${prefix}sources-and-versions.mdx`, 'utf8')).split('### SRC-CUDA-102')[1].split('<span id="src-cuda-101"')[0]));
    const hashes = sections.map(section => [...section.matchAll(/`([a-f0-9]{64})`/g)].map(match => match[1]));
    expect(hashes[0]).toHaveLength(11);
    expect(hashes[0]).toEqual(hashes[1]);
    const urls = sections.map(section => [...section.matchAll(/https:\/\/github.com\/[^)]+/g)].map(match => match[0]));
    expect(urls[0]).toEqual(urls[1]);
    const rights = (await readFile('CONTENT_LICENSES.md', 'utf8')).split('## G09 multi-node source rights')[1].split('\n## ')[0];
    for (const term of ['CC BY 4.0', 'Apache-2.0', 'BSD three-clause', 'not built or executed', ...hashes[0].slice(-2)]) expect(rights).toContain(term);
  });
});
