// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';

describe('T04/T05/LAB16 Publication Pairs', () => {
  it.each([
    ['triton/blocked-matrix-multiplication.mdx', 'T04', ['T02', 'A08', 'Q10']],
    ['triton/autotuning.mdx', 'T05', ['T04', 'Q05', 'Q06']],
    ['labs/autotune-triton-gemm.mdx', 'LAB16', ['T04', 'T05']],
    ['triton/blocked-matrix-multiplication/exercises.md', 'T04-EXERCISES', ['T04']],
    ['triton/blocked-matrix-multiplication/solutions.md', 'T04-SOLUTIONS', ['T04-EXERCISES']],
    ['triton/autotuning/exercises.md', 'T05-EXERCISES', ['T05']],
    ['triton/autotuning/solutions.md', 'T05-SOLUTIONS', ['T05-EXERCISES']],
  ])('publishes %s with exact prerequisites and no invented observations', async (file, id, prerequisites) => {
    const pair = await Promise.all(['', 'en/'].map(async locale =>
      parseFrontmatter(await readFile(`src/content/docs/${locale}${file}`, 'utf8'))));
    for (const { frontmatter: data } of pair) {
      expect(data).toMatchObject({ unitId: id, prerequisites, factCheckDate: '2026-09-14' });
      expect(data.evidence.compilation).toEqual([]);
      expect(data.evidence.recordedObservations).toEqual([]);
      expect(data.evidence.runtime).toEqual(id === 'LAB16' ? ['Pending Hardware Verification'] : []);
    }
    for (const key of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence', 'tritonProfile']) {
      expect(pair[0].frontmatter[key]).toEqual(pair[1].frontmatter[key]);
    }
  });
});
