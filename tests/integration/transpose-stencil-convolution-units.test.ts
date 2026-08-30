// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { PUBLISHED_DESTINATIONS } from '../../src/resource-indexes/resource-index-model';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');

const units = [
  {
    id: 'A05',
    slug: 'matrix-transpose-layout',
    prerequisites: ['M02', 'M03', 'M04'],
    terms: ['TERM-140', 'TERM-141', 'TERM-142'],
    practice: 'PB-R2-017',
  },
  {
    id: 'A06',
    slug: 'stencil-neighborhood-reuse',
    prerequisites: ['M03', 'M04', 'M05'],
    terms: ['TERM-143', 'TERM-144'],
    practice: 'PB-R2-018',
  },
  {
    id: 'A07',
    slug: 'convolution-reuse-layout',
    prerequisites: ['A06', 'M03'],
    terms: ['TERM-145', 'TERM-146'],
    practice: 'PB-R2-019',
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

describe('A05-A07 transpose, stencil, and convolution publication', () => {
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
      expect(source).toContain("factCheckDate: '2026-08-30'");
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

  it('keeps A05 canonical imports, rectangular mapping, edge participation, and VIS11 route exact', async () => {
    const [zh, en] = await Promise.all([
      readUnit('zh-CN', 'matrix-transpose-layout'),
      readUnit('en', 'matrix-transpose-layout'),
    ]);
    for (const source of [zh, en]) {
      expect(source).toContain('output[col * rows + row] = input[row * cols + col]');
      expect(source).toMatch(/cannot return before the barrier|不能在 barrier 前 early return/);
      expect(source).toContain('/visuals/tiled-transpose/');
      expect([...source.matchAll(/<CanonicalCode exampleId="EX14" range="([^"]+)" \/>/g)]
        .map((match) => match[1])).toEqual(['cpu-reference', 'tiled-transpose']);
      expect(source).not.toContain('/visuals/matrix-transpose-layout/');
      expect(source).not.toContain('examples/ex14-matrix-transpose-layout');
    }
  });

  it('develops 1D/2D stencil halos and keeps direct convolution a future-library teaching comparison', async () => {
    const [a06zh, a06en, a07zh, a07en] = await Promise.all([
      readUnit('zh-CN', 'stencil-neighborhood-reuse'),
      readUnit('en', 'stencil-neighborhood-reuse'),
      readUnit('zh-CN', 'convolution-reuse-layout'),
      readUnit('en', 'convolution-reuse-layout'),
    ]);
    for (const source of [a06zh, a06en]) {
      for (const contract of ['valid', 'clamp', 'zero', 'periodic']) expect(source).toContain(`\`${contract}\``);
      expect(source).toMatch(/corner halo|corner regions|corner halos|四个.*corner/i);
      expect(source).toMatch(/B\(2r\+1\)/);
      expect(source).toMatch(/not speedup|不是 speedup|不能.*更快/i);
    }
    for (const source of [a07zh, a07en]) {
      expect(source).toMatch(/cross-correlation/i);
      expect(source).toMatch(/mathematical convolution/i);
      expect(source).toContain('cuDNN Frontend v1.27.0');
      expect(source).toContain('cuDNN 9.24.0');
      expect(source).toMatch(/graph validation/i);
      expect(source).toMatch(/workspace/i);
      expect(source).toMatch(/Later L10|后续 L10/);
      expect(source).toMatch(/does not build, validate, or execute|不构建、验证或执行/);
    }
  });

  it('publishes the new Practice Bank, Glossary, and source coordinates while leaving Q11/LAB10 absent', async () => {
    const [practice, glossary, sources, sidebar] = await Promise.all([
      readFile(path.join(docsRoot, 'en/practice.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'en/glossary.mdx'), 'utf8'),
      readFile(path.join(docsRoot, 'en/sources-and-versions.mdx'), 'utf8'),
      readFile(path.join(projectRoot, 'astro.config.mjs'), 'utf8'),
    ]);
    for (const id of ['PB-R2-017', 'PB-R2-018', 'PB-R2-019']) expect(practice).toContain(`## ${id}:`);
    for (let id = 140; id <= 146; id += 1) expect(glossary).toContain(`id="term-${id}"`);
    for (let id = 41; id <= 43; id += 1) expect(sources).toContain(`id="src-cuda-0${id}"`);
    expect(PUBLISHED_DESTINATIONS).toHaveProperty('EX14');
    expect(PUBLISHED_DESTINATIONS).toHaveProperty('VIS11');
    for (const id of ['Q11', 'LAB10']) {
      expect(PUBLISHED_DESTINATIONS).not.toHaveProperty(id);
      expect(sidebar).not.toContain(id);
    }
  });
});
