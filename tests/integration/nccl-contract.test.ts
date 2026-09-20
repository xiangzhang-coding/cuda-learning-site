// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';
import project from '../../examples/ex24-nccl-all-reduce/project.json';
import worksheet from '../../examples/ex24-nccl-all-reduce/environment-manifest.json';
import current from '../../src/current-publication-manifest.json';

describe('NCCL publication and independent evidence contract', () => {
  it.each(['G04', 'G05', 'G04-EXERCISES', 'G04-SOLUTIONS', 'G05-EXERCISES', 'G05-SOLUTIONS', 'EX24', 'LAB17', 'VIS16'])('%s has matching factual metadata and exact prerequisite links', async id => {
    const pair = await Promise.all(['zh-CN', 'en'].map(async locale => {
      const destination = PUBLISHED_DESTINATIONS[id];
      const route = destination.href[locale as 'en' | 'zh-CN'];
      const extension = ['EX24', 'VIS16'].includes(id) ? 'mdx' : 'md';
      const text = await readFile(`src/content/docs${route.slice(0, -1)}.${extension}`, 'utf8');
      const { frontmatter: data } = parseFrontmatter(text);
      expect(data).toMatchObject({ unitId: id, prerequisites: destination.prerequisites, factCheckDate: '2026-09-19', license: 'CC-BY-4.0', provenance: 'original' });
      for (const edge of destination.prerequisites) expect(text).toContain(`](${PUBLISHED_DESTINATIONS[edge].href[locale as 'en' | 'zh-CN']})`);
      expect(text).toContain(`href="${data.counterpart}"`);
      return data;
    }));
    for (const field of ['sources', 'structure', 'prerequisites', 'relatedUnits', 'canonicalRanges', 'evidence']) expect(pair[0][field]).toEqual(pair[1][field]);
  });
  it('requires a separate NCCL pin and at least two GPUs without manufacturing evidence', () => {
    expect(project.compatibility).toMatchObject({ requiredGpuCount: 2, maximumGpuCount: 8, nccl: { version: '2.31.2', versionCode: 23102, package: '2.31.2-1+cuda13.3' } });
    expect(project.evidence).toMatchObject({ compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] });
    expect(worksheet).toMatchObject({ rankLogs: [], correctness: [], recordedObservations: [], referenceEnvironment: null });
    for (const id of ['EX24', 'LAB17']) {
      expect(current.evidence.pendingHardwareVerification).toContain(id);
      expect(current.evidence.compileChecked).not.toContain(id);
    }
    expect(current.scope).toMatchObject({ publicationPairs: 373, sourceRoutes: 746, exerciseSetPublicationPairs: 102, solutionSetPublicationPairs: 102, practiceBankEntries: 113, sourceRecords: 116 });
  });
});
