// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import current from '../../src/current-publication-manifest.json';

const slug = 'multi-gpu/pytorch-ddp-nccl';
const empty = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };
const externalLinks = (document: Document) => [...new Set([...document.querySelectorAll('main a[href]')]
  .map(node => node.getAttribute('href')!).filter(href => href.startsWith('https://')))].sort();

describe('issue #55 DDP publication contract', () => {
  it.each(['G07', 'G07-EXERCISES', 'G07-SOLUTIONS'])('%s has aligned metadata, rendered structure and exact prerequisite links', async id => {
    const pair = await Promise.all((['zh-CN', 'en'] as const).map(async locale => {
      const destination = PUBLISHED_DESTINATIONS[id];
      const route = destination.href[locale];
      const raw = await readFile(`src/content/docs${route.slice(0, -1)}.md`, 'utf8');
      const { frontmatter: data } = parseFrontmatter(raw);
      const document = parseHTML(await readFile(`dist${route}index.html`, 'utf8')).document;
      expect(data).toMatchObject({ unitId: id, factCheckDate: '2026-09-20', prerequisites: destination.prerequisites,
        evidence: empty, hardwareGate: 'none', license: 'CC-BY-4.0', provenance: 'original' });
      for (const edge of destination.prerequisites) expect(document.querySelector(`main a[href="${PUBLISHED_DESTINATIONS[edge].href[locale]}"]`)).not.toBeNull();
      expect(document.querySelector('[data-locale-counterpart]')?.getAttribute('href')).toBe(data.counterpart);
      expect(document.querySelectorAll('main h2')).toHaveLength(data.structure.length);
      for (const { attrs } of data.head) {
        expect(document.querySelectorAll(`meta[name="${attrs.name}"]`)).toHaveLength(1);
        expect(document.querySelector(`meta[name="${attrs.name}"]`)?.getAttribute('content')).toBe(attrs.content);
      }
      expect(raw).toContain('Pending Hardware Verification');
      expect(raw).toContain('src-cuda-100');
      const hints = document.querySelectorAll('main details');
      expect(hints).toHaveLength(id.endsWith('EXERCISES') ? 6 : 0);
      for (const hint of hints) expect(hint.hasAttribute('open')).toBe(false);
      return { raw, data, document };
    }));
    for (const key of ['structure', 'prerequisites', 'sources', 'evidence', 'relatedUnits']) expect(pair[0].data[key]).toEqual(pair[1].data[key]);
    expect(externalLinks(pair[0].document)).toEqual(externalLinks(pair[1].document));
    const commands = pair.map(({ document }) => [...document.querySelectorAll('main pre')].map(node => node.textContent));
    expect(commands[0]).toEqual(commands[1]);
    if (id === 'G07') {
      for (const { raw, document } of pair) {
        for (const phrase of ['2.11.0+cu128', '2.28.9', '12.8.90', 'LOCAL_RANK', 'no_sync', 'record_stream', 'device_id',
          'destroy_process_group', '--max-restarts=0', '--kill-after=10s', '180s', 'NCCL_DEBUG=INFO', 'TORCH_NCCL_ASYNC_ERROR_HANDLING=3']) expect(raw).toContain(phrase);
        expect(document.querySelectorAll('main ol > li')).toHaveLength(8);
      }
    }
  });

  it('keeps derived arithmetic aligned across solutions and registers only evidence-neutral additions', async () => {
    const rows = await Promise.all(['', 'en/'].map(async locale => {
      const doc = parseHTML(await readFile(`dist/${locale}${slug}/solutions/index.html`, 'utf8')).document;
      return [...doc.querySelectorAll('main table:first-of-type tbody tr')].slice(0, 4)
        .map(row => [...row.querySelectorAll('td')].map(cell => cell.textContent?.trim()));
    }));
    expect(rows[0]).toEqual(rows[1]);
    expect(rows[0]).toEqual([
      ['baseline', '0', '2.5', '0.6875'], ['baseline', '1', '1.71875', '0.47265625'],
      ['accumulate', '0', '4.5', '0.4375'], ['accumulate', '1', '1.96875', '0.19140625'],
    ]);
    for (const id of ['PB-R6-008', 'PB-R6-009', 'SRC-CUDA-100']) {
      const records = RESOURCE_INDEX_RECORDS.filter(record => record.planningId === id);
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ relatedUnits: ['G07'], reviewedOn: '2026-09-20' });
      expect(records[0].evidence).toBeUndefined();
    }
    expect(current.scope.learningUnits).toContain('G07');
    expect(current.evidence.runtimeVerified).toEqual([]);
    expect(current.evidence.pendingHardwareVerification).toHaveLength(41);
  });

  it('keeps the exact NCCL rights separate from the newer EX24 source', async () => {
    const rights = await readFile('CONTENT_LICENSES.md', 'utf8');
    const section = rights.split('## G07 DDP source rights')[1].split('\n## ')[0];
    for (const coordinate of ['2.28.9', 'dbc86fd06e8b0c4517b95d8958a09ccacf9520c9',
      'nvidia_nccl_cu12-2.28.9.dist-info/licenses/License.txt', '0f0174a6b4e0b33ac26375bf729533075b32f4c51a5b6802a3d742d7dcdc9a76',
      'BSD three-clause', 'NVTX', '1895']) expect(section).toContain(coordinate);
  });
});
