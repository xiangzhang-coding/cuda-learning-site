// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const reviewDate = '2026-08-28';

type LocalePrefix = '' | 'en/';

type UnitContract = {
  id: 'Q01' | 'Q03' | 'Q04' | 'Q05';
  pairId: 'q01' | 'q03' | 'q04' | 'q05';
  slug: string;
  prerequisites: readonly string[];
  canonicalFirstUses: readonly string[];
  teachingPatterns: readonly RegExp[];
};

const units: readonly UnitContract[] = [
  {
    id: 'Q01',
    pairId: 'q01',
    slug: 'cpu-references-tolerances-invariants',
    prerequisites: ['F04', 'O04'],
    canonicalFirstUses: [
      'CPU reference',
      'absolute tolerance',
      'relative tolerance',
      'invariant',
    ],
    teachingPatterns: [
      /CPU reference/i,
      /absolute tolerance|绝对容差/i,
      /relative tolerance|相对容差/i,
      /invariants?|不变量/i,
      /no universal epsilon|no single universal epsilon|不存在.{0,12}通用.{0,8}epsilon|没有.{0,12}万能.{0,8}epsilon/is,
    ],
  },
  {
    id: 'Q03',
    pairId: 'q03',
    slug: 'memcheck-invalid-memory-access',
    prerequisites: ['F05', 'Q01'],
    canonicalFirstUses: [
      'out-of-bounds access',
      'misaligned access',
      'memory leak',
      'executed path',
    ],
    teachingPatterns: [
      /memcheck/i,
      /out-of-bounds|越界/i,
      /misaligned|未对齐/i,
      /memory leaks?|内存泄漏/i,
      /executed paths?|已执行路径/i,
      /clean report.{0,240}(?:does not|cannot|is not proof)|clean report.{0,240}(?:不能|不代表|无法证明)/is,
      /memcheck.{0,400}(?:first|before (?:the )?other tools|先运行|优先)/is,
    ],
  },
  {
    id: 'Q04',
    pairId: 'q04',
    slug: 'racecheck-initcheck-synccheck',
    prerequisites: ['M05', 'M06', 'Q03'],
    canonicalFirstUses: [
      'data access hazard',
      'uninitialized device global memory',
      'synchronization primitive error',
    ],
    teachingPatterns: [
      /racecheck[\s\S]{0,600}(?:shared memory|共享内存)[\s\S]{0,300}(?:data access hazards?|数据访问危害)/i,
      /initcheck[\s\S]{0,600}(?:uninitialized|未初始化)[\s\S]{0,300}(?:device global memory|设备全局内存)/i,
      /synccheck[\s\S]{0,600}(?:synchronization primitive|barrier|同步原语|屏障)[\s\S]{0,300}(?:error|misuse|错误|误用)/i,
      /memcheck[\s\S]*racecheck[\s\S]*initcheck[\s\S]*synccheck/i,
      /memcheck.{0,400}(?:first|before|先运行|优先)/is,
    ],
  },
  {
    id: 'Q05',
    pairId: 'q05',
    slug: 'timing-asynchronous-gpu-work',
    prerequisites: ['M08', 'Q01'],
    canonicalFirstUses: [
      'warm-up',
      'explicit synchronization',
      'timing-enabled event',
      'raw repeated sample',
      'statistic',
      'Environment Manifest',
    ],
    teachingPatterns: [
      /correctness.{0,240}(?:before|precondition|first).{0,240}(?:timing|measurement)|正确性.{0,240}(?:先于|通过|优先).{0,240}(?:计时|测量)/is,
      /warm-up.{0,240}(?:exclude|not included|outside)|预热.{0,240}(?:排除|不计入|不纳入)/is,
      /explicit synchronization|显式同步/i,
      /timing-enabled events?|启用计时的事件/i,
      /cudaEventRecord/i,
      /cudaEventElapsedTime/i,
      /raw repeated samples?|原始重复样本/i,
      /declared statistics?|声明的统计量|预先声明.{0,12}统计/is,
      /Environment Manifest|环境清单/i,
    ],
  },
] as const;

const exerciseStructure = [
  'prerequisites',
  'instructions',
  'exercise-1',
  'exercise-2',
  'exercise-3',
  'next',
] as const;

const solutionStructure = [
  'review',
  'solution-1',
  'solution-2',
  'solution-3',
  'valid-alternatives',
  'common-errors',
] as const;

async function readUnit(
  localePrefix: LocalePrefix,
  slug: string,
  child?: 'exercises' | 'solutions',
) {
  const relativePath = child
    ? `${localePrefix}correctness/${slug}/${child}.md`
    : `${localePrefix}correctness/${slug}.mdx`;
  return readFile(path.join(docsRoot, relativePath), 'utf8');
}

function frontmatter(source: string) {
  const match = /^---\n([\s\S]*?)\n---/.exec(source);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}

function body(source: string) {
  const match = /^---\n[\s\S]*?\n---\n([\s\S]*)$/.exec(source);
  expect(match).not.toBeNull();
  return (match?.[1] ?? '').trimStart();
}

function yamlScalar(metadata: string, field: string) {
  const match = new RegExp(`^${field}: (?:'([^']*)'|"([^"]*)"|(.+))$`, 'm').exec(metadata);
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function yamlList(metadata: string, field: string) {
  if (new RegExp(`^${field}: \\[\\]$`, 'm').test(metadata)) return [];
  const match = new RegExp(`^${field}:\\n((?:  - .+\\n?)+)`, 'm').exec(metadata);
  return match?.[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '')) ?? [];
}

function projectedMetadata(metadata: string, name: string) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(
    `attrs: \\{ name: '${escaped}', content: (?:'([^']*)'|([^ }]+)) \\}`,
  ).exec(metadata);
  return match?.[1] ?? match?.[2];
}

function sourceCoordinates(metadata: string) {
  return [
    ...metadata.matchAll(
      /^\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '([^']+)'\n\s+accessDate: '([^']+)'/gm,
    ),
  ].map(([, url, version, platform, accessDate]) => ({
    url,
    version,
    platform,
    accessDate,
  }));
}

function section(source: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(
    `^## ${escaped}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`,
    'm',
  ).exec(source);
  expect(match, heading).not.toBeNull();
  return match?.[1] ?? '';
}

function assertEmptyEvidence(metadata: string) {
  expect(metadata).toMatch(
    /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
  );
  expect(metadata).not.toMatch(/^canonicalExample:|^exampleIds:|^canonicalRanges:/m);
}

function assertHeadProjection(
  metadata: string,
  expected: {
    pairId: string;
    structure: readonly string[];
    resourceKind: 'learning-unit' | 'exercise-set' | 'solution-set';
    unitId: string;
    prerequisites: readonly string[];
  },
) {
  const values = {
    'cuda:pair-id': expected.pairId,
    'cuda:fact-check-date': reviewDate,
    'cuda:license': 'CC-BY-4.0',
    'cuda:structure': expected.structure.join(','),
    'cuda:resource-kind': expected.resourceKind,
    'cuda:unit-id': expected.unitId,
    'cuda:prerequisites': expected.prerequisites.join(','),
    'cuda:hardware-gate': 'none',
    'cuda:evidence-compilation': 'none',
    'cuda:evidence-runtime': 'none',
    'cuda:recorded-observations': 'none',
  } as const;

  for (const [name, value] of Object.entries(values)) {
    expect(projectedMetadata(metadata, name), name).toBe(value);
  }
}

function assertCanonicalFirstUses(source: string, terms: readonly string[]) {
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    expect(source, term).toMatch(
      new RegExp(`[\\p{Script=Han}][^\\n（）]{0,36}（\\s*${escaped}\\s*）`, 'u'),
    );
  }
}

function assertCompleteManifestVocabulary(source: string) {
  for (const coordinate of [
    'GPU identity',
    'compute capability',
    'GPU count',
    'driver',
    'CUDA Toolkit',
    'component versions',
    'NVCC',
    'host compiler',
    'operating system',
    'workload',
    'memory',
    'permissions',
    'exact command',
    'correctness method',
    'correctness criteria',
    'observation date',
  ]) {
    expect(source.toLowerCase(), coordinate).toContain(coordinate.toLowerCase());
  }
}

describe('Q01 and Q03-Q05 bilingual source contracts', () => {
  for (const unit of units) {
    it(`publishes ${unit.id} with exact edges, practice, sources, and empty evidence`, async () => {
      for (const localePrefix of ['', 'en/'] as const) {
        const english = localePrefix === 'en/';
        const counterpart = english
          ? `/correctness/${unit.slug}/`
          : `/en/correctness/${unit.slug}/`;
        const source = await readUnit(localePrefix, unit.slug);
        const metadata = frontmatter(source);
        const structure = yamlList(metadata, 'structure');

        expect(yamlScalar(metadata, 'title')).toBeTruthy();
        expect(yamlScalar(metadata, 'pairId')).toBe(unit.pairId);
        expect(yamlScalar(metadata, 'counterpart')).toBe(counterpart);
        expect(yamlScalar(metadata, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(metadata, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(metadata, 'provenance')).toBe('original');
        expect(yamlScalar(metadata, 'resourceKind')).toBe('learning-unit');
        expect(yamlScalar(metadata, 'unitId')).toBe(unit.id);
        expect(yamlScalar(metadata, 'hardwareGate')).toBe('none');
        expect(yamlList(metadata, 'prerequisites')).toEqual(unit.prerequisites);
        expect(structure.slice(-3)).toEqual(['retrieval', 'practice', 'sources']);
        expect(new Set(structure).size).toBe(structure.length);
        assertEmptyEvidence(metadata);
        assertHeadProjection(metadata, {
          pairId: unit.pairId,
          structure,
          resourceKind: 'learning-unit',
          unitId: unit.id,
          prerequisites: unit.prerequisites,
        });

        expect(body(source)).toMatch(
          new RegExp(`^<a class="locale-pair" data-locale-counterpart href="${counterpart}"`),
        );
        expect(
          section(source, english ? 'Retrieval check' : '离开前检查').match(/^\d+\. /gm),
        ).toHaveLength(5);
        expect(source).toContain(`/${localePrefix}correctness/${unit.slug}/exercises/`);
        expect(source).toContain(`/${localePrefix}correctness/${unit.slug}/solutions/`);
        expect(source).toMatch(new RegExp(`/${localePrefix}practice/#pb-`, 'i'));
        for (const prerequisite of unit.prerequisites) {
          expect(source, `${localePrefix}${unit.id} ${prerequisite}`).toContain(`[${prerequisite}`);
        }

        const coordinates = sourceCoordinates(metadata);
        expect(coordinates.length, `${localePrefix}${unit.id} primary sources`).toBeGreaterThanOrEqual(2);
        expect(projectedMetadata(metadata, 'cuda:source-count')).toBe(String(coordinates.length));
        for (const coordinate of coordinates) {
          expect(new URL(coordinate.url).hostname, coordinate.url).toBe('docs.nvidia.com');
          expect(coordinate.version).not.toBe('');
          expect(coordinate.platform).not.toBe('');
          expect(coordinate.accessDate).toBe(reviewDate);
          expect(source).toContain(`](${coordinate.url})`);
        }
        expect(source).toMatch(/\*\*(?:Fact checked: |事实核查日期：)2026-08-28[。.]\*\*/);

        for (const pattern of unit.teachingPatterns) {
          expect(source, `${localePrefix}${unit.id} ${pattern.source}`).toMatch(pattern);
        }
        if (!english) assertCanonicalFirstUses(body(source), unit.canonicalFirstUses);
        if (unit.id === 'Q05') assertCompleteManifestVocabulary(source);
      }
    });

    it(`keeps ${unit.id} Exercises learner-owned and its reviewed solutions separate`, async () => {
      for (const localePrefix of ['', 'en/'] as const) {
        const english = localePrefix === 'en/';
        const sources = await Promise.all([
          readUnit(localePrefix, unit.slug, 'exercises'),
          readUnit(localePrefix, unit.slug, 'solutions'),
        ]);

        for (const [child, source] of (
          [
            ['exercises', sources[0]],
            ['solutions', sources[1]],
          ] as const
        )) {
          const exercises = child === 'exercises';
          const metadata = frontmatter(source);
          const structure = exercises ? exerciseStructure : solutionStructure;
          const pairId = `${unit.pairId}-${child}`;
          const unitId = `${unit.id}-${exercises ? 'EXERCISES' : 'SOLUTIONS'}`;
          const prerequisites = [exercises ? unit.id : `${unit.id}-EXERCISES`];
          const counterpart = english
            ? `/correctness/${unit.slug}/${child}/`
            : `/en/correctness/${unit.slug}/${child}/`;

          expect(yamlScalar(metadata, 'title')).toBeTruthy();
          expect(yamlScalar(metadata, 'pairId')).toBe(pairId);
          expect(yamlScalar(metadata, 'counterpart')).toBe(counterpart);
          expect(yamlScalar(metadata, 'factCheckDate')).toBe(reviewDate);
          expect(yamlScalar(metadata, 'license')).toBe('CC-BY-4.0');
          expect(yamlScalar(metadata, 'provenance')).toBe('original');
          expect(yamlScalar(metadata, 'resourceKind')).toBe(
            exercises ? 'exercise-set' : 'solution-set',
          );
          expect(yamlScalar(metadata, 'unitId')).toBe(unitId);
          expect(yamlList(metadata, 'structure')).toEqual(structure);
          expect(yamlList(metadata, 'prerequisites')).toEqual(prerequisites);
          assertEmptyEvidence(metadata);
          assertHeadProjection(metadata, {
            pairId,
            structure,
            resourceKind: exercises ? 'exercise-set' : 'solution-set',
            unitId,
            prerequisites,
          });
          expect(body(source)).toMatch(
            new RegExp(`^<a class="locale-pair" data-locale-counterpart href="${counterpart}"`),
          );
        }

        const exerciseMatches = [
          ...sources[0].matchAll(
            /^## (?:练习|Exercise) [1-3][^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/gm,
          ),
        ];
        expect(exerciseMatches, `${localePrefix}${unit.id}`).toHaveLength(3);
        const labels = english
          ? ['**Goal:**', '**Constraints:**', '**Expected evidence:**', '**Acceptance criteria:**']
          : ['**目标：**', '**约束：**', '**预期证据：**', '**验收条件：**'];
        for (const [, exercise] of exerciseMatches) {
          for (const label of labels) expect(exercise).toContain(label);
          expect(exercise.match(/<summary>(?:Hint|提示) [12]<\/summary>/g)).toEqual(
            english
              ? ['<summary>Hint 1</summary>', '<summary>Hint 2</summary>']
              : ['<summary>提示 1</summary>', '<summary>提示 2</summary>'],
          );
          expect(exercise).not.toMatch(/Reviewed solution|参考解答|^Solution|^解答/m);
        }

        expect(sources[1].match(/^## (?:解答|Solution) [1-3]/gm)).toHaveLength(3);
        expect(sources[1]).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
        expect(sources[1]).toMatch(/^## (?:常见错误|Common errors)$/m);
        expect(sources[1]).toMatch(/(?:Reviewed:|复核日期：)\s*\*\*2026-08-28\*\*/);
      }
    });
  }

  it('keeps primary-source coordinates aligned across every Publication Pair', async () => {
    for (const unit of units) {
      const [chinese, english] = await Promise.all([
        readUnit('', unit.slug),
        readUnit('en/', unit.slug),
      ]);
      expect(sourceCoordinates(frontmatter(chinese)), unit.id).toEqual(
        sourceCoordinates(frontmatter(english)),
      );
    }
  });
});
