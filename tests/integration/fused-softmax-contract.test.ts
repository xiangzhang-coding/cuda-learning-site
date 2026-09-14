// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';

const root = path.resolve(import.meta.dirname, '../..');
describe('T03 and LAB15 learner publication contract', () => {
  it.each([
    ['triton/fused-softmax.mdx', 'T03', ['T02', 'A10', 'Q05']],
    ['labs/verify-fused-softmax.mdx', 'LAB15', ['T02', 'A10', 'Q05']],
    ['triton/fused-softmax/exercises.md', 'T03-EXERCISES', ['T03']],
    ['triton/fused-softmax/solutions.md', 'T03-SOLUTIONS', ['T03-EXERCISES']],
  ])('publishes the aligned %s pair with honest evidence', async (file, id, prerequisites) => {
    const pair = await Promise.all(['', 'en/'].map(async prefix =>
      parseFrontmatter(await readFile(path.join(root, 'src/content/docs', prefix, file as string), 'utf8'))));
    for (const { frontmatter: data } of pair) {
      expect(data).toMatchObject({ unitId: id, prerequisites, factCheckDate: '2026-09-14' });
      expect(data.evidence.compilation).toEqual([]);
      expect(data.evidence.recordedObservations).toEqual([]);
      expect(data.evidence.runtime).toEqual(id === 'LAB15' ? ['Pending Hardware Verification'] : []);
    }
    for (const field of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence', 'tritonProfile']) {
      expect(pair[0].frontmatter[field]).toEqual(pair[1].frontmatter[field]);
    }
  });
});
