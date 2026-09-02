// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');

const units = [
  {
    id: 'A08',
    slug: 'tiled-gemm-correctness',
    prerequisites: ['A05', 'M03', 'M04', 'A02'],
    terms: ['TERM-147', 'TERM-148'],
    practice: 'PB-R2-020',
    factCheckDate: '2026-09-03',
  },
  {
    id: 'A09',
    slug: 'sorting-selection-compaction',
    prerequisites: ['A03', 'A04'],
    terms: ['TERM-149', 'TERM-150', 'TERM-151'],
    practice: 'PB-R2-021',
    factCheckDate: '2026-09-03',
  },
] as const;

async function readUnit(locale: 'zh-CN' | 'en', slug: string, suffix = '.mdx') {
  const localePrefix = locale === 'en' ? 'en/' : '';
  return readFile(path.join(docsRoot, `${localePrefix}algorithms/${slug}${suffix}`), 'utf8');
}

function declaredPrerequisites(source: string) {
  return source.match(/^prerequisites:\n((?:  - [^\n]+\n)+)/m)?.[1]
    ?.trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

describe('A08-A09 GEMM, sorting, selection, and compaction publication', () => {
  it.each(units)('publishes aligned bilingual $id unit, Exercise, and solution contracts', async (unit) => {
    const [zh, en, zhExercises, enExercises, zhSolutions, enSolutions] = await Promise.all([
      readUnit('zh-CN', unit.slug),
      readUnit('en', unit.slug),
      readUnit('zh-CN', unit.slug, '/exercises.md'),
      readUnit('en', unit.slug, '/exercises.md'),
      readUnit('zh-CN', unit.slug, '/solutions.md'),
      readUnit('en', unit.slug, '/solutions.md'),
    ]);

    expect(declaredPrerequisites(zh)).toEqual(unit.prerequisites);
    expect(declaredPrerequisites(en)).toEqual(unit.prerequisites);
    for (const source of [zh, en]) {
      expect(source).toContain(`unitId: ${unit.id}`);
      expect(source).toContain(`factCheckDate: '${unit.factCheckDate}'`);
      expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(source).toContain(unit.practice);
      for (const term of unit.terms) expect(source).toContain(term);
      expect(source.match(/^\d+\. /gm)?.length).toBeGreaterThanOrEqual(5);
    }
    expect(zh).toContain(`href="/en/algorithms/${unit.slug}/"`);
    expect(en).toContain(`href="/algorithms/${unit.slug}/"`);

    for (const exercises of [zhExercises, enExercises]) {
      expect(exercises.match(/^## (?:练习|Exercise) \d/gm)).toHaveLength(3);
      expect(exercises.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      expect(exercises).toMatch(/Expected evidence|预期证据/);
      expect(exercises).toMatch(/Acceptance criteria|验收条件/);
    }
    for (const solutions of [zhSolutions, enSolutions]) {
      expect(solutions.match(/^## (?:解答|Solution) \d/gm)).toHaveLength(3);
      expect(solutions).toMatch(/Valid alternatives|有效替代方案/);
      expect(solutions).toMatch(/Common errors|常见错误/);
    }
  });

  it('moves A08 from a correct naive GEMM to tiled reuse and explicit numerical checks', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', 'tiled-gemm-correctness'),
      readUnit('en', 'tiled-gemm-correctness'),
    ]);
    for (const page of pages) {
      expect(page).toContain('C[row * N + col]');
      expect(page).toMatch(/naive GEMM/i);
      expect(page).toMatch(/shared-memory til/i);
      expect(page).toMatch(/partial.*M.*N.*K|M.*N.*K.*partial/is);
      expect(page).toContain('__syncthreads()');
      expect(page).toMatch(/atol \+ rtol \* abs\(reference\)/);
      expect([...page.matchAll(/<CanonicalCode exampleId="EX15" range="([^"]+)" \/>/g)]
        .map((match) => match[1])).toEqual(['cpu-reference', 'tiled-gemm']);
      expect(page).toContain('/visuals/gemm-tiling-hierarchy/');
      expect(page).toMatch(/not.*production replacement|不是.*production/i);
    }
  });

  it('derives A09 compositions from prior primitives without publishing an educational production sort', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', 'sorting-selection-compaction'),
      readUnit('en', 'sorting-selection-compaction'),
    ]);
    for (const page of pages) {
      expect(page).toMatch(/flag.*exclusive scan.*scatter/is);
      expect(page).toMatch(/histogram.*scan.*scatter/is);
      expect(page).toMatch(/atomic/i);
      expect(page).toMatch(/DeviceRadixSort/);
      expect(page).toMatch(/DeviceSelect/);
      expect(page).toMatch(/Thrust/i);
      expect(page).toMatch(/CCCL 3\.x.*Toolkit 12\.x.*13\.x/is);
      expect(page).toMatch(/11\.8.*(?:bundled|旧版|2\.x)/is);
      expect(page).toMatch(/not.*production|不是.*production/i);
    }
  });

  it('publishes Q13 while keeping LAB12 unpublished', async () => {
    const [practice, glossary, sources, sidebar] = await Promise.all([
      readFile(path.join(docsRoot, 'en/practice.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'en/glossary.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'en/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'astro.config.mjs'), 'utf8'),
    ]);
    for (const id of ['PB-R2-020', 'PB-R2-021']) expect(practice).toContain(`## ${id}:`);
    for (let id = 147; id <= 151; id += 1) expect(glossary).toContain(`id="term-${id}"`);
    for (const id of ['044', '045']) expect(sources).toContain(`id="src-cuda-${id}"`);
    for (const id of ['A08', 'A09', 'Q13', 'EX15', 'VIS12']) expect(PUBLISHED_DESTINATIONS).toHaveProperty(id);
    expect(PUBLISHED_DESTINATIONS).not.toHaveProperty('LAB12');
    expect(sidebar).not.toContain('LAB12');
  });
});
