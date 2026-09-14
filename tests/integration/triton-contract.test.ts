// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';
import { loadCanonicalExample, readCanonicalRange, validateCanonicalExample } from '../../scripts/lib/canonical-examples.mjs';

const root = path.resolve(import.meta.dirname, '../..');
describe('issue #46 Triton publication contract', () => {
  it('keeps the example independent, canonical, hashed and unobserved', async () => {
    expect(await validateCanonicalExample(root, 'EX23')).toEqual([]);
    const project = await loadCanonicalExample(root, 'EX23');
    expect(project.compatibility).toMatchObject({ lanes: [], minimumComputeCapability: '8.0',
      pythonEnvironment: { triton: '3.7.1', torch: '2.13.0', python: { version: '3.14.7' } } });
    expect(project.build).toMatchObject({ gpuExecutionInBuild: false, driverInitializationInBuild: false });
    expect(project.evidence).toMatchObject({ compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [] });
    const kernel = (await readCanonicalRange(root, 'EX23', 'kernel')).code;
    expect(kernel.match(/tl.load\([^\n]+mask=valid, other=0.0\)/g)).toHaveLength(2);
    expect(kernel).toContain('tl.store(result + indices, lhs + rhs, mask=valid)');
    const lock = await readFile(path.join(root, project.root, 'requirements.lock'), 'utf8');
    const compilerLock = await readFile(path.join(root, project.root, 'compiler.lock'), 'utf8');
    expect(lock).toContain('2020153b08280415ec0da6607834e79166442147e78e144df06b508c75b186d2');
    expect(compilerLock).toContain('triton==3.7.1 --hash=sha256:2020153b08280415ec0da6607834e79166442147e78e144df06b508c75b186d2');
  });

  it.each([
    ['triton/programs-and-block-values', 'T01', ['F02', 'F03', 'M02']],
    ['triton/masked-vector-addition', 'T02', ['T01', 'A01']],
    ['examples/triton-vector-add', 'EX23', ['T02']],
    ['visuals/simt-triton-mapping', 'VIS17', ['T01']],
  ] as const)('publishes aligned source and teaching contracts for %s', async (slug, id, prerequisites) => {
    const pairs = await Promise.all(['', 'en/'].map(async (prefix) =>
      parseFrontmatter(await readFile(path.join(root, `src/content/docs/${prefix}${slug}.mdx`), 'utf8'))));
    for (const { frontmatter: data } of pairs) {
      expect(data).toMatchObject({ unitId: id, prerequisites, factCheckDate: '2026-09-14' });
      expect(data.evidence.compilation).toEqual([]);
      expect(data.evidence.recordedObservations).toEqual([]);
    }
    for (const field of ['structure', 'sources', 'prerequisites', 'relatedUnits', 'canonicalRanges', 'evidence']) {
      expect(pairs[0].frontmatter[field], `${id} ${field}`).toEqual(pairs[1].frontmatter[field]);
    }
    if (id.startsWith('T')) {
      for (const prefix of ['', 'en/']) {
        const lesson = await readFile(path.join(root, `src/content/docs/${prefix}${slug}.mdx`), 'utf8');
        expect(lesson).toContain(`/${prefix}${slug}/exercises/`);
        expect(lesson).toContain(`/${prefix}${slug}/solutions/`);
        const exercises = await readFile(path.join(root, `src/content/docs/${prefix}${slug}/exercises.md`), 'utf8');
        expect(exercises.match(/<details><summary>/g)).toHaveLength(4);
        expect(exercises).not.toContain('<details open');
      }
    }
  });
});
