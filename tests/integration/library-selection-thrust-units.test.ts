// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');

const units = [
  {
    id: 'L01',
    slug: 'library-primitive-dsl-custom-kernel',
    prerequisites: ['A02', 'A03', 'A08', 'Q06'],
    terms: ['TERM-177', 'TERM-178', 'TERM-179', 'TERM-180'],
    practice: 'PB-R4-001',
  },
  {
    id: 'L02',
    slug: 'thrust-algorithm-vocabulary',
    prerequisites: ['A01', 'A03', 'A09'],
    terms: ['TERM-181', 'TERM-182'],
    practice: 'PB-R4-002',
  },
] as const;

async function readUnit(locale: 'zh-CN' | 'en', slug: string, suffix = '.mdx') {
  const localePrefix = locale === 'en' ? 'en/' : '';
  return readFile(path.join(docsRoot, `${localePrefix}libraries/${slug}${suffix}`), 'utf8');
}

function declaredPrerequisites(source: string) {
  return source.match(/^prerequisites:\n((?:  - [^\n]+\n)+)/m)?.[1]
    ?.trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

describe('L01-L02 library selection and Thrust publication', () => {
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
      for (const term of unit.terms) expect(source).toContain(term);
      expect(source.match(/^\d+\. /gm)).toHaveLength(5);
      expect(source).not.toContain('canonicalExample:');
      expect(source).not.toContain('```');
    }
    expect(zh).toContain(`href="/en/libraries/${unit.slug}/"`);
    expect(en).toContain(`href="/libraries/${unit.slug}/"`);

    for (const exercises of [zhExercises, enExercises]) {
      expect(exercises.match(/^## (?:练习|Exercise) \d/gm)).toHaveLength(3);
      expect(exercises.match(/<details><summary>(?:提示|Hint) [12]<\/summary>/g)).toHaveLength(6);
      expect(exercises).toMatch(/Expected evidence|预期证据/);
      expect(exercises).toMatch(/Acceptance criteria|验收条件/);
      expect(exercises).not.toMatch(/^## (?:解答|Solution) /m);
      expect(exercises).not.toContain('```');
    }
    for (const solutions of [zhSolutions, enSolutions]) {
      expect(solutions.match(/^## (?:解答|Solution) \d/gm)).toHaveLength(3);
      expect(solutions).toMatch(/Valid alternatives|有效替代方案/);
      expect(solutions).toMatch(/Common errors|常见错误/);
      expect(solutions).not.toContain('```');
    }
  });

  it('requires a correctness-first decision packet before custom ownership', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', units[0].slug),
      readUnit('en', units[0].slug),
    ]);
    for (const page of pages) {
      expect(page).toMatch(/production library|生产库/i);
      expect(page).toMatch(/reusable primitive|可复用原语/i);
      expect(page).toMatch(/domain-specific language|领域特定语言|DSL/i);
      expect(page).toMatch(/custom kernel|自定义内核/i);
      for (const criterion of [
        /correctness|正确性/i,
        /maintenance|维护/i,
        /portability|可移植/i,
        /performance evidence|性能证据/i,
        /ownership cost|所有权成本/i,
      ]) expect(page).toMatch(criterion);
      expect(page).toMatch(/measure|测量/i);
      expect(page).toMatch(/no.*(?:winner|faster|advantage)|不.*(?:胜者|更快|优势)/is);
    }
  });

  it('maps Thrust algorithms and iterator composition to the prerequisite algorithms', async () => {
    const pages = await Promise.all([
      readUnit('zh-CN', units[1].slug),
      readUnit('en', units[1].slug),
    ]);
    for (const page of pages) {
      expect(page).toMatch(/thrust::transform[\s\S]{0,400}A01/i);
      expect(page).toMatch(/(?:inclusive_scan|exclusive_scan)[\s\S]{0,400}A03/i);
      expect(page).toMatch(/(?:stable_sort|sort)[\s\S]{0,400}A09/i);
      expect(page).toMatch(/counting_iterator|counting iterator/i);
      expect(page).toMatch(/transform_iterator|transform iterator/i);
      expect(page).toMatch(/zip_iterator|zip iterator/i);
      expect(page).toMatch(/execution policy|执行策略/i);
      expect(page).toContain('par_nosync');
      expect(page).toMatch(/floating-point|浮点/i);
      expect(page).toMatch(/strict weak ordering|严格弱序/i);
      expect(page).toMatch(/not.*guarantee.*(?:fusion|speedup)|不保证.*(?:融合|加速)/is);
      for (const source of [
        'system/cuda/detail/transform.h',
        'system/cuda/detail/scan.h',
        'system/cuda/detail/sort.h',
        'system/cuda/detail/util.h',
        'system/cuda/detail/temporary_buffer.h',
        'thrust/thrust/execution_policy.h',
        'issues/2747',
      ]) expect(page).toContain(source);
      expect(page).toContain("attrs: { name: 'cuda:source-count', content: '21' }");
    }
  });

  it('pins and scopes CCCL v3.4.2 without converting owner material into site evidence', async () => {
    const pages = await Promise.all(units.flatMap((unit) => [
      readUnit('zh-CN', unit.slug),
      readUnit('en', unit.slug),
    ]));
    for (const page of pages) {
      expect(page).toContain('CCCL v3.4.2');
      expect(page).toContain('d36012203ef73ac7f966e848dd88482273e91e02');
      expect(page).toMatch(/12\.9\.2/);
      expect(page).toMatch(/13\.3\.1/);
      expect(page).toMatch(/11\.8.*(?:excluded|不支持|排除)/is);
      expect(page).toMatch(/Context7.*\/nvidia\/cccl/is);
      expect(page).toMatch(/Apache-2\.0/);
      expect(page).toMatch(/LLVM-exception/);
      expect(page).toMatch(/BSD-3-Clause/);
      expect(page).toMatch(/Boost/);
      expect(page).toMatch(/no.*(?:Compile-Checked|Runtime-Verified)|不.*(?:编译已检查|运行已验证)/is);
    }
  });
});
