// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseFrontmatter } from '@astrojs/markdown-remark';
import { describe, expect, it } from 'vitest';

import { loadCanonicalExample, readCanonicalRange } from '../../scripts/lib/canonical-examples.mjs';
import { RESOURCE_INDEX_RECORDS } from '../../src/resource-indexes/resource-index-data';
import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const canonicalRanges = ['cpu-reference', 'gemm-call', 'stream-lifecycle'];
const units = [
  { id: 'L06', slug: 'libraries/cublas-gemm', prerequisites: ['A08', 'Q01'], practice: 'PB-R4-007' },
  { id: 'L07', slug: 'libraries/cublaslt-matmul', prerequisites: ['L06', 'Q05'], practice: 'PB-R4-008' },
];
const subjects = [
  { id: 'EX18', slug: 'examples/cublas-gemm', kind: 'runnable-example', prerequisites: ['L06'] },
  { id: 'LAB12', slug: 'labs/compare-gemm-with-cublas', kind: 'lab', prerequisites: ['Q13', 'L06'] },
];
const publications = [
  ...units.flatMap(({ id, slug, prerequisites }) => [
    { id, slug, prerequisites, kind: 'learning-unit', extension: 'mdx' },
    { id: `${id}-EXERCISES`, slug: `${slug}/exercises`, prerequisites: [id], kind: 'exercise-set', extension: 'md' },
    { id: `${id}-SOLUTIONS`, slug: `${slug}/solutions`, prerequisites: [`${id}-EXERCISES`], kind: 'solution-set', extension: 'md' },
  ]),
  ...subjects.map((subject) => ({ ...subject, extension: 'mdx' })),
];

async function readPublication(slug: string, extension: string, locale: string) {
  return parseFrontmatter(await readFile(
    path.join(projectRoot, 'src/content/docs', locale, `${slug}.${extension}`), 'utf8',
  ));
}

describe('issue #36 cuBLAS publication contract', () => {
  it('registers an immutable EX18 publication before exposing canonical imports', async () => {
    const registry = JSON.parse(await readFile(
      path.join(projectRoot, 'src/canonical-example-publications.json'), 'utf8',
    ));

    expect(registry.examples.EX18).toMatchObject({
      sourceCommit: expect.stringMatching(/^[0-9a-f]{40}$/),
    });
    const example = await loadCanonicalExample(projectRoot, 'EX18');
    expect(example.sourceCommit).toBe(registry.examples.EX18.sourceCommit);
    expect(example.sourceUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/tree/${example.sourceCommit}/examples/ex18-cublas-gemm`,
    );
    expect(example.downloadUrl).toBe(
      `https://github.com/xiangzhang-coding/cuda-learning-site/archive/${example.evidenceBundleCommit ?? example.sourceCommit}.zip`,
    );
    for (const { slug } of subjects) {
      for (const locale of ['', 'en/']) {
        const { content } = await readPublication(slug, 'mdx', locale);
        expect(content.includes(`](${example.sourceUrl})`), `${locale}${slug}: registered source link`).toBe(true);
        expect(content.includes(`](${example.downloadUrl})`), `${locale}${slug}: registered archive link`).toBe(true);
      }
    }
  });

  it.each(publications)('$id keeps its exact prerequisites and separates expectations from evidence in both locales', async ({
    id, slug, kind, extension, prerequisites,
  }) => {
    const [zh, en] = await Promise.all(['', 'en/'].map((locale) => readPublication(slug, extension, locale)));
    const requiresRuntime = kind === 'runnable-example' || kind === 'lab';

    for (const [page, counterpart] of [[zh, `/en/${slug}/`], [en, `/${slug}/`]] as const) {
      expect(page.frontmatter).toMatchObject({
        pairId: id.toLowerCase(), unitId: id, resourceKind: kind, counterpart, prerequisites,
        evidence: {
          compilation: [],
          runtime: requiresRuntime ? ['Pending Hardware Verification'] : [],
          recordedObservations: [],
        },
      });
      if (requiresRuntime) {
        expect(page.frontmatter.evidence.expectedObservations.length).toBeGreaterThan(0);
      } else {
        expect(page.frontmatter.evidence.expectedObservations).toEqual([]);
      }
    }
    for (const field of ['structure', 'relatedUnits', 'sources', 'factCheckDate']) {
      expect(zh.frontmatter[field], `${id}: paired ${field}`).toEqual(en.frontmatter[field]);
    }
  });

  it.each([...units, ...subjects])('$id is a registered destination with no extra prerequisite edges', ({
    id, slug, prerequisites,
  }) => {
    expect(PUBLISHED_DESTINATIONS[id]).toMatchObject({
      prerequisites,
      href: { 'zh-CN': `/${slug}/`, en: `/en/${slug}/` },
    });
  });

  it.each(subjects)('$id imports the three EX18 build-input ranges in both locales without upgrading evidence', async ({ slug }) => {
    const example = await loadCanonicalExample(projectRoot, 'EX18');
    expect(example.evidence).toMatchObject({
      compilation: [], runtime: 'Pending Hardware Verification', recordedObservations: [],
    });
    for (const locale of ['', 'en/']) {
      const { frontmatter, content } = await readPublication(slug, 'mdx', locale);
      expect(frontmatter.canonicalExample).toBe('EX18');
      expect(frontmatter.canonicalRanges).toEqual(canonicalRanges);
      const imports = [...content.matchAll(/<CanonicalCode\s+exampleId="([^"]+)"\s+range="([^"]+)"\s*\/>/g)]
        .map((match) => ({ exampleId: match[1], range: match[2] }));
      expect(imports).toEqual(canonicalRanges.map((range) => ({ exampleId: 'EX18', range })));
    }
    for (const range of canonicalRanges) {
      const excerpt = await readCanonicalRange(projectRoot, 'EX18', range);
      expect(excerpt.code.trim(), range).not.toBe('');
      expect(example.build.inputs, range).toContain(excerpt.file);
    }
  });

  it.each([
    { id: 'LAB12', group: 'labs', destination: 'labs/compare-gemm-with-cublas/', prerequisites: ['Q13', 'L06'] },
    { id: 'PB-R4-007', group: 'practice', destination: 'practice/#pb-r4-007', prerequisites: ['L06'] },
    { id: 'PB-R4-008', group: 'practice', destination: 'practice/#pb-r4-008', prerequisites: ['L07'] },
    { id: 'TERM-187', group: 'glossary', destination: 'glossary/#term-187', prerequisites: [] },
    { id: 'TERM-188', group: 'glossary', destination: 'glossary/#term-188', prerequisites: [] },
    { id: 'SRC-CUDA-067', group: 'sources', destination: 'sources-and-versions/#src-cuda-067', prerequisites: [] },
    { id: 'SRC-CUDA-068', group: 'sources', destination: 'sources-and-versions/#src-cuda-068', prerequisites: [] },
  ])('$id is discoverable through its bilingual resource catalog', ({ id, group, destination, prerequisites }) => {
    const record = RESOURCE_INDEX_RECORDS.find(({ planningId }) => planningId === id);
    expect(record).toMatchObject({
      group, prerequisites,
      href: { 'zh-CN': `/${destination}`, en: `/en/${destination}` },
    });
    if (id === 'LAB12') {
      expect(record?.evidence).toEqual({ compilation: [], runtime: ['Pending Hardware Verification'] });
    }
  });

  it.each(units)('$id directs learners to its own Practice Bank task, not an earlier unit task', async ({ slug, practice }) => {
    for (const locale of ['', 'en/']) {
      for (const [suffix, extension] of [['', 'mdx'], ['/exercises', 'md']]) {
        const { content } = await readPublication(`${slug}${suffix}`, extension, locale);
        expect(content.includes(`](/${locale}practice/#${practice.toLowerCase()})`),
          `${locale}${slug}${suffix}: link to ${practice}`).toBe(true);
      }
    }
  });

  it('includes L06, L07, EX18, and LAB12 in the publication inventory while reusing VIS12', async () => {
    const { scope } = JSON.parse(await readFile(
      path.join(projectRoot, 'src/current-publication-manifest.json'), 'utf8',
    ));
    expect(scope.learningUnits).toEqual(expect.arrayContaining(['L06', 'L07']));
    expect(scope.runnableExamples).toContain('EX18');
    expect(scope.labs).toContain('LAB12');
    expect(scope.visualExplainers).toContain('VIS12');
    expect(PUBLISHED_DESTINATIONS.VIS12.href).toEqual({
      'zh-CN': '/visuals/gemm-tiling-hierarchy/', en: '/en/visuals/gemm-tiling-hierarchy/',
    });
  });
});
