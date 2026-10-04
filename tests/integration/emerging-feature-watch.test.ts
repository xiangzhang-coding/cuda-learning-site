// SPDX-License-Identifier: Apache-2.0
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';
import { watchBoundaryIssues } from '../../src/content-metadata';
import current from '../../src/current-publication-manifest.json';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const root = path.resolve(import.meta.dirname, '../..');
const ids = ['W01', 'W02', 'W03', 'W04', 'W05', 'W06'];
const empty = { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] };

describe('Emerging Feature Watch publication contract', () => {
  it.each(ids)('%s has a complete, aligned, evidence-neutral Publication Pair', async id => {
    const destination = PUBLISHED_DESTINATIONS[id];
    const pair = [];
    for (const locale of ['zh-CN', 'en'] as const) {
      const route = destination.href[locale];
      const text = await readFile(path.join(root, `src/content/docs${route.slice(0, -1)}.md`), 'utf8');
      const { frontmatter: data } = parseFrontmatter(text);
      const document = parseHTML(await readFile(path.join(root, `dist${route}index.html`), 'utf8')).document;
      pair.push(data);
      expect(data).toMatchObject({ unitId: id, resourceKind: 'emerging-feature-watch', prerequisites: destination.prerequisites,
        toolkitLanes: [], evidence: empty, factCheckDate: '2026-10-04', license: 'CC-BY-4.0', provenance: 'original' });
      expect(watchBoundaryIssues(data)).toEqual([]);
      expect(document.querySelectorAll('main h2')).toHaveLength(data.structure.length);
      expect(document.querySelector(`[data-locale-counterpart][href="${data.counterpart}"]`)).not.toBeNull();
      for (const edge of data.prerequisites) {
        expect(document.querySelector(`main a[href="${PUBLISHED_DESTINATIONS[edge].href[locale]}"]`), edge).not.toBeNull();
      }
      for (const source of data.sources) {
        expect(source.accessDate).toBe(data.factCheckDate);
        expect(source.version.length).toBeGreaterThan(0);
        expect(document.querySelector(`main a[href="${source.url}"]`), source.url).not.toBeNull();
      }
      expect(text).not.toContain('```'); // No unreviewed executable copy or fabricated output.
      expect(document.querySelector('meta[name="cuda:evidence-runtime"]')?.getAttribute('content')).toBe('none');
    }
    for (const key of ['structure', 'sources', 'prerequisites', 'toolkitLanes', 'hardwareGate', 'evidence']) {
      expect(pair[0][key], key).toEqual(pair[1][key]);
    }
  });

  it('rejects W prerequisite edges across all actual source resources and the destination graph', async () => {
    const directory = path.join(root, 'src/content/docs');
    for (const file of await readdir(directory, { recursive: true })) {
      if (!/\.mdx?$/.test(file)) continue;
      const { frontmatter } = parseFrontmatter(await readFile(path.join(directory, file), 'utf8'));
      expect(watchBoundaryIssues(frontmatter), file).toEqual([]);
    }
    for (const [id, destination] of Object.entries(PUBLISHED_DESTINATIONS)) {
      expect(destination.prerequisites.filter(edge => /^W\d{2}$/.test(edge)), id).toEqual([]);
    }
    expect(current.scope.emergingFeatureWatch).toEqual(ids);
    expect(current.scope.learningUnits).toHaveLength(110);
    expect(current.scope.learningUnits.some(id => id.startsWith('W'))).toBe(false);
  });

  it.each(['', 'en/'])('publishes the %sindex with all entries and separate promotion criteria', async prefix => {
    const document = parseHTML(await readFile(path.join(root, `dist/${prefix}watch/index.html`), 'utf8')).document;
    for (const id of ids) {
      expect(document.querySelector(`main a[href="${PUBLISHED_DESTINATIONS[id].href[prefix ? 'en' : 'zh-CN']}"]`)).not.toBeNull();
    }
    for (const token of ['Compile-Checked', 'Runtime-Verified', 'cuda-11.8', 'cuda-12.9', 'cuda-13.3']) {
      expect(document.querySelector('main')?.textContent).toContain(token);
    }
  });
});
