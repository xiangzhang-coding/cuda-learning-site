// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';

describe('T06/T07 complete Publication Pairs', () => {
  it.each([
    ['debugging', 'T06', ['T02', 'Q03', 'Q04']],
    ['persistent-kernels', 'T07', ['T04', 'T05', 'Q09']],
  ])('keeps %s exact, complete and evidence-neutral', async (slug, id, prerequisites) => {
    for (const [suffix, unit, edges] of [
      ['.mdx', id, prerequisites], ['/exercises.md', `${id}-EXERCISES`, [id]],
      ['/solutions.md', `${id}-SOLUTIONS`, [`${id}-EXERCISES`]],
    ] as const) {
      const pair = await Promise.all(['', 'en/'].map(async locale =>
        parseFrontmatter(await readFile(`src/content/docs/${locale}triton/${slug}${suffix}`, 'utf8'))));
      for (const { frontmatter: data } of pair) {
        expect(data).toMatchObject({ unitId: unit, prerequisites: edges, factCheckDate: '2026-09-15',
          license: 'CC-BY-4.0', provenance: 'original', hardwareGate: 'none',
          evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] } });
        const meta = Object.fromEntries(data.head.map(({ attrs }: { attrs: { name: string; content: string } }) => [attrs.name, attrs.content]));
        expect(meta['cuda:structure']).toBe(data.structure.join(','));
        expect(meta['cuda:prerequisites']).toBe(edges.join(','));
      }
      for (const key of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'evidence'])
        expect(pair[0].frontmatter[key]).toEqual(pair[1].frontmatter[key]);
    }
  });

  it('retains the exact upstream license and a separately hashed interpreter dependency', async () => {
    const license = await readFile('examples/ex23-triton-vector-add/TRITON-LICENSE');
    expect(createHash('sha256').update(license).digest('hex')).toBe('92640fb97222fd0a698ff28ce0c3782c172623f8d6c609b557636a80f28fb946');
    const lock = await readFile('scripts/triton-diagnostics/requirements.lock', 'utf8');
    expect(lock).toContain('numpy==2.5.3 --hash=sha256:b0521d0f4aebb6e06189451025fa17a913287b13c03d5fe05c017333b654ea5b');
    const ci = await readFile('.github/workflows/triton-example.yml', 'utf8');
    expect(ci).toContain('"$PYTHON" -m unittest discover -s scripts/triton-diagnostics');
    expect(ci).not.toContain('--mode gpu');
  });
});
