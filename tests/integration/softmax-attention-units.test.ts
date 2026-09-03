// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');

const units = [
  {
    id: 'A10',
    slug: 'numerically-stable-softmax',
    prerequisites: ['A02', 'M02', 'M03'],
    terms: ['TERM-166', 'TERM-167', 'TERM-168'],
    practice: 'PB-R3-013',
  },
  {
    id: 'A11',
    slug: 'attention-as-an-io-problem',
    prerequisites: ['A08', 'A10'],
    terms: ['TERM-169', 'TERM-170'],
    practice: 'PB-R3-014',
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

describe('A10-A11 softmax and attention publication', () => {
  it('recomputes the published stable and online softmax fixture independently', () => {
    const logits = [1000, 1001, 1002, 1003];
    const maximum = Math.max(...logits);
    const shifted = logits.map((value) => Math.exp(value - maximum));
    const denominator = shifted.reduce((sum, value) => sum + value, 0);
    const probabilities = shifted.map((value) => value / denominator);
    expect(denominator).toBeCloseTo(1.55300179, 8);
    expect(probabilities).toEqual([
      expect.closeTo(0.03205860, 8),
      expect.closeTo(0.08714432, 8),
      expect.closeTo(0.23688282, 8),
      expect.closeTo(0.64391426, 8),
    ]);

    let runningMaximum = Number.NEGATIVE_INFINITY;
    let runningDenominator = 0;
    const states = logits.map((value) => {
      const nextMaximum = Math.max(runningMaximum, value);
      runningDenominator = runningDenominator * Math.exp(runningMaximum - nextMaximum)
        + Math.exp(value - nextMaximum);
      runningMaximum = nextMaximum;
      return [runningMaximum, runningDenominator] as const;
    });
    expect(states.map(([m]) => m)).toEqual(logits);
    expect(states.map(([, l]) => l)).toEqual([
      expect.closeTo(1, 8),
      expect.closeTo(1.36787944, 8),
      expect.closeTo(1.50321472, 8),
      expect.closeTo(1.55300179, 8),
    ]);
  });

  it('recomputes the published attention row and tile-merge fixtures independently', () => {
    const scaledScores = [1, 0, 1].map((value) => value / Math.sqrt(2));
    const maximum = Math.max(...scaledScores);
    const weights = scaledScores.map((value) => Math.exp(value - maximum));
    const denominator = weights.reduce((sum, value) => sum + value, 0);
    const probabilities = weights.map((value) => value / denominator);
    const output = [
      probabilities[0] + 3 * probabilities[2],
      2 * probabilities[1] + probabilities[2],
    ];
    expect(probabilities).toEqual([
      expect.closeTo(0.40111209, 8),
      expect.closeTo(0.19777581, 8),
      expect.closeTo(0.40111209, 8),
    ]);
    expect(output).toEqual([
      expect.closeTo(1.60444837, 8),
      expect.closeTo(0.79666372, 8),
    ]);

    const oldMaximum = 2;
    const oldDenominator = 1 + Math.exp(-1);
    const oldAccumulator = 1 + 2 * Math.exp(-1);
    const tileMaximum = 3;
    const tileDenominator = 1 + Math.exp(-3);
    const tileAccumulator = 4 + 8 * Math.exp(-3);
    const mergedMaximum = Math.max(oldMaximum, tileMaximum);
    const mergedDenominator = Math.exp(oldMaximum - mergedMaximum) * oldDenominator
      + Math.exp(tileMaximum - mergedMaximum) * tileDenominator;
    const mergedAccumulator = Math.exp(oldMaximum - mergedMaximum) * oldAccumulator
      + Math.exp(tileMaximum - mergedMaximum) * tileAccumulator;
    expect(mergedDenominator).toBeCloseTo(1.55300179, 8);
    expect(mergedAccumulator).toBeCloseTo(5.03684655, 8);
    expect(mergedAccumulator / mergedDenominator).toBeCloseTo(3.24329732, 8);
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
      expect(source).toContain("factCheckDate: '2026-09-03'");
      expect(source).toMatch(/evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/);
      expect(source).toContain(unit.practice);
      for (const term of unit.terms) expect(source).toContain(term);
      expect(source.match(/^\d+\. /gm)?.length).toBeGreaterThanOrEqual(5);
      expect(source).not.toMatch(/torch\.|cudnn[A-Z_(.]|tl\.|triton\./i);
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

  it('derives stable and online softmax with an explicit traffic boundary', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', 'numerically-stable-softmax'),
      readUnit('en', 'numerically-stable-softmax'),
    ]);
    for (const page of pages) {
      expect(page).toMatch(/\[1000, ?1001, ?1002, ?1003\]/);
      expect(page).toContain('0.64391426');
      expect(page).toMatch(/m_j\s*=\s*max\(m_\{j-1\}, x_j\)/);
      expect(page).toMatch(/l_j\s*=.*exp\(m_\{j-1\} - m_j\).*exp\(x_j - m_j\)/);
      expect(page).toMatch(/4n elements.*3n elements/is);
      expect(page).toMatch(/2Mb/);
      expect(page).toMatch(/underflow|下溢/i);
      expect(page).toMatch(/static analysis|静态分析/i);
      expect(page).toMatch(/not.*bitwise|不.*逐位/is);
    }
  });

  it('decomposes attention and independently derives the exact query-outer IO fixture', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', 'attention-as-an-io-problem'),
      readUnit('en', 'attention-as-an-io-problem'),
    ]);
    for (const page of pages) {
      expect(page).toContain('S = QK^T / sqrt(d_k)');
      expect(page).toContain('P = softmax_row(S)');
      expect(page).toContain('O = PV');
      expect(page).toMatch(/m' = max\(m, m_t\)/);
      expect(page).toMatch(/l' = exp\(m - m'\)l \+ exp\(m_t - m'\)l_t/);
      expect(page).toMatch(/a' = exp\(m - m'\)a \+ exp\(m_t - m'\)a_t/);
      expect(page).toMatch(/4Nd \+ 6N\^2/);
      expect(page).toMatch(/2Nd \+ 2T_rNd/);
      expect(page).toMatch(/2048 B.*768 B.*1280 B/is);
      expect(page).toContain('/visuals/attention-memory-traffic/');
      expect(page).toMatch(/real arithmetic|实数算术/i);
      expect(page).toMatch(/not.*FlashAttention traffic|不是.*FlashAttention.*流量/is);
    }
  });
});
