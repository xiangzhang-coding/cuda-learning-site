// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import current from '../../src/current-publication-manifest.json';
import r5 from '../../src/r5-release-manifest.json';

describe('G01–G03 dependency-closed Publication Pairs', () => {
  it.each([
    ['G01', 'devices-contexts-ownership', ['F07', 'M07']],
    ['G02', 'peer-access-copies', ['G01', 'M01', 'M08']],
    ['G03', 'topology-paths', ['G01', 'O03']],
  ] as const)('%s publishes aligned instruction, gated practice and separate solutions', async (id, slug, edges) => {
    for (const [suffix, unit, prerequisites] of [
      ['', id, edges], ['/exercises', `${id}-EXERCISES`, [id]],
      ['/solutions', `${id}-SOLUTIONS`, [`${id}-EXERCISES`]],
    ] as const) {
      const pair = await Promise.all(['', 'en/'].map(async prefix => {
        const source = await readFile(`src/content/docs/${prefix}multi-gpu/${slug}${suffix}.md`, 'utf8');
        const { frontmatter } = parseFrontmatter(source);
        expect(frontmatter).toMatchObject({ unitId: unit, prerequisites,
          factCheckDate: '2026-09-19', license: 'CC-BY-4.0', provenance: 'original', hardwareGate: 'none',
          evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] } });
        expect(PUBLISHED_DESTINATIONS[unit].prerequisites).toEqual(prerequisites);
        for (const edge of prerequisites) {
          expect(PUBLISHED_DESTINATIONS[edge]).toBeDefined();
          const locale = prefix ? 'en' : 'zh-CN';
          expect(source).toContain(`](${PUBLISHED_DESTINATIONS[edge].href[locale]})`);
        }
        if (suffix === '/exercises') {
          expect(source.match(/<details>/g)).toHaveLength(4);
          expect(source).toContain('Pending Hardware Verification');
          expect(source).toContain('Environment Manifest');
        }
        return frontmatter;
      }));
      for (const field of ['sources', 'structure', 'prerequisites', 'relatedUnits', 'evidence']) {
        expect(pair[0][field]).toEqual(pair[1][field]);
      }
    }
  });
  it('extends the current inventory without changing the completed R5 or granting GPU evidence', () => {
    expect(current.scope.learningUnits).toEqual([...r5.scope.learningUnits, 'G01', 'G02', 'G03', 'G04', 'G05', 'G06', 'G07']);
    expect(current.scope.publicationPairs).toBe(r5.scope.publicationPairs + 25);
    expect(current.scope.practiceBankEntries).toBe(r5.scope.practiceBankEntries + 9);
    expect(current.evidence.compileChecked).toEqual(r5.evidence.compileChecked);
    expect(current.evidence.runtimeVerified).toEqual([]);
    for (const id of ['G08', 'EX25', 'LAB19']) expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(id);
  });
});
