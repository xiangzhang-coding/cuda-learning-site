// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');

const units = [
  {
    id: 'A12',
    slug: 'sparse-formats-spmv',
    prerequisites: ['M01', 'M02'],
    terms: ['TERM-171', 'TERM-172', 'TERM-173'],
    practice: 'PB-R3-015',
  },
  {
    id: 'A13',
    slug: 'sparse-matrix-multiplication-preprocessing',
    prerequisites: ['A12', 'A08'],
    terms: ['TERM-174', 'TERM-175', 'TERM-176'],
    practice: 'PB-R3-016',
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

describe('A12-A13 sparse formats and preprocessing publication', () => {
  it('independently derives the shared COO, CSR, SpMV, and storage fixtures', () => {
    const matrix = [
      [4, 0, -1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 2, 0, 0, 3],
      [5, 0, 0, 7, 0],
    ];
    const entries = matrix.flatMap((row, rowIndex) =>
      row.flatMap((value, columnIndex) => value === 0 ? [] : [{ rowIndex, columnIndex, value }]),
    );
    const rowOffsets = [0];
    for (const row of matrix) rowOffsets.push(rowOffsets.at(-1)! + row.filter((value) => value !== 0).length);

    expect(entries.map(({ rowIndex }) => rowIndex)).toEqual([0, 0, 2, 2, 3, 3]);
    expect(entries.map(({ columnIndex }) => columnIndex)).toEqual([0, 2, 1, 4, 0, 3]);
    expect(entries.map(({ value }) => value)).toEqual([4, -1, 2, 3, 5, 7]);
    expect(rowOffsets).toEqual([0, 2, 2, 4, 6]);

    const vector = [1, 2, 3, 4, 5];
    const result = matrix.map((row) => row.reduce(
      (sum, value, columnIndex) => sum + value * vector[columnIndex],
      0,
    ));
    expect(result).toEqual([1, 0, 19, 33]);

    const valueBytes = 4;
    const indexBytes = 4;
    expect(matrix.length * matrix[0].length * valueBytes).toBe(80);
    expect(entries.length * (valueBytes + 2 * indexBytes)).toBe(72);
    expect(entries.length * (valueBytes + indexBytes) + rowOffsets.length * indexBytes).toBe(68);
  });

  it('independently derives the shared sparse-times-dense SpMM fixture', () => {
    const matrixA = [
      [4, 0, -1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 2, 0, 0, 3],
      [5, 0, 0, 7, 0],
    ];
    const matrixB = [
      [1, 2],
      [0, 1],
      [3, 0],
      [2, -1],
      [1, 4],
    ];
    const matrixC = matrixA.map((row) => matrixB[0].map((_, columnIndex) =>
      row.reduce((sum, value, innerIndex) => sum + value * matrixB[innerIndex][columnIndex], 0),
    ));

    expect(matrixC).toEqual([
      [1, 8],
      [0, 0],
      [3, 14],
      [19, 3],
    ]);
    expect(4 * 5 * 2).toBe(40);
    expect(6 * 2).toBe(12);
  });

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
      expect(source).toContain("factCheckDate: '2026-09-04'");
      expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(source).toContain(unit.practice);
      expect(source).toContain('<SparseMatrixFixture');
      for (const term of unit.terms) expect(source).toContain(term);
      expect(source.match(/^\d+\. /gm)?.length).toBeGreaterThanOrEqual(6);
      expect(source).not.toMatch(/#include\s*[<"]cusparse\.h|cusparse(?:Create|Destroy|SpMV|SpMM|SpMat)[A-Za-z_]*\s*\(/);
    }
    expect(zh).toContain(`href="/en/algorithms/${unit.slug}/"`);
    expect(en).toContain(`href="/algorithms/${unit.slug}/"`);

    for (const exercises of [zhExercises, enExercises]) {
      expect(exercises.match(/^## (?:练习|Exercise) \d/gm)).toHaveLength(3);
      expect(exercises.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      expect(exercises).toMatch(/Expected evidence|预期证据/);
      expect(exercises).toMatch(/Acceptance criteria|验收条件/);
      expect(exercises).not.toMatch(/^## (?:解答|Solution) /m);
    }
    for (const solutions of [zhSolutions, enSolutions]) {
      expect(solutions.match(/^## (?:解答|Solution) \d/gm)).toHaveLength(3);
      expect(solutions).toMatch(/Valid alternatives|有效替代方案/);
      expect(solutions).toMatch(/Common errors|常见错误/);
    }
  });

  it('teaches COO, CSR, and SpMV from one exact representation contract', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', 'sparse-formats-spmv'),
      readUnit('en', 'sparse-formats-spmv'),
    ]);
    for (const page of pages) {
      expect(page).toMatch(/row_(?:indices|index)|row indices|行索引/i);
      expect(page).toMatch(/\[0, ?0, ?2, ?2, ?3, ?3\]/);
      expect(page).toMatch(/\[0, ?2, ?1, ?4, ?0, ?3\]/);
      expect(page).toMatch(/\[4, ?-1, ?2, ?3, ?5, ?7\]/);
      expect(page).toMatch(/row_(?:offsets|ptr)|row offsets|行偏移/i);
      expect(page).toMatch(/\[0, ?2, ?2, ?4, ?6\]/);
      expect(page).toMatch(/y\s*=\s*\[1, ?0, ?19, ?33\]/);
      expect(page).toMatch(/80 B.*72 B.*68 B/is);
      expect(page).toMatch(/duplicate|重复/i);
      expect(page).toMatch(/zero-based|零基/i);
    }
  });

  it('teaches SpMM representation, preprocessing, algorithm, and workspace trade-offs without L13 code', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', 'sparse-matrix-multiplication-preprocessing'),
      readUnit('en', 'sparse-matrix-multiplication-preprocessing'),
    ]);
    for (const page of pages) {
      expect(page).toContain('C = A B');
      expect(page).toMatch(/\[\[1, ?8\], ?\[0, ?0\], ?\[3, ?14\], ?\[19, ?3\]\]/);
      expect(page).toMatch(/40.*12/is);
      expect(page).toMatch(/descriptor|描述符/i);
      expect(page).toMatch(/workspace|工作区/i);
      expect(page).toMatch(/preprocess|预处理/i);
      expect(page).toMatch(/algorithm|算法/i);
      expect(page).toMatch(/sparsity pattern|稀疏模式/i);
      expect(page).toMatch(/dense GEMM|稠密 GEMM/i);
      expect(page).toMatch(/descriptor[\s\S]{0,500}(?:call-level|调用层|分开的 call-level)[\s\S]{0,240}(?:operation|compute type|algorithm|算法)/i);
      expect(page).toMatch(/(?:returned size|返回值|size)[\s\S]{0,120}(?:zero|零)[\s\S]{0,160}(?:no external workspace|不需要 external workspace|不分配)/i);
      expect(page).toMatch(/COO ALG1[\s\S]{0,100}ALG3[\s\S]{0,100}ALG4[\s\S]{0,160}(?:no extra storage|不需要 extra storage)/i);
      expect(page).toMatch(/L13/);
      expect(page).toMatch(/EX20/);
      expect(page).toMatch(/not.*(?:observed|evidence)|不.*(?:观测|证据)/is);
    }
  });

  it('shares one semantic matrix fixture across locales with mobile, contrast, and print fallbacks', async () => {
    const [component, styles] = await Promise.all([
      readFile(path.join(projectRoot, 'src/components/SparseMatrixFixture.astro'), 'utf8'),
      readFile(path.join(projectRoot, 'src/styles/sparse-matrix-fixture.css'), 'utf8'),
    ]);

    expect(component).toContain("type Locale = 'zh-CN' | 'en'");
    expect(component).toContain('data-sparse-fixture="a12-a13-4x5"');
    expect(component).toContain('data-array="coo-row-indices"');
    expect(component).toContain('data-array="csr-row-offsets"');
    expect(component).toContain('data-result="spmv"');
    expect(component).toContain('data-result="spmm"');
    expect(component).toMatch(/<caption>/);
    expect(component).toMatch(/<figcaption>/);
    expect(component.match(/tabindex="0"/g)?.length).toBeGreaterThanOrEqual(2);
    expect(styles).toMatch(/@media\s*\(max-width:\s*420px\)/);
    expect(styles).toMatch(/@media\s*\(forced-colors:\s*active\)/);
    expect(styles).toMatch(/@media\s+print/);
    expect(styles).toMatch(/:focus-visible/);
  });
});
