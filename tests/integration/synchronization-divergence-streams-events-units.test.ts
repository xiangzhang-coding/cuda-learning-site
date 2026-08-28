// SPDX-License-Identifier: Apache-2.0
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseHTML } from 'linkedom';
import { describe, expect, it } from 'vitest';

const projectRoot = path.resolve(import.meta.dirname, '../..');
const docsRoot = path.join(projectRoot, 'src/content/docs');
const reviewDate = '2026-08-28';

type UnitContract = {
  id: 'M05' | 'M06' | 'M07' | 'M08';
  pairId: 'm05' | 'm06' | 'm07' | 'm08';
  slug: string;
  titles: { zh: string; en: string };
  exerciseTitles: { zh: string; en: string };
  solutionTitles: { zh: string; en: string };
  prerequisites: readonly string[];
  relatedUnits: readonly string[];
  structure: readonly string[];
  sourceVersions: string;
  sourceUrls: readonly string[];
  practiceId: string;
  visualRoutes: readonly string[];
  chineseFirstUses: readonly string[];
  teachingTerms: readonly string[];
};

const units: readonly UnitContract[] = [
  {
    id: 'M05',
    pairId: 'm05',
    slug: 'synchronization-scopes',
    titles: {
      zh: 'M05：同步作用域与内存可见性',
      en: 'M05: Synchronization scopes and memory visibility',
    },
    exerciseTitles: {
      zh: 'M05 练习：按作用域选择同步',
      en: 'M05 Exercises: Select synchronization by scope',
    },
    solutionTitles: {
      zh: 'M05 参考解答：按作用域选择同步',
      en: 'M05 Reviewed Solutions: Select synchronization by scope',
    },
    prerequisites: ['F02', 'M01'],
    relatedUnits: [],
    structure: [
      'outcome',
      'prerequisites',
      'scope-ledger',
      'rendezvous',
      'ordering-visibility',
      'atomicity',
      'barriers-fences',
      'selection',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/writing-cuda-kernels.html',
      'https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html',
      'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/cuda-cpp-memory-model.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#memory-fence-functions',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html#memory-fence-functions',
    ],
    practiceId: 'PB-R1-017',
    visualRoutes: [],
    chineseFirstUses: [
      '同步作用域（synchronization scope）',
      '内存可见性（memory visibility）',
      '参与者（participant）',
      '通信作用域（communication scope）',
      '会合（rendezvous）',
      '顺序（ordering）',
      '原子性（atomicity）',
      '屏障（barrier）',
      '内存栅栏（memory fence）',
    ],
    teachingTerms: [
      'warp',
      'block',
      'device',
      'system',
      'rendezvous',
      'ordering',
      'visibility',
      'atomicity',
      'barrier',
      'memory fence',
    ],
  },
  {
    id: 'M06',
    pairId: 'm06',
    slug: 'warp-divergence-reconvergence',
    titles: {
      zh: 'M06：分支发散、重汇合与线程束安全推理',
      en: 'M06: Divergence, reconvergence, and warp-safe reasoning',
    },
    exerciseTitles: {
      zh: 'M06 练习：用显式线程束掩码推理',
      en: 'M06 Exercises: Reason with explicit warp masks',
    },
    solutionTitles: {
      zh: 'M06 参考解答：用显式线程束掩码推理',
      en: 'M06 Reviewed Solutions: Reason with explicit warp masks',
    },
    prerequisites: ['F02', 'M05'],
    relatedUnits: ['VIS03'],
    structure: [
      'outcome',
      'prerequisites',
      'active-masks',
      'divergence',
      'reconvergence',
      'independent-thread-scheduling',
      'unsafe-lockstep',
      'source-join',
      'schedule-boundary',
      'visual-model',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/01-introduction/programming-model.html',
      'https://docs.nvidia.com/cuda/cuda-programming-guide/03-advanced/advanced-kernel-programming.html',
      'https://docs.nvidia.com/cuda/cuda-programming-guide/05-appendices/device-callable-apis.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#simt-architecture',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html#simt-architecture',
    ],
    practiceId: 'PB-R1-018',
    visualRoutes: ['visuals/warp-divergence/'],
    chineseFirstUses: [
      '分支发散（warp divergence）',
      '重汇合（reconvergence）',
      '线程束安全推理（warp-safe reasoning）',
      '活动掩码（active mask）',
      '参与掩码（participation mask）',
      '独立线程调度（Independent Thread Scheduling）',
      '隐式锁步（implicit lockstep）',
      '源代码级汇合点（source-level join）',
    ],
    teachingTerms: [
      'mask',
      'active lanes',
      'warp divergence',
      'reconvergence',
      'Independent Thread Scheduling',
      'CC 7.0+',
      'implicit lockstep',
      'source-level join',
      'not synchronization',
      'exact hardware schedule is unknown',
    ],
  },
  {
    id: 'M07',
    pairId: 'm07',
    slug: 'stream-ordering',
    titles: {
      zh: 'M07：用流取代全局顺序心智模型',
      en: 'M07: Streams replace a global-order mental model',
    },
    exerciseTitles: {
      zh: 'M07 练习：绘制显式流顺序图',
      en: 'M07 Exercises: Draw explicit stream-order graphs',
    },
    solutionTitles: {
      zh: 'M07 参考解答：绘制显式流顺序图',
      en: 'M07 Reviewed Solutions: Draw explicit stream-order graphs',
    },
    prerequisites: ['F05', 'M01'],
    relatedUnits: ['M08', 'VIS07'],
    structure: [
      'outcome',
      'prerequisites',
      'named-streams',
      'per-stream-order',
      'cross-stream-order',
      'eligibility',
      'default-stream',
      'dependency-ledger',
      'visual-model',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3,13.3.1',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html',
      'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__STREAM.html',
      'https://docs.nvidia.com/cuda/cuda-runtime-api/stream-sync-behavior.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#streams',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-runtime-api/group__CUDART__STREAM.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-runtime-api/stream-sync-behavior.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html#streams',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-runtime-api/group__CUDART__STREAM.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-runtime-api/stream-sync-behavior.html',
    ],
    practiceId: 'PB-R1-019',
    visualRoutes: ['visuals/stream-event-dependencies/'],
    chineseFirstUses: [
      '流（stream）',
      '全局顺序心智模型（global-order mental model）',
      '非默认流（non-default stream）',
      '流内顺序（per-stream order）',
      '跨流顺序（cross-stream order）',
      '执行资格（execution eligibility）',
      '观测重叠（observed overlap）',
      '默认流（default stream）',
    ],
    teachingTerms: [
      'non-default streams',
      'per-stream order',
      'different streams are unordered',
      'eligibility is not observed overlap',
      'default-stream behavior',
      'version- and configuration-dependent',
      'cudaStreamCreate',
      'cudaStreamNonBlocking',
    ],
  },
  {
    id: 'M08',
    pairId: 'm08',
    slug: 'event-dependencies-timing',
    titles: {
      zh: 'M08：用事件表达依赖并测量设备时间',
      en: 'M08: Events as dependencies and device-time measurements',
    },
    exerciseTitles: {
      zh: 'M08 练习：跟踪事件依赖与计时',
      en: 'M08 Exercises: Trace event dependencies and timing',
    },
    solutionTitles: {
      zh: 'M08 参考解答：跟踪事件依赖与计时',
      en: 'M08 Reviewed Solutions: Trace event dependencies and timing',
    },
    prerequisites: ['M07'],
    relatedUnits: ['VIS07'],
    structure: [
      'outcome',
      'prerequisites',
      'event-record',
      'stream-wait',
      'query-synchronize',
      're-record',
      'timing-disabled',
      'elapsed-time',
      'dependency-ledger',
      'visual-model',
      'evidence-boundary',
      'retrieval',
      'practice',
      'sources',
    ],
    sourceVersions: '11.8.0,12.9.1,13.3,13.3.1',
    sourceUrls: [
      'https://docs.nvidia.com/cuda/cuda-programming-guide/02-basics/asynchronous-execution.html',
      'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__EVENT.html',
      'https://docs.nvidia.com/cuda/cuda-runtime-api/group__CUDART__STREAM.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-c-programming-guide/index.html#events',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-runtime-api/group__CUDART__EVENT.html',
      'https://docs.nvidia.com/cuda/archive/11.8.0/cuda-runtime-api/group__CUDART__STREAM.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-c-programming-guide/index.html#events',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-runtime-api/group__CUDART__EVENT.html',
      'https://docs.nvidia.com/cuda/archive/12.9.1/cuda-runtime-api/group__CUDART__STREAM.html',
    ],
    practiceId: 'PB-R1-020',
    visualRoutes: ['visuals/stream-event-dependencies/'],
    chineseFirstUses: [
      '事件（event）',
      '依赖边（dependency edge）',
      '记录（record）',
      '等待（wait）',
      '查询（query）',
      '同步等待（synchronize）',
      '重新记录（re-record）',
      '禁用计时事件（timing-disabled event）',
      '设备时间测量（device-time measurement）',
      '经过时间（elapsed time）',
    ],
    teachingTerms: [
      'cudaEventRecord',
      'cudaStreamWaitEvent',
      'cudaEventQuery',
      'cudaEventSynchronize',
      'cudaEventElapsedTime',
      're-record',
      'most recently captured state at the time of the API call',
      'timing-disabled events',
      'cudaEventDisableTiming',
      'device-time measurement',
      'elapsed_ms = timestamp(stop) - timestamp(start)',
      'no measured duration',
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

async function readSource(
  localePrefix: '' | 'en/',
  slug: string,
  child?: 'exercises' | 'solutions',
) {
  const relativePath = child
    ? `${localePrefix}memory/${slug}/${child}.md`
    : `${localePrefix}memory/${slug}.mdx`;
  return readFile(path.join(docsRoot, relativePath), 'utf8');
}

async function readRoute(route: string) {
  const relativePath = `${route.replace(/^\//, '')}index.html`;
  return parseHTML(await readFile(path.join(projectRoot, 'dist', relativePath), 'utf8')).document;
}

function parseFrontmatter(source: string) {
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
  if (new RegExp(`^${field}: \[\]$`, 'm').test(metadata)) return [];
  const match = new RegExp(`^${field}:\n((?:  - .+\n?)+)`, 'm').exec(metadata);
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
  return [...metadata.matchAll(/^\s+url: '([^']+)'\n\s+version: '([^']+)'\n\s+platform: '[^']+'\n\s+accessDate: '([^']+)'/gm)]
    .map(([, url, version, accessDate]) => ({ url, version, accessDate }));
}

function metadata(document: Document, name: string) {
  return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
}

function assertEmptyEvidence(metadataSource: string) {
  expect(metadataSource).toMatch(
    /evidence:\n  compilation: \[\]\n  runtime: \[\]\n  expectedObservations: \[\]\n  recordedObservations: \[\]/,
  );
  expect(metadataSource).not.toMatch(/^canonicalExample:|^exampleIds:|^canonicalRanges:/m);
}

function assertHeadProjection(
  metadataSource: string,
  expected: {
    pairId: string;
    structure: readonly string[];
    resourceKind: string;
    unitId: string;
    prerequisites: readonly string[];
    relatedUnits: readonly string[];
    sourceCount?: number;
    sourceVersions?: string;
  },
) {
  const values = new Map<string, string>([
    ['cuda:pair-id', expected.pairId],
    ['cuda:fact-check-date', reviewDate],
    ['cuda:license', 'CC-BY-4.0'],
    ['cuda:structure', expected.structure.join(',')],
    ['cuda:resource-kind', expected.resourceKind],
    ['cuda:unit-id', expected.unitId],
    ['cuda:prerequisites', expected.prerequisites.join(',') || 'none'],
    ['cuda:related-units', expected.relatedUnits.join(',') || 'none'],
    ['cuda:hardware-gate', 'none'],
    ['cuda:evidence-compilation', 'none'],
    ['cuda:evidence-runtime', 'none'],
    ['cuda:recorded-observations', 'none'],
  ]);
  if (expected.sourceCount !== undefined) values.set('cuda:source-count', String(expected.sourceCount));
  if (expected.sourceVersions !== undefined) values.set('cuda:source-versions', expected.sourceVersions);

  for (const [name, value] of values) {
    expect(projectedMetadata(metadataSource, name), name).toBe(value);
  }
}

function assertRenderedHead(
  document: Document,
  expected: {
    pairId: string;
    structure: readonly string[];
    resourceKind: string;
    unitId: string;
    prerequisites: readonly string[];
    relatedUnits: readonly string[];
    sourceCount?: number;
    sourceVersions?: string;
  },
) {
  expect(metadata(document, 'cuda:pair-id')).toBe(expected.pairId);
  expect(metadata(document, 'cuda:fact-check-date')).toBe(reviewDate);
  expect(metadata(document, 'cuda:license')).toBe('CC-BY-4.0');
  expect(metadata(document, 'cuda:structure')).toBe(expected.structure.join(','));
  expect(metadata(document, 'cuda:resource-kind')).toBe(expected.resourceKind);
  expect(metadata(document, 'cuda:unit-id')).toBe(expected.unitId);
  expect(metadata(document, 'cuda:prerequisites')).toBe(expected.prerequisites.join(',') || 'none');
  expect(metadata(document, 'cuda:related-units')).toBe(expected.relatedUnits.join(',') || 'none');
  expect(metadata(document, 'cuda:hardware-gate')).toBe('none');
  expect(metadata(document, 'cuda:evidence-compilation')).toBe('none');
  expect(metadata(document, 'cuda:evidence-runtime')).toBe('none');
  expect(metadata(document, 'cuda:recorded-observations')).toBe('none');
  if (expected.sourceCount !== undefined) {
    expect(metadata(document, 'cuda:source-count')).toBe(String(expected.sourceCount));
  }
  if (expected.sourceVersions !== undefined) {
    expect(metadata(document, 'cuda:source-versions')).toBe(expected.sourceVersions);
  }
}

function numberedQuestions(source: string, english: boolean) {
  const heading = english ? 'Retrieval check' : '离开前检查';
  const match = new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm').exec(source);
  expect(match, heading).not.toBeNull();
  return match?.[1].match(/^\d+\. /gm) ?? [];
}

describe('M05-M08 source and built-route publication contracts', () => {
  for (const unit of units) {
    it(`publishes ${unit.id} as a complete bilingual Learning Unit with static practice`, async () => {
      for (const localePrefix of ['', 'en/'] as const) {
        const english = localePrefix === 'en/';
        const locale = english ? 'en' : 'zh';
        const counterpart = english
          ? `/memory/${unit.slug}/`
          : `/en/memory/${unit.slug}/`;
        const route = `/${localePrefix}memory/${unit.slug}/`;
        const source = await readSource(localePrefix, unit.slug);
        const frontmatter = parseFrontmatter(source);

        expect(yamlScalar(frontmatter, 'title')).toBe(unit.titles[locale]);
        expect(yamlScalar(frontmatter, 'pairId')).toBe(unit.pairId);
        expect(yamlScalar(frontmatter, 'counterpart')).toBe(counterpart);
        expect(yamlScalar(frontmatter, 'factCheckDate')).toBe(reviewDate);
        expect(yamlScalar(frontmatter, 'license')).toBe('CC-BY-4.0');
        expect(yamlScalar(frontmatter, 'provenance')).toBe('original');
        expect(yamlScalar(frontmatter, 'resourceKind')).toBe('learning-unit');
        expect(yamlScalar(frontmatter, 'unitId')).toBe(unit.id);
        expect(yamlScalar(frontmatter, 'hardwareGate')).toBe('none');
        expect(yamlList(frontmatter, 'structure')).toEqual(unit.structure);
        expect(yamlList(frontmatter, 'prerequisites')).toEqual(unit.prerequisites);
        expect(yamlList(frontmatter, 'relatedUnits')).toEqual(unit.relatedUnits);
        expect(unit.structure.slice(-3)).toEqual(['retrieval', 'practice', 'sources']);
        assertEmptyEvidence(frontmatter);
        assertHeadProjection(frontmatter, {
          pairId: unit.pairId,
          structure: unit.structure,
          resourceKind: 'learning-unit',
          unitId: unit.id,
          prerequisites: unit.prerequisites,
          relatedUnits: unit.relatedUnits,
          sourceCount: unit.sourceUrls.length,
          sourceVersions: unit.sourceVersions,
        });

        expect(body(source)).toMatch(new RegExp(`^<a class="locale-pair" data-locale-counterpart href="${counterpart}"`));
        expect(numberedQuestions(source, english)).toHaveLength(5);
        expect(source).toContain(`/${localePrefix}memory/${unit.slug}/exercises/`);
        expect(source).toContain(`/${localePrefix}memory/${unit.slug}/solutions/`);
        expect(source).toContain(unit.practiceId);
        for (const prerequisite of unit.prerequisites) expect(source).toContain(`[${prerequisite}`);
        for (const visualRoute of unit.visualRoutes) expect(source).toContain(`/${localePrefix}${visualRoute}`);
        for (const term of unit.teachingTerms) {
          expect(source.toLowerCase(), `${localePrefix}${unit.id} ${term}`).toContain(term.toLowerCase());
        }

        const coordinates = sourceCoordinates(frontmatter);
        expect(coordinates.map(({ url }) => url)).toEqual(unit.sourceUrls);
        expect(coordinates.map(({ accessDate }) => accessDate)).toEqual(
          unit.sourceUrls.map(() => reviewDate),
        );
        for (const url of unit.sourceUrls) expect(source).toContain(`](${url})`);
        expect(source).toMatch(/original composition|原创编排/);
        expect(source).toMatch(/No owner-documentation example or figure is copied|没有复制 owner documentation 的 example 或 figure/);
        expect(source).toMatch(/\*\*(?:Fact checked: |事实核查日期：)2026-08-28[。.]\*\*/);

        const document = await readRoute(route);
        expect(document.documentElement.lang).toBe(english ? 'en' : 'zh-CN');
        expect(document.querySelector('main h1')?.textContent?.trim()).toBe(unit.titles[locale]);
        expect(document.querySelector(`[data-locale-counterpart][href="${counterpart}"]`)).not.toBeNull();
        assertRenderedHead(document, {
          pairId: unit.pairId,
          structure: unit.structure,
          resourceKind: 'learning-unit',
          unitId: unit.id,
          prerequisites: unit.prerequisites,
          relatedUnits: unit.relatedUnits,
          sourceCount: unit.sourceUrls.length,
          sourceVersions: unit.sourceVersions,
        });
        for (const url of unit.sourceUrls) {
          expect(document.querySelector(`main a[href="${url}"]`), `${route} ${url}`).not.toBeNull();
        }

        for (const child of ['exercises', 'solutions'] as const) {
          const childSource = await readSource(localePrefix, unit.slug, child);
          const childFrontmatter = parseFrontmatter(childSource);
          const exercises = child === 'exercises';
          const structure = exercises ? exerciseStructure : solutionStructure;
          const pairId = `${unit.pairId}-${child}`;
          const unitId = `${unit.id}-${exercises ? 'EXERCISES' : 'SOLUTIONS'}`;
          const prerequisites = [exercises ? unit.id : `${unit.id}-EXERCISES`];
          const resourceKind = exercises ? 'exercise-set' : 'solution-set';
          const childCounterpart = english
            ? `/memory/${unit.slug}/${child}/`
            : `/en/memory/${unit.slug}/${child}/`;
          const childRoute = `/${localePrefix}memory/${unit.slug}/${child}/`;

          expect(yamlScalar(childFrontmatter, 'title')).toBe(
            (exercises ? unit.exerciseTitles : unit.solutionTitles)[locale],
          );
          expect(yamlScalar(childFrontmatter, 'pairId')).toBe(pairId);
          expect(yamlScalar(childFrontmatter, 'counterpart')).toBe(childCounterpart);
          expect(yamlScalar(childFrontmatter, 'factCheckDate')).toBe(reviewDate);
          expect(yamlScalar(childFrontmatter, 'license')).toBe('CC-BY-4.0');
          expect(yamlScalar(childFrontmatter, 'provenance')).toBe('original');
          expect(yamlScalar(childFrontmatter, 'resourceKind')).toBe(resourceKind);
          expect(yamlScalar(childFrontmatter, 'unitId')).toBe(unitId);
          expect(yamlList(childFrontmatter, 'structure')).toEqual(structure);
          expect(yamlList(childFrontmatter, 'prerequisites')).toEqual(prerequisites);
          assertEmptyEvidence(childFrontmatter);
          assertHeadProjection(childFrontmatter, {
            pairId,
            structure,
            resourceKind,
            unitId,
            prerequisites,
            relatedUnits: [unit.id, ...unit.relatedUnits],
          });
          expect(body(childSource)).toMatch(
            new RegExp(`^<a class="locale-pair" data-locale-counterpart href="${childCounterpart}"`),
          );

          const childDocument = await readRoute(childRoute);
          expect(childDocument.querySelector('main h1')?.textContent?.trim()).toBe(
            (exercises ? unit.exerciseTitles : unit.solutionTitles)[locale],
          );
          expect(childDocument.querySelector(`[data-locale-counterpart][href="${childCounterpart}"]`)).not.toBeNull();
          assertRenderedHead(childDocument, {
            pairId,
            structure,
            resourceKind,
            unitId,
            prerequisites,
            relatedUnits: [unit.id, ...unit.relatedUnits],
          });

          if (exercises) {
            const tasks = [...childSource.matchAll(/^## (?:练习|Exercise) [1-3][^\n]*\n([\s\S]*?)(?=^## |\Z)/gm)];
            expect(tasks, `${localePrefix}${unit.id}`).toHaveLength(3);
            const labels = english
              ? ['**Goal:**', '**Constraints:**', '**Expected evidence:**', '**Acceptance criteria:**', '<summary>Hint 1</summary>', '<summary>Hint 2</summary>']
              : ['**目标：**', '**约束：**', '**预期证据：**', '**验收条件：**', '<summary>提示 1</summary>', '<summary>提示 2</summary>'];
            for (const [, task] of tasks) {
              for (const label of labels) expect(task).toContain(label);
              expect(task).not.toMatch(/Reviewed solution|参考解答|^Solution|^解答/m);
            }
          } else {
            expect(childSource.match(/^## (?:解答|Solution) [1-3]/gm)).toHaveLength(3);
            expect(childSource).toMatch(/^## (?:有效替代方案|Valid alternatives)$/m);
            expect(childSource).toMatch(/^## (?:常见错误|Common errors)$/m);
            expect(childSource).toMatch(/(?:Reviewed:|复核日期：)\s*\*\*2026-08-28\*\*/);
          }
        }

        if (!english) {
          for (const firstUse of unit.chineseFirstUses) expect(source, firstUse).toContain(firstUse);
        }
      }
    });
  }

  it('keeps every owner-source coordinate aligned across each Publication Pair', async () => {
    for (const unit of units) {
      const [chinese, english] = await Promise.all([
        readSource('', unit.slug),
        readSource('en/', unit.slug),
      ]);
      expect(sourceCoordinates(parseFrontmatter(chinese)), unit.id).toEqual(
        sourceCoordinates(parseFrontmatter(english)),
      );
    }
  });
});

describe('M05-M08 evidence boundaries', () => {
  it('publishes no canonical EX07, hardware exercise, fabricated timing, or overlap result', async () => {
    for (const unit of units) {
      for (const localePrefix of ['', 'en/'] as const) {
        const pages = await Promise.all([
          readSource(localePrefix, unit.slug),
          readSource(localePrefix, unit.slug, 'exercises'),
          readSource(localePrefix, unit.slug, 'solutions'),
        ]);
        const combined = pages.join('\n');
        expect(combined).not.toMatch(
          /\bEX07\b|\bLAB\d+\b|resourceKind:\s*lab|canonicalExample|cuda:canonical-example|\/(?:en\/)?labs\//i,
        );
        expect(combined).not.toMatch(/Runtime-Verified|Compile-Checked/);
        expect(combined).not.toMatch(/\b\d+(?:\.\d+)?\s*(?:ms|milliseconds?)\b/i);
        expect(combined).not.toMatch(
          /\b(?:we|this (?:unit|page|exercise)) (?:observed|demonstrates?|proves?) overlap\b|overlap (?:was|is) observed|(?:已|曾)?观察到(?:了)?重叠/i,
        );
      }
    }
  });
});
