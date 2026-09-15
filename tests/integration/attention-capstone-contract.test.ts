// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';

describe('T08 capstone Publication Pair and source contract', () => {
  it.each([
    ['.mdx', 'T08', ['T03', 'T04', 'A11', 'P12']],
    ['/exercises.md', 'T08-EXERCISES', ['T08']],
    ['/solutions.mdx', 'T08-SOLUTIONS', ['T08-EXERCISES']],
  ])('aligns %s metadata and evidence', async (suffix, id, prerequisites) => {
    const pair = await Promise.all(['', 'en/'].map(async locale => {
      const text = await readFile(`src/content/docs/${locale}triton/attention-capstone${suffix}`, 'utf8');
      expect(text).toContain('Pending Hardware Verification');
      return parseFrontmatter(text).frontmatter;
    }));
    for (const data of pair) {
      expect(data).toMatchObject({ unitId: id, prerequisites, factCheckDate: '2026-09-15',
        license: 'CC-BY-4.0', provenance: 'original', hardwareGate: 'none',
        evidence: { compilation: [], runtime: [], expectedObservations: [], recordedObservations: [] } });
      const meta = Object.fromEntries(data.head.map(({ attrs }: { attrs: { name: string; content: string } }) => [attrs.name, attrs.content]));
      expect(meta['cuda:structure']).toBe(data.structure.join(','));
      expect(meta['cuda:prerequisites']).toBe(prerequisites.join(','));
    }
    for (const key of ['sources', 'structure', 'relatedUnits', 'evidence']) expect(pair[0][key]).toEqual(pair[1][key]);
  });
  it('reuses VIS18 and the exact solution module in both locales', async () => {
    for (const [prefix, locale] of [['', 'zh-CN'], ['en/', 'en']]) {
      const unit = await readFile(`src/content/docs/${prefix}triton/attention-capstone.mdx`, 'utf8');
      expect(unit).toContain(`<AttentionIoExplorer locale="${locale}" />`);
      expect(unit).toContain('28672 B');
      expect(unit).toContain('6144 B');
      const solution = await readFile(`src/content/docs/${prefix}triton/attention-capstone/solutions.mdx`, 'utf8');
      expect(solution).toContain('scripts/attention-capstone/kernel.py?raw');
      expect(solution).toContain('{kernel}');
    }
  });
  it('keeps pinned CPU and compiler gates distinct from runtime and retains exact rights', async () => {
    const ci = await readFile('.github/workflows/triton-example.yml', 'utf8');
    expect(ci).toContain('scripts/attention-capstone/check.py --mode cpu');
    expect(ci).toContain('scripts/attention-capstone/check.py --mode compile');
    expect(ci).not.toContain('scripts/attention-capstone/check.py --mode verify');
    const license = await readFile('examples/ex23-triton-vector-add/TRITON-LICENSE');
    expect(createHash('sha256').update(license).digest('hex')).toBe('92640fb97222fd0a698ff28ce0c3782c172623f8d6c609b557636a80f28fb946');
  });
});
