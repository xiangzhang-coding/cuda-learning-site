// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import current from '../../src/current-publication-manifest.json';

const empty = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };
const links = (document: Document) => [...new Set([...document.querySelectorAll('main a[href]')]
  .map(node => node.getAttribute('href')!).filter(href => href.startsWith('https://')))].sort();

describe('issue #56 collective graph publication contract', () => {
  it.each(['G08', 'G08-EXERCISES', 'G08-SOLUTIONS'])('%s aligns metadata, prerequisites, structure and rights', async id => {
    const destination = PUBLISHED_DESTINATIONS[id];
    const pair = await Promise.all((['zh-CN', 'en'] as const).map(async locale => {
      const route = destination.href[locale];
      const raw = await readFile(`src/content/docs${route.slice(0, -1)}.md`, 'utf8');
      const { frontmatter: data } = parseFrontmatter(raw);
      const document = parseHTML(await readFile(`dist${route}index.html`, 'utf8')).document;
      expect(data).toMatchObject({ unitId: id, prerequisites: destination.prerequisites, factCheckDate: '2026-09-20',
        evidence: empty, hardwareGate: 'none', license: 'CC-BY-4.0', provenance: 'original' });
      expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(data.counterpart);
      expect(document.querySelectorAll('main h2')).toHaveLength(data.structure.length);
      for (const edge of destination.prerequisites) expect(document.querySelector(`main a[href="${PUBLISHED_DESTINATIONS[edge].href[locale]}"]`)).not.toBeNull();
      for (const { attrs } of data.head) {
        expect(document.querySelectorAll(`meta[name="${attrs.name}"]`)).toHaveLength(1);
        expect(document.querySelector(`meta[name="${attrs.name}"]`)?.getAttribute('content')).toBe(attrs.content);
      }
      const hints = document.querySelectorAll('main details');
      expect(hints).toHaveLength(id.endsWith('EXERCISES') ? 4 : 0);
      for (const hint of hints) expect(hint.hasAttribute('open')).toBe(false);
      expect(raw).toContain('Pending Hardware Verification');
      expect(raw).toContain('src-cuda-101');
      return { raw, data, document };
    }));
    for (const key of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence']) expect(pair[0].data[key]).toEqual(pair[1].data[key]);
    expect(links(pair[0].document)).toEqual(links(pair[1].document));
    if (id === 'G08') for (const { raw, document } of pair) {
      const captureRow = document.querySelector('main table tbody tr:nth-child(2)')?.textContent;
      expect(captureRow).toMatch(/input producer stays outside|输入生产者在图外/);
      expect(document.querySelectorAll('main ol > li')).toHaveLength(8);
      for (const contract of ['2.31.2', '13.3.1', '13.3.73', '610.43.02', 'CC≥7.5', 'CC≥9.0', '32,768',
        'cudaStreamEndCapture', 'cudaGraphInstantiate', 'cudaGraphExecDestroy', 'ncclCommDeregister', 'ncclMemFree',
        'NCCL_GRAPH_MIXING_SUPPORT=0', 'NCCL_GRAPH_STREAM_ORDERING=0', 'graphUsageMode=2', 'NCCL_LEGACY_CUDA_REGISTER=1',
        'NCCL_NVLS_ENABLE=2', 'PXN', 'CollNet', 'IB SHARP', 'NVSwitch', '180', 'CFT', 'one-sided RMA', 'Emerging Feature Watch']) expect(raw).toContain(contract);
    }
  });

  it('publishes an independent every-element replay oracle in both solution tables', async () => {
    for (const prefix of ['', 'en/']) {
      const doc = parseHTML(await readFile(`dist/${prefix}multi-gpu/nccl-graph-capture/solutions/index.html`, 'utf8')).document;
      const rows = [...doc.querySelectorAll('main table tbody tr')].map(row => [...row.querySelectorAll('td')].map(cell => Number(cell.textContent)));
      expect(rows).toEqual([0, 1, 2].map(k => [k, 1 + k, 2 + k, 3 + 2 * k, 6 + 4 * k]));
    }
  });

  it('registers exactly the new prerequisite-neutral source and two G08 practice entries', () => {
    expect(PUBLISHED_DESTINATIONS.G08.prerequisites).toEqual(['G05', 'M14']);
    for (const id of ['PB-R6-010', 'PB-R6-011', 'SRC-CUDA-101']) {
      const records = RESOURCE_INDEX_RECORDS.filter(record => record.planningId === id);
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ relatedUnits: ['G08'], reviewedOn: '2026-09-20' });
      expect(records[0].evidence).toBeUndefined();
      if (id.startsWith('PB-')) expect(records[0].prerequisites).toEqual(['G08']);
    }
    expect(current.scope.learningUnits).toContain('G08');
    expect(current.evidence.runtimeVerified).toEqual([]);
    expect(current.evidence.pendingHardwareVerification).toHaveLength(41);
    for (const id of ['EX25', 'LAB19']) expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(id);
  });

  it('binds inspected owner files to distinct licenses and bilingual immutable coordinates', async () => {
    const rights = (await readFile('CONTENT_LICENSES.md', 'utf8')).split('## G08 capture and registration source rights')[1].split('\n## ')[0];
    for (const item of ['Apache-2.0', 'BSD three-clause', 'not built or executed',
      'c1f53beabe4dbf05bd87c00f7ca6084c0cb541c3f7bf8edab7913f266018b7be',
      '88e8c1b85269ae234e8c56e1688fd3a1a10ea1d508b9228c38467b6877e10409']) expect(rights).toContain(item);
    const sections = await Promise.all(['', 'en/'].map(async prefix =>
      (await readFile(`src/content/docs/${prefix}sources-and-versions.mdx`, 'utf8')).split('### SRC-CUDA-101')[1].split('<span id="r4-aggregate-review"')[0]));
    const hashes = sections.map(section => [...section.matchAll(/`([a-f0-9]{64})`/g)].map(match => match[1]));
    expect(hashes[0]).toHaveLength(9);
    expect(hashes[0]).toEqual(hashes[1]);
  });
});
